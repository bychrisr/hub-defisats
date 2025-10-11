#!/bin/bash

# Script para fundear a wallet LND via faucet público
# Invoice criado: 1,000,000 sats

echo "🚀 LND Testnet Wallet Funding"
echo "============================="
echo ""
echo "📋 Invoice criado com sucesso!"
echo ""
echo "💰 Invoice (1,000,000 sats):"
echo "lntb10m1p5w5lkrpp5ztykhy2grn2eu54j79my0f43rkg9n5cwxnsuyfyfazq2rndg9flqdp523jhxarwv46zqenpw43k2apqve6kuerfdenjqtfqx9xjqumpw3escqzzsxqyz5vqsp5g7fefkzh0jucxage2d0f3fvug2sqmw40kcv5s5ul6xvjupjkn9zq9qyyssqznmezdhv99l7mh0nrasehwznsg3wd3q3tkxxgux9telq0g3yjmn9w79xfp5z0pl2k2tnzhkz84ve5ch7vpm4uj63el8cz4p4h4s36kgpxj7ha2"
echo ""
echo "🌐 Passos para receber os sats:"
echo "================================"
echo ""
echo "1. Abra este URL no navegador:"
echo "   https://faucet.lightning.community/"
echo ""
echo "2. Cole a invoice acima no campo 'Lightning Invoice'"
echo ""
echo "3. Clique em 'Submit' e aguarde a confirmação"
echo ""
echo "4. O pagamento será detectado automaticamente"
echo ""
echo "📊 Para verificar o status:"
echo "   ./scripts/lnd-status.sh"
echo ""
echo "⏳ Monitorando pagamento em tempo real..."
echo "   (Pressione Ctrl+C para parar o monitor)"
echo ""

# Monitor de pagamento
INVOICE_RHASH="12c96b91481cd59e52b2f17647a6b11d9059d30e34e1c22489e880a1cda82a7e"

while true; do
    # Verificar se o invoice foi pago
    PAYMENT_STATUS=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon lookupinvoice "$INVOICE_RHASH" 2>/dev/null)
    
    if echo "$PAYMENT_STATUS" | grep -q '"settled": true'; then
        echo ""
        echo "🎉 PAGAMENTO RECEBIDO!"
        echo "====================="
        echo ""
        echo "💰 Saldo atual:"
        docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/root/.lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance
        echo ""
        echo "✅ Wallet fundeada com sucesso!"
        echo "🚀 Agora você pode usar a aplicação com saldo real!"
        break
    elif echo "$PAYMENT_STATUS" | grep -q '"settled": false'; then
        echo "⏳ Aguardando pagamento... $(date '+%H:%M:%S')"
    else
        echo "❌ Erro ao verificar status do invoice"
    fi
    
    sleep 10
done
