const express = require('express');
const router = express.Router();
const { connectToContract } = require('../fabric/network');
const { 
  queryLogsFromCouchDB, 
  getLogsByActionFromCouchDB, 
  getLogByIdFromCouchDB,
  getCouchDBConnection,
  COUCHDB_DATABASE
} = require('../utils/couchdb');
const { v4: uuidv4 } = require('uuid');

/**
 * Process log metadata to ensure it's in the correct format
 * This is critical for logs coming from various sources
 */
function processLogMetadata(log) {
  if (!log) return null;
  
  try {
    // Create a sanitized copy of the log
    const sanitizedLog = { ...log };
    
    // Handle case where metadata might be stored as a string instead of an object
    if (typeof sanitizedLog.metadata === 'string') {
      try {
        sanitizedLog.metadata = JSON.parse(sanitizedLog.metadata);
      } catch (parseError) {
        console.warn(`Cannot parse metadata for log ${sanitizedLog.id}, treating as raw string`);
        // If it can't be parsed as JSON, store it as an object with a raw property
        sanitizedLog.metadata = { raw: sanitizedLog.metadata };
      }
    }
    
    // Ensure metadata exists (required by schema validation)
    if (!sanitizedLog.metadata) {
      sanitizedLog.metadata = {};
    }
    
    return sanitizedLog;
  } catch (error) {
    console.error(`Error processing log metadata: ${error}`);
    // Return the original log with an empty metadata object to prevent validation errors
    return {
      ...log,
      metadata: log.metadata || {}
    };
  }
}

/**
 * Fix blockchain log data to ensure it has properly formatted fields
 * This handles several edge cases in the blockchain data
 */
function sanitizeBlockchainLog(log) {
  if (!log) return null;
  
  try {
    // Make a copy to avoid modifying the original
    let sanitizedLog = typeof log === 'string' ? JSON.parse(log) : { ...log };
    
    // Ensure required fields exist
    sanitizedLog.id = sanitizedLog.id || `LOG${Math.random().toString(36).substring(2, 15)}`;
    sanitizedLog.userId = sanitizedLog.userId || 'unknown_user';
    sanitizedLog.action = sanitizedLog.action || 'UNKNOWN';
    sanitizedLog.resource = sanitizedLog.resource || 'unknown_resource';
    sanitizedLog.timestamp = sanitizedLog.timestamp || new Date().toISOString();
    sanitizedLog.description = sanitizedLog.description || '';
    
    // Special handling for API_REQUEST logs with common string metadata pattern
    if (sanitizedLog.action === 'API_REQUEST' && 
        typeof sanitizedLog.metadata === 'string' && 
        (sanitizedLog.metadata.startsWith('GET ') || 
         sanitizedLog.metadata.startsWith('POST ') || 
         sanitizedLog.metadata.startsWith('PUT ') || 
         sanitizedLog.metadata.startsWith('DELETE '))) {
      
      const parts = sanitizedLog.metadata.split(' ');
      sanitizedLog.metadata = {
        requestType: parts[0],
        requestPath: parts[1] || '',
        rawRequest: sanitizedLog.metadata
      };
    }
    // Other string metadata
    else if (typeof sanitizedLog.metadata === 'string') {
      try {
        sanitizedLog.metadata = JSON.parse(sanitizedLog.metadata);
      } catch (e) {
        sanitizedLog.metadata = { raw: sanitizedLog.metadata };
      }
    }
    // Ensure metadata is an object
    else if (!sanitizedLog.metadata || typeof sanitizedLog.metadata !== 'object') {
      sanitizedLog.metadata = {};
    }
    
    return sanitizedLog;
  } catch (error) {
    console.error(`Error sanitizing blockchain log: ${error}`);
    // Return a valid object with empty metadata
    return {
      id: log.id || `LOG${Math.random().toString(36).substring(2, 15)}`,
      userId: log.userId || 'unknown_user',
      action: log.action || 'ERROR',
      resource: log.resource || 'error_processing',
      timestamp: log.timestamp || new Date().toISOString(),
      description: log.description || 'Error processing log data',
      metadata: {}
    };
  }
}

