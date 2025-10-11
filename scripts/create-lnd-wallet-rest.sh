#!/bin/bash

# Script para criar wallet LND via REST API
# Usa o mnemonic e senha documentados

echo "🚀 Creating LND Wallet via REST API"
echo "===================================="

# Verificar se o container está rodando
if ! docker ps | grep -q "axisor-lnd-testnet"; then
    echo "❌ LND container is not running"
    exit 1
fi

echo "✅ LND container is running"

# Aguardar LND estar pronto
echo "⏳ Waiting for LND to be ready..."
sleep 5

# Criar wallet via REST API
echo "🔐 Creating wallet..."

# Usar o mnemonic documentado e senha
RESPONSE=$(docker exec axisor-lnd-testnet curl -k --cacert /root/.lnd/tls.cert -s -X POST https://localhost:8080/v1/createwallet \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_password": "axisor-testnet-2025-secure",
    "cipher_seed_mnemonic": [
      "absent", "direct", "drum", "session", "border", "tuition", "smooth", "battle",
      "know", "bean", "shaft", "lazy", "grain", "clump", "agree", "tornado",
      "profit", "journey", "pause", "motion", "palace", "divide", "rich", "absent"
    ]
  }')

echo "📝 Response: $RESPONSE"

# Verificar se foi criada com sucesso
if echo "$RESPONSE" | grep -q "admin_macaroon"; then
    echo "✅ Wallet created successfully!"
    
    # Extrair o macaroon
    MACAROON=$(echo "$RESPONSE" | grep -o '"admin_macaroon":"[^"]*"' | cut -d'"' -f4)
    echo "🔑 Admin macaroon: $MACAROON"
    
    # Testar se a wallet está funcionando
    echo "📋 Testing wallet..."
    TEST_RESPONSE=$(docker exec axisor-lnd-testnet curl -k --cacert /root/.lnd/tls.cert -s \
      -H "Grpc-Metadata-macaroon: $MACAROON" \
      https://localhost:8080/v1/getinfo)
    
    echo "📊 Wallet test result: $TEST_RESPONSE"
    
    if echo "$TEST_RESPONSE" | grep -q "synced_to_chain"; then
        echo "🎉 Wallet is ready and synced!"
    else
        echo "⚠️  Wallet created but may need to sync"
    fi
    
else
    echo "❌ Failed to create wallet"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Wallet creation process completed!"
