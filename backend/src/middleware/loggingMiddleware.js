const { connectToContract } = require('../fabric/network');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to automatically log all API requests to the Hyperledger Fabric blockchain
 */
const loggingMiddleware = async (req, res, next) => {
  // Skip logging for dashboard-related endpoints, log API requests, and requests with skip-logging header
  if (req.originalUrl.includes('/dashboard') || 
      req.originalUrl.includes('/api/status') || 
      req.originalUrl.includes('/api/metrics') ||
      req.originalUrl.includes('/api/logs') ||
      req.headers['x-skip-logging'] === 'true') {
    // Continue to the next middleware without logging
    return next();
  }

  // Store the original end method
  const originalEnd = res.end;
  
  // Get the start time of the request
  const startTime = new Date();
  
  // Extract client IP address
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Generate a random user ID if not available
  const userId = req.headers['user-id'] || 'anonymous';
  
  // Determine if this is a user information update request
  const isUserInfoUpdate = 
    (req.originalUrl.includes('/user') || req.originalUrl.includes('/profile')) ||
    (req.method === 'PUT' || req.method === 'POST' || req.method === 'PATCH') && 
    (req.body && 
      (req.body.userInfo || 
       req.body.userUpdate || 
       req.body.profileUpdate || 
       JSON.stringify(req.body).toLowerCase().includes('user') && 
       JSON.stringify(req.body).toLowerCase().includes('update'))
    );

  // Determine if this is a success message
  const isSuccessMessage = 
    (req.originalUrl.includes('/login') || req.originalUrl.includes('/auth/signin')) ||
    (req.body && 
      (JSON.stringify(req.body).toLowerCase().includes('success') || 
       JSON.stringify(req.body).toLowerCase().includes('login') ||
       JSON.stringify(req.body).toLowerCase().includes('signin'))
    );

  // Create log data structure
  const logData = {
    id: uuidv4(),
    userId: userId,
    action: isUserInfoUpdate ? 'USER_ACTION_COMPLETED' : isSuccessMessage ? 'LOGIN' : 'API_REQUEST',
    resource: req.originalUrl,
    timestamp: startTime.toISOString(),
    description: isUserInfoUpdate 
      ? `[HIGH] User information updated` 
      : isSuccessMessage
      ? `[MEDIUM] User logged in successfully` 
      : `${req.method} request to ${req.originalUrl}`,
    metadata: {
      ip: clientIp,
      method: req.method,
      userAgent: req.headers['user-agent'],
      requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : null,
      statusCode: null,
      responseTime: null,
      severity: isUserInfoUpdate ? 'HIGH' : isSuccessMessage ? 'MEDIUM' : 'LOW',
      priorityLevel: isUserInfoUpdate ? 'HIGH' : isSuccessMessage ? 'MEDIUM' : 'LOW',
      userInfoUpdate: isUserInfoUpdate ? true : undefined,
      successMessage: isSuccessMessage ? true : undefined
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
          
          // Prepare the log parameters for the blockchain
          const logParams = [
            'CreateLog',
            logData.id,
            logData.userId,
            logData.action,
            logData.resource,
            logData.timestamp,
            logData.description,
            logData.metadata
          ];
          
          // Add severity parameter if it's a user information update
          if (isUserInfoUpdate) {
            // Log with HIGH severity
            console.log(`Creating HIGH priority log for user information update: ${req.method} ${req.originalUrl}`);
          }
          
          // Create the log in the blockchain
          await contract.submitTransaction(...logParams);
          
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
