import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Contexts
import { ThemeProvider, useThemeMode } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import LogsList from './pages/LogsList';
import UserLogs from './pages/UserLogs';
import CreateLog from './pages/CreateLog';
import PageNotFound from './pages/PageNotFound';
import WazuhPage from './pages/WazuhPage';
import Login from './pages/Login';
import LoginHistory from './pages/LoginHistory';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Import custom theme
import createAppTheme from './theme';

// App wrapper that uses ThemeContext
function AppContent() {
  const { mode } = useThemeMode();
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/logs" element={
          <PrivateRoute>
            <Layout>
              <LogsList />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/logs/user/:userId" element={
          <PrivateRoute>
            <Layout>
              <UserLogs />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/logs/create" element={
          <PrivateRoute>
            <Layout>
              <CreateLog />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/wazuh" element={
          <PrivateRoute>
            <Layout>
              <WazuhPage />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/login-history" element={
          <PrivateRoute>
            <Layout>
              <LoginHistory />
            </Layout>
          </PrivateRoute>
        } />
        
        {/* Redirect to login if not found */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
