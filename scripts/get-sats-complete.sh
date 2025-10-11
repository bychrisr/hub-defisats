#!/bin/bash

# Script completo para conseguir sats e integrar com a aplicação
# Execute: ./scripts/get-sats-complete.sh

echo "🚀 Complete Testnet Sats Integration"
echo "==================================="

# 1. Verificar status atual
echo "📋 Step 1: Checking current status..."
./scripts/lnd-status.sh > /dev/null 2>&1

# 2. Mostrar invoice para usar
echo ""
echo "📋 Step 2: Getting invoice for faucet..."
./scripts/simple-faucet.sh

# 3. Instruções para o usuário
echo ""
echo "📋 Step 3: Manual faucet process"
echo "================================"
echo "1. Abra: https://faucet.lightning.community/"
echo "2. Cole a invoice mostrada acima"
echo "3. Clique em Submit"
echo "4. Aguarde a confirmação"
echo ""

# 4. Iniciar monitoramento em background
echo "📋 Step 4: Starting payment monitor..."
echo "Executando monitor em background..."
echo "Para ver o status: ./scripts/lnd-status.sh"
echo "Para parar o monitor: pkill -f monitor-payment"
echo ""

# Executar monitor em background
nohup ./scripts/monitor-payment.sh > /tmp/lightning-monitor.log 2>&1 &
MONITOR_PID=$!

echo "✅ Monitor started (PID: $MONITOR_PID)"
echo "📋 Log file: /tmp/lightning-monitor.log"
echo ""

# 5. Mostrar próximos passos
echo "📋 Step 5: Next steps after receiving sats"
echo "========================================="
echo "1. Payment will be detected automatically"
echo "2. Check balance: ./scripts/lnd-status.sh"
echo "3. Use testnet faucet in the application"
echo "4. Create Lightning invoices for testing"
echo ""

echo "🎯 Ready to receive Lightning payments!"
echo "Monitor logs with: tail -f /tmp/lightning-monitor.log"
