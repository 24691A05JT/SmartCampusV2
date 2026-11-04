import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import AuditLog from '../models/AuditLog.js';
import { createNotification } from '../utils/notificationHelper.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

/**
 * @desc    Get Admin Dashboard Overview & Real-time Metrics
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
export const getAdminDashboardSummary = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalOrganizers,
      totalAdmins,
      activeUsers,
      totalEvents,
      pendingEvents,
      approvedEvents,
      totalRegistrations,
      totalCertificates,
      recentAuditLogs,
      pendingQueue
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'organizer' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      Event.countDocuments({}),
      Event.countDocuments({ status: 'pending' }),
      Event.countDocuments({ status: 'approved' }),
      Registration.countDocuments({ status: 'confirmed' }),
      Certificate.countDocuments({ status: 'valid' }),
      AuditLog.find({})
        .populate('performedBy', 'name email role department')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Event.find({ status: 'pending' })
        .populate('organizer', 'name email department')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    const totalUsers = totalStudents + totalOrganizers + totalAdmins;
    const deactivatedUsers = totalUsers - activeUsers;
    const totalAuditLogs = await AuditLog.countDocuments({});

    const summaryPayload = {
      totalUsers,
      totalStudents,
      totalOrganizers,
      totalAdmins,
      activeUsers,
      deactivatedUsers,
      suspendedUsers: deactivatedUsers,
      totalEvents,
      pendingEvents,
      approvedEvents,
      totalRegistrations,
      totalCertificates,
      totalCertificatesIssued: totalCertificates,
      totalAuditLogs
    };

    return sendSuccess(res, 'Admin dashboard summary retrieved successfully.', {
      metrics: summaryPayload,
      summary: summaryPayload,
      recentAuditLogs,
      recentLogs: recentAuditLogs,
      pendingQueue
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Paginated Campus Users with Search & Filtering
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getUsersAdmin = async (req, res, next) => {
  try {
    const {
      search,
      role,
      department,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // 1. Role filter
    if (role && ['student', 'organizer', 'admin'].includes(role)) {
      query.role = role;
    }

    // 2. Active status filter
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // 3. Department filter
    if (department && department.trim() && department !== 'All') {
      query.department = department.trim();
    }

    // 4. Keyword search (Name or Email)
    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query)
    ]);

    return sendSuccess(res, 'Users retrieved successfully.', {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Detailed User Profile & Campus Engagement Dossier
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const getUserDetailAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid user ID format.', 400);
    }

    const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    let stats = {};

    if (user.role === 'student') {
      const [registrationsCount, attendanceCount, certificatesCount] = await Promise.all([
        Registration.countDocuments({ student: user._id, status: 'confirmed' }),
        Attendance.countDocuments({ student: user._id, status: 'present' }),
        Certificate.countDocuments({ student: user._id, status: 'valid' })
      ]);
      stats = {
        confirmedRegistrations: registrationsCount,
        attendedEvents: attendanceCount,
        earnedCertificates: certificatesCount
      };
    } else if (user.role === 'organizer') {
      const [eventsCount, approvedEventsCount] = await Promise.all([
        Event.countDocuments({ organizer: user._id }),
        Event.countDocuments({ organizer: user._id, status: 'approved' })
      ]);
      stats = {
        totalCreatedEvents: eventsCount,
        approvedEvents: approvedEventsCount
      };
    }

    return sendSuccess(res, 'User details retrieved successfully.', {
      user,
      stats
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update User Account Status (Suspend/Deactivate or Reactivate)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
export const updateUserStatusAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid user ID format.', 400);
    }

    if (typeof isActive !== 'boolean') {
      return sendError(res, 'Field "isActive" must be a boolean (true or false).', 400);
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return sendError(res, 'A detailed reason (minimum 3 characters) is mandatory for account status modifications.', 400);
    }

    // Prevent self-deactivation by admin
    if (String(req.user._id) === String(id)) {
      return sendError(res, 'Administrators cannot deactivate their own account.', 400);
    }

    const previousState = !isActive;
    const user = await User.findOneAndUpdate(
      { _id: id, isActive: previousState },
      { $set: { isActive } },
      { new: true }
    );

    if (!user) {
      const existing = await User.findById(id);
      if (!existing) {
        return sendError(res, 'User not found.', 404);
      }
      return sendError(
        res,
        `User account is already ${isActive ? 'active' : 'deactivated/suspended'}.`,
        400
      );
    }

    try {
      // Mandatory Audit Logging (Never proceed silently if audit fails)
      const action = isActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED';
      await AuditLog.create({
        action,
        performedBy: req.user._id,
        targetModel: 'User',
        targetId: user._id,
        details: {
          targetName: user.name,
          targetEmail: user.email,
          targetRole: user.role,
          previousState,
          newState: isActive,
          reason: reason.trim()
        },
        ipAddress: req.ip || req.socket?.remoteAddress || ''
      });
    } catch (auditErr) {
      // Rollback user status
      await User.findByIdAndUpdate(id, { $set: { isActive: previousState } });
      throw new Error(`Mandatory audit logging failed: ${auditErr.message}. Account status change rolled back.`);
    }

    // Notify user asynchronously
    createNotification({
      recipient: user._id,
      title: isActive ? 'Account Reinstated' : 'Account Access Suspended',
      message: isActive
        ? `Your campus account access has been restored by administration. Note: ${reason.trim()}`
        : `Your campus account has been suspended by administration. Reason: ${reason.trim()}`,
      type: 'system',
      link: '/profile'
    }).catch((err) => console.error('Notification dispatch error:', err));

    return sendSuccess(res, `User account ${isActive ? 'reactivated' : 'suspended'} successfully.`, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Query Institutional Audit Logs with Filters & Pagination
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin only)
 */
