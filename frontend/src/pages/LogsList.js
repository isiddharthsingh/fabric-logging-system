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
  InputLabel
} from '@mui/material';
import { logsApi } from '../services/api';
import moment from 'moment';

const LogsList = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  
  useEffect(() => {
    fetchLogs();
  }, []);
  
  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter]);
  
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await logsApi.getAllLogs();
      
      // Check if response contains logs property (API response format)
      if (response.data && response.data.success && response.data.logs) {
        setLogs(response.data.logs);
        setFilteredLogs(response.data.logs);
      } else if (Array.isArray(response.data)) {
        // Fallback if direct array is returned
        setLogs(response.data);
        setFilteredLogs(response.data);
      } else {
        // No logs found
        setLogs([]);
        setFilteredLogs([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to fetch logs. Please try again later.');
      setLoading(false);
    }
  };
  
  const filterLogs = () => {
    let filtered = logs;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by action
    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    setFilteredLogs(filtered);
    setPage(0);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handleActionFilterChange = (event) => {
    setActionFilter(event.target.value);
  };
  
  const getUniqueActions = () => {
    const actions = logs.map(log => log.action);
    return [...new Set(actions)];
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
        <Typography variant="h4" className="page-title">Logs</Typography>
        <Paper sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" className="page-title">Logs</Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 200 }}
        />
        
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="action-filter-label">Filter by Action</InputLabel>
          <Select
            labelId="action-filter-label"
            id="action-filter"
            value={actionFilter}
            label="Filter by Action"
            onChange={handleActionFilterChange}
          >
            <MenuItem value="">All Actions</MenuItem>
            {getUniqueActions().map(action => (
              <MenuItem key={action} value={action}>{action}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Paper>
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default LogsList;
