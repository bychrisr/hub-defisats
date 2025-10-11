#!/bin/bash

# Script para monitorar pagamentos Lightning
# Execute: ./scripts/monitor-payment.sh

echo "👀 Monitoring Lightning Payments"
echo "==============================="

echo "⏳ Checking for new payments every 10 seconds..."
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
    # Verificar balance
    BALANCE=$(docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance | jq -r '.total_balance')
    
    if [ "$BALANCE" != "0" ]; then
        echo "🎉 PAYMENT RECEIVED!"
        echo "💰 Balance: $BALANCE sats"
        echo ""
        echo "📊 Full wallet info:"
        docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance
        echo ""
        echo "✅ You now have sats in your Lightning wallet!"
        echo "🚀 You can now use the testnet faucet in the application!"
        break
    else
        echo "$(date '+%H:%M:%S') - Still waiting for payment... (Balance: $BALANCE sats)"
    fi
    
    sleep 10
done
