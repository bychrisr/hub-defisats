#!/bin/bash
# LND Resource Monitoring Script
# Monitor LND resource usage and performance

set -e

echo "📊 LND Resource Monitoring"
echo "========================="

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

# Function to get LND container stats
get_container_stats() {
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep lnd
}

# Function to get LND info
get_lnd_info() {
    if docker exec axisor-lnd-testnet lncli --network=testnet getinfo >/dev/null 2>&1; then
        docker exec axisor-lnd-testnet lncli --network=testnet getinfo | jq '{
            alias: .alias,
            synced_to_chain: .synced_to_chain,
            block_height: .block_height,
            num_active_channels: .num_active_channels,
            num_peers: .num_peers,
            version: .version
        }'
    else
        echo "LND not accessible"
    fi
}

# Function to get wallet balance
get_wallet_balance() {
    if docker exec axisor-lnd-testnet lncli --network=testnet getinfo >/dev/null 2>&1; then
        docker exec axisor-lnd-testnet lncli --network=testnet walletbalance | jq '{
            total_balance: .total_balance,
            confirmed_balance: .confirmed_balance,
            unconfirmed_balance: .unconfirmed_balance
        }'
    else
        echo "LND not accessible"
    fi
}

# Function to get channel info
get_channel_info() {
    if docker exec axisor-lnd-testnet lncli --network=testnet getinfo >/dev/null 2>&1; then
        docker exec axisor-lnd-testnet lncli --network=testnet listchannels | jq '{
            total_channels: (.channels | length),
            active_channels: (.channels | map(select(.active == true)) | length),
            total_capacity: (.channels | map(.capacity) | add),
            total_local_balance: (.channels | map(.local_balance) | add),
            total_remote_balance: (.channels | map(.remote_balance) | add)
        }'
    else
        echo "LND not accessible"
    fi
}

# Function to get disk usage
get_disk_usage() {
    docker system df | grep lnd || echo "No LND volumes found"
}

# Function to get recent logs
get_recent_logs() {
    echo "📋 Recent LND logs (last 10 lines):"
    docker-compose -f config/docker/docker-compose.dev.yml logs --tail=10 lnd-testnet | grep -E "(INFO|WARN|ERROR)" || echo "No recent logs found"
}

# Main monitoring loop
print_status "🔄 Starting resource monitoring..."
print_warning "Press Ctrl+C to stop monitoring"

CHECK_COUNT=0
while true; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo ""
    echo "=========================================="
    print_status "📊 Resource Check #$CHECK_COUNT - $TIMESTAMP"
    echo "=========================================="
    
    # Container stats
    print_status "💻 Container Resource Usage:"
    get_container_stats
    
    # LND info
    print_status "🔗 LND Node Information:"
    get_lnd_info
    
    # Wallet balance
    print_status "💰 Wallet Balance:"
    get_wallet_balance
    
    # Channel info
    print_status "🔗 Channel Information:"
    get_channel_info
    
    # Disk usage
    print_status "💾 Disk Usage:"
    get_disk_usage
    
    # Show logs every 10 checks
    if [ $((CHECK_COUNT % 10)) -eq 0 ]; then
        echo ""
        get_recent_logs
    fi
    
    # Wait before next check
    print_status "⏳ Waiting 60 seconds for next check..."
    sleep 60
done
