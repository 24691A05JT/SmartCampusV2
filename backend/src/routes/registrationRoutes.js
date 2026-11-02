import express from 'express';
import {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  checkEventRegistration,
  getRegistrationById,
  getRegistrationByTicketCode
} from '../controllers/registrationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student-specific registration endpoints
router.post('/', protect, authorize('student'), registerForEvent);
router.get('/my-registrations', protect, authorize('student'), getMyRegistrations);
router.get('/event/:eventId/check', protect, authorize('student'), checkEventRegistration);
router.patch('/:id/cancel', protect, authorize('student'), cancelRegistration);

// General protected lookup endpoints
router.get('/ticket/:ticketCode', protect, getRegistrationByTicketCode);
router.get('/:id', protect, getRegistrationById);

export default router;
