#!/bin/bash

echo "🔐 Unlocking LND Testnet Wallet - Robust Method"
echo "==============================================="

CONTAINER_NAME="axisor-lnd-testnet"
PASSWORD="axisor-testnet-password-2025"

# Method 1: Try with printf to avoid terminal issues
echo "📋 Method 1: Using printf..."
printf '%s\n' "$PASSWORD" | docker exec -i $CONTAINER_NAME lncli --network=testnet --tlscertpath=/lnd/tls.cert unlock

if [ $? -eq 0 ]; then
    echo "✅ Wallet unlocked successfully with printf!"
    exit 0
fi

# Method 2: Try with echo and pipe
echo "📋 Method 2: Using echo..."
echo "$PASSWORD" | docker exec -i $CONTAINER_NAME lncli --network=testnet --tlscertpath=/lnd/tls.cert unlock

if [ $? -eq 0 ]; then
    echo "✅ Wallet unlocked successfully with echo!"
    exit 0
fi

# Method 3: Try with here document
echo "📋 Method 3: Using here document..."
docker exec -i $CONTAINER_NAME lncli --network=testnet --tlscertpath=/lnd/tls.cert unlock <<EOF
$PASSWORD
EOF

if [ $? -eq 0 ]; then
    echo "✅ Wallet unlocked successfully with here document!"
    exit 0
fi

echo "❌ All unlock methods failed. Wallet may already be unlocked or there's a deeper issue."

# Check if wallet is actually unlocked
echo "📊 Checking wallet status..."
docker exec $CONTAINER_NAME lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon getinfo 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Wallet appears to be unlocked!"
    exit 0
else
    echo "❌ Wallet is still locked"
    exit 1
fi
