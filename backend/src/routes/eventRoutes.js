import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  submitEvent,
  checkConflict,
  approveEvent,
  rejectEvent,
  getOrganizerEvents,
  getAdminEvents
} from '../controllers/eventController.js';
import { protect, authorize, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

// Public / Student Catalog Queries
router.get('/', getEvents);

// Organizer & Admin Creation & Management
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.post('/check-conflict', protect, authorize('organizer', 'admin'), checkConflict);
router.get('/organizer/my-events', protect, authorize('organizer', 'admin'), getOrganizerEvents);

// Admin Review & Approvals Queue
router.get('/admin/all', protect, authorize('admin'), getAdminEvents);
router.patch('/:id/approve', protect, authorize('admin'), approveEvent);
router.patch('/:id/reject', protect, authorize('admin'), rejectEvent);

// Single Event Details & Modification
router.get('/:id', optionalProtect, getEventById);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);
router.patch('/:id/submit', protect, authorize('organizer', 'admin'), submitEvent);

export default router;
