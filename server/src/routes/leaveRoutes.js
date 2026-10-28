import express from 'express';
import { body } from 'express-validator';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  cancelLeave,
} from '../controllers/leaveController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.use(authenticateUser);

router.post(
  '/',
  [
    body('leaveType').notEmpty().withMessage('Leave type is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
  ],
  validateRequest,
  applyLeave
);

router.get('/me', getMyLeaves);
router.get('/', authorizeRoles('HR', 'MANAGER'), getAllLeaves);
router.get('/:id', getLeaveById);
router.patch('/:id/approve', authorizeRoles('HR', 'MANAGER'), approveLeave);
router.patch(
  '/:id/reject',
  authorizeRoles('HR', 'MANAGER'),
  [body('comment').trim().notEmpty().withMessage('Rejection comment is required')],
  validateRequest,
  rejectLeave
);
router.patch('/:id/cancel', cancelLeave);

export default router;
