import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import { logAudit, sendNotification } from '../utils/helpers.js';

// @desc    Get all employees (Scoped by role: HR sees all, Manager sees team)
// @route   GET /api/employees
// @access  Private (HR, MANAGER)
export const getEmployees = async (req, res, next) => {
  try {
    const { search, department, status, role, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const query = {};

    // If Manager, only show their direct team members (or themselves)
    if (req.user.role === 'MANAGER') {
      query.$or = [{ managerId: req.user._id }, { _id: req.user._id }];
    }

    if (department) {
      query.department = department;
    }

    if (status) {
      query.employmentStatus = status;
    }

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
          { jobTitle: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, employees] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .populate('department', 'name code')
        .populate('managerId', 'name email jobTitle')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data: employees,
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

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private
export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id)
      .populate('department', 'name code description')
      .populate('managerId', 'name email jobTitle');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Role-based visibility check: HR can see all; Manager can see team; Employee can see self
    if (
      req.user.role === 'EMPLOYEE' &&
      req.user._id.toString() !== employee._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this record' });
    }

    if (
      req.user.role === 'MANAGER' &&
      req.user._id.toString() !== employee._id.toString() &&
      (!employee.managerId || employee.managerId._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Employee is not in your team' });
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new employee (HR only)
// @route   POST /api/employees
// @access  Private (HR)
export const createEmployee = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'EMPLOYEE',
      department,
      jobTitle,
      managerId,
      phone,
      address,
      joiningDate,
      salary = 0,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Generate unique employee ID
    const count = await User.countDocuments();
    const prefix = role === 'MANAGER' ? 'MGR' : 'EMP';
    const employeeId = `${prefix}-${String(count + 101).padStart(4, '0')}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'StaffSync@123', salt);

    const newEmployee = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      employeeId,
      department: department || null,
      jobTitle: jobTitle || 'Specialist',
      managerId: managerId || null,
      phone: phone || '',
      address: address || '',
      joiningDate: joiningDate || new Date(),
      employmentStatus: 'ACTIVE',
      salary: Number(salary) || 0,
    });

    await logAudit({
      actorId: req.user._id,
      action: 'EMPLOYEE_CREATED',
      entityType: 'USER',
      entityId: newEmployee._id,
      newValues: { name, email, role, employeeId, department },
      req,
    });

    await sendNotification({
      recipientId: newEmployee._id,
      title: 'Welcome to StaffSync!',
      message: `Your account has been created by HR (${req.user.name}). Role: ${role}.`,
      type: 'SYSTEM',
    });

    const populated = await User.findById(newEmployee._id)
      .populate('department', 'name code')
      .populate('managerId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update employee (HR only)
// @route   PUT /api/employees/:id
// @access  Private (HR)
export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const previousValues = {
      name: employee.name,
      role: employee.role,
      department: employee.department,
      jobTitle: employee.jobTitle,
      managerId: employee.managerId,
      employmentStatus: employee.employmentStatus,
      salary: employee.salary,
    };

    const {
      name,
      role,
      department,
      jobTitle,
      managerId,
      phone,
      address,
      employmentStatus,
      salary,
      joiningDate,
    } = req.body;

    if (name !== undefined) employee.name = name;
    if (role !== undefined) employee.role = role;
    if (department !== undefined) employee.department = department || null;
    if (jobTitle !== undefined) employee.jobTitle = jobTitle;
    if (managerId !== undefined) employee.managerId = managerId || null;
    if (phone !== undefined) employee.phone = phone;
    if (address !== undefined) employee.address = address;
    if (employmentStatus !== undefined) employee.employmentStatus = employmentStatus;
    if (salary !== undefined) employee.salary = Number(salary);
    if (joiningDate !== undefined) employee.joiningDate = joiningDate;

    await employee.save();

    await logAudit({
      actorId: req.user._id,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'USER',
      entityId: employee._id,
      previousValues,
      newValues: { name: employee.name, role: employee.role, department: employee.department, status: employee.employmentStatus },
      req,
    });

    const populated = await User.findById(employee._id)
      .populate('department', 'name code')
      .populate('managerId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change employee employment status (HR only)
// @route   PATCH /api/employees/:id/status
// @access  Private (HR)
export const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'PROBATION', 'TERMINATED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid employment status' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const oldStatus = employee.employmentStatus;
    employee.employmentStatus = status;
    await employee.save();

    await logAudit({
      actorId: req.user._id,
      action: 'EMPLOYEE_STATUS_CHANGED',
      entityType: 'USER',
      entityId: employee._id,
      previousValues: { status: oldStatus },
      newValues: { status },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Employee status changed to ${status}`,
      data: employee,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get employee attendance history
// @route   GET /api/employees/:id/attendance
// @access  Private (HR, Manager for team, Employee for self)
export const getEmployeeAttendance = async (req, res, next) => {
  try {
    const employeeId = req.params.id;

    if (req.user.role === 'EMPLOYEE' && req.user._id.toString() !== employeeId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this record' });
    }

    const attendanceRecords = await Attendance.find({ employeeId })
      .sort({ date: -1 })
      .limit(60);

    res.status(200).json({
      success: true,
      data: attendanceRecords,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get employee leaves history
// @route   GET /api/employees/:id/leaves
// @access  Private (HR, Manager for team, Employee for self)
export const getEmployeeLeaves = async (req, res, next) => {
  try {
    const employeeId = req.params.id;

    if (req.user.role === 'EMPLOYEE' && req.user._id.toString() !== employeeId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this record' });
    }

    const leaves = await Leave.find({ employeeId })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (err) {
    next(err);
  }
};
