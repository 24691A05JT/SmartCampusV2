import mongoose from 'mongoose';
import Certificate from '../models/Certificate.js';
import Event from '../models/Event.js';
import Attendance from '../models/Attendance.js';
import Registration from '../models/Registration.js';
import {
  issueSingleCertificate,
  issueBatchCertificates,
  verifyCertificatePublic,
  revokeCertificate,
  reinstateCertificate,
  isEventCompleted
} from '../services/certificateService.js';
import { generateCertificatePDF } from '../services/pdfService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Get All Certificates Earned by the Authenticated Student
 * @route   GET /api/certificates/my-certificates
 * @access  Private (Student)
 */
export const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate({
        path: 'event',
        select: 'title category date startTime endTime venue bannerImage organizer',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Student certificates retrieved successfully.', certificates);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Completed Events Where Student Attended (Eligible for Certificate)
 * @route   GET /api/certificates/eligible
 * @access  Private (Student)
 */
export const getEligibleCertificates = async (req, res, next) => {
  try {
    // 1. Find all verified present attendances for student
    const presentAttendances = await Attendance.find({
      student: req.user._id,
      status: 'present'
    })
      .populate({
        path: 'event',
        select: 'title category date startTime endTime venue bannerImage status isCancelled'
      })
      .lean();

    // 2. Filter for concluded active events
    const eligibleEvents = presentAttendances
      .filter((att) => {
        const ev = att.event;
        return ev && ev.status === 'approved' && !ev.isCancelled && isEventCompleted(ev);
      })
      .map((att) => att.event);

    // 3. Find already issued certificates for this student
    const issuedCerts = await Certificate.find({ student: req.user._id }).select('event status certificateId').lean();
    const certMap = new Map();
    issuedCerts.forEach((c) => {
      certMap.set(String(c.event), {
        certificateId: c.certificateId,
        status: c.status
      });
    });

    const results = eligibleEvents.map((ev) => ({
      event: ev,
      certificate: certMap.get(String(ev._id)) || null,
      isIssued: certMap.has(String(ev._id))
    }));

    return sendSuccess(res, 'Eligible events retrieved successfully.', results);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Specific Certificate Metadata
 * @route   GET /api/certificates/:id
 * @access  Private (Student owner, Event Organizer, Admin)
 */
export const getCertificateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findOne({
      $or: [
        { certificateId: String(id).trim().toUpperCase() },
        mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { _id: null }
      ]
    })
      .populate('student', 'name email department year')
      .populate({
        path: 'event',
        select: 'title category date startTime endTime venue bannerImage organizer',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      });

  if (!cert) {
    return sendError(res, 'Certificate not found.', 404);
  }

  // Permission Check
  const isOwner = String(cert.student?._id || cert.student) === String(req.user._id);
  const isOrganizer = String(cert.event?.organizer?._id || cert.event?.organizer) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isOrganizer && !isAdmin) {
    return sendError(res, 'Access forbidden: You do not have permission to view this certificate.', 403);
  }

  return sendSuccess(res, 'Certificate metadata retrieved successfully.', cert);
} catch (err) {
  next(err);
}
};

/**
 * @desc    Download Official Vector-Rendered PDF Certificate
 * @route   GET /api/certificates/:id/download
 * @access  Private (Student owner, Event Organizer, Admin)
 */
export const downloadCertificatePDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findOne({
      $or: [
        { certificateId: String(id).trim().toUpperCase() },
        mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { _id: null }
      ]
    })
      .populate('student', 'name department year')
      .populate({
        path: 'event',
        select: 'title category date startTime endTime venue organizer',
        populate: {
          path: 'organizer',
          select: 'name'
        }
      });

    if (!cert) {
      return sendError(res, 'Certificate not found.', 404);
    }

    // Permission Check
    const isOwner = String(cert.student?._id || cert.student) === String(req.user._id);
    const isOrganizer = String(cert.event?.organizer?._id || cert.event?.organizer) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isOrganizer && !isAdmin) {
      return sendError(res, 'Access forbidden: You do not have permission to download this certificate.', 403);
    }

    // Policy for Revoked Certificates:
    // Revoked certificates cannot be downloaded as active credentials.
    // If an Admin explicitly passes ?allowRevoked=true, a watermarked PDF is rendered.
    if (cert.status === 'revoked' && !(isAdmin && req.query.allowRevoked === 'true')) {
      return sendError(
        res,
        'This certificate has been revoked by campus administration and cannot be downloaded.',
        400
      );
    }

    // Generate high-DPI vector PDF
    const pdfBuffer = await generateCertificatePDF({
      certificateId: cert.certificateId,
      studentName: cert.student?.name || 'Honored Student',
      department: cert.student?.department || 'General Academic Studies',
      year: cert.student?.year || null,
      eventTitle: cert.event?.title || 'Campus Event',
      eventCategory: cert.event?.category || 'Activity',
      eventDate: cert.event?.date || new Date(),
      venue: cert.event?.venue || 'Campus Center',
      issueDate: cert.issueDate || new Date(),
      verificationHash: cert.verificationHash,
      organizerName: cert.event?.organizer?.name || 'Faculty Event Convener',
      status: cert.status
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="SmartCampus-Certificate-${cert.certificateId}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Issue Single Certificate
 * @route   POST /api/certificates/generate/single
 * @access  Private (Organizer of event, Admin)
 */
export const generateSingleCertificateController = async (req, res, next) => {
  try {
    const { eventId, studentId } = req.body;

    if (!eventId || !studentId) {
      return sendError(res, 'Event ID and Student ID are required to issue a certificate.', 400);
    }

    const certificate = await issueSingleCertificate({
      eventId,
      studentId,
      issuerUser: req.user
    });

    return sendSuccess(res, 'Certificate issued successfully.', certificate, 201);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * @desc    Batch Issue Certificates for All Present Attendees
 * @route   POST /api/certificates/generate/batch/:eventId
 * @access  Private (Organizer of event, Admin)
 */
export const generateBatchCertificatesController = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return sendError(res, 'Event ID parameter is required.', 400);
    }

    const result = await issueBatchCertificates({
      eventId,
      issuerUser: req.user
    });

    return sendSuccess(res, 'Batch certificate generation completed.', result);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * @desc    Get All Issued Certificates for a Specific Event
 * @route   GET /api/certificates/event/:eventId
 * @access  Private (Organizer of event, Admin)
 */
export const getEventCertificatesController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    if (req.user.role === 'organizer' && String(event.organizer) !== String(req.user._id)) {
      return sendError(res, 'Access forbidden: You can only view certificates for your own events.', 403);
    }

    const certificates = await Certificate.find({ event: eventId })
      .populate('student', 'name email department year')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Event certificates retrieved successfully.', certificates);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin Certificate Registry (Search, Filter, Pagination)
 * @route   GET /api/certificates/admin/all
 * @access  Private (Admin only)
 */
export const getAdminCertificatesController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && ['valid', 'revoked'].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      query.certificateId = { $regex: search.trim(), $options: 'i' };
    }

    const [certificates, total] = await Promise.all([
      Certificate.find(query)
        .populate('student', 'name email department year')
        .populate('event', 'title category date venue organizer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Certificate.countDocuments(query)
    ]);

    return sendSuccess(res, 'Admin certificate registry retrieved successfully.', {
      certificates,
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
 * @desc    Revoke a Certificate
 * @route   PATCH /api/certificates/:id/revoke
 * @access  Private (Admin only)
 */
export const revokeCertificateController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cert = await revokeCertificate({
      certificateId: id,
      reason,
      adminUser: req.user,
      ipAddress: req.ip || req.socket?.remoteAddress
    });

    return sendSuccess(res, 'Certificate revoked successfully.', cert);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * @desc    Reinstate a Revoked Certificate
 * @route   PATCH /api/certificates/:id/reinstate
 * @access  Private (Admin only)
 */
export const reinstateCertificateController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cert = await reinstateCertificate({
      certificateId: id,
      reason,
      adminUser: req.user,
      ipAddress: req.ip || req.socket?.remoteAddress
    });

    return sendSuccess(res, 'Certificate reinstated successfully.', cert);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * @desc    Public Certificate Verification
 * @route   GET /api/certificates/verify/:certificateId
 * @access  Public (No Auth Required)
 */
export const verifyCertificateController = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const result = await verifyCertificatePublic(certificateId);

    if (!result.isFound) {
      return sendError(res, result.message || 'Certificate not found in official registry.', 404);
    }

    return sendSuccess(res, 'Certificate verification result.', result);
  } catch (err) {
    next(err);
  }
};
