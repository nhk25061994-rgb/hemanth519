const Minio  = require('minio');
const logger = require('./logger');

const client = new Minio.Client({
  endPoint:        process.env.MINIO_HOST       || 'localhost',
  port:     parseInt(process.env.MINIO_PORT     || '9000'),
  useSSL:          process.env.MINIO_SSL        === 'true',
  accessKey:       process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey:       process.env.MINIO_SECRET_KEY || 'minioadmin'
});

async function ensureBucket(bucket) {
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket);
    logger.info(`Created MinIO bucket: ${bucket}`);
  }
}

async function upload(bucket, filename, buffer) {
  await ensureBucket(bucket);
  await client.putObject(bucket, filename, buffer);
  logger.info(`Uploaded ${filename} to MinIO bucket ${bucket}`);
}

module.exports = { upload };
