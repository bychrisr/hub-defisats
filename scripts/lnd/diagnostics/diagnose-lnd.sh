#!/bin/bash
# LND Diagnostics Script
# Comprehensive LND diagnostics and troubleshooting

set -e

echo "🔍 LND Diagnostics"
echo "=================="

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

# Diagnostic counters
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Function to check and report
check_status() {
    local check_name="$1"
    local check_command="$2"
    local is_critical="$3"
    
    print_status "🔍 Checking: $check_name"
    
    if eval "$check_command" >/dev/null 2>&1; then
        print_success "✅ $check_name: OK"
        return 0
    else
        if [ "$is_critical" = "true" ]; then
            print_error "❌ $check_name: FAILED (CRITICAL)"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        else
            print_warning "⚠️ $check_name: FAILED (WARNING)"
            WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
        fi
        return 1
    fi
}

echo "=========================================="
print_status "📊 Starting LND Diagnostics"
echo "=========================================="

# Check 1: Docker and Docker Compose
print_status "🐳 Checking Docker environment..."
check_status "Docker installed" "command -v docker" true
check_status "Docker Compose installed" "command -v docker-compose" true
check_status "Docker daemon running" "docker info >/dev/null 2>&1" true

# Check 2: Docker containers
print_status "📦 Checking Docker containers..."
check_status "LND Testnet container exists" "docker ps -a | grep lnd-testnet" false
check_status "LND Testnet container running" "docker-compose -f config/docker/docker-compose.dev.yml ps lnd-testnet | grep -q 'Up'" false

# Check 3: Port availability
print_status "🔌 Checking port availability..."
check_status "Port 18080 available" "netstat -tlnp | grep -q ':18080'" false
check_status "Port 18009 available" "netstat -tlnp | grep -q ':18009'" false
check_status "Port 18001 available" "netstat -tlnp | grep -q ':18001'" false

# Check 4: LND connectivity
print_status "🔗 Checking LND connectivity..."
if docker-compose -f config/docker/docker-compose.dev.yml ps lnd-testnet | grep -q "Up"; then
    check_status "LND API accessible" "curl -k -s https://localhost:18080/v1/getinfo >/dev/null 2>&1" false
    check_status "LND lncli accessible" "docker exec axisor-lnd-testnet lncli --network=testnet getinfo >/dev/null 2>&1" false
else
    print_warning "⚠️ LND Testnet container not running, skipping connectivity tests"
fi

# Check 5: LND status
print_status "📊 Checking LND status..."
if docker exec axisor-lnd-testnet lncli --network=testnet getinfo >/dev/null 2>&1; then
    LND_INFO=$(docker exec axisor-lnd-testnet lncli --network=testnet getinfo)
    
    print_status "📋 LND Node Information:"
    echo "$LND_INFO" | jq '{
        alias: .alias,
        identity_pubkey: .identity_pubkey,
        testnet: .testnet,
        synced_to_chain: .synced_to_chain,
        block_height: .block_height,
        num_active_channels: .num_active_channels,
        num_peers: .num_peers,
        version: .version
    }'
    
    # Check sync status
    SYNC_STATUS=$(echo "$LND_INFO" | jq -r '.synced_to_chain')
    if [ "$SYNC_STATUS" = "true" ]; then
        print_success "✅ LND fully synced"
    else
        print_warning "⚠️ LND still syncing"
    fi
    
    # Check wallet status
    WALLET_BALANCE=$(docker exec axisor-lnd-testnet lncli --network=testnet walletbalance | jq -r '.total_balance')
    print_status "💰 Wallet balance: $WALLET_BALANCE sats"
    
    # Check channels
    CHANNEL_COUNT=$(docker exec axisor-lnd-testnet lncli --network=testnet listchannels | jq '.channels | length')
    print_status "🔗 Active channels: $CHANNEL_COUNT"
    
    # Check peers
    PEER_COUNT=$(docker exec axisor-lnd-testnet lncli --network=testnet listpeers | jq '.peers | length')
    print_status "👥 Connected peers: $PEER_COUNT"
    
