import Event from '../models/Event.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { checkVenueConflict, timeToMinutes } from '../services/conflictService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

/**
 * @desc    Get Public / Approved Campus Events with Filters, Search, and Pagination
 * @route   GET /api/events
 * @access  Public
 */
export const getEvents = async (req, res, next) => {
  try {
    const {
      search,
      category,
      department,
      venue,
      dateFrom,
      dateTo,
      sortBy = 'date',
      page = 1,
      limit = 12
    } = req.query;

    // Public query strictly filters to approved, uncancelled events
    const query = {
      status: 'approved',
      isCancelled: false
    };

    // Keyword Search
    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { venue: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Category Filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Department Filter (Matches 'All' or specific target department)
    if (department && department !== 'All') {
      query.$or = query.$or || [];
      query.targetDepartment = { $in: ['All', department] };
    }

    // Venue Filter
    if (venue && venue !== 'All') {
      query.venue = new RegExp(`^${escapeRegex(venue.trim())}$`, 'i');
    }

    // Date Range Filters
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) {
        query.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    // Sorting
    let sortOptions = { date: 1, startTime: 1 };
    if (sortBy === '-date') sortOptions = { date: -1, startTime: -1 };
    if (sortBy === 'registeredCount' || sortBy === '-registeredCount') {
      sortOptions = { registeredCount: sortBy.startsWith('-') ? -1 : 1 };
    }
    if (sortBy === '-createdAt') sortOptions = { createdAt: -1 };

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'name email department avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const pages = Math.ceil(total / limitNum) || 1;

    return sendSuccess(
      res,
      'Events retrieved successfully',
      events,
      200,
      {
        total,
        page: pageNum,
        pages,
        limit: limitNum
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Event Details by ID
 * @route   GET /api/events/:id
 * @access  Public (Approved) / Private (Draft/Pending/Rejected)
 */
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'organizer',
      'name email department avatar'
    );

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    // If event is not approved, only the organizer or an admin may view it
    if (event.status !== 'approved') {
      const user = req.user;
      const isOwner = user && event.organizer._id.toString() === user._id.toString();
      const isAdmin = user && user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return sendError(
          res,
          'Access forbidden: This event is currently in draft or pending administrative approval.',
          403
        );
      }
    }

    return sendSuccess(res, 'Event details retrieved successfully', event);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a New Event (Draft or Submitted for Approval)
 * @route   POST /api/events
 * @access  Private (Organizer, Admin)
 */
export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      tags = [],
      targetDepartment = 'All',
      targetYear = [],
      date,
      startTime,
      endTime,
      venue,
      capacity,
      registrationDeadline,
      bannerImage = '',
      status = 'draft'
    } = req.body;

    // Required Fields Validation
    if (
      !title ||
      !description ||
      !category ||
      !date ||
      !startTime ||
      !endTime ||
      !venue ||
      capacity === undefined ||
      capacity === null ||
      capacity === '' ||
      !registrationDeadline
    ) {
      return sendError(
        res,
        'Please provide all required fields: title, description, category, date, startTime, endTime, venue, capacity, and registrationDeadline.',
        400
      );
    }

    // Capacity validation
    const capacityNum = Number(capacity);
    if (isNaN(capacityNum) || capacityNum < 1) {
      return sendError(res, 'Event seating capacity must be a positive number of at least 1.', 400);
    }

    // Date/Time validation
    const eventDate = new Date(date);
    const deadlineDate = new Date(registrationDeadline);

    if (isNaN(eventDate.getTime())) {
      return sendError(res, 'Invalid event date provided.', 400);
    }

    if (isNaN(deadlineDate.getTime())) {
      return sendError(res, 'Invalid registration deadline provided.', 400);
    }

    // Check time format & ordering
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    if (startMinutes >= endMinutes) {
      return sendError(res, 'Event start time must precede end time.', 400);
    }

    // Registration deadline must precede or equal event date
    if (deadlineDate > eventDate) {
      return sendError(res, 'Registration deadline cannot be after the event date.', 400);
    }

    // Admin can create directly as approved; organizers create as draft or pending
    let initialStatus = 'draft';
    if (status === 'pending') initialStatus = 'pending';
    if (status === 'approved' && req.user.role === 'admin') initialStatus = 'approved';

    // Conflict Check (Mandatory if submitting for pending or approved)
    if (initialStatus === 'pending' || initialStatus === 'approved') {
      const conflictResult = await checkVenueConflict({
        venue,
        date: eventDate,
        startTime,
        endTime
      });

      if (conflictResult.hasConflict) {
        return sendError(res, conflictResult.message, 400, { conflict: conflictResult });
      }
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      organizer: req.user._id,
      category,
      tags: Array.isArray(tags) ? tags : [],
      targetDepartment: targetDepartment.trim(),
      targetYear: Array.isArray(targetYear) ? targetYear : [],
      date: eventDate,
      startTime,
      endTime,
      venue: venue.trim(),
      capacity: capacityNum,
      registeredCount: 0,
      registrationDeadline: deadlineDate,
      bannerImage,
      status: initialStatus
    });

    return sendSuccess(
      res,
      initialStatus === 'pending'
        ? 'Event submitted successfully for administrative review.'
        : 'Event saved as draft.',
      event,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Existing Event
 * @route   PUT /api/events/:id
 * @access  Private (Organizer of this event, Admin)
 */
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    // Ownership & Authorization Check
    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Access forbidden: You are not authorized to edit this event.', 403);
    }

    const {
      title,
      description,
      category,
      tags,
      targetDepartment,
      targetYear,
      date,
      startTime,
      endTime,
      venue,
      capacity,
      registrationDeadline,
      bannerImage,
      status
    } = req.body;

    const proposedVenue = venue ? venue.trim() : event.venue;
    const proposedDate = date ? new Date(date) : event.date;
    const proposedStartTime = startTime || event.startTime;
    const proposedEndTime = endTime || event.endTime;
    const proposedStatus = status || event.status;

    // Validate times if changing
    const startMinutes = timeToMinutes(proposedStartTime);
    const endMinutes = timeToMinutes(proposedEndTime);
    if (startMinutes >= endMinutes) {
      return sendError(res, 'Event start time must precede end time.', 400);
    }

    // Capacity validation if changing
    if (capacity !== undefined) {
      const capNum = Number(capacity);
      if (isNaN(capNum) || capNum < 1) {
        return sendError(res, 'Event seating capacity must be a positive number.', 400);
      }
      if (capNum < event.registeredCount) {
        return sendError(
          res,
          `Capacity cannot be reduced below the ${event.registeredCount} currently confirmed registrations.`,
          400
        );
      }
      event.capacity = capNum;
    }

    // Check conflict if venue, date, or times changed, or if submitting for review
    if (proposedStatus === 'pending' || proposedStatus === 'approved') {
      const conflictResult = await checkVenueConflict({
        venue: proposedVenue,
        date: proposedDate,
        startTime: proposedStartTime,
        endTime: proposedEndTime,
        excludeEventId: event._id
      });

      if (conflictResult.hasConflict) {
        return sendError(res, conflictResult.message, 400, { conflict: conflictResult });
      }
    }

    if (title) event.title = title.trim();
    if (description) event.description = description.trim();
    if (category) event.category = category;
    if (tags && Array.isArray(tags)) event.tags = tags;
    if (targetDepartment) event.targetDepartment = targetDepartment.trim();
    if (targetYear && Array.isArray(targetYear)) event.targetYear = targetYear;
    if (date) event.date = proposedDate;
    if (startTime) event.startTime = proposedStartTime;
    if (endTime) event.endTime = proposedEndTime;
    if (venue) event.venue = proposedVenue;
    if (registrationDeadline) event.registrationDeadline = new Date(registrationDeadline);
    if (bannerImage !== undefined) event.bannerImage = bannerImage;

    // Status transition handling
    if (status) {
      if (status === 'draft') event.status = 'draft';
      if (status === 'pending') {
        event.status = 'pending';
        event.rejectionReason = ''; // Clear previous rejection on resubmission
      }
      if (status === 'approved' && isAdmin) event.status = 'approved';
    }

    const updatedEvent = await event.save();
    return sendSuccess(res, 'Event updated successfully', updatedEvent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Event
 * @route   DELETE /api/events/:id
 * @access  Private (Organizer of this event, Admin)
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Access forbidden: You cannot delete another organizer’s event.', 403);
    }

    await event.deleteOne();
    return sendSuccess(res, 'Event deleted successfully', { _id: req.params.id });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit Draft Event for Administrative Approval
 * @route   PATCH /api/events/:id/submit
 * @access  Private (Organizer of this event, Admin)
 */
export const submitEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Access forbidden: You cannot submit this event.', 403);
    }

    // Verify no venue schedule conflict before submitting
    const conflictResult = await checkVenueConflict({
      venue: event.venue,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      excludeEventId: event._id
    });

    if (conflictResult.hasConflict) {
      return sendError(res, conflictResult.message, 400, { conflict: conflictResult });
    }

    event.status = 'pending';
    event.rejectionReason = '';
    await event.save();

    return sendSuccess(res, 'Event submitted successfully for administrative approval', event);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Venue Availability / Schedule Conflict Check (Standalone)
 * @route   POST /api/events/check-conflict
 * @access  Private (Organizer, Admin)
 */
