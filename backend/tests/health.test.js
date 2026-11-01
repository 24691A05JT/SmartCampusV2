import request from 'supertest';
import app from '../src/app.js';

describe('Health and System Routes', () => {
  it('GET /api/health should return 200 and system status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('environment');
  });

  it('GET / should return 200 and API documentation summary', async () => {
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('version', '1.0.0');
  });

  it('GET /api/nonexistent-route should return 404 with error envelope', async () => {
    const res = await request(app).get('/api/nonexistent-route');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Route not found');
  });
});
