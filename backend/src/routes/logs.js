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
 * GET /api/logs
 * Get all logs
 */
router.get('/', async (req, res) => {
  try {
    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    try {
      // Query all logs
      const result = await contract.evaluateTransaction('GetAllLogs');
      let logsFromChain;
      
      try {
        logsFromChain = JSON.parse(result.toString());
      } catch (parseError) {
        console.error(`Error parsing logs: ${parseError}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to parse logs data',
          error: parseError.message
        });
      }
      
      // Force each log to have a metadata field, even if it's missing
      const logs = logsFromChain.map(log => {
        // Create a shallow copy of the log to avoid modifying the original
        const processedLog = { ...log };
        
        // Initialize metadata as an empty object if it doesn't exist
        if (processedLog.metadata === undefined || processedLog.metadata === null) {
          processedLog.metadata = {};
        } else if (typeof processedLog.metadata === 'string') {
          try {
            processedLog.metadata = JSON.parse(processedLog.metadata);
          } catch (e) {
            // If parsing fails, set to empty object
            processedLog.metadata = {};
          }
        }
        
        return processedLog;
      });

      // Disconnect from the gateway
      gateway.disconnect();

      res.status(200).json({
        success: true,
        logs
      });
    } catch (chainError) {
      console.error(`Error evaluating transaction: ${chainError}`);
      
      // Fallback: Get logs by user and combine them
      try {
        console.log("Falling back to fetching logs by user...");
        
        // Define common actions and resources to scan for users
        const actions = ["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "VIEW", "API_CALL", "TRANSACTION", "ERROR"];
        const resources = ["application", "document", "/dashboard", "/api", "user", "system"];
        
        // Initialize an empty set for discovered users
        let discoveredUsers = new Set();
        
        // Helper function to safely parse JSON response
        const safeParseJSON = (jsonString) => {
          if (!jsonString || jsonString.trim() === '') {
            return [];
          }
          try {
            return JSON.parse(jsonString);
          } catch (e) {
            return [];
          }
        };
        
        // Try to get a list of all logs first
        try {
          // Try to get some logs to analyze - we'll use timestamp range from past to now
          const currentTime = new Date().toISOString();
          const pastTime = new Date(0).toISOString(); // Beginning of time (1970)
          
          console.log("Attempting to get logs by time range to discover users...");
          const timeLogsResult = await contract.evaluateTransaction('GetLogsByTimeRange', pastTime, currentTime);
          
          if (timeLogsResult && timeLogsResult.toString().trim() !== '') {
            const timeLogs = safeParseJSON(timeLogsResult.toString());
            if (Array.isArray(timeLogs)) {
              timeLogs.forEach(log => {
                if (log && log.userId) {
                  discoveredUsers.add(log.userId);
                }
              });
              console.log(`Found ${discoveredUsers.size} users from time range query.`);
            }
          }
        } catch (timeError) {
          console.log("Time range query did not yield results, continuing with other methods.");
        }
        
        // Try to discover users by their actions
        for (const action of actions) {
          try {
            const actionLogsResult = await contract.evaluateTransaction('GetLogsByAction', action);
            // Check if result is empty before parsing
            if (!actionLogsResult || actionLogsResult.toString().trim() === '') {
              continue;
            }
            
            const actionLogs = safeParseJSON(actionLogsResult.toString());
            
            if (Array.isArray(actionLogs)) {
              actionLogs.forEach(log => {
                if (log && log.userId) {
                  discoveredUsers.add(log.userId);
                }
              });
              
              if (actionLogs.length > 0) {
                console.log(`Found ${actionLogs.length} logs for action ${action}.`);
              }
            }
          } catch (err) {
            // Only log serious errors, not just empty results
            if (!err.message.includes('Unexpected end of JSON input')) {
              console.warn(`Failed to get logs for action ${action}: ${err.message}`);
            }
          }
        }
        
        // Try to discover users by resources they accessed
        for (const resource of resources) {
          try {
            const resourceLogsResult = await contract.evaluateTransaction('GetLogsByResource', resource);
            // Check if result is empty before parsing
            if (!resourceLogsResult || resourceLogsResult.toString().trim() === '') {
              continue;
            }
            
            const resourceLogs = safeParseJSON(resourceLogsResult.toString());
            
            if (Array.isArray(resourceLogs)) {
              resourceLogs.forEach(log => {
                if (log && log.userId) {
                  discoveredUsers.add(log.userId);
                }
              });
              
              if (resourceLogs.length > 0) {
                console.log(`Found ${resourceLogs.length} logs for resource ${resource}.`);
              }
            }
          } catch (err) {
            // Only log serious errors, not just empty results
            if (!err.message.includes('Unexpected end of JSON input')) {
              console.warn(`Failed to get logs for resource ${resource}: ${err.message}`);
            }
          }
        }
        
        // If we still haven't found any users, get them from request parameters
        if (discoveredUsers.size === 0) {
          console.log("No users discovered from action/resource queries. Checking request parameters...");
          
          // Get users from request parameters if available
          if (req.query.userId) {
            discoveredUsers.add(req.query.userId);
          }
        }
        
        // If we still don't have users, log this but continue
        if (discoveredUsers.size === 0) {
          console.log("No users found through any discovery method. Returning empty logs array.");
          gateway.disconnect();
          return res.status(200).json({
            success: true,
            logs: []
          });
        }
        
        console.log(`Found users: ${Array.from(discoveredUsers).join(', ')}`);
        let combinedLogs = [];
        
        // Now get logs for all discovered users
        for (const userId of discoveredUsers) {
          try {
            const userLogsResult = await contract.evaluateTransaction('GetLogsByUser', userId);
            // Check if result is empty before parsing
            if (!userLogsResult || userLogsResult.toString().trim() === '') {
              console.log(`No logs found for user ${userId}`);
              continue;
            }
            
            const userLogs = safeParseJSON(userLogsResult.toString());
            
            if (!Array.isArray(userLogs) || userLogs.length === 0) {
              console.log(`No logs found for user ${userId}`);
              continue;
            }
            
            // Process logs to ensure metadata
            const processedUserLogs = userLogs.map(log => {
              const processedLog = { ...log };
              if (!processedLog.metadata) {
                processedLog.metadata = {};
              } else if (typeof processedLog.metadata === 'string') {
                try {
                  processedLog.metadata = JSON.parse(processedLog.metadata);
                } catch (e) {
                  processedLog.metadata = {};
                }
              }
              return processedLog;
            });
            
            combinedLogs = [...combinedLogs, ...processedUserLogs];
          } catch (userError) {
            // Only log serious errors, not just empty results
            if (!userError.message.includes('Unexpected end of JSON input')) {
              console.warn(`Failed to get logs for user ${userId}: ${userError.message}`);
            } else {
              console.log(`No logs found for user ${userId}`);
            }
          }
        }
        
        // Remove any duplicate logs (based on ID)
        const uniqueLogs = Array.from(new Map(combinedLogs.map(log => [log.id, log])).values());
        
        gateway.disconnect();
        return res.status(200).json({
          success: true,
          logs: uniqueLogs
        });
      } catch (fallbackError) {
        console.error(`Fallback strategy failed: ${fallbackError}`);
        gateway.disconnect();
        return res.status(500).json({
          success: false,
          message: 'Failed to get logs with fallback strategy',
          error: fallbackError.message
        });
      }
    }
  } catch (error) {
    console.error(`Failed to connect to contract: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs',
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
