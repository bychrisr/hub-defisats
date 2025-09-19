#!/bin/bash

echo "🎯 TESTE FINAL DA INTERFACE DE TOOLTIPS"
echo "======================================="

BASE_URL="http://localhost:13010/api"
FRONTEND_URL="http://localhost:13000"

# Função para testar endpoint público
test_public_endpoint() {
    echo ""
    echo "🌐 Testando endpoint público /cards-with-tooltips..."
    
    response=$(curl -s -w "%{http_code}" "$BASE_URL/cards-with-tooltips")
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Endpoint público funcionando"
        
        if echo "$body" | jq -e '.success' > /dev/null 2>&1; then
            count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
            tooltips_count=$(echo "$body" | jq '[.data[] | select(.tooltip != null)] | length' 2>/dev/null || echo "0")
            echo "   - $count cards disponíveis"
            echo "   - $tooltips_count cards com tooltips"
            
            # Mostrar exemplos
            echo "   - Exemplos de cards:"
            echo "$body" | jq -r '.data[0:3][] | "     • \(.title) (\(.category))"' 2>/dev/null || echo "     • Erro ao processar"
        fi
        return 0
    else
        echo "❌ Endpoint público falhou (HTTP $http_code)"
        return 1
    fi
}

# Função para testar endpoints protegidos
test_protected_endpoints() {
    echo ""
    echo "🔒 Testando endpoints protegidos..."
    
    # Testar /tooltips
    response=$(curl -s -w "%{http_code}" "$BASE_URL/tooltips")
    http_code="${response: -3}"
    
    if [ "$http_code" = "401" ]; then
        echo "✅ /tooltips corretamente protegido (HTTP 401)"
    else
        echo "❌ /tooltips não está protegido (HTTP $http_code)"
        return 1
    fi
    
    # Testar /dashboard-cards
    response=$(curl -s -w "%{http_code}" "$BASE_URL/dashboard-cards")
    http_code="${response: -3}"
    
    if [ "$http_code" = "401" ]; then
        echo "✅ /dashboard-cards corretamente protegido (HTTP 401)"
    else
        echo "❌ /dashboard-cards não está protegido (HTTP $http_code)"
        return 1
    fi
    
    return 0
}

# Função para testar frontend
test_frontend() {
    echo ""
    echo "🌐 Testando acessibilidade do frontend..."
    
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

# Função para verificar dados
test_data_quality() {
    echo ""
    echo "📊 Verificando qualidade dos dados..."
    
    response=$(curl -s "$BASE_URL/cards-with-tooltips")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        count=$(echo "$response" | jq '.data | length' 2>/dev/null || echo "0")
        
        if [ "$count" -gt 0 ]; then
            echo "✅ Dados encontrados ($count cards)"
            
            # Verificar se tem tooltips
            tooltips_count=$(echo "$response" | jq '[.data[] | select(.tooltip != null)] | length' 2>/dev/null || echo "0")
            
            if [ "$tooltips_count" -gt 0 ]; then
                echo "✅ Tooltips configurados ($tooltips_count cards)"
                
                # Mostrar exemplos de tooltips
                echo "   - Exemplos de tooltips:"
                echo "$response" | jq -r '.data[] | select(.tooltip != null) | "     • \(.title): \(.tooltip.tooltip_text[0:50])..."' 2>/dev/null | head -3
            else
                echo "⚠️  Nenhum tooltip configurado"
            fi
            
            return 0
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

test_public_endpoint || success=false
test_protected_endpoints || success=false
test_frontend || success=false
test_data_quality || success=false

echo ""
if [ "$success" = true ]; then
    echo "🎉 INTERFACE DE TOOLTIPS FUNCIONANDO PERFEITAMENTE!"
    echo ""
    echo "✅ Funcionalidades implementadas:"
    echo "   - Endpoint público acessível"
    echo "   - Endpoints administrativos protegidos"
    echo "   - Frontend acessível"
    echo "   - Dados de qualidade com tooltips configurados"
    echo ""
    echo "🚀 A interface administrativa está pronta para uso!"
    echo "   - Acesse: http://localhost:13000/admin/tooltips"
    echo "   - Use credenciais de administrador para gerenciar tooltips"
    exit 0
else
    echo "❌ ALGUNS TESTES FALHARAM!"
    echo "Verifique os logs acima para mais detalhes."
    exit 1
fi
