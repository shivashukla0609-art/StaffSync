import jwt from 'jsonwebtoken';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'staffsync_super_secret_jwt_key_2026_xyz',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);

  // Set HTTP-only cookie
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      department: user.department,
      jobTitle: user.jobTitle,
      managerId: user.managerId,
      phone: user.phone,
      profileImage: user.profileImage,
      employmentStatus: user.employmentStatus,
      joiningDate: user.joiningDate,
    },
  });
};

export const logAudit = async ({
  actorId,
  action,
  entityType,
  entityId = null,
  previousValues = null,
  newValues = null,
  req = null,
}) => {
  try {
    const ipAddress = req ? req.ip || req.headers['x-forwarded-for'] || '' : '';
    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      previousValues,
      newValues,
      ipAddress,
    });
  } catch (err) {
    console.error('[AuditLog] Error recording audit log:', err.message);
  }
};

export const sendNotification = async ({
  recipientId,
  title,
  message,
  type = 'SYSTEM',
  relatedEntityId = null,
}) => {
  try {
    if (!recipientId) return;
    return await Notification.create({
      recipientId,
      title,
      message,
      type,
      relatedEntityId,
    });
  } catch (err) {
    console.error('[Notification] Error creating notification:', err.message);
  }
};
