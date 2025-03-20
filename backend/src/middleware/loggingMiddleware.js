const { connectToContract } = require('../fabric/network');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to automatically log all API requests to the Hyperledger Fabric blockchain
 */
const loggingMiddleware = async (req, res, next) => {
  // Store the original end method
  const originalEnd = res.end;
  
  // Get the start time of the request
  const startTime = new Date();
  
  // Extract client IP address
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Generate a random user ID if not available
  const userId = req.headers['user-id'] || 'anonymous';
  
  // Create log data structure
  const logData = {
    id: uuidv4(),
    userId: userId,
    action: 'API_REQUEST',
    resource: req.originalUrl,
    timestamp: startTime.toISOString(),
    description: `${req.method} request to ${req.originalUrl}`,
    metadata: {
      ip: clientIp,
      method: req.method,
      userAgent: req.headers['user-agent'],
      requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : null,
      statusCode: null,
      responseTime: null
    }
  };
  
  // Override the res.end method to capture the response
  res.end = function (chunk, encoding) {
    // Calculate request duration
    const duration = new Date() - startTime;
    
    // Update log with response data
    logData.metadata.statusCode = res.statusCode;
    logData.metadata.responseTime = duration;
    
    // Call the original end method
    originalEnd.call(this, chunk, encoding);
    
    // Log the request asynchronously to not block the response
    (async () => {
      try {
        // Connect to the network and contract
        const { gateway, contract } = await connectToContract();
        
        try {
          // Convert metadata to string if it's an object
          if (typeof logData.metadata === 'object') {
            logData.metadata = JSON.stringify(logData.metadata);
          }
          
          // Create the log in the blockchain
          await contract.submitTransaction(
            'CreateLog',
            logData.id,
            logData.userId,
            logData.action,
            logData.resource,
            logData.timestamp,
            logData.description,
            logData.metadata
          );
          
          console.log(`Automatic log created for ${req.method} ${req.originalUrl}`);
        } catch (error) {
          console.error(`Error creating automatic log: ${error.message}`);
        } finally {
          // Disconnect from the gateway
          gateway.disconnect();
        }
      } catch (error) {
        console.error(`Error connecting to network for automatic logging: ${error.message}`);
      }
    })();
  };
  
  // Continue to the next middleware or route handler
  next();
};

module.exports = loggingMiddleware;
