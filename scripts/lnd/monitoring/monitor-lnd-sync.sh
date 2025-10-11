#!/bin/bash
# LND Sync Monitoring Script
# Monitor LND synchronization progress

set -e

echo "🔄 Monitoring LND Testnet Sync"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if LND is running
print_status "🔍 Checking if LND Testnet is running..."
if ! docker-compose -f config/docker/docker-compose.dev.yml ps lnd-testnet | grep -q "Up"; then
    print_error "LND Testnet is not running. Please start it first."
    exit 1
fi
print_success "LND Testnet is running"

# Function to get sync status
get_sync_status() {
    docker exec axisor-lnd-testnet lncli --network=testnet getinfo | jq -r '.synced_to_chain'
}

# Function to get block height
get_block_height() {
    docker exec axisor-lnd-testnet lncli --network=testnet getinfo | jq -r '.block_height'
}

# Function to get node info
get_node_info() {
    docker exec axisor-lnd-testnet lncli --network=testnet getinfo | jq '{
        alias: .alias,
        identity_pubkey: .identity_pubkey,
        testnet: .testnet,
        synced_to_chain: .synced_to_chain,
        block_height: .block_height,
        best_header_timestamp: .best_header_timestamp,
        num_active_channels: .num_active_channels,
        num_peers: .num_peers
    }'
}

# Initial status check
print_status "📊 Initial Status:"
get_node_info

# Monitor sync status
print_status "🔄 Starting sync monitoring..."
print_warning "Press Ctrl+C to stop monitoring"

CHECK_COUNT=0
while true; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    
    SYNC_STATUS=$(get_sync_status)
    BLOCK_HEIGHT=$(get_block_height)
    
    if [ "$SYNC_STATUS" = "true" ]; then
        print_success "✅ LND Testnet fully synced!"
        print_success "📊 Final Status:"
        get_node_info
        break
    else
        print_status "⏳ LND Testnet still syncing... (check $CHECK_COUNT)"
        print_status "   Block height: $BLOCK_HEIGHT"
        print_status "   Sync status: $SYNC_STATUS"
        print_status "   Time: $(date)"
        
        # Show progress every 10 checks
        if [ $((CHECK_COUNT % 10)) -eq 0 ]; then
            print_status "📊 Detailed Status:"
            get_node_info
        fi
    fi
    
    sleep 30
done

print_success "🚀 LND Testnet ready for operations!"
print_status "📋 Next steps:"
echo "  1. Run: ./scripts/lnd/testing/test-lnd-functionality.sh"
echo "  2. Run: ./scripts/lnd/deployment/fund-lnd-testnet.sh"
