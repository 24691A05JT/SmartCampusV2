import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import Registration from '../src/models/Registration.js';
import Attendance from '../src/models/Attendance.js';

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

describe('Phase 5: Attendance & Participant Management API Test Suite', () => {
  let organizer1Token, organizer1User;
  let organizer2Token, organizer2User;
  let student1Token, student1User;
  let student2Token, student2User;
  let adminToken, adminUser;
  let event;

  beforeEach(async () => {
    // 1. Seed Organizer 1 (Event Owner)
    const org1Res = await request(app).post('/api/auth/register').send({
      name: 'Prof. David Hilbert',
      email: 'david.hilbert@campus.edu',
      password: 'SecureOrganizer123!',
      confirmPassword: 'SecureOrganizer123!',
      role: 'organizer',
      department: 'Mathematics & Computing'
    });
    organizer1Token = org1Res.body.data.token;
    organizer1User = org1Res.body.data.user;

    // 2. Seed Organizer 2 (Other Faculty)
    const org2Res = await request(app).post('/api/auth/register').send({
      name: 'Prof. Emmy Noether',
      email: 'emmy.noether@campus.edu',
      password: 'SecureOrganizer123!',
      confirmPassword: 'SecureOrganizer123!',
      role: 'organizer',
      department: 'Physics'
    });
    organizer2Token = org2Res.body.data.token;
    organizer2User = org2Res.body.data.user;

    // 3. Seed Student 1
    const stud1Res = await request(app).post('/api/auth/register').send({
      name: 'Kurt Godel',
      email: 'kurt.godel@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Mathematics & Computing'
    });
    student1Token = stud1Res.body.data.token;
    student1User = stud1Res.body.data.user;

    // 4. Seed Student 2
    const stud2Res = await request(app).post('/api/auth/register').send({
      name: 'Alan Turing',
      email: 'alan.turing@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Mathematics & Computing'
    });
    student2Token = stud2Res.body.data.token;
    student2User = stud2Res.body.data.user;

    // 5. Seed Admin
    adminUser = await User.create({
      name: 'Campus Provost Admin',
      email: 'provost.admin@campus.edu',
      password: 'SecureAdmin123!',
      role: 'admin',
      department: 'Administration'
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'provost.admin@campus.edu',
      password: 'SecureAdmin123!'
    });
    adminToken = adminLogin.body.data.token;

    // 6. Create Approved Event owned by Organizer 1
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);

    event = await Event.create({
      title: 'Formal Logic & Algorithms Symposium',
      description: 'Symposium on computational mathematics.',
      organizer: organizer1User._id,
      category: 'Seminar',
      tags: ['Algorithms', 'Logic'],
      targetDepartment: 'All',
      date: futureDate,
      startTime: '10:00',
      endTime: '13:00',
      venue: 'Main Auditorium',
      capacity: 100,
      registeredCount: 0,
      registrationDeadline: deadline,
      status: 'approved'
    });

    // 7. Register Student 1 and Student 2
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ eventId: event._id });

    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ eventId: event._id });
  });

  it('allows the event organizer to retrieve participant roster with attendance stats', async () => {
    const res = await request(app)
      .get(`/api/attendance/event/${event._id}`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.participants.length).toBe(2);
    expect(res.body.data.stats.totalConfirmed).toBe(2);
    expect(res.body.data.stats.unmarkedCount).toBe(2);
  });

  it('prevents another organizer from accessing participant roster of an event they do not own', async () => {
    const res = await request(app)
      .get(`/api/attendance/event/${event._id}`)
      .set('Authorization', `Bearer ${organizer2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access forbidden');
  });

  it('allows campus admin to view participant roster for any event', async () => {
    const res = await request(app)
      .get(`/api/attendance/event/${event._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.participants.length).toBe(2);
  });

  it('prevents students from accessing organizer participant roster', async () => {
    const res = await request(app)
      .get(`/api/attendance/event/${event._id}`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(403);
  });

  it('allows event organizer to mark individual attendance as present', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({
        eventId: event._id,
        studentId: student1User._id,
        status: 'present',
        remarks: 'Attended full session.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('present');
    expect(res.body.data.remarks).toBe('Attended full session.');

    // Verify in database
    const att = await Attendance.findOne({ event: event._id, student: student1User._id });
    expect(att).toBeTruthy();
    expect(att.status).toBe('present');
  });

  it('allows event organizer to mark individual attendance as absent', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({
        eventId: event._id,
        studentId: student2User._id,
        status: 'absent',
        remarks: 'Excused absence.'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('absent');
  });

  it('prevents marking attendance for a student who never registered for the event', async () => {
    // Seed Student 3 (unregistered)
    const stud3Res = await request(app).post('/api/auth/register').send({
      name: 'Unregistered Student',
      email: 'unreg@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Physics'
    });
    const student3User = stud3Res.body.data.user;

    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({
        eventId: event._id,
        studentId: student3User._id,
        status: 'present'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('confirmed registration');
  });

  it('prevents unauthorized organizers from marking attendance on another faculty event', async () => {
    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${organizer2Token}`)
      .send({
        eventId: event._id,
        studentId: student1User._id,
        status: 'present'
      });

    expect(res.status).toBe(403);
  });

  it('allows bulk attendance marking for multiple students simultaneously', async () => {
    const res = await request(app)
      .post('/api/attendance/bulk-mark')
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({
        eventId: event._id,
        records: [
          { studentId: student1User._id, status: 'present', remarks: 'Active participant' },
          { studentId: student2User._id, status: 'absent', remarks: 'No-show' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.data.successCount).toBe(2);

    // Verify both in DB
    const att1 = await Attendance.findOne({ event: event._id, student: student1User._id });
    const att2 = await Attendance.findOne({ event: event._id, student: student2User._id });
    expect(att1.status).toBe('present');
    expect(att2.status).toBe('absent');
  });

  it('allows students to view their attendance history', async () => {
    // Organizer marks student 1 present
    await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({
        eventId: event._id,
        studentId: student1User._id,
        status: 'present'
      });

    const res = await request(app)
      .get('/api/attendance/my-attendance')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.records.length).toBe(1);
    expect(res.body.data.stats.presentCount).toBe(1);
    expect(res.body.data.stats.attendanceRate).toBe(100);
  });

  it('allows organizers to query aggregate attendance stats for their event', async () => {
    // Mark 1 present, 1 absent
    await request(app)
      .post('/api/attendance/bulk-mark')
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({
        eventId: event._id,
        records: [
          { studentId: student1User._id, status: 'present' },
          { studentId: student2User._id, status: 'absent' }
        ]
      });

    const res = await request(app)
      .get(`/api/attendance/event/${event._id}/stats`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalConfirmed).toBe(2);
    expect(res.body.data.presentCount).toBe(1);
    expect(res.body.data.absentCount).toBe(1);
    expect(res.body.data.attendanceRate).toBe(50);
  });
});
