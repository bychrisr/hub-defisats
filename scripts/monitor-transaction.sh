#!/bin/bash

# Script para monitorar confirmação de transação Bitcoin testnet
# TxID: d044c9963d2e97c27e47a7ee842dc5d1fae4135a2525155a75e5852d24ae0185

TXID="d044c9963d2e97c27e47a7ee842dc5d1fae4135a2525155a75e5852d24ae0185"
ADDRESS="tb1q3mu9j99d06edl8t7pxxgmwurrsgnwnqwemfhjj"

echo "🚀 Monitor de Transação Bitcoin Testnet"
echo "======================================="
echo ""
echo "📋 TxID: $TXID"
echo "📍 Endereço: $ADDRESS"
echo "💰 Valor esperado: 10,000 sats"
echo ""
echo "⏳ Monitorando confirmação..."
echo "   (Pressione Ctrl+C para parar)"
echo ""

COUNT=0

while true; do
    COUNT=$((COUNT + 1))
    
    echo "🔍 Verificando transação... ($COUNT) $(date '+%H:%M:%S')"
    
    # Verificar status da transação
    TX_STATUS=$(curl -s "https://blockstream.info/testnet/api/tx/$TXID" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        CONFIRMED=$(echo "$TX_STATUS" | jq -r '.status.confirmed' 2>/dev/null)
        BLOCK_HEIGHT=$(echo "$TX_STATUS" | jq -r '.status.block_height' 2>/dev/null)
        
        if [ "$CONFIRMED" = "true" ]; then
            echo ""
            echo "🎉 TRANSAÇÃO CONFIRMADA!"
            echo "======================="
            echo "📦 Bloco: $BLOCK_HEIGHT"
            echo "💰 Valor: 10,000 sats"
            echo ""
            echo "🔍 Verificando saldo na wallet..."
            
            # Verificar saldo na wallet
            BALANCE=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance 2>/dev/null)
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "💰 Saldo atual:"
                echo "$BALANCE" | jq '.'
                
                TOTAL_BALANCE=$(echo "$BALANCE" | jq -r '.total_balance')
                
                if [ "$TOTAL_BALANCE" != "0" ]; then
                    echo ""
                    echo "🎉 SALDO RECEBIDO COM SUCESSO!"
                    echo "============================="
                    echo "💰 Total: $TOTAL_BALANCE sats"
                    echo "✅ Agora você pode usar os sats para testar a aplicação!"
                else
                    echo ""
                    echo "⚠️  Transação confirmada mas saldo ainda não apareceu"
                    echo "💡 Pode levar mais alguns minutos para o LND detectar"
                fi
            else
                echo "❌ Erro ao verificar saldo na wallet"
            fi
            
            break
        else
            echo "⏳ Aguardando confirmação... (ainda não confirmada)"
        fi
    else
        echo "❌ Erro ao verificar transação"
    fi
    
    sleep 30
done

echo ""
echo "✅ Monitoramento concluído!"
