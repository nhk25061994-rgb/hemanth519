const express = require('express');
const app     = express();
app.use(express.json());

// In-memory store (swap with DB in real project)
let todos  = [];
let nextId = 1;

// ── Kubernetes liveness probe ────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:      'UP',
    environment: process.env.APP_ENV     || 'local',
    version:     process.env.APP_VERSION || '1.0.0'
  });
});

// ── GET /todos ───────────────────────────────────────────────
app.get('/todos', (req, res) => {
  res.json({ todos, total: todos.length });
});

// ── GET /todos/:id ───────────────────────────────────────────
app.get('/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

// ── POST /todos ──────────────────────────────────────────────
app.post('/todos', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const todo = {
    id:        nextId++,
    title,
    completed: false,
    createdAt: new Date().toISOString()
  };
  todos.push(todo);
  res.status(201).json(todo);
});

// ── PUT /todos/:id ───────────────────────────────────────────
app.put('/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  if (req.body.title     !== undefined) todo.title     = req.body.title;
  if (req.body.completed !== undefined) todo.completed = req.body.completed;
  res.json(todo);
});

// ── DELETE /todos/:id ────────────────────────────────────────
app.delete('/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });
  todos.splice(index, 1);
  res.json({ message: 'Todo deleted' });
});

module.exports = app;
