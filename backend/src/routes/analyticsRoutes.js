import express from 'express';
import {
  getStudentAnalyticsController,
  getOrganizerAnalyticsController,
  getAdminAnalyticsController,
  getDashboardAnalyticsController
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Role-dispatched dashboard metrics
router.get('/dashboard', protect, getDashboardAnalyticsController);

// Student engagement analytics
router.get('/student', protect, authorize('student'), getStudentAnalyticsController);

// Organizer performance analytics
router.get('/organizer', protect, authorize('organizer', 'admin'), getOrganizerAnalyticsController);

// Admin institutional analytics
router.get('/admin', protect, authorize('admin'), getAdminAnalyticsController);

export default router;
