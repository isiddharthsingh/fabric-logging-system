#!/bin/bash

# Change to the backend directory
cd /root/fabric-logging-system/backend

# Export environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Start the server
node src/index.js
