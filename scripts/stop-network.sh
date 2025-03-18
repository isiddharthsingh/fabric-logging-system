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

echo "Stopping Hyperledger Fabric network..."
echo "Network directory: $NETWORK_DIR"

# Check if the network exists
if [ ! -d "$NETWORK_DIR" ]; then
  echo "Error: Network directory does not exist. Nothing to stop."
  exit 1
fi

# Check if the network.sh script exists
if [ ! -f "$NETWORK_DIR/network.sh" ]; then
  echo "Error: network.sh script not found in $NETWORK_DIR"
  exit 1
fi

# Navigate to the network directory
cd "$NETWORK_DIR"

# Bring down the network
echo "Bringing down the network..."
./network.sh down

echo "Network has been stopped successfully."