export const getAuditLogsAdmin = async (req, res, next) => {
  try {
    const {
      action,
      targetModel,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // 1. Action filter
    if (action && action.trim() && action !== 'All') {
      query.action = action.trim();
    }

    // 2. Target Model filter
    if (targetModel && targetModel.trim() && targetModel !== 'All') {
      query.targetModel = targetModel.trim();
    }

    // 3. Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return sendError(res, 'Invalid startDate format.', 400);
        }
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return sendError(res, 'Invalid endDate format.', 400);
        }
        // Include until end of day
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }

      if (query.createdAt.$gte && query.createdAt.$lte && query.createdAt.$gte > query.createdAt.$lte) {
        return sendError(res, 'startDate cannot be later than endDate.', 400);
      }
    }

    // 4. Keyword Search
    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { action: { $regex: escaped, $options: 'i' } },
        { targetModel: { $regex: escaped, $options: 'i' } },
        { 'details.reason': { $regex: escaped, $options: 'i' } },
        { 'details.targetEmail': { $regex: escaped, $options: 'i' } },
        { 'details.certificateId': { $regex: escaped, $options: 'i' } },
        { 'details.eventTitle': { $regex: escaped, $options: 'i' } }
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'name email role department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return sendSuccess(res, 'Audit logs retrieved successfully.', {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Campus-Wide Event Registrations with Filters
 * @route   GET /api/admin/registrations
 * @access  Private (Admin only)
 */
