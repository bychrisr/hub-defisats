#!/bin/bash
# LND Testnet Funding Script
# Fund LND testnet wallet via faucets

set -e

echo "💰 Funding LND Testnet Wallet"
echo "=============================="

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

# Check if LND is running and wallet is unlocked
print_status "🔍 Checking LND status..."
if ! docker exec axisor-lnd-testnet lncli --network=testnet getinfo >/dev/null 2>&1; then
    print_error "LND Testnet is not running or wallet is locked."
    print_status "Please run: ./scripts/lnd/deployment/init-lnd-wallet.sh"
    exit 1
fi
print_success "LND Testnet is ready"

# Generate new address
print_status "📍 Generating new address..."
ADDRESS=$(docker exec axisor-lnd-testnet lncli --network=testnet newaddress p2wkh | jq -r '.address')
print_success "Generated address: $ADDRESS"

# Display funding options
echo ""
print_status "🌊 Available Testnet Faucets:"
echo "  1. https://testnet.help/en/bitcoincoinfaucet/testnet/"
echo "  2. https://bitcoinfaucet.uo1.net/"
echo "  3. https://testnet-faucet.mempool.co/"
echo "  4. https://coinfaucet.eu/en/btc-testnet/"
echo "  5. https://testnet.bitcoinfaucet.ml/"
echo ""

# Check current balance
print_status "💰 Checking current balance..."
CURRENT_BALANCE=$(docker exec axisor-lnd-testnet lncli --network=testnet walletbalance | jq -r '.total_balance')
print_status "Current balance: $CURRENT_BALANCE sats"

if [ "$CURRENT_BALANCE" -gt 0 ]; then
    print_warning "Wallet already has balance. Do you want to continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_status "Funding cancelled"
        exit 0
    fi
fi

# Instructions for manual funding
echo ""
print_status "📋 Manual Funding Instructions:"
echo "  1. Visit one of the faucet URLs above"
echo "  2. Enter the address: $ADDRESS"
echo "  3. Complete any captcha or verification"
echo "  4. Wait for the transaction to be broadcast"
echo ""

# Monitor for funding
print_status "⏳ Monitoring for funding..."
print_warning "This will check every 30 seconds for new transactions"
print_warning "Press Ctrl+C to stop monitoring"

INITIAL_BALANCE=$CURRENT_BALANCE
CHECK_COUNT=0
MAX_CHECKS=60  # 30 minutes

while [ $CHECK_COUNT -lt $MAX_CHECKS ]; do
    sleep 30
    CHECK_COUNT=$((CHECK_COUNT + 1))
    
    CURRENT_BALANCE=$(docker exec axisor-lnd-testnet lncli --network=testnet walletbalance | jq -r '.total_balance')
    
    if [ "$CURRENT_BALANCE" -gt "$INITIAL_BALANCE" ]; then
        FUNDED_AMOUNT=$((CURRENT_BALANCE - INITIAL_BALANCE))
        print_success "🎉 Funding received! +$FUNDED_AMOUNT sats"
        print_success "💰 New balance: $CURRENT_BALANCE sats"
        break
    else
        print_status "⏳ Still waiting... (check $CHECK_COUNT/$MAX_CHECKS)"
        print_status "💰 Current balance: $CURRENT_BALANCE sats"
    fi
done

if [ $CHECK_COUNT -eq $MAX_CHECKS ]; then
    print_warning "⏰ Monitoring timeout reached"
    print_status "You can manually check the balance later with:"
    echo "  docker exec axisor-lnd-testnet lncli --network=testnet walletbalance"
fi

# Show transaction history
print_status "📋 Recent transactions:"
docker exec axisor-lnd-testnet lncli --network=testnet listchaintxns | jq '.transactions[] | {
    tx_hash: .tx_hash,
    amount: .amount,
    num_confirmations: .num_confirmations,
    time_stamp: .time_stamp
}' | head -5

# Show UTXOs
print_status "📋 Available UTXOs:"
docker exec axisor-lnd-testnet lncli --network=testnet listunspent | jq '.utxos[] | {
    address: .address,
    amount_sat: .amount_sat,
    confirmations: .confirmations
}'

print_success "✅ Funding process completed!"
print_status "📋 Next steps:"
echo "  1. Run: ./scripts/lnd/testing/test-lnd-functionality.sh"
echo "  2. Run: ./scripts/lnd/monitoring/monitor-lnd-resources.sh"
