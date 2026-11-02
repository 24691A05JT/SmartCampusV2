import express from 'express';
import {
  createFeedback,
  getEventFeedback,
  checkFeedbackEligibility,
  getMyFeedback,
  updateFeedback,
  deleteFeedback,
  getAllFeedbackAdmin
} from '../controllers/feedbackController.js';
import { protect, authorize, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

// Public / Authenticated read routes
router.get('/event/:eventId', optionalProtect, getEventFeedback);
router.get('/event/:eventId/eligibility', protect, checkFeedbackEligibility);

// Student authenticated routes
router.post('/', protect, authorize('student'), createFeedback);
router.get('/my-feedback', protect, authorize('student'), getMyFeedback);

// Author / Admin routes
router.put('/:id', protect, updateFeedback);
router.delete('/:id', protect, deleteFeedback);

// Admin moderation route
router.get('/admin/all', protect, authorize('admin'), getAllFeedbackAdmin);

export default router;
