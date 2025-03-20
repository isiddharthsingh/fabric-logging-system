import React, { useState, useEffect } from 'react';
import { Typography, Grid, Paper, Box, CircularProgress, Button } from '@mui/material';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { logsApi } from '../services/api';
import usePageLogger from '../hooks/usePageLogger';
import { createLog } from '../services/loggingService';
import RefreshIcon from '@mui/icons-material/Refresh';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStats, setActionStats] = useState([]);
  const [resourceStats, setResourceStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  
  // Automatically log this page visit
  usePageLogger('Dashboard', { dashboardView: 'main' });
  
  useEffect(() => {
    fetchLogs();
  }, []);
  
  // Function to create a test log
  const createTestLog = async () => {
    try {
      const result = await createLog(
        'TEST_LOG', 
        '/dashboard', 
        'This is a test log created manually', 
        { testValue: 'test123', timestamp: new Date().toISOString() }
      );
      
      if (result) {
        alert('Test log created successfully! Please refresh logs to see it.');
        fetchLogs(); // Refresh logs after creating a test log
      } else {
        alert('Failed to create test log. Check console for errors.');
      }
    } catch (error) {
      console.error('Error creating test log:', error);
      alert('Error creating test log: ' + error.message);
    }
  };
  
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching logs for dashboard...');
      
      // Use a single comprehensive method to reduce API calls
      console.log('Using reliable logs method...');
      const reliableResponse = await logsApi.getReliableLogs();
      
      let combinedLogs = [];
      
      if (reliableResponse?.data?.success && Array.isArray(reliableResponse?.data?.logs)) {
        console.log(`Retrieved ${reliableResponse.data.logs.length} logs using reliable method`);
        combinedLogs = [...reliableResponse.data.logs];
      }
      
      // Only use standard endpoint as fallback if we got no logs from reliable method
      if (combinedLogs.length === 0) {
        try {
          console.log('Trying standard endpoint...');
          const response = await logsApi.getAllLogs();
          
          if (response.data && response.data.success && Array.isArray(response.data.logs)) {
            combinedLogs = [...combinedLogs, ...response.data.logs];
            console.log(`Retrieved ${response.data.logs.length} logs from standard endpoint`);
          }
        } catch (error) {
          console.error('Error fetching logs via standard method:', error);
        }
      }
      
      // Filter out recent API_REQUEST logs to prevent recursive logging
      const twoMinutesAgo = new Date();
      twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
      
      const filteredLogs = combinedLogs.filter(log => {
        // For API_REQUEST logs, only keep the older ones
        if (log.action === 'API_REQUEST') {
          return new Date(log.timestamp) < twoMinutesAgo;
        }
        // Keep all other log types regardless of timestamp
        return true;
      });
      
      console.log(`Filtered out ${combinedLogs.length - filteredLogs.length} recent API_REQUEST logs`);
      
      // Deduplicate logs
      const uniqueLogMap = {};
      filteredLogs.forEach(log => {
        const key = log.id;
        if (!uniqueLogMap[key] || new Date(log.timestamp) > new Date(uniqueLogMap[key].timestamp)) {
          uniqueLogMap[key] = log;
        }
      });
      
      const uniqueLogs = Object.values(uniqueLogMap);
      console.log(`Total unique logs for dashboard: ${uniqueLogs.length}`);
      
      setLogs(uniqueLogs);
      processChartData(uniqueLogs);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching logs for dashboard:', err);
      setError('Failed to fetch logs. Please try again.');
      setLoading(false);
    }
  };
  
  const processChartData = (logsData) => {
    // Process action statistics
    const actionCounts = {};
    const resourceCounts = {};
    const userCounts = {};
    
    logsData.forEach(log => {
      // Count actions
      if (actionCounts[log.action]) {
        actionCounts[log.action]++;
      } else {
        actionCounts[log.action] = 1;
      }
      
      // Count resources
      if (resourceCounts[log.resource]) {
        resourceCounts[log.resource]++;
      } else {
        resourceCounts[log.resource] = 1;
      }
      
      // Count users
      if (userCounts[log.userId]) {
        userCounts[log.userId]++;
      } else {
        userCounts[log.userId] = 1;
      }
    });
    
    // Convert to chart format
    const actionData = Object.keys(actionCounts).map(key => ({
      name: key,
      value: actionCounts[key]
    }));
    
    const resourceData = Object.keys(resourceCounts).map(key => ({
      name: key,
      value: resourceCounts[key]
    }));
    
    const userData = Object.keys(userCounts).map(key => ({
      name: key,
      value: userCounts[key]
    }));
    
    setActionStats(actionData);
    setResourceStats(resourceData);
    setUserStats(userData);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" className="page-title">Dashboard</Typography>
        <Paper sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" className="page-title">Dashboard</Typography>
        <Box>
          <Button 
            variant="outlined" 
            onClick={fetchLogs} 
            sx={{ mr: 2 }}
            startIcon={<RefreshIcon />}
          >
            Refresh Logs
          </Button>
          <Button 
            variant="contained" 
            onClick={createTestLog}
            color="primary"
          >
            Create Test Log
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Total Logs</Typography>
            <Typography variant="h3" sx={{ textAlign: 'center', my: 3 }}>{logs.length}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Unique Users</Typography>
            <Typography variant="h3" sx={{ textAlign: 'center', my: 3 }}>{userStats.length}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Unique Resources</Typography>
            <Typography variant="h3" sx={{ textAlign: 'center', my: 3 }}>{resourceStats.length}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Actions Distribution</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {
                    actionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Resource Usage</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={resourceStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>User Activity</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={userStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
