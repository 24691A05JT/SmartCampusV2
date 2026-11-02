import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
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

describe('Phase 6: In-App Notification API Test Suite', () => {
  let user1Token, user1;
  let user2Token, user2;

  beforeEach(async () => {
    // 1. Seed User 1
    const u1Res = await request(app).post('/api/auth/register').send({
      name: 'Alice Cooper',
      email: 'alice.cooper@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Computer Science & Engineering'
    });
    user1Token = u1Res.body.data.token;
    user1 = u1Res.body.data.user;

    // 2. Seed User 2
    const u2Res = await request(app).post('/api/auth/register').send({
      name: 'Bob Martin',
      email: 'bob.martin@campus.edu',
      password: 'SecureStudent123!',
      confirmPassword: 'SecureStudent123!',
      role: 'student',
      department: 'Information Technology'
    });
    user2Token = u2Res.body.data.token;
    user2 = u2Res.body.data.user;

    // 3. Seed notifications for User 1
    await Notification.create([
      {
        recipient: user1._id,
        title: 'Registration Confirmed',
        message: 'You have successfully registered for Hackathon 2026.',
        type: 'registration',
        link: '/events/123',
        isRead: false
      },
      {
        recipient: user1._id,
        title: 'Attendance Marked Present',
        message: 'You were marked present for AI Seminar.',
        type: 'attendance',
        link: '/student/registrations',
        isRead: false
      },
      {
        recipient: user1._id,
        title: 'System Notice',
        message: 'Campus portal scheduled maintenance tonight.',
        type: 'system',
        link: '',
        isRead: true
      }
    ]);

    // 4. Seed notification for User 2
    await Notification.create({
      recipient: user2._id,
      title: 'Welcome Bob',
      message: 'Welcome to Smart Campus system.',
      type: 'system',
      link: '',
      isRead: false
    });
  });

  it('should list notifications belonging strictly to the authenticated user', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications.length).toBe(3);
    expect(res.body.data.unreadCount).toBe(2);

    // Verify Bob's notification is not present
    const titles = res.body.data.notifications.map((n) => n.title);
    expect(titles).not.toContain('Welcome Bob');
  });

  it('should return accurate unread notification count badge for the user', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(2);
  });

  it('should filter notifications by isRead query parameter', async () => {
    const res = await request(app)
      .get('/api/notifications?isRead=false')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications.length).toBe(2);
    expect(res.body.data.notifications.every((n) => !n.isRead)).toBe(true);
  });

  it('should mark a single notification as read and update unread count', async () => {
    const notifs = await Notification.find({ recipient: user1._id, isRead: false });
    const targetId = notifs[0]._id;

    const res = await request(app)
      .patch(`/api/notifications/${targetId}/read`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notification.isRead).toBe(true);
    expect(res.body.data.unreadCount).toBe(1);

    const updated = await Notification.findById(targetId);
    expect(updated.isRead).toBe(true);
  });

  it('should prevent a user from marking another user\'s notification as read', async () => {
    const notifs = await Notification.find({ recipient: user1._id, isRead: false });
    const targetId = notifs[0]._id;

    const res = await request(app)
      .patch(`/api/notifications/${targetId}/read`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  it('should mark all unread notifications as read in bulk', async () => {
    const res = await request(app)
      .patch('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(0);

    const remainingUnread = await Notification.countDocuments({
      recipient: user1._id,
      isRead: false
    });
    expect(remainingUnread).toBe(0);

    // Verify User 2's unread notification was untouched
    const user2Unread = await Notification.countDocuments({
      recipient: user2._id,
      isRead: false
    });
    expect(user2Unread).toBe(1);
  });

  it('should delete a single notification with recipient ownership enforcement', async () => {
    const notifs = await Notification.find({ recipient: user1._id });
    const targetId = notifs[0]._id;

    // Unauthorized attempt by User 2
    const forbiddenRes = await request(app)
      .delete(`/api/notifications/${targetId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(forbiddenRes.status).toBe(403);

    // Authorized deletion by User 1
    const res = await request(app)
      .delete(`/api/notifications/${targetId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    const check = await Notification.findById(targetId);
    expect(check).toBeNull();
  });

  it('should clear all read notifications for current user', async () => {
    const res = await request(app)
      .delete('/api/notifications/clear-read')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deletedCount).toBe(1);

    const remaining = await Notification.find({ recipient: user1._id });
    expect(remaining.length).toBe(2);
    expect(remaining.every((n) => !n.isRead)).toBe(true);
  });
});
