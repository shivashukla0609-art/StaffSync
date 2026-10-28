import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import { seedDatabase } from './utils/seed.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is currently empty (e.g. fresh memory server or fresh DB)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Seeding initial demo accounts and departments...');
      // Run seed directly without process.exit
      const runInlineSeed = async () => {
        const { default: bcrypt } = await import('bcryptjs');
        const { default: Department } = await import('./models/Department.js');
        const { default: Attendance } = await import('./models/Attendance.js');
        const { default: Leave } = await import('./models/Leave.js');
        const { default: Announcement } = await import('./models/Announcement.js');
        const { default: Training } = await import('./models/Training.js');
        const { default: TrainingEnrollment } = await import('./models/TrainingEnrollment.js');
        const { default: Notification } = await import('./models/Notification.js');

        const departmentsData = [
          { name: 'Engineering & Technology', code: 'ENG', description: 'Software engineering & QA', location: 'Floor 4, Tech Wing' },
          { name: 'Human Resources', code: 'HR', description: 'Talent & welfare', location: 'Floor 2, People Wing' },
          { name: 'Marketing & Growth', code: 'MKT', description: 'Brand marketing & digital growth', location: 'Floor 3, Creative Hub' },
          { name: 'Finance & Accounting', code: 'FIN', description: 'Budgeting & payroll', location: 'Floor 2, Finance Wing' },
          { name: 'Product & Design', code: 'PRD', description: 'UX research & strategy', location: 'Floor 3, Creative Hub' },
        ];
        const depts = await Department.insertMany(departmentsData);
        const deptMap = {};
        depts.forEach(d => { deptMap[d.code] = d._id; });

        const salt = await bcrypt.genSalt(10);
        const adminPw = await bcrypt.hash('Admin@123', salt);
        const mgrPw = await bcrypt.hash('Manager@123', salt);
        const empPw = await bcrypt.hash('Employee@123', salt);

        const hrAdmin = await User.create({
          name: 'Eleanor Vance',
          email: 'hr@staffsync.com',
          passwordHash: adminPw,
          role: 'HR',
          employeeId: 'HR-0001',
          department: deptMap['HR'],
          jobTitle: 'Chief Human Resources Officer',
          phone: '+1 (555) 101-2001',
          employmentStatus: 'ACTIVE',
        });

        const mgrSarah = await User.create({
          name: 'Sarah Chen',
          email: 'manager.sarah@staffsync.com',
          passwordHash: mgrPw,
          role: 'MANAGER',
          employeeId: 'MGR-0101',
          department: deptMap['ENG'],
          jobTitle: 'Director of Engineering',
          phone: '+1 (555) 202-3001',
          employmentStatus: 'ACTIVE',
        });

        const mgrDavid = await User.create({
          name: 'David Rodriguez',
          email: 'manager.david@staffsync.com',
          passwordHash: mgrPw,
          role: 'MANAGER',
          employeeId: 'MGR-0102',
          department: deptMap['MKT'],
          jobTitle: 'Head of Marketing',
          phone: '+1 (555) 202-3002',
          employmentStatus: 'ACTIVE',
        });

        await Department.findByIdAndUpdate(deptMap['ENG'], { managerId: mgrSarah._id });
        await Department.findByIdAndUpdate(deptMap['MKT'], { managerId: mgrDavid._id });
        await Department.findByIdAndUpdate(deptMap['HR'], { managerId: hrAdmin._id });

        const emps = await User.insertMany([
          { name: 'John Doe', email: 'john.doe@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1001', department: deptMap['ENG'], managerId: mgrSarah._id, jobTitle: 'Senior Full Stack Engineer', phone: '+1 (555) 303-4001', employmentStatus: 'ACTIVE' },
          { name: 'Jane Smith', email: 'jane.smith@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1002', department: deptMap['ENG'], managerId: mgrSarah._id, jobTitle: 'Frontend Engineer', phone: '+1 (555) 303-4002', employmentStatus: 'ACTIVE' },
          { name: 'Alex Jones', email: 'alex.jones@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1003', department: deptMap['ENG'], managerId: mgrSarah._id, jobTitle: 'DevOps & Cloud Specialist', phone: '+1 (555) 303-4003', employmentStatus: 'ACTIVE' },
          { name: 'Emily Watson', email: 'emily.watson@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1004', department: deptMap['MKT'], managerId: mgrDavid._id, jobTitle: 'Content Strategist', phone: '+1 (555) 303-4004', employmentStatus: 'ACTIVE' },
          { name: 'Michael Brown', email: 'michael.brown@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1005', department: deptMap['MKT'], managerId: mgrDavid._id, jobTitle: 'Digital Campaign Manager', phone: '+1 (555) 303-4005', employmentStatus: 'ACTIVE' },
          { name: 'Sophia Martinez', email: 'sophia.martinez@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1006', department: deptMap['PRD'], managerId: mgrSarah._id, jobTitle: 'Senior UX/UI Designer', phone: '+1 (555) 303-4006', employmentStatus: 'ACTIVE' },
          { name: 'Liam Taylor', email: 'liam.taylor@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1007', department: deptMap['FIN'], managerId: hrAdmin._id, jobTitle: 'Financial Analyst', phone: '+1 (555) 303-4007', employmentStatus: 'ACTIVE' },
          { name: 'Olivia Wilson', email: 'olivia.wilson@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1008', department: deptMap['HR'], managerId: hrAdmin._id, jobTitle: 'HR Operations Specialist', phone: '+1 (555) 303-4008', employmentStatus: 'ACTIVE' },
          { name: 'Daniel Kim', email: 'daniel.kim@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1009', department: deptMap['ENG'], managerId: mgrSarah._id, jobTitle: 'QA Automation Engineer', phone: '+1 (555) 303-4009', employmentStatus: 'ACTIVE' },
          { name: 'Ava Patel', email: 'ava.patel@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1010', department: deptMap['PRD'], managerId: mgrSarah._id, jobTitle: 'Associate Product Manager', phone: '+1 (555) 303-4010', employmentStatus: 'ACTIVE' },
          { name: 'Marcus Bell', email: 'marcus.bell@staffsync.com', passwordHash: empPw, role: 'EMPLOYEE', employeeId: 'EMP-1011', department: deptMap['FIN'], managerId: hrAdmin._id, jobTitle: 'Payroll Administrator', phone: '+1 (555) 303-4011', employmentStatus: 'ACTIVE' },
        ]);

        const allUsers = [hrAdmin, mgrSarah, mgrDavid, ...emps];
        const now = new Date();
        const attList = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          if (d.getDay() === 0 || d.getDay() === 6) continue;
          const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          allUsers.forEach((u, idx) => {
            if (i > 0 && (idx === 3 || idx === 8)) return;
            const inHour = idx % 3 === 0 ? 9 : 8;
            const inMin = idx % 4 === 0 ? 35 : 50;
            const isLate = inHour > 9 || (inHour === 9 && inMin > 30);
            const cin = new Date(d);
            cin.setHours(inHour, inMin, 0);
            const cout = new Date(d);
            cout.setHours(17, 30, 0);
            attList.push({
              employeeId: u._id,
              date: ymd,
              clockIn: cin,
              clockOut: i > 0 ? cout : null,
              totalWorkingMinutes: i > 0 ? Math.round((cout - cin) / 60000) : 0,
              status: isLate ? 'LATE' : 'PRESENT',
              isLate,
            });
          });
        }
        await Attendance.insertMany(attList);

        await Leave.insertMany([
          { employeeId: emps[0]._id, leaveType: 'Earned Leave', startDate: new Date(Date.now() + 5 * 86400000), endDate: new Date(Date.now() + 7 * 86400000), numberOfDays: 3, reason: 'Family wedding event', status: 'Pending' },
          { employeeId: emps[1]._id, leaveType: 'Sick Leave', startDate: new Date(Date.now() - 3 * 86400000), endDate: new Date(Date.now() - 2 * 86400000), numberOfDays: 2, reason: 'Seasonal viral flu', status: 'Approved', reviewedBy: mgrSarah._id, reviewComment: 'Approved. Get well soon!' },
          { employeeId: emps[2]._id, leaveType: 'Casual Leave', startDate: new Date(Date.now() - 8 * 86400000), endDate: new Date(Date.now() - 7 * 86400000), numberOfDays: 2, reason: 'Personal relocation', status: 'Approved', reviewedBy: mgrSarah._id, reviewComment: 'Approved.' },
        ]);

        await Announcement.insertMany([
          { title: 'Welcome to StaffSync Modern HRMS!', description: 'Explore your real-time attendance, leave requests, and training dashboard.', category: 'General', priority: 'HIGH', createdBy: hrAdmin._id, publishedAt: new Date() },
          { title: 'Annual Performance Review 2026', description: 'Mid-year reviews commence next month with assigned managers.', category: 'HR Policy', priority: 'HIGH', createdBy: hrAdmin._id, publishedAt: new Date() },
          { title: 'National Public Holiday Notice', description: 'Offices will be closed on the upcoming Monday for the national holiday.', category: 'Holidays', priority: 'MEDIUM', createdBy: hrAdmin._id, publishedAt: new Date() },
        ]);

        const trs = await Training.insertMany([
          { title: 'Advanced React Architecture', description: 'Workshop covering state management, performance, and clean components.', trainer: 'Dr. Katherine Wood', startDate: new Date(Date.now() + 7 * 86400000), endDate: new Date(Date.now() + 9 * 86400000), capacity: 20, createdBy: mgrSarah._id, departmentId: deptMap['ENG'] },
          { title: 'Modern Product Analytics', description: 'Cohort retention and funnel metric analysis.', trainer: 'Marcus Sterling', startDate: new Date(Date.now() + 14 * 86400000), endDate: new Date(Date.now() + 16 * 86400000), capacity: 25, createdBy: mgrDavid._id, departmentId: deptMap['MKT'] },
        ]);

        await TrainingEnrollment.insertMany([
          { trainingId: trs[0]._id, employeeId: emps[0]._id, enrollmentStatus: 'Enrolled', completionStatus: 'Pending' },
          { trainingId: trs[0]._id, employeeId: emps[1]._id, enrollmentStatus: 'Enrolled', completionStatus: 'Pending' },
        ]);

        await Notification.insertMany([
          { recipientId: emps[0]._id, title: 'Training Reminder', message: 'You are enrolled in "Advanced React Architecture" starting soon.', type: 'TRAINING' },
          { recipientId: mgrSarah._id, title: 'New Leave Request', message: 'John Doe applied for 3 days of Earned Leave.', type: 'LEAVE' },
          { recipientId: hrAdmin._id, title: 'System Online', message: 'StaffSync database synchronized with all operational departments.', type: 'SYSTEM' },
        ]);

        console.log('[Server] Initial sample data seeded successfully!');
      };

      await runInlineSeed();
    }

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` StaffSync HRMS Server Running on Port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });

    const shutdown = () => {
      console.log('\nShutting down server gracefully...');
      server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
