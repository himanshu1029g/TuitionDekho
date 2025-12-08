const { Kafka } = require('kafkajs');

let kafkaProducer = null;
let kafkaInitialized = false;

async function initKafka(brokerList = (process.env.KAFKA_BROKERS || 'localhost:9092')) {
  try {
    const kafka = new Kafka({
      clientId: 'tuitiondekho-backend',
      brokers: brokerList.split(','),
      connectionTimeout: 3000,
      requestTimeout: 3000,
      retry: {
        initialRetryTime: 100,
        retries: 2,
        maxRetryTime: 500,
        randomizationFactor: 0.2
      }
    });
    const producer = kafka.producer();
    await producer.connect();
    kafkaProducer = producer;
    kafkaInitialized = true;
    console.log('Kafka producer connected to', brokerList);
  } catch (err) {
    console.warn('Kafka not available - continuing without event streaming:', err.message);
    kafkaInitialized = false;
  }
}

async function sendEvent(topic, event) {
  if (!kafkaProducer || !kafkaInitialized) return;
  try {
    await kafkaProducer.send({
      topic,
      messages: [
        { value: JSON.stringify(event) }
      ]
    });
  } catch (err) {
    // Silent fail - Kafka is optional
  }
}

module.exports = { initKafka, sendEvent };
