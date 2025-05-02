import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useThemeMode } from '../contexts/ThemeContext';
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
  Button,
  Card,
  CardContent,
  InputAdornment,
  Divider,
  useTheme
} from '@mui/material';
import { logsApi } from '../services/api';
import moment from 'moment';
import usePageLogger from '../hooks/usePageLogger';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssessmentIcon from '@mui/icons-material/Assessment';

const LogsList = () => {
  const theme = useTheme();
  const { mode } = useThemeMode();
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
    'API_CALL', 'API_REQUEST', 'PAGE_VISIT', 'TEST_LOG', 'ERROR'
  ]);

  // Hard-coded action types that should always be shown
  const defaultActionTypes = [
    'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 
    'API_CALL', 'API_REQUEST', 'PAGE_VISIT', 'TEST_LOG', 'ERROR'
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
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      case 'VIEW':
        return 'primary';
      case 'TEST_LOG':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  const getEffectiveSeverity = (log) => {
    // First check if log has a direct severity property
    if (log.severity) {
      return log.severity;
    }
    
    // Check for severity encoded in the description field
    if (log.description) {
      if (log.description.startsWith('[HIGH]')) {
        return 'HIGH';
      }
      if (log.description.startsWith('[MEDIUM]')) {
        return 'MEDIUM';
      }
    }
    
    // Special case for the exact pattern currently in production for user info updates
    if (log.action === 'USER_ACTION_COMPLETED' && 
        log.description && 
        log.description.toLowerCase().includes('user information')) {
      return 'HIGH';
    }
    
    // Special case for login/success messages
    if (log.action === 'LOGIN' || 
        (log.description && 
         (log.description.toLowerCase().includes('success') || 
          log.description.toLowerCase().includes('logged in') || 
          log.description.toLowerCase().includes('sign in')))) {
      return 'MEDIUM';
    }
    
    // Then check in metadata (might be stored there from the backend)
    if (log.metadata) {
      if (typeof log.metadata === 'string') {
        try {
          const parsedMetadata = JSON.parse(log.metadata);
          if (parsedMetadata.severity) {
            return parsedMetadata.severity;
          }
          if (parsedMetadata.priorityLevel) {
            return parsedMetadata.priorityLevel;
          }
          if (parsedMetadata.successMessage) {
            return 'MEDIUM';
          }
        } catch (e) {
          // Failed to parse metadata, continue with other checks
        }
      } else if (typeof log.metadata === 'object') {
        if (log.metadata.severity) {
          return log.metadata.severity;
        }
        if (log.metadata.priorityLevel) {
          return log.metadata.priorityLevel;
        }
        if (log.metadata.successMessage) {
          return 'MEDIUM';
        }
      }
    }
    
    // Check for user information update patterns
    if ((log.action === 'INFO' || log.action === 'UPDATE_USER') && 
        (log.description && log.description.toLowerCase().includes('user information'))) {
      return 'HIGH';
    }
    
    // Default severity
    return 'LOW';
  };

  // Custom styling for severity chips based on severity level
  const getSeverityChipStyle = (severity) => {
    const baseStyle = {
      fontWeight: 500,
      fontSize: '0.75rem',
      borderRadius: '4px',
      height: '24px'
    };
    
    // Custom styling for different severity levels
    if (severity === 'LOW') {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(3, 169, 244, 0.15)',
        color: '#0288d1',
        border: '1px solid rgba(3, 169, 244, 0.5)',
        boxShadow: '0 0 5px rgba(3, 169, 244, 0.4)'
      };
    } else if (severity === 'MEDIUM') {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
        color: '#f57c00',
        border: '1px solid rgba(255, 193, 7, 0.5)',
        boxShadow: '0 0 5px rgba(255, 193, 7, 0.4)'
      };
    } else if (severity === 'HIGH') {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
        color: '#d32f2f',
        border: '1px solid rgba(244, 67, 54, 0.5)',
        boxShadow: '0 0 5px rgba(244, 67, 54, 0.4)'
      };
    }
    
    return baseStyle;
  };

  // Display loading state or logs table
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
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>System Logs</Typography>
          <Typography variant="body2" color="text.secondary">
            Complete log history of the logs
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />} 
          onClick={fetchLogs}
          disabled={loading}
          sx={{ 
            borderRadius: '8px',
            px: 2,
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
          size="medium"
        >
          Refresh Logs
        </Button>
      </Box>
      
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3, 
            flexWrap: 'wrap', 
            gap: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Log Entries ({filteredLogs.length})</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                placeholder="Search logs..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ 
                  minWidth: { xs: '100%', sm: 220 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl variant="outlined" size="small" sx={{ 
                minWidth: { xs: '100%', sm: 200 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}>
                <InputLabel id="action-filter-label">Filter by Action</InputLabel>
                <Select
                  labelId="action-filter-label"
                  id="action-filter"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  label="Filter by Action"
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {availableActions.map(action => (
                    <MenuItem key={action} value={action}>{action}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
        
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
          <TableContainer sx={{ 
            maxHeight: { xs: 'calc(100vh - 350px)', sm: 'calc(100vh - 300px)' },
            overflowY: 'auto',
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.05)',
            }
          }}>
            <Table sx={{ minWidth: 650 }} aria-label="logs table" size="medium">
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: theme.palette.background.default,
                  '& th': { 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    whiteSpace: 'nowrap',
                    padding: { xs: '8px 6px', sm: '16px' }
                  }
                }}>
                  <TableCell>ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => (
                    <TableRow key={log.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' } }}>
                      <TableCell sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                        color: theme.palette.text.secondary,
                        padding: { xs: '8px 6px', sm: '16px' },
                        maxWidth: { xs: '80px', sm: '150px' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{log.id}</TableCell>
                      <TableCell sx={{ 
                        padding: { xs: '8px 6px', sm: '16px' },
                        maxWidth: { xs: '80px', sm: '120px' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        <Link 
                          to={`/logs/user/${log.userId}`} 
                          style={{ 
                            color: mode === 'dark' ? '#a6c8ff' : theme.palette.primary.main, 
                            textDecoration: 'none',
                            fontWeight: 500,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {log.userId}
                        </Link>
                      </TableCell>
                      <TableCell sx={{ padding: { xs: '8px 6px', sm: '16px' } }}>
                        <Chip 
                          label={log.action} 
                          color={getActionColor(log.action)} 
                          size="small" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            borderRadius: '4px',
                            height: { xs: '20px', sm: '24px' }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        padding: { xs: '8px 6px', sm: '16px' },
                        maxWidth: { xs: '80px', sm: '150px' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{log.resource}</TableCell>
                      <TableCell sx={{ padding: { xs: '8px 6px', sm: '16px' } }}>
                        <Chip 
                          label={getEffectiveSeverity(log)} 
                          color={getSeverityColor(getEffectiveSeverity(log))} 
                          size="small" 
                          sx={{
                            ...getSeverityChipStyle(getEffectiveSeverity(log)),
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            height: { xs: '20px', sm: '24px' }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                        color: theme.palette.text.secondary,
                        padding: { xs: '8px 6px', sm: '16px' },
                        whiteSpace: 'nowrap'
                      }}>
                        {moment(log.timestamp).format('MM/DD/YYYY HH:mm:ss')}
                      </TableCell>
                      <TableCell sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        padding: { xs: '8px 6px', sm: '16px' },
                        maxWidth: { xs: '120px', sm: '200px' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{log.description}</TableCell>
                    </TableRow>
                  ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography variant="body1" color="text.secondary">
                          No logs found matching your criteria
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedAction('');
                          }}
                          sx={{ mt: 1, borderRadius: '8px' }}
                        >
                          Clear Filters
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </CardContent>
      </Card>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ 
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              color: theme.palette.text.secondary
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default LogsList;
