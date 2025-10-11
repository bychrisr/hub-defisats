#!/bin/bash

# Script para obter status real do LND

echo "🚀 LND Status Check"
echo "=================="

# Verificar se o container está rodando
if ! docker ps | grep -q "axisor-lnd-testnet"; then
    echo "❌ LND container is not running"
    exit 1
fi

echo "✅ LND container is running"

# Obter informações do LND
echo "📋 Getting LND info..."
LND_INFO=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon getinfo)

echo "📊 LND Status:"
echo "$LND_INFO" | jq '{
  version: .version,
  alias: .alias,
  color: .color,
  block_height: .block_height,
  synced_to_chain: .synced_to_chain,
  synced_to_graph: .synced_to_graph,
  num_peers: .num_peers,
  num_active_channels: .num_active_channels,
  testnet: .testnet
}'

# Obter altura atual do testnet
echo ""
echo "📋 Getting current testnet block height..."
CURRENT_BLOCK=$(curl -s https://blockstream.info/testnet/api/blocks/tip/height)
echo "Current testnet block: $CURRENT_BLOCK"

# Calcular porcentagem
BLOCK_HEIGHT=$(echo "$LND_INFO" | jq -r '.block_height')
PERCENTAGE=$(echo "scale=2; ($BLOCK_HEIGHT / $CURRENT_BLOCK) * 100" | bc)
echo "Sync percentage: $PERCENTAGE%"

# Verificar se está sincronizado
SYNCED=$(echo "$LND_INFO" | jq -r '.synced_to_chain')
if [ "$SYNCED" = "true" ]; then
    echo "🎉 LND is fully synced!"
else
    echo "⏳ LND is still syncing..."
fi

echo "✅ Status check completed!"
