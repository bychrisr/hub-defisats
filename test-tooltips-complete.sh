#!/bin/bash

echo "🧪 TESTE COMPLETO DA INTERFACE DE TOOLTIPS"
echo "==========================================="

BASE_URL="http://localhost:13010/api"
FRONTEND_URL="http://localhost:13000"

# Função para testar endpoint público
test_public_endpoint() {
    local endpoint="$1"
    local name="$2"
    
    echo ""
    echo "Testando $name (público)..."
    
    response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint")
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ $name funcionando"
        
        # Verificar estrutura JSON
        if echo "$body" | jq -e '.success' > /dev/null 2>&1; then
            count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
            echo "   - $count itens encontrados"
            
            # Verificar se tem tooltips
            if [ "$count" -gt 0 ]; then
                tooltips_count=$(echo "$body" | jq '[.data[] | select(.tooltip != null)] | length' 2>/dev/null || echo "0")
                echo "   - $tooltips_count cards com tooltips configurados"
            fi
        fi
        return 0
    else
        echo "❌ $name falhou (HTTP $http_code)"
        return 1
    fi
}

# Função para testar endpoint protegido (deve falhar sem auth)
test_protected_endpoint() {
    local endpoint="$1"
    local name="$2"
    
    echo ""
    echo "Testando $name (protegido - deve falhar sem auth)..."
    
    response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint")
    http_code="${response: -3}"
    
    if [ "$http_code" = "401" ]; then
        echo "✅ $name corretamente protegido (HTTP 401)"
        return 0
    else
        echo "❌ $name não está protegido (HTTP $http_code)"
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

# Função para verificar estrutura dos dados
test_data_structure() {
    echo ""
    echo "Verificando estrutura dos dados..."
    
    response=$(curl -s "$BASE_URL/cards-with-tooltips")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        # Verificar se tem pelo menos um card
        count=$(echo "$response" | jq '.data | length' 2>/dev/null || echo "0")
        
        if [ "$count" -gt 0 ]; then
            echo "✅ Dados encontrados ($count cards)"
            
            # Verificar estrutura do primeiro card
            first_card=$(echo "$response" | jq '.data[0]' 2>/dev/null)
            
            if echo "$first_card" | jq -e '.id and .key and .title and .description and .icon and .category and .order_index and .is_active and .is_admin_only' > /dev/null 2>&1; then
                echo "✅ Estrutura dos cards válida"
            else
                echo "❌ Estrutura dos cards inválida"
                return 1
            fi
            
            # Verificar se tem tooltip
            if echo "$first_card" | jq -e '.tooltip' > /dev/null 2>&1; then
                tooltip=$(echo "$first_card" | jq '.tooltip' 2>/dev/null)
                
                if echo "$tooltip" | jq -e '.id and .card_key and .tooltip_text and .tooltip_position and .is_enabled' > /dev/null 2>&1; then
                    echo "✅ Estrutura dos tooltips válida"
                else
                    echo "❌ Estrutura dos tooltips inválida"
                    return 1
                fi
            else
                echo "⚠️  Primeiro card não tem tooltip (pode ser normal)"
            fi
        else
            echo "❌ Nenhum card encontrado"
            return 1
        fi
    else
        echo "❌ Resposta inválida"
        return 1
    fi
}

# Executar testes
success=true

test_public_endpoint "/cards-with-tooltips" "endpoint /cards-with-tooltips" || success=false
test_protected_endpoint "/tooltips" "endpoint /tooltips" || success=false
test_protected_endpoint "/dashboard-cards" "endpoint /dashboard-cards" || success=false
test_frontend || success=false
test_data_structure || success=false

echo ""
if [ "$success" = true ]; then
    echo "🎉 TODOS OS TESTES PASSARAM!"
    echo ""
    echo "✅ Interface de tooltips funcionando corretamente:"
    echo "   - Endpoint público acessível"
    echo "   - Endpoints protegidos corretamente"
    echo "   - Frontend acessível"
    echo "   - Estrutura de dados válida"
    echo ""
    echo "🚀 A interface administrativa está pronta para uso!"
    exit 0
else
    echo "❌ ALGUNS TESTES FALHARAM!"
    echo "Verifique os logs acima para mais detalhes."
    exit 1
fi
