import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Logs API
export const logsApi = {
  // Get all logs
  getAllLogs: async () => {
    try {
      // First try the standard getAllLogs endpoint
      const response = await api.get('/logs');
      // If logs array is empty, try the time range approach as fallback
      if (response.data && response.data.success && Array.isArray(response.data.logs) && response.data.logs.length === 0) {
        console.log('No logs found with primary method, trying time range approach...');
        return getLogsByTimeRange();
      }
      return response;
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Fall back to time range approach
      return getLogsByTimeRange();
    }
  },
  
  // Get log by ID
  getLogById: async (id) => {
    return api.get(`/logs/${id}`);
  },
  
  // Get logs by user ID
  getLogsByUser: async (userId) => {
    return api.get(`/logs/user/${userId}`);
  },
  
  // Get logs by action
  getLogsByAction: async (action) => {
    return api.get(`/logs/action/${action}`);
  },
  
  // Get logs by resource
  getLogsByResource: async (resource) => {
    return api.get(`/logs/resource/${resource}`);
  },
  
  // Get logs by time range
  getLogsByTimeRange: async (startTime, endTime) => {
    return api.get(`/logs/timerange?startTime=${startTime}&endTime=${endTime}`);
  },
  
  // Create new log
  createLog: async (logData) => {
    return api.post('/logs', logData);
  }
};

// Helper function to fetch logs by time range as a fallback
const getLogsByTimeRange = async () => {
  // Set a wide time range to capture all logs
  const startTime = '2000-01-01T00:00:00Z'; // Far in the past
  const endTime = new Date().toISOString();  // Current time
  
  try {
    const response = await api.get(`/logs/timerange?startTime=${startTime}&endTime=${endTime}`);
    return response;
  } catch (error) {
    console.error('Error fetching logs by time range:', error);
    throw error;
  }
};

export default api;
