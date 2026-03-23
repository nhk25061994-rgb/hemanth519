const sql    = require('mssql');
const logger = require('./logger');

const config = {
  server:   process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'nitara',
  user:     process.env.DB_USER     || 'sa',
  password: process.env.DB_PASS     || '',
  port:     parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt:              false,
    trustServerCertificate: true
  },
  pool: {
    max: 10, min: 0, idleTimeoutMillis: 30000
  }
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    logger.info(`Connected to MSSQL at ${config.server}/${config.database}`);
  }
  return pool;
}

async function query(sql_str) {
  const p = await getPool();
  const result = await p.request().query(sql_str);
  return result.recordset;
}

async function ping() {
  const p = await getPool();
  await p.request().query('SELECT 1');
}

module.exports = { query, ping };
