import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import Registration from '../src/models/Registration.js';
import Attendance from '../src/models/Attendance.js';
import Certificate from '../src/models/Certificate.js';
import AuditLog from '../src/models/AuditLog.js';

let mongod;
jest.setTimeout(60000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Phase 9: Certificate Management API Suite', () => {
  let organizer1Token, organizer1User;
  let organizer2Token, organizer2User;
  let student1Token, student1User;
  let student2Token, student2User;
  let studentAbsentToken, studentAbsentUser;
  let adminToken, adminUser;
  let completedEvent, upcomingEvent;

  beforeEach(async () => {
    // 1. Create Organizer 1
    const org1Res = await request(app).post('/api/auth/register').send({
      name: 'Dr. Sarah Connor',
      email: 'sarah.connor@campus.edu',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'organizer',
      department: 'Computer Science'
    });
    organizer1Token = org1Res.body.data.token;
    organizer1User = org1Res.body.data.user;

    // 2. Create Organizer 2
    const org2Res = await request(app).post('/api/auth/register').send({
      name: 'Prof. Charles Xavier',
      email: 'charles.xavier@campus.edu',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'organizer',
      department: 'Physics'
    });
    organizer2Token = org2Res.body.data.token;
    organizer2User = org2Res.body.data.user;

    // 3. Create Student 1 (Attendee)
    const stu1Res = await request(app).post('/api/auth/register').send({
      name: 'Alice Johnson',
      email: 'alice.johnson@campus.edu',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'student',
      department: 'Computer Science',
      year: 3
    });
    student1Token = stu1Res.body.data.token;
    student1User = stu1Res.body.data.user;

    // 4. Create Student 2 (Attendee)
    const stu2Res = await request(app).post('/api/auth/register').send({
      name: 'Bob Smith',
      email: 'bob.smith@campus.edu',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'student',
      department: 'Computer Science',
      year: 2
    });
    student2Token = stu2Res.body.data.token;
    student2User = stu2Res.body.data.user;

    // 5. Create Student 3 (Absent Student)
    const stuAbsentRes = await request(app).post('/api/auth/register').send({
      name: 'Charlie Brown',
      email: 'charlie.brown@campus.edu',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'student',
      department: 'Mechanical',
      year: 1
    });
    studentAbsentToken = stuAbsentRes.body.data.token;
    studentAbsentUser = stuAbsentRes.body.data.user;

    // 6. Create Admin
    const rawAdmin = await User.create({
      name: 'Campus Provost Admin',
      email: 'provost.admin@campus.edu',
      password: 'AdminPassword123!',
      role: 'admin',
      department: 'Administration',
      isActive: true
    });
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'provost.admin@campus.edu',
      password: 'AdminPassword123!'
    });
    adminToken = adminLoginRes.body.data.token;
    adminUser = adminLoginRes.body.data.user;

    // 7. Seed Past / Completed Event (Concluded yesterday)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    completedEvent = await Event.create({
      title: 'Full-Stack Web Innovation Hackathon 2026',
      description: 'A 24-hour hands-on full-stack development hackathon.',
      organizer: organizer1User._id,
      category: 'Hackathon',
      date: yesterday,
      startTime: '09:00',
      endTime: '18:00',
      venue: 'Innovation Center Lab A',
      capacity: 50,
      registeredCount: 3,
      registrationDeadline: new Date(Date.now() - 48 * 60 * 60 * 1000),
      status: 'approved',
      isCancelled: false
    });

    // 8. Seed Upcoming Event (Tomorrow)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    upcomingEvent = await Event.create({
      title: 'Future AI & Robotics Symposium',
      description: 'Keynotes on intelligent autonomous agents.',
      organizer: organizer1User._id,
      category: 'Technical',
      date: tomorrow,
      startTime: '10:00',
      endTime: '16:00',
      venue: 'Auditorium Hall',
      capacity: 100,
      registeredCount: 1,
      registrationDeadline: tomorrow,
      status: 'approved',
      isCancelled: false
    });

    // 9. Seed Registrations for Completed Event
    const reg1 = await Registration.create({
      event: completedEvent._id,
      student: student1User._id,
      ticketCode: 'TKT-ALICE-1001',
      status: 'confirmed'
    });
    const reg2 = await Registration.create({
      event: completedEvent._id,
      student: student2User._id,
      ticketCode: 'TKT-BOB-1002',
      status: 'confirmed'
    });
    const regAbsent = await Registration.create({
      event: completedEvent._id,
      student: studentAbsentUser._id,
      ticketCode: 'TKT-CHARLIE-1003',
      status: 'confirmed'
    });

    // 10. Seed Attendance Records
    await Attendance.create({
      event: completedEvent._id,
      student: student1User._id,
      registration: reg1._id,
      status: 'present',
      markedBy: organizer1User._id,
      markedAt: new Date(Date.now() - 20 * 60 * 60 * 1000)
    });
    await Attendance.create({
      event: completedEvent._id,
      student: student2User._id,
      registration: reg2._id,
      status: 'present',
      markedBy: organizer1User._id,
      markedAt: new Date(Date.now() - 20 * 60 * 60 * 1000)
    });
    await Attendance.create({
      event: completedEvent._id,
      student: studentAbsentUser._id,
      registration: regAbsent._id,
      status: 'absent',
      markedBy: organizer1User._id,
      markedAt: new Date(Date.now() - 20 * 60 * 60 * 1000)
    });
  });

  // ==========================================
  // 1. Single Certificate Issuance & Eligibility
  // ==========================================
  describe('Single Certificate Issuance & Strict Eligibility', () => {
    it('allows event organizer to issue certificate for attended student', async () => {
      const res = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          eventId: completedEvent._id,
          studentId: student1User._id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certificateId).toMatch(/^SC-\d{4}-HAC-[A-F0-9]{4}-[A-F0-9]{4}$/);
      expect(res.body.data.status).toBe('valid');
      expect(res.body.data.verificationHash).toBeDefined();

      // Database check
      const dbCert = await Certificate.findOne({ certificateId: res.body.data.certificateId });
      expect(dbCert).not.toBeNull();
      expect(String(dbCert.student)).toBe(String(student1User._id));
      expect(String(dbCert.event)).toBe(String(completedEvent._id));
    });

    it('rejects certificate issuance for absent student', async () => {
      const res = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          eventId: completedEvent._id,
          studentId: studentAbsentUser._id
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not marked present/i);
    });

    it('rejects certificate issuance for student not registered', async () => {
      const newStudent = await User.create({
        name: 'David Unregistered',
        email: 'david@campus.edu',
        password: 'Password123!',
        role: 'student',
        department: 'Civil'
      });

      const res = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          eventId: completedEvent._id,
          studentId: newStudent._id
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/confirmed registration/i);
    });

    it('rejects certificate issuance for an ongoing/upcoming event', async () => {
      // Register Alice for upcoming event
      await Registration.create({
        event: upcomingEvent._id,
        student: student1User._id,
        ticketCode: 'TKT-UPCOMING-001',
        status: 'confirmed'
      });

      const res = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          eventId: upcomingEvent._id,
          studentId: student1User._id
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not officially concluded/i);
    });

    it('prevents duplicate certificate generation for the same student and event', async () => {
      // 1. Issue first certificate
      const firstRes = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          eventId: completedEvent._id,
          studentId: student1User._id
        });
      expect(firstRes.status).toBe(201);

      // 2. Attempt duplicate issue
      const dupRes = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          eventId: completedEvent._id,
          studentId: student1User._id
        });

      expect(dupRes.status).toBe(400);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.message).toMatch(/already issued/i);
    });

    it('forbids an organizer from issuing certificates for another organizer’s event', async () => {
      const res = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer2Token}`) // Organizer 2 does not own completedEvent
        .send({
          eventId: completedEvent._id,
          studentId: student1User._id
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/events you organize/i);
    });

    it('allows Admin to issue certificate for any organizer’s event', async () => {
      const res = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventId: completedEvent._id,
          studentId: student1User._id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================
  // 2. Batch Certificate Issuance
  // ==========================================
  describe('Batch Certificate Issuance', () => {
    it('issues batch certificates for all eligible present attendees accurately', async () => {
      const res = await request(app)
        .post(`/api/certificates/generate/batch/${completedEvent._id}`)
        .set('Authorization', `Bearer ${organizer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPresent).toBe(2); // Alice and Bob
      expect(res.body.data.generatedCount).toBe(2);
      expect(res.body.data.alreadyIssuedCount).toBe(0);
      expect(res.body.data.ineligibleCount).toBe(0);

      // Verify records in DB
      const count = await Certificate.countDocuments({ event: completedEvent._id });
      expect(count).toBe(2);
    });

    it('handles idempotent re-runs of batch generation without creating duplicates', async () => {
      // 1. First run
      await request(app)
        .post(`/api/certificates/generate/batch/${completedEvent._id}`)
        .set('Authorization', `Bearer ${organizer1Token}`);

      // 2. Second run
      const res = await request(app)
        .post(`/api/certificates/generate/batch/${completedEvent._id}`)
        .set('Authorization', `Bearer ${organizer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.generatedCount).toBe(0);
      expect(res.body.data.alreadyIssuedCount).toBe(2);

      const count = await Certificate.countDocuments({ event: completedEvent._id });
      expect(count).toBe(2);
    });
  });

  // ==========================================
  // 3. Student Retrieval & Download Permissions
  // ==========================================
  describe('Student Certificate Retrieval & PDF Downloads', () => {
    let issuedCertificate;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          eventId: completedEvent._id,
          studentId: student1User._id
        });
      issuedCertificate = res.body.data;
    });

    it('allows student to fetch their earned certificates', async () => {
      const res = await request(app)
        .get('/api/certificates/my-certificates')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].certificateId).toBe(issuedCertificate.certificateId);
      expect(res.body.data[0].event.title).toBe(completedEvent.title);
    });

    it('allows student to fetch eligible completed events', async () => {
      const res = await request(app)
        .get('/api/certificates/eligible')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].isIssued).toBe(true);
    });

    it('allows student owner to download their PDF certificate', async () => {
      const res = await request(app)
        .get(`/api/certificates/${issuedCertificate.certificateId}/download`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toMatch(/attachment; filename=/);
      // Valid PDF buffer starts with %PDF-
      expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('forbids another student from downloading someone else’s certificate', async () => {
      const res = await request(app)
        .get(`/api/certificates/${issuedCertificate.certificateId}/download`)
        .set('Authorization', `Bearer ${student2Token}`); // Bob attempting to download Alice's cert

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows event organizer to download certificate of an attendee', async () => {
      const res = await request(app)
        .get(`/api/certificates/${issuedCertificate.certificateId}/download`)
        .set('Authorization', `Bearer ${organizer1Token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('allows admin to download any certificate', async () => {
      const res = await request(app)
        .get(`/api/certificates/${issuedCertificate.certificateId}/download`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });

  // ==========================================
  // 4. Admin Revocation, Reinstatement & Audit
  // ==========================================
  describe('Admin Revocation, Reinstatement & Auditing', () => {
    let testCert;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          eventId: completedEvent._id,
          studentId: student1User._id
        });
      testCert = res.body.data;
    });

    it('allows admin to revoke certificate with a valid reason', async () => {
      const res = await request(app)
        .patch(`/api/certificates/${testCert.certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Academic integrity violation during project demonstration.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('revoked');

      // Check audit log
      const log = await AuditLog.findOne({
        action: 'REVOKE_CERTIFICATE',
        targetId: testCert._id
      });
      expect(log).not.toBeNull();
      expect(log.details.reason).toMatch(/integrity violation/i);
    });

    it('rejects revocation when reason is missing or too short', async () => {
      const res = await request(app)
        .patch(`/api/certificates/${testCert.certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: ' '
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/reason.*required/i);
    });

    it('forbids non-admin users from revoking certificates', async () => {
      const res = await request(app)
        .patch(`/api/certificates/${testCert.certificateId}/revoke`)
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({ reason: 'Unauthorized revocation attempt' });

      expect(res.status).toBe(403);
    });

    it('prevents repeated revocation of an already revoked certificate', async () => {
      // First revoke
      await request(app)
        .patch(`/api/certificates/${testCert.certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Initial revocation' });

      // Second revoke attempt
      const res = await request(app)
        .patch(`/api/certificates/${testCert.certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Second revocation' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already revoked/i);
    });

    it('blocks downloading a revoked certificate for regular users', async () => {
      // Revoke cert
      await request(app)
        .patch(`/api/certificates/${testCert.certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Suspended credential' });

      // Student attempts download
      const res = await request(app)
        .get(`/api/certificates/${testCert.certificateId}/download`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/has been revoked/i);
    });

    it('allows admin to reinstate a revoked certificate with audit logging', async () => {
      // 1. Revoke
      await request(app)
        .patch(`/api/certificates/${testCert.certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Temporary administrative hold' });

      // 2. Reinstate
      const reinstateRes = await request(app)
        .patch(`/api/certificates/${testCert.certificateId}/reinstate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Hold cleared following review board clearance' });

      expect(reinstateRes.status).toBe(200);
      expect(reinstateRes.body.success).toBe(true);
      expect(reinstateRes.body.data.status).toBe('valid');

      // Audit check
      const reinstateLog = await AuditLog.findOne({
        action: 'REINSTATE_CERTIFICATE',
        targetId: testCert._id
      });
      expect(reinstateLog).not.toBeNull();
      expect(reinstateLog.details.reason).toMatch(/review board clearance/i);
    });

    it('rejects reinstatement of an already valid certificate', async () => {
      const res = await request(app)
        .patch(`/api/certificates/${testCert.certificateId}/reinstate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Invalid reinstatement attempt' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already active and valid/i);
    });
  });

  // ==========================================
  // 5. Public Verification Endpoint
  // ==========================================
  describe('Public Verification Endpoint (No Authentication Required)', () => {
    let validCert;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/certificates/generate/single')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          eventId: completedEvent._id,
          studentId: student1User._id
        });
      validCert = res.body.data;
    });

    it('returns authentic verification metadata for a valid certificate without exposing PII', async () => {
      const res = await request(app).get(`/api/certificates/verify/${validCert.certificateId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFound).toBe(true);
      expect(res.body.data.isAuthentic).toBe(true);
      expect(res.body.data.status).toBe('valid');
      expect(res.body.data.studentName).toBe('Alice Johnson');
      expect(res.body.data.eventTitle).toBe(completedEvent.title);
      expect(res.body.data.eventCategory).toBe(completedEvent.category);

      // Verify NO sensitive PII or signing secrets exposed
      expect(res.body.data.studentEmail).toBeUndefined();
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.signingSecret).toBeUndefined();
    });

    it('clearly marks revoked status for a revoked certificate in public verification', async () => {
      // Revoke cert
      await request(app)
        .patch(`/api/certificates/${validCert.certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Disqualification after review' });

      const res = await request(app).get(`/api/certificates/verify/${validCert.certificateId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('revoked');
    });

    it('returns 404 for an unknown or non-existent certificate ID', async () => {
      const res = await request(app).get('/api/certificates/verify/SC-2026-FAKE-0000-0000');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });
  });
});
