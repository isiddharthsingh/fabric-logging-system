import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Theme Context
import { ThemeProvider, useThemeMode } from './contexts/ThemeContext';

// Pages
import Dashboard from './pages/Dashboard';
import LogsList from './pages/LogsList';
import UserLogs from './pages/UserLogs';
import CreateLog from './pages/CreateLog';
import PageNotFound from './pages/PageNotFound';
import WazuhPage from './pages/WazuhPage';

// Components
import Layout from './components/Layout';

// Import custom theme
import createAppTheme from './theme';

// App wrapper that uses ThemeContext
function AppContent() {
  const { mode } = useThemeMode();
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logs" element={<LogsList />} />
          <Route path="/logs/user/:userId" element={<UserLogs />} />
          <Route path="/logs/create" element={<CreateLog />} />
          <Route path="/wazuh" element={<WazuhPage />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Layout>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
