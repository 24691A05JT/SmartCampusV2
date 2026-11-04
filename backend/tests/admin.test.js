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
import Notification from '../src/models/Notification.js';

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

describe('Phase 10: Admin Control & Audit Logging API Suite', () => {
  let adminToken, adminUser;
  let studentToken, studentUser;
  let organizerToken, organizerUser;
  let testEvent, testRegistration;

  beforeEach(async () => {
    // 1. Seed Admin
    adminUser = await User.create({
      name: 'Provost Administrator',
      email: 'admin.provost@campus.edu',
      password: 'AdminSecurePass@2026',
      role: 'admin',
      department: 'Administration',
      isActive: true
    });
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin.provost@campus.edu',
      password: 'AdminSecurePass@2026'
    });
    adminToken = adminLoginRes.body.data.token;

    // 2. Seed Organizer
    const orgRes = await request(app).post('/api/auth/register').send({
      name: 'Dr. John Watson',
      email: 'watson.organizer@campus.edu',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'organizer',
      department: 'Medical Sciences'
    });
    organizerToken = orgRes.body.data.token;
    organizerUser = orgRes.body.data.user;

    // 3. Seed Student
    const stuRes = await request(app).post('/api/auth/register').send({
      name: 'Sherlock Holmes',
      email: 'sherlock.student@campus.edu',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'student',
      department: 'Forensic Science',
      year: 3
    });
    studentToken = stuRes.body.data.token;
    studentUser = stuRes.body.data.user;

    // 4. Seed Event
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    testEvent = await Event.create({
      title: 'Forensic Pathology Symposium 2026',
      description: 'Advanced pathology exploration and analysis.',
      organizer: organizerUser._id,
      category: 'Seminar',
      date: tomorrow,
      startTime: '10:00',
      endTime: '15:00',
      venue: 'Medical Hall A',
      capacity: 50,
      registeredCount: 1,
      registrationDeadline: tomorrow,
      status: 'approved',
      isCancelled: false
    });

    // 5. Seed Registration
    testRegistration = await Registration.create({
      event: testEvent._id,
      student: studentUser._id,
      ticketCode: 'TKT-SHERLOCK-9001',
      status: 'confirmed'
    });
  });

  // ==========================================
  // 1. Strict RBAC & Authorization
  // ==========================================
  describe('Strict Admin RBAC', () => {
    it('rejects unauthenticated requests to admin endpoints with 401', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student requests to admin endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects organizer requests to admin endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows admin access with valid JWT token', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics).toBeDefined();
    });
  });

  // ==========================================
  // 2. User Governance & Account Moderation
  // ==========================================
  describe('User Governance & Suspension', () => {
    it('allows admin to list campus users with role filter and search', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=student&search=Sherlock')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBe(1);
      expect(res.body.data.users[0].name).toBe('Sherlock Holmes');
      // Passwords and tokens must NEVER be exposed
      expect(res.body.data.users[0].password).toBeUndefined();
      expect(res.body.data.users[0].resetPasswordToken).toBeUndefined();
    });

    it('allows admin to inspect detailed user dossier', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(studentUser.email);
      expect(res.body.data.stats.confirmedRegistrations).toBe(1);
    });

    it('allows admin to suspend a student account with mandatory reason', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${studentUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
          reason: 'Investigation into policy violation during lab exam.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);

      // Verify AuditLog entry was recorded
      const log = await AuditLog.findOne({
        action: 'USER_SUSPENDED',
        targetId: studentUser._id
      });
      expect(log).not.toBeNull();
      expect(log.details.reason).toMatch(/policy violation/i);

      // Verify Notification was sent to student
      const notif = await Notification.findOne({
        recipient: studentUser._id,
        type: 'system'
      });
      expect(notif).not.toBeNull();
      expect(notif.message).toMatch(/policy violation/i);

      // CRITICAL SECURITY CHECK: Previously issued token must now fail with 403
      const studentReq = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentReq.status).toBe(403);
      expect(studentReq.body.message).toMatch(/account has been deactivated/i);
    });

    it('rejects account status change when reason is missing or too short', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${studentUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
          reason: '  '
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/reason.*mandatory/i);
    });

    it('prevents administrator from deactivating their own account', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
          reason: 'Accidental self-lockout attempt'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot deactivate their own account/i);
    });

    it('allows admin to reactivate a suspended account', async () => {
      // 1. Suspend
      await request(app)
        .patch(`/api/admin/users/${studentUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false, reason: 'Temporary suspension' });

      // 2. Reactivate
      const res = await request(app)
        .patch(`/api/admin/users/${studentUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: true,
          reason: 'Review board cleared student of allegations.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(true);

      // Audit check
      const log = await AuditLog.findOne({
        action: 'USER_REACTIVATED',
        targetId: studentUser._id
      });
      expect(log).not.toBeNull();
      expect(log.details.reason).toMatch(/cleared student/i);

      // Re-login student and verify active access
      const studentReq = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentReq.status).toBe(200);
    });
  });

  // ==========================================
  // 3. Registration Governance & Capacity Safety
  // ==========================================
  describe('Registration Governance', () => {
    it('allows admin to query campus-wide event registrations', async () => {
      const res = await request(app)
        .get('/api/admin/registrations?status=confirmed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.registrations.length).toBe(1);
      expect(res.body.data.registrations[0].ticketCode).toBe('TKT-SHERLOCK-9001');
    });

    it('allows admin to cancel a registration, decrementing capacity exactly once and auditing', async () => {
      const res = await request(app)
        .patch(`/api/admin/registrations/${testRegistration._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Duplicate ticket issued due to system glitch.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');

      // Verify event registeredCount was decremented exactly once
      const updatedEvent = await Event.findById(testEvent._id);
      expect(updatedEvent.registeredCount).toBe(0);

      // Verify AuditLog record
      const log = await AuditLog.findOne({
        action: 'REGISTRATION_CANCELLED_BY_ADMIN',
        targetId: testRegistration._id
      });
      expect(log).not.toBeNull();
      expect(log.details.reason).toMatch(/duplicate ticket/i);

      // Verify notification sent to student
      const notif = await Notification.findOne({
        recipient: studentUser._id,
        type: 'registration'
      });
      expect(notif).not.toBeNull();
    });

    it('prevents repeated cancellation of an already cancelled registration', async () => {
      // First cancel
      await request(app)
        .patch(`/api/admin/registrations/${testRegistration._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Initial cancel' });

      // Second cancel attempt
      const res = await request(app)
        .patch(`/api/admin/registrations/${testRegistration._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Second cancel attempt' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already cancelled/i);

      // Capacity must still be 0 (never negative)
      const ev = await Event.findById(testEvent._id);
      expect(ev.registeredCount).toBe(0);
    });
  });

  // ==========================================
  // 4. Event Governance & Administrative Cancellation
  // ==========================================
  describe('Event Governance & Administrative Cancellation', () => {
    it('allows admin to cancel an event with mandatory reason and notifies all parties', async () => {
      const res = await request(app)
        .patch(`/api/admin/events/${testEvent._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Severe weather alert and campus safety closure.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCancelled).toBe(true);
      expect(res.body.data.notifiedAttendeesCount).toBe(1);

      // Verify AuditLog
      const log = await AuditLog.findOne({
        action: 'EVENT_CANCELLED_BY_ADMIN',
        targetId: testEvent._id
      });
      expect(log).not.toBeNull();
      expect(log.details.reason).toMatch(/severe weather/i);

      // Verify organizer was notified
      const orgNotif = await Notification.findOne({
        recipient: organizerUser._id,
        type: 'event_update'
      });
      expect(orgNotif).not.toBeNull();

      // Verify student was notified
      const stuNotif = await Notification.findOne({
        recipient: studentUser._id,
        type: 'event_update'
      });
      expect(stuNotif).not.toBeNull();
    });

    it('prevents repeated cancellation of an already cancelled event', async () => {
      // First cancel
      await request(app)
        .patch(`/api/admin/events/${testEvent._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Initial cancel' });

      // Second attempt
      const res = await request(app)
        .patch(`/api/admin/events/${testEvent._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Second cancel' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already cancelled/i);
    });
  });

  // ==========================================
  // 5. Audit Log Center & Immutability
  // ==========================================
  describe('Institutional Audit Log Center', () => {
    beforeEach(async () => {
      // Create a few audit logs
      await AuditLog.create({
        action: 'EVENT_APPROVED',
        performedBy: adminUser._id,
        targetModel: 'Event',
        targetId: testEvent._id,
        details: { title: testEvent.title, reason: 'Approved on review' },
        ipAddress: '127.0.0.1'
      });
      await AuditLog.create({
        action: 'DELETE_FEEDBACK',
        performedBy: adminUser._id,
        targetModel: 'Feedback',
        details: { reason: 'Inappropriate language violation' },
        ipAddress: '127.0.0.1'
      });
    });

    it('queries audit logs with action filters and pagination', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?action=EVENT_APPROVED')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.logs[0].action).toBe('EVENT_APPROVED');
      expect(res.body.data.logs[0].performedBy.name).toBe('Provost Administrator');
    });

    it('rejects invalid date range where startDate is after endDate', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?startDate=2026-12-01&endDate=2026-11-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/startDate cannot be later than endDate/i);
    });

    it('ensures no API endpoints exist to delete or modify audit records', async () => {
      // Attempting DELETE or PUT on audit logs should return 404 (route does not exist)
      const deleteRes = await request(app)
        .delete('/api/admin/audit-logs/some-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(404);

      const putRes = await request(app)
        .put('/api/admin/audit-logs/some-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(putRes.status).toBe(404);
    });
  });

  // ==========================================
  // 6. Concurrency & Duplicate Action Protection
  // ==========================================
  describe('Concurrency & Duplicate Action Protection', () => {
    it('handles concurrent duplicate registration cancellations safely', async () => {
      // Fire 2 concurrent cancellation requests
      const [res1, res2] = await Promise.all([
        request(app)
          .patch(`/api/admin/registrations/${testRegistration._id}/cancel`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Concurrent cancel test A' }),
        request(app)
          .patch(`/api/admin/registrations/${testRegistration._id}/cancel`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Concurrent cancel test B' })
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one succeeds with 200, one fails with 400
      expect(statuses).toEqual([200, 400]);

      // Capacity must be decremented exactly once (1 -> 0, not negative)
      const ev = await Event.findById(testEvent._id);
      expect(ev.registeredCount).toBe(0);
    });

    it('handles concurrent duplicate event cancellations safely', async () => {
      const [res1, res2] = await Promise.all([
        request(app)
          .patch(`/api/admin/events/${testEvent._id}/cancel`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Concurrent event cancel A' }),
        request(app)
          .patch(`/api/admin/events/${testEvent._id}/cancel`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Concurrent event cancel B' })
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 400]);

      const ev = await Event.findById(testEvent._id);
      expect(ev.isCancelled).toBe(true);
    });

    it('handles concurrent duplicate account status changes safely', async () => {
      const [res1, res2] = await Promise.all([
        request(app)
          .patch(`/api/admin/users/${studentUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false, reason: 'Concurrent suspension A' }),
        request(app)
          .patch(`/api/admin/users/${studentUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false, reason: 'Concurrent suspension B' })
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 400]);

      const u = await User.findById(studentUser._id);
      expect(u.isActive).toBe(false);
    });
  });

  // ==========================================
  // 7. Audit Logging Reliability & Rollback
  // ==========================================
  describe('Audit Logging Reliability & Rollback', () => {
    it('rolls back account suspension if mandatory audit log recording fails', async () => {
      const originalCreate = AuditLog.create;
      AuditLog.create = jest.fn().mockRejectedValue(new Error('Simulated disk/DB write failure for audit log'));

      try {
        const res = await request(app)
          .patch(`/api/admin/users/${studentUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            isActive: false,
            reason: 'Testing audit write failure rollback'
          });

        expect(res.status).toBe(500);

        // State must remain active (rolled back)
        const student = await User.findById(studentUser._id);
        expect(student.isActive).toBe(true);
      } finally {
        AuditLog.create = originalCreate;
      }
    });

    it('rolls back registration cancellation and preserves capacity if audit logging fails', async () => {
      const originalCreate = AuditLog.create;
      AuditLog.create = jest.fn().mockRejectedValue(new Error('Simulated audit network partition'));

      try {
        const res = await request(app)
          .patch(`/api/admin/registrations/${testRegistration._id}/cancel`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reason: 'Testing cancellation audit rollback'
          });

        expect(res.status).toBe(500);

        // Registration status must remain confirmed
        const reg = await Registration.findById(testRegistration._id);
        expect(reg.status).toBe('confirmed');

        // Event capacity must remain 1 (not decremented)
        const ev = await Event.findById(testEvent._id);
        expect(ev.registeredCount).toBe(1);
      } finally {
        AuditLog.create = originalCreate;
      }
    });
  });

  // ==========================================
  // 8. Input Validation, History Preservation & Clamping
  // ==========================================
  describe('Input Validation, Clamping & History Preservation', () => {
    it('returns 400 for invalid ObjectIDs across administrative endpoints', async () => {
      const userRes = await request(app)
        .get('/api/admin/users/invalid-id-xyz')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(userRes.status).toBe(400);
      expect(userRes.body.message).toMatch(/invalid user id/i);

      const regRes = await request(app)
        .patch('/api/admin/registrations/invalid-id-xyz/cancel')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Valid reason' });
      expect(regRes.status).toBe(400);
      expect(regRes.body.message).toMatch(/invalid registration id/i);

      const eventRes = await request(app)
        .patch('/api/admin/events/invalid-id-xyz/cancel')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Valid reason' });
      expect(eventRes.status).toBe(400);
      expect(eventRes.body.message).toMatch(/invalid event id/i);
    });

    it('clamps excessive pagination limits safely to maximum 100', async () => {
      const res = await request(app)
        .get('/api/admin/users?limit=9999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(100);
    });

    it('safely handles special regex characters in search parameters without crashing', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=[a-z]*+?^$')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });

    it('preserves full registration history and references upon cancellation', async () => {
      await request(app)
        .patch(`/api/admin/registrations/${testRegistration._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Permanent cancellation audit check' });

      // Record must still exist in database
      const reg = await Registration.findById(testRegistration._id);
      expect(reg).not.toBeNull();
      expect(reg.status).toBe('cancelled');
      expect(reg.cancelledAt).toBeDefined();
      expect(String(reg.student)).toBe(String(studentUser._id));
      expect(String(reg.event)).toBe(String(testEvent._id));
    });
  });
});
