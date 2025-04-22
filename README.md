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

First, make sure the scripts are executable, then set up the Fabric environment, start the network, and set up the backend:

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Set up the Hyperledger Fabric environment
./scripts/setup-fabric.sh

# Start the network, create channel, and deploy chaincode
./scripts/run-network.sh

# Set up the backend environment
./scripts/setup-backend.sh
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

## Production Deployment

### Setting up Nginx as a Reverse Proxy

To make the application accessible on the standard HTTP port (80) without having to specify port numbers:

1. Install Nginx:
   ```bash
   apt-get update && apt-get install -y nginx
   ```

2. Create an Nginx configuration file:
   ```bash
   nano /etc/nginx/sites-available/fabric-logging-system
   ```

3. Add the following configuration (replace 134.199.178.80 with your server's IP address):
   ```
   server {
       listen 80;
       server_name 134.199.178.80;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api/ {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Create a symbolic link to enable the site:
   ```bash
   ln -s /etc/nginx/sites-available/fabric-logging-system /etc/nginx/sites-enabled/
   ```

5. Test the Nginx configuration:
   ```bash
   nginx -t
   ```

6. Restart Nginx to apply changes:
   ```bash
   systemctl restart nginx
   ```

### Setting up Systemd Services

To ensure the backend and frontend servers start automatically on system boot and run reliably:

1. Create a startup script for the backend:
   ```bash
   nano /root/fabric-logging-system/backend/start-server.sh
   ```

2. Add the following content:
   ```bash
   #!/bin/bash

   # Change to the backend directory
   cd /root/fabric-logging-system/backend

   # Export environment variables from .env file
   export $(grep -v '^#' .env | xargs)

   # Start the server
   node src/index.js
   ```

3. Create a startup script for the frontend:
   ```bash
   nano /root/fabric-logging-system/frontend/start-server.sh
   ```

4. Add the following content:
   ```bash
   #!/bin/bash

   # Change to the frontend directory
   cd /root/fabric-logging-system/frontend

   # Start the React development server on port 3001
   PORT=3001 npm start
   ```

5. Make both scripts executable:
   ```bash
   chmod +x /root/fabric-logging-system/backend/start-server.sh
   chmod +x /root/fabric-logging-system/frontend/start-server.sh
   ```

6. Create a systemd service file for the backend:
   ```bash
   nano /etc/systemd/system/fabric-logging-backend.service
   ```

7. Add the following content:
   ```
   [Unit]
   Description=Fabric Logging System Backend
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/root/fabric-logging-system/backend
   ExecStart=/bin/bash /root/fabric-logging-system/backend/start-server.sh
   Restart=on-failure
   RestartSec=10
   StandardOutput=syslog
   StandardError=syslog
   SyslogIdentifier=fabric-logging-backend

   [Install]
   WantedBy=multi-user.target
   ```

8. Create a systemd service file for the frontend:
   ```bash
   nano /etc/systemd/system/fabric-logging-frontend.service
   ```

9. Add the following content:
   ```
   [Unit]
   Description=Fabric Logging System Frontend
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/root/fabric-logging-system/frontend
   ExecStart=/bin/bash /root/fabric-logging-system/frontend/start-server.sh
   Restart=on-failure
   RestartSec=10
   StandardOutput=syslog
   StandardError=syslog
   SyslogIdentifier=fabric-logging-frontend

   [Install]
   WantedBy=multi-user.target
   ```

10. Reload the systemd daemon to recognize the new service files:
    ```bash
    systemctl daemon-reload
    ```

11. Enable the services to start automatically on system boot:
    ```bash
    systemctl enable fabric-logging-backend.service fabric-logging-frontend.service
    ```

12. Start the services:
    ```bash
    systemctl start fabric-logging-backend.service fabric-logging-frontend.service
    ```

13. Check the status of the services:
    ```bash
    systemctl status fabric-logging-backend.service
    systemctl status fabric-logging-frontend.service
    ```

14. View service logs if needed:
    ```bash
    journalctl -u fabric-logging-backend.service
    journalctl -u fabric-logging-frontend.service
    ```

15. Check which ports are in use:
    ```bash
    netstat -tulpn | grep -E ':(3000|3001|80)'
    ```

With this setup, your application will be accessible at your server's IP address (e.g., http://134.199.178.80) without specifying any port. The services will start automatically when the server boots, and they'll restart automatically if they crash.

## License

This project is licensed under the MIT License.
