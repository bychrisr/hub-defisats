#!/bin/bash

echo "🧪 TESTE COMPLETO DA INTERFACE ADMINISTRATIVA DE TOOLTIPS"
echo "========================================================="

BASE_URL="http://localhost:13010/api"
FRONTEND_URL="http://localhost:13000"
EMAIL="brainoschris@gmail.com"
PASSWORD="#Lobinho123"

# Função para fazer login e obter token
login() {
    echo ""
    echo "🔐 Fazendo login..."
    
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        token=$(echo "$response" | jq -r '.data.access_token' 2>/dev/null)
        if [ "$token" != "null" ] && [ -n "$token" ]; then
            echo "✅ Login realizado com sucesso"
            echo "   - Token obtido: ${token:0:20}..."
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
    else
        echo "❌ $name falhou (HTTP $http_code)"
        echo "   - Resposta: $body"
        return 1
    fi
}

# Função para testar CRUD de tooltips
test_tooltip_crud() {
    local token="$1"
    
    echo ""
    echo "🔧 Testando CRUD de tooltips..."
    
    # 1. Listar tooltips existentes
    echo "   1. Listando tooltips existentes..."
    if test_authenticated_endpoint "/tooltips" "GET /tooltips" "$token"; then
        echo "   ✅ Listagem funcionando"
    else
        echo "   ❌ Listagem falhou"
        return 1
    fi
    
    # 2. Listar dashboard cards
    echo "   2. Listando dashboard cards..."
    if test_authenticated_endpoint "/dashboard-cards" "GET /dashboard-cards" "$token"; then
        echo "   ✅ Listagem funcionando"
    else
        echo "   ❌ Listagem falhou"
        return 1
    fi
    
    # 3. Testar criação de novo card (se não existir)
    echo "   3. Testando criação de card de teste..."
    test_card_data='{
        "key": "test_card_'$(date +%s)'",
        "title": "Card de Teste",
        "description": "Card criado para teste da interface",
        "icon": "TestTube",
        "category": "test",
        "order_index": 999,
        "is_active": true,
        "is_admin_only": false
    }'
    
    if test_authenticated_endpoint "/dashboard-cards" "POST /dashboard-cards" "$token" "POST" "$test_card_data"; then
        echo "   ✅ Criação de card funcionando"
        
        # Obter a chave do card criado
        test_card_key=$(echo "$test_card_data" | jq -r '.key')
        
        # 4. Testar criação de tooltip para o card
        echo "   4. Testando criação de tooltip..."
        test_tooltip_data='{
            "card_key": "'$test_card_key'",
            "tooltip_text": "Este é um tooltip de teste criado automaticamente",
            "tooltip_position": "top",
            "is_enabled": true
        }'
        
        if test_authenticated_endpoint "/tooltips" "POST /tooltips" "$token" "POST" "$test_tooltip_data"; then
            echo "   ✅ Criação de tooltip funcionando"
            
            # 5. Testar atualização do tooltip
            echo "   5. Testando atualização de tooltip..."
            update_tooltip_data='{
                "tooltip_text": "Tooltip atualizado com sucesso!",
                "tooltip_position": "bottom",
                "is_enabled": true
            }'
            
            if test_authenticated_endpoint "/tooltips/$test_card_key" "PUT /tooltips/$test_card_key" "$token" "PUT" "$update_tooltip_data"; then
                echo "   ✅ Atualização de tooltip funcionando"
                
                # 6. Testar exclusão do tooltip
                echo "   6. Testando exclusão de tooltip..."
                if test_authenticated_endpoint "/tooltips/$test_card_key" "DELETE /tooltips/$test_card_key" "$token" "DELETE"; then
                    echo "   ✅ Exclusão de tooltip funcionando"
                else
                    echo "   ❌ Exclusão de tooltip falhou"
                    return 1
                fi
                
                # 7. Testar exclusão do card
                echo "   7. Testando exclusão de card..."
                if test_authenticated_endpoint "/dashboard-cards/$test_card_key" "DELETE /dashboard-cards/$test_card_key" "$token" "DELETE"; then
                    echo "   ✅ Exclusão de card funcionando"
                else
                    echo "   ❌ Exclusão de card falhou"
                    return 1
                fi
            else
                echo "   ❌ Atualização de tooltip falhou"
                return 1
            fi
        else
            echo "   ❌ Criação de tooltip falhou"
            return 1
        fi
    else
        echo "   ❌ Criação de card falhou"
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
            echo "   - $count cards disponíveis publicamente"
        fi
        return 0
    else
        echo "❌ Endpoint público falhou (HTTP $http_code)"
        return 1
    fi
}

# Executar testes
echo "Iniciando testes da interface administrativa..."

# 1. Fazer login
token=$(login)
if [ $? -ne 0 ]; then
    echo "❌ Falha no login - abortando testes"
    exit 1
fi

# 2. Testar endpoints autenticados
success=true

test_authenticated_endpoint "/tooltips" "GET /tooltips" "$token" || success=false
test_authenticated_endpoint "/dashboard-cards" "GET /dashboard-cards" "$token" || success=false
test_public_endpoint || success=false

# 3. Testar CRUD completo
if [ "$success" = true ]; then
    test_tooltip_crud "$token" || success=false
fi

echo ""
if [ "$success" = true ]; then
    echo "🎉 TODOS OS TESTES PASSARAM!"
    echo ""
    echo "✅ Interface administrativa de tooltips funcionando perfeitamente:"
    echo "   - Login realizado com sucesso"
    echo "   - Endpoints autenticados funcionando"
    echo "   - CRUD completo de tooltips e cards funcionando"
    echo "   - Endpoint público funcionando"
    echo ""
    echo "🚀 A interface está pronta para uso em produção!"
    exit 0
else
    echo "❌ ALGUNS TESTES FALHARAM!"
    echo "Verifique os logs acima para mais detalhes."
    exit 1
fi
