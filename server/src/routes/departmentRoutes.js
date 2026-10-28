import express from 'express';
import { body } from 'express-validator';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getDepartments);
router.post(
  '/',
  authorizeRoles('HR'),
  [body('name').trim().notEmpty().withMessage('Department name is required')],
  validateRequest,
  createDepartment
);
router.put('/:id', authorizeRoles('HR'), updateDepartment);
router.delete('/:id', authorizeRoles('HR'), deleteDepartment);

export default router;
