import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { logAudit, sendNotification } from '../utils/helpers.js';

// Helper: Format date as YYYY-MM-DD in local time
const getTodayDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Clock In for today
// @route   POST /api/attendance/clock-in
// @access  Private (All employees)
export const clockIn = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDateString();
    const now = new Date();

    // Check if already clocked in today
    const existing = await Attendance.findOne({ employeeId, date: today });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already clocked in for today.',
        data: existing,
      });
    }

    // Configurable late arrival check: 9:30 AM
    const lateThreshold = new Date(now);
    lateThreshold.setHours(9, 30, 0, 0);
    const isLate = now > lateThreshold;

    const attendance = await Attendance.create({
      employeeId,
      date: today,
      clockIn: now,
      status: isLate ? 'LATE' : 'PRESENT',
      isLate,
      ipAddress: req.ip || '',
    });

    await logAudit({
      actorId: employeeId,
      action: 'CLOCK_IN',
      entityType: 'ATTENDANCE',
      entityId: attendance._id,
      newValues: { date: today, clockIn: now, isLate },
      req,
    });

    res.status(201).json({
      success: true,
      message: isLate
        ? `Clocked in successfully at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Marked as Late)`
        : `Clocked in successfully at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      data: attendance,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A clock-in record for today already exists.',
      });
    }
    next(err);
  }
};

// @desc    Clock Out for today
// @route   POST /api/attendance/clock-out
// @access  Private (All employees)
export const clockOut = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDateString();
    const now = new Date();

    const attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'Cannot clock out: No clock-in record found for today.',
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already clocked out for today.',
        data: attendance,
      });
    }

    const clockInTime = new Date(attendance.clockIn).getTime();
    const clockOutTime = now.getTime();
    const workingMinutes = Math.max(0, Math.round((clockOutTime - clockInTime) / (1000 * 60)));

    attendance.clockOut = now;
    attendance.totalWorkingMinutes = workingMinutes;

    // If working hours < 4 hours (240 mins), mark as HALF_DAY
    if (workingMinutes < 240 && attendance.status !== 'LATE') {
      attendance.status = 'HALF_DAY';
    }

    await attendance.save();

    await logAudit({
      actorId: employeeId,
      action: 'CLOCK_OUT',
      entityType: 'ATTENDANCE',
      entityId: attendance._id,
      newValues: { date: today, clockOut: now, totalWorkingMinutes: workingMinutes },
      req,
    });

    const hours = (workingMinutes / 60).toFixed(1);

    res.status(200).json({
      success: true,
      message: `Clocked out successfully. Total logged: ${hours} hours.`,
      data: attendance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current employee's attendance & today status
// @route   GET /api/attendance/me
// @access  Private
export const getMyAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDateString();

    const [todayRecord, recentRecords] = await Promise.all([
      Attendance.findOne({ employeeId, date: today }),
      Attendance.find({ employeeId }).sort({ date: -1 }).limit(31),
    ]);

    // Calculate monthly summary
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyRecords = recentRecords.filter((r) => r.date.startsWith(currentMonthPrefix));

    const totalWorkingMinutes = monthlyRecords.reduce((acc, curr) => acc + (curr.totalWorkingMinutes || 0), 0);
    const presentDays = monthlyRecords.filter((r) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.status)).length;
    const lateDays = monthlyRecords.filter((r) => r.isLate).length;

    res.status(200).json({
      success: true,
      data: {
        today: todayRecord,
        records: recentRecords,
        summary: {
          presentDays,
          lateDays,
          totalWorkingMinutes,
          totalWorkingHours: (totalWorkingMinutes / 60).toFixed(1),
          averageDailyHours: presentDays > 0 ? (totalWorkingMinutes / (presentDays * 60)).toFixed(1) : '0.0',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get organization attendance (HR)
// @route   GET /api/attendance
// @access  Private (HR)
export const getAllAttendance = async (req, res, next) => {
  try {
    const { date, startDate, endDate, department, employeeId, status, page = 1, limit = 25 } = req.query;

    const query = {};

    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    // If department filter is supplied, find matching employee IDs
    if (department) {
      const deptEmployees = await User.find({ department }).select('_id');
      const deptEmpIds = deptEmployees.map((e) => e._id);
      query.employeeId = { $in: deptEmpIds };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, records] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.find(query)
        .populate({
          path: 'employeeId',
          select: 'name email employeeId department jobTitle',
          populate: { path: 'department', select: 'name code' },
        })
        .sort({ date: -1, clockIn: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get team attendance for Manager
// @route   GET /api/attendance/team
// @access  Private (MANAGER, HR)
export const getTeamAttendance = async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;
    const queryDate = date || getTodayDateString();

    // Find team members reporting to this manager
    const teamMembers = await User.find({
      $or: [{ managerId: req.user._id }, { _id: req.user._id }],
      employmentStatus: { $ne: 'TERMINATED' },
    }).populate('department', 'name code');

    const memberIds = teamMembers.map((m) => m._id);

    const query = { employeeId: { $in: memberIds } };
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      query.date = queryDate;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'name email employeeId jobTitle department')
      .sort({ clockIn: -1 });

    // Build comprehensive roster including absent members
    const roster = teamMembers.map((member) => {
      const record = attendanceRecords.find(
        (r) => r.employeeId && r.employeeId._id.toString() === member._id.toString()
      );
      return {
        member: {
          _id: member._id,
          name: member.name,
          email: member.email,
          employeeId: member.employeeId,
          jobTitle: member.jobTitle,
          department: member.department,
        },
        attendance: record || null,
        status: record ? record.status : 'ABSENT',
      };
    });

    const presentCount = roster.filter((r) => r.status !== 'ABSENT').length;
    const absentCount = roster.filter((r) => r.status === 'ABSENT').length;

    res.status(200).json({
      success: true,
      data: {
        date: queryDate,
        totalTeam: teamMembers.length,
        presentCount,
        absentCount,
        roster,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get overall attendance summary statistics
// @route   GET /api/attendance/summary
// @access  Private (HR, MANAGER)
export const getAttendanceSummary = async (req, res, next) => {
  try {
    const today = getTodayDateString();

    const [totalActiveEmployees, todayRecords] = await Promise.all([
      User.countDocuments({ employmentStatus: 'ACTIVE' }),
      Attendance.find({ date: today }),
    ]);

    const presentCount = todayRecords.filter((r) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.status)).length;
    const lateCount = todayRecords.filter((r) => r.isLate).length;
    const absentCount = Math.max(0, totalActiveEmployees - presentCount);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        totalActiveEmployees,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: totalActiveEmployees > 0 ? ((presentCount / totalActiveEmployees) * 100).toFixed(1) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Manual correction of attendance (HR only)
// @route   PATCH /api/attendance/:id/correction
// @access  Private (HR)
export const correctAttendance = async (req, res, next) => {
  try {
    const { clockIn, clockOut, status, correctionReason } = req.body;

    if (!correctionReason) {
      return res.status(400).json({
        success: false,
        message: 'A reason for manual attendance correction is required.',
      });
    }

    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const previousValues = {
      clockIn: record.clockIn,
      clockOut: record.clockOut,
      status: record.status,
      totalWorkingMinutes: record.totalWorkingMinutes,
    };

    if (clockIn) record.clockIn = new Date(clockIn);
    if (clockOut) record.clockOut = new Date(clockOut);
    if (status) record.status = status;

    if (record.clockIn && record.clockOut) {
      const minutes = Math.round((new Date(record.clockOut).getTime() - new Date(record.clockIn).getTime()) / (1000 * 60));
      record.totalWorkingMinutes = Math.max(0, minutes);
    }

    record.isManualCorrection = true;
    record.correctionReason = correctionReason;
    record.correctedBy = req.user._id;

    await record.save();

    await logAudit({
      actorId: req.user._id,
      action: 'ATTENDANCE_MANUAL_CORRECTION',
      entityType: 'ATTENDANCE',
      entityId: record._id,
      previousValues,
      newValues: { clockIn: record.clockIn, clockOut: record.clockOut, status: record.status, correctionReason },
      req,
    });

    await sendNotification({
      recipientId: record.employeeId,
      title: 'Attendance Record Updated',
      message: `HR (${req.user.name}) corrected your attendance record for ${record.date}. Reason: ${correctionReason}`,
      type: 'ATTENDANCE',
      relatedEntityId: record._id,
    });

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully with audit trail.',
      data: record,
    });
  } catch (err) {
    next(err);
  }
};
