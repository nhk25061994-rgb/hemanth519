// Mock external dependencies so tests run without real infra
jest.mock('../src/db', () => ({
  query: jest.fn(),
  ping:  jest.fn().mockResolvedValue(true)
}));
jest.mock('../src/minio',  () => ({ upload:   jest.fn().mockResolvedValue(true) }));
jest.mock('../src/kafka',  () => ({ publish:  jest.fn().mockResolvedValue(true) }));

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/db');

// ── Health endpoints ─────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });
});

describe('GET /ready', () => {
  it('returns 200 when DB ping succeeds', async () => {
    db.ping.mockResolvedValueOnce(true);
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
  });

  it('returns 503 when DB ping fails', async () => {
    db.ping.mockRejectedValueOnce(new Error('connection refused'));
    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('NOT_READY');
  });
});

// ── User endpoints ───────────────────────────────────────────
describe('GET /api/users', () => {
  it('returns user list from DB', async () => {
    db.query.mockResolvedValueOnce([{ id: 1, name: 'Alice', email: 'alice@nitara.in' }]);
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].name).toBe('Alice');
  });

  it('returns 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/users', () => {
  it('creates user and returns 201', async () => {
    db.query.mockResolvedValueOnce([]);
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Bob', email: 'bob@nitara.in' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User created');
  });

  it('returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/users').send({ name: 'Bob' });
    expect(res.status).toBe(400);
  });
});

// ── Upload endpoint ──────────────────────────────────────────
describe('POST /api/upload', () => {
  it('uploads file and returns 200', async () => {
    const res = await request(app)
      .post('/api/upload')
      .send({ filename: 'test.txt', content: 'hello nitara' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('File uploaded');
  });

  it('returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/upload').send({});
    expect(res.status).toBe(400);
  });
});
