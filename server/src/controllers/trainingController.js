import Training from '../models/Training.js';
import TrainingEnrollment from '../models/TrainingEnrollment.js';
import User from '../models/User.js';
import { logAudit, sendNotification } from '../utils/helpers.js';

// @desc    Get all trainings with enrollment stats
// @route   GET /api/trainings
// @access  Private (All authenticated)
export const getTrainings = async (req, res, next) => {
  try {
    const { status, search, department } = req.query;

    const query = {};
    if (status) query.status = status;
    if (department) query.departmentId = department;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { trainer: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const trainings = await Training.find(query)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name email role')
      .sort({ startDate: 1 });

    // Attach enrollment counts & user's enrollment status
    const result = await Promise.all(
      trainings.map(async (t) => {
        const enrolledCount = await TrainingEnrollment.countDocuments({
          trainingId: t._id,
          enrollmentStatus: 'Enrolled',
        });

        const myEnrollment = await TrainingEnrollment.findOne({
          trainingId: t._id,
          employeeId: req.user._id,
        });

        const obj = t.toObject();
        obj.enrolledCount = enrolledCount;
        obj.availableSeats = Math.max(0, t.capacity - enrolledCount);
        obj.isEnrolled = !!myEnrollment;
        obj.myEnrollment = myEnrollment || null;
        return obj;
      })
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get training by ID with enrollments
// @route   GET /api/trainings/:id
// @access  Private
export const getTrainingById = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name email role');

    if (!training) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    const enrollments = await TrainingEnrollment.find({ trainingId: training._id })
      .populate('employeeId', 'name email employeeId department jobTitle')
      .sort({ enrolledAt: 1 });

    const enrolledCount = enrollments.filter((e) => e.enrollmentStatus === 'Enrolled').length;

    res.status(200).json({
      success: true,
      data: {
        ...training.toObject(),
        enrolledCount,
        availableSeats: Math.max(0, training.capacity - enrolledCount),
        enrollments: req.user.role === 'EMPLOYEE' ? [] : enrollments,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create training program
// @route   POST /api/trainings
// @access  Private (HR, MANAGER)
export const createTraining = async (req, res, next) => {
  try {
    const {
      title,
      description,
      trainer,
      startDate,
      endDate,
      capacity = 20,
      departmentId,
      location = 'Online - Video Conference',
    } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.',
      });
    }

    const training = await Training.create({
      title,
      description,
      trainer,
      startDate: start,
      endDate: end,
      capacity: Number(capacity),
      departmentId: departmentId || null,
      createdBy: req.user._id,
      location,
      status: 'Upcoming',
    });

    await logAudit({
      actorId: req.user._id,
      action: 'TRAINING_CREATED',
      entityType: 'TRAINING',
      entityId: training._id,
      newValues: { title, trainer, capacity },
      req,
    });

    const populated = await Training.findById(training._id)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Training program created successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update training
// @route   PUT /api/trainings/:id
// @access  Private (HR, MANAGER)
export const updateTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }

    // Managers can only update trainings they created
    if (req.user.role === 'MANAGER' && training.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this training program' });
    }

    const { title, description, trainer, startDate, endDate, capacity, departmentId, location, status } = req.body;

    if (title) training.title = title;
    if (description) training.description = description;
    if (trainer) training.trainer = trainer;
    if (startDate) training.startDate = new Date(startDate);
    if (endDate) training.endDate = new Date(endDate);
    if (capacity) training.capacity = Number(capacity);
    if (departmentId !== undefined) training.departmentId = departmentId || null;
    if (location) training.location = location;
    if (status) training.status = status;

    await training.save();

    await logAudit({
      actorId: req.user._id,
      action: 'TRAINING_UPDATED',
      entityType: 'TRAINING',
      entityId: training._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Training program updated successfully.',
      data: training,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete training
// @route   DELETE /api/trainings/:id
// @access  Private (HR)
export const deleteTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }

    await TrainingEnrollment.deleteMany({ trainingId: training._id });
    await training.deleteOne();

    await logAudit({
      actorId: req.user._id,
      action: 'TRAINING_DELETED',
      entityType: 'TRAINING',
      entityId: training._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Training program and associated enrollments removed.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Enroll in training (Self or HR/Manager assignment)
// @route   POST /api/trainings/:id/enroll
// @access  Private
export const enrollTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    // Determine target employee
    const targetEmployeeId = req.body.employeeId || req.user._id;

    // Check capacity
    const currentEnrolledCount = await TrainingEnrollment.countDocuments({
      trainingId: training._id,
      enrollmentStatus: 'Enrolled',
    });

    if (currentEnrolledCount >= training.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Training program has reached maximum enrollment capacity.',
      });
    }

    // Check if already enrolled
    const existing = await TrainingEnrollment.findOne({
      trainingId: training._id,
      employeeId: targetEmployeeId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already enrolled in this training program.',
        data: existing,
      });
    }

    const enrollment = await TrainingEnrollment.create({
      trainingId: training._id,
      employeeId: targetEmployeeId,
      enrollmentStatus: 'Enrolled',
      completionStatus: 'Pending',
      enrolledAt: new Date(),
    });

    await logAudit({
      actorId: req.user._id,
      action: 'TRAINING_ENROLLED',
      entityType: 'TRAINING',
      entityId: training._id,
      newValues: { targetEmployeeId, trainingTitle: training.title },
      req,
    });

    await sendNotification({
      recipientId: targetEmployeeId,
      title: 'Training Enrollment Confirmed',
      message: `You are enrolled in "${training.title}" scheduled for ${new Date(training.startDate).toLocaleDateString()}.`,
      type: 'TRAINING',
      relatedEntityId: training._id,
    });

    res.status(201).json({
      success: true,
      message: 'Enrolled in training successfully.',
      data: enrollment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update enrollment completion status (HR, MANAGER)
// @route   PATCH /api/trainings/:id/enrollments/:enrollmentId
// @access  Private (HR, MANAGER)
export const updateEnrollmentStatus = async (req, res, next) => {
  try {
    const { completionStatus, feedback } = req.body;

    const enrollment = await TrainingEnrollment.findById(req.params.enrollmentId)
      .populate('trainingId')
      .populate('employeeId');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found' });
    }

    if (completionStatus) {
      enrollment.completionStatus = completionStatus;
      if (completionStatus === 'Completed') {
        enrollment.completedAt = new Date();
      }
    }
    if (feedback !== undefined) enrollment.feedback = feedback;

    await enrollment.save();

    await logAudit({
      actorId: req.user._id,
      action: 'TRAINING_COMPLETION_UPDATED',
      entityType: 'TRAINING',
      entityId: enrollment.trainingId._id,
      newValues: { completionStatus, employeeId: enrollment.employeeId._id },
      req,
    });

    await sendNotification({
      recipientId: enrollment.employeeId._id,
      title: 'Training Status Updated',
      message: `Your training status for "${enrollment.trainingId.title}" is now marked as ${completionStatus}.`,
      type: 'TRAINING',
      relatedEntityId: enrollment.trainingId._id,
    });

    res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully.',
      data: enrollment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current employee's enrolled trainings
// @route   GET /api/trainings/me/enrollments
// @access  Private (Employee)
export const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await TrainingEnrollment.find({ employeeId: req.user._id })
      .populate({
        path: 'trainingId',
        populate: { path: 'departmentId', select: 'name code' },
      })
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      data: enrollments,
    });
  } catch (err) {
    next(err);
  }
};