export const getRegistrationsAdmin = async (req, res, next) => {
  try {
    const {
      search,
      status,
      eventId,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status && ['confirmed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      query.event = eventId;
    }

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      const [matchingStudents, matchingEvents] = await Promise.all([
        User.find({
          $or: [
            { name: { $regex: escaped, $options: 'i' } },
            { email: { $regex: escaped, $options: 'i' } }
          ]
        }).select('_id'),
        Event.find({
          title: { $regex: escaped, $options: 'i' }
        }).select('_id')
      ]);

      query.$or = [
        { ticketCode: { $regex: escaped, $options: 'i' } },
        { student: { $in: matchingStudents.map((s) => s._id) } },
        { event: { $in: matchingEvents.map((e) => e._id) } }
      ];
    }

    const [registrations, total] = await Promise.all([
      Registration.find(query)
        .populate('student', 'name email department year')
        .populate('event', 'title category date startTime endTime venue capacity registeredCount isCancelled')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Registration.countDocuments(query)
    ]);

    return sendSuccess(res, 'Registrations retrieved successfully.', {
      registrations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Administrative Registration Cancellation with Audit Trail & Capacity Update
 * @route   PATCH /api/admin/registrations/:id/cancel
 * @access  Private (Admin only)
 */
export const cancelRegistrationAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid registration ID format.', 400);
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return sendError(res, 'A mandatory cancellation reason (minimum 3 characters) is required.', 400);
    }

    const registration = await Registration.findOneAndUpdate(
      { _id: id, status: 'confirmed' },
      { $set: { status: 'cancelled', cancelledAt: new Date() } },
      { new: true }
    ).populate('student', 'name email').populate('event', 'title registeredCount');

    if (!registration) {
      const existing = await Registration.findById(id);
      if (!existing) {
        return sendError(res, 'Registration not found.', 404);
      }
      return sendError(res, 'Registration is already cancelled.', 400);
    }

    // Decrement event registeredCount safely (prevent negative count)
    await Event.findOneAndUpdate(
      { _id: registration.event._id, registeredCount: { $gt: 0 } },
      { $inc: { registeredCount: -1 } }
    );

    try {
      // Mandatory Audit Logging
      await AuditLog.create({
        action: 'REGISTRATION_CANCELLED_BY_ADMIN',
        performedBy: req.user._id,
        targetModel: 'Registration',
        targetId: registration._id,
        details: {
          ticketCode: registration.ticketCode,
          studentId: registration.student?._id,
          studentName: registration.student?.name,
          eventId: registration.event?._id,
          eventTitle: registration.event?.title,
          reason: reason.trim()
        },
        ipAddress: req.ip || req.socket?.remoteAddress || ''
      });
    } catch (auditErr) {
      // Rollback status and capacity
      await Registration.findByIdAndUpdate(id, { $set: { status: 'confirmed', cancelledAt: null } });
      await Event.findByIdAndUpdate(registration.event._id, { $inc: { registeredCount: 1 } });
      throw new Error(`Mandatory audit logging failed: ${auditErr.message}. Registration cancellation rolled back.`);
    }

    // 4. Notify Student
    if (registration.student?._id) {
      createNotification({
        recipient: registration.student._id,
        title: 'Event Registration Cancelled by Administration',
        message: `Your seat reservation for "${registration.event?.title}" (Ticket: ${registration.ticketCode}) was cancelled. Reason: ${reason.trim()}`,
        type: 'registration',
        link: '/student/registrations'
      }).catch((err) => console.error('Notification dispatch error:', err));
    }

    return sendSuccess(res, 'Registration cancelled by administration successfully.', registration);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Administrative Event Cancellation with Notifications & Audit
 * @route   PATCH /api/admin/events/:id/cancel
 * @access  Private (Admin only)
 */
export const cancelEventAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid event ID format.', 400);
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return sendError(res, 'A mandatory cancellation reason (minimum 3 characters) is required.', 400);
    }

    const event = await Event.findOneAndUpdate(
      { _id: id, isCancelled: false },
      { $set: { isCancelled: true } },
      { new: true }
    ).populate('organizer', 'name email');

    if (!event) {
      const existing = await Event.findById(id);
      if (!existing) {
        return sendError(res, 'Event not found.', 404);
      }
      return sendError(res, 'Event is already cancelled.', 400);
    }

    try {
      // Mandatory Audit Logging
      await AuditLog.create({
        action: 'EVENT_CANCELLED_BY_ADMIN',
        performedBy: req.user._id,
        targetModel: 'Event',
        targetId: event._id,
        details: {
          eventTitle: event.title,
          organizerId: event.organizer?._id,
          organizerName: event.organizer?.name,
          venue: event.venue,
          date: event.date,
          reason: reason.trim()
        },
        ipAddress: req.ip || req.socket?.remoteAddress || ''
      });
    } catch (auditErr) {
      await Event.findByIdAndUpdate(id, { $set: { isCancelled: false } });
      throw new Error(`Mandatory audit logging failed: ${auditErr.message}. Event cancellation rolled back.`);
    }

    // 2. Notify Event Organizer
    if (event.organizer?._id) {
      createNotification({
        recipient: event.organizer._id,
        title: 'Event Cancelled by Campus Administration',
        message: `Your event "${event.title}" has been cancelled by administration. Reason: ${reason.trim()}`,
        type: 'event_update',
        link: `/organizer/events`
      }).catch((err) => console.error('Notification dispatch error:', err));
    }

    // 3. Notify Confirmed Registered Students (prevent duplicates)
    const confirmedRegistrations = await Registration.find({
      event: event._id,
      status: 'confirmed'
    }).select('student');

    const notifiedStudentIds = new Set();
    for (const reg of confirmedRegistrations) {
      const sId = String(reg.student);
      if (!notifiedStudentIds.has(sId)) {
        notifiedStudentIds.add(sId);
        createNotification({
          recipient: reg.student,
          title: 'Event Cancelled',
          message: `The event "${event.title}" you were registered for has been cancelled by campus administration. Reason: ${reason.trim()}`,
          type: 'event_update',
          link: '/student/registrations'
        }).catch((err) => console.error('Notification dispatch error:', err));
      }
    }

    return sendSuccess(res, 'Event cancelled by administration successfully.', {
      _id: event._id,
      title: event.title,
      isCancelled: event.isCancelled,
      notifiedAttendeesCount: notifiedStudentIds.size
    });
  } catch (err) {
    next(err);
  }
};
