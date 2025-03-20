const express = require('express');
const router = express.Router();
const { connectToContract } = require('../fabric/network');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper function to process log metadata
 * Ensures metadata is a proper object, not a string
 */
const processLogMetadata = (log) => {
  const processedLog = { ...log };
  
  // Ensure metadata exists and is properly formatted
  if (!processedLog.metadata) {
    processedLog.metadata = {};
  } else if (typeof processedLog.metadata === 'string') {
    try {
      // Try to parse the metadata if it's a JSON string
      processedLog.metadata = JSON.parse(processedLog.metadata);
    } catch (e) {
      // If parsing fails, set to empty object
      console.error(`Failed to parse metadata for log ${processedLog.id}: ${e.message}`);
      processedLog.metadata = {};
    }
  }
  
  return processedLog;
};

/**
 * GET /api/logs/user/:userId
 * Get logs by user ID
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    // Query logs by user ID
    const result = await contract.evaluateTransaction('GetLogsByUser', userId);
    const logsFromChain = JSON.parse(result.toString());
    
    // Process logs to ensure metadata is correctly formatted
    const logs = logsFromChain.map(processLogMetadata);

    // Disconnect from the gateway
    gateway.disconnect();

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error(`Failed to get logs by user ID: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs by user',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/action/:action
 * Get logs by action
 */
router.get('/action/:action', async (req, res) => {
  try {
    const { action } = req.params;

    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    // Query logs by action
    const result = await contract.evaluateTransaction('GetLogsByAction', action);
    const logsFromChain = JSON.parse(result.toString());
    
    // Process logs to ensure metadata is correctly formatted
    const logs = logsFromChain.map(processLogMetadata);

    // Disconnect from the gateway
    gateway.disconnect();

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error(`Failed to get logs by action: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs by action',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/resource/:resource
 * Get logs by resource
 */
router.get('/resource/:resource', async (req, res) => {
  try {
    const { resource } = req.params;

    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    // Query logs by resource
    const result = await contract.evaluateTransaction('GetLogsByResource', resource);
    const logsFromChain = JSON.parse(result.toString());
    
    // Process logs to ensure metadata is correctly formatted
    const logs = logsFromChain.map(processLogMetadata);

    // Disconnect from the gateway
    gateway.disconnect();

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error(`Failed to get logs by resource: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs by resource',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/timerange
 * Get logs by time range
 */
router.get('/timerange', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Both startTime and endTime are required'
      });
    }

    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    // Query logs by time range
    const result = await contract.evaluateTransaction('GetLogsByTimeRange', startTime, endTime);
    const logsFromChain = JSON.parse(result.toString());
    
    // Process logs to ensure metadata is correctly formatted
    const logs = logsFromChain.map(processLogMetadata);

    // Disconnect from the gateway
    gateway.disconnect();

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error(`Failed to get logs by time range: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs by time range',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/:id
 * Get log by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    // Query log by ID
    const result = await contract.evaluateTransaction('ReadLog', id);
    const logFromChain = JSON.parse(result.toString());
    
    // Process log to ensure metadata is correctly formatted
    const log = processLogMetadata(logFromChain);

    // Disconnect from the gateway
    gateway.disconnect();

    res.status(200).json({
      success: true,
      log
    });
  } catch (error) {
    console.error(`Failed to get log by ID: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get log',
      error: error.message
    });
  }
});

/**
 * GET /api/logs
 * Get all logs
 */
