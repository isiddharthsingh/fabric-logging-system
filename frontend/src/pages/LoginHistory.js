import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { format } from 'date-fns';

function LoginHistory() {
  const { getLoginHistory } = useAuth();
  const loginEvents = getLoginHistory();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Login History
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        View the history of login and logout events for the system.
      </Typography>

      <Paper elevation={2} sx={{ mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loginEvents.length > 0 ? (
                loginEvents.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip 
                        label={event.action === 'login' ? 'Login' : 'Logout'} 
                        color={event.action === 'login' ? 'success' : 'error'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{event.user}</TableCell>
                    <TableCell>
                      {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No login history available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default LoginHistory;
