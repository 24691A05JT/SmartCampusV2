import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Helper to check organizer ownership or admin permission for an event
 */
const verifyEventAuthorization = async (eventId, user) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return { error: 'Invalid event ID format.', status: 400 };
  }

  const event = await Event.findById(eventId).populate('organizer', 'name email department');
  if (!event) {
    return { error: 'Event not found.', status: 404 };
  }

  if (user.role === 'admin') {
    return { event };
  }

  if (user.role === 'organizer') {
    const isOwner = event.organizer && event.organizer._id.toString() === user._id.toString();
    if (!isOwner) {
      return {
        error: 'Access forbidden: You are not authorized to manage attendance for this event.',
        status: 403
      };
    }
    return { event };
  }

  return { error: 'Access forbidden: Insufficient permissions.', status: 403 };
};

/**
 * @desc    Get Event Participant Roster with Attendance Status & KPIs
 * @route   GET /api/attendance/event/:eventId
 * @access  Private (Event Organizer or Admin)
 */
export const getEventParticipants = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const authCheck = await verifyEventAuthorization(eventId, req.user);
    if (authCheck.error) {
      return sendError(res, authCheck.error, authCheck.status);
    }

    const event = authCheck.event;

    // 1. Fetch all confirmed registrations for this event
    const registrations = await Registration.find({
      event: eventId,
      status: 'confirmed'
    })
      .populate('student', 'name email department year semester')
      .sort({ registrationDate: 1 })
      .lean();

    // 2. Fetch existing attendance records
    const attendances = await Attendance.find({ event: eventId })
      .populate('markedBy', 'name email')
      .lean();

    const attendanceMap = new Map();
    attendances.forEach((att) => {
      if (att.student) {
        attendanceMap.set(att.student.toString(), att);
      }
    });

    // 3. Merge participant roster with attendance details
    let presentCount = 0;
    let absentCount = 0;

    const participants = registrations.map((reg) => {
      const studentId = reg.student?._id ? reg.student._id.toString() : '';
      const att = attendanceMap.get(studentId);

      let status = 'unmarked';
      let markedAt = null;
      let markedBy = null;
      let remarks = '';

      if (att) {
        status = att.status;
        markedAt = att.markedAt;
        markedBy = att.markedBy;
        remarks = att.remarks || '';

        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
      }

      return {
        registrationId: reg._id,
        ticketCode: reg.ticketCode,
        registrationDate: reg.registrationDate,
        student: reg.student,
        attendance: {
          attendanceId: att ? att._id : null,
          status,
          markedAt,
          markedBy,
          remarks
        }
      };
    });

    const totalConfirmed = registrations.length;
    const unmarkedCount = totalConfirmed - (presentCount + absentCount);
    const attendanceRate = totalConfirmed > 0 ? Math.round((presentCount / totalConfirmed) * 100) : 0;

    return sendSuccess(res, 'Participant roster retrieved successfully.', {
      event: {
        _id: event._id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        capacity: event.capacity,
        registeredCount: event.registeredCount,
        organizer: event.organizer
      },
      stats: {
        totalConfirmed,
        presentCount,
        absentCount,
        unmarkedCount,
        attendanceRate
      },
      participants
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark Individual Student Attendance
 * @route   POST /api/attendance/mark
 * @access  Private (Event Organizer or Admin)
 */
export const markAttendance = async (req, res, next) => {
  try {
    const { eventId, studentId, status, remarks = '' } = req.body;

    if (!eventId || !studentId || !status) {
      return sendError(res, 'Please provide eventId, studentId, and status.', 400);
    }

    if (!['present', 'absent'].includes(status)) {
      return sendError(res, "Status must be either 'present' or 'absent'.", 400);
    }

    const authCheck = await verifyEventAuthorization(eventId, req.user);
    if (authCheck.error) {
      return sendError(res, authCheck.error, authCheck.status);
    }
    const event = authCheck.event;

    // Verify student has a confirmed registration for this event
    const registration = await Registration.findOne({
      event: eventId,
      student: studentId,
      status: 'confirmed'
    });

    if (!registration) {
      return sendError(
        res,
        'Cannot mark attendance: Student does not have a confirmed registration for this event.',
        400
      );
    }

    // Upsert attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { event: eventId, student: studentId },
      {
        registration: registration._id,
        status,
        markedBy: req.user._id,
        markedAt: new Date(),
        remarks: remarks.trim()
      },
      { upsert: true, new: true, runValidators: true }
    ).populate([
      { path: 'student', select: 'name email department year' },
      { path: 'markedBy', select: 'name email' }
    ]);

    // Audit logging
    await AuditLog.create({
      action: 'ATTENDANCE_MARKED',
      performedBy: req.user._id,
      targetModel: 'Attendance',
      targetId: attendance._id,
      details: {
        eventId,
        studentId,
        status,
        remarks: remarks.trim()
      },
      ipAddress: req.ip || ''
    });

    // In-app Notification for student
    await Notification.create({
      recipient: studentId,
      title: 'Attendance Recorded',
      message: `Your attendance for "${event.title}" has been recorded as ${status.toUpperCase()}.`,
      type: 'attendance',
      link: '/student/registrations'
    });

    return sendSuccess(res, `Attendance marked as ${status}.`, attendance);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk Mark Attendance for Multiple Students
 * @route   POST /api/attendance/bulk-mark
 * @access  Private (Event Organizer or Admin)
 */
export const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { eventId, records } = req.body;

    if (!eventId || !Array.isArray(records) || records.length === 0) {
      return sendError(res, 'Please provide eventId and a non-empty records array.', 400);
    }

    const authCheck = await verifyEventAuthorization(eventId, req.user);
    if (authCheck.error) {
      return sendError(res, authCheck.error, authCheck.status);
    }
    const event = authCheck.event;

    // Fetch confirmed registrations for validation
    const confirmedRegistrations = await Registration.find({
      event: eventId,
      status: 'confirmed'
    }).lean();

    const regMap = new Map();
    confirmedRegistrations.forEach((r) => {
      regMap.set(r.student.toString(), r._id);
    });

    const now = new Date();
    const updatedAttendances = [];
    let successCount = 0;
    const errors = [];

    for (const item of records) {
      const { studentId, status, remarks = '' } = item;

      if (!studentId || !['present', 'absent'].includes(status)) {
        errors.push({ studentId, error: "Invalid status or missing studentId. Must be 'present' or 'absent'." });
        continue;
      }

      const regId = regMap.get(studentId.toString());
      if (!regId) {
        errors.push({ studentId, error: 'Student does not have a confirmed registration for this event.' });
        continue;
      }

      const att = await Attendance.findOneAndUpdate(
        { event: eventId, student: studentId },
        {
          registration: regId,
          status,
          markedBy: req.user._id,
          markedAt: now,
          remarks: (remarks || '').trim()
        },
        { upsert: true, new: true, runValidators: true }
      );

      updatedAttendances.push(att);
      successCount++;
    }

    // Audit Log
    await AuditLog.create({
      action: 'BULK_ATTENDANCE_MARKED',
      performedBy: req.user._id,
      targetModel: 'Attendance',
      details: {
        eventId,
        updatedCount: successCount,
        failedCount: errors.length
      },
      ipAddress: req.ip || ''
    });

    return sendSuccess(res, `Bulk attendance updated: ${successCount} processed successfully.`, {
      successCount,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Current Student's Attendance Records & Stats
 * @route   GET /api/attendance/my-attendance
 * @access  Private (Student only)
 */
export const getMyAttendance = async (req, res, next) => {
  try {
    const attendances = await Attendance.find({ student: req.user._id })
      .populate({
        path: 'event',
        select: 'title category date startTime endTime venue bannerImage'
      })
      .sort({ markedAt: -1 })
      .lean();

    const presentCount = attendances.filter((a) => a.status === 'present').length;
    const absentCount = attendances.filter((a) => a.status === 'absent').length;
    const totalRecords = attendances.length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    return sendSuccess(res, 'Student attendance history retrieved successfully.', {
      stats: {
        totalRecords,
        presentCount,
        absentCount,
        attendanceRate
      },
      records: attendances
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Event Attendance Statistics
 * @route   GET /api/attendance/event/:eventId/stats
 * @access  Private (Event Organizer or Admin)
 */
export const getAttendanceStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const authCheck = await verifyEventAuthorization(eventId, req.user);
    if (authCheck.error) {
      return sendError(res, authCheck.error, authCheck.status);
    }

    const totalConfirmed = await Registration.countDocuments({
      event: eventId,
      status: 'confirmed'
    });

    const presentCount = await Attendance.countDocuments({
      event: eventId,
      status: 'present'
    });

    const absentCount = await Attendance.countDocuments({
      event: eventId,
      status: 'absent'
    });

    const unmarkedCount = totalConfirmed - (presentCount + absentCount);
    const attendanceRate = totalConfirmed > 0 ? Math.round((presentCount / totalConfirmed) * 100) : 0;

    return sendSuccess(res, 'Event attendance statistics retrieved.', {
      eventId,
      totalConfirmed,
      presentCount,
      absentCount,
      unmarkedCount,
      attendanceRate
    });
  } catch (err) {
    next(err);
  }
};
