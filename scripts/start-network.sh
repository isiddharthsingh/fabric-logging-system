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

# Configuration
CHANNEL_NAME="logchannel"
CHAINCODE_NAME="logging"
CHAINCODE_PATH="${BASE_DIR}/chaincode/logging"
CC_VERSION="1.0"
CC_SEQUENCE="1"
CC_INIT_FCN="InitLedger"

echo "Starting Hyperledger Fabric network..."
echo "Network directory: $NETWORK_DIR"

# Check if the network exists
if [ ! -d "$NETWORK_DIR" ]; then
  echo "Error: Network directory does not exist. Run setup-fabric.sh first."
  exit 1
fi

# Check if the network.sh script exists
if [ ! -f "$NETWORK_DIR/network.sh" ]; then
  echo "Error: network.sh script not found in $NETWORK_DIR"
  exit 1
fi

# Check if bin directory exists
if [ ! -d "$NETWORK_DIR/bin" ]; then
  echo "Error: bin directory not found in $NETWORK_DIR"
  # Try to find bin directory in fabric-samples
  BIN_DIR="${BASE_DIR}/temp/fabric-samples/bin"
  if [ -d "$BIN_DIR" ]; then
    echo "Found bin directory in fabric-samples. Copying to network directory..."
    mkdir -p "$NETWORK_DIR/bin"
    cp -r "$BIN_DIR"/* "$NETWORK_DIR/bin/"
  else
    echo "Could not find Fabric binaries. Please run setup-fabric.sh first."
    exit 1
  fi
fi

# Set environment variables for Fabric
export PATH="${NETWORK_DIR}/bin:$PATH"
export FABRIC_CFG_PATH="${NETWORK_DIR}/config"

# Print environment for debugging
echo "PATH: $PATH"
echo "FABRIC_CFG_PATH: $FABRIC_CFG_PATH"
echo "Checking for fabric binaries:"
which configtxgen || echo "configtxgen not found in PATH"
which peer || echo "peer not found in PATH"
which osnadmin || echo "osnadmin not found in PATH"

# Navigate to the network directory
cd "$NETWORK_DIR"

# Bring down any existing network
echo "Bringing down any existing network..."
./network.sh down

# Start the network with CouchDB
echo "Starting the network with CouchDB..."
./network.sh up createChannel -c "$CHANNEL_NAME" -s couchdb

# Deploy the chaincode
echo "Deploying chaincode $CHAINCODE_NAME..."
./network.sh deployCC -c "$CHANNEL_NAME" -ccn "$CHAINCODE_NAME" -ccp "$CHAINCODE_PATH" -ccv "$CC_VERSION" -ccs "$CC_SEQUENCE" -ccl go -cci "$CC_INIT_FCN"

echo "Network is up and running with channel '$CHANNEL_NAME' and chaincode '$CHAINCODE_NAME' deployed."
echo "Next steps:"
echo "1. Set up the backend with ./scripts/setup-backend.sh"
echo "2. Start the backend and frontend applications"
