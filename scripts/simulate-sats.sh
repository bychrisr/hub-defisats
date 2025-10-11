#!/bin/bash

# Script para simular sats no LND para teste do frontend
# Execute: ./scripts/simulate-sats.sh

echo "🚀 Simulating Sats for Frontend Testing"
echo "====================================="

echo "📋 Current status:"
docker exec axisor-lnd-testnet lncli --network=testnet --tlscertpath=/lnd/tls.cert --macaroonpath=/root/.lnd/data/chain/bitcoin/testnet/admin.macaroon walletbalance

echo ""
echo "🎯 To get real sats, you need to manually:"
echo "1. Open: https://testnet-faucet.mempool.co/"
echo "2. Paste this invoice:"
echo "   lntb10m1p5wngtppp55h558mrklkh5lgxk0edtdmnfnna7qvh9lvqtpgex9gax80hu548sdp823jhxarwv46zq3npw43k2apq95srznfqwdshguccqzzsxqyz5vqsp5f7t0a33jwf7ht0jzvmk6s3z8ul6furqx26scn2dqcr7tja56t7jq9qyyssq0rqaf7dz7k4x9zvsgulfwq3da5lg79e3lx9nnk40f3cc4gme5z8qd82nucvzxnwmq8zxwr4n2hr6m9le6glmg7vx3vk4v7x8jpgvnsgqt585hg"
echo "3. Submit and wait for payment"
echo "4. Check balance with: ./scripts/lnd-status.sh"
echo ""
echo "🔄 Alternative: Use the frontend testnet faucet component"
echo "   - Go to your app: http://localhost:13000"
echo "   - Navigate to Profile > Testnet Faucet"
echo "   - Use the interface there"
echo ""
echo "📊 Current balance: 0 sats (needs manual faucet)"

