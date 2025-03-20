import api from './api';
import { v4 as uuidv4 } from 'uuid';

// Get a user ID - in a real app, this would come from authentication
const getUserId = () => {
  // Check if we already have a user ID in local storage
  let userId = localStorage.getItem('user_id');
  
  // If not, generate a new one and store it
  if (!userId) {
    userId = `user_${uuidv4().substring(0, 8)}`;
    localStorage.setItem('user_id', userId);
  }
  
  return userId;
};

// Use debounce to prevent multiple logs for rapid page navigations
const pageVisitDebounce = {};

// Log a page visit to the blockchain
export const logPageVisit = async (pageName, additionalData = {}) => {
  try {
    const userId = getUserId();
    
    // Check if we've recently logged a visit to this same page (debounce for 2 seconds)
    const currentTime = Date.now();
    const lastVisitTime = pageVisitDebounce[pageName] || 0;
    
    if (currentTime - lastVisitTime < 2000) {
      console.log(`[LoggingService] Skipping duplicate page visit log for ${pageName} (debounced)`);
      return null;
    }
    
    // Update the debounce timestamp
    pageVisitDebounce[pageName] = currentTime;
    
    console.log(`[LoggingService] Logging page visit to ${pageName} for user ${userId}`);

    // Create log data
    const logData = {
      id: `LOG${uuidv4().replace(/-/g, '').substring(0, 12)}`, // Match backend format
      userId: userId,
      action: 'PAGE_VISIT',
      resource: pageName || 'unknown_page',
      timestamp: new Date().toISOString(),
      description: `User visited ${pageName} page`,
      metadata: {
        path: window.location.pathname,
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        ...additionalData
      }
    };
    
    // Set the user ID in the header for backend logging
    api.defaults.headers.common['user-id'] = userId;
    
    console.log('[LoggingService] Sending page visit log:', logData);
    
    // Call the API to create a log entry
    const response = await api.post('/logs', logData);
    console.log('[LoggingService] Log created response:', response.data);
    
    // Save the log ID in localStorage for verification
    if (response.data && response.data.success && response.data.logId) {
      const recentLogs = JSON.parse(localStorage.getItem('recent_logs') || '[]');
      recentLogs.push(response.data.logId);
      // Keep only the 10 most recent logs
      if (recentLogs.length > 10) {
        recentLogs.splice(0, recentLogs.length - 10);
      }
      localStorage.setItem('recent_logs', JSON.stringify(recentLogs));
      console.log(`[LoggingService] Saved log ID ${response.data.logId} to localStorage`);
    }
    
    return response;
  } catch (error) {
    console.error('Error logging page visit:', error);
    return null;
  }
};

// Log an API call
export const logApiCall = async (endpoint, method, data = null) => {
  try {
    const userId = getUserId();
    const timestamp = new Date().toISOString();
    
    const logData = {
      id: `LOG${uuidv4().replace(/-/g, '').substring(0, 12)}`, // Match backend format
      userId: userId,
      action: 'API_CALL',
      resource: endpoint || '/api',
      timestamp: timestamp,
      description: `User made a ${method} request to ${endpoint}`,
      metadata: {
        method,
        data: data ? JSON.stringify(data) : null,
        userAgent: navigator.userAgent
      }
    };
    
    console.log('Sending API call log:', logData);
    
    // We don't use the API service here to avoid infinite loops
    // This is a direct fetch call
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-id': userId
      },
      body: JSON.stringify(logData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Log response:', responseData);
    
    return true;
  } catch (error) {
    console.error('Error logging API call:', error);
    return false;
  }
};

// Generic log function that can be used for any action
export const createLog = async (action, resource, description, metadata = {}) => {
  try {
    const userId = getUserId();
    const timestamp = new Date().toISOString();
    
    const logData = {
      id: `LOG${uuidv4().replace(/-/g, '').substring(0, 12)}`, // Match backend format
      userId: userId,
      action: action || 'UNKNOWN_ACTION',
      resource: resource || 'unknown_resource',
      timestamp: timestamp,
      description: description || `User performed ${action} on ${resource}`,
      metadata: {
        userAgent: navigator.userAgent,
        ...metadata
      }
    };
    
    console.log('Creating generic log:', logData);
    
    // Call the API to create a log entry
    const response = await api.post('/logs', logData);
    console.log('Log response:', response.data);
    
    return true;
  } catch (error) {
    console.error('Error creating log:', error);
    return false;
  }
};

export default {
  logPageVisit,
  logApiCall,
  createLog
};
