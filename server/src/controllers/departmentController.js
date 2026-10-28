import Department from '../models/Department.js';
import User from '../models/User.js';
import { logAudit } from '../utils/helpers.js';

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (All authenticated roles)
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('managerId', 'name email jobTitle employeeId')
      .sort({ name: 1 });

    // Count employees in each department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await User.countDocuments({
          department: dept._id,
          employmentStatus: { $ne: 'TERMINATED' },
        });
        const deptObj = dept.toObject();
        deptObj.employeeCount = employeeCount;
        return deptObj;
      })
    );

    res.status(200).json({
      success: true,
      data: departmentsWithCounts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create department (HR only)
// @route   POST /api/departments
// @access  Private (HR)
export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, managerId, location } = req.body;

    const existing = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A department with this name already exists.',
      });
    }

    const department = await Department.create({
      name,
      code: code || name.substring(0, 3).toUpperCase(),
      description: description || '',
      managerId: managerId || null,
      location: location || 'Headquarters',
      status: 'ACTIVE',
    });

    await logAudit({
      actorId: req.user._id,
      action: 'DEPARTMENT_CREATED',
      entityType: 'DEPARTMENT',
      entityId: department._id,
      newValues: { name, code: department.code, managerId },
      req,
    });

    const populated = await Department.findById(department._id).populate('managerId', 'name email jobTitle');

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update department (HR only)
// @route   PUT /api/departments/:id
// @access  Private (HR)
export const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const { name, code, description, managerId, location, status } = req.body;

    if (name) department.name = name;
    if (code) department.code = code.toUpperCase();
    if (description !== undefined) department.description = description;
    if (managerId !== undefined) department.managerId = managerId || null;
    if (location !== undefined) department.location = location;
    if (status) department.status = status;

    await department.save();

    await logAudit({
      actorId: req.user._id,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'DEPARTMENT',
      entityId: department._id,
      newValues: { name: department.name, managerId: department.managerId },
      req,
    });

    const populated = await Department.findById(department._id).populate('managerId', 'name email jobTitle');

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete / deactivate department (HR only)
// @route   DELETE /api/departments/:id
// @access  Private (HR)
export const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check if employees are assigned
    const assignedCount = await User.countDocuments({ department: department._id });
    if (assignedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department: ${assignedCount} employee(s) are currently assigned to it. Reassign them first.`,
      });
    }

    await department.deleteOne();

    await logAudit({
      actorId: req.user._id,
      action: 'DEPARTMENT_DELETED',
      entityType: 'DEPARTMENT',
      entityId: department._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
