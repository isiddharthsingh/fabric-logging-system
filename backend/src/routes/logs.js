const express = require('express');
const router = express.Router();
const { connectToContract } = require('../fabric/network');
const { v4: uuidv4 } = require('uuid');

// In-memory cache of recently created logs to improve dashboard visibility
const recentLogsCache = [];
const MAX_CACHE_SIZE = 100; // Limit cache to 100 entries

// Helper function to add a log to the cache
const addLogToCache = (log) => {
  // Add to the front of the array for most recent logs
  recentLogsCache.unshift(log);
  
  // Keep cache size manageable
  if (recentLogsCache.length > MAX_CACHE_SIZE) {
    recentLogsCache.pop(); // Remove oldest log
  }
};

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
      // Query all logs from the blockchain
      const result = await contract.evaluateTransaction('GetAllLogs');
      let logsFromChain = [];
      
      try {
        // Try to parse logs from blockchain
        logsFromChain = JSON.parse(result.toString());
      } catch (parseError) {
        console.error(`Error parsing logs from blockchain: ${parseError}`);
        // Continue with empty logs array
      }
      
      // Combine blockchain logs with in-memory cache
      // This ensures we display both historical logs and recent logs that may not be in blockchain yet
      let allLogs = [...logsFromChain];
      
      // Add cache logs only if they aren't already in the chain logs
      const chainLogIds = new Set(logsFromChain.map(log => log.id));
      recentLogsCache.forEach(cacheLog => {
        if (!chainLogIds.has(cacheLog.id)) {
          allLogs.push(cacheLog);
        }
      });
      
      // Process each log to ensure correct metadata format
      const processedLogs = allLogs.map(log => processLogMetadata(log));
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      return res.json({
        success: true,
        logs: processedLogs
      });
    } catch (chainError) {
      console.error(`Error evaluating transaction: ${chainError}`);
      
      // Fallback to just the cache if chain query fails
      const processedLogs = recentLogsCache.map(log => processLogMetadata(log));
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      return res.json({
        success: true,
        logs: processedLogs,
        note: "Fetched from cache due to blockchain error"
      });
    }
  } catch (error) {
    console.error('Failed to connect to network:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to the network',
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

    // Add the newly created log to the in-memory cache
    addLogToCache({
      id: logId,
      userId,
      action,
      resource,
      description: description || '',
      metadata: metadataString,
      timestamp: ts
    });

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
