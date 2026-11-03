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

let mongod;
jest.setTimeout(60000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 60000
    }
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

describe('Phase 7: AI-Powered Recommendation Engine Test Suite', () => {
  let organizer, organizerToken;
  let admin, adminToken;
  let studentAlice, aliceToken;
  let studentBobColdStart, bobToken;

  // Helper to create future dates
  const getFutureDate = (daysAhead = 7) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d;
  };

  const getPastDate = (daysAgo = 7) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  beforeEach(async () => {
    // 1. Seed Organizer
    organizer = await User.create({
      name: 'Prof. Alan Turing',
      email: 'alan.turing@campus.edu',
      password: 'SecureOrganizer123!',
      role: 'organizer',
      department: 'Computer Science & Engineering'
    });

    const orgRes = await request(app).post('/api/auth/login').send({
      email: 'alan.turing@campus.edu',
      password: 'SecureOrganizer123!'
    });
    organizerToken = orgRes.body.data.token;

    // 2. Seed Admin
    admin = await User.create({
      name: 'Admin Coordinator',
      email: 'admin.coord@campus.edu',
      password: 'SecureAdmin123!',
      role: 'admin',
      department: 'Dean of Student Affairs'
    });

    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin.coord@campus.edu',
      password: 'SecureAdmin123!'
    });
    adminToken = adminRes.body.data.token;

    // 3. Seed Student Alice (Rich profile with interests and skills)
    studentAlice = await User.create({
      name: 'Alice Cooper',
      email: 'alice.cooper@campus.edu',
      password: 'SecureStudent123!',
      role: 'student',
      department: 'Computer Science & Engineering',
      year: 3,
      semester: 5,
      interests: ['AI/ML', 'Cloud Architecture'],
      skills: ['Python', 'Docker', 'React']
    });

    const aliceRes = await request(app).post('/api/auth/login').send({
      email: 'alice.cooper@campus.edu',
      password: 'SecureStudent123!'
    });
    aliceToken = aliceRes.body.data.token;

    // 4. Seed Student Bob (Cold-start student with no interests/skills)
    studentBobColdStart = await User.create({
      name: 'Bob Marley',
      email: 'bob.marley@campus.edu',
      password: 'SecureStudent123!',
      role: 'student',
      department: 'Mechanical Engineering',
      year: 1,
      semester: 1,
      interests: [],
      skills: []
    });

    const bobRes = await request(app).post('/api/auth/login').send({
      email: 'bob.marley@campus.edu',
      password: 'SecureStudent123!'
    });
    bobToken = bobRes.body.data.token;
  });

  describe('1. Authentication & RBAC Authorization', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/recommendations');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject organizer access with 403 forbidden', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should reject admin access with 403 forbidden', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);
    });
  });

  describe('2. Strict Eligibility Filtering', () => {
    it('should exclude unapproved events (draft, pending, rejected)', async () => {
      await Event.create([
        {
          title: 'Draft Event',
          description: 'A draft event',
          organizer: organizer._id,
          category: 'Technical',
          date: getFutureDate(5),
          startTime: '10:00',
          endTime: '12:00',
          venue: 'Room 101',
          capacity: 50,
          registrationDeadline: getFutureDate(3),
          status: 'draft'
        },
        {
          title: 'Pending Event',
          description: 'A pending event',
          organizer: organizer._id,
          category: 'Technical',
          date: getFutureDate(5),
          startTime: '10:00',
          endTime: '12:00',
          venue: 'Room 102',
          capacity: 50,
          registrationDeadline: getFutureDate(3),
          status: 'pending'
        },
        {
          title: 'Rejected Event',
          description: 'A rejected event',
          organizer: organizer._id,
          category: 'Technical',
          date: getFutureDate(5),
          startTime: '10:00',
          endTime: '12:00',
          venue: 'Room 103',
          capacity: 50,
          registrationDeadline: getFutureDate(3),
          status: 'rejected'
        }
      ]);

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.totalEligible).toBe(0);
    });

    it('should exclude cancelled events', async () => {
      await Event.create({
        title: 'Cancelled Tech Summit',
        description: 'Cancelled event',
        organizer: organizer._id,
        category: 'Technical',
        date: getFutureDate(5),
        startTime: '10:00',
        endTime: '12:00',
        venue: 'Room 101',
        capacity: 50,
        registrationDeadline: getFutureDate(3),
        status: 'approved',
        isCancelled: true
      });

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should exclude past events and events with expired registration deadlines', async () => {
      await Event.create([
        {
          title: 'Yesterday Event',
          description: 'Past event',
          organizer: organizer._id,
          category: 'Technical',
          date: getPastDate(2),
          startTime: '10:00',
          endTime: '12:00',
          venue: 'Room 101',
          capacity: 50,
          registrationDeadline: getPastDate(3),
          status: 'approved'
        },
        {
          title: 'Expired Deadline Event',
          description: 'Future date but deadline passed',
          organizer: organizer._id,
          category: 'Technical',
          date: getFutureDate(5),
          startTime: '10:00',
          endTime: '12:00',
          venue: 'Room 102',
          capacity: 50,
          registrationDeadline: getPastDate(1), // deadline expired yesterday
          status: 'approved'
        }
      ]);

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should exclude full-capacity events', async () => {
      await Event.create({
        title: 'Full Capacity Workshop',
        description: 'No seats left',
        organizer: organizer._id,
        category: 'Technical',
        date: getFutureDate(5),
        startTime: '10:00',
        endTime: '12:00',
        venue: 'Auditorium',
        capacity: 30,
        registeredCount: 30, // 100% full
        registrationDeadline: getFutureDate(3),
        status: 'approved'
      });

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should exclude events targeting an incompatible department', async () => {
      // Event targets Civil Engineering; Alice is CSE
      await Event.create({
        title: 'Civil Structural Design',
        description: 'For Civil students only',
        organizer: organizer._id,
        category: 'Workshop',
        targetDepartment: 'Civil Engineering',
        date: getFutureDate(5),
        startTime: '10:00',
        endTime: '12:00',
        venue: 'Civil Lab',
        capacity: 50,
        registrationDeadline: getFutureDate(3),
        status: 'approved'
      });

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should exclude events targeting incompatible academic years', async () => {
      // Event targets years 1 and 2; Alice is Year 3
      await Event.create({
        title: 'Freshman Orientation BootCamp',
        description: 'For 1st and 2nd year students',
        organizer: organizer._id,
        category: 'Seminar',
        targetDepartment: 'All',
        targetYear: [1, 2],
        date: getFutureDate(5),
        startTime: '10:00',
        endTime: '12:00',
        venue: 'Main Hall',
        capacity: 100,
        registrationDeadline: getFutureDate(3),
        status: 'approved'
      });

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should exclude already registered events by default, but include when excludeRegistered=false', async () => {
      const event = await Event.create({
        title: 'Cloud DevOps Conclave',
        description: 'Cloud deployment workshop',
        organizer: organizer._id,
        category: 'Technical',
        targetDepartment: 'Computer Science & Engineering',
        targetYear: [3, 4],
        date: getFutureDate(6),
        startTime: '10:00',
        endTime: '13:00',
        venue: 'Lab 3',
        capacity: 40,
        registeredCount: 5,
        registrationDeadline: getFutureDate(4),
        status: 'approved'
      });

      // Register Alice
      await Registration.create({
        event: event._id,
        student: studentAlice._id,
        ticketCode: 'TCK-ALICE-123',
        status: 'confirmed'
      });

      // 1. By default excludeRegistered is true
      const resDefault = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(resDefault.status).toBe(200);
      expect(resDefault.body.data).toHaveLength(0);

      // 2. When excludeRegistered=false
      const resWithRegistered = await request(app)
        .get('/api/recommendations?excludeRegistered=false')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(resWithRegistered.status).toBe(200);
      expect(resWithRegistered.body.data).toHaveLength(1);
      expect(resWithRegistered.body.data[0].isRegistered).toBe(true);
      expect(resWithRegistered.body.data[0].event._id).toBe(event._id.toString());
    });
  });

  describe('3. Multi-Factor Scoring & Range (0 <= Score <= 100)', () => {
    it('should score high match correctly and keep score <= 100', async () => {
      // Event designed to hit multiple positive factors for Alice:
      // - Dept: CSE (25 pts)
      // - Year: Year 3 (15 pts)
      // - Interest: AI/ML matches category & tag (30 pts cap)
      // - Skills: Python, Docker match tags (15 pts)
      // - Popularity: registeredCount 35 / 50 = 70% occupancy (5 pts)
      // Total potential raw: 25 + 15 + 30 + 15 + 5 = 90
      const event = await Event.create({
        title: 'Advanced Machine Learning & Docker Deployment',
        description: 'Deep dive into Python AI/ML models in containers',
        organizer: organizer._id,
        category: 'Technical',
        tags: ['AI/ML', 'Python', 'Docker'],
        targetDepartment: 'Computer Science & Engineering',
        targetYear: [3],
        date: getFutureDate(10),
        startTime: '09:00',
        endTime: '12:00',
        venue: 'Computing Centre',
        capacity: 50,
        registeredCount: 35,
        registrationDeadline: getFutureDate(8),
        status: 'approved'
      });

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      const rec = res.body.data[0];
      expect(rec.score).toBeGreaterThanOrEqual(75);
      expect(rec.score).toBeLessThanOrEqual(100);
      expect(rec.reasons.length).toBeGreaterThanOrEqual(3);
      expect(rec.reasons.some((r) => r.includes('Computer Science & Engineering'))).toBe(true);
      expect(rec.reasons.some((r) => r.includes('Year 3'))).toBe(true);
      expect(rec.reasons.some((r) => r.includes('AI/ML'))).toBe(true);
      expect(rec.reasons.some((r) => r.includes('Python'))).toBe(true);
    });

    it('should strictly cap interest factor at 30 points even with title and description matches', async () => {
      // Event matching AI/ML and Cloud Architecture in category, tags, title, description
      const event = await Event.create({
        title: 'AI/ML Cloud Architecture Masterclass',
        description: 'Explore AI/ML and Cloud Architecture at scale',
        organizer: organizer._id,
        category: 'Technical',
        tags: ['AI/ML', 'Cloud Architecture'],
        targetDepartment: 'All', // 15
        targetYear: [], // 12
        date: getFutureDate(10),
        startTime: '09:00',
        endTime: '12:00',
        venue: 'Hall A',
        capacity: 100,
        registeredCount: 5, // 1 pt pop
        registrationDeadline: getFutureDate(8),
        status: 'approved'
      });

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data[0];
      // 30 (interest cap) + 15 (dept 'All') + 12 (year 'All') + 0 (skills) + 0 (behavior) + 1 (pop) = 58
      expect(rec.score).toBeLessThanOrEqual(60);
      expect(rec.score).toBeGreaterThanOrEqual(55);
    });

    it('should apply past attendance and feedback affinity correctly', async () => {
      const pastEvent = await Event.create({
        title: 'Past Hackathon 2026',
        description: 'Past campus hackathon',
        organizer: organizer._id,
        category: 'Hackathon',
        date: getPastDate(15),
        startTime: '10:00',
        endTime: '18:00',
        venue: 'Innovation Hub',
        capacity: 50,
        registrationDeadline: getPastDate(20),
        status: 'approved'
      });

      const reg = await Registration.create({
        event: pastEvent._id,
        student: studentAlice._id,
        ticketCode: 'TCK-PAST-1',
        status: 'confirmed'
      });

      // Mark Alice present
      await Attendance.create({
        event: pastEvent._id,
        student: studentAlice._id,
        registration: reg._id,
        status: 'present',
        markedBy: organizer._id
      });

      // Alice left 5-star feedback
      await Feedback.create({
        event: pastEvent._id,
        student: studentAlice._id,
        rating: 5,
        comment: 'Outstanding hackathon experience!'
      });

      // Now create upcoming Hackathon event
      const upcomingHackathon = await Event.create({
        title: 'Annual Campus 24hr Hackathon',
        description: 'Collaborate and code',
        organizer: organizer._id,
        category: 'Hackathon',
        targetDepartment: 'All',
        targetYear: [],
        date: getFutureDate(12),
        startTime: '10:00',
        endTime: '18:00',
        venue: 'Auditorium',
        capacity: 100,
        registeredCount: 10,
        registrationDeadline: getFutureDate(10),
        status: 'approved'
      });

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      const hackRec = res.body.data.find(
        (r) => r.event._id === upcomingHackathon._id.toString()
      );
      expect(hackRec).toBeDefined();
      expect(hackRec.reasons.some((r) => r.includes('Hackathon events you previously attended'))).toBe(true);
      expect(hackRec.reasons.some((r) => r.includes('rated 4★ or higher'))).toBe(true);
    });
  });

  describe('4. Cold-Start Student & Incomplete Profile Handling', () => {
    it('should generate baseline recommendations for cold-start student with no interests/skills', async () => {
      // Event matching Mechanical Engineering department
      await Event.create({
        title: 'Robotics & CAD Modeling Conclave',
        description: 'Advanced CAD and mechanical design',
        organizer: organizer._id,
        category: 'Workshop',
        targetDepartment: 'Mechanical Engineering',
        targetYear: [1],
        date: getFutureDate(8),
        startTime: '10:00',
        endTime: '12:00',
        venue: 'Mech Lab',
        capacity: 40,
        registeredCount: 10,
        registrationDeadline: getFutureDate(6),
        status: 'approved'
      });

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      const rec = res.body.data[0];
      // Dept: 25, Year: 15, Pop: 3, Interest: 0, Skill: 0 => ~43
      expect(rec.score).toBeGreaterThanOrEqual(35);
      expect(rec.score).toBeLessThanOrEqual(55);
      expect(rec.reasons.some((r) => r.includes('Mechanical Engineering curriculum'))).toBe(true);
      expect(res.body.meta.profileIncomplete).toBe(true);
      expect(res.body.meta.hasInterests).toBe(false);
      expect(res.body.meta.hasSkills).toBe(false);
    });
  });

  describe('5. Query Parameters, Sorting & Limits', () => {
    beforeEach(async () => {
      // Seed 3 valid events
      await Event.create([
        {
          title: 'Web Dev Workshop',
          description: 'Learn modern Web Dev and React',
          organizer: organizer._id,
          category: 'Workshop',
          tags: ['React'],
          targetDepartment: 'All',
          date: getFutureDate(4),
          startTime: '10:00',
          endTime: '12:00',
          venue: 'Lab 1',
          capacity: 50,
          registeredCount: 20,
          registrationDeadline: getFutureDate(2),
          status: 'approved'
        },
        {
          title: 'AI Machine Learning Summit',
          description: 'Python and AI deep learning',
          organizer: organizer._id,
          category: 'Technical',
          tags: ['AI/ML', 'Python'],
          targetDepartment: 'Computer Science & Engineering',
          date: getFutureDate(6),
          startTime: '10:00',
          endTime: '12:00',
          venue: 'Lab 2',
          capacity: 50,
          registeredCount: 30,
          registrationDeadline: getFutureDate(4),
          status: 'approved'
        },
        {
          title: 'Career Placement Seminar',
          description: 'Resume building and interview prep',
          organizer: organizer._id,
          category: 'Career',
          tags: ['Career'],
          targetDepartment: 'All',
          date: getFutureDate(8),
          startTime: '14:00',
          endTime: '16:00',
          venue: 'Seminar Hall',
          capacity: 100,
          registeredCount: 10,
          registrationDeadline: getFutureDate(7),
          status: 'approved'
        }
      ]);
    });

    it('should sort recommendations in descending order of score', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < res.body.data.length - 1; i++) {
        expect(res.body.data[i].score).toBeGreaterThanOrEqual(res.body.data[i + 1].score);
      }
    });

    it('should respect the limit parameter', async () => {
      const res = await request(app)
        .get('/api/recommendations?limit=1')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.returnedCount).toBe(1);
    });

    it('should filter by category when category query param is supplied', async () => {
      const res = await request(app)
        .get('/api/recommendations?category=Workshop')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].event.category).toBe('Workshop');
    });

    it('should filter by minScore', async () => {
      // The AI Summit has high score (~80+), Career seminar has lower score (~30-40)
      const res = await request(app)
        .get('/api/recommendations?minScore=70')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((rec) => {
        expect(rec.score).toBeGreaterThanOrEqual(70);
      });
    });

    it('should return empty recommendations array when no events meet the criteria', async () => {
      const res = await request(app)
        .get('/api/recommendations?category=Sports')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.totalEligible).toBe(0);
      expect(res.body.meta.returnedCount).toBe(0);
    });

    it('should handle database errors gracefully and return 500', async () => {
      const spy = jest.spyOn(Event, 'find').mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);

      spy.mockRestore();
    });
  });
});
