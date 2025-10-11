#!/bin/bash
# LND Wallet Initialization Script
# Initialize LND wallet for testnet

set -e

echo "🔐 Initializing LND Wallet"
echo "=========================="

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
    print_status "Run: ./scripts/lnd/deployment/deploy-lnd.sh"
    exit 1
fi
print_success "LND Testnet is running"

# Check if wallet already exists
print_status "🔍 Checking if wallet already exists..."
if docker exec axisor-lnd-testnet ls /home/lnd/.lnd/wallet.db >/dev/null 2>&1; then
    print_warning "Wallet already exists."
    echo "Do you want to recreate it? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "🗑️ Removing existing wallet..."
        docker exec axisor-lnd-testnet rm -rf /home/lnd/.lnd/wallet.db
        docker exec axisor-lnd-testnet rm -rf /home/lnd/.lnd/channel.db
        print_success "Existing wallet removed"
    else
        print_success "Using existing wallet"
        exit 0
    fi
fi

# Create wallet
print_status "🔑 Creating wallet..."
print_warning "You will be prompted to enter a wallet password."
print_warning "Please use a strong password and remember it!"

# Create wallet interactively
docker exec -it axisor-lnd-testnet lncli --network=testnet create

# Verify wallet creation
print_status "🔍 Verifying wallet creation..."
if docker exec axisor-lnd-testnet ls /home/lnd/.lnd/wallet.db >/dev/null 2>&1; then
    print_success "Wallet created successfully"
else
    print_error "Wallet creation failed"
    exit 1
fi

# Unlock wallet
print_status "🔓 Unlocking wallet..."
print_warning "You will be prompted to enter the wallet password again."
docker exec -it axisor-lnd-testnet lncli --network=testnet unlock

# Verify wallet is unlocked
print_status "🔍 Verifying wallet is unlocked..."
sleep 5
if docker exec axisor-lnd-testnet lncli --network=testnet getinfo >/dev/null 2>&1; then
    print_success "Wallet unlocked successfully"
else
    print_error "Wallet unlock failed"
    exit 1
fi

# Display wallet info
print_status "📊 Wallet Information:"
docker exec axisor-lnd-testnet lncli --network=testnet getinfo | jq '{
    alias: .alias,
    identity_pubkey: .identity_pubkey,
    testnet: .testnet,
    synced_to_chain: .synced_to_chain,
    block_height: .block_height
}'

print_success "✅ Wallet initialization completed!"
print_status "📋 Next steps:"
echo "  1. Run: ./scripts/lnd/monitoring/monitor-lnd-sync.sh"
echo "  2. Run: ./scripts/lnd/testing/test-lnd-functionality.sh"
echo "  3. Run: ./scripts/lnd/deployment/fund-lnd-testnet.sh"
