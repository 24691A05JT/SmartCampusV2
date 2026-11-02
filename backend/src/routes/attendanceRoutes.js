import express from 'express';
import {
  getEventParticipants,
  markAttendance,
  bulkMarkAttendance,
  getMyAttendance,
  getAttendanceStats
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student attendance route
router.get('/my-attendance', protect, authorize('student'), getMyAttendance);

// Organizer & Admin participant and attendance management routes
router.get('/event/:eventId', protect, authorize('organizer', 'admin'), getEventParticipants);
router.get('/event/:eventId/stats', protect, authorize('organizer', 'admin'), getAttendanceStats);
router.post('/mark', protect, authorize('organizer', 'admin'), markAttendance);
router.post('/bulk-mark', protect, authorize('organizer', 'admin'), bulkMarkAttendance);

export default router;
