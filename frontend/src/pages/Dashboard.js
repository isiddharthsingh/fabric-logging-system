import React, { useState, useEffect } from 'react';
import { 
  Typography, Grid, Paper, Box, CircularProgress, Button, Card, CardContent,
  CardHeader, Divider, IconButton, useTheme, Chip, Stack, Tab, Tabs,
  LinearProgress, Avatar, List, ListItem, ListItemText, ListItemAvatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, Scatter, ScatterChart, ZAxis, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { logsApi } from '../services/api';
import usePageLogger from '../hooks/usePageLogger';
import { createLog } from '../services/loggingService';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import RepeatIcon from '@mui/icons-material/Repeat';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import moment from 'moment';

// Modern color palette for charts
const COLORS = ['#3a36e0', '#ff5c93', '#00c853', '#ffaa00', '#0095ff', '#ff3d71', '#6f6fe9', '#ff8db7', '#5efc82', '#ffdd4b'];

// Gradient colors for area charts
const GRADIENTS = {
  primary: ['#3a36e0', 'rgba(58, 54, 224, 0.2)'],
  secondary: ['#ff5c93', 'rgba(255, 92, 147, 0.2)'],
  success: ['#00c853', 'rgba(0, 200, 83, 0.2)'],
  warning: ['#ffaa00', 'rgba(255, 170, 0, 0.2)'],
  info: ['#0095ff', 'rgba(0, 149, 255, 0.2)'],
  error: ['#ff3d71', 'rgba(255, 61, 113, 0.2)']
};

const Dashboard = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStats, setActionStats] = useState([]);
  const [resourceStats, setResourceStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [timeStats, setTimeStats] = useState([]);
  const [errorStats, setErrorStats] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [userRetention, setUserRetention] = useState({
    returningUsers: 0,
    oneTimeUsers: 0,
    retentionRate: 0,
    userVisitData: []
  });
  const [topResources, setTopResources] = useState([]);
  const [activityTrend, setActivityTrend] = useState([]);
  const [periodComparison, setPeriodComparison] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    success: 0,
    warning: 0,
    error: 0,
    total: 0
  });
  const [tabValue, setTabValue] = useState(0);
  const [userActivityView, setUserActivityView] = useState('most'); // 'most' or 'least'
  const [timeComparisonPeriod, setTimeComparisonPeriod] = useState('day'); // 'day', 'week', 'month'
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedTimeChartUser, setSelectedTimeChartUser] = useState('all'); // 'all' or specific user ID
  const [timeChartUserQuery, setTimeChartUserQuery] = useState('');
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const toggleUserActivityView = () => {
    setUserActivityView(prev => prev === 'most' ? 'least' : 'most');
  };

  const handlePeriodChange = (period) => {
    setTimeComparisonPeriod(period);
  };
  
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
    if (!logsData.length) return;
    
    // Process action statistics
    const actionCounts = {};
    const resourceCounts = {};
    const userCounts = {};
    const hourCounts = {};
    const dayCounts = {};
    const errorLogs = [];
    const timeData = {};
    const resourceErrors = {};
    
    // Get the most recent logs for the recent activity panel
    const sortedByTime = [...logsData].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    setRecentLogs(sortedByTime.slice(0, 10));
    
    // Calculate time periods for trends
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousPeriod = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    // Initialize hourly data for the last 24 hours
    for (let i = 0; i < 24; i++) {
      const hour = moment().subtract(i, 'hours').startOf('hour').format('HH:00');
      timeData[hour] = { hour, count: 0 };
    }
    
    // Initialize daily data for the last 7 days
    for (let i = 0; i < 7; i++) {
      const day = moment().subtract(i, 'days').format('ddd');
      dayCounts[day] = 0;
    }
    
    // Initialize period comparison data
    const currentPeriodData = {};
    const previousPeriodData = {};
    const currentWeekData = {};
    const previousWeekData = {};
    
    // For current period (last 24 hours)
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      currentPeriodData[hour] = 0;
      previousPeriodData[hour] = 0;
    }
    
    // For weekly data (last 7 days)
    for (let i = 0; i < 7; i++) {
      const day = moment().subtract(i, 'days').format('ddd');
      currentWeekData[day] = 0;
    }
    
    // For previous week data (7-14 days ago)
    for (let i = 7; i < 14; i++) {
      const day = moment().subtract(i, 'days').format('ddd');
      previousWeekData[day] = 0;
    }
    
    // Initialize user session tracking
    const userSessionMap = {};
    
    // Initialize user retention tracking
    const userVisitDays = {};
    const userFirstVisit = {};
    const userLastVisit = {};
    
    // System health counters
    let successCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    
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
      
      // Process time-based data
      const logTime = new Date(log.timestamp);
      
      // Count by hour of day
      const hour = logTime.getHours();
      if (hourCounts[hour]) {
        hourCounts[hour]++;
      } else {
        hourCounts[hour] = 1;
      }
      
      // Populate time trend data for the last 24 hours
      if (logTime > last24Hours) {
        const hourKey = moment(logTime).startOf('hour').format('HH:00');
        if (timeData[hourKey]) {
          timeData[hourKey].count++;
        }
        
        // For period comparison - current period (day)
        const hourStr = logTime.getHours().toString().padStart(2, '0');
        currentPeriodData[hourStr]++;
        
        // For weekly comparison - current week
        const dayOfWeek = moment(logTime).format('ddd');
        if (currentWeekData.hasOwnProperty(dayOfWeek)) {
          currentWeekData[dayOfWeek]++;
        }
      } else if (logTime > previousPeriod && logTime <= last24Hours) {
        // For period comparison - previous period (day)
        const hourStr = logTime.getHours().toString().padStart(2, '0');
        previousPeriodData[hourStr]++;
      } else if (logTime > last7Days && logTime <= last30Days) {
        // For weekly comparison - previous week
        const dayOfWeek = moment(logTime).format('ddd');
        if (previousWeekData.hasOwnProperty(dayOfWeek)) {
          previousWeekData[dayOfWeek]++;
        }
      }
      
      // Populate day trend data for the last 7 days
      if (logTime > last7Days) {
        const dayKey = moment(logTime).format('ddd');
        if (dayCounts.hasOwnProperty(dayKey)) {
          dayCounts[dayKey]++;
        }
      }
      
      // Track user sessions
      if (log.userId) {
        if (!userSessionMap[log.userId]) {
          userSessionMap[log.userId] = {
            userId: log.userId,
            firstSeen: logTime,
            lastSeen: logTime,
            actions: 1,
            resources: new Set([log.resource]),
            // Track activity by day and hour for each user
            activityByDay: {},
            activityByHour: {}
          };
        } else {
          const session = userSessionMap[log.userId];
          session.actions++;
          session.resources.add(log.resource);
          
          if (logTime < session.firstSeen) {
            session.firstSeen = logTime;
          }
          
          if (logTime > session.lastSeen) {
            session.lastSeen = logTime;
          }
        }
        
        // Track user visit days for retention analysis
        const visitDay = moment(logTime).format('YYYY-MM-DD');
        if (!userVisitDays[log.userId]) {
          userVisitDays[log.userId] = new Set([visitDay]);
          userFirstVisit[log.userId] = logTime;
        } else {
          userVisitDays[log.userId].add(visitDay);
        }
        
        // Update last visit
        if (!userLastVisit[log.userId] || logTime > userLastVisit[log.userId]) {
          userLastVisit[log.userId] = logTime;
        }
        
        // Track activity by day and hour for this user
        const dayKey = moment(logTime).format('ddd');
        const hourKey = logTime.getHours().toString().padStart(2, '0');
        
        if (!userSessionMap[log.userId].activityByDay[dayKey]) {
          userSessionMap[log.userId].activityByDay[dayKey] = 0;
        }
        userSessionMap[log.userId].activityByDay[dayKey]++;
        
        if (!userSessionMap[log.userId].activityByHour[hourKey]) {
          userSessionMap[log.userId].activityByHour[hourKey] = 0;
        }
        userSessionMap[log.userId].activityByHour[hourKey]++;
      }
      
      // Collect error logs
      if (log.action === 'ERROR') {
        errorLogs.push(log);
        
        // Count errors by resource
        if (resourceErrors[log.resource]) {
          resourceErrors[log.resource]++;
        } else {
          resourceErrors[log.resource] = 1;
        }
      }
      
      // Count for system health
      if (log.action === 'ERROR') {
        errorCount++;
      } else if (['WARNING', 'LOGOUT'].includes(log.action)) {
        warningCount++;
      } else {
        successCount++;
      }
    });
    
    // Convert to chart format
    const actionData = Object.keys(actionCounts)
      .map(key => ({
        name: key,
        value: actionCounts[key]
      }))
      .sort((a, b) => b.value - a.value);
    
    const resourceData = Object.keys(resourceCounts)
      .map(key => ({
        name: key,
        value: resourceCounts[key]
      }))
      .sort((a, b) => b.value - a.value);
    
    const userData = Object.keys(userCounts)
      .map(key => ({
        name: key,
        value: userCounts[key]
      }))
      .sort((a, b) => b.value - a.value);
    
    // Create time distribution data
    const timeDistribution = Object.keys(hourCounts).map(hour => ({
      hour: `${hour}:00`,
      count: hourCounts[hour]
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    
    // Create time trend data (last 24 hours)
    const timeTrend = Object.values(timeData).reverse();
    
    // Create day trend data (last 7 days)
    const dayTrend = Object.entries(dayCounts).map(([day, count]) => ({
      day,
      count
    }));
    
    // Get top and bottom users
    const topUsersList = userData.slice(0, 10);
    const bottomUsersList = [...userData].reverse().slice(0, 10);
    
    // Get top resources
    const topResourcesList = resourceData.slice(0, 5);
    
    // Error statistics
    const errorData = Object.keys(resourceErrors).map(key => ({
      name: key,
      value: resourceErrors[key]
    })).sort((a, b) => b.value - a.value);
    
    // Process user session data
    const userSessionData = Object.values(userSessionMap).map(session => ({
      userId: session.userId,
      duration: (session.lastSeen - session.firstSeen) / (1000 * 60), // in minutes
      actions: session.actions,
      uniqueResources: session.resources.size
    })).sort((a, b) => b.actions - a.actions);
    
    // Create period comparison data - daily (for all users and individual users)
    const dailyComparisonData = [];
    const userDailyData = {};
    
    // Initialize user-specific daily data
    Object.keys(userSessionMap).forEach(userId => {
      userDailyData[userId] = [];
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        userDailyData[userId].push({
          label: `${hour}:00`,
          current: userSessionMap[userId].activityByHour[hour] || 0,
          previous: 0 // We don't track previous period by user currently
        });
      }
    });
    
    // Create aggregate daily data for all users
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      dailyComparisonData.push({
        label: `${hour}:00`,
        current: currentPeriodData[hour] || 0,
        previous: previousPeriodData[hour] || 0
      });
    }
    
    // Create period comparison data - weekly (for all users and individual users)
    const weeklyComparisonData = [];
    const userWeeklyData = {};
    
    // Get days in correct order (Sunday to Saturday)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize user-specific weekly data
    Object.keys(userSessionMap).forEach(userId => {
      userWeeklyData[userId] = [];
      daysOfWeek.forEach(day => {
        userWeeklyData[userId].push({
          label: day,
          current: userSessionMap[userId].activityByDay[day] || 0,
          previous: 0 // We don't track previous period by user currently
        });
      });
    });
    
    // Create aggregate weekly data for all users
    daysOfWeek.forEach(day => {
      weeklyComparisonData.push({
        label: day,
        current: currentWeekData[day] || 0,
        previous: previousWeekData[day] || 0
      });
    });
    
    // Create user-specific data for filtering
    const allUserSessions = Object.values(userSessionMap).map(session => ({
      userId: session.userId,
      duration: (session.lastSeen - session.firstSeen) / (1000 * 60), // in minutes
      actions: session.actions,
      uniqueResources: session.resources.size,
      activityByDay: session.activityByDay,
      activityByHour: session.activityByHour
    })).sort((a, b) => b.actions - a.actions);
    
    // Calculate user retention metrics
    const totalUsers = Object.keys(userVisitDays).length;
    const returningUsers = Object.values(userVisitDays).filter(days => days.size > 1).length;
    const oneTimeUsers = totalUsers - returningUsers;
    const retentionRate = totalUsers > 0 ? Math.round((returningUsers / totalUsers) * 100) : 0;
    
    // Create user visit data for visualization
    const userVisitData = Object.keys(userVisitDays).map(userId => {
      const visitCount = userVisitDays[userId].size;
      const firstVisit = userFirstVisit[userId];
      const lastVisit = userLastVisit[userId];
      const daysSinceFirstVisit = moment().diff(moment(firstVisit), 'days');
      const daysBetweenVisits = moment(lastVisit).diff(moment(firstVisit), 'days');
      
      return {
        userId,
        visitCount,
        daysSinceFirstVisit,
        daysBetweenVisits,
        returning: visitCount > 1
      };
    }).sort((a, b) => b.visitCount - a.visitCount);
    
    // Set all the state variables
    setActionStats(actionData);
    setResourceStats(resourceData);
    setUserStats(userData);
    setTimeStats(timeTrend);
    setErrorStats(errorData);
    setTopUsers(topUsersList);
    setTopResources(topResourcesList);
    setActivityTrend(dayTrend);
    setPeriodComparison({
      daily: dailyComparisonData,
      weekly: weeklyComparisonData,
      userDaily: userDailyData,
      userWeekly: userWeeklyData
    });
    setUserSessions(allUserSessions);
    setSystemHealth({
      success: successCount,
      warning: warningCount,
      error: errorCount,
      total: logsData.length
    });
    setUserRetention({
      returningUsers,
      oneTimeUsers,
      retentionRate,
      userVisitData: userVisitData.slice(0, 10) // Top 10 users by visit count
    });
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
    <Box sx={{ mt: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>System Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Monitoring and analytics for Hyperledger Fabric logging system
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            onClick={fetchLogs} 
            startIcon={<RefreshIcon />}
            sx={{ 
              borderRadius: '8px',
              px: 2
            }}
          >
            Refresh Data
          </Button>
          <Button 
            variant="contained" 
            onClick={createTestLog}
            color="primary"
            sx={{ 
              borderRadius: '8px',
              px: 2
            }}
          >
            Create Test Log
          </Button>
        </Box>
      </Box>
      
      {/* System Health Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px', 
                bgcolor: theme.palette.primary.main 
              }}
            />
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>Total Logs</Typography>
                <Avatar sx={{ bgcolor: theme.palette.primary.light, width: 40, height: 40 }}>
                  <StorageIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{logs.length}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  icon={<TrendingUpIcon fontSize="small" />} 
                  label={`${logs.length > 0 ? Math.round((recentLogs.length / logs.length) * 100) : 0}% recent`} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(58, 54, 224, 0.1)', 
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px', 
                bgcolor: theme.palette.success.main 
              }}
            />
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>Success Rate</Typography>
                <Avatar sx={{ bgcolor: theme.palette.success.light, width: 40, height: 40 }}>
                  <CheckCircleIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {systemHealth.total > 0 ? Math.round((systemHealth.success / systemHealth.total) * 100) : 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={systemHealth.total > 0 ? (systemHealth.success / systemHealth.total) * 100 : 0} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4, 
                  bgcolor: 'rgba(0, 200, 83, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.success.main
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px', 
                bgcolor: theme.palette.warning.main 
              }}
            />
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>Warnings</Typography>
                <Avatar sx={{ bgcolor: theme.palette.warning.light, width: 40, height: 40 }}>
                  <WarningIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{systemHealth.warning}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  icon={<TrendingUpIcon fontSize="small" />} 
                  label={`${systemHealth.total > 0 ? Math.round((systemHealth.warning / systemHealth.total) * 100) : 0}% of total`} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(255, 170, 0, 0.1)', 
                    color: theme.palette.warning.main,
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px', 
                bgcolor: theme.palette.error.main 
              }}
            />
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>Errors</Typography>
                <Avatar sx={{ bgcolor: theme.palette.error.light, width: 40, height: 40 }}>
                  <ErrorIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{systemHealth.error}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  icon={systemHealth.error > 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />} 
                  label={`${systemHealth.total > 0 ? Math.round((systemHealth.error / systemHealth.total) * 100) : 0}% of total`} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(255, 61, 113, 0.1)', 
                    color: theme.palette.error.main,
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Activity Trends */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Activity Trends" 
              subheader="Log activity over the last 24 hours"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ 
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.1rem' },
                '& .MuiCardHeader-subheader': { fontSize: '0.85rem' }
              }}
            />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={timeStats}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#E7EBF0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={theme.palette.primary.main} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Logs */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader 
              title="Recent Activity" 
              subheader="Latest log entries"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ 
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.1rem' },
                '& .MuiCardHeader-subheader': { fontSize: '0.85rem' }
              }}
            />
            <Divider />
            <List sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 300 }}>
              {recentLogs.length > 0 ? (
                recentLogs.map((log, index) => (
                  <React.Fragment key={log.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: COLORS[index % COLORS.length],
                            width: 36,
                            height: 36
                          }}
                        >
                          {log.action ? log.action.charAt(0) : 'L'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {log.action}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {moment(log.timestamp).fromNow()} ({moment(log.timestamp).format('MM/DD/YYYY')})
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.primary" sx={{ display: 'block', fontSize: '0.85rem' }}>
                              {log.resource}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>
                              {log.description?.length > 50 ? `${log.description.substring(0, 50)}...` : log.description}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < recentLogs.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent logs found" />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>
        
        {/* Action Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Actions Distribution" 
              subheader="Breakdown of log actions"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ 
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.1rem' },
                '& .MuiCardHeader-subheader': { fontSize: '0.85rem' }
              }}
            />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={actionStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={110}
                    innerRadius={60}
                    paddingAngle={2}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {actionStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        stroke={theme.palette.background.paper}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }} 
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{
                      paddingLeft: '10px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Resource Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Resource Usage" 
              subheader="Most accessed resources"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ 
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.1rem' },
                '& .MuiCardHeader-subheader': { fontSize: '0.85rem' }
              }}
            />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={resourceStats.slice(0, 5)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="name" 
                    scale="point" 
                    padding={{ left: 20, right: 20 }}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#E7EBF0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }} 
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill={theme.palette.primary.main}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* User Retention Section */}
        <Grid item xs={12} md={12}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2, mb: 2 }}>
            User Retention Insights
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px', 
                bgcolor: theme.palette.primary.main 
              }}
            />
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>Retention Rate</Typography>
                <Avatar sx={{ bgcolor: theme.palette.primary.light, width: 40, height: 40 }}>
                  <RepeatIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{userRetention.retentionRate}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Percentage of users who return after first visit
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px', 
                bgcolor: theme.palette.success.main 
              }}
            />
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>Returning Users</Typography>
                <Avatar sx={{ bgcolor: theme.palette.success.light, width: 40, height: 40 }}>
                  <PersonAddIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{userRetention.returningUsers}</Typography>
              <Typography variant="body2" color="text.secondary">
                Users who visited on multiple days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px', 
                bgcolor: theme.palette.warning.main 
              }}
            />
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>One-Time Users</Typography>
                <Avatar sx={{ bgcolor: theme.palette.warning.light, width: 40, height: 40 }}>
                  <PersonOffIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{userRetention.oneTimeUsers}</Typography>
              <Typography variant="body2" color="text.secondary">
                Users who visited only once
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Top Users by Visit Frequency</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userRetention.userVisitData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="userId" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [value, name === 'visitCount' ? 'Visit Days' : name]} />
                    <Bar dataKey="visitCount" name="Visit Days" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>User Retention Details</Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                      <TableCell>User ID</TableCell>
                      <TableCell align="right">Visit Days</TableCell>
                      <TableCell align="right">Days Since First</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userRetention.userVisitData.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>{user.userId}</TableCell>
                        <TableCell align="right">{user.visitCount}</TableCell>
                        <TableCell align="right">{user.daysSinceFirstVisit}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={user.returning ? 'Returning' : 'One-time'} 
                            color={user.returning ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* User Activity */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="User Activity" 
              subheader={userActivityView === 'most' ? "Most active users" : "Least active users"}
              action={
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={toggleUserActivityView}
                  sx={{ 
                    borderRadius: '8px',
                    textTransform: 'none',
                    mr: 1
                  }}
                >
                  Show {userActivityView === 'most' ? 'Least' : 'Most'} Active
                </Button>
              }
              sx={{ 
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.1rem' },
                '& .MuiCardHeader-subheader': { fontSize: '0.85rem' }
              }}
            />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={userActivityView === 'most' ? userStats.slice(0, 10) : [...userStats].reverse().slice(0, 10)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                  barSize={30}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f5" />
                  <XAxis 
                    type="number"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#E7EBF0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }} 
                  />
                  <Bar 
                    dataKey="value" 
                    fill={theme.palette.secondary.main}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Error Analysis */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Error Analysis" 
              subheader="Resources with errors"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ 
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.1rem' },
                '& .MuiCardHeader-subheader': { fontSize: '0.85rem' }
              }}
            />
            <Divider />
            <CardContent>
              {errorStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart outerRadius={90} data={errorStats.slice(0, 5)}>
                    <PolarGrid stroke="#e0e0e0" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: theme.palette.text.secondary }} />
                    <Radar
                      name="Errors"
                      dataKey="value"
                      stroke={theme.palette.error.main}
                      fill={theme.palette.error.main}
                      fillOpacity={0.6}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: 8, 
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                        border: 'none'
                      }} 
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography variant="body1" color="text.secondary">
                    No error data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* New Insights Section */}
      <Grid container spacing={3}>
        {/* Period Comparison */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Time Comparison" 
              subheader="Current vs Previous Period"
              action={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box sx={{ position: 'relative', width: 200, mr: 1 }}>
                    <input
                      type="text"
                      placeholder="Search user or 'all'"
                      value={timeChartUserQuery}
                      onChange={(e) => {
                        setTimeChartUserQuery(e.target.value);
                        if (e.target.value.toLowerCase() === 'all') {
                          setSelectedTimeChartUser('all');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        fontSize: '14px'
                      }}
                    />
                    {timeChartUserQuery && timeChartUserQuery !== 'all' && (
                      <Box 
                        sx={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          width: '100%',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          bgcolor: 'background.paper',
                          borderRadius: '0 0 8px 8px',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                          zIndex: 10
                        }}
                      >
                        {userSessions
                          .filter(session => session.userId.toLowerCase().includes(timeChartUserQuery.toLowerCase()))
                          .map(session => (
                            <Box 
                              key={session.userId} 
                              sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' },
                                borderBottom: '1px solid #f0f0f0'
                              }}
                              onClick={() => {
                                setSelectedTimeChartUser(session.userId);
                                setTimeChartUserQuery(session.userId);
                              }}
                            >
                              {session.userId}
                            </Box>
                          ))
                        }
                      </Box>
                    )}
                  </Box>
                  {selectedTimeChartUser !== 'all' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedTimeChartUser('all');
                        setTimeChartUserQuery('');
                      }}
                      sx={{ borderRadius: '8px', textTransform: 'none', mr: 1 }}
                    >
                      Reset
                    </Button>
                  )}
                  <Button 
                    variant={timeComparisonPeriod === 'day' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handlePeriodChange('day')}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                  >
                    Day
                  </Button>
                  <Button 
                    variant={timeComparisonPeriod === 'week' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handlePeriodChange('week')}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                  >
                    Week
                  </Button>
                </Box>
              }
              sx={{ 
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.1rem' },
                '& .MuiCardHeader-subheader': { fontSize: '0.85rem' }
              }}
            />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={
                    selectedTimeChartUser === 'all' ?
                      (timeComparisonPeriod === 'day' ? periodComparison.daily : periodComparison.weekly) :
                      (timeComparisonPeriod === 'day' ? 
                        periodComparison.userDaily[selectedTimeChartUser] : 
                        periodComparison.userWeekly[selectedTimeChartUser])
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#E7EBF0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="current" name="Current Period" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previous" name="Previous Period" fill={theme.palette.secondary.light} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* User Session Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="User Session Analysis" 
              subheader="User engagement metrics"
              action={
                <Box sx={{ width: 200, mr: 1 }}>
                  <input
                    type="text"
                    placeholder="Search user ID"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      fontSize: '14px'
                    }}
                  />
                </Box>
              }
              sx={{ 
                '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.1rem' },
                '& .MuiCardHeader-subheader': { fontSize: '0.85rem' }
              }}
            />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300, overflowY: 'auto' }}>
                <List>
                  {userSessions.length > 0 ? (
                    userSessions
                      .filter(session => session.userId.toLowerCase().includes(userSearchQuery.toLowerCase()))
                      .slice(0, userSearchQuery ? 20 : 5)
                      .map((session, index) => (
                      <React.Fragment key={session.userId}>
                        <ListItem alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: COLORS[index % COLORS.length],
                                width: 40,
                                height: 40
                              }}
                            >
                              {session.userId.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {session.userId}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Session Duration
                                    </Typography>
                                    <Typography variant="body2">
                                      {session.duration.toFixed(1)} minutes
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Actions
                                    </Typography>
                                    <Typography variant="body2">
                                      {session.actions}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">
                                      Resources Accessed
                                    </Typography>
                                    <Typography variant="body2">
                                      {session.uniqueResources}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < userSessions.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No session data available" />
                    </ListItem>
                  )}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
