#!/bin/bash

# Script para monitorar pagamento de invoice Lightning
# Invoice: 1,000,000 sats

INVOICE_RHASH="12c96b91481cd59e52b2f17647a6b11d9059d30e34e1c22489e880a1cda82a7e"

echo "🚀 Monitor de Pagamento Lightning"
echo "================================="
echo ""
echo "💰 Invoice Hash: $INVOICE_RHASH"
echo "💵 Valor: 1,000,000 sats"
echo ""
echo "📋 Para pagar:"
echo "1. Acesse: https://faucet.lightning.community/"
echo "2. Cole o invoice:"
echo "lntb10m1p5w5lkrpp5ztykhy2grn2eu54j79my0f43rkg9n5cwxnsuyfyfazq2rndg9flqdp523jhxarwv46zqenpw43k2apqve6kuerfdenjqtfqx9xjqumpw3escqzzsxqyz5vqsp5g7fefkzh0jucxage2d0f3fvug2sqmw40kcv5s5ul6xvjupjkn9zq9qyyssqznmezdhv99l7mh0nrasehwznsg3wd3q3tkxxgux9telq0g3yjmn9w79xfp5z0pl2k2tnzhkz84ve5ch7vpm4uj63el8cz4p4h4s36kgpxj7ha2"
echo "3. Clique em Submit"
echo ""
echo "⏳ Monitorando pagamento..."
echo "   (Pressione Ctrl+C para parar)"
echo ""

# Contador para mostrar progresso
COUNT=0

while true; do
    COUNT=$((COUNT + 1))
    
    # Verificar se o invoice foi pago usando lookupinvoice
    echo "🔍 Verificando pagamento... ($COUNT) $(date '+%H:%M:%S')"
    
    # Usar lookupinvoice com o hash do pagamento
    PAYMENT_RESULT=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon lookupinvoice "$INVOICE_RHASH" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Verificar se o pagamento foi realizado
        if echo "$PAYMENT_RESULT" | grep -q '"settled": true'; then
            echo ""
            echo "🎉 PAGAMENTO RECEBIDO!"
            echo "====================="
            echo ""
            echo "💰 Saldo atual da wallet:"
            docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance
            echo ""
            echo "✅ Wallet fundeada com sucesso!"
            echo "🚀 Agora você pode usar a aplicação com saldo real!"
            break
        elif echo "$PAYMENT_RESULT" | grep -q '"settled": false'; then
            echo "⏳ Invoice criado, aguardando pagamento..."
        else
            echo "📋 Status: Invoice pendente"
        fi
    else
        echo "❌ Erro ao verificar invoice. Tentando novamente..."
    fi
    
    # Também verificar saldo da wallet para detectar qualquer pagamento
    BALANCE=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance 2>/dev/null | jq -r '.total_balance' 2>/dev/null)
    
    if [ "$BALANCE" != "null" ] && [ "$BALANCE" != "0" ] && [ -n "$BALANCE" ]; then
        echo ""
        echo "🎉 SALDO DETECTADO!"
        echo "=================="
        echo "💰 Saldo atual: $BALANCE sats"
        echo "✅ Wallet fundeada com sucesso!"
        echo "🚀 Agora você pode usar a aplicação com saldo real!"
        break
    fi
    
    sleep 15
done

echo ""
echo "✅ Monitoramento concluído!"
