import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  CircularProgress,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  useTheme
} from '@mui/material';
import { logsApi } from '../services/api';
import moment from 'moment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import UpdateIcon from '@mui/icons-material/Update';
import usePageLogger from '../hooks/usePageLogger';

const UserLogs = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Automatically log this page visit with the user ID
  usePageLogger('UserLogs', { userId: userId });

  useEffect(() => {
    fetchUserLogs();
  }, [userId]);
  
  const fetchUserLogs = async () => {
    try {
      setLoading(true);
      const response = await logsApi.getLogsByUser(userId);
      
      // Access the logs array from the response structure
      // The API returns {success: true, logs: [...], source: 'couchdb'}
      if (response.data && response.data.logs) {
        console.log(`Received ${response.data.logs.length} logs from ${response.data.source}`);
        
        // Sort logs by timestamp (newest first)
        const sortedLogs = [...response.data.logs].sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        console.log('Logs sorted by timestamp (newest first)');
        setLogs(sortedLogs);
      } else {
        console.warn('No logs found or unexpected response format:', response.data);
        setLogs([]);
      }
      
      setLoading(false);
    } catch (err) {
      setError(`Failed to fetch logs for user ${userId}. Please try again later.`);
      setLoading(false);
      console.error('Error fetching user logs:', err);
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const getActionColor = (action) => {
    switch (action) {
      case 'PAGE_VISIT':
      case 'VISIT':
        return 'primary';
      case 'API_CALL':
      case 'API_REQUEST':
      case 'TEST_LOG':
        return 'secondary';
      case 'LOGIN':
        return 'success';
      case 'LOGOUT':
        return 'warning';
      case 'ERROR':
        return 'error';
      case 'CREATE':
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      case 'VIEW':
        return 'primary';
      default:
        return 'default';
    }
  };
  
  const goBack = () => {
    navigate('/logs');
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
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={goBack}
          sx={{ mb: 2 }}
        >
          Back to Logs
        </Button>
        
        <Typography variant="h4" className="page-title">User Logs: {userId}</Typography>
        <Paper sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />} 
            onClick={goBack}
            sx={{ 
              mb: 2,
              borderRadius: '8px'
            }}
          >
            Back to Logs
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>User Activity: {userId}</Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed log history for this user
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
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
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>Total Activities</Typography>
                <Avatar sx={{ bgcolor: theme.palette.primary.light, width: 40, height: 40 }}>
                  <TimelineIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{logs.length}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  label="All time activity" 
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
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px', 
                bgcolor: theme.palette.info.main 
              }}
            />
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>First Activity</Typography>
                <Avatar sx={{ bgcolor: theme.palette.info.light, width: 40, height: 40 }}>
                  <HistoryIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {logs.length > 0 ? moment(logs.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0].timestamp).format('MM/DD/YYYY') : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {logs.length > 0 ? moment(logs.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0].timestamp).format('HH:mm:ss') : ''}
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
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>Latest Activity</Typography>
                <Avatar sx={{ bgcolor: theme.palette.success.light, width: 40, height: 40 }}>
                  <UpdateIcon fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {logs.length > 0 ? moment(logs[0].timestamp).format('MM/DD/YYYY') : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {logs.length > 0 ? moment(logs[0].timestamp).format('HH:mm:ss') : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>User Activity Log</Typography>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <TableContainer sx={{ 
            maxHeight: 'calc(100vh - 400px)',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.05)',
            }
          }}>
            <Table sx={{ minWidth: 650 }} aria-label="user logs table">
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: theme.palette.background.default,
                  '& th': { 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem'
                  }
                }}>
                  <TableCell>ID</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {logs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((log) => (
                  <TableRow key={log.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' } }}>
                    <TableCell sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>{log.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action} 
                        color={getActionColor(log.action)} 
                        size="small" 
                        sx={{ 
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          borderRadius: '4px',
                          height: '24px'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{log.resource}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                      {moment(log.timestamp).format('MM/DD/YYYY HH:mm:ss')}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{log.description}</TableCell>
                  </TableRow>
                ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                      <Typography variant="body1" color="text.secondary">
                        No activity logs found for this user
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </TableContainer>
        </CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={logs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ 
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: '0.875rem',
                color: theme.palette.text.secondary
              },
              '.MuiTablePagination-select': {
                fontSize: '0.875rem'
              }
            }}
          />
        </Box>
      </Card>
    </Box>
  );
};

export default UserLogs;
