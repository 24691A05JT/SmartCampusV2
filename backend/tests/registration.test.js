import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import Registration from '../src/models/Registration.js';

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

describe('Phase 5: Student Registration API Test Suite', () => {
  let organizerToken, organizerUser;
  let student1Token, student1User;
  let student2Token, student2User;
  let adminToken, adminUser;
  let approvedEvent;

  beforeEach(async () => {
    // 1. Seed Organizer
    const orgRes = await request(app).post('/api/auth/register').send({
      name: 'Dr. Sarah Connor',
      email: 'sarah.connor@campus.edu',
      password: 'SecureOrganizer123!',
      confirmPassword: 'SecureOrganizer123!',
      role: 'organizer',
      department: 'Computer Science & Engineering'
    });
    organizerToken = orgRes.body.data.token;
    organizerUser = orgRes.body.data.user;

    // 2. Seed Student 1
    const stud1Res = await request(app).post('/api/auth/register').send({
      name: 'Alice Cooper',
      email: 'alice.cooper@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Computer Science & Engineering'
    });
    student1Token = stud1Res.body.data.token;
    student1User = stud1Res.body.data.user;

    // 3. Seed Student 2
    const stud2Res = await request(app).post('/api/auth/register').send({
      name: 'Bob Martin',
      email: 'bob.martin@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Electrical Engineering'
    });
    student2Token = stud2Res.body.data.token;
    student2User = stud2Res.body.data.user;

    // 4. Seed Admin
    adminUser = await User.create({
      name: 'Chief Campus Admin',
      email: 'admin.reg@campus.edu',
      password: 'SecureAdmin123!',
      role: 'admin',
      department: 'Academic Affairs'
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin.reg@campus.edu',
      password: 'SecureAdmin123!'
    });
    adminToken = adminLogin.body.data.token;

    // 5. Seed Approved Future Event
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    approvedEvent = await Event.create({
      title: 'Full-Stack Web Dev Workshop',
      description: 'Hands-on training in React, Node, and Tailwind.',
      organizer: organizerUser._id,
      category: 'Workshop',
      tags: ['React', 'Node.js'],
      targetDepartment: 'All',
      date: futureDate,
      startTime: '10:00',
      endTime: '13:00',
      venue: 'Auditorium A',
      capacity: 2,
      registeredCount: 0,
      registrationDeadline: futureDeadline,
      status: 'approved',
      isCancelled: false
    });
  });

  it('allows a student to register for an approved event with capacity available', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: approvedEvent._id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.ticketCode).toMatch(/^TKT-\d{4}-[A-F0-9]{8}$/);

    // Verify event registeredCount incremented
    const updated = await Event.findById(approvedEvent._id);
    expect(updated.registeredCount).toBe(1);
  });

  it('prevents duplicate registration for the same event by the same student', async () => {
    // First registration
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: approvedEvent._id });

    // Second registration attempt
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: approvedEvent._id });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already registered');
  });

  it('enforces event capacity limits atomically', async () => {
    // Event capacity is 2
    // Student 1 registers
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: approvedEvent._id });

    // Student 2 registers
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ eventId: approvedEvent._id });

    // Seed Student 3
    const stud3Res = await request(app).post('/api/auth/register').send({
      name: 'Charlie Brown',
      email: 'charlie.brown@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Computer Science & Engineering'
    });
    const student3Token = stud3Res.body.data.token;

    // Student 3 registration attempt when capacity is full
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student3Token}`)
      .send({ eventId: approvedEvent._id });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('capacity');
  });

  it('prevents registration when registration deadline has passed', async () => {
    const expiredDeadline = new Date();
    expiredDeadline.setDate(expiredDeadline.getDate() - 1); // Yesterday

    const deadlinePassedEvent = await Event.create({
      title: 'Expired Registration Event',
      description: 'Registration closed event.',
      organizer: organizerUser._id,
      category: 'Seminar',
      date: new Date(Date.now() + 86400000 * 5),
      startTime: '14:00',
      endTime: '16:00',
      venue: 'Room 101',
      capacity: 50,
      registrationDeadline: expiredDeadline,
      status: 'approved'
    });

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: deadlinePassedEvent._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('deadline has passed');
  });

  it('prevents registration for past events', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const pastEvent = await Event.create({
      title: 'Past Campus Hackathon',
      description: 'Old hackathon event.',
      organizer: organizerUser._id,
      category: 'Hackathon',
      date: pastDate,
      startTime: '09:00',
      endTime: '17:00',
      venue: 'Main Lab',
      capacity: 100,
      registrationDeadline: pastDate,
      status: 'approved'
    });

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: pastEvent._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already taken place');
  });

  it('prevents registration for unapproved or draft events', async () => {
    const draftEvent = await Event.create({
      title: 'Draft Unapproved Event',
      description: 'Draft not yet approved.',
      organizer: organizerUser._id,
      category: 'Workshop',
      date: new Date(Date.now() + 86400000 * 7),
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Room 202',
      capacity: 30,
      registrationDeadline: new Date(Date.now() + 86400000 * 3),
      status: 'draft'
    });

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: draftEvent._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('draft');
  });

  it('prevents registration for cancelled events', async () => {
    const cancelledEvent = await Event.create({
      title: 'Cancelled Guest Lecture',
      description: 'Cancelled event.',
      organizer: organizerUser._id,
      category: 'Seminar',
      date: new Date(Date.now() + 86400000 * 7),
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Room 303',
      capacity: 30,
      registrationDeadline: new Date(Date.now() + 86400000 * 3),
      status: 'approved',
      isCancelled: true
    });

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: cancelledEvent._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('cancelled');
  });

  it('prevents non-students from invoking student registration endpoint', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ eventId: approvedEvent._id });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Role');
  });

  it('allows a student to cancel their confirmed registration and decrements registeredCount', async () => {
    const regRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: approvedEvent._id });

    const registrationId = regRes.body.data._id;

    const cancelRes = await request(app)
      .patch(`/api/registrations/${registrationId}/cancel`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe('cancelled');

    // Verify count decremented back to 0
    const eventAfter = await Event.findById(approvedEvent._id);
    expect(eventAfter.registeredCount).toBe(0);
  });

  it('allows a student to re-register after cancelling', async () => {
    // 1. Register
    const regRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: approvedEvent._id });
    const regId = regRes.body.data._id;

    // 2. Cancel
    await request(app)
      .patch(`/api/registrations/${regId}/cancel`)
      .set('Authorization', `Bearer ${student1Token}`);

    // 3. Re-register
    const reRegRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: approvedEvent._id });

    expect(reRegRes.status).toBe(201);
    expect(reRegRes.body.data.status).toBe('confirmed');

    const eventAfter = await Event.findById(approvedEvent._id);
    expect(eventAfter.registeredCount).toBe(1);
  });

  it('allows a student to query their registrations and check status', async () => {
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: approvedEvent._id });

    // My Registrations
    const myRegs = await request(app)
      .get('/api/registrations/my-registrations')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(myRegs.status).toBe(200);
    expect(myRegs.body.data.length).toBe(1);
    expect(myRegs.body.data[0].status).toBe('confirmed');

    // Status check
    const checkRes = await request(app)
      .get(`/api/registrations/event/${approvedEvent._id}/check`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.isRegistered).toBe(true);
  });

  it('allows verification of registration by unique ticket code', async () => {
    const regRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: approvedEvent._id });

    const ticketCode = regRes.body.data.ticketCode;

    const lookupRes = await request(app)
      .get(`/api/registrations/ticket/${ticketCode}`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(lookupRes.status).toBe(200);
    expect(lookupRes.body.data.ticketCode).toBe(ticketCode);
    expect(lookupRes.body.data.student.email).toBe('alice.cooper@campus.edu');
  });
});
