import mongoose from 'mongoose';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { generateTicketCode } from '../utils/ticketGenerator.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Helper to determine if an event has already occurred
 * @param {Date} eventDate
 * @param {string} endTime - "HH:mm"
 * @returns {boolean}
 */
const isEventInPast = (eventDate, endTime) => {
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  
  if (endTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime)) {
    const [hours, minutes] = endTime.split(':').map(Number);
    eventDateTime.setHours(hours, minutes, 0, 0);
  } else {
    // If no end time, default to end of the event day
    eventDateTime.setHours(23, 59, 59, 999);
  }

  return now > eventDateTime;
};

/**
 * @desc    Register Student for an Approved Event
 * @route   POST /api/registrations
 * @access  Private (Student only)
 */
export const registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.body;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(res, 'Please provide a valid event ID.', 400);
    }

    // 1. Fetch event
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    // 2. Validate event status (must be approved)
    if (event.status !== 'approved') {
      return sendError(
        res,
        `Cannot register: This event is currently in '${event.status}' status and not approved for registration.`,
        400
      );
    }

    // 3. Validate cancellation
    if (event.isCancelled) {
      return sendError(res, 'Cannot register: This event has been cancelled by the organizer.', 400);
    }

    // 4. Validate event has not already occurred
    if (isEventInPast(event.date, event.endTime)) {
      return sendError(res, 'Cannot register: This event has already taken place.', 400);
    }

    // 5. Validate registration deadline
    const now = new Date();
    if (now > new Date(event.registrationDeadline)) {
      return sendError(res, 'Cannot register: The registration deadline has passed for this event.', 400);
    }

    // 6. Check existing registration
    const existingRegistration = await Registration.findOne({
      event: eventId,
      student: req.user._id
    });

    if (existingRegistration) {
      // If already confirmed, block duplicate
      if (existingRegistration.status === 'confirmed') {
        return sendError(
          res,
          `You are already registered for this event. Your ticket code is ${existingRegistration.ticketCode}.`,
          400,
          { ticketCode: existingRegistration.ticketCode }
        );
      }

      // If previously cancelled, handle re-registration with atomic capacity enforcement
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          status: 'approved',
          isCancelled: false,
          registrationDeadline: { $gte: now },
          $expr: { $lt: ['$registeredCount', '$capacity'] }
        },
        { $inc: { registeredCount: 1 } },
        { new: true }
      );

      if (!updatedEvent) {
        return sendError(res, 'Cannot re-register: Event has reached maximum seating capacity.', 400);
      }

      // Re-activate cancelled registration
      existingRegistration.status = 'confirmed';
      existingRegistration.registrationDate = new Date();
      existingRegistration.cancelledAt = null;
      if (!existingRegistration.ticketCode) {
        existingRegistration.ticketCode = generateTicketCode();
      }
      await existingRegistration.save();

      await existingRegistration.populate([
        { path: 'event', populate: { path: 'organizer', select: 'name email department' } },
        { path: 'student', select: 'name email department year semester' }
      ]);

      // Notification
      await Notification.create({
        recipient: req.user._id,
        title: 'Event Registration Re-activated',
        message: `Your registration for "${event.title}" has been successfully re-activated. Ticket code: ${existingRegistration.ticketCode}`,
        type: 'registration',
        link: '/student/registrations'
      });

      // Audit Log
      await AuditLog.create({
        action: 'EVENT_REGISTRATION_REACTIVATED',
        performedBy: req.user._id,
        targetModel: 'Registration',
        targetId: existingRegistration._id,
        details: { eventId: event._id, ticketCode: existingRegistration.ticketCode },
        ipAddress: req.ip || ''
      });

      return sendSuccess(
        res,
        'Successfully re-registered for event.',
        existingRegistration,
        201
      );
    }

    // 7. Atomic capacity enforcement for new registration
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'approved',
        isCancelled: false,
        registrationDeadline: { $gte: now },
        $expr: { $lt: ['$registeredCount', '$capacity'] }
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      if (event.registeredCount >= event.capacity) {
        return sendError(res, 'Event has reached maximum seating capacity.', 400);
      }
      return sendError(res, 'Registration is closed for this event.', 400);
    }

    // 8. Generate collision-resistant unique ticket code
    let ticketCode = generateTicketCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existingCode = await Registration.findOne({ ticketCode });
      if (!existingCode) {
        isUnique = true;
      } else {
        ticketCode = generateTicketCode();
        attempts++;
      }
    }

    // 9. Create Registration document
    const registration = await Registration.create({
      event: eventId,
      student: req.user._id,
      ticketCode,
      status: 'confirmed',
      registrationDate: new Date()
    });

    await registration.populate([
      { path: 'event', populate: { path: 'organizer', select: 'name email department' } },
      { path: 'student', select: 'name email department year semester' }
    ]);

    // 10. Create in-app student notification
    await Notification.create({
      recipient: req.user._id,
      title: 'Event Registration Confirmed',
      message: `You are confirmed for "${event.title}". Your unique ticket code is ${ticketCode}.`,
      type: 'registration',
      link: '/student/registrations'
    });

    // 11. Create AuditLog entry
    await AuditLog.create({
      action: 'EVENT_REGISTRATION_CREATED',
      performedBy: req.user._id,
      targetModel: 'Registration',
      targetId: registration._id,
      details: {
        eventId: event._id,
        eventTitle: event.title,
        ticketCode
      },
      ipAddress: req.ip || ''
    });

    return sendSuccess(
      res,
      'Registration confirmed successfully! Your ticket has been issued.',
      registration,
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel Student Event Registration
 * @route   PATCH /api/registrations/:id/cancel
 * @access  Private (Student owner only)
 */
export const cancelRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid registration ID format.', 400);
    }

    const registration = await Registration.findOne({
      _id: id,
      student: req.user._id
    }).populate('event');

    if (!registration) {
      return sendError(res, 'Registration not found or not owned by your account.', 404);
    }

    if (registration.status === 'cancelled') {
      return sendError(res, 'This registration has already been cancelled.', 400);
    }

    const event = registration.event;

    // Prevent cancellation if event is in the past
    if (event && isEventInPast(event.date, event.endTime)) {
      return sendError(
        res,
        'Cannot cancel registration: This event has already commenced or concluded.',
        400
      );
    }

    // Update status to cancelled
    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    await registration.save();

    // Decrement event registeredCount safely
    if (event) {
      await Event.findByIdAndUpdate(event._id, {
        $inc: { registeredCount: -1 }
      });
    }

    // Student notification
    await Notification.create({
      recipient: req.user._id,
      title: 'Registration Cancelled',
      message: `Your registration for "${event?.title || 'Event'}" (Ticket: ${registration.ticketCode}) has been cancelled.`,
      type: 'registration',
      link: '/student/registrations'
    });

    // Audit Log
    await AuditLog.create({
      action: 'EVENT_REGISTRATION_CANCELLED',
      performedBy: req.user._id,
      targetModel: 'Registration',
      targetId: registration._id,
      details: {
        eventId: event?._id,
        ticketCode: registration.ticketCode
      },
      ipAddress: req.ip || ''
    });

    return sendSuccess(res, 'Your registration has been cancelled successfully.', {
      registrationId: registration._id,
      status: 'cancelled',
      cancelledAt: registration.cancelledAt
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Current Student's Registrations with Attendance History
 * @route   GET /api/registrations/my-registrations
 * @access  Private (Student only)
 */
export const getMyRegistrations = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { student: req.user._id };
    if (status && ['confirmed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const registrations = await Registration.find(query)
      .sort({ registrationDate: -1 })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name email department' }
      })
      .lean();

    // Attach corresponding attendance record to each registration
    const eventIds = registrations.map((r) => r.event?._id).filter(Boolean);
    const attendances = await Attendance.find({
      student: req.user._id,
      event: { $in: eventIds }
    }).lean();

    const attendanceMap = new Map();
    attendances.forEach((att) => {
      attendanceMap.set(att.event.toString(), att);
    });

    const enrichedRegistrations = registrations.map((reg) => {
      const att = reg.event ? attendanceMap.get(reg.event._id.toString()) : null;
      return {
        ...reg,
        attendance: att
          ? {
              status: att.status,
              markedAt: att.markedAt,
              remarks: att.remarks
            }
          : { status: 'unmarked' }
      };
    });

    return sendSuccess(
      res,
      'My registrations retrieved successfully.',
      enrichedRegistrations
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Check Current Student's Registration Status for a Single Event
 * @route   GET /api/registrations/event/:eventId/check
 * @access  Private (Student only)
 */
export const checkEventRegistration = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(res, 'Invalid event ID format.', 400);
    }

    const registration = await Registration.findOne({
      event: eventId,
      student: req.user._id
    })
      .populate('event', 'title date startTime endTime venue capacity registeredCount')
      .lean();

    let attendance = null;
    if (registration) {
      attendance = await Attendance.findOne({
        event: eventId,
        student: req.user._id
      }).lean();
    }

    return sendSuccess(res, 'Registration status checked.', {
      isRegistered: Boolean(registration && registration.status === 'confirmed'),
      registration: registration || null,
      attendance: attendance || null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Registration Details by ID
 * @route   GET /api/registrations/:id
 * @access  Private (Owner student, Event Organizer, or Admin)
 */
export const getRegistrationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid registration ID format.', 400);
    }

    const registration = await Registration.findById(id).populate([
      { path: 'event', populate: { path: 'organizer', select: 'name email department' } },
      { path: 'student', select: 'name email department year semester' }
    ]);

    if (!registration) {
      return sendError(res, 'Registration not found.', 404);
    }

    // Access control: owner student, event organizer, or admin
    const isOwner = req.user.role === 'student' && registration.student._id.toString() === req.user._id.toString();
    const isEventOrganizer =
      registration.event &&
      registration.event.organizer &&
      registration.event.organizer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isEventOrganizer && !isAdmin) {
      return sendError(res, 'Access forbidden: You do not have permission to view this registration.', 403);
    }

    const attendance = await Attendance.findOne({
      registration: registration._id
    }).lean();

    return sendSuccess(res, 'Registration details retrieved.', {
      ...registration.toObject(),
      attendance: attendance || { status: 'unmarked' }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Lookup / Validate Registration by Ticket Code
 * @route   GET /api/registrations/ticket/:ticketCode
 * @access  Private (Organizer, Admin, or Student Owner)
 */
export const getRegistrationByTicketCode = async (req, res, next) => {
  try {
    const { ticketCode } = req.params;

    if (!ticketCode || typeof ticketCode !== 'string') {
      return sendError(res, 'Please provide a ticket code.', 400);
    }

    const registration = await Registration.findOne({
      ticketCode: ticketCode.trim().toUpperCase()
    }).populate([
      { path: 'event', populate: { path: 'organizer', select: 'name email department' } },
      { path: 'student', select: 'name email department year semester' }
    ]);

    if (!registration) {
      return sendError(res, 'Invalid or unrecognized ticket code.', 404);
    }

    // Authorization
    const isOwner = req.user.role === 'student' && registration.student._id.toString() === req.user._id.toString();
    const isOrganizer = req.user.role === 'organizer';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isOrganizer && !isAdmin) {
      return sendError(res, 'Access forbidden: You do not have permission to inspect this ticket.', 403);
    }

    const attendance = await Attendance.findOne({
      registration: registration._id
    }).lean();

    return sendSuccess(res, 'Ticket code verified successfully.', {
      ...registration.toObject(),
      attendance: attendance || { status: 'unmarked' }
    });
  } catch (err) {
    next(err);
  }
};