else
    print_error "❌ LND not accessible"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 6: Backend connectivity
print_status "🔗 Checking backend connectivity..."
check_status "Backend API accessible" "curl -s http://localhost:13010/api/lnd/info >/dev/null 2>&1" false
check_status "Backend health check" "curl -s http://localhost:13010/api/health-check >/dev/null 2>&1" false

# Check 7: File permissions and volumes
print_status "📁 Checking file permissions and volumes..."
check_status "LND data volume exists" "docker volume ls | grep -q lnd-testnet-data" false
check_status "LND config directory exists" "[ -d config/lnd ]" false
check_status "LND logs directory exists" "[ -d logs/lnd ]" false

# Check 8: Recent logs for errors
print_status "📝 Checking recent logs for errors..."
if docker-compose -f config/docker/docker-compose.dev.yml ps lnd-testnet | grep -q "Up"; then
    ERROR_COUNT=$(docker-compose -f config/docker/docker-compose.dev.yml logs --tail=100 lnd-testnet | grep -c "ERROR" || true)
    WARN_COUNT=$(docker-compose -f config/docker/docker-compose.dev.yml logs --tail=100 lnd-testnet | grep -c "WARN" || true)
    
    print_status "📊 Recent log analysis:"
    print_status "   Errors (last 100 lines): $ERROR_COUNT"
    print_status "   Warnings (last 100 lines): $WARN_COUNT"
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_warning "⚠️ Errors found in recent logs"
        WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
    fi
else
    print_warning "⚠️ LND Testnet container not running, cannot check logs"
fi

# Check 9: Resource usage
print_status "💻 Checking resource usage..."
if docker-compose -f config/docker/docker-compose.dev.yml ps lnd-testnet | grep -q "Up"; then
    print_status "📊 Container resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep lnd || echo "No LND containers found"
else
    print_warning "⚠️ LND Testnet container not running, cannot check resource usage"
fi

# Check 10: Network connectivity
print_status "🌐 Checking network connectivity..."
check_status "Internet connectivity" "ping -c 1 8.8.8.8 >/dev/null 2>&1" false
check_status "DNS resolution" "nslookup localhost >/dev/null 2>&1" false

# Check 11: System resources
print_status "🖥️ Checking system resources..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    print_error "❌ Disk usage critical: ${DISK_USAGE}%"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif [ "$DISK_USAGE" -gt 80 ]; then
    print_warning "⚠️ Disk usage high: ${DISK_USAGE}%"
    WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
else
    print_success "✅ Disk usage OK: ${DISK_USAGE}%"
fi

# Display diagnostic summary
echo ""
echo "=========================================="
print_status "📊 Diagnostic Summary"
echo "=========================================="

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
    print_success "🎉 All diagnostics passed! LND is healthy."
elif [ $ISSUES_FOUND -eq 0 ]; then
    print_warning "⚠️ $WARNINGS_FOUND warnings found, but no critical issues."
else
    print_error "❌ $ISSUES_FOUND critical issues and $WARNINGS_FOUND warnings found."
fi

echo ""
print_status "📋 Recommendations:"

if [ $ISSUES_FOUND -gt 0 ]; then
    echo "  - Fix critical issues before proceeding"
    echo "  - Check LND container logs for detailed error information"
    echo "  - Verify Docker and Docker Compose installation"
fi

if [ $WARNINGS_FOUND -gt 0 ]; then
    echo "  - Review warnings and address if necessary"
    echo "  - Monitor LND performance and logs"
fi

echo ""
print_status "📋 Next steps:"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "  1. Run: ./scripts/lnd/testing/test-lnd-functionality.sh"
    echo "  2. Run: ./scripts/lnd/monitoring/monitor-lnd-resources.sh"
else
    echo "  1. Fix critical issues identified above"
    echo "  2. Restart LND containers if necessary"
    echo "  3. Run diagnostics again to verify fixes"
fi

print_success "✅ LND diagnostics completed!"
