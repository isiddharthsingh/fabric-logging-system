# Hyperledger Fabric Logging System

A comprehensive logging system built on Hyperledger Fabric with CouchDB for storing and querying user event logs. This system captures and records all user events, such as page visits and API calls, in a secure and immutable blockchain ledger.

## Features

- **Immutable Logging**: Capture and store user events with tamper-proof blockchain technology
- **Rich Querying**: Utilize CouchDB's rich query capabilities to search and filter logs
- **Interactive Dashboard**: Visualize log data with charts and statistics
- **User-Specific Views**: Analyze logs by user, action, resource, or time range
- **Simple API**: Easily integrate with any application to record events
- **Docker Deployment**: Fully containerized for easy setup and deployment

## System Architecture

The application consists of the following components:

1. **Hyperledger Fabric Network**: A blockchain network with a single organization
2. **CouchDB**: State database for storing and querying chaincode data
3. **Chaincode**: Go-based smart contract for log management
4. **Express.js Backend**: API server for interacting with the blockchain
5. **React Frontend**: User interface for viewing and creating logs

## Prerequisites

- Docker and Docker Compose
- Node.js (v12.0.0 or later)
- Go (1.17 or later for chaincode development)

## Directory Structure

```
fabric-logging-system/
├── backend/               # Express.js backend API
├── chaincode/             # Hyperledger Fabric chaincode (Go)
├── frontend/              # React frontend application
├── network/               # Hyperledger Fabric network configuration
├── scripts/               # Utility scripts for setup and deployment
└── README.md              # Project documentation
```

## Setup Instructions

Follow these steps to set up and run the entire system:

### 1. Set up the Hyperledger Fabric environment

First, make sure the scripts are executable and start the network:

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start the network, create channel, and deploy chaincode
./scripts/run-network.sh
```

### 2. Start the backend API server

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the backend server
node src/index.js
```

The backend API will be available at http://localhost:3000

You should see these API endpoints available:
- GET    /api/logs - Get all logs
- GET    /api/logs/:id - Get log by ID
- GET    /api/logs/user/:userId - Get logs by user ID
- GET    /api/logs/action/:action - Get logs by action
- GET    /api/logs/resource/:resource - Get logs by resource
- GET    /api/logs/timerange?startTime=X&endTime=Y - Get logs by time range
- POST   /api/logs - Create a new log

### 3. Start the frontend application

Open a new terminal window/tab and run:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm start
```

The frontend will be available at http://localhost:3001

### 4. Create and view logs

1. Navigate to http://localhost:3001 in your browser
2. Go to the "Create Log" page
3. Fill out the log form with details:
   - User ID (e.g., "user123", "gg", or any identifier)
   - Action (e.g., "LOGIN", "API_CALL", "TRANSACTION")
   - Resource (e.g., "/dashboard", "application", "/api")
   - Description (any text describing the event)
   - Metadata (optional JSON metadata like `{"ip":"192.168.1.1","browser":"Chrome"}`)
4. Submit the form to create a log
5. Navigate to the "Logs List" page to view all logs
6. Use the Dashboard to see visualizations of log data

### 5. Stop the system

When you're done, you can stop all components:

```bash
# Stop the frontend (Ctrl+C in its terminal)

# Stop the backend (Ctrl+C in its terminal)

# Stop the network
./scripts/stop-network.sh
```

## Troubleshooting

### Common Issues

1. **Cannot connect to the peer**: Make sure the network is running and the connection profile is correctly configured.
   ```bash
   # Check if containers are running
   docker ps
   ```

2. **Blockchain logs not appearing in frontend**: 
   - Check if the backend is running and can connect to the network
   - Verify the backend logs in the terminal for any errors
   - Try restarting both the backend and frontend servers

3. **Backend connection errors**:
   - Ensure the wallet directory has the correct credentials
   - Check the connection profile in `backend/config/connection-org1.json`
   - Verify the backend `.env` file has the correct configuration

## API Testing

You can test the API endpoints directly using curl:

```bash
# Get all logs
curl -X GET http://localhost:3000/api/logs

# Get logs for a specific user
curl -X GET http://localhost:3000/api/logs/user/user123

# Create a new log
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "action": "LOGIN",
    "resource": "application",
    "description": "User logged in successfully",
    "metadata": {
      "ip": "192.168.1.1",
      "browser": "Chrome"
    }
  }'
```

## License

This project is licensed under the MIT License.
