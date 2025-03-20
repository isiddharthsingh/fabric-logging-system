const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { enrollAdmin } = require('./fabric/network');
const loggingMiddleware = require('./middleware/loggingMiddleware');
require('dotenv').config();

// Import routes
const logsRoutes = require('./routes/logs');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Apply the automatic logging middleware to all routes
app.use(loggingMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is running' });
});

// API Routes
app.use('/api/logs', logsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: err.message
  });
});

// Initialize the Fabric network connection and start the server
async function startServer() {
  try {
    // Enroll the admin user
    console.log('Enrolling admin user...');
    const enrolled = await enrollAdmin();
    
    if (enrolled) {
      console.log('Admin enrolled successfully');
    } else {
      console.warn('Admin enrollment may have failed, check the logs for details');
    }
    
    // Start the server
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log('API endpoints:');
      console.log('  GET    /api/logs - Get all logs');
      console.log('  GET    /api/logs/:id - Get log by ID');
      console.log('  GET    /api/logs/user/:userId - Get logs by user ID');
      console.log('  GET    /api/logs/action/:action - Get logs by action');
      console.log('  GET    /api/logs/resource/:resource - Get logs by resource');
      console.log('  GET    /api/logs/timerange?startTime=X&endTime=Y - Get logs by time range');
      console.log('  POST   /api/logs - Create a new log');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
