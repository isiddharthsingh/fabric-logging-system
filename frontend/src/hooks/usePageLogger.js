import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageVisit } from '../services/loggingService';

/**
 * Custom hook to automatically log page visits
 * @param {string} pageName - The name of the page
 * @param {object} additionalData - Any additional data to log
 */
const usePageLogger = (pageName, additionalData = {}) => {
  const location = useLocation();
  
  useEffect(() => {
    // Log page visit when component mounts or route changes
    const logVisit = async () => {
      await logPageVisit(pageName, {
        ...additionalData,
        path: location.pathname,
        search: location.search,
        hash: location.hash
      });
    };
    
    logVisit();
    
    // We return a cleanup function in case we want to log page exits in the future
    return () => {
      // Could implement page exit logging here if desired
    };
  }, [pageName, location.pathname, location.search, location.hash, additionalData]);
};

export default usePageLogger;
