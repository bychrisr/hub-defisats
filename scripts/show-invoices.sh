#!/bin/bash

# Script para mostrar invoices disponíveis
# Execute: ./scripts/show-invoices.sh

echo "📋 Available Lightning Testnet Invoices"
echo "======================================"

# Listar invoices sem flag --json
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon listinvoices --max_invoices=3

echo ""
echo "🌐 Use these invoices with Lightning testnet faucets:"
echo "- https://faucet.lightning.community/"
echo "- https://testnet.help/en/bitcoincoinfaucet/testnet/"
echo "- https://testnet-faucet.mempool.co/"
echo ""
echo "📋 Copy the 'payment_request' field and paste in the faucet!"
