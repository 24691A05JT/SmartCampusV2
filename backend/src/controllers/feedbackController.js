import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import AuditLog from '../models/AuditLog.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../utils/notificationHelper.js';

/**
 * Helper: Determine if an event is completed based on date and endTime
 * @param {Object} event - Event document
 * @returns {boolean} True if event has ended
 */
const isEventCompleted = (event) => {
  if (!event || !event.date) return false;
  const eventDate = new Date(event.date);
  const [endHours, endMinutes] = (event.endTime || '23:59').split(':').map(Number);
  const eventEndDateTime = new Date(eventDate);
  eventEndDateTime.setHours(endHours || 23, endMinutes || 59, 59, 999);
  return new Date() >= eventEndDateTime;
};

/**
 * @desc    Submit feedback for an event
 * @route   POST /api/feedback
 * @access  Private (Student only)
 */
export const createFeedback = async (req, res, next) => {
  try {
    const { eventId, rating, comment } = req.body;

    // 1. Role validation
    if (req.user.role !== 'student') {
      return sendError(res, 'Only students may submit event feedback.', 403);
    }

    // 2. Body inputs validation
    if (!eventId) {
      return sendError(res, 'Event ID is required.', 400);
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return sendError(res, 'Rating must be an integer between 1 and 5.', 400);
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
    if (trimmedComment.length < 5 || trimmedComment.length > 1000) {
      return sendError(res, 'Feedback comments must be between 5 and 1000 characters.', 400);
    }

    // 3. Event existence and status check
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    if (event.status !== 'approved' || event.isCancelled) {
      return sendError(res, 'Feedback can only be submitted for approved active events.', 400);
    }

    // 4. Check if event has concluded
    if (!isEventCompleted(event)) {
      return sendError(
        res,
        'Feedback can only be submitted after the event has officially concluded.',
        400
      );
    }

    // 5. Verify student registration
    const registration = await Registration.findOne({
      event: eventId,
      student: req.user._id,
      status: 'confirmed'
    });

    if (!registration) {
      return sendError(
        res,
        'Access denied: You must have a confirmed registration for this event to leave feedback.',
        403
      );
    }

    // 6. Verify student attendance (Must be marked Present)
    const attendance = await Attendance.findOne({
      event: eventId,
      student: req.user._id,
      status: 'present'
    });

    if (!attendance) {
      return sendError(
        res,
        'Access denied: Only attendees marked as present may submit feedback for this event.',
        403
      );
    }

    // 7. Duplicate feedback check
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      student: req.user._id
    });

    if (existingFeedback) {
      return sendError(res, 'You have already submitted feedback for this event.', 400);
    }

    // 8. Create feedback record
    const feedback = await Feedback.create({
      event: eventId,
      student: req.user._id,
      rating: numRating,
      comment: trimmedComment
    });

    // Hydrate student info for response
    await feedback.populate('student', 'name department year email');

    // 9. Dispatch in-app notifications safely
    await createNotification({
      recipient: event.organizer,
      title: 'New Feedback Received',
      message: `${req.user.name} submitted a ${numRating}★ review for "${event.title}".`,
      type: 'feedback',
      link: `/events/${event._id}`
    });

    await createNotification({
      recipient: req.user._id,
      title: 'Feedback Recorded',
      message: `Your feedback for "${event.title}" has been successfully submitted. Thank you!`,
      type: 'feedback',
      link: `/events/${event._id}`
    });

    return sendSuccess(res, 'Feedback submitted successfully.', feedback, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all feedback and rating statistics for an event
 * @route   GET /api/feedback/event/:eventId
 * @access  Public / Optional Auth
 */
export const getEventFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    // 1. Fetch paginated feedback records
    const [feedbackList, totalReviews] = await Promise.all([
      Feedback.find({ event: eventId })
        .populate('student', 'name department year')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments({ event: eventId })
    ]);

    // 2. Calculate rating statistics and star distribution breakdown
    const aggregateStats = await Feedback.aggregate([
      { $match: { event: event._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          count2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          count3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          count4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          count5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
        }
      }
    ]);

    const statRecord = aggregateStats[0] || {
      avgRating: 0,
      count1: 0,
      count2: 0,
      count3: 0,
      count4: 0,
      count5: 0
    };

    const avgRatingFormatted = statRecord.avgRating
      ? Math.round(statRecord.avgRating * 10) / 10
      : 0;

    const breakdown = {
      5: { count: statRecord.count5, percentage: totalReviews ? Math.round((statRecord.count5 / totalReviews) * 100) : 0 },
      4: { count: statRecord.count4, percentage: totalReviews ? Math.round((statRecord.count4 / totalReviews) * 100) : 0 },
      3: { count: statRecord.count3, percentage: totalReviews ? Math.round((statRecord.count3 / totalReviews) * 100) : 0 },
      2: { count: statRecord.count2, percentage: totalReviews ? Math.round((statRecord.count2 / totalReviews) * 100) : 0 },
      1: { count: statRecord.count1, percentage: totalReviews ? Math.round((statRecord.count1 / totalReviews) * 100) : 0 }
    };

    return sendSuccess(
      res,
      'Event feedback retrieved successfully.',
      {
        feedback: feedbackList,
        stats: {
          averageRating: avgRatingFormatted,
          totalReviews,
          breakdown
        }
      },
      200,
      {
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit) || 1,
        totalItems: totalReviews
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check student eligibility to submit feedback for an event
 * @route   GET /api/feedback/event/:eventId/eligibility
 * @access  Private (Student only)
 */
export const checkFeedbackEligibility = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (req.user.role !== 'student') {
      return sendSuccess(res, 'Feedback status evaluated.', {
        eligible: false,
        reason: 'Only students can submit feedback.'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    // Check completed
    const completed = isEventCompleted(event);
    if (!completed) {
      return sendSuccess(res, 'Feedback status evaluated.', {
        eligible: false,
        isCompleted: false,
        reason: 'Event is ongoing or scheduled for a future time. Feedback opens upon completion.'
      });
    }

    // Check existing feedback
    const existing = await Feedback.findOne({
      event: eventId,
      student: req.user._id
    }).populate('student', 'name department');

    if (existing) {
      return sendSuccess(res, 'Feedback already submitted.', {
        eligible: false,
        hasSubmitted: true,
        feedback: existing,
        reason: 'You have already submitted feedback for this event.'
      });
    }

    // Check confirmed registration
    const registration = await Registration.findOne({
      event: eventId,
      student: req.user._id,
      status: 'confirmed'
    });

    if (!registration) {
      return sendSuccess(res, 'Feedback status evaluated.', {
        eligible: false,
        isRegistered: false,
        reason: 'You must have a confirmed registration to leave feedback.'
      });
    }

    // Check attendance
    const attendance = await Attendance.findOne({
      event: eventId,
      student: req.user._id
    });

    if (!attendance || attendance.status !== 'present') {
      return sendSuccess(res, 'Feedback status evaluated.', {
        eligible: false,
        isAttended: Boolean(attendance && attendance.status === 'present'),
        attendanceStatus: attendance ? attendance.status : 'unmarked',
        reason: 'Attendance record of "Present" is required to submit feedback.'
      });
    }

    // Eligible!
    return sendSuccess(res, 'Eligible to submit feedback.', {
      eligible: true,
      isCompleted: true,
      isRegistered: true,
      isAttended: true,
      hasSubmitted: false
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all feedback submitted by current student
 * @route   GET /api/feedback/my-feedback
 * @access  Private (Student only)
 */
export const getMyFeedback = async (req, res, next) => {
  try {
    const feedbackList = await Feedback.find({ student: req.user._id })
      .populate('event', 'title category date venue bannerImage organizer')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'My feedback retrieved successfully.', feedbackList);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update own feedback rating or comment
 * @route   PUT /api/feedback/:id
 * @access  Private (Student author only)
 */
export const updateFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return sendError(res, 'Feedback not found.', 404);
    }

    // Author check
    if (feedback.student.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: You can only update your own feedback.', 403);
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
        return sendError(res, 'Rating must be an integer between 1 and 5.', 400);
      }
      feedback.rating = numRating;
    }

    if (comment !== undefined) {
      const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
      if (trimmedComment.length < 5 || trimmedComment.length > 1000) {
        return sendError(res, 'Feedback comments must be between 5 and 1000 characters.', 400);
      }
      feedback.comment = trimmedComment;
    }

    feedback.submittedAt = new Date();
    await feedback.save();
    await feedback.populate('student', 'name department year email');

    return sendSuccess(res, 'Feedback updated successfully.', feedback);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete feedback (Author student or Admin)
 * @route   DELETE /api/feedback/:id
 * @access  Private (Author Student or Admin)
 */
export const deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return sendError(res, 'Feedback not found.', 404);
    }

    const isAuthor = feedback.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return sendError(res, 'Access denied: You are not authorized to delete this feedback.', 403);
    }

    await Feedback.findByIdAndDelete(id);

    // If Admin performed deletion, record audit log
    if (isAdmin && !isAuthor) {
      await AuditLog.create({
        action: 'DELETE_FEEDBACK',
        performedBy: req.user._id,
        targetModel: 'Feedback',
        targetId: feedback._id,
        details: {
          studentId: feedback.student,
          eventId: feedback.event,
          originalRating: feedback.rating,
          commentExcerpt: feedback.comment ? feedback.comment.substring(0, 100) : '',
          reason: req.body.reason || 'Admin Moderation'
        },
        ipAddress: req.ip || ''
      });
    }

    return sendSuccess(res, 'Feedback deleted successfully.', { id });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all feedback across campus for Admin Moderation
 * @route   GET /api/feedback/admin/all
 * @access  Private (Admin only)
 */
export const getAllFeedbackAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.rating) {
      const r = parseInt(req.query.rating, 10);
      if (r >= 1 && r <= 5) {
        query.rating = r;
      }
    }

    if (req.query.eventId) {
      query.event = req.query.eventId;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.comment = searchRegex;
    }

    const [feedbackList, total] = await Promise.all([
      Feedback.find(query)
        .populate('student', 'name email department year')
        .populate('event', 'title category venue date organizer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(query)
    ]);

    return sendSuccess(
      res,
      'Feedback list retrieved for moderation.',
      feedbackList,
      200,
      {
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        totalItems: total
      }
    );
  } catch (error) {
    next(error);
  }
};
