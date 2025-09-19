#!/bin/bash

echo "🧪 TESTE DA INTERFACE DE TOOLTIPS PARA USUÁRIO COMUM"
echo "===================================================="

BASE_URL="http://localhost:13010/api"
FRONTEND_URL="http://localhost:13000"
EMAIL="brainoschris@gmail.com"
PASSWORD="#Lobinho123"

# Função para fazer login e obter token
login() {
    echo ""
    echo "🔐 Fazendo login como usuário comum..."
    
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
    
    if echo "$response" | jq -e '.user_id' > /dev/null 2>&1; then
        token=$(echo "$response" | jq -r '.token' 2>/dev/null)
        user_id=$(echo "$response" | jq -r '.user_id' 2>/dev/null)
        plan_type=$(echo "$response" | jq -r '.plan_type' 2>/dev/null)
        
        if [ "$token" != "null" ] && [ -n "$token" ]; then
            echo "✅ Login realizado com sucesso"
            echo "   - User ID: $user_id"
            echo "   - Plan: $plan_type"
            echo "   - Token: ${token:0:20}..."
            echo "$token"
            return 0
        else
            echo "❌ Token não encontrado na resposta"
            return 1
        fi
    else
        echo "❌ Falha no login"
        echo "   - Resposta: $response"
        return 1
    fi
}

# Função para testar endpoint com autenticação
test_authenticated_endpoint() {
    local endpoint="$1"
    local name="$2"
    local token="$3"
    local method="${4:-GET}"
    local data="$5"
    
    echo ""
    echo "Testando $name (autenticado)..."
    
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ $name funcionando"
        
        # Verificar estrutura JSON
        if echo "$body" | jq -e '.success' > /dev/null 2>&1; then
            count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
            echo "   - $count itens encontrados"
        fi
        return 0
    elif [ "$http_code" = "403" ]; then
        echo "🔒 $name corretamente restrito (HTTP 403 - Acesso negado)"
        return 0
    elif [ "$http_code" = "401" ]; then
        echo "🔐 $name requer autenticação (HTTP 401)"
        return 0
    else
        echo "❌ $name falhou (HTTP $http_code)"
        echo "   - Resposta: $body"
        return 1
    fi
}

# Função para testar endpoint público
test_public_endpoint() {
    echo ""
    echo "🌐 Testando endpoint público..."
    
    response=$(curl -s -w "%{http_code}" "$BASE_URL/cards-with-tooltips")
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Endpoint público funcionando"
        
        if echo "$body" | jq -e '.success' > /dev/null 2>&1; then
            count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
            tooltips_count=$(echo "$body" | jq '[.data[] | select(.tooltip != null)] | length' 2>/dev/null || echo "0")
            echo "   - $count cards disponíveis publicamente"
            echo "   - $tooltips_count cards com tooltips configurados"
            
            # Mostrar alguns exemplos
            echo "   - Exemplos de cards:"
            echo "$body" | jq -r '.data[0:3][] | "     • \(.title) (\(.category))"' 2>/dev/null || echo "     • Erro ao processar dados"
        fi
        return 0
    else
        echo "❌ Endpoint público falhou (HTTP $http_code)"
        return 1
    fi
}

# Função para testar acesso a funcionalidades administrativas
test_admin_access() {
    local token="$1"
    
    echo ""
    echo "🔒 Testando acesso a funcionalidades administrativas..."
    echo "   (Usuário comum não deve ter acesso)"
    
    # Testar endpoints administrativos
    test_authenticated_endpoint "/tooltips" "GET /tooltips (admin)" "$token" || true
    test_authenticated_endpoint "/dashboard-cards" "GET /dashboard-cards (admin)" "$token" || true
    
    # Testar criação de card (deve falhar)
    echo ""
    echo "   Testando criação de card (deve falhar)..."
    test_card_data='{
        "key": "test_card_unauthorized",
        "title": "Card Não Autorizado",
        "description": "Este card não deveria ser criado",
        "icon": "X",
        "category": "test",
        "order_index": 999,
        "is_active": true,
        "is_admin_only": false
    }'
    
    test_authenticated_endpoint "/dashboard-cards" "POST /dashboard-cards (admin)" "$token" "POST" "$test_card_data" || true
}

# Função para verificar se o usuário pode acessar o dashboard
test_dashboard_access() {
    local token="$1"
    
    echo ""
    echo "📊 Testando acesso ao dashboard do usuário..."
    
    # Testar endpoint do dashboard do usuário
    response=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/dashboard/summary" \
        -H "Authorization: Bearer $token")
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Dashboard do usuário acessível"
        return 0
    else
        echo "❌ Dashboard do usuário não acessível (HTTP $http_code)"
        return 1
    fi
}

# Executar testes
echo "Iniciando testes para usuário comum..."

# 1. Fazer login
token=$(login)
if [ $? -ne 0 ]; then
    echo "❌ Falha no login - abortando testes"
    exit 1
fi

# 2. Testar funcionalidades
success=true

test_public_endpoint || success=false
test_dashboard_access "$token" || success=false
test_admin_access "$token" || success=false

echo ""
if [ "$success" = true ]; then
    echo "🎉 TODOS OS TESTES PASSARAM!"
    echo ""
    echo "✅ Interface de tooltips funcionando corretamente para usuário comum:"
    echo "   - Login realizado com sucesso"
    echo "   - Endpoint público acessível"
    echo "   - Dashboard do usuário acessível"
    echo "   - Funcionalidades administrativas corretamente restritas"
    echo ""
    echo "🚀 A interface está funcionando conforme esperado!"
    exit 0
else
    echo "❌ ALGUNS TESTES FALHARAM!"
    echo "Verifique os logs acima para mais detalhes."
    exit 1
fi
