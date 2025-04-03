require('dotenv').config();
const { Kafka } = require('kafkajs');
const axios = require('axios');

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'hyperledger-bridge';
const KAFKA_CONSUMER_GROUP = process.env.KAFKA_CONSUMER_GROUP || 'hyperledger-bridge-group';
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || 'logs';
const HYPERLEDGER_API_URL = process.env.HYPERLEDGER_API_URL || 'http://localhost:3000/api/logs';

console.clear();
console.log('\n=== KAFKA TO HYPERLEDGER FABRIC BRIDGE ===');
console.log(`Connecting to Kafka broker at ${KAFKA_BROKER}`);
console.log(`Forwarding logs to Hyperledger API at ${HYPERLEDGER_API_URL}`);
console.log('Press Ctrl+C to exit\n');

// Configure Kafka client
const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: [KAFKA_BROKER]
});

// Create a consumer
const consumer = kafka.consumer({ groupId: KAFKA_CONSUMER_GROUP });

// Function to forward logs to Hyperledger Fabric
const forwardToHyperledger = async (log) => {
  try {
    // Our log is already in compatible format with required fields
    // { id, userId, action, resource, timestamp, description, metadata }
    
    // Ensure metadata is properly formatted for Hyperledger (convert to string if it's an object)
    const metadata = typeof log.metadata === 'object' 
      ? JSON.stringify(log.metadata) 
      : log.metadata || '{}';
    
    // Ensure userId is not empty (some systems reject empty userIds)
    const userId = log.userId || 'anonymous';
    
    // Add timestamp if missing
    const timestamp = log.timestamp || new Date().toISOString();
    
    // Prepare the payload with all required fields
    const payload = {
      userId: userId,
      action: log.action,
      resource: log.resource,
      description: log.description || '',
      metadata: metadata,
      timestamp: timestamp
    };
    
    console.log('Sending to Hyperledger with payload:', JSON.stringify(payload));
    
    // POST to Hyperledger API
    const response = await axios.post(HYPERLEDGER_API_URL, payload);
    
    console.log(`✅ Successfully forwarded log ${log.id} to Hyperledger:`);
    console.log(`   ${log.action}: ${log.resource}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to forward log ${log.id} to Hyperledger:`, error.message);
    // If the error contains response data, log it
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    throw error;
  }
};

// Connect and subscribe to the logs topic
const run = async () => {
  try {
    // Connect to the Kafka broker
    await consumer.connect();
    console.log('Connected to Kafka');
    
    // Subscribe to the logs topic
    await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: false });
    console.log(`Subscribed to "${KAFKA_TOPIC}" topic`);
    
    console.log('Waiting for messages... (Press Ctrl+C to exit)\n');
    
    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          console.log('\n-------------------------');
          console.log('Received message from Kafka:');
          
          // Parse the message
          const logData = JSON.parse(message.value.toString());
          
          // Format the message for display
          console.log(JSON.stringify(logData, null, 2));
          
          // Forward to Hyperledger
          console.log('Forwarding to Hyperledger...');
          const result = await forwardToHyperledger(logData);
          console.log('Hyperledger response:', JSON.stringify(result, null, 2));
          
          console.log('-------------------------\n');
        } catch (error) {
          console.error('Error processing message:', error);
          console.log('Raw message:', message.value.toString());
        }
      },
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async () => {
  try {
    await consumer.disconnect();
    console.log('\nDisconnected from Kafka');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the consumer
run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
