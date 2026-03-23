const request = require('supertest');
const app     = require('../src/app');

describe('GET /health', () => {
  it('returns status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });
});

describe('POST /todos', () => {
  it('creates a todo and returns 201', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'Setup ArgoCD on Vmbr-20' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Setup ArgoCD on Vmbr-20');
    expect(res.body.completed).toBe(false);
  });
  it('returns 400 when title missing', async () => {
    const res = await request(app).post('/todos').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /todos', () => {
  it('returns list', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.todos)).toBe(true);
  });
});

describe('PUT /todos/:id', () => {
  it('marks todo as completed', async () => {
    const create = await request(app).post('/todos').send({ title: 'Deploy to DEV' });
    const res    = await request(app)
      .put(`/todos/${create.body.id}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });
  it('returns 404 for unknown id', async () => {
    const res = await request(app).put('/todos/9999').send({ completed: true });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /todos/:id', () => {
  it('deletes a todo', async () => {
    const create = await request(app).post('/todos').send({ title: 'Promote to UAT' });
    const res    = await request(app).delete(`/todos/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Todo deleted');
  });
  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/todos/9999');
    expect(res.status).toBe(404);
  });
});
