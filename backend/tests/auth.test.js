import { jest, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

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

describe('Phase 3: Authentication & RBAC API Test Suite', () => {
  const validStudent = {
    name: 'Alex Rivera',
    email: 'alex.rivera@campus.edu',
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    role: 'student',
    department: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    interests: ['AI/ML', 'Hackathons'],
    skills: ['React', 'Node.js']
  };

  describe('POST /api/auth/register', () => {
    it('should register a new student successfully with 201 status and JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validStudent);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('alex.rivera@campus.edu');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration if confirmPassword does not match', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          confirmPassword: 'DifferentPassword123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Passwords do not match');
    });

    it('should reject registration if password is weak (lacks special char)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          password: 'Weakpassword123',
          confirmPassword: 'Weakpassword123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('special character');
    });

    it('should reject duplicate email registration with 400', async () => {
      await request(app).post('/api/auth/register').send(validStudent);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validStudent);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should forbid public registration with role=admin (403)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          email: 'rogue.admin@campus.edu',
          role: 'admin'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Admin registration is restricted');
    });

    it('should allow organizer/faculty registration (201)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          email: 'prof.smith@campus.edu',
          role: 'organizer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('organizer');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validStudent);
    });

    it('should log in successfully with valid credentials (200)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.rivera@campus.edu',
          password: 'SecurePassword123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.name).toBe('Alex Rivera');
    });

    it('should reject login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.rivera@campus.edu',
          password: 'WrongPassword999!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject login with unregistered email (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown.user@campus.edu',
          password: 'SecurePassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Protected Profile & RBAC Routes', () => {
    let studentToken;
    let studentUser;

    beforeEach(async () => {
      const reg = await request(app).post('/api/auth/register').send(validStudent);
      studentToken = reg.body.data.token;
      studentUser = reg.body.data.user;
    });

    it('should retrieve student profile with valid token (200)', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(validStudent.email);
    });

    it('should reject profile request without token (401)', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject profile request with invalid token (401)', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid_tampered_token_xyz');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should deny student from accessing admin-only route (RBAC 403)', async () => {
      const res = await request(app)
        .get('/api/users/admin-only')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Role 'student' is not authorized");
    });

    it('should allow student to update profile details (200)', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Alexander Rivera Jr.',
          department: 'Information Technology',
          year: 4,
          interests: ['Cloud Computing', 'Cybersecurity']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Alexander Rivera Jr.');
      expect(res.body.data.department).toBe('Information Technology');
      expect(res.body.data.year).toBe(4);
    });

    it('should change password, verify old password fails, and new password succeeds', async () => {
      // 1. Change password
      const changeRes = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          currentPassword: 'SecurePassword123!',
          newPassword: 'BrandNewPassword2026@',
          confirmPassword: 'BrandNewPassword2026@'
        });

      expect(changeRes.statusCode).toBe(200);

      // 2. Old password fails
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: validStudent.email,
          password: 'SecurePassword123!'
        });
      expect(oldLogin.statusCode).toBe(401);

      // 3. New password succeeds
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: validStudent.email,
          password: 'BrandNewPassword2026@'
        });
      expect(newLogin.statusCode).toBe(200);
      expect(newLogin.body.data).toHaveProperty('token');
    });
  });

  describe('Forgot & Reset Password Workflow', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validStudent);
    });

    it('should return safe generic message for both valid and non-existent emails', async () => {
      const res1 = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validStudent.email });

      expect(res1.statusCode).toBe(200);
      expect(res1.body.data).toHaveProperty('resetToken');

      const res2 = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@campus.edu' });

      expect(res2.statusCode).toBe(200);
      expect(res2.body.message).toContain('password reset instructions have been dispatched');
    });

    it('should reset password with valid token and then prevent token reuse', async () => {
      // 1. Request reset token
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validStudent.email });

      const resetToken = forgotRes.body.data.resetToken;
      expect(resetToken).toBeDefined();

      // 2. Reset password using valid token
      const resetRes = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'CompletelyNewPass999#',
          confirmPassword: 'CompletelyNewPass999#'
        });

      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Attempting to use the SAME reset token a second time MUST fail
      const reuseRes = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'AnotherPassword888#',
          confirmPassword: 'AnotherPassword888#'
        });

      expect(reuseRes.statusCode).toBe(400);
      expect(reuseRes.body.message).toContain('Invalid, expired, or already used');

      // 4. Verify login with the newly reset password succeeds
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: validStudent.email,
          password: 'CompletelyNewPass999#'
        });

      expect(loginRes.statusCode).toBe(200);
    });

    it('should reject reset request with an invalid/random token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password/fake_token_1234567890abcdef')
        .send({
          password: 'NewValidPassword123!',
          confirmPassword: 'NewValidPassword123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid, expired, or already used');
    });
  });
});
