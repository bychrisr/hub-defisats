#!/bin/bash

echo "🔐 Unlocking LND Testnet Wallet"
echo "==============================="

# Definir variáveis
CONTAINER_NAME="axisor-lnd-testnet"
PASSWORD="axisor-testnet-password-2025"

echo "📋 Attempting to unlock wallet..."

# Tentar desbloquear usando echo para evitar input interativo
echo "$PASSWORD" | docker exec -i $CONTAINER_NAME lncli --network=testnet --tlscertpath=/lnd/tls.cert unlock 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Wallet unlocked successfully!"
else
    echo "❌ Failed to unlock wallet. Wallet may already be unlocked or there's an issue."
fi

echo ""
echo "📊 Checking wallet status..."
docker exec $CONTAINER_NAME lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon getinfo 2>/dev/null | head -10

echo ""
echo "💰 Checking wallet balance..."
docker exec $CONTAINER_NAME lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance 2>/dev/null
