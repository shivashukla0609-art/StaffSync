import express from 'express';
import { body } from 'express-validator';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);

router.post(
  '/',
  authorizeRoles('HR'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  validateRequest,
  createAnnouncement
);

router.put('/:id', authorizeRoles('HR'), updateAnnouncement);
router.delete('/:id', authorizeRoles('HR'), deleteAnnouncement);

export default router;
