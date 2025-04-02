/**
 * Kafka Consumer Service for Fabric Logging System
 * This service connects to the secure-system's Kafka broker and consumes log events
 * from the 'logs' topic, then submits them to the Hyperledger Fabric blockchain.
 */
const { Kafka } = require('kafkajs');
const { connectToContract } = require('../fabric/network');
const { v4: uuidv4 } = require('uuid');

class KafkaConsumerService {
  constructor() {
    // CRITICAL: Always use localhost:9092 to connect to Kafka when running outside Docker
    // Hardcoding this to ensure the connection works regardless of environment variables
    this.brokers = ['localhost:9092'];
    console.log(`Using hardcoded Kafka broker: ${this.brokers[0]}`);
    
    this.clientId = 'fabric-logging-system';
    this.groupId = process.env.KAFKA_GROUP_ID || 'fabric-logging-system-group';
    this.topic = process.env.KAFKA_TOPIC || 'logs';
    
    // Initialize Kafka client with explicit connection configuration
    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers,
      connectionTimeout: 10000, // 10 seconds
      requestTimeout: 30000,     // 30 seconds
      retry: {
        initialRetryTime: 300,
        retries: 10
      }
    });
    
    // Create consumer
    this.consumer = this.kafka.consumer({ groupId: this.groupId });
    
    this.isRunning = false;
  }
  
  /**
   * Test connection to Kafka without starting consumer
   */
  async testConnection() {
    try {
      console.log(`Testing connection to Kafka broker: ${this.brokers[0]}`);
      console.log('This will attempt to connect to the secure-system Kafka instance...');
      
      // Create a new admin client with shorter timeouts for quicker diagnostics
      const admin = this.kafka.admin({
        retry: { retries: 2, initialRetryTime: 100 }
      });
      
      // Set a timeout to avoid hanging if Kafka is completely unreachable
      const connectionPromise = admin.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000);
      });
      
      // Race the connection against a timeout
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log('Successfully connected to Kafka!');
      
      // Get available topics
      const topics = await admin.listTopics();
      console.log(`Available Kafka topics: ${topics.join(', ') || 'No topics found'}`);
      
      // Check if our topic exists
      if (topics.includes(this.topic)) {
        console.log(`Target topic '${this.topic}' found! The Kafka integration will work.`);
      } else {
        console.warn(`Warning: Topic '${this.topic}' not found in Kafka broker. Available topics: ${topics.join(', ') || 'None'}`);
        console.log(`You may need to create the '${this.topic}' topic in the secure-system Kafka instance.`);
      }
      
      await admin.disconnect();
      return true;
    } catch (error) {
      // Log different messages based on error type for better diagnostics
      if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused: The Kafka broker is not accessible at ' + this.brokers[0]);
        console.log('Diagnostics tips:');
        console.log('1. Ensure the secure-system is running with: docker-compose up -d');
        console.log('2. Verify that port 9092 is exposed in the secure-system docker-compose.yml');
        console.log('3. Check if any firewall is blocking the connection to port 9092');
      } else if (error.message && error.message.includes('timeout')) {
        console.error('Connection timeout: The Kafka broker did not respond within the timeout period');
        console.log('Diagnostics tips:');
        console.log('1. Check if Kafka service is healthy with: docker ps | grep kafka');
        console.log('2. Inspect Kafka logs with: docker logs secure-system-kafka-1');
      } else {
        console.error('Kafka connection test failed:', error);
      }
      return false;
    }
  }
  
  /**
   * Start consuming messages from Kafka
   */
  async start() {
    if (this.isRunning) {
      console.log('Kafka consumer is already running');
      return;
    }
    
    // Test connection first
    const connected = await this.testConnection();
    if (!connected) {
      console.error('Cannot start consumer because Kafka connection test failed');
      return false;
    }
    
    try {
      // Recreate the Kafka client to ensure we have the correct broker settings
      // This is to avoid any possible caching or resolution issues
      this.kafka = new Kafka({
        clientId: this.clientId,
        brokers: ['localhost:9092'], // Hardcoded to ensure we use the right address
        connectionTimeout: 10000,
        requestTimeout: 30000,
        retry: {
          initialRetryTime: 300,
          retries: 10
        }
      });
      
      // Recreate the consumer with the new Kafka client
      this.consumer = this.kafka.consumer({ groupId: this.groupId });
      
      console.log(`Connecting consumer to hardcoded Kafka broker: localhost:9092`);
      await this.consumer.connect();
      
      console.log(`Subscribing to topic: ${this.topic}`);
      await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });
      
      console.log('Starting Kafka consumer');
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const logString = message.value.toString();
            console.log(`Received message from Kafka: ${logString.substring(0, 100)}...`);
            
            // Parse the message
            const logEvent = JSON.parse(logString);
            
            // Submit to blockchain
            await this.submitToBlockchain(logEvent);
          } catch (error) {
            console.error('Error processing Kafka message:', error);
          }
        },
      });
      
      this.isRunning = true;
      console.log('Kafka consumer started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start Kafka consumer:', error);
      return false;
    }
  }
  
  /**
   * Submit a log event to the Hyperledger Fabric blockchain
   */
  async submitToBlockchain(logEvent) {
    let gateway = null;
    
    try {
      // Ensure the log has a unique ID
      if (!logEvent.id) {
        logEvent.id = uuidv4();
      }
      
      // Transform secure-system log format to fabric-logging-system format if needed
      const fabricLog = this.transformLogEvent(logEvent);
      
      // Connect to the Fabric network and get the contract
      // The connectToContract function returns { gateway, contract }
      const { gateway: fabricGateway, contract } = await connectToContract();
      gateway = fabricGateway; // Store for later disconnection
      
      if (!contract || typeof contract.submitTransaction !== 'function') {
        throw new Error('Invalid contract object returned from fabric network');
      }
      
      // Extract individual parameters for the chaincode
      // The chaincode expects 6 params: id, userId, action, resource, description, metadata
      const id = fabricLog.id;
      const userId = fabricLog.userId || 'anonymous';
      const action = fabricLog.action || 'UNKNOWN';
      const resource = fabricLog.resource || '';
      const description = fabricLog.description || '';
      
      // Convert metadata object to string if it exists
      let metadata = '';
      if (fabricLog.metadata) {
        metadata = typeof fabricLog.metadata === 'string' 
          ? fabricLog.metadata 
          : JSON.stringify(fabricLog.metadata);
      }
      
      // Submit transaction with individual parameters
      console.log(`Submitting log to blockchain: ${id}`);
      console.log(`Parameters: userId=${userId}, action=${action}, resource=${resource}`);
      
      const result = await contract.submitTransaction(
        'createLog', 
        id, 
        userId, 
        action, 
        resource, 
        description, 
        metadata
      );
      
      console.log(`Successfully added log to blockchain: ${id}`);
      return result;
    } catch (error) {
      console.error(`Error submitting log to blockchain: ${error.message}`);
      throw error;
    } finally {
      // Always disconnect from the gateway to clean up resources
      if (gateway) {
        try {
          gateway.disconnect();
        } catch (disconnectError) {
          console.warn(`Warning: Error disconnecting from gateway: ${disconnectError.message}`);
        }
      }
    }
  }
  
  /**
   * Transform log event from secure-system format to fabric-logging-system format
   */
  transformLogEvent(logEvent) {
    // Create a standardized log format for the blockchain
    const transformedLog = {
      id: logEvent.id || uuidv4(),
      userId: logEvent.userId || 'unknown',
      action: logEvent.action,
      resource: logEvent.resource,
      description: logEvent.description,
      timestamp: logEvent.timestamp || new Date().toISOString(),
      metadata: logEvent.metadata || {}
    };
    
    return transformedLog;
  }
  
  /**
   * Stop the Kafka consumer
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }
    
    try {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log('Kafka consumer stopped');
    } catch (error) {
      console.error('Error stopping Kafka consumer:', error);
    }
  }
}

// Export a singleton instance
const kafkaConsumerService = new KafkaConsumerService();
module.exports = kafkaConsumerService;
