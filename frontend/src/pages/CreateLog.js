import React, { useState } from 'react';
import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { logsApi } from '../services/api';

const CreateLog = () => {
  const [formData, setFormData] = useState({
    userId: '',
    action: '',
    resource: '',
    description: '',
    metadata: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.userId || !formData.action || !formData.resource) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Parse metadata if provided
      let metadataObj = {};
      if (formData.metadata) {
        try {
          metadataObj = JSON.parse(formData.metadata);
        } catch (err) {
          setError('Invalid JSON in metadata field');
          setLoading(false);
          return;
        }
      }
      
      // Submit the log
      const response = await logsApi.createLog({
        userId: formData.userId,
        action: formData.action,
        resource: formData.resource,
        description: formData.description,
        metadata: metadataObj
      });
      
      setSuccess(`Log created successfully with ID: ${response.data.logId}`);
      
      // Reset form
      setFormData({
        userId: '',
        action: '',
        resource: '',
        description: '',
        metadata: ''
      });
      
      setLoading(false);
    } catch (err) {
      setError('Failed to create log: ' + (err.response?.data?.error || err.message));
      setLoading(false);
      console.error('Error creating log:', err);
    }
  };
  
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" className="page-title">Create New Log</Typography>
      
      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="User ID"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="action-label">Action</InputLabel>
                <Select
                  labelId="action-label"
                  id="action"
                  name="action"
                  value={formData.action}
                  label="Action"
                  onChange={handleChange}
                >
                  <MenuItem value="VISIT">VISIT</MenuItem>
                  <MenuItem value="API_CALL">API_CALL</MenuItem>
                  <MenuItem value="LOGIN">LOGIN</MenuItem>
                  <MenuItem value="LOGOUT">LOGOUT</MenuItem>
                  <MenuItem value="ERROR">ERROR</MenuItem>
                  <MenuItem value="TRANSACTION">TRANSACTION</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Resource"
                name="resource"
                value={formData.resource}
                onChange={handleChange}
                variant="outlined"
                placeholder="e.g., /dashboard, /api/users, etc."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Metadata (JSON)"
                name="metadata"
                value={formData.metadata}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={4}
                placeholder='{"key": "value", "nested": {"example": true}}'
                helperText="Enter valid JSON metadata (optional)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Log'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateLog;
