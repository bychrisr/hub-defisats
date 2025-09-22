#!/bin/bash

# Script para testar todos os endpoints administrativos
# Uso: ./test-admin-endpoints.sh [BASE_URL] [TOKEN]

BASE_URL=${1:-"http://localhost:13010"}
TOKEN=${2:-"test-admin-token"}

echo "🚀 Testando endpoints administrativos do hub-defisats"
echo "📍 Base URL: $BASE_URL"
echo "🔑 Token: ${TOKEN:0:20}..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=${4:-200}
    
    echo -n "Testing $method $endpoint - $description... "
    
    response=$(curl -s -w "%{http_code}" -X $method \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint" \
        -o /tmp/response_body.json)
    
    status_code="${response: -3}"
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($status_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} ($status_code, expected $expected_status)"
        if [ -f /tmp/response_body.json ]; then
            echo "Response body:"
            cat /tmp/response_body.json | head -c 200
            echo ""
        fi
        return 1
    fi
}

# Contador de testes
total_tests=0
passed_tests=0

echo "📊 1. Dashboard Metrics"
test_endpoint "GET" "/api/admin/dashboard/metrics" "Get dashboard metrics"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "📈 2. Trading Analytics"
test_endpoint "GET" "/api/admin/trading/analytics" "Get trading analytics"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/trading/analytics?search=test" "Trading analytics with search"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/trading/analytics?page=1&limit=5" "Trading analytics with pagination"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "📋 3. Trade Logs"
test_endpoint "GET" "/api/admin/trades/logs" "Get trade logs"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/trades/logs?status=completed" "Trade logs with status filter"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/trades/logs?action=buy" "Trade logs with action filter"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "💰 4. Payment Analytics"
test_endpoint "GET" "/api/admin/payments/analytics" "Get payment analytics"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/payments/analytics?status=completed" "Payment analytics with status filter"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "🔍 5. Backtest Reports"
test_endpoint "GET" "/api/admin/backtests/reports" "Get backtest reports"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/backtests/reports?strategy=momentum" "Backtest reports with strategy filter"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "🎯 6. Simulation Analytics"
test_endpoint "GET" "/api/admin/simulations/analytics" "Get simulation analytics"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/simulations/analytics?type=paper_trading" "Simulation analytics with type filter"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "🤖 7. Automation Management"
test_endpoint "GET" "/api/admin/automations/management" "Get automation management"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/automations/management?type=dca" "Automation management with type filter"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "🔔 8. Notification Management"
test_endpoint "GET" "/api/admin/notifications/management" "Get notification management"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/notifications/management?channel=email" "Notification management with channel filter"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "📄 9. System Reports"
test_endpoint "GET" "/api/admin/reports/system" "Get system reports"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/reports/system?type=daily" "System reports with type filter"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "🔍 10. Audit Logs"
test_endpoint "GET" "/api/admin/audit/logs" "Get audit logs"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))

test_endpoint "GET" "/api/admin/audit/logs?severity=critical" "Audit logs with severity filter"
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "🔒 11. Authentication Tests"
test_endpoint "GET" "/api/admin/dashboard/metrics" "Endpoint without token" 401
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

echo "❌ 12. Error Handling Tests"
test_endpoint "GET" "/api/admin/invalid/endpoint" "Invalid endpoint" 404
total_tests=$((total_tests + 1))
[ $? -eq 0 ] && passed_tests=$((passed_tests + 1))
echo ""

# Resumo dos testes
echo "=================================================="
echo "📊 RESUMO DOS TESTES"
echo "=================================================="
echo "Total de testes: $total_tests"
echo "Testes aprovados: $passed_tests"
echo "Testes falharam: $((total_tests - passed_tests))"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM!${NC}"
    echo "Taxa de sucesso: $(( passed_tests * 100 / total_tests ))%"
    exit 1
fi
