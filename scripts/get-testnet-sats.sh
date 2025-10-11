#!/bin/bash

# Script para conseguir sats via faucet Lightning testnet
# Execute: ./scripts/get-testnet-sats.sh

echo "🚀 Getting Testnet Sats via Lightning Faucet"
echo "==========================================="

# Usar o faucet público do Lightning Labs
echo "📋 Using Lightning Labs Testnet Faucet..."
echo ""

# URL do faucet
FAUCET_URL="https://faucet.lightning.community/"

echo "🌐 Faucet URL: $FAUCET_URL"
echo ""
echo "📋 Steps to get sats:"
echo "1. Open the faucet URL in your browser"
echo "2. Copy one of the existing invoices from the status check"
echo "3. Paste the invoice in the faucet form"
echo "4. Submit and wait for payment"
echo ""
echo "💡 Available invoices from your LND node:"
echo ""

# Listar invoices existentes
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon listinvoices --max_invoices=3 --json | jq -r '.invoices[] | "Invoice: " + .payment_request + "\nAmount: " + .value + " sats\nMemo: " + .memo + "\nState: " + .state + "\n"'

echo ""
echo "🎯 Alternative faucets:"
echo "- https://testnet.help/en/bitcoincoinfaucet/testnet/"
echo "- https://faucet.lightning.community/"
echo "- https://testnet-faucet.mempool.co/"
echo ""
echo "📋 After receiving payment, check balance with:"
echo "./scripts/lnd-status.sh"
