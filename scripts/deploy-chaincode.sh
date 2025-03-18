#!/bin/bash,,@

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

echo "Deploying chaincode to the Hyperledger Fabric network..."
echo "Network directory: $NETWORK_DIR"
echo "Chaincode path: $CHAINCODE_PATH"

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

# Check if the chaincode exists
if [ ! -d "$CHAINCODE_PATH" ]; then
  echo "Error: Chaincode directory not found at $CHAINCODE_PATH"
  exit 1
fi

# Navigate to the network directory
cd "$NETWORK_DIR"

# Check if the network is running
CONTAINERS=$(docker ps --format '{{.Names}}' | grep 'peer0.org1.example.com')
if [ -z "$CONTAINERS" ]; then
  echo "Error: Fabric network is not running. Start it with start-network.sh"
  exit 1
fi

# Deploy the chaincode
echo "Deploying chaincode $CHAINCODE_NAME to channel $CHANNEL_NAME..."
./network.sh deployCC -c "$CHANNEL_NAME" -ccn "$CHAINCODE_NAME" -ccp "$CHAINCODE_PATH" -ccv "$CC_VERSION" -ccs "$CC_SEQUENCE" -ccl go -cci "$CC_INIT_FCN"

echo "Chaincode deployed successfully!"
echo "Next steps:"
echo "1. Set up the backend with ./scripts/setup-backend.sh"
echo "2. Start the backend and frontend applications"
