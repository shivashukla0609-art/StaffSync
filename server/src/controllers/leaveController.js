import Leave from '../models/Leave.js';
import User from '../models/User.js';
import { logAudit, sendNotification } from '../utils/helpers.js';

// Helper: Calculate working days between two dates
const calculateDays = (start, end) => {
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private (All employees)
export const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;
    const employeeId = req.user._id;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.',
      });
    }

    const calculatedDays = numberOfDays || calculateDays(start, end);

    // Check for overlapping active leaves (Pending or Approved)
    const overlapping = await Leave.findOne({
      employeeId,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: `You already have an active leave request (${overlapping.status}) overlapping these dates.`,
      });
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      numberOfDays: calculatedDays,
      reason,
      status: 'Pending',
    });

    await logAudit({
      actorId: employeeId,
      action: 'LEAVE_REQUESTED',
      entityType: 'LEAVE',
      entityId: leave._id,
      newValues: { leaveType, startDate: start, endDate: end, numberOfDays: calculatedDays },
      req,
    });

    // Notify assigned manager or HR
    const employee = await User.findById(employeeId).populate('managerId');
    if (employee.managerId) {
      await sendNotification({
        recipientId: employee.managerId._id,
        title: 'New Leave Request Submitted',
        message: `${employee.name} applied for ${calculatedDays} day(s) of ${leaveType}.`,
        type: 'LEAVE',
        relatedEntityId: leave._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully.',
      data: leave,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's leaves
// @route   GET /api/leaves/me
// @access  Private
export const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ employeeId: req.user._id })
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    // Compute leave stats
    const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
    const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
    const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;
    const totalDaysTaken = leaves
      .filter((l) => l.status === 'Approved')
      .reduce((acc, curr) => acc + curr.numberOfDays, 0);

    res.status(200).json({
      success: true,
      data: leaves,
      stats: {
        approvedCount,
        pendingCount,
        rejectedCount,
        totalDaysTaken,
        totalLeavesAllowance: 24, // Standard annual allowance
        remainingAllowance: Math.max(0, 24 - totalDaysTaken),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all leave requests (Scoped: HR sees all, Manager sees team)
// @route   GET /api/leaves
// @access  Private (HR, MANAGER)
export const getAllLeaves = async (req, res, next) => {
  try {
    const { status, leaveType, employeeId, page = 1, limit = 25 } = req.query;

    const query = {};

    if (req.user.role === 'MANAGER') {
      // Find team members reporting to this manager
      const team = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = team.map((t) => t._id);
      query.employeeId = { $in: teamIds };
    }

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (employeeId) query.employeeId = employeeId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, leaves] = await Promise.all([
      Leave.countDocuments(query),
      Leave.find(query)
        .populate({
          path: 'employeeId',
          select: 'name email employeeId department jobTitle',
          populate: { path: 'department', select: 'name code' },
        })
        .populate('reviewedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data: leaves,
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

// @desc    Get leave by ID
// @route   GET /api/leaves/:id
// @access  Private
export const getLeaveById = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'name email employeeId department jobTitle managerId')
      .populate('reviewedBy', 'name email role');

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    // Authorization check
    if (
      req.user.role === 'EMPLOYEE' &&
      leave.employeeId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this leave' });
    }

    if (
      req.user.role === 'MANAGER' &&
      leave.employeeId._id.toString() !== req.user._id.toString() &&
      (!leave.employeeId.managerId || leave.employeeId.managerId.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this team leave' });
    }

    res.status(200).json({
      success: true,
      data: leave,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve leave request
// @route   PATCH /api/leaves/:id/approve
// @access  Private (HR, MANAGER)
export const approveLeave = async (req, res, next) => {
  try {
    const { comment = 'Approved' } = req.body;
    const leave = await Leave.findById(req.params.id).populate('employeeId');

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve: Leave request is already ${leave.status}.`,
      });
    }

    // Prevent approving own leave
    if (leave.employeeId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot approve your own leave request.',
      });
    }

    // If Manager, ensure employee reports to them
    if (req.user.role === 'MANAGER') {
      if (
        !leave.employeeId.managerId ||
        leave.employeeId.managerId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only approve leave requests for your assigned team members.',
        });
      }
    }

    leave.status = 'Approved';
    leave.reviewedBy = req.user._id;
    leave.reviewComment = comment;
    leave.reviewedAt = new Date();
    await leave.save();

    await logAudit({
      actorId: req.user._id,
      action: 'LEAVE_APPROVED',
      entityType: 'LEAVE',
      entityId: leave._id,
      newValues: { status: 'Approved', comment },
      req,
    });

    await sendNotification({
      recipientId: leave.employeeId._id,
      title: 'Leave Request Approved',
      message: `Your ${leave.leaveType} (${leave.numberOfDays} days) has been approved by ${req.user.name}.`,
      type: 'LEAVE',
      relatedEntityId: leave._id,
    });

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully.',
      data: leave,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject leave request
// @route   PATCH /api/leaves/:id/reject
// @access  Private (HR, MANAGER)
export const rejectLeave = async (req, res, next) => {
  try {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason or comment is required.',
      });
    }

    const leave = await Leave.findById(req.params.id).populate('employeeId');

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject: Leave request is already ${leave.status}.`,
      });
    }

    // Prevent rejecting own leave
    if (leave.employeeId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot review your own leave request.',
      });
    }

    // If Manager, ensure employee reports to them
    if (req.user.role === 'MANAGER') {
      if (
        !leave.employeeId.managerId ||
        leave.employeeId.managerId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only reject leave requests for your assigned team members.',
        });
      }
    }

    leave.status = 'Rejected';
    leave.reviewedBy = req.user._id;
    leave.reviewComment = comment;
    leave.reviewedAt = new Date();
    await leave.save();

    await logAudit({
      actorId: req.user._id,
      action: 'LEAVE_REJECTED',
      entityType: 'LEAVE',
      entityId: leave._id,
      newValues: { status: 'Rejected', comment },
      req,
    });

    await sendNotification({
      recipientId: leave.employeeId._id,
      title: 'Leave Request Rejected',
      message: `Your ${leave.leaveType} request was rejected by ${req.user.name}. Reason: ${comment}`,
      type: 'LEAVE',
      relatedEntityId: leave._id,
    });

    res.status(200).json({
      success: true,
      message: 'Leave request rejected.',
      data: leave,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel pending leave request (by applicant)
// @route   PATCH /api/leaves/:id/cancel
// @access  Private (Employee who applied)
export const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests.',
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending leave requests can be cancelled. Current status is ${leave.status}.`,
      });
    }

    leave.status = 'Cancelled';
    await leave.save();

    await logAudit({
      actorId: req.user._id,
      action: 'LEAVE_CANCELLED',
      entityType: 'LEAVE',
      entityId: leave._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully.',
      data: leave,
    });
  } catch (err) {
    next(err);
  }
};
