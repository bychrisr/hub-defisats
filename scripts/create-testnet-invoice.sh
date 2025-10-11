#!/bin/bash

# Script para criar invoice Lightning testnet
# Execute: ./scripts/create-testnet-invoice.sh

echo "🚀 Creating Lightning Testnet Invoice"
echo "====================================="

# Criar invoice de 1M sats
echo "📋 Creating 1M sats invoice..."
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon addinvoice --amt=1000000 --memo="Testnet Faucet - 1M sats"

echo ""
echo "✅ Invoice created successfully!"
echo "📋 Next steps:"
echo "1. Copy the invoice (starts with lnbcrt...) from the output above"
echo "2. Use a Lightning testnet faucet to pay the invoice"
echo "3. Wait for payment confirmation"
echo ""
echo "💡 Popular testnet faucets:"
echo "- https://testnet.help/en/bitcoincoinfaucet/testnet/"
echo "- https://faucet.lightning.community/"
echo "- https://testnet-faucet.mempool.co/"
