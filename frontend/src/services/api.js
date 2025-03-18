import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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
    return api.get('/logs');
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

export default api;
