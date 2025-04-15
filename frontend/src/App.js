import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
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
    </ThemeProvider>
  );
}

export default App;
