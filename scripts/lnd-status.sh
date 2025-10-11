#!/bin/bash

# Script para verificar status do LND e balance
# Execute: ./scripts/lnd-status.sh

echo "🔍 LND Testnet Status Check"
echo "=========================="

echo "📋 Container Status:"
docker ps --filter "name=axisor-lnd-testnet" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📊 LND Node Info:"
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon getinfo | jq '{
  version: .version,
  alias: .alias,
  synced_to_chain: .synced_to_chain,
  synced_to_graph: .synced_to_graph,
  block_height: .block_height,
  num_active_channels: .num_active_channels,
  num_peers: .num_peers
}'

echo ""
echo "💰 Wallet Balance:"
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance

echo ""
echo "📋 Recent Invoices:"
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon listinvoices --max_invoices=5 | jq '{
  invoices: [.invoices[] | {
    payment_request: .payment_request,
    value: .value,
    memo: .memo,
    state: .state,
    creation_date: .creation_date
  }]
}'

echo ""
echo "🎯 Quick Actions:"
echo "1. Create invoice: ./scripts/create-testnet-invoice.sh"
echo "2. Check balance: ./scripts/lnd-status.sh"
echo "3. View logs: docker logs axisor-lnd-testnet --tail=20"
