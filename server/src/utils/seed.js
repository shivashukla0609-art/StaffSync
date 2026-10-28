import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Announcement from '../models/Announcement.js';
import Training from '../models/Training.js';
import TrainingEnrollment from '../models/TrainingEnrollment.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Cleaning existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Attendance.deleteMany({}),
      Leave.deleteMany({}),
      Announcement.deleteMany({}),
      Training.deleteMany({}),
      TrainingEnrollment.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] Creating departments...');
    const departmentsData = [
      { name: 'Engineering & Technology', code: 'ENG', description: 'Software engineering, cloud infrastructure, and product QA', location: 'Floor 4, Tech Wing' },
      { name: 'Human Resources', code: 'HR', description: 'Talent acquisition, employee welfare, and company policies', location: 'Floor 2, People Wing' },
      { name: 'Marketing & Growth', code: 'MKT', description: 'Brand marketing, content creation, and digital growth', location: 'Floor 3, Creative Hub' },
      { name: 'Finance & Accounting', code: 'FIN', description: 'Corporate budgeting, payroll, and fiscal reporting', location: 'Floor 2, Finance Wing' },
      { name: 'Product & Design', code: 'PRD', description: 'User experience research, UI design, and product strategy', location: 'Floor 3, Creative Hub' },
    ];

    const departments = await Department.insertMany(departmentsData);
    const deptMap = {};
    departments.forEach((d) => {
      deptMap[d.code] = d._id;
    });

    console.log('[Seed] Hashing passwords for demo accounts...');
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const managerPasswordHash = await bcrypt.hash('Manager@123', salt);
    const employeePasswordHash = await bcrypt.hash('Employee@123', salt);

    console.log('[Seed] Creating HR Admin and Managers...');
    // 1. HR Administrator
    const hrAdmin = await User.create({
      name: 'Eleanor Vance',
      email: 'hr@staffsync.com',
      passwordHash: adminPasswordHash,
      role: 'HR',
      employeeId: 'HR-0001',
      department: deptMap['HR'],
      jobTitle: 'Chief Human Resources Officer',
      phone: '+1 (555) 101-2001',
      address: '742 Evergreen Terrace, Springfield',
      employmentStatus: 'ACTIVE',
      joiningDate: new Date('2022-01-15'),
      salary: 125000,
    });

    // 2. Engineering Manager
    const managerSarah = await User.create({
      name: 'Sarah Chen',
      email: 'manager.sarah@staffsync.com',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
      employeeId: 'MGR-0101',
      department: deptMap['ENG'],
      jobTitle: 'Director of Engineering',
      phone: '+1 (555) 202-3001',
      address: '456 Innovation Way, Silicon Valley',
      employmentStatus: 'ACTIVE',
      joiningDate: new Date('2022-03-01'),
      salary: 140000,
    });

    // 3. Marketing Manager
    const managerDavid = await User.create({
      name: 'David Rodriguez',
      email: 'manager.david@staffsync.com',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
      employeeId: 'MGR-0102',
      department: deptMap['MKT'],
      jobTitle: 'Head of Marketing',
      phone: '+1 (555) 202-3002',
      address: '789 Market Street, San Francisco',
      employmentStatus: 'ACTIVE',
      joiningDate: new Date('2022-06-15'),
      salary: 118000,
    });

    // Update departments with their respective managers
    await Department.findByIdAndUpdate(deptMap['ENG'], { managerId: managerSarah._id });
    await Department.findByIdAndUpdate(deptMap['MKT'], { managerId: managerDavid._id });
    await Department.findByIdAndUpdate(deptMap['HR'], { managerId: hrAdmin._id });

    console.log('[Seed] Creating 10+ employees...');
    const employeesData = [
      {
        name: 'John Doe',
        email: 'john.doe@staffsync.com',
        employeeId: 'EMP-1001',
        department: deptMap['ENG'],
        managerId: managerSarah._id,
        jobTitle: 'Senior Full Stack Engineer',
        phone: '+1 (555) 303-4001',
        address: '101 Dev Lane, Austin, TX',
        joiningDate: new Date('2023-01-10'),
        salary: 98000,
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@staffsync.com',
        employeeId: 'EMP-1002',
        department: deptMap['ENG'],
        managerId: managerSarah._id,
        jobTitle: 'Frontend Engineer',
        phone: '+1 (555) 303-4002',
        address: '102 React Blvd, Seattle, WA',
        joiningDate: new Date('2023-02-15'),
        salary: 86000,
      },
      {
        name: 'Alex Jones',
        email: 'alex.jones@staffsync.com',
        employeeId: 'EMP-1003',
        department: deptMap['ENG'],
        managerId: managerSarah._id,
        jobTitle: 'DevOps & Cloud Specialist',
        phone: '+1 (555) 303-4003',
        address: '103 Kubernetes Way, Portland, OR',
        joiningDate: new Date('2023-04-01'),
        salary: 94000,
      },
      {
        name: 'Emily Watson',
        email: 'emily.watson@staffsync.com',
        employeeId: 'EMP-1004',
        department: deptMap['MKT'],
        managerId: managerDavid._id,
        jobTitle: 'Content Strategist',
        phone: '+1 (555) 303-4004',
        address: '201 Story Avenue, New York, NY',
        joiningDate: new Date('2023-05-12'),
        salary: 72000,
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@staffsync.com',
        employeeId: 'EMP-1005',
        department: deptMap['MKT'],
        managerId: managerDavid._id,
        jobTitle: 'Digital Campaign Manager',
        phone: '+1 (555) 303-4005',
        address: '202 Growth Plaza, Chicago, IL',
        joiningDate: new Date('2023-07-20'),
        salary: 76000,
      },
      {
        name: 'Sophia Martinez',
        email: 'sophia.martinez@staffsync.com',
        employeeId: 'EMP-1006',
        department: deptMap['PRD'],
        managerId: managerSarah._id,
        jobTitle: 'Senior UX/UI Designer',
        phone: '+1 (555) 303-4006',
        address: '301 Figma Street, Denver, CO',
        joiningDate: new Date('2023-08-01'),
        salary: 89000,
      },
      {
        name: 'Liam Taylor',
        email: 'liam.taylor@staffsync.com',
        employeeId: 'EMP-1007',
        department: deptMap['FIN'],
        managerId: hrAdmin._id,
        jobTitle: 'Financial Analyst',
        phone: '+1 (555) 303-4007',
        address: '401 Ledger Circle, Charlotte, NC',
        joiningDate: new Date('2023-09-15'),
        salary: 82000,
      },
      {
        name: 'Olivia Wilson',
        email: 'olivia.wilson@staffsync.com',
        employeeId: 'EMP-1008',
        department: deptMap['HR'],
        managerId: hrAdmin._id,
        jobTitle: 'HR Operations Specialist',
        phone: '+1 (555) 303-4008',
        address: '501 People Way, Boston, MA',
        joiningDate: new Date('2023-10-01'),
        salary: 68000,
      },
      {
        name: 'Daniel Kim',
        email: 'daniel.kim@staffsync.com',
        employeeId: 'EMP-1009',
        department: deptMap['ENG'],
        managerId: managerSarah._id,
        jobTitle: 'QA Automation Engineer',
        phone: '+1 (555) 303-4009',
        address: '104 Cypress Park, Atlanta, GA',
        joiningDate: new Date('2023-11-10'),
        salary: 79000,
      },
      {
        name: 'Ava Patel',
        email: 'ava.patel@staffsync.com',
        employeeId: 'EMP-1010',
        department: deptMap['PRD'],
        managerId: managerSarah._id,
        jobTitle: 'Associate Product Manager',
        phone: '+1 (555) 303-4010',
        address: '302 Agile Court, Salt Lake City, UT',
        joiningDate: new Date('2024-01-05'),
        salary: 81000,
      },
      {
        name: 'Marcus Bell',
        email: 'marcus.bell@staffsync.com',
        employeeId: 'EMP-1011',
        department: deptMap['FIN'],
        managerId: hrAdmin._id,
        jobTitle: 'Payroll Administrator',
        phone: '+1 (555) 303-4011',
        address: '402 Tax Lane, Dallas, TX',
        joiningDate: new Date('2024-02-01'),
        salary: 65000,
      },
    ];

    const insertedEmployees = await Promise.all(
      employeesData.map((emp) =>
        User.create({
          ...emp,
          passwordHash: employeePasswordHash,
          role: 'EMPLOYEE',
          employmentStatus: 'ACTIVE',
        })
      )
    );

    const allUsers = [hrAdmin, managerSarah, managerDavid, ...insertedEmployees];
    console.log(`[Seed] Seeded ${allUsers.length} total users.`);

    console.log('[Seed] Generating historical & today attendance records...');
    const now = new Date();
    const attendanceToInsert = [];

    // Helper: format YYYY-MM-DD
    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Past 7 workdays
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (isWeekend) continue;

      const dateStr = formatYMD(d);

      allUsers.forEach((user, index) => {
        // Leave 2 employees absent occasionally for realistic metrics
        if (i > 0 && (index === 3 || index === 8)) return;

        const clockInHour = index % 3 === 0 ? 9 : 8;
        const clockInMin = index % 4 === 0 ? 35 : 50; // Some are late
        const isLate = clockInHour > 9 || (clockInHour === 9 && clockInMin > 30);

        const clockIn = new Date(d);
        clockIn.setHours(clockInHour, clockInMin, 0);

        let clockOut = null;
        let totalMinutes = 0;

        // If not today or if past 5 PM today, provide clockOut
        if (i > 0 || now.getHours() >= 17) {
          clockOut = new Date(d);
          clockOut.setHours(17, 30 + (index % 25), 0);
          totalMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / (1000 * 60));
        }

        attendanceToInsert.push({
          employeeId: user._id,
          date: dateStr,
          clockIn,
          clockOut,
          totalWorkingMinutes: totalMinutes,
          status: isLate ? 'LATE' : 'PRESENT',
          isLate,
        });
      });
    }

    await Attendance.insertMany(attendanceToInsert);
    console.log(`[Seed] Seeded ${attendanceToInsert.length} attendance records.`);

    console.log('[Seed] Creating leave requests...');
    const leavesData = [
      {
        employeeId: insertedEmployees[0]._id, // John Doe
        leaveType: 'Earned Leave',
        startDate: new Date(new Date().setDate(now.getDate() + 5)),
        endDate: new Date(new Date().setDate(now.getDate() + 7)),
        numberOfDays: 3,
        reason: 'Attending family wedding ceremony and travel.',
        status: 'Pending',
      },
      {
        employeeId: insertedEmployees[1]._id, // Jane Smith
        leaveType: 'Sick Leave',
        startDate: new Date(new Date().setDate(now.getDate() - 3)),
        endDate: new Date(new Date().setDate(now.getDate() - 2)),
        numberOfDays: 2,
        reason: 'Seasonal viral flu and rest as advised by physician.',
        status: 'Approved',
        reviewedBy: managerSarah._id,
        reviewComment: 'Approved. Hope you feel better soon!',
        reviewedAt: new Date(new Date().setDate(now.getDate() - 3)),
      },
      {
        employeeId: insertedEmployees[2]._id, // Alex Jones
        leaveType: 'Casual Leave',
        startDate: new Date(new Date().setDate(now.getDate() - 10)),
        endDate: new Date(new Date().setDate(now.getDate() - 9)),
        numberOfDays: 2,
        reason: 'Personal relocation and utility setup.',
        status: 'Approved',
        reviewedBy: managerSarah._id,
        reviewComment: 'Approved. Ensure standby cover is arranged.',
        reviewedAt: new Date(new Date().setDate(now.getDate() - 11)),
      },
      {
        employeeId: insertedEmployees[3]._id, // Emily Watson
        leaveType: 'Casual Leave',
        startDate: new Date(new Date().setDate(now.getDate() + 2)),
        endDate: new Date(new Date().setDate(now.getDate() + 3)),
        numberOfDays: 2,
        reason: 'Urgent home maintenance and personal appointments.',
        status: 'Pending',
      },
      {
        employeeId: insertedEmployees[4]._id, // Michael Brown
        leaveType: 'Earned Leave',
        startDate: new Date(new Date().setDate(now.getDate() - 15)),
        endDate: new Date(new Date().setDate(now.getDate() - 13)),
        numberOfDays: 3,
        reason: 'Weekend getaway extended trip.',
        status: 'Rejected',
        reviewedBy: managerDavid._id,
        reviewComment: 'Denied due to critical campaign launch timeline that week.',
        reviewedAt: new Date(new Date().setDate(now.getDate() - 16)),
      },
    ];

    await Leave.insertMany(leavesData);
    console.log(`[Seed] Seeded ${leavesData.length} leave requests.`);

    console.log('[Seed] Creating company announcements...');
    const announcementsData = [
      {
        title: 'Welcome to the New StaffSync HRMS Platform!',
        description: 'We are thrilled to roll out StaffSync company-wide. Please explore your dashboard, verify your personal details, and track attendance seamlessly.',
        category: 'General',
        priority: 'HIGH',
        createdBy: hrAdmin._id,
        publishedAt: new Date(new Date().setDate(now.getDate() - 5)),
        status: 'Published',
      },
      {
        title: 'Annual Performance & Growth Review Cycle 2026',
        description: 'The mid-year career development and self-assessment cycle begins next month. Managers will schedule individual check-ins over the coming weeks.',
        category: 'HR Policy',
        priority: 'HIGH',
        createdBy: hrAdmin._id,
        publishedAt: new Date(new Date().setDate(now.getDate() - 3)),
        status: 'Published',
      },
      {
        title: 'Upcoming National Public Holiday Notice',
        description: 'StaffSync offices will be closed on the upcoming Monday for the national holiday. Standard on-call support rotations apply for tier-1 engineers.',
        category: 'Holidays',
        priority: 'MEDIUM',
        createdBy: hrAdmin._id,
        publishedAt: new Date(new Date().setDate(now.getDate() - 1)),
        status: 'Published',
      },
      {
        title: 'Quarterly Town Hall & Hackathon Showcase',
        description: 'Join us in the auditorium and online Zoom stream this Friday at 3:00 PM for the executive address, project spotlights, and social mixers.',
        category: 'Events',
        priority: 'MEDIUM',
        createdBy: hrAdmin._id,
        publishedAt: new Date(),
        status: 'Published',
      },
    ];

    await Announcement.insertMany(announcementsData);
    console.log(`[Seed] Seeded ${announcementsData.length} company announcements.`);

    console.log('[Seed] Creating training programs & enrollments...');
    const trainingsData = [
      {
        title: 'Advanced React Architecture & Micro-frontends',
        description: 'Comprehensive hands-on workshop covering Vite, state management patterns, React 18 concurrent rendering, and performant web architecture.',
        trainer: 'Dr. Katherine Wood (Senior Architect)',
        startDate: new Date(new Date().setDate(now.getDate() + 7)),
        endDate: new Date(new Date().setDate(now.getDate() + 9)),
        capacity: 15,
        departmentId: deptMap['ENG'],
        createdBy: managerSarah._id,
        location: 'Zoom Classroom A & Slack #training-react',
        status: 'Upcoming',
      },
      {
        title: 'Modern Product Analytics & Data-Driven Growth',
        description: 'Learn how to leverage analytics frameworks, funnel metrics, retention cohorts, and user event instrumentation for product success.',
        trainer: 'Marcus Sterling (Head of Analytics)',
        startDate: new Date(new Date().setDate(now.getDate() + 14)),
        endDate: new Date(new Date().setDate(now.getDate() + 16)),
        capacity: 20,
        departmentId: deptMap['MKT'],
        createdBy: managerDavid._id,
        location: 'Innovation Lab 201',
        status: 'Upcoming',
      },
      {
        title: 'Workplace Ergonomics & Mental Well-being in Tech',
        description: 'Interactive session on cultivating healthy work habits, desk ergonomics, stress management techniques, and optimal work-life balance.',
        trainer: 'Clara Oswald (Wellness Consultant)',
        startDate: new Date(new Date().setDate(now.getDate() - 14)),
        endDate: new Date(new Date().setDate(now.getDate() - 13)),
        capacity: 30,
        createdBy: hrAdmin._id,
        location: 'Town Hall & Zoom Webcast',
        status: 'Completed',
      },
    ];

    const insertedTrainings = await Training.insertMany(trainingsData);

    const enrollmentsData = [
      {
        trainingId: insertedTrainings[0]._id, // React Architecture
        employeeId: insertedEmployees[0]._id, // John Doe
        enrollmentStatus: 'Enrolled',
        completionStatus: 'Pending',
      },
      {
        trainingId: insertedTrainings[0]._id,
        employeeId: insertedEmployees[1]._id, // Jane Smith
        enrollmentStatus: 'Enrolled',
        completionStatus: 'Pending',
      },
      {
        trainingId: insertedTrainings[1]._id, // Product Analytics
        employeeId: insertedEmployees[3]._id, // Emily Watson
        enrollmentStatus: 'Enrolled',
        completionStatus: 'Pending',
      },
      {
        trainingId: insertedTrainings[2]._id, // Wellness (Completed)
        employeeId: insertedEmployees[0]._id, // John Doe
        enrollmentStatus: 'Enrolled',
        completionStatus: 'Completed',
        completedAt: new Date(new Date().setDate(now.getDate() - 13)),
        feedback: 'Super insightful session on posture and screen breaks.',
      },
      {
        trainingId: insertedTrainings[2]._id,
        employeeId: insertedEmployees[2]._id, // Alex Jones
        enrollmentStatus: 'Enrolled',
        completionStatus: 'Completed',
        completedAt: new Date(new Date().setDate(now.getDate() - 13)),
        feedback: 'Practical recommendations that helped with work posture.',
      },
    ];

    await TrainingEnrollment.insertMany(enrollmentsData);
    console.log(`[Seed] Seeded ${insertedTrainings.length} trainings and ${enrollmentsData.length} enrollments.`);

    console.log('[Seed] Creating demo notifications...');
    const notificationsData = [
      {
        recipientId: insertedEmployees[0]._id, // John Doe
        title: 'Training Reminder',
        message: 'You are enrolled in "Advanced React Architecture & Micro-frontends" starting soon.',
        type: 'TRAINING',
        isRead: false,
      },
      {
        recipientId: insertedEmployees[0]._id, // John Doe
        title: 'New Announcement Published',
        message: 'Welcome to the New StaffSync HRMS Platform! Check out company updates.',
        type: 'ANNOUNCEMENT',
        isRead: true,
      },
      {
        recipientId: managerSarah._id,
        title: 'New Leave Request from John Doe',
        message: 'John Doe has requested 3 days of Earned Leave.',
        type: 'LEAVE',
        isRead: false,
      },
      {
        recipientId: hrAdmin._id,
        title: 'New Employee Registered',
        message: 'Marcus Bell has joined Finance & Accounting.',
        type: 'SYSTEM',
        isRead: false,
      },
    ];

    await Notification.insertMany(notificationsData);
    console.log(`[Seed] Seeded ${notificationsData.length} notifications.`);

    console.log('====================================================');
    console.log(' StaffSync Database Seeded Successfully!');
    console.log('====================================================');
    console.log(' DEMO CREDENTIALS:');
    console.log(' 1. HR Administrator:');
    console.log('    Email:    hr@staffsync.com');
    console.log('    Password: Admin@123');
    console.log(' 2. Manager (Engineering):');
    console.log('    Email:    manager.sarah@staffsync.com');
    console.log('    Password: Manager@123');
    console.log(' 3. Manager (Marketing):');
    console.log('    Email:    manager.david@staffsync.com');
    console.log('    Password: Manager@123');
    console.log(' 4. Employee (Senior Engineer):');
    console.log('    Email:    john.doe@staffsync.com');
    console.log('    Password: Employee@123');
    console.log(' 5. Employee (Frontend Engineer):');
    console.log('    Email:    jane.smith@staffsync.com');
    console.log('    Password: Employee@123');
    console.log('====================================================');

    await closeDB();
    console.log('[Seed] Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
