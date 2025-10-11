#!/bin/bash

# Script para usar faucet via API
# Execute: ./scripts/auto-faucet-api.sh

echo "🚀 Automatic Faucet via API"
echo "=========================="

# Pegar a primeira invoice
INVOICE=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon listinvoices --max_invoices=1 | jq -r '.invoices[0].payment_request')

echo "📋 Invoice: $INVOICE"
echo ""

# Tentar diferentes faucets via API
echo "🌐 Trying faucet APIs..."

# Faucet 1: testnet.help
echo "📡 Trying testnet.help faucet..."
RESPONSE1=$(curl -s -X POST "https://testnet.help/en/bitcoincoinfaucet/testnet/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "address=$INVOICE" \
  --max-time 30 2>/dev/null)

if echo "$RESPONSE1" | grep -qi "success\|sent\|paid"; then
    echo "✅ testnet.help: Payment sent!"
else
    echo "❌ testnet.help: Failed or no response"
fi

# Faucet 2: Lightning Labs (se funcionar)
echo "📡 Trying Lightning Labs faucet..."
RESPONSE2=$(curl -s -X POST "https://faucet.lightning.community/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "invoice=$INVOICE" \
  --max-time 30 2>/dev/null)

if echo "$RESPONSE2" | grep -qi "success\|sent\|paid"; then
    echo "✅ Lightning Labs: Payment sent!"
else
    echo "❌ Lightning Labs: Failed or no response"
fi

# Faucet 3: mempool.space
echo "📡 Trying mempool.space faucet..."
RESPONSE3=$(curl -s -X POST "https://testnet-faucet.mempool.co/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "address=$INVOICE" \
  --max-time 30 2>/dev/null)

if echo "$RESPONSE3" | grep -qi "success\|sent\|paid"; then
    echo "✅ mempool.space: Payment sent!"
else
    echo "❌ mempool.space: Failed or no response"
fi

echo ""
echo "⏳ Waiting 30 seconds for payments to arrive..."
sleep 30

echo "📊 Checking balance..."
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance

echo ""
echo "🔄 If no payment received, try manual process:"
echo "1. Go to: https://testnet-faucet.mempool.co/"
echo "2. Paste: $INVOICE"
echo "3. Submit and wait"

