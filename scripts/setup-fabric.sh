#!/bin/bash

set -e

# Always use the location of the script as our reference point
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
if [ -z "$SCRIPT_PATH" ]; then
  # readlink -f not available on some systems (like macOS)
  SCRIPT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/$(basename "${BASH_SOURCE[0]}")"
fi
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

echo "Setting up Hyperledger Fabric environment..."
echo "Script directory: $SCRIPT_DIR"
echo "Base directory: $BASE_DIR"

# Create a temporary directory for downloading
mkdir -p "$BASE_DIR/temp"
cd "$BASE_DIR/temp"

# Download the fabric installation script
echo "Downloading Fabric install script..."
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
chmod +x install-fabric.sh

# Run the script to download binaries, docker images, and samples
echo "Downloading Fabric binaries, docker images, and samples..."
./install-fabric.sh docker binary samples

# Locate the test-network directory
echo "Setting up project structure..."
FABRIC_SAMPLES_DIR="$(pwd)/fabric-samples"

# Print directory contents for debugging
echo "Listing fabric-samples directory contents:"
ls -la ${FABRIC_SAMPLES_DIR}

# Check if test-network exists in the expected location
if [ ! -d "${FABRIC_SAMPLES_DIR}/test-network" ]; then
  echo "Looking for test-network directory..."
  TEST_NETWORK_DIR=$(find ${FABRIC_SAMPLES_DIR} -type d -name 'test-network' | head -n 1)
  
  if [ -z "$TEST_NETWORK_DIR" ]; then
    echo "Error: test-network directory not found in fabric-samples."
    echo "Checking for available directories in fabric-samples:"
    ls -la ${FABRIC_SAMPLES_DIR}
    exit 1
  else
    echo "Found test-network at: $TEST_NETWORK_DIR"
    FABRIC_SAMPLES_DIR=$(dirname "$TEST_NETWORK_DIR")
  fi
fi

# Create a network directory in the base directory
echo "Copying test-network configuration..."
NETWORK_DIR="${BASE_DIR}/network"
if [ -d "${NETWORK_DIR}" ]; then
  echo "Backing up existing network directory..."
  mv "${NETWORK_DIR}" "${NETWORK_DIR}.bak.$(date +%Y%m%d%H%M%S)"
fi

mkdir -p "${NETWORK_DIR}"
echo "Copying from: ${FABRIC_SAMPLES_DIR}/test-network/"
if [ -d "${FABRIC_SAMPLES_DIR}/test-network/" ]; then
  cp -r ${FABRIC_SAMPLES_DIR}/test-network/* "${NETWORK_DIR}/"
else
  echo "Error: test-network directory not found at ${FABRIC_SAMPLES_DIR}/test-network/"
  exit 1
fi

# Create a directory for our chaincode in the test-network structure
echo "Setting up chaincode directory..."
mkdir -p "${NETWORK_DIR}/chaincode/logging"

# Check if chaincode exists and copy it
CHAINCODE_DIR="${BASE_DIR}/chaincode/logging"
echo "Checking for chaincode at ${CHAINCODE_DIR}..."
if [ -d "${CHAINCODE_DIR}" ]; then
  echo "Found chaincode directory. Contents:"
  ls -la "${CHAINCODE_DIR}"
  echo "Copying chaincode to the network directory..."
  cp -r "${CHAINCODE_DIR}"/* "${NETWORK_DIR}/chaincode/logging/"
  echo "Chaincode files copied successfully"
else
  echo "Warning: Chaincode directory not found at ${CHAINCODE_DIR}"
  echo "Creating the chaincode directory..."
  mkdir -p "${CHAINCODE_DIR}"
fi

# Copy the bin directory to our project
echo "Copying Fabric binaries..."
mkdir -p "${NETWORK_DIR}/bin"
if [ -d "${FABRIC_SAMPLES_DIR}/bin/" ]; then
  cp -r ${FABRIC_SAMPLES_DIR}/bin/* "${NETWORK_DIR}/bin/"
else
  echo "Warning: bin directory not found at ${FABRIC_SAMPLES_DIR}/bin/"
fi

# Copy the config directory to our project
echo "Copying Fabric config files..."
mkdir -p "${NETWORK_DIR}/config"
if [ -d "${FABRIC_SAMPLES_DIR}/config/" ]; then
  cp -r ${FABRIC_SAMPLES_DIR}/config/* "${NETWORK_DIR}/config/"
else
  echo "Warning: config directory not found at ${FABRIC_SAMPLES_DIR}/config/"
fi

# Clean up temporary files
echo "Cleaning up..."
# Uncomment the following line to remove the temp directory when you're sure everything is working
# rm -rf "$BASE_DIR/temp"

echo "Setup complete! The Hyperledger Fabric environment is now ready."
echo "Next steps:"
echo "1. Use ${SCRIPT_DIR}/start-network.sh to start the network"
echo "2. Deploy your chaincode using ${SCRIPT_DIR}/deploy-chaincode.sh"
