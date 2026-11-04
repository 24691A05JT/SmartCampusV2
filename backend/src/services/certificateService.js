import crypto from 'crypto';
import mongoose from 'mongoose';
import Certificate from '../models/Certificate.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { createNotification } from '../utils/notificationHelper.js';

// Dedicated signing secret (separate from JWT_SECRET) with versioning support
const CERTIFICATE_SIGNING_SECRET =
  process.env.CERTIFICATE_SIGNING_SECRET || 'smart_campus_cert_signing_secret_v1_secure_2026_98a2';
const HASH_VERSION = 'v1';

/**
 * Deterministic, tamper-proof cryptographic HMAC hash calculation
 * Fields covered: version, certificateId, studentId, eventId, ISO issueDate
 * @param {string} certificateId
 * @param {string|mongoose.Types.ObjectId} studentId
 * @param {string|mongoose.Types.ObjectId} eventId
 * @param {string|Date} issueDate
 * @returns {string} SHA-256 hex digest
 */
export const computeVerificationHash = (certificateId, studentId, eventId, issueDate) => {
  const isoDate = new Date(issueDate).toISOString();
  const payload = `${HASH_VERSION}:${String(certificateId).trim().toUpperCase()}:${String(studentId)}:${String(eventId)}:${isoDate}`;
  return crypto.createHmac('sha256', CERTIFICATE_SIGNING_SECRET).update(payload).digest('hex');
};

/**
 * Timing-safe comparison to prevent side-channel timing attacks
 * @param {string} certificateId
 * @param {string|mongoose.Types.ObjectId} studentId
 * @param {string|mongoose.Types.ObjectId} eventId
 * @param {string|Date} issueDate
 * @param {string} providedHash
 * @returns {boolean}
 */
