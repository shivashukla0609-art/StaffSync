import express from 'express';
import { body } from 'express-validator';
import {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  enrollTraining,
  updateEnrollmentStatus,
  getMyEnrollments,
} from '../controllers/trainingController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/me/enrollments', getMyEnrollments);
router.get('/', getTrainings);
router.get('/:id', getTrainingById);

router.post(
  '/',
  authorizeRoles('HR', 'MANAGER'),
  [
    body('title').trim().notEmpty().withMessage('Training title is required'),
    body('trainer').trim().notEmpty().withMessage('Trainer name is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ],
  validateRequest,
  createTraining
);

router.put('/:id', authorizeRoles('HR', 'MANAGER'), updateTraining);
router.delete('/:id', authorizeRoles('HR'), deleteTraining);

router.post('/:id/enroll', enrollTraining);
router.patch('/:id/enrollments/:enrollmentId', authorizeRoles('HR', 'MANAGER'), updateEnrollmentStatus);

export default router;
