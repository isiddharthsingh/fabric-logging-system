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
    // Skip logging for dashboard pages
    if (pageName === 'LogsList' || 
        pageName === 'Dashboard' || 
        pageName.toLowerCase().includes('dashboard') ||
        pageName.toLowerCase().includes('logs')) {
      console.log(`[LoggingService] Skipping log for dashboard page: ${pageName}`);
      return null;
    }
    
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

    // Get the current URL path
    const currentPath = window.location.pathname;
    const fullUrl = window.location.href;

    // Create log data
    const logData = {
      id: `LOG${uuidv4().replace(/-/g, '').substring(0, 12)}`, // Match backend format
      userId: userId,
      action: 'PAGE_VISIT',
      resource: pageName || 'unknown_page',
      timestamp: new Date().toISOString(),
      description: `User visited ${pageName} page`,
      metadata: {
        path: currentPath,
        fullUrl: fullUrl,
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        ...additionalData
      }
    };
    
    // Special handling for subscriptions URL to ensure HIGH severity
    if (currentPath.includes('/subscriptions') || 
        fullUrl.includes('/subscriptions') || 
        fullUrl.includes('shield-dev.futeur.ai/subscriptions')) {
      // Modify description to include keywords that will trigger HIGH severity
      logData.description = `User downloaded subscription report for ${pageName}`;
      logData.action = 'INFO';  // Using INFO type with keywords for HIGH severity
    }
    
    // Special handling for user information update to ensure HIGH severity
    if (currentPath.includes('/user') || 
        fullUrl.includes('/user') || 
        fullUrl.includes('/profile') ||
        (logData.description && logData.description.toLowerCase().includes('user information')) ||
        (additionalData && additionalData.userInfoUpdate)) {
      // Modify description to include keywords that will trigger HIGH severity
      logData.description = `User information updated: ${pageName}`;
      logData.action = 'INFO';  // Using INFO type with keywords for HIGH severity
      logData.severity = 'HIGH'; // This will be used by the frontend
      // Also add to metadata to ensure it's stored in the backend
      logData.metadata.severity = 'HIGH';
      logData.metadata.priorityLevel = 'HIGH';
      logData.metadata.userInfoUpdate = true;
    }
    
    // Special handling for login/signup to ensure MEDIUM severity
    if (currentPath.includes('/login') || 
        currentPath.includes('/signin') || 
        currentPath.includes('/signup') || 
        currentPath.includes('/register') ||
        fullUrl.includes('/login') || 
        fullUrl.includes('/signin') || 
        fullUrl.includes('/signup') || 
        fullUrl.includes('/register') ||
        (pageName && (
          pageName.toLowerCase().includes('login') || 
          pageName.toLowerCase().includes('signin') || 
          pageName.toLowerCase().includes('signup') || 
          pageName.toLowerCase().includes('register')
        )) ||
        (additionalData && additionalData.authEvent)) {
      // Modify description to include keywords that will trigger MEDIUM severity
      logData.description = `[MEDIUM] User ${additionalData && additionalData.authType ? additionalData.authType : 'login'} successful`;
      logData.action = 'LOGIN';  // Using LOGIN type for authentication events
      logData.severity = 'MEDIUM'; // This will be used by the frontend
      // Also add to metadata to ensure it's stored in the backend
      logData.metadata.severity = 'MEDIUM';
      logData.metadata.priorityLevel = 'MEDIUM';
      logData.metadata.successMessage = true;
      logData.metadata.authEvent = true;
    }
    
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
    // Skip logging for dashboard-related endpoints
    if (endpoint.includes('/dashboard') || 
        endpoint.includes('/api/status') || 
        endpoint.includes('/api/metrics') ||
        endpoint.includes('/api/logs')) {
      console.log(`Skipping log for dashboard API call: ${method} ${endpoint}`);
      return true;
    }

    const userId = getUserId();
    const timestamp = new Date().toISOString();
    
    // Check if this is a subscriptions-related endpoint
    const isSubscriptionEndpoint = endpoint.includes('/subscriptions');
    
    // Check if this is a user information update
    const isUserInfoUpdate = endpoint.includes('/user') || 
                             endpoint.includes('/profile') || 
                             (data && typeof data === 'object' && 
                              (data.userInfo || data.userUpdate || data.profileUpdate));
    
    const logData = {
      id: `LOG${uuidv4().replace(/-/g, '').substring(0, 12)}`, // Match backend format
      userId: userId,
      action: isSubscriptionEndpoint ? 'INFO' : isUserInfoUpdate ? 'INFO' : 'API_CALL',
      resource: endpoint || '/api',
      timestamp: timestamp,
      description: isSubscriptionEndpoint 
        ? `User downloaded subscription report via ${method} request to ${endpoint}` 
        : isUserInfoUpdate
        ? `User information updated via ${method} request to ${endpoint}`
        : `User made a ${method} request to ${endpoint}`,
      metadata: {
        method,
        data: data ? JSON.stringify(data) : null,
        userAgent: navigator.userAgent,
        severity: isUserInfoUpdate ? 'HIGH' : undefined,
        priorityLevel: isUserInfoUpdate ? 'HIGH' : undefined,
        userInfoUpdate: isUserInfoUpdate ? true : undefined
      },
      severity: isUserInfoUpdate ? 'HIGH' : undefined
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
    
    // Check if this is a user information update based on action, resource or description
    if (action === 'UPDATE_USER' || 
        resource === 'user' || 
        resource === 'profile' || 
        (description && description.toLowerCase().includes('user information')) ||
        (metadata && metadata.userInfoUpdate)) {
      // Set high priority for user information updates
      logData.severity = 'HIGH';
      // Also store in metadata for backend persistence
      logData.metadata.severity = 'HIGH';
      logData.metadata.priorityLevel = 'HIGH';
      logData.metadata.userInfoUpdate = true;
    }
    
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

/**
 * Log a successful authentication event (login or signup)
 * @param {string} authType - The type of authentication (login, signup, etc.)
 * @param {object} additionalData - Any additional data to include
 * @returns {Promise} - The API response or null if error
 */
export const logAuthEvent = async (authType = 'login', additionalData = {}) => {
  try {
    const userId = getUserId();
    const timestamp = new Date().toISOString();
    
    // Determine the appropriate description based on auth type
    let description = '';
    if (authType === 'signup' || authType === 'register' || authType === 'create') {
      description = `[MEDIUM] User successfully created`;
    } else if (authType === 'login' || authType === 'signin') {
      description = `[MEDIUM] User successfully signed in`;
    } else {
      description = `[MEDIUM] User ${authType} successful`;
    }
    
    // Create log data with auth event specifics
    const logData = {
      id: `LOG${uuidv4().replace(/-/g, '').substring(0, 12)}`, // Match backend format
      userId: userId,
      action: 'USER_ACTION_COMPLETED',
      resource: 'auth-system',
      timestamp: timestamp,
      description: description,
      metadata: {
        authType,
        userAgent: navigator.userAgent,
        timestamp,
        severity: 'MEDIUM',
        priorityLevel: 'MEDIUM',
        successMessage: true,
        authEvent: true,
        ...additionalData
      },
      severity: 'MEDIUM'
    };
    
    console.log(`Logging auth event: ${authType}`, logData);
    
    // Call the API to create a log entry
    const response = await api.post('/logs', logData);
    console.log('Auth log response:', response.data);
    
    return response;
  } catch (error) {
    console.error(`Error logging auth event: ${error}`);
    return null;
  }
};

export default {
  logPageVisit,
  logApiCall,
  createLog,
  logAuthEvent
};
