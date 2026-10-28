import express from 'express';
import {
  clockIn,
  clockOut,
  getMyAttendance,
  getAllAttendance,
  getTeamAttendance,
  getAttendanceSummary,
  correctAttendance,
} from '../controllers/attendanceController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/me', getMyAttendance);
router.get('/summary', authorizeRoles('HR', 'MANAGER'), getAttendanceSummary);
router.get('/team', authorizeRoles('MANAGER', 'HR'), getTeamAttendance);
router.get('/', authorizeRoles('HR'), getAllAttendance);
router.patch('/:id/correction', authorizeRoles('HR'), correctAttendance);

export default router;
