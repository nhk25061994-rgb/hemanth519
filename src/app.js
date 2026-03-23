const express = require('express');
const logger  = require('./logger');
const db      = require('./db');
const minio   = require('./minio');
const kafka   = require('./kafka');

const app = express();
app.use(express.json());

// ── Request logging middleware ───────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── Health / readiness probes (Kubernetes uses these) ────────
app.get('/health', (req, res) => {
  res.json({
    status:      'UP',
    environment: process.env.APP_ENV  || 'local',
    version:     process.env.APP_VERSION || '1.0.0',
    timestamp:   new Date().toISOString()
  });
});

app.get('/ready', async (req, res) => {
  try {
    await db.ping();
    res.json({ status: 'READY', db: 'OK' });
  } catch (err) {
    res.status(503).json({ status: 'NOT_READY', db: err.message });
  }
});

// ── Sample API routes ────────────────────────────────────────

// GET /api/users  — fetch from MSSQL
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.query('SELECT id, name, email FROM users');
    res.json({ users });
  } catch (err) {
    logger.error('DB error: ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users  — insert into MSSQL
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email required' });
  }
  try {
    await db.query(
      `INSERT INTO users (name, email) VALUES ('${name}', '${email}')`
    );
    // Publish event to Kafka
    await kafka.publish('user-created', { name, email, env: process.env.APP_ENV });
    res.status(201).json({ message: 'User created', name, email });
  } catch (err) {
    logger.error('Create user error: ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload  — upload file to MinIO
app.post('/api/upload', async (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ error: 'filename and content required' });
  }
  try {
    const bucket = process.env.MINIO_BUCKET || 'nitara-uploads';
    await minio.upload(bucket, filename, Buffer.from(content));
    res.json({ message: 'File uploaded', bucket, filename });
  } catch (err) {
    logger.error('MinIO error: ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
