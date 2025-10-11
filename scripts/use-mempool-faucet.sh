#!/bin/bash

# Script para usar o faucet do mempool.space
# Execute: ./scripts/use-mempool-faucet.sh

echo "🚀 Using Mempool.space Testnet Faucet"
echo "===================================="

# Pegar a primeira invoice
INVOICE=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon listinvoices --max_invoices=1 | jq -r '.invoices[0].payment_request')

echo "📋 Invoice to use:"
echo "$INVOICE"
echo ""

echo "🌐 Opening mempool.space faucet..."
echo "URL: https://testnet-faucet.mempool.co/"

# Tentar abrir o navegador (se disponível)
if command -v xdg-open > /dev/null; then
    xdg-open "https://testnet-faucet.mempool.co/" 2>/dev/null &
elif command -v open > /dev/null; then
    open "https://testnet-faucet.mempool.co/" 2>/dev/null &
fi

echo ""
echo "📋 Manual steps:"
echo "1. Go to: https://testnet-faucet.mempool.co/"
echo "2. Paste this invoice:"
echo "$INVOICE"
echo "3. Click 'Send Testnet Sats'"
echo "4. Wait for confirmation"
echo ""
echo "🔄 Monitor with: ./scripts/lnd-status.sh"

