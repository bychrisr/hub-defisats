#!/bin/bash

# Script para verificar saldo on-chain Bitcoin testnet

echo "🚀 Verificando Saldo Bitcoin Testnet"
echo "===================================="
echo ""
echo "📍 Endereço: tb1q3mu9j99d06edl8t7pxxgmwurrsgnwnqwemfhjj"
echo ""

echo "💰 Saldo atual on-chain:"
BALANCE=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "$BALANCE" | jq '.'
    
    TOTAL_BALANCE=$(echo "$BALANCE" | jq -r '.total_balance')
    CONFIRMED_BALANCE=$(echo "$BALANCE" | jq -r '.confirmed_balance')
    UNCONFIRMED_BALANCE=$(echo "$BALANCE" | jq -r '.unconfirmed_balance')
    
    echo ""
    echo "📊 Resumo:"
    echo "=========="
    echo "💰 Saldo Total: $TOTAL_BALANCE sats"
    echo "✅ Confirmado: $CONFIRMED_BALANCE sats"
    echo "⏳ Não Confirmado: $UNCONFIRMED_BALANCE sats"
    
    if [ "$TOTAL_BALANCE" != "0" ]; then
        echo ""
        echo "🎉 Bitcoin testnet recebido!"
        echo "✅ Agora você pode usar os sats para testar a aplicação"
    else
        echo ""
        echo "⏳ Aguardando recebimento de Bitcoin testnet..."
        echo "💡 Use os faucets em: ./scripts/get-testnet-bitcoin.sh"
    fi
else
    echo "❌ Erro ao verificar saldo"
fi

echo ""
echo "🔗 Faucets disponíveis:"
echo "   ./scripts/get-testnet-bitcoin.sh"
