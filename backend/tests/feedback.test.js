import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import Registration from '../src/models/Registration.js';
import Attendance from '../src/models/Attendance.js';
import Feedback from '../src/models/Feedback.js';
import Notification from '../src/models/Notification.js';
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

describe('Phase 6: Event Feedback API Test Suite', () => {
  let organizerToken, organizerUser;
  let attendeeToken, attendeeUser;
  let absentStudentToken, absentStudentUser;
  let nonRegisteredToken, nonRegisteredUser;
  let adminToken, adminUser;
  let completedEvent, upcomingEvent;

  beforeEach(async () => {
    // 1. Seed Organizer
    const orgRes = await request(app).post('/api/auth/register').send({
      name: 'Dr. Sarah Connor',
      email: 'organizer.sarah@campus.edu',
      password: 'SecureOrganizer123!',
      confirmPassword: 'SecureOrganizer123!',
      role: 'organizer',
      department: 'Computer Science & Engineering'
    });
    organizerToken = orgRes.body.data.token;
    organizerUser = orgRes.body.data.user;

    // 2. Seed Student 1 (Attendee)
    const stud1Res = await request(app).post('/api/auth/register').send({
      name: 'Alice Cooper',
      email: 'alice.cooper@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Computer Science & Engineering',
      year: 3
    });
    attendeeToken = stud1Res.body.data.token;
    attendeeUser = stud1Res.body.data.user;

    // 3. Seed Student 2 (Absentee)
    const stud2Res = await request(app).post('/api/auth/register').send({
      name: 'Bob Martin',
      email: 'bob.martin@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Information Technology',
      year: 2
    });
    absentStudentToken = stud2Res.body.data.token;
    absentStudentUser = stud2Res.body.data.user;

    // 4. Seed Student 3 (Non-registered)
    const stud3Res = await request(app).post('/api/auth/register').send({
      name: 'Charlie Brown',
      email: 'charlie.brown@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Mechanical Engineering',
      year: 1
    });
    nonRegisteredToken = stud3Res.body.data.token;
    nonRegisteredUser = stud3Res.body.data.user;

    // 5. Seed Admin
    adminUser = await User.create({
      name: 'Campus Provost',
      email: 'provost@campus.edu',
      password: 'SuperAdminPass123!',
      role: 'admin',
      department: 'Academic Affairs'
    });
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'provost@campus.edu',
      password: 'SuperAdminPass123!'
    });
    adminToken = adminLoginRes.body.data.token;

    // 6. Create completed event (yesterday)
    const pastDate = new Date(Date.now() - 86400000);
    const pastDeadline = new Date(Date.now() - 2 * 86400000);
    completedEvent = await Event.create({
      title: 'Cloud Native Workshop 2026',
      description: 'Hands-on architectural patterns for distributed microservices.',
      organizer: organizerUser._id,
      category: 'Technical',
      date: pastDate,
      startTime: '09:00',
      endTime: '12:00',
      venue: 'Lab_Complex_A',
      capacity: 50,
      registeredCount: 2,
      registrationDeadline: pastDeadline,
      status: 'approved'
    });

    // 7. Create upcoming event (future)
    const futureDate = new Date(Date.now() + 5 * 86400000);
    const futureDeadline = new Date(Date.now() + 3 * 86400000);
    upcomingEvent = await Event.create({
      title: 'NextGen Robotics Expo',
      description: 'Annual competitive showcase of autonomous robotics.',
      organizer: organizerUser._id,
      category: 'Technical',
      date: futureDate,
      startTime: '10:00',
      endTime: '16:00',
      venue: 'Main_Auditorium',
      capacity: 100,
      registeredCount: 0,
      registrationDeadline: futureDeadline,
      status: 'approved'
    });

    // 8. Setup registrations for completed event
    const regAlice = await Registration.create({
      event: completedEvent._id,
      student: attendeeUser._id,
      status: 'confirmed',
      ticketCode: 'TKT-2026-ALICE001'
    });

    const regBob = await Registration.create({
      event: completedEvent._id,
      student: absentStudentUser._id,
      status: 'confirmed',
      ticketCode: 'TKT-2026-BOB00002'
    });

    // 9. Setup attendance: Alice = Present, Bob = Absent
    await Attendance.create({
      event: completedEvent._id,
      student: attendeeUser._id,
      registration: regAlice._id,
      status: 'present',
      markedBy: organizerUser._id,
      remarks: 'Active participant'
    });

    await Attendance.create({
      event: completedEvent._id,
      student: absentStudentUser._id,
      registration: regBob._id,
      status: 'absent',
      markedBy: organizerUser._id,
      remarks: 'Did not attend'
    });
  });

  // -------------------------------------------------------------
  // ELIGIBILITY TESTS
  // -------------------------------------------------------------
  it('should verify feedback eligibility accurately for attended student', async () => {
    const res = await request(app)
      .get(`/api/feedback/event/${completedEvent._id}/eligibility`)
      .set('Authorization', `Bearer ${attendeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eligible).toBe(true);
    expect(res.body.data.isCompleted).toBe(true);
    expect(res.body.data.isRegistered).toBe(true);
    expect(res.body.data.isAttended).toBe(true);
    expect(res.body.data.hasSubmitted).toBe(false);
  });

  it('should deny eligibility if student was absent', async () => {
    const res = await request(app)
      .get(`/api/feedback/event/${completedEvent._id}/eligibility`)
      .set('Authorization', `Bearer ${absentStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.eligible).toBe(false);
    expect(res.body.data.attendanceStatus).toBe('absent');
  });

  it('should deny eligibility if student was never registered', async () => {
    const res = await request(app)
      .get(`/api/feedback/event/${completedEvent._id}/eligibility`)
      .set('Authorization', `Bearer ${nonRegisteredToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.eligible).toBe(false);
    expect(res.body.data.isRegistered).toBe(false);
  });

  it('should deny eligibility if event has not completed yet', async () => {
    const res = await request(app)
      .get(`/api/feedback/event/${upcomingEvent._id}/eligibility`)
      .set('Authorization', `Bearer ${attendeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.eligible).toBe(false);
    expect(res.body.data.isCompleted).toBe(false);
  });

  // -------------------------------------------------------------
  // SUBMISSION TESTS
  // -------------------------------------------------------------
  it('should allow an attended student to submit valid feedback and dispatch notifications', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 5,
        comment: 'Outstanding workshop! Hands-on labs were extremely insightful and well-structured.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.comment).toContain('Outstanding workshop');
    expect(res.body.data.student.name).toBe('Alice Cooper');

    // Verify organizer notification
    const orgNotif = await Notification.findOne({
      recipient: organizerUser._id,
      type: 'feedback'
    });
    expect(orgNotif).toBeTruthy();
    expect(orgNotif.title).toContain('Feedback');
  });

  it('should reject feedback submission with rating outside 1-5', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 6,
        comment: 'Invalid rating test comment.'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Rating must be an integer between 1 and 5');
  });

  it('should reject feedback submission with comment shorter than 5 characters', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 4,
        comment: 'Good'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('between 5 and 1000 characters');
  });

  it('should prevent non-attendees from submitting feedback', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${absentStudentToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 4,
        comment: 'I was absent but want to review anyway.'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('marked as present');
  });

  it('should prevent non-registered students from submitting feedback', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${nonRegisteredToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 4,
        comment: 'Never registered for this session.'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('confirmed registration');
  });

  it('should prevent feedback submission on an upcoming event', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: upcomingEvent._id,
        rating: 5,
        comment: 'Cannot review the future.'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('after the event has officially concluded');
  });

  it('should prevent duplicate feedback submission for the same event and student', async () => {
    // 1st submission
    await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 5,
        comment: 'First constructive review.'
      });

    // 2nd submission
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 4,
        comment: 'Attempting duplicate review.'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already submitted feedback');
  });

  it('should prevent organizers from submitting student feedback', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 5,
        comment: 'Organizer self-review attempt.'
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized|Only students may submit/i);
  });

  // -------------------------------------------------------------
  // RETRIEVAL & AGGREGATION TESTS
  // -------------------------------------------------------------
  it('should calculate accurate event feedback average rating and breakdown statistics', async () => {
    // Submit 1st review: 5 stars
    await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 5,
        comment: 'Phenomenal architecture insights.'
      });

    const res = await request(app).get(`/api/feedback/event/${completedEvent._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalReviews).toBe(1);
    expect(res.body.data.stats.averageRating).toBe(5);
    expect(res.body.data.stats.breakdown[5].count).toBe(1);
    expect(res.body.data.stats.breakdown[5].percentage).toBe(100);
    expect(res.body.data.feedback.length).toBe(1);
  });

  // -------------------------------------------------------------
  // UPDATE & MODERATION TESTS
  // -------------------------------------------------------------
  it('should allow author student to edit their own feedback', async () => {
    const createRes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 4,
        comment: 'Initial 4-star impression.'
      });
    const feedbackId = createRes.body.data._id;

    const updateRes = await request(app)
      .put(`/api/feedback/${feedbackId}`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        rating: 5,
        comment: 'Updated impression: Actually it was a 5-star experience.'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.rating).toBe(5);
    expect(updateRes.body.data.comment).toContain('Updated impression');
  });

  it('should prevent other students from modifying someone else\'s feedback', async () => {
    const createRes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 4,
        comment: 'Alice original comment.'
      });
    const feedbackId = createRes.body.data._id;

    const res = await request(app)
      .put(`/api/feedback/${feedbackId}`)
      .set('Authorization', `Bearer ${absentStudentToken}`)
      .send({
        rating: 1,
        comment: 'Malicious modification attempt.'
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  it('should allow author student to delete their own feedback', async () => {
    const createRes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 4,
        comment: 'To be removed.'
      });
    const feedbackId = createRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/feedback/${feedbackId}`)
      .set('Authorization', `Bearer ${attendeeToken}`);

    expect(delRes.status).toBe(200);
    const check = await Feedback.findById(feedbackId);
    expect(check).toBeNull();
  });

  it('should allow Admin to delete any feedback and log an audit trail', async () => {
    const createRes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 2,
        comment: 'Inappropriate or abusive content violating community standards.'
      });
    const feedbackId = createRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/feedback/${feedbackId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Violates student code of conduct' });

    expect(delRes.status).toBe(200);

    const log = await AuditLog.findOne({
      action: 'DELETE_FEEDBACK',
      targetId: feedbackId
    });
    expect(log).toBeTruthy();
    expect(log.details.reason).toBe('Violates student code of conduct');
  });

  it('should allow Admin to retrieve all campus feedback via moderation endpoint', async () => {
    await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        eventId: completedEvent._id,
        rating: 5,
        comment: 'Feedback visible to campus admin.'
      });

    const res = await request(app)
      .get('/api/feedback/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
