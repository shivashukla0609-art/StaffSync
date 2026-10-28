import mongoose from 'mongoose';

const trainingEnrollmentSchema = new mongoose.Schema(
  {
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrollmentStatus: {
      type: String,
      enum: ['Enrolled', 'Waitlisted', 'Cancelled'],
      default: 'Enrolled',
    },
    completionStatus: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Failed'],
      default: 'Pending',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate enrollment for the same employee and training
trainingEnrollmentSchema.index({ trainingId: 1, employeeId: 1 }, { unique: true });
trainingEnrollmentSchema.index({ employeeId: 1 });
trainingEnrollmentSchema.index({ trainingId: 1 });

const TrainingEnrollment = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);
export default TrainingEnrollment;
