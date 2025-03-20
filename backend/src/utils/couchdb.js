const { Gateway } = require('fabric-network');
const path = require('path');
const { URL } = require('url');
const http = require('http');
const https = require('https');
require('dotenv').config();
const nano = require('nano');

// CouchDB configuration - these should be in your .env file
const COUCHDB_URL = process.env.COUCHDB_URL || 'http://localhost:5984';
const COUCHDB_USERNAME = process.env.COUCHDB_USERNAME || 'admin';
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD || 'adminpw';
// Modify the database name to match what's actually being used
// Based on the curl output, the correct database name is logchannel_logging
const COUCHDB_DATABASE = process.env.COUCHDB_DATABASE || 'logchannel_logging';

// Print the configuration for debugging (without password)
console.log('CouchDB Configuration:');
console.log(`URL: ${COUCHDB_URL}`);
console.log(`Database: ${COUCHDB_DATABASE}`);
console.log(`Username: ${COUCHDB_USERNAME}`);

/**
 * Get direct access to CouchDB for faster queries
 * Returns a Nano instance for interacting with CouchDB
 */
const getCouchDBConnection = () => {
  // Create auth string
  const auth = `${COUCHDB_USERNAME}:${COUCHDB_PASSWORD}`;
  
  // Create the connection URL with auth
  const url = `${COUCHDB_URL.replace(/(https?:\/\/)/, `$1${auth}@`)}`;
  
  // Create Nano instance
  const nano = require('nano')(url);
  
  return nano;
};

/**
 * Query logs directly from CouchDB - much faster than going through the blockchain
 * @param {Object} options Query options
 * @returns {Array} Array of log objects
 */
async function queryLogsFromCouchDB(options = {}) {
  try {
    // Get nano instance
    const nano = getCouchDBConnection();
    
    // Check if database exists
    try {
      const dbList = await nano.db.list();
      if (!dbList.includes(COUCHDB_DATABASE)) {
        console.error(`Database ${COUCHDB_DATABASE} does not exist. Available databases: ${dbList.join(', ')}`);
        return null;
      }
    } catch (listError) {
      console.error('Error listing databases:', listError);
      return null;
    }
    
    // Get database reference
    const db = nano.use(COUCHDB_DATABASE);
    
    // Debug - check database info
    try {
      const info = await db.info();
      console.log(`Connected to CouchDB database: ${COUCHDB_DATABASE}`);
      console.log(`Database info: ${info.doc_count} documents, ${info.doc_del_count} deleted`);
    } catch (infoError) {
      console.error('Error getting database info:', infoError);
      // Continue - this is just debug info
    }
    
    // Query all docs
    const result = await db.list({ include_docs: true });
    
    if (!result || !result.rows) {
      console.log('No results found in CouchDB');
      return [];
    }
    
    // Map CouchDB docs to log format and filter out internal docs
    const logs = result.rows
      .filter(row => !row.id.startsWith('\u0000')) // Filter out system docs
      .map(row => {
        const doc = row.doc;
        
        // Process metadata to ensure it's an object
        let metadata = doc.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            // If it can't be parsed, create an object with the string as a property
            metadata = { raw: metadata };
          }
        } else if (!metadata) {
          metadata = {};
        }
        
        // Return the log object with processed metadata
        return {
          id: doc.id || doc._id,
          userId: doc.userId,
          action: doc.action,
          resource: doc.resource,
          timestamp: doc.timestamp,
          description: doc.description,
          metadata: metadata
        };
      });
    
    console.log(`Retrieved ${logs.length} logs from CouchDB`);
    return logs;
  } catch (error) {
    console.error(`Error querying CouchDB: ${error.message}`);
    return null;
  }
}

/**
 * Get a single log by ID directly from CouchDB
 * @param {string} id Log ID to retrieve
 * @returns {Promise<Object>} Log object or null if not found
 */
async function getLogByIdFromCouchDB(id) {
  if (!id) return null;
  
  try {
    console.log(`Retrieving log ${id} from CouchDB`);
    const nano = getCouchDBConnection();
    const db = nano.use(COUCHDB_DATABASE);
    
    try {
      const doc = await db.get(id);
      if (doc) {
        console.log(`Log ${id} found in CouchDB`);
        
        // Process metadata to ensure it's an object
        let metadata = doc.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            metadata = { raw: metadata };
          }
        } else if (!metadata) {
          metadata = {};
        }
        
        return {
          id: doc._id,
          userId: doc.userId,
          action: doc.action,
          resource: doc.resource,
          timestamp: doc.timestamp,
          description: doc.description,
          metadata: metadata
        };
      }
    } catch (err) {
      if (err.statusCode === 404) {
        console.log(`Log ${id} not found in CouchDB, falling back to blockchain query`);
      } else {
        console.error(`Error retrieving log ${id} from CouchDB:`, err);
      }
    }
    return null;
  } catch (error) {
    console.error(`Error in getLogByIdFromCouchDB for log ${id}:`, error);
    return null;
  }
}

/**
 * Get logs by action directly from CouchDB
 * This is already implemented in logs.js, but we'll export it for consistency
 */
async function getLogsByActionFromCouchDB(action) {
  try {
    console.log(`Fetching logs for action: ${action}`);
    
    // Get nano instance
    const nano = getCouchDBConnection();
    
    // Get database reference
    const db = nano.use(COUCHDB_DATABASE);
    
    // Create a selector to find logs by action
    const selector = {
      selector: {
        action: action
      },
      limit: 100
    };
    
    // Query CouchDB
    try {
      const result = await db.find(selector);
      
      if (result && result.docs && result.docs.length > 0) {
        console.log(`Found ${result.docs.length} logs for action ${action} in CouchDB`);
        
        // Process logs to ensure metadata is correctly formatted
        return result.docs.map(doc => {
          // Process metadata to ensure it's an object
          let metadata = doc.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              // If it can't be parsed, create an object with the string as a property
              metadata = { raw: metadata };
            }
          } else if (!metadata) {
            metadata = {};
          }
          
          // Return the log object with processed metadata
          return {
            id: doc.id || doc._id,
            userId: doc.userId,
            action: doc.action,
            resource: doc.resource,
            timestamp: doc.timestamp,
            description: doc.description,
            metadata: metadata
          };
        });
      } else {
        console.log(`No logs found in CouchDB for action ${action}, falling back to blockchain query`);
        return null;
      }
    } catch (queryError) {
      if (queryError.statusCode === 404) {
        console.log(`Database ${COUCHDB_DATABASE} does not exist or design document missing`);
      } else {
        console.error(`Error querying CouchDB for action ${action}:`, queryError);
      }
      return null;
    }
  } catch (error) {
    console.error(`Error in getLogsByActionFromCouchDB for action ${action}:`, error);
    return null;
  }
}

module.exports = {
  queryLogsFromCouchDB,
  getCouchDBConnection,
  COUCHDB_DATABASE,
  getLogByIdFromCouchDB,
  getLogsByActionFromCouchDB
};
