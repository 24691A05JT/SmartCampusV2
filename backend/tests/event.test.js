import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
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

describe('Phase 4: Event Management & Venue Conflict API Test Suite', () => {
  let organizer1Token, organizer2Token, studentToken, adminToken;
  let organizer1User, organizer2User, studentUser, adminUser;

  beforeEach(async () => {
    // 1. Seed Organizer 1
    const org1Res = await request(app).post('/api/auth/register').send({
      name: 'Prof. John Smith',
      email: 'john.smith@campus.edu',
      password: 'SecureOrganizer123!',
      confirmPassword: 'SecureOrganizer123!',
      role: 'organizer',
      department: 'Computer Science & Engineering'
    });
    organizer1Token = org1Res.body.data.token;
    organizer1User = org1Res.body.data.user;

    // 2. Seed Organizer 2
    const org2Res = await request(app).post('/api/auth/register').send({
      name: 'Prof. Mary Watson',
      email: 'mary.watson@campus.edu',
      password: 'SecureOrganizer123!',
      confirmPassword: 'SecureOrganizer123!',
      role: 'organizer',
      department: 'Mechanical Engineering'
    });
    organizer2Token = org2Res.body.data.token;
    organizer2User = org2Res.body.data.user;

    // 3. Seed Student
    const studRes = await request(app).post('/api/auth/register').send({
      name: 'Alex Rivera',
      email: 'alex.rivera@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Computer Science & Engineering'
    });
    studentToken = studRes.body.data.token;
    studentUser = studRes.body.data.user;

    // 4. Seed Admin
    adminUser = await User.create({
      name: 'Chief Campus Admin',
      email: 'admin.events@campus.edu',
      password: 'AdminSuperPassword2026@',
      role: 'admin',
      department: 'Administration'
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin.events@campus.edu',
      password: 'AdminSuperPassword2026@'
    });
    adminToken = adminLogin.body.data.token;
  });

  const sampleEvent = {
    title: 'Full-Stack Web3 & Cloud Conclave',
    description: 'A university-wide technical workshop on modern distributed systems and cloud services.',
    category: 'Technical',
    tags: ['Cloud', 'React', 'Node.js'],
    targetDepartment: 'All',
    targetYear: [2, 3, 4],
    date: '2026-11-20',
    startTime: '10:00',
    endTime: '13:00',
    venue: 'Auditorium A',
    capacity: 100,
    registrationDeadline: '2026-11-19T23:59:59.000Z',
    status: 'draft'
  };

  describe('Event Creation & Validation', () => {
    it('should create an event draft successfully with 201 status', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send(sampleEvent);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.organizer).toBe(organizer1User._id);
    });

    it('should reject event creation if capacity is less than 1', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({ ...sampleEvent, capacity: 0 });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('capacity must be a positive number');
    });

    it('should reject event creation if start time is not before end time', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({ ...sampleEvent, startTime: '14:00', endTime: '12:00' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('start time must precede end time');
    });

    it('should reject event creation if registration deadline is after event date', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          ...sampleEvent,
          date: '2026-11-15',
          registrationDeadline: '2026-11-20'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('deadline cannot be after the event date');
    });

    it('should deny students from creating events (RBAC 403)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(sampleEvent);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain("Role 'student' is not authorized");
    });
  });

  describe('Mathematical Venue Conflict Detection', () => {
    beforeEach(async () => {
      // Create and approve Event A at Auditorium A on 2026-11-20 from 10:00 to 13:00
      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...sampleEvent,
          status: 'approved'
        });
    });

    it('should detect schedule overlap conflict when max(Start_A, Start_B) < min(End_A, End_B)', async () => {
      // Event B: 12:00 to 14:00 at Auditorium A on 2026-11-20 (Overlaps between 12:00 and 13:00)
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizer2Token}`)
        .send({
          ...sampleEvent,
          title: 'Robotics Assembly Workshop',
          startTime: '12:00',
          endTime: '14:00',
          status: 'pending'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Venue Conflict');
      expect(res.body.message).toContain('Auditorium A');
    });

    it('should allow back-to-back non-overlapping event at same venue (13:00 to 15:00)', async () => {
      // Event C: 13:00 to 15:00 (Starts exactly when Event A ends, max(10, 13) = 13 not strictly < min(13, 15) = 13)
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizer2Token}`)
        .send({
          ...sampleEvent,
          title: 'Afternoon AI Seminar',
          startTime: '13:00',
          endTime: '15:00',
          status: 'pending'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
    });

    it('should allow standalone conflict check via POST /api/events/check-conflict', async () => {
      const res = await request(app)
        .post('/api/events/check-conflict')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          venue: 'Auditorium A',
          date: '2026-11-20',
          startTime: '11:00',
          endTime: '12:30'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.hasConflict).toBe(true);
      expect(res.body.data.message).toContain('Venue Conflict');
    });
  });

  describe('Event Ownership & Modification Guard', () => {
    let createdEventId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send(sampleEvent);
      createdEventId = res.body.data._id;
    });

    it('should allow the event organizer to edit their own event (200)', async () => {
      const res = await request(app)
        .put(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          title: 'Full-Stack Web3 & Cloud Conclave (Updated)'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Full-Stack Web3 & Cloud Conclave (Updated)');
    });

    it('should forbid a different organizer from editing another organizer’s event (403)', async () => {
      const res = await request(app)
        .put(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${organizer2Token}`)
        .send({
          title: 'Malicious Hijack Attempt'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('not authorized to edit this event');
    });

    it('should forbid a different organizer from deleting another organizer’s event (403)', async () => {
      const res = await request(app)
        .delete(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${organizer2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('cannot delete another organizer’s event');
    });

    it('should allow the owner organizer to delete their event (200)', async () => {
      const res = await request(app)
        .delete(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${organizer1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });
  });

  describe('Admin Review, Approval, and Rejection Lifecycle', () => {
    let pendingEventId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizer1Token}`)
        .send({
          ...sampleEvent,
          status: 'pending'
        });
      pendingEventId = res.body.data._id;
    });

    it('should approve a pending event, log audit entry, and notify organizer', async () => {
      const res = await request(app)
        .patch(`/api/events/${pendingEventId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('approved');

      // Verify Audit Log
      const audit = await AuditLog.findOne({ targetId: pendingEventId, action: 'EVENT_APPROVED' });
      expect(audit).toBeDefined();
      expect(audit.performedBy.toString()).toBe(adminUser._id.toString());

      // Verify Notification
      const notif = await Notification.findOne({ recipient: organizer1User._id, type: 'approval' });
      expect(notif).toBeDefined();
      expect(notif.title).toContain('Event Approved');
    });

    it('should reject event without reason with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/events/${pendingEventId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('rejection reason of at least 5 characters is required');
    });

    it('should reject event with reason, log audit entry, and notify organizer', async () => {
      const res = await request(app)
        .patch(`/api/events/${pendingEventId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Venue requires sound system maintenance on this date.' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.rejectionReason).toContain('sound system maintenance');

      // Verify Audit Log
      const audit = await AuditLog.findOne({ targetId: pendingEventId, action: 'EVENT_REJECTED' });
      expect(audit).toBeDefined();

      // Verify Notification
      const notif = await Notification.findOne({ recipient: organizer1User._id, type: 'rejection' });
      expect(notif).toBeDefined();
      expect(notif.message).toContain('sound system maintenance');
    });
  });

  describe('Student & Public Event Discovery (Filters, Search, Pagination)', () => {
    beforeEach(async () => {
      // 1. Approved CSE Event
      await request(app).post('/api/events').set('Authorization', `Bearer ${adminToken}`).send({
        ...sampleEvent,
        title: 'Deep Learning with PyTorch',
        category: 'Technical',
        targetDepartment: 'CSE',
        venue: 'Lab 301',
        status: 'approved'
      });

      // 2. Approved Cultural Event
      await request(app).post('/api/events').set('Authorization', `Bearer ${adminToken}`).send({
        ...sampleEvent,
        title: 'Campus Spring Music Conclave',
        category: 'Cultural',
        targetDepartment: 'All',
        venue: 'Open Air Amphitheatre',
        status: 'approved'
      });

      // 3. Draft Event (Should NOT appear to students/public)
      await request(app).post('/api/events').set('Authorization', `Bearer ${organizer1Token}`).send({
        ...sampleEvent,
        title: 'Top Secret Unreleased Event Draft',
        status: 'draft'
      });

      // 4. Rejected Event (Should NOT appear to students/public)
      const rejRes = await request(app).post('/api/events').set('Authorization', `Bearer ${organizer2Token}`).send({
        ...sampleEvent,
        title: 'Cancelled Unapproved Event',
        venue: 'Lab 900',
        status: 'pending'
      });
      await request(app)
        .patch(`/api/events/${rejRes.body.data._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Not suitable for academic schedule' });
    });

    it('should only return approved events to public/students (drafts & rejected hidden)', async () => {
      const res = await request(app).get('/api/events');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      const titles = res.body.data.map((e) => e.title);
      expect(titles).toContain('Deep Learning with PyTorch');
      expect(titles).toContain('Campus Spring Music Conclave');
      expect(titles).not.toContain('Top Secret Unreleased Event Draft');
      expect(titles).not.toContain('Cancelled Unapproved Event');
    });

    it('should filter events by category', async () => {
      const res = await request(app).get('/api/events?category=Cultural');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Campus Spring Music Conclave');
    });

    it('should filter events by keyword search', async () => {
      const res = await request(app).get('/api/events?search=PyTorch');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Deep Learning with PyTorch');
    });

    it('should provide structured pagination', async () => {
      const res = await request(app).get('/api/events?page=1&limit=1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.pages).toBe(2);
      expect(res.body.pagination.limit).toBe(1);
    });
  });
});
