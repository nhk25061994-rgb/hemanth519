const { Kafka } = require('kafkajs');
const logger    = require('./logger');

const kafka = new Kafka({
  clientId: 'nitara-app',
  brokers:  (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const producer = kafka.producer();
let connected  = false;

async function publish(topic, message) {
  if (!connected) {
    await producer.connect();
    connected = true;
    logger.info('Kafka producer connected');
  }
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }]
  });
  logger.info(`Kafka → topic:${topic} message published`);
}

module.exports = { publish };