export const verifyCertificateHash = (certificateId, studentId, eventId, issueDate, providedHash) => {
  if (!providedHash || typeof providedHash !== 'string') return false;
  try {
    const expectedHash = computeVerificationHash(certificateId, studentId, eventId, issueDate);
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const providedBuffer = Buffer.from(providedHash, 'hex');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (err) {
    return false;
  }
};

/**
 * Generate human-readable, unique uppercase certificate ID
 * @param {string} [category]
 * @returns {string} E.g., SC-2026-TEC-A87B-4F29
 */
export const generateCertificateId = (category = 'EVT') => {
  const year = new Date().getFullYear();
  const cleanCat = String(category).replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'EVT';
  const r1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const r2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `SC-${year}-${cleanCat}-${r1}-${r2}`;
};

/**
 * Verify if an event is officially concluded based on date and endTime
 * @param {Object} event
 * @returns {boolean}
 */
export const isEventCompleted = (event) => {
  if (!event || !event.date) return false;
  const eventDate = new Date(event.date);
  const [endHours, endMinutes] = (event.endTime || '23:59').split(':').map(Number);
  const eventEndDateTime = new Date(eventDate);
  eventEndDateTime.setHours(endHours || 23, endMinutes || 59, 59, 999);
  return new Date() >= eventEndDateTime;
};

/**
 * Verify individual student eligibility for certificate issuance
 * @param {string|mongoose.Types.ObjectId} eventId
 * @param {string|mongoose.Types.ObjectId} studentId
 * @returns {Promise<{eligible: boolean, reason?: string, event?: Object, student?: Object, attendance?: Object}>}
 */
export const checkStudentEligibility = async (eventId, studentId) => {
  const [event, student] = await Promise.all([
    Event.findById(eventId),
    User.findById(studentId)
  ]);

  if (!event) {
    return { eligible: false, reason: 'Event not found' };
  }

  if (event.status !== 'approved' || event.isCancelled) {
    return { eligible: false, reason: 'Event is not an active approved event' };
  }

  if (!isEventCompleted(event)) {
    return { eligible: false, reason: 'Event has not officially concluded yet' };
  }

  if (!student || student.role !== 'student') {
    return { eligible: false, reason: 'User is not a valid student' };
  }

  // 1. Check confirmed registration
  const registration = await Registration.findOne({
    event: eventId,
    student: studentId,
    status: 'confirmed'
  });
  if (!registration) {
    return { eligible: false, reason: 'Student does not have a confirmed registration for this event' };
  }

  // 2. Check verified attendance (status === 'present')
  const attendance = await Attendance.findOne({
    event: eventId,
    student: studentId
  });
  if (!attendance || attendance.status !== 'present') {
    return { eligible: false, reason: 'Student was not marked present for this event' };
  }

  // 3. Check for existing certificate
  const existingCert = await Certificate.findOne({ event: eventId, student: studentId });
  if (existingCert) {
    return {
      eligible: false,
      reason: 'Certificate already issued for this student and event',
      existingCertificate: existingCert
    };
  }

  return {
    eligible: true,
    event,
    student,
    attendance,
    registration
  };
};

/**
 * Issue a single certificate for an attended student
 * @param {Object} params
 * @param {string} params.eventId
 * @param {string} params.studentId
 * @param {Object} params.issuerUser (Organizer or Admin)
 */
export const issueSingleCertificate = async ({ eventId, studentId, issuerUser }) => {
  const eligibility = await checkStudentEligibility(eventId, studentId);
  if (!eligibility.eligible) {
    const error = new Error(eligibility.reason);
    error.statusCode = 400;
    if (eligibility.existingCertificate) {
      error.existingCertificate = eligibility.existingCertificate;
    }
    throw error;
  }

  const { event, student } = eligibility;

  // Organizer ownership check (Admin bypasses)
  if (issuerUser.role === 'organizer' && String(event.organizer) !== String(issuerUser._id)) {
    const error = new Error('Access forbidden: You can only issue certificates for events you organize.');
    error.statusCode = 403;
    throw error;
  }

  const certificateId = generateCertificateId(event.category);
  const issueDate = new Date();
  const verificationHash = computeVerificationHash(certificateId, student._id, event._id, issueDate);

  const certificate = await Certificate.create({
    certificateId,
    event: event._id,
    student: student._id,
    issueDate,
    verificationHash,
    status: 'valid'
  });

  // Notify student asynchronously
  createNotification({
    recipient: student._id,
    title: 'Certificate of Participation Issued!',
    message: `Your certificate for "${event.title}" is ready. You can now view and download your official PDF credential.`,
    type: 'certificate',
    link: '/student/certificates'
  }).catch((err) => console.error('Notification dispatch error:', err));

  return certificate;
};

/**
 * Issue batch certificates for all eligible attendees of an event
 * Handles duplicate-key errors gracefully without failing the entire batch
 * @param {Object} params
 * @param {string} params.eventId
 * @param {Object} params.issuerUser
 */
export const issueBatchCertificates = async ({ eventId, issuerUser }) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check
  if (issuerUser.role === 'organizer' && String(event.organizer) !== String(issuerUser._id)) {
    const error = new Error('Access forbidden: You can only issue certificates for your own events.');
    error.statusCode = 403;
    throw error;
  }

  if (event.status !== 'approved' || event.isCancelled) {
    const error = new Error('Certificates can only be issued for approved, active events.');
    error.statusCode = 400;
    throw error;
  }

  if (!isEventCompleted(event)) {
    const error = new Error('Certificates can only be issued after the event has officially concluded.');
    error.statusCode = 400;
    throw error;
  }

  // Find all attendance records marked present for this event
  const presentAttendances = await Attendance.find({
    event: event._id,
    status: 'present'
  }).populate('student', 'name email department year role');

  // Find all confirmed registrations for this event
  const confirmedRegistrations = await Registration.find({
    event: event._id,
    status: 'confirmed'
  }).select('student');

  const confirmedStudentIdSet = new Set(
    confirmedRegistrations.map((r) => String(r.student))
  );

  // Find all existing certificates for this event to avoid duplicate attempts
  const existingCerts = await Certificate.find({ event: event._id }).select('student');
  const alreadyIssuedSet = new Set(existingCerts.map((c) => String(c.student)));

  let generatedCount = 0;
  let alreadyIssuedCount = 0;
  let ineligibleCount = 0;
  let failedCount = 0;
  const generatedCertificates = [];

  for (const att of presentAttendances) {
    const student = att.student;
    if (!student || !student._id) continue;
    const studentIdStr = String(student._id);

    // 1. Check if already issued
    if (alreadyIssuedSet.has(studentIdStr)) {
      alreadyIssuedCount++;
      continue;
    }

    // 2. Check registration confirmation
    if (!confirmedStudentIdSet.has(studentIdStr)) {
      ineligibleCount++;
      continue;
    }

    // 3. Issue certificate safely
    try {
      const certificateId = generateCertificateId(event.category);
      const issueDate = new Date();
      const verificationHash = computeVerificationHash(certificateId, student._id, event._id, issueDate);

      const cert = await Certificate.create({
        certificateId,
        event: event._id,
        student: student._id,
        issueDate,
        verificationHash,
        status: 'valid'
      });

      generatedCertificates.push(cert);
      generatedCount++;
      alreadyIssuedSet.add(studentIdStr);

      // Async notification
      createNotification({
        recipient: student._id,
        title: 'Certificate of Participation Issued!',
        message: `Your certificate for "${event.title}" has been issued and is available for download.`,
        type: 'certificate',
        link: '/student/certificates'
      }).catch((err) => console.error('Notification dispatch error:', err));
    } catch (err) {
      if (err.code === 11000) {
        // Handled gracefully: duplicate key error
        alreadyIssuedCount++;
      } else {
        failedCount++;
      }
    }
  }

  return {
    eventId: event._id,
    eventTitle: event.title,
    totalPresent: presentAttendances.length,
    generatedCount,
    alreadyIssuedCount,
    ineligibleCount,
    failedCount,
    generatedCertificates
  };
};

