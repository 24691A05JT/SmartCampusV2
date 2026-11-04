import { jest, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import Registration from '../src/models/Registration.js';
import Attendance from '../src/models/Attendance.js';
import Feedback from '../src/models/Feedback.js';
import Certificate from '../src/models/Certificate.js';

let mongod;
jest.setTimeout(60000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 }
  });
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

describe('Phase 8: Engagement Analytics API Test Suite', () => {
  let student1Token, student1User;
  let student2Token, student2User;
  let organizer1Token, organizer1User;
  let organizer2Token, organizer2User;
  let adminToken, adminUser;

  beforeEach(async () => {
    // 1. Seed Student 1 (CSE)
    const s1Res = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada.lovelace@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Computer Science & Engineering',
      year: 3,
      semester: 5
    });
    student1Token = s1Res.body.data.token;
    student1User = s1Res.body.data.user;

    // 2. Seed Student 2 (ECE)
    const s2Res = await request(app).post('/api/auth/register').send({
      name: 'Alan Turing',
      email: 'alan.turing@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Electronics & Communication',
      year: 2,
      semester: 4
    });
    student2Token = s2Res.body.data.token;
    student2User = s2Res.body.data.user;

    // 3. Seed Organizer 1 (Faculty)
    const o1Res = await request(app).post('/api/auth/register').send({
      name: 'Prof. Grace Hopper',
      email: 'grace.hopper@campus.edu',
      password: 'SecureOrganizer123!',
      confirmPassword: 'SecureOrganizer123!',
      role: 'organizer',
      department: 'Computer Science & Engineering'
    });
    organizer1Token = o1Res.body.data.token;
    organizer1User = o1Res.body.data.user;

    // 4. Seed Organizer 2 (Other Faculty)
    const o2Res = await request(app).post('/api/auth/register').send({
      name: 'Prof. Claude Shannon',
      email: 'claude.shannon@campus.edu',
      password: 'SecureOrganizer123!',
      confirmPassword: 'SecureOrganizer123!',
      role: 'organizer',
      department: 'Electronics & Communication'
    });
    organizer2Token = o2Res.body.data.token;
    organizer2User = o2Res.body.data.user;

    // 5. Seed Admin directly via User.create (since public registration for admin is restricted)
    adminUser = await User.create({
      name: 'Campus System Administrator',
      email: 'admin.super@campus.edu',
      password: 'AdminSecurePass@2026',
      role: 'admin',
      department: 'Administration'
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin.super@campus.edu',
      password: 'AdminSecurePass@2026'
    });
    adminToken = adminLogin.body.data.token;
  });

  describe('1. Authentication & Role-Based Access Control (RBAC)', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const endpoints = [
        '/api/analytics/dashboard',
        '/api/analytics/student',
        '/api/analytics/organizer',
        '/api/analytics/admin'
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      }
    });

    it('should prevent student from accessing organizer and admin analytics', async () => {
      const orgRes = await request(app)
        .get('/api/analytics/organizer')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(orgRes.status).toBe(403);

      const adminRes = await request(app)
        .get('/api/analytics/admin')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(adminRes.status).toBe(403);
    });

    it('should prevent organizer from accessing student and admin analytics', async () => {
      const studentRes = await request(app)
        .get('/api/analytics/student')
        .set('Authorization', `Bearer ${organizer1Token}`);
      expect(studentRes.status).toBe(403);

      const adminRes = await request(app)
        .get('/api/analytics/admin')
        .set('Authorization', `Bearer ${organizer1Token}`);
      expect(adminRes.status).toBe(403);
    });

    it('should permit organizer to access organizer analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/organizer')
        .set('Authorization', `Bearer ${organizer1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should permit admin to access admin and organizer analytics', async () => {
      const adminRes = await request(app)
        .get('/api/analytics/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.success).toBe(true);

      const orgRes = await request(app)
        .get('/api/analytics/organizer')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(orgRes.status).toBe(200);
      expect(orgRes.body.success).toBe(true);
    });
  });

  describe('2. Student Personal Analytics', () => {
    it('should return correct personal metrics, category breakdown and monthly activity', async () => {
      // Create 2 events
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const event1 = await Event.create({
        title: 'Full-Stack JavaScript Seminar',
        description: 'Advanced Node and React',
        organizer: organizer1User._id,
        category: 'Technical',
        targetDepartment: 'All',
        date: futureDate,
        startTime: '10:00',
        endTime: '12:00',
        venue: 'Seminar Hall A',
        capacity: 50,
        registeredCount: 1,
        registrationDeadline: futureDate,
        status: 'approved'
      });

      const event2 = await Event.create({
        title: 'Cybersecurity Workshop',
        description: 'Ethical hacking lab',
        organizer: organizer1User._id,
        category: 'Workshop',
        targetDepartment: 'All',
        date: futureDate,
        startTime: '14:00',
        endTime: '16:00',
        venue: 'Lab 204',
        capacity: 40,
        registeredCount: 1,
        registrationDeadline: futureDate,
        status: 'approved'
      });

      // Register student 1 for both
      const reg1 = await Registration.create({
        event: event1._id,
        student: student1User._id,
        ticketCode: 'TKT-2026-TEST0001',
        status: 'confirmed'
      });

      const reg2 = await Registration.create({
        event: event2._id,
        student: student1User._id,
        ticketCode: 'TKT-2026-TEST0002',
        status: 'confirmed'
      });

      // Mark attendance: Event 1 = Present, Event 2 = Absent
      await Attendance.create({
        event: event1._id,
        student: student1User._id,
        registration: reg1._id,
        status: 'present',
        markedBy: organizer1User._id
      });

      await Attendance.create({
        event: event2._id,
        student: student1User._id,
        registration: reg2._id,
        status: 'absent',
        markedBy: organizer1User._id
      });

      // Issue Certificate for event 1
      await Certificate.create({
        certificateId: 'CERT-2026-ADA001',
        event: event1._id,
        student: student1User._id,
        verificationHash: 'dummyhash1234567890abcdef',
        status: 'valid'
      });

      // Submit feedback for event 1 (Rating: 4)
      await Feedback.create({
        event: event1._id,
        student: student1User._id,
        rating: 4,
        comment: 'Great hands-on coding walkthrough!'
      });

      // Fetch student analytics
      const res = await request(app)
        .get('/api/analytics/student')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Assert Summary
      expect(data.summary.activeRegistrations).toBe(2);
      expect(data.summary.eventsAttended).toBe(1);
      expect(data.summary.eventsAbsent).toBe(1);
      expect(data.summary.attendanceRate).toBe(50); // 1 present / (1 present + 1 absent) = 50%
      expect(data.summary.certificatesEarned).toBe(1);
      expect(data.summary.reviewsSubmitted).toBe(1);
      expect(data.summary.averageRatingGiven).toBe(4);

      // Assert Category Distribution
      expect(Array.isArray(data.categoryDistribution)).toBe(true);
      expect(data.categoryDistribution.length).toBe(2);
      const techCat = data.categoryDistribution.find((c) => c.name === 'Technical');
      const workshopCat = data.categoryDistribution.find((c) => c.name === 'Workshop');
      expect(techCat).toBeDefined();
      expect(techCat.count).toBe(1);
      expect(workshopCat).toBeDefined();
      expect(workshopCat.count).toBe(1);

      // Assert Monthly Activity
      expect(Array.isArray(data.monthlyActivity)).toBe(true);
      expect(data.monthlyActivity.length).toBe(6);

      // Assert Recent Participation
      expect(Array.isArray(data.recentParticipation)).toBe(true);
      expect(data.recentParticipation.length).toBe(2);
      const p1 = data.recentParticipation.find((p) => p.event._id === String(event1._id));
      expect(p1.attendanceStatus).toBe('present');
    });

    it('should gracefully handle cold-start student with zero records', async () => {
      const res = await request(app)
        .get('/api/analytics/student')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.summary.activeRegistrations).toBe(0);
      expect(data.summary.eventsAttended).toBe(0);
      expect(data.summary.attendanceRate).toBe(0);
      expect(data.summary.certificatesEarned).toBe(0);
      expect(data.categoryDistribution).toEqual([]);
      expect(data.recentParticipation).toEqual([]);
      expect(data.monthlyActivity.length).toBe(6);
    });
  });

  describe('3. Organizer Performance Analytics & Data Isolation', () => {
    it('should strictly isolate metrics to events owned by the authenticated organizer', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      // Organizer 1 events (1 approved with 80/100, 1 pending with 0/50)
      const org1Event1 = await Event.create({
        title: 'Compiler Construction Hands-On',
        description: 'AST and LLVM',
        organizer: organizer1User._id,
        category: 'Technical',
        targetDepartment: 'All',
        date: futureDate,
        startTime: '09:00',
        endTime: '12:00',
        venue: 'Auditorium C',
        capacity: 100,
        registeredCount: 80,
        registrationDeadline: futureDate,
        status: 'approved'
      });

      await Event.create({
        title: 'Algorithms Colloquium',
        description: 'Graph algorithms',
        organizer: organizer1User._id,
        category: 'Seminar',
        targetDepartment: 'All',
        date: futureDate,
        startTime: '13:00',
        endTime: '15:00',
        venue: 'Seminar Hall 2',
        capacity: 50,
        registeredCount: 0,
        registrationDeadline: futureDate,
        status: 'pending'
      });

      // Organizer 2 event (approved with 30/30)
      await Event.create({
        title: 'Digital Signal Processing Bootcamp',
        description: 'MATLAB and DSP',
        organizer: organizer2User._id,
        category: 'Workshop',
        targetDepartment: 'All',
        date: futureDate,
        startTime: '10:00',
        endTime: '14:00',
        venue: 'DSP Lab',
        capacity: 30,
        registeredCount: 30,
        registrationDeadline: futureDate,
        status: 'approved'
      });

      // Seed attendance for Organizer 1 event: 60 present, 20 absent
      const attendanceBatch = [];
      for (let i = 0; i < 60; i++) {
        attendanceBatch.push({
          event: org1Event1._id,
          student: new mongoose.Types.ObjectId(),
          registration: new mongoose.Types.ObjectId(),
          status: 'present',
          markedBy: organizer1User._id
        });
      }
      for (let i = 0; i < 20; i++) {
        attendanceBatch.push({
          event: org1Event1._id,
          student: new mongoose.Types.ObjectId(),
          registration: new mongoose.Types.ObjectId(),
          status: 'absent',
          markedBy: organizer1User._id
        });
      }
      await Attendance.insertMany(attendanceBatch);

      // Seed feedback for Organizer 1 event: 5 stars and 4 stars
      await Feedback.create([
        {
          event: org1Event1._id,
          student: student1User._id,
          rating: 5,
          comment: 'Outstanding workshop!'
        },
        {
          event: org1Event1._id,
          student: student2User._id,
          rating: 4,
          comment: 'Very practical examples.'
        }
      ]);

      // Call organizer analytics as Organizer 1
      const res = await request(app)
        .get('/api/analytics/organizer')
        .set('Authorization', `Bearer ${organizer1Token}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Summary checks
      expect(data.summary.totalEvents).toBe(2);
      expect(data.summary.approvedEvents).toBe(1);
      expect(data.summary.pendingEvents).toBe(1);
      expect(data.summary.totalCapacity).toBe(100); // 100, NOT 130 (excludes Organizer 2's DSP event)
      expect(data.summary.totalRegistrations).toBe(80); // 80, NOT 110
      expect(data.summary.capacityUtilizationRate).toBe(80); // 80 / 100 = 80%
      expect(data.summary.totalPresentAttendees).toBe(60);
      expect(data.summary.turnoutRate).toBe(75); // 60 / 80 = 75%
      expect(data.summary.averageRating).toBe(4.5); // (5 + 4) / 2 = 4.5
      expect(data.summary.totalReviews).toBe(2);

      // Event Performance
      expect(Array.isArray(data.eventPerformance)).toBe(true);
      expect(data.eventPerformance.length).toBe(2);
      const ev1Perf = data.eventPerformance.find((p) => String(p._id) === String(org1Event1._id));
      expect(ev1Perf.capacity).toBe(100);
      expect(ev1Perf.registeredCount).toBe(80);
      expect(ev1Perf.presentCount).toBe(60);

      // Category Distribution for Organizer 1
      expect(data.categoryDistribution.some((c) => c.name === 'Technical')).toBe(true);
      expect(data.categoryDistribution.some((c) => c.name === 'Seminar')).toBe(true);
      expect(data.categoryDistribution.some((c) => c.name === 'Workshop')).toBe(false); // DSP belongs to Org 2!
    });
  });

  describe('4. Admin Campus-Wide Institutional Analytics', () => {
    it('should aggregate institutional metrics across all departments, users, and events', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await Event.create([
        {
          title: 'Campus Hackathon 2026',
          description: 'University hackathon',
          organizer: organizer1User._id,
          category: 'Hackathon',
          targetDepartment: 'All',
          date: futureDate,
          startTime: '09:00',
          endTime: '21:00',
          venue: 'Main Auditorium',
          capacity: 200,
          registeredCount: 150,
          registrationDeadline: futureDate,
          status: 'approved'
        },
        {
          title: 'Cultural Night Carnival',
          description: 'Music and dance',
          organizer: organizer2User._id,
          category: 'Cultural',
          targetDepartment: 'All',
          date: futureDate,
          startTime: '18:00',
          endTime: '22:00',
          venue: 'Open Air Amphitheatre',
          capacity: 300,
          registeredCount: 50,
          registrationDeadline: futureDate,
          status: 'approved'
        }
      ]);

      const res = await request(app)
        .get('/api/analytics/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Summary metrics
      expect(data.summary.totalUsers).toBe(5); // 2 students + 2 organizers + 1 admin
      expect(data.summary.totalStudents).toBe(2);
      expect(data.summary.totalOrganizers).toBe(2);
      expect(data.summary.totalAdmins).toBe(1);
      expect(data.summary.totalEvents).toBe(2);
      expect(data.summary.approvedEvents).toBe(2);
      expect(data.summary.totalApprovedCapacity).toBe(500); // 200 + 300
      expect(data.summary.totalRegistrations).toBe(200); // 150 + 50

      // Department breakdown
      expect(Array.isArray(data.departmentDistribution)).toBe(true);
      expect(data.departmentDistribution.length).toBeGreaterThanOrEqual(2);
      expect(data.departmentDistribution.some((d) => d.department === 'Computer Science & Engineering')).toBe(true);
      expect(data.departmentDistribution.some((d) => d.department === 'Electronics & Communication')).toBe(true);

      // Category breakdown
      expect(Array.isArray(data.categoryDistribution)).toBe(true);
      expect(data.categoryDistribution.some((c) => c.name === 'Hackathon')).toBe(true);
      expect(data.categoryDistribution.some((c) => c.name === 'Cultural')).toBe(true);

      // Monthly velocity
      expect(Array.isArray(data.monthlyVelocity)).toBe(true);
      expect(data.monthlyVelocity.length).toBe(6);

      // Venue utilization
      expect(Array.isArray(data.venueUtilization)).toBe(true);
      expect(data.venueUtilization.some((v) => v.venue === 'Main Auditorium')).toBe(true);
    });
  });

  describe('5. Dashboard Multi-Role Dispatch Endpoint', () => {
    it('should dynamically dispatch student payload for student role', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('student');
      expect(res.body.data.summary.activeRegistrations).toBeDefined();
      expect(res.body.data.categoryDistribution).toBeDefined();
    });

    it('should dynamically dispatch organizer payload for organizer role', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${organizer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('organizer');
      expect(res.body.data.summary.capacityUtilizationRate).toBeDefined();
      expect(res.body.data.eventPerformance).toBeDefined();
    });

    it('should dynamically dispatch admin payload for admin role', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('admin');
      expect(res.body.data.summary.totalUsers).toBeDefined();
      expect(res.body.data.departmentDistribution).toBeDefined();
    });
  });
});
