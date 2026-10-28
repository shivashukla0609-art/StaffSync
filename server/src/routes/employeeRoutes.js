import express from 'express';
import { body } from 'express-validator';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  getEmployeeAttendance,
  getEmployeeLeaves,
} from '../controllers/employeeController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', authorizeRoles('HR', 'MANAGER'), getEmployees);
router.post(
  '/',
  authorizeRoles('HR'),
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  validateRequest,
  createEmployee
);

router.get('/:id', getEmployeeById);
router.put('/:id', authorizeRoles('HR'), updateEmployee);
router.patch('/:id/status', authorizeRoles('HR'), updateEmployeeStatus);
router.get('/:id/attendance', getEmployeeAttendance);
router.get('/:id/leaves', getEmployeeLeaves);

export default router;
