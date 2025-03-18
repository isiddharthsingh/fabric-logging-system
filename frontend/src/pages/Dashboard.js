import React, { useState, useEffect } from 'react';
import { Typography, Grid, Paper, Box, CircularProgress } from '@mui/material';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { logsApi } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStats, setActionStats] = useState([]);
  const [resourceStats, setResourceStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  
  useEffect(() => {
    fetchLogs();
  }, []);
  
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await logsApi.getAllLogs();
      
      // Handle different API response formats
      let logsData = [];
      if (response.data && response.data.success && response.data.logs) {
        // Standard API response format
        logsData = response.data.logs;
      } else if (Array.isArray(response.data)) {
        // Fallback for direct array format
        logsData = response.data;
      }
      
      setLogs(logsData);
      
      // Process data for charts
      processChartData(logsData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to fetch logs data. Please try again later.');
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
      <Typography variant="h4" className="page-title">Dashboard</Typography>
      
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
