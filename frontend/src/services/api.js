import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Get a user ID - in a real app, this would come from authentication
const getUserId = () => {
  // Check if we already have a user ID in local storage
  let userId = localStorage.getItem('user_id');
  
  // If not, generate a new one and store it
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('user_id', userId);
  }
  
  return userId;
};

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for automatic logging and user ID
api.interceptors.request.use(
  config => {
    // Set the user ID header for backend automatic logging
    const userId = getUserId();
    config.headers['user-id'] = userId;
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Logs API
export const logsApi = {
  // Get all logs
  getAllLogs: async () => {
    console.log('Fetching all logs...');
    try {
      // Use the optimized endpoint which now has direct CouchDB access
      const response = await api.get('/logs');
      console.log(`Retrieved ${response.data.logs?.length || 0} logs from ${response.data.source || 'unknown source'}`);
      return response;
    } catch (error) {
      console.error('Error fetching all logs:', error);
      throw error;
    }
  },
  
  getLogById: async (logId) => {
    if (!logId) {
      throw new Error('Log ID is required');
    }
    
    console.log(`Fetching log by ID: ${logId}`);
    try {
      // Use the optimized endpoint which now has direct CouchDB access
      const response = await api.get(`/logs/${logId}`);
      console.log(`Retrieved log from ${response.data.source || 'unknown source'}`);
      return response;
    } catch (error) {
      console.error(`Error fetching log ${logId}:`, error);
      throw error;
    }
  },
  
  // Get logs by user ID
  getLogsByUser: async (userId) => {
    console.log(`Fetching logs for user: ${userId}`);
    try {
      // Use the optimized endpoint which now has direct CouchDB access
      const response = await api.get(`/logs/user/${userId}`);
      console.log(`Retrieved ${response.data.logs?.length || 0} logs from ${response.data.source || 'unknown source'}`);
      return response;
    } catch (error) {
      console.error(`Error fetching logs for user ${userId}:`, error);
      throw error;
    }
  },
  
  // Get logs by action
  getLogsByAction: async (action) => {
    if (!action) {
      throw new Error('Action is required');
    }
    
    console.log(`Fetching logs for action: ${action}`);
    try {
      // Use the optimized endpoint which now has direct CouchDB access
      const response = await api.get(`/logs/action/${action}`);
      console.log(`Retrieved ${response.data.logs?.length || 0} logs from ${response.data.source || 'unknown source'}`);
      return response;
    } catch (error) {
      console.error(`Error fetching logs for action ${action}:`, error);
      throw error;
    }
  },
  
  // Create a new log
  createLog: async (logData) => {
    return api.post('/logs', logData);
  },
  
  // Custom implementation to get latest page visit logs
  getLatestPageVisitLogs: async () => {
    // Try to retrieve user ID from local storage
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.log('No user ID found in local storage');
      return { data: { logs: [] } };
    }
    
    try {
      console.log(`Fetching page visit logs for user ${userId}...`);
      // Use the optimized endpoint which now has direct CouchDB access
      const response = await api.get(`/logs/action/PAGE_VISIT`);
      
      if (response.data && response.data.logs) {
        // Filter logs to only show those for the current user
        const userLogs = response.data.logs.filter(log => log.userId === userId);
        console.log(`Retrieved ${userLogs.length} page visit logs for current user`);
        return { data: { logs: userLogs, source: response.data.source } };
      } else {
        console.log('Invalid response format for page visit logs:', response.data);
        return { data: { logs: [] } };
      }
    } catch (error) {
      console.error('Error fetching page visit logs:', error);
      return { data: { logs: [] } };
    }
  },
  
  // Get reliable logs with optimized approach
  getReliableLogs: async () => {
    // First try using the optimized endpoint with direct CouchDB access
    try {
      console.log('Fetching logs using optimized CouchDB approach...');
      const response = await api.get('/logs');
      
      if (response.data && response.data.success && Array.isArray(response.data.logs)) {
        console.log(`Retrieved ${response.data.logs.length} logs from ${response.data.source || 'unknown source'}`);
        return response;
      }
    } catch (standardError) {
      console.error('Error in optimized log fetch attempt:', standardError);
    }
    
    // If the main endpoint fails, try getting logs by ID
    try {
      console.log('Trying to get recent logs by ID...');
      // Get recent logs from localStorage
      const recentLogIds = JSON.parse(localStorage.getItem('recent_logs') || '[]');
      const lastCreatedLogId = localStorage.getItem('last_created_log_id');
      
      if (lastCreatedLogId && !recentLogIds.includes(lastCreatedLogId)) {
        recentLogIds.push(lastCreatedLogId);
      }
      
      if (recentLogIds.length > 0) {
        const logs = [];
        
        for (const logId of recentLogIds) {
          try {
            const response = await api.get(`/logs/${logId}`);
            if (response.data && response.data.success && response.data.log) {
              logs.push(response.data.log);
            }
          } catch (error) {
            console.error(`Error fetching log ${logId}:`, error);
          }
        }
        
        if (logs.length > 0) {
          console.log(`Retrieved ${logs.length} logs by ID`);
          return {
            data: {
              success: true,
              logs,
              source: 'direct-id-lookup'
            }
          };
        }
      }
    } catch (idLookupError) {
      console.error('Error in ID lookup attempt:', idLookupError);
    }
    
    // Final fallback: try to get logs by the action types we know work
    // These are the action types observed in the console logs
    const workingActionTypes = ['LOGIN', 'API_CALL', 'PAGE_VISIT', 'API_REQUEST', 'TEST_LOG'];
    let allLogs = [];
    
    for (const action of workingActionTypes) {
      try {
        console.log(`Fetching logs for action: ${action}`);
        const response = await api.get(`/logs/action/${action}`);
        
        if (response.data && response.data.success && Array.isArray(response.data.logs)) {
          console.log(`Retrieved ${response.data.logs.length} logs for action ${action}`);
          // Add logs to combined result, avoiding duplicates
          response.data.logs.forEach(log => {
            if (!allLogs.some(existingLog => existingLog.id === log.id)) {
              allLogs.push(log);
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching logs for action ${action}:`, error);
      }
    }
    
    // Sort the combined logs by timestamp
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    console.log(`Retrieved a total of ${allLogs.length} logs from fallback approach`);
    
    return { 
      data: { 
        success: true,
        logs: allLogs,
        source: 'fallback'
      } 
    };
  }
};

export default api;
