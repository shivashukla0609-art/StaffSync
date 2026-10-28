import User from '../models/User.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Training from '../models/Training.js';
import TrainingEnrollment from '../models/TrainingEnrollment.js';

// Helper: Format date as YYYY-MM-DD
const formatDate = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// @desc    Dashboard overview statistics & aggregated charts
// @route   GET /api/reports/dashboard
// @access  Private (HR, MANAGER)
export const getDashboardReports = async (req, res, next) => {
  try {
    const today = formatDate(new Date());

    // 1. Headcount & basic metrics
    const [
      totalEmployees,
      activeEmployees,
      totalManagers,
      totalDepartments,
      todayAttendance,
      pendingLeaves,
      approvedLeavesThisMonth,
      upcomingTrainings,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['EMPLOYEE', 'MANAGER'] } }),
      User.countDocuments({ employmentStatus: 'ACTIVE' }),
      User.countDocuments({ role: 'MANAGER' }),
      Department.countDocuments({ status: 'ACTIVE' }),
      Attendance.find({ date: today }),
      Leave.countDocuments({ status: 'Pending' }),
      Leave.countDocuments({
        status: 'Approved',
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      Training.countDocuments({ status: 'Upcoming' }),
    ]);

    const presentToday = todayAttendance.filter((a) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)).length;
    const absentToday = Math.max(0, activeEmployees - presentToday);
    const lateToday = todayAttendance.filter((a) => a.isLate).length;

    // 2. Department distribution
    const departments = await Department.find({ status: 'ACTIVE' }).select('name');
    const departmentDistribution = await Promise.all(
      departments.map(async (dept) => {
        const count = await User.countDocuments({
          department: dept._id,
          employmentStatus: { $ne: 'TERMINATED' },
        });
        return {
          name: dept.name,
          count,
        };
      })
    );

    // 3. Attendance trends over last 7 days
    const attendanceTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayRecords = await Attendance.find({ date: dateStr });
      const present = dayRecords.filter((r) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.status)).length;
      const late = dayRecords.filter((r) => r.isLate).length;
      const absent = Math.max(0, activeEmployees - present);

      attendanceTrends.push({
        date: dateStr,
        day: dayName,
        present,
        absent,
        late,
      });
    }

    // 4. Leave requests distribution by status
    const [pendingCount, approvedCount, rejectedCount, cancelledCount] = await Promise.all([
      Leave.countDocuments({ status: 'Pending' }),
      Leave.countDocuments({ status: 'Approved' }),
      Leave.countDocuments({ status: 'Rejected' }),
      Leave.countDocuments({ status: 'Cancelled' }),
    ]);

    const leaveStatusDistribution = [
      { name: 'Approved', count: approvedCount, color: '#10B981' },
      { name: 'Pending', count: pendingCount, color: '#F59E0B' },
      { name: 'Rejected', count: rejectedCount, color: '#EF4444' },
      { name: 'Cancelled', count: cancelledCount, color: '#6B7280' },
    ];

    // 5. Training enrollment vs completion
    const [totalEnrollments, completedEnrollments, inProgressEnrollments] = await Promise.all([
      TrainingEnrollment.countDocuments({ enrollmentStatus: 'Enrolled' }),
      TrainingEnrollment.countDocuments({ completionStatus: 'Completed' }),
      TrainingEnrollment.countDocuments({ completionStatus: { $in: ['Pending', 'In Progress'] } }),
    ]);

    const trainingStats = {
      totalPrograms: await Training.countDocuments(),
      totalEnrollments,
      completedEnrollments,
      inProgressEnrollments,
      completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          totalManagers,
          totalDepartments,
          presentToday,
          absentToday,
          lateToday,
          pendingLeaves,
          approvedLeavesThisMonth,
          upcomingTrainings,
        },
        departmentDistribution,
        attendanceTrends,
        leaveStatusDistribution,
        trainingStats,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Exportable Attendance Report
// @route   GET /api/reports/attendance
// @access  Private (HR, MANAGER)
export const getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(query)
      .populate('employeeId', 'name email employeeId jobTitle')
      .sort({ date: -1 });

    if (format === 'csv') {
      let csv = 'Employee ID,Name,Email,Date,Clock In,Clock Out,Total Hours,Status,Late\n';
      records.forEach((r) => {
        const emp = r.employeeId || {};
        const hours = (r.totalWorkingMinutes / 60).toFixed(1);
        const clockIn = r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '';
        const clockOut = r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '';
        csv += `"${emp.employeeId || ''}","${emp.name || ''}","${emp.email || ''}","${r.date}","${clockIn}","${clockOut}","${hours}","${r.status}","${r.isLate ? 'Yes' : 'No'}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
      return res.status(200).send(csv);
    }

    res.status(200).json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

// @desc    Exportable Leaves Report
// @route   GET /api/reports/leaves
// @access  Private (HR, MANAGER)
export const getLeavesReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const leaves = await Leave.find()
      .populate('employeeId', 'name email employeeId department jobTitle')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      let csv = 'Employee ID,Name,Leave Type,Start Date,End Date,Days,Reason,Status,Reviewed By,Review Comment\n';
      leaves.forEach((l) => {
        const emp = l.employeeId || {};
        const reviewer = l.reviewedBy || {};
        csv += `"${emp.employeeId || ''}","${emp.name || ''}","${l.leaveType}","${formatDate(l.startDate)}","${formatDate(l.endDate)}","${l.numberOfDays}","${l.reason.replace(/"/g, '""')}","${l.status}","${reviewer.name || ''}","${(l.reviewComment || '').replace(/"/g, '""')}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leaves_report.csv"');
      return res.status(200).send(csv);
    }

    res.status(200).json({ success: true, data: leaves });
  } catch (err) {
    next(err);
  }
};

// @desc    Exportable Employees Report
// @route   GET /api/reports/employees
// @access  Private (HR)
export const getEmployeesReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const employees = await User.find()
      .populate('department', 'name code')
      .populate('managerId', 'name email')
      .sort({ employeeId: 1 });

    if (format === 'csv') {
      let csv = 'Employee ID,Name,Email,Role,Job Title,Department,Manager,Status,Phone,Joining Date\n';
      employees.forEach((e) => {
        const dept = e.department ? e.department.name : '';
        const mgr = e.managerId ? e.managerId.name : '';
        csv += `"${e.employeeId || ''}","${e.name || ''}","${e.email || ''}","${e.role}","${e.jobTitle || ''}","${dept}","${mgr}","${e.employmentStatus}","${e.phone || ''}","${formatDate(e.joiningDate)}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employees_report.csv"');
      return res.status(200).send(csv);
    }

    res.status(200).json({ success: true, data: employees });
  } catch (err) {
    next(err);
  }
};