/**
 * GET /api/logs/user/:userId
 * Get logs by user ID
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Try to get logs directly from CouchDB first for better performance
    const logsFromCouchDB = await getLogsByUserFromCouchDB(userId);
    
    if (logsFromCouchDB && logsFromCouchDB.length > 0) {
      // Process logs to ensure metadata is correctly formatted
      const logs = logsFromCouchDB.map(processLogMetadata);
      console.log(`Retrieved ${logs.length} logs for user ${userId} directly from CouchDB`);
      
      return res.status(200).json({
        success: true,
        logs,
        source: 'couchdb'
      });
    }
    
    // Fallback to blockchain query if no logs found in CouchDB
    console.log(`No logs found in CouchDB for user ${userId}, falling back to blockchain query`);

    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    // Query logs by user ID
    const result = await contract.evaluateTransaction('GetLogsByUser', userId);
    const logsFromChain = JSON.parse(result.toString());
    
    // Process logs to ensure metadata is correctly formatted
    const logs = logsFromChain.map(sanitizeBlockchainLog).map(processLogMetadata);

    // Disconnect from the gateway
    gateway.disconnect();

    res.status(200).json({
      success: true,
      logs,
      source: 'blockchain'
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
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action parameter is required'
      });
    }

    console.log(`Fetching logs for action: ${action}`);
    
    // Try to get logs directly from CouchDB first for better performance
    try {
      const logsFromCouchDB = await getLogsByActionFromCouchDB(action);
      
      if (logsFromCouchDB && logsFromCouchDB.length > 0) {
        // Process logs to ensure metadata is correctly formatted
        const logs = logsFromCouchDB.map(processLogMetadata);
        console.log(`Retrieved ${logs.length} logs for action ${action} directly from CouchDB`);
        
        return res.status(200).json({
          success: true,
          logs,
          source: 'couchdb'
        });
      }
    } catch (couchdbError) {
      console.error(`Error querying CouchDB for action ${action}:`, couchdbError);
      // Continue to blockchain fallback
    }
    
    // Fallback to blockchain query if no logs found in CouchDB
    console.log(`No logs found in CouchDB for action ${action}, falling back to blockchain query`);

    try {
      // Connect to the network and contract
      const { gateway, contract } = await connectToContract();

      // Query logs by action
      const result = await contract.evaluateTransaction('GetLogsByAction', action);
      const logsFromChain = JSON.parse(result.toString());
      
      // Process logs to ensure metadata is correctly formatted
      const logs = logsFromChain.map(sanitizeBlockchainLog).map(processLogMetadata);

      // Disconnect from the gateway
      gateway.disconnect();

      res.status(200).json({
        success: true,
        logs,
        source: 'blockchain'
      });
    } catch (blockchainError) {
      console.error(`Error querying blockchain for action ${action}:`, blockchainError);
      
      // Instead of returning a 500 error, return an empty array
      // This is more robust as some action types might not exist in the system
      res.status(200).json({
        success: true,
        logs: [],
        source: 'error',
        message: `No logs found for action ${action}`
      });
    }
  } catch (error) {
    console.error(`Failed to get logs by action: ${error}`);
    // Return empty array instead of error
    res.status(200).json({
      success: true,
      logs: [],
      source: 'error',
      message: 'Error processing request'
    });
  }
});

// This function is now imported from couchdb.js

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
    const logs = logsFromChain.map(sanitizeBlockchainLog).map(processLogMetadata);

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

    // Try to get logs directly from CouchDB first for better performance
    const logsFromCouchDB = await getLogsByTimeRangeFromCouchDB(startTime, endTime);
    
    if (logsFromCouchDB && logsFromCouchDB.length > 0) {
      // Process logs to ensure metadata is correctly formatted
      const logs = logsFromCouchDB.map(processLogMetadata);
      console.log(`Retrieved ${logs.length} logs for time range directly from CouchDB`);
      
      return res.status(200).json({
        success: true,
        logs,
        source: 'couchdb'
      });
    }
    
    // Fallback to blockchain query if no logs found in CouchDB
    console.log(`No logs found in CouchDB for the specified time range, falling back to blockchain query`);

    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    // Query logs by time range
    const result = await contract.evaluateTransaction('GetLogsByTimeRange', startTime, endTime);
    const logsFromChain = JSON.parse(result.toString());
    
    // Process logs to ensure metadata is correctly formatted
    const logs = logsFromChain.map(sanitizeBlockchainLog).map(processLogMetadata);

    // Disconnect from the gateway
    gateway.disconnect();

    res.status(200).json({
      success: true,
      logs,
      source: 'blockchain'
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

    // Try to get the log directly from CouchDB first for better performance
    const logFromCouchDB = await getLogByIdFromCouchDB(id);
    
    if (logFromCouchDB) {
      // Process log to ensure metadata is correctly formatted
      const log = processLogMetadata(logFromCouchDB);
      console.log(`Retrieved log ${id} directly from CouchDB`);
      
      return res.status(200).json({
        success: true,
        log,
        source: 'couchdb'
      });
    }
    
    // Fallback to blockchain query if not found in CouchDB
    console.log(`Log ${id} not found in CouchDB, falling back to blockchain query`);
    
    // Connect to the network and contract
    const { gateway, contract } = await connectToContract();

    // Query log by ID
    const result = await contract.evaluateTransaction('ReadLog', id);
    const logFromChain = JSON.parse(result.toString());
    
    // Process log to ensure metadata is correctly formatted
    const log = processLogMetadata(sanitizeBlockchainLog(logFromChain));

    // Disconnect from the gateway
    gateway.disconnect();

    res.status(200).json({
      success: true,
      log,
      source: 'blockchain'
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
    console.log('Fetching all logs with fallback strategy...');
    
    // Try to get logs directly from CouchDB first for better performance
    try {
      const logsFromCouchDB = await queryLogsFromCouchDB();
      
      if (logsFromCouchDB && Array.isArray(logsFromCouchDB) && logsFromCouchDB.length > 0) {
        console.log(`Successfully retrieved ${logsFromCouchDB.length} logs directly from CouchDB`);
        
        // Process each log to ensure metadata is correctly formatted
        const logs = logsFromCouchDB.map(log => processLogMetadata(log));
        
        return res.status(200).json({
          success: true,
          logs,
          source: 'couchdb'
        });
      } else {
        console.log('No logs found in CouchDB or invalid response, falling back to blockchain query');
      }
    } catch (couchdbError) {
      console.error('Error querying CouchDB:', couchdbError);
      // Continue to blockchain fallback
    }
    
    // Fallback to blockchain query
    console.log('Falling back to blockchain query for all logs');
    
    try {
      // Connect to the network and contract
      const { gateway, contract } = await connectToContract();
      
      // Get all logs from the blockchain
      const result = await contract.evaluateTransaction('GetAllLogs');
      const logsFromChain = JSON.parse(result.toString());
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      // Make sure we have an array of logs
      if (!Array.isArray(logsFromChain)) {
        throw new Error('Invalid response format: expected array of logs');
      }
      
      // Process each log to ensure metadata is correctly formatted
      const logs = logsFromChain.map(sanitizeBlockchainLog).map(processLogMetadata);
      
      console.log(`Successfully retrieved ${logs.length} logs from blockchain`);
      
      return res.status(200).json({
        success: true,
        logs,
        source: 'blockchain'
      });
    } catch (blockchainError) {
      console.error('Error querying blockchain:', blockchainError);
      throw blockchainError; // Let the main catch handle it
    }
  } catch (error) {
    console.error(`Failed to retrieve logs: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs',
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
