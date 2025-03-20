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
  Grid
} from '@mui/material';
import { logsApi } from '../services/api';
import moment from 'moment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import usePageLogger from '../hooks/usePageLogger';

const UserLogs = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
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
      setLogs(response.data);
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
      case 'VISIT':
        return 'primary';
      case 'API_CALL':
        return 'secondary';
      case 'LOGIN':
        return 'success';
      case 'LOGOUT':
        return 'warning';
      case 'ERROR':
        return 'error';
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
    <Box sx={{ mt: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={goBack}
        sx={{ mb: 2 }}
      >
        Back to Logs
      </Button>
      
      <Typography variant="h4" className="page-title">User Logs: {userId}</Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Total Activities</Typography>
            <Typography variant="h3" sx={{ textAlign: 'center', my: 2 }}>{logs.length}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>First Activity</Typography>
            <Typography variant="body1" sx={{ textAlign: 'center', my: 2 }}>
              {logs.length > 0 ? moment(logs[0].timestamp).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Latest Activity</Typography>
            <Typography variant="body1" sx={{ textAlign: 'center', my: 2 }}>
              {logs.length > 0 ? moment(logs[logs.length - 1].timestamp).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="user logs table">
            <TableHead>
              <TableRow>
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
                  <TableRow key={log.id} hover>
                    <TableCell>{log.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action} 
                        color={getActionColor(log.action)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>{moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                    <TableCell>{log.description}</TableCell>
                  </TableRow>
                ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No logs found for this user
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default UserLogs;