export const checkConflict = async (req, res, next) => {
  try {
    const { venue, date, startTime, endTime, eventId } = req.body;

    if (!venue || !date || !startTime || !endTime) {
      return sendError(res, 'Please provide venue, date, startTime, and endTime to check availability.', 400);
    }

    const result = await checkVenueConflict({
      venue,
      date,
      startTime,
      endTime,
      excludeEventId: eventId || null
    });

    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve Event Submission
 * @route   PATCH /api/events/:id/approve
 * @access  Private (Admin Only)
 */
export const approveEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    // Re-verify conflict at time of approval
    const conflictResult = await checkVenueConflict({
      venue: event.venue,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      excludeEventId: event._id
    });

    if (conflictResult.hasConflict) {
      return sendError(res, `Cannot approve: ${conflictResult.message}`, 400);
    }

    event.status = 'approved';
    event.rejectionReason = '';
    await event.save();

    // Audit Log Entry
    await AuditLog.create({
      action: 'EVENT_APPROVED',
      performedBy: req.user._id,
      targetModel: 'Event',
      targetId: event._id,
      details: { title: event.title, venue: event.venue, date: event.date },
      ipAddress: req.ip || ''
    });

    // In-app Notification to Event Organizer
    await Notification.create({
      recipient: event.organizer,
      title: 'Event Approved!',
      message: `Your event '${event.title}' scheduled at '${event.venue}' has been approved by campus administration.`,
      type: 'approval',
      link: `/events/${event._id}`
    });

    return sendSuccess(res, `Event '${event.title}' approved successfully!`, event);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject Event Submission with Mandatory Reason
 * @route   PATCH /api/events/:id/reject
 * @access  Private (Admin Only)
 */
export const rejectEvent = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      return sendError(
        res,
        'A descriptive rejection reason of at least 5 characters is required for audit compliance.',
        400
      );
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    event.status = 'rejected';
    event.rejectionReason = rejectionReason.trim();
    await event.save();

    // Audit Log Entry
    await AuditLog.create({
      action: 'EVENT_REJECTED',
      performedBy: req.user._id,
      targetModel: 'Event',
      targetId: event._id,
      details: {
        title: event.title,
        venue: event.venue,
        rejectionReason: event.rejectionReason
      },
      ipAddress: req.ip || ''
    });

    // In-app Notification to Event Organizer
    await Notification.create({
      recipient: event.organizer,
      title: 'Event Submission Needs Revision',
      message: `Your event '${event.title}' was rejected by campus administration. Reason: ${event.rejectionReason}`,
      type: 'rejection',
      link: `/organizer/events`
    });

    return sendSuccess(res, `Event '${event.title}' rejected with logged reason.`, event);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get All Events Managed by the Authenticated Organizer
 * @route   GET /api/events/organizer/my-events
 * @access  Private (Organizer, Admin)
 */
export const getOrganizerEvents = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = { organizer: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.title = new RegExp(escapeRegex(search.trim()), 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const pages = Math.ceil(total / limitNum) || 1;

    return sendSuccess(res, 'Organizer events retrieved successfully', events, 200, {
      total,
      page: pageNum,
      pages,
      limit: limitNum
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get All Events for Campus Admin Review
 * @route   GET /api/events/admin/all
 * @access  Private (Admin Only)
 */
export const getAdminEvents = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ title: searchRegex }, { venue: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'name email department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const pages = Math.ceil(total / limitNum) || 1;

    return sendSuccess(res, 'Admin events queue retrieved successfully', events, 200, {
      total,
      page: pageNum,
      pages,
      limit: limitNum
    });
  } catch (error) {
    next(error);
  }
};
