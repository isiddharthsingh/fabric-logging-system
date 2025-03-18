import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import Dashboard from './pages/Dashboard';
import LogsList from './pages/LogsList';
import UserLogs from './pages/UserLogs';
import CreateLog from './pages/CreateLog';
import PageNotFound from './pages/PageNotFound';

// Components
import Layout from './components/Layout';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

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
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
