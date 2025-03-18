#!/bin/bash

set -e

# Get the absolute path to the base directory
SCRIPT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/$(basename "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
NETWORK_DIR="${BASE_DIR}/network"
CHAINCODE_DIR="${BASE_DIR}/chaincode/logging"

# Configuration
CHANNEL_NAME="logchannel"
CHAINCODE_NAME="logging"
CC_VERSION="1.0"
CC_SEQUENCE="1"
CC_INIT_FCN="InitLedger"

echo "Starting Hyperledger Fabric network..."
echo "Network directory: $NETWORK_DIR"
echo "Chaincode directory: $CHAINCODE_DIR"

# Check if Go is installed (required for chaincode)
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed. Go is required for packaging Hyperledger Fabric chaincode."
    echo "Please install Go using Homebrew:"
    echo "  brew install go"
    echo "Then try running this script again."
    exit 1
fi

# Check Go version
GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
echo "Go version: $GO_VERSION"
GO_MAJOR=$(echo $GO_VERSION | cut -d. -f1)
GO_MINOR=$(echo $GO_VERSION | cut -d. -f2)

# Pre-process the chaincode - this fixes the go.sum issue
echo "Preparing chaincode dependencies..."
cd "${CHAINCODE_DIR}"
go mod tidy
go mod download
cd - > /dev/null

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

# Create config directory at the same level as the network directory
# This is expected by the network.sh script
if [ ! -d "${BASE_DIR}/config" ]; then
  echo "Creating config directory..."
  mkdir -p "${BASE_DIR}/config"
  
  # Copy config files from network/config if they exist
  if [ -d "${NETWORK_DIR}/config" ]; then
    echo "Copying config files from network/config..."
    cp -r "${NETWORK_DIR}/config/"* "${BASE_DIR}/config/"
  fi
fi

# Set required environment variables
export PATH="${NETWORK_DIR}/bin:$PATH"
export FABRIC_CFG_PATH="${NETWORK_DIR}/configtx"

# Create tmp symlink if needed to make sure bin is at the root level
if [ ! -d "${BASE_DIR}/bin" ]; then
  echo "Creating symbolic link for bin directory..."
  ln -sf "${NETWORK_DIR}/bin" "${BASE_DIR}/bin"
fi

# Print environment for debugging
echo "PATH: $PATH"
echo "FABRIC_CFG_PATH: $FABRIC_CFG_PATH"
echo "Checking for fabric binaries:"
which peer || echo "peer not found in PATH"
which configtxgen || echo "configtxgen not found in PATH"
which osnadmin || echo "osnadmin not found in PATH"

# Test peer version to make sure it's in the PATH and working
echo "Testing peer binary:"
peer version || echo "Failed to run peer version"

# Move to the network directory
cd "${NETWORK_DIR}"

# Bring down any existing network
echo "Bringing down any existing network..."
./network.sh down

# Start the network with CouchDB and CA
echo "Starting the network with CouchDB and Certificate Authorities..."
./network.sh up createChannel -c "${CHANNEL_NAME}" -s couchdb -ca

# Deploy the chaincode
echo "Deploying chaincode ${CHAINCODE_NAME}..."
./network.sh deployCC -c "${CHANNEL_NAME}" -ccn "${CHAINCODE_NAME}" -ccp "${CHAINCODE_DIR}" -ccv "${CC_VERSION}" -ccs "${CC_SEQUENCE}" -ccl go -cci "${CC_INIT_FCN}"

echo "Network is up and running with channel '${CHANNEL_NAME}' and chaincode '${CHAINCODE_NAME}' deployed."
echo "Next steps:"
echo "1. Set up the backend with ${SCRIPT_DIR}/setup-backend.sh"
echo "2. Start the backend and frontend applications"
