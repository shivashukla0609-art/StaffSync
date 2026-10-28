import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { logAudit, sendNotification } from '../utils/helpers.js';

// @desc    Get announcements
// @route   GET /api/announcements
// @access  Private (All authenticated)
export const getAnnouncements = async (req, res, next) => {
  try {
    const { category, status, search, limit = 20, page = 1 } = req.query;

    const query = {};

    // Non-HR users can only see Published announcements
    if (req.user.role !== 'HR') {
      query.status = 'Published';
    } else if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, announcements] = await Promise.all([
      Announcement.countDocuments(query),
      Announcement.find(query)
        .populate('createdBy', 'name email role')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data: announcements,
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

// @desc    Get announcement by ID
// @route   GET /api/announcements/:id
// @access  Private
export const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'name email role');

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create announcement (HR only)
// @route   POST /api/announcements
// @access  Private (HR)
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, description, category = 'General', priority = 'MEDIUM', expiresAt, status = 'Published' } = req.body;

    const announcement = await Announcement.create({
      title,
      description,
      category,
      priority,
      createdBy: req.user._id,
      publishedAt: new Date(),
      expiresAt: expiresAt || null,
      status,
    });

    await logAudit({
      actorId: req.user._id,
      action: 'ANNOUNCEMENT_CREATED',
      entityType: 'ANNOUNCEMENT',
      entityId: announcement._id,
      newValues: { title, category, priority, status },
      req,
    });

    // If published, notify all active employees
    if (status === 'Published') {
      const activeUsers = await User.find({
        employmentStatus: 'ACTIVE',
        _id: { $ne: req.user._id },
      }).select('_id');

      // Create notifications in background
      Promise.all(
        activeUsers.map((u) =>
          sendNotification({
            recipientId: u._id,
            title: `Announcement: ${title}`,
            message: description.length > 90 ? `${description.substring(0, 90)}...` : description,
            type: 'ANNOUNCEMENT',
            relatedEntityId: announcement._id,
          })
        )
      ).catch((err) => console.error('Notification dispatch error:', err.message));
    }

    const populated = await Announcement.findById(announcement._id).populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update announcement (HR only)
// @route   PUT /api/announcements/:id
// @access  Private (HR)
export const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const { title, description, category, priority, expiresAt, status } = req.body;

    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (category) announcement.category = category;
    if (priority) announcement.priority = priority;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt || null;
    if (status) announcement.status = status;

    await announcement.save();

    await logAudit({
      actorId: req.user._id,
      action: 'ANNOUNCEMENT_UPDATED',
      entityType: 'ANNOUNCEMENT',
      entityId: announcement._id,
      req,
    });

    const populated = await Announcement.findById(announcement._id).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete announcement (HR only)
// @route   DELETE /api/announcements/:id
// @access  Private (HR)
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await announcement.deleteOne();

    await logAudit({
      actorId: req.user._id,
      action: 'ANNOUNCEMENT_DELETED',
      entityType: 'ANNOUNCEMENT',
      entityId: announcement._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
