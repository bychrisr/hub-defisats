#!/bin/bash

echo "🧪 TESTE DA INTERFACE DE TOOLTIPS"
echo "====================================="

BASE_URL="http://localhost:13010/api"
FRONTEND_URL="http://localhost:13000"

# Função para testar endpoint
test_endpoint() {
    local endpoint="$1"
    local name="$2"
    
    echo ""
    echo "Testando $name..."
    
    response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint")
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ $name funcionando"
        
        # Contar elementos se for JSON
        if echo "$body" | jq -e '.success' > /dev/null 2>&1; then
            count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
            echo "   - $count itens encontrados"
        fi
        return 0
    else
        echo "❌ $name falhou (HTTP $http_code)"
        return 1
    fi
}

# Função para testar frontend
test_frontend() {
    echo ""
    echo "Testando acessibilidade do frontend..."
    
    response=$(curl -s -w "%{http_code}" "$FRONTEND_URL")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Frontend acessível"
        return 0
    else
        echo "❌ Frontend não acessível (HTTP $http_code)"
        return 1
    fi
}

# Executar testes
success=true

test_endpoint "/cards-with-tooltips" "endpoint /cards-with-tooltips" || success=false
test_endpoint "/tooltips" "endpoint /tooltips" || success=false
test_endpoint "/dashboard-cards" "endpoint /dashboard-cards" || success=false
test_frontend || success=false

echo ""
if [ "$success" = true ]; then
    echo "🎉 TODOS OS TESTES PASSARAM!"
    echo "A interface de tooltips está funcionando corretamente."
    exit 0
else
    echo "❌ ALGUNS TESTES FALHARAM!"
    echo "Verifique os logs acima para mais detalhes."
    exit 1
fi
