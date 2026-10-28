import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Training from '../models/Training.js';
import TrainingEnrollment from '../models/TrainingEnrollment.js';

describe('StaffSync HRMS API Tests', () => {
  let hrToken = '';
  let managerToken = '';
  let employeeToken = '';
  let hrUser = null;
  let managerUser = null;
  let employeeUser = null;
  let engineeringDept = null;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clean test DB
    await User.deleteMany({});
    await Department.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Training.deleteMany({});
    await TrainingEnrollment.deleteMany({});

    // 1. Create a Department
    engineeringDept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      description: 'Tech department',
    });
  });

  after(async () => {
    await closeDB();
  });

  describe('1. Health Check', () => {
    test('GET /api/health should return 200 online', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'online');
    });
  });

  describe('2. Authentication & Authorization', () => {
    test('POST /api/auth/register should create employee account and enforce EMPLOYEE role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Employee',
          email: 'test.employee@staffsync.com',
          password: 'Password@123',
          department: engineeringDept._id.toString(),
          role: 'HR', // Attempt privilege escalation
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.role, 'EMPLOYEE', 'Privilege escalation must be blocked');
      employeeToken = res.body.token;
      employeeUser = res.body.user;
    });

    test('POST /api/auth/register should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test.employee@staffsync.com',
          password: 'Password@123',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    test('POST /api/auth/login should authenticate valid employee', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.employee@staffsync.com',
          password: 'Password@123',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.employee@staffsync.com',
          password: 'WrongPassword',
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    test('GET /api/auth/me with Bearer token returns authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.email, 'test.employee@staffsync.com');
    });

    test('GET /api/auth/me without token returns 401 unauthorized', async () => {
      const res = await request(app).get('/api/auth/me');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('3. Role Provisions & Scoping', () => {
    test('Create HR and Manager accounts for testing', async () => {
      // HR Admin
      const hrRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'HR Lead',
          email: 'hr.test@staffsync.com',
          password: 'Password@123',
        });
      // Direct DB role elevation for testing
      await User.findByIdAndUpdate(hrRes.body.user._id, { role: 'HR' });
      const loginHr = await request(app)
        .post('/api/auth/login')
        .send({ email: 'hr.test@staffsync.com', password: 'Password@123' });
      hrToken = loginHr.body.token;
      hrUser = loginHr.body.user;

      // Manager
      const mgrRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Manager Lead',
          email: 'manager.test@staffsync.com',
          password: 'Password@123',
          department: engineeringDept._id.toString(),
        });
      await User.findByIdAndUpdate(mgrRes.body.user._id, { role: 'MANAGER' });
      const loginMgr = await request(app)
        .post('/api/auth/login')
        .send({ email: 'manager.test@staffsync.com', password: 'Password@123' });
      managerToken = loginMgr.body.token;
      managerUser = loginMgr.body.user;

      // Assign employee to this manager
      await User.findByIdAndUpdate(employeeUser._id, { managerId: managerUser._id });
    });

    test('Non-HR employee cannot access HR-only routes (e.g. GET /api/attendance)', async () => {
      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 403);
    });

    test('HR can create a new employee via POST /api/employees', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Second Employee',
          email: 'emp2@staffsync.com',
          role: 'EMPLOYEE',
          department: engineeringDept._id.toString(),
          jobTitle: 'Frontend Dev',
          managerId: managerUser._id.toString(),
          salary: 75000,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.employeeId);
    });
  });

  describe('4. Attendance Workflow', () => {
    test('Employee can clock in successfully for today', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.clockIn);
    });

    test('Employee cannot clock in twice on the same day', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.message.includes('already clocked in'));
    });

    test('Employee can clock out successfully', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-out')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.clockOut);
    });

    test('Employee cannot clock out twice', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-out')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.message.includes('already clocked out'));
    });

    test('Employee can inspect their attendance record', async () => {
      const res = await request(app)
        .get('/api/attendance/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.today);
      assert.ok(['HALF_DAY', 'LATE', 'PRESENT'].includes(res.body.data.today.status));
    });
  });

  describe('5. Leave Workflow', () => {
    let leaveId = '';

    test('Reject leave request with end date prior to start date', async () => {
      const res = await request(app)
        .post('/api/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveType: 'Casual Leave',
          startDate: '2026-11-10',
          endDate: '2026-11-05',
          reason: 'Invalid dates test',
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.message.includes('End date cannot be earlier'));
    });

    test('Submit valid leave request', async () => {
      const res = await request(app)
        .post('/api/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveType: 'Casual Leave',
          startDate: '2026-11-10',
          endDate: '2026-11-12',
          reason: 'Doctor appointment and personal rest.',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.status, 'Pending');
      leaveId = res.body.data._id;
    });

    test('Reject overlapping leave request', async () => {
      const res = await request(app)
        .post('/api/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveType: 'Sick Leave',
          startDate: '2026-11-11',
          endDate: '2026-11-13',
          reason: 'Overlapping request test',
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.message.includes('overlapping'));
    });

    test('Employee cannot approve their own leave request', async () => {
      const res = await request(app)
        .patch(`/api/leaves/${leaveId}/approve`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ comment: 'Self approval attempt' });

      assert.strictEqual(res.status, 403);
    });

    test('Manager can approve leave request with review comment', async () => {
      const res = await request(app)
        .patch(`/api/leaves/${leaveId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ comment: 'Approved by engineering manager' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'Approved');
      assert.strictEqual(res.body.data.reviewComment, 'Approved by engineering manager');
    });
  });

  describe('6. Training Workflow', () => {
    let trainingId = '';

    test('Manager can create training program', async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Full Stack Node Performance',
          description: 'Hands-on backend workshop',
          trainer: 'Senior Architect',
          startDate: '2026-12-01',
          endDate: '2026-12-03',
          capacity: 10,
        });

      assert.strictEqual(res.status, 201);
      trainingId = res.body.data._id;
    });

    test('Employee can self-enroll in training program', async () => {
      const res = await request(app)
        .post(`/api/trainings/${trainingId}/enroll`)
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.enrollmentStatus, 'Enrolled');
    });

    test('Prevent duplicate enrollment for the same employee', async () => {
      const res = await request(app)
        .post(`/api/trainings/${trainingId}/enroll`)
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.message.includes('already enrolled'));
    });
  });

  describe('7. Announcements & Notifications', () => {
    test('HR can create and publish announcements', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          title: 'Office Holiday Schedule',
          description: 'Offices will be closed next Monday.',
          category: 'Holidays',
          priority: 'MEDIUM',
          status: 'Published',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.title, 'Office Holiday Schedule');
    });

    test('Employees can read announcements and view notifications', async () => {
      const annRes = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(annRes.status, 200);
      assert.ok(annRes.body.data.length >= 1);

      const notifRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeToken}`);

      assert.strictEqual(notifRes.status, 200);
      assert.ok(Array.isArray(notifRes.body.data));
    });
  });
});
