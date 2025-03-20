import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  TextField,
  Box,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import { logsApi } from '../services/api';
import moment from 'moment';
import usePageLogger from '../hooks/usePageLogger';
import RefreshIcon from '@mui/icons-material/Refresh';

const LogsList = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [availableActions, setAvailableActions] = useState([
    'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 
    'API_CALL', 'PAGE_VISIT', 'API_REQUEST', 'TEST_LOG', 'ERROR'
  ]);

  // Hard-coded action types that should always be shown
  const defaultActionTypes = [
    'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 
    'API_CALL', 'PAGE_VISIT', 'API_REQUEST', 'TEST_LOG', 'ERROR'
  ];

  // Automatically log this page visit
  usePageLogger('LogsList', { view: 'all_logs' });
  
  useEffect(() => {
    fetchLogs();
    
    // Refresh logs when the window regains focus
    const handleFocus = () => {
      fetchLogs();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  useEffect(() => {
    handleFilterChange();
  }, [logs, searchTerm, selectedAction]);
  
  // Helper function to deduplicate logs
  const deduplicateLogs = (logsArray) => {
    const uniqueLogMap = {};
    
    logsArray.forEach(log => {
      // Create a key based on ID
      const key = log.id;
      
      // Either store the first instance or replace with newer timestamp
      if (!uniqueLogMap[key] || new Date(log.timestamp) > new Date(uniqueLogMap[key].timestamp)) {
        uniqueLogMap[key] = log;
      }
    });
    
    // Convert map back to array and sort by timestamp (newest first)
    return Object.values(uniqueLogMap).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  };
  
  const fetchLogs = async () => {
    try {
      setLoading(true);
      console.log("Fetching logs...");
      setError(null); // Clear any previous errors
      
      // Use a single comprehensive method instead of multiple calls
      console.log("Using reliable logs method...");
      const reliableResponse = await logsApi.getReliableLogs();
      
      let combinedLogs = [];
      
      if (reliableResponse?.data?.success && Array.isArray(reliableResponse?.data?.logs)) {
        console.log(`Retrieved ${reliableResponse.data.logs.length} logs using reliable method`);
        combinedLogs = [...reliableResponse.data.logs];
      }
      
      // Only use the standard endpoint as fallback if we didn't get logs from reliable method
      if (combinedLogs.length === 0) {
        try {
          console.log("Fetching from standard logs API...");
          const standardResponse = await logsApi.getAllLogs();
          
          if (standardResponse?.data?.success && Array.isArray(standardResponse?.data?.logs)) {
            console.log(`Retrieved ${standardResponse.data.logs.length} logs from standard API`);
            combinedLogs = [...combinedLogs, ...standardResponse.data.logs];
          }
        } catch (standardError) {
          console.error("Error fetching logs from standard endpoint:", standardError);
        }
      }
      
      if (combinedLogs.length > 0) {
        // Filter out recent API_REQUEST logs (logs from our own API requests)
        // Keep only logs older than 2 minutes or non-API_REQUEST logs
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
        
        // Deduplicate and sort logs
        const uniqueLogs = deduplicateLogs(filteredLogs);
        console.log(`Total unique logs after deduplication: ${uniqueLogs.length}`);
        
        // Extract available actions from logs
        const actionsFromLogs = new Set();
        uniqueLogs.forEach(log => {
          if (log.action) {
            actionsFromLogs.add(log.action);
          }
        });
        
        // Merge existing actions with newly found ones
        setAvailableActions(prevActions => {
          const allActions = new Set([...defaultActionTypes, ...prevActions, ...actionsFromLogs]);
          return Array.from(allActions).sort();
        });
        
        setLogs(uniqueLogs);
        setError(null);
      } else {
        console.error("No logs were retrieved from any method");
        setError("Failed to retrieve logs from the blockchain. Please try again later.");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error in fetchLogs:", error);
      setLoading(false);
      setError("An error occurred while fetching logs. Please try again.");
    }
  };
  
  // Filter logs based on search input and selected action
  const handleFilterChange = () => {
    let filtered = logs;
    
    // Apply search filter if there's a search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.id?.toLowerCase().includes(search) ||
        log.userId?.toLowerCase().includes(search) ||
        log.action?.toLowerCase().includes(search) ||
        log.resource?.toLowerCase().includes(search) ||
        log.description?.toLowerCase().includes(search)
      );
    }
    
    // Apply action filter if an action is selected
    if (selectedAction) {
      filtered = filtered.filter(log => log.action === selectedAction);
      console.log(`Filtered to ${filtered.length} logs with action ${selectedAction}`);
    }
    
    setFilteredLogs(filtered);
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
        return 'primary';
      case 'API_CALL':
      case 'API_REQUEST':
        return 'secondary';
      case 'LOGIN':
        return 'success';
      case 'LOGOUT':
        return 'warning';
      case 'ERROR':
        return 'error';
      case 'CREATE':
        return 'info';
      default:
        return 'default';
    }
  };

  // Display loading state or logs table
  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" className="page-title">Logs</Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={fetchLogs}
          disabled={loading}
        >
          Refresh Logs
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="action-filter-label">Filter by Action</InputLabel>
            <Select
              labelId="action-filter-label"
              id="action-filter"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              label="Filter by Action"
            >
              <MenuItem value="">All Actions</MenuItem>
              {availableActions.map(action => (
                <MenuItem key={action} value={action}>{action}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" className="page-title">Logs</Typography>
            <Paper sx={{ p: 3 }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="logs table">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>{log.id}</TableCell>
                      <TableCell>
                        <Link to={`/logs/user/${log.userId}`}>
                          {log.userId}
                        </Link>
                      </TableCell>
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
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredLogs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default LogsList;
