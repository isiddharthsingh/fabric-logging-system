import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if the user is already logged in on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = (username, password) => {
    // In a real app, you would validate these credentials against the backend
    if (username === 'admin' && password === 'adminpw') {
      const userData = { username, role: 'admin' };
      
      // Store auth data in localStorage
      localStorage.setItem('auth_token', 'dummy-token-for-demo');
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      // Log login event
      const loginTime = new Date().toISOString();
      const loginEvents = JSON.parse(localStorage.getItem('login_events') || '[]');
      loginEvents.push({ action: 'login', timestamp: loginTime, user: username });
      localStorage.setItem('login_events', JSON.stringify(loginEvents));
      
      // Update state
      setIsAuthenticated(true);
      setUser(userData);
      
      return true;
    }
    
    return false;
  };

  // Logout function
  const logout = () => {
    // Log logout event
    const logoutTime = new Date().toISOString();
    const loginEvents = JSON.parse(localStorage.getItem('login_events') || '[]');
    loginEvents.push({ action: 'logout', timestamp: logoutTime, user: user?.username });
    localStorage.setItem('login_events', JSON.stringify(loginEvents));
    
    // Clear auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Update state
    setIsAuthenticated(false);
    setUser(null);
  };

  // Get login history
  const getLoginHistory = () => {
    return JSON.parse(localStorage.getItem('login_events') || '[]');
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    getLoginHistory
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
