import express from 'express';
import {
  getDashboardReports,
  getAttendanceReport,
  getLeavesReport,
  getEmployeesReport,
} from '../controllers/reportController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/dashboard', authorizeRoles('HR', 'MANAGER'), getDashboardReports);
router.get('/attendance', authorizeRoles('HR', 'MANAGER'), getAttendanceReport);
router.get('/leaves', authorizeRoles('HR', 'MANAGER'), getLeavesReport);
router.get('/employees', authorizeRoles('HR'), getEmployeesReport);

export default router;