router.get('/', async (req, res) => {
  try {
    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();
    console.log('Connected to Fabric network for log retrieval');

    // Initialize combined logs array and tracking set to avoid duplicates
    let allLogs = [];
    const logIds = new Set();

    // Helper function to sanitize log data
    const sanitizeLog = (log) => {
      if (!log) return null;
      
      try {
        // Ensure log is an object
        const sanitizedLog = typeof log === 'string' ? JSON.parse(log) : { ...log };
        
        // Ensure required fields exist
        sanitizedLog.id = sanitizedLog.id || `LOG${Math.random().toString(36).substring(2, 15)}`;
        sanitizedLog.userId = sanitizedLog.userId || 'unknown_user';
        sanitizedLog.action = sanitizedLog.action || 'UNKNOWN';
        sanitizedLog.resource = sanitizedLog.resource || 'unknown_resource';
        sanitizedLog.timestamp = sanitizedLog.timestamp || new Date().toISOString();
        sanitizedLog.description = sanitizedLog.description || '';
        
        // Handle metadata properly
        if (!sanitizedLog.metadata) {
          sanitizedLog.metadata = {};
        } else if (typeof sanitizedLog.metadata === 'string') {
          // Process string metadata more carefully
          try {
            // Check if it's already valid JSON
            const parsedMetadata = JSON.parse(sanitizedLog.metadata);
            sanitizedLog.metadata = parsedMetadata;
          } catch (parseError) {
            // Handle special cases for automatic logs
            if (sanitizedLog.metadata.startsWith('GET ') || 
                sanitizedLog.metadata.startsWith('POST ') || 
                sanitizedLog.metadata.startsWith('PUT ') || 
                sanitizedLog.metadata.startsWith('DELETE ')) {
              
              // Convert HTTP request strings to a proper object
              const requestType = sanitizedLog.metadata.split(' ')[0];
              const requestPath = sanitizedLog.metadata.split(' ')[1] || '';
              
              sanitizedLog.metadata = { 
                requestType: requestType,
                requestPath: requestPath,
                rawRequest: sanitizedLog.metadata,
                auto_generated: true
              };
            } else {
              // Just store as string property for any other unparseable string
              sanitizedLog.metadata = { 
                value: sanitizedLog.metadata,
                parseError: parseError.message
              };
            }
          }
        } else if (typeof sanitizedLog.metadata !== 'object') {
          // Handle non-object, non-string metadata
          sanitizedLog.metadata = { value: String(sanitizedLog.metadata) };
        }
        
        return sanitizedLog;
      } catch (error) {
        console.error('Error sanitizing log:', error);
        // Return a valid object even if we encounter errors
        return {
          id: `LOG${Math.random().toString(36).substring(2, 15)}`,
          userId: 'error_user',
          action: 'ERROR',
          resource: 'log_sanitization',
          timestamp: new Date().toISOString(),
          description: 'Error sanitizing log data',
          metadata: { 
            error: error.message,
            originalLogId: log.id || 'unknown'
          }
        };
      }
    };

    try {
      // Query all logs using the standard method
      console.log('Executing GetAllLogs transaction...');
      const result = await contract.evaluateTransaction('GetAllLogs');
      
      try {
        const logsFromChain = JSON.parse(result.toString());
        console.log(`Retrieved ${logsFromChain.length} logs from blockchain using GetAllLogs`);
        
        // Add logs to combined result, tracking IDs to avoid duplicates
        logsFromChain.forEach(log => {
          const sanitizedLog = sanitizeLog(log);
          if (sanitizedLog && !logIds.has(sanitizedLog.id)) {
            logIds.add(sanitizedLog.id);
            allLogs.push(sanitizedLog);
          }
        });
      } catch (parseError) {
        console.error(`Error parsing logs from GetAllLogs: ${parseError}`);
      }

      // Try additional query methods to get more logs

      // 1. Query by time range (last 30 days)
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startTime = thirtyDaysAgo.toISOString();
        const endTime = new Date().toISOString();
        
        console.log(`Querying logs by time range: ${startTime} to ${endTime}`);
        const timeRangeResult = await contract.evaluateTransaction('GetLogsByTimeRange', startTime, endTime);
        
        if (timeRangeResult) {
          const timeRangeLogs = JSON.parse(timeRangeResult.toString());
          console.log(`Retrieved ${timeRangeLogs.length} logs by time range`);
          
          timeRangeLogs.forEach(log => {
            const sanitizedLog = sanitizeLog(log);
            if (sanitizedLog && !logIds.has(sanitizedLog.id)) {
              logIds.add(sanitizedLog.id);
              allLogs.push(sanitizedLog);
            }
          });
        }
      } catch (timeRangeError) {
        console.error(`Error querying logs by time range: ${timeRangeError}`);
      }

      // 2. Query by common actions
      const actions = [
        "LOGIN", 
        "LOGOUT", 
        "CREATE", 
        "UPDATE", 
        "DELETE", 
        "VIEW", 
        "API_CALL", 
        "PAGE_VISIT", 
        "API_REQUEST",
        "TEST_LOG"
      ];
      
      for (const action of actions) {
        try {
          console.log(`Querying logs by action: ${action}`);
          const actionResult = await contract.evaluateTransaction('GetLogsByAction', action);
          
          if (actionResult) {
            const actionLogs = JSON.parse(actionResult.toString());
            console.log(`Retrieved ${actionLogs.length} logs for action: ${action}`);
            
            actionLogs.forEach(log => {
              const sanitizedLog = sanitizeLog(log);
              if (sanitizedLog && !logIds.has(sanitizedLog.id)) {
                logIds.add(sanitizedLog.id);
                allLogs.push(sanitizedLog);
              }
            });
          }
        } catch (actionError) {
          console.error(`Error querying logs for action ${action}: ${actionError}`);
        }
      }

      // Sort logs by timestamp in descending order (newest first)
      allLogs.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      console.log(`Total combined unique logs: ${allLogs.length}`);

      // Disconnect from the gateway
      gateway.disconnect();

      res.status(200).json({
        success: true,
        logs: allLogs
      });
    } catch (chainError) {
      console.error(`Error retrieving logs: ${chainError}`);
      gateway.disconnect();
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve logs',
        error: chainError.message
      });
    }
  } catch (error) {
    console.error(`Failed to connect to Fabric: ${error}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect to blockchain network',
      error: error.message
    });
  }
});

/**
 * POST /api/logs
 * Create a new log
 */
router.post('/', async (req, res) => {
  try {
    const { userId, action, resource, description, metadata } = req.body;

    // Validate required fields
    if (!userId || !action || !resource) {
      return res.status(400).json({
        success: false,
        message: 'userId, action, and resource are required fields'
      });
    }

    // Validate metadata is valid JSON if provided
    let metadataString = '{}';
    if (metadata) {
      try {
        // If metadata is already a string, use it; otherwise, stringify it
        metadataString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
        // Validate by parsing it
        JSON.parse(metadataString);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'metadata must be valid JSON'
        });
      }
    }

    // Set timestamp to current time if not provided
    const ts = new Date().toISOString();

    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    // Generate a unique log ID
    const logId = `LOG${uuidv4().replace(/-/g, '').substring(0, 12)}`;

    // Submit transaction to create log
    await contract.submitTransaction(
      'CreateLog',
      logId,
      userId,
      action,
      resource,
      description || '',
      metadataString
    );

    // Disconnect from the gateway
    gateway.disconnect();

    res.status(201).json({
      success: true,
      message: 'Log created successfully',
      logId
    });
  } catch (error) {
    console.error(`Failed to create log: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create log',
      error: error.message
    });
  }
});

module.exports = router;
