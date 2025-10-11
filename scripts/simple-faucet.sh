#!/bin/bash

# Script simples para conseguir sats via faucet
# Execute: ./scripts/simple-faucet.sh

echo "🚀 Simple Testnet Faucet Process"
echo "==============================="

# Pegar a primeira invoice
echo "📋 Getting invoice..."
INVOICE=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon listinvoices --max_invoices=1 | jq -r '.invoices[0].payment_request')

echo "✅ Invoice to use:"
echo ""
echo "$INVOICE"
echo ""

echo "🌐 Now follow these steps:"
echo "1. Open this URL in your browser:"
echo "   https://faucet.lightning.community/"
echo ""
echo "2. Copy the invoice above (starts with lntb10m1p...)"
echo ""
echo "3. Paste it in the faucet form and submit"
echo ""
echo "4. Wait for payment confirmation"
echo ""
echo "5. Check your balance with:"
echo "   ./scripts/lnd-status.sh"
echo ""
echo "💡 Alternative faucets if the first doesn't work:"
echo "- https://testnet.help/en/bitcoincoinfaucet/testnet/"
echo "- https://testnet-faucet.mempool.co/"
echo ""
echo "⏳ Checking current balance..."
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance
