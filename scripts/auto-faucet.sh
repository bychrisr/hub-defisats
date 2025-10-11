#!/bin/bash

# Script para conseguir sats automaticamente via faucet
# Execute: ./scripts/auto-faucet.sh

echo "🚀 Automatic Testnet Faucet Process"
echo "=================================="

# Pegar a primeira invoice disponível
echo "📋 Getting first available invoice..."
INVOICE=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon listinvoices --max_invoices=1 | jq -r '.invoices[0].payment_request')

if [ "$INVOICE" = "null" ] || [ -z "$INVOICE" ]; then
    echo "❌ No invoices found. Creating new invoice..."
    # Criar nova invoice se não existir
    INVOICE=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon addinvoice --amt=1000000 --memo="Auto Faucet" | jq -r '.payment_request')
fi

echo "✅ Invoice found:"
echo "$INVOICE"
echo ""

# Tentar usar o faucet do Lightning Labs via curl
echo "🌐 Trying Lightning Labs faucet..."
RESPONSE=$(curl -s -X POST "https://faucet.lightning.community/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "invoice=$INVOICE" \
  --max-time 30)

if echo "$RESPONSE" | grep -q "success\|paid\|sent"; then
    echo "✅ Payment sent successfully!"
else
    echo "⚠️  Automated faucet failed. Manual process required."
    echo ""
    echo "📋 Manual Steps:"
    echo "1. Open: https://faucet.lightning.community/"
    echo "2. Paste this invoice:"
    echo "$INVOICE"
    echo "3. Submit and wait for payment"
    echo ""
    echo "🔄 Check payment status with:"
    echo "./scripts/lnd-status.sh"
fi

echo ""
echo "📊 Current balance:"
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance
