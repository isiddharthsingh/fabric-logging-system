#!/bin/bash

set -e

# Get the absolute path to the base directory
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
if [ -z "$SCRIPT_PATH" ]; then
  # readlink -f not available on some systems (like macOS)
  SCRIPT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/$(basename "${BASH_SOURCE[0]}")"
fi
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
NETWORK_DIR="${BASE_DIR}/network"
BACKEND_DIR="${BASE_DIR}/backend"

# Configuration
CHANNEL_NAME="logchannel"
CHAINCODE_NAME="logging"
WALLET_PATH="${BACKEND_DIR}/wallet"
CONN_PROFILE_ORG1_PATH="${BACKEND_DIR}/connection-profiles/connection-org1.json"
ADMIN_USER="admin"
ADMIN_PASSWORD="adminpw"
ORG_MSP="Org1MSP"

echo "Setting up backend environment..."
echo "Backend directory: $BACKEND_DIR"
echo "Network directory: $NETWORK_DIR"

# Check if the network directory exists
if [ ! -d "$NETWORK_DIR" ]; then
  echo "Error: Network directory not found at $NETWORK_DIR"
  echo "Run setup-fabric.sh first to set up the network"
  exit 1
fi

# Check if the backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: Backend directory not found at $BACKEND_DIR"
  exit 1
fi

# Create directory for connection profiles
mkdir -p "${BACKEND_DIR}/connection-profiles"

# Create wallet directory
mkdir -p "$WALLET_PATH"

# Copy connection profile from test-network
echo "Creating connection profile for Org1..."
ORG1_CONNECTION_PATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/connection-org1.json"
if [ -f "$ORG1_CONNECTION_PATH" ]; then
  cp "$ORG1_CONNECTION_PATH" "$CONN_PROFILE_ORG1_PATH"
else
  # If the connection profile doesn't exist, create it
  echo "Connection profile not found in test-network, generating it..."
  
  # JSON structure for connection profile
  cat > "$CONN_PROFILE_ORG1_PATH" << EOF
{
    "name": "test-network-org1",
    "version": "1.0.0",
    "client": {
        "organization": "Org1",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                }
            }
        }
    },
    "organizations": {
        "Org1": {
            "mspid": "Org1MSP",
            "peers": [
                "peer0.org1.example.com"
            ],
            "certificateAuthorities": [
                "ca.org1.example.com"
            ]
        }
    },
    "peers": {
        "peer0.org1.example.com": {
            "url": "grpcs://localhost:7051",
            "tlsCACerts": {
                "path": "${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.org1.example.com",
                "hostnameOverride": "peer0.org1.example.com"
            }
        }
    },
    "certificateAuthorities": {
        "ca.org1.example.com": {
            "url": "https://localhost:7054",
            "caName": "ca-org1",
            "tlsCACerts": {
                "path": "${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem"
            },
            "httpOptions": {
                "verify": false
            }
        }
    }
}
EOF
fi

# Create environment file for backend
echo "Creating environment file for backend..."
ENV_FILE="${BACKEND_DIR}/.env"

cat > "$ENV_FILE" << EOF
# Fabric network configuration
CHANNEL_NAME=${CHANNEL_NAME}
CHAINCODE_NAME=${CHAINCODE_NAME}
WALLET_PATH=${WALLET_PATH}
CONNECTION_PROFILE_PATH=${CONN_PROFILE_ORG1_PATH}
ORG_MSP=${ORG_MSP}

# Admin user credentials
ADMIN_USER=${ADMIN_USER}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# API configuration
PORT=3000
EOF

echo "Backend environment setup complete!"
echo "Next steps:"
echo "1. Start the Fabric network with ./scripts/start-network.sh"
echo "2. cd to backend directory and run 'npm install'"
echo "3. Start the backend server with 'npm start'"