/**
 * Public Verification Service
 * Returns ONLY non-sensitive, sanitized verification metadata
 * @param {string} certificateId
 */
export const verifyCertificatePublic = async (certificateId) => {
  if (!certificateId || typeof certificateId !== 'string') {
    return { isFound: false, message: 'A valid Certificate ID is required.' };
  }

  const cleanId = certificateId.trim().toUpperCase();
  const cert = await Certificate.findOne({ certificateId: cleanId })
    .populate('student', 'name department year')
    .populate('event', 'title category date startTime endTime venue');

  if (!cert) {
    return {
      isFound: false,
      isAuthentic: false,
      message: 'Certificate not found in the official registry.'
    };
  }

  // Cryptographic timing-safe authenticity check
  const isAuthentic = verifyCertificateHash(
    cert.certificateId,
    cert.student?._id || cert.student,
    cert.event?._id || cert.event,
    cert.issueDate,
    cert.verificationHash
  );

  return {
    isFound: true,
    isAuthentic,
    certificateId: cert.certificateId,
    status: cert.status, // 'valid' or 'revoked'
    studentName: cert.student?.name || 'Verified Student',
    department: cert.student?.department || 'General',
    academicYear: cert.student?.year || null,
    eventTitle: cert.event?.title || 'Campus Event',
    eventCategory: cert.event?.category || 'Activity',
    eventDate: cert.event?.date || null,
    venue: cert.event?.venue || 'Campus Facility',
    issueDate: cert.issueDate,
    verificationHash: cert.verificationHash
      ? `${cert.verificationHash.slice(0, 16)}...${cert.verificationHash.slice(-16)}`
      : 'Cryptographically Verified'
  };
};

/**
 * Revoke a certificate (Admin Only) with mandatory audit logging
 * @param {Object} params
 * @param {string} params.certificateId
 * @param {string} params.reason
 * @param {Object} params.adminUser
 * @param {string} [params.ipAddress]
 */
export const revokeCertificate = async ({ certificateId, reason, adminUser, ipAddress = '' }) => {
  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    const error = new Error('A detailed revocation reason (minimum 3 characters) is required.');
    error.statusCode = 400;
    throw error;
  }

  const cert = await Certificate.findOne({
    $or: [
      { certificateId: certificateId.trim().toUpperCase() },
      mongoose.Types.ObjectId.isValid(certificateId) ? { _id: certificateId } : { _id: null }
    ]
  }).populate('student', 'name email').populate('event', 'title');

  if (!cert) {
    const error = new Error('Certificate not found');
    error.statusCode = 404;
    throw error;
  }

  if (cert.status === 'revoked') {
    const error = new Error('Certificate is already revoked.');
    error.statusCode = 400;
    throw error;
  }

  cert.status = 'revoked';
  await cert.save();

  // Audit log entry
  await AuditLog.create({
    action: 'REVOKE_CERTIFICATE',
    performedBy: adminUser._id,
    targetModel: 'Certificate',
    targetId: cert._id,
    details: {
      certificateId: cert.certificateId,
      studentId: cert.student?._id || cert.student,
      eventId: cert.event?._id || cert.event,
      studentName: cert.student?.name,
      eventTitle: cert.event?.title,
      reason: reason.trim()
    },
    ipAddress
  });

  return cert;
};

/**
 * Reinstate a revoked certificate (Admin Only) with audit logging
 * @param {Object} params
 * @param {string} params.certificateId
 * @param {string} params.reason
 * @param {Object} params.adminUser
 * @param {string} [params.ipAddress]
 */
export const reinstateCertificate = async ({ certificateId, reason = '', adminUser, ipAddress = '' }) => {
  const cert = await Certificate.findOne({
    $or: [
      { certificateId: certificateId.trim().toUpperCase() },
      mongoose.Types.ObjectId.isValid(certificateId) ? { _id: certificateId } : { _id: null }
    ]
  }).populate('student', 'name email').populate('event', 'title');

  if (!cert) {
    const error = new Error('Certificate not found');
    error.statusCode = 404;
    throw error;
  }

  if (cert.status === 'valid') {
    const error = new Error('Certificate is already active and valid.');
    error.statusCode = 400;
    throw error;
  }

  cert.status = 'valid';
  await cert.save();

  // Audit log entry
  await AuditLog.create({
    action: 'REINSTATE_CERTIFICATE',
    performedBy: adminUser._id,
    targetModel: 'Certificate',
    targetId: cert._id,
    details: {
      certificateId: cert.certificateId,
      studentId: cert.student?._id || cert.student,
      eventId: cert.event?._id || cert.event,
      studentName: cert.student?.name,
      eventTitle: cert.event?.title,
      reason: reason.trim() || 'Administrative reinstatement'
    },
    ipAddress
  });

  return cert;
};
