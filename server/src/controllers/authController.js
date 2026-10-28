import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { sendTokenResponse, logAudit, sendNotification } from '../utils/helpers.js';

// @desc    Register a new user (always EMPLOYEE role for self-registration)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, department, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Generate unique employee ID e.g., EMP-XXXX
    const count = await User.countDocuments();
    const employeeId = `EMP-${String(count + 101).padStart(4, '0')}`;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If department ID or name was provided, verify or resolve
    let deptId = null;
    if (department) {
      const foundDept = await Department.findOne({
        $or: [{ _id: department.match(/^[0-9a-fA-F]{24}$/) ? department : null }, { name: department }],
      });
      if (foundDept) {
        deptId = foundDept._id;
      }
    }

    // Role is strictly forced to EMPLOYEE to prevent privilege escalation
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'EMPLOYEE',
      employeeId,
      department: deptId,
      phone: phone || '',
      employmentStatus: 'ACTIVE',
      joiningDate: new Date(),
    });

    await logAudit({
      actorId: user._id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user._id,
      newValues: { email: user.email, role: 'EMPLOYEE' },
      req,
    });

    await sendNotification({
      recipientId: user._id,
      title: 'Welcome to StaffSync!',
      message: 'Your employee account has been created successfully. Explore your dashboard and profile.',
      type: 'SYSTEM',
    });

    return sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Fetch user with passwordHash
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .populate('department', 'name code')
      .populate('managerId', 'name email');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (user.employmentStatus === 'INACTIVE' || user.employmentStatus === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.employmentStatus.toLowerCase()}. Please contact HR administrator.`,
      });
    }

    await logAudit({
      actorId: user._id,
      action: 'USER_LOGIN',
      entityType: 'SECURITY',
      entityId: user._id,
      req,
    });

    return sendTokenResponse(user, 200, res, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name code description')
      .populate('managerId', 'name email jobTitle');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update employee profile (personal details only)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { phone, address, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Permitted fields only
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    await logAudit({
      actorId: user._id,
      action: 'PROFILE_UPDATED',
      entityType: 'USER',
      entityId: user._id,
      newValues: { phone: user.phone, address: user.address },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logAudit({
      actorId: user._id,
      action: 'PASSWORD_CHANGED',
      entityType: 'SECURITY',
      entityId: user._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully.',
  });
};
