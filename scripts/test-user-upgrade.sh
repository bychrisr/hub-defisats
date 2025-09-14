#!/bin/bash

# Script para testar a funcionalidade de upgrade de usuário
echo "🧪 TESTE DE UPGRADE DE USUÁRIO"
echo "================================"
echo ""

# Configurações
BASE_URL="http://localhost:13010"
ADMIN_EMAIL="admin@dev.com"
ADMIN_PASSWORD="password"
TEST_USER_EMAIL="test@free.com"
TEST_USER_PASSWORD="test123"

# Função para fazer login
login() {
    local email=$1
    local password=$2
    local user_type=$3
    
    echo "🔐 Fazendo login como $user_type..."
    
    response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$response" | grep -q '"token"'; then
        token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "✅ Login $user_type realizado com sucesso" >&2
        echo "🔑 Token: ${token:0:20}..." >&2
        echo "$token"
    else
        echo "❌ Falha no login $user_type" >&2
        echo "Resposta: $response" >&2
        return 1
    fi
}

# Função para obter lista de usuários
get_users() {
    local token=$1
    
    echo "👥 Buscando lista de usuários..."
    
    response=$(curl -s -X GET "$BASE_URL/api/admin/users?page=1&limit=10" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json")
    
    if echo "$response" | grep -q '"users"'; then
        echo "✅ Lista de usuários obtida com sucesso"
        echo "$response" | jq '.users[] | {id, email, username, plan_type, is_active}' 2>/dev/null || echo "$response"
    else
        echo "❌ Falha ao obter lista de usuários"
        echo "Resposta: $response"
        return 1
    fi
}

# Função para fazer upgrade de usuário
upgrade_user() {
    local admin_token=$1
    local user_id=$2
    local new_plan=$3
    local reason=$4
    
    echo "🔄 Fazendo upgrade do usuário $user_id para plano $new_plan..."
    
    response=$(curl -s -X PUT "$BASE_URL/api/admin/users/$user_id/upgrade" \
        -H "Authorization: Bearer $admin_token" \
        -H "Content-Type: application/json" \
        -d "{\"newPlan\":\"$new_plan\",\"reason\":\"$reason\"}")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Upgrade realizado com sucesso"
        echo "$response" | jq '.data' 2>/dev/null || echo "$response"
    else
        echo "❌ Falha no upgrade"
        echo "Resposta: $response"
        return 1
    fi
}

# Função para obter histórico de upgrades
get_upgrade_history() {
    local admin_token=$1
    
    echo "📊 Buscando histórico de upgrades..."
    
    response=$(curl -s -X GET "$BASE_URL/api/admin/upgrades/history?page=1&limit=5" \
        -H "Authorization: Bearer $admin_token" \
        -H "Content-Type: application/json")
    
    if echo "$response" | grep -q '"upgrades"'; then
        echo "✅ Histórico de upgrades obtido com sucesso"
        echo "$response" | jq '.data.upgrades[] | {userEmail, oldPlan, newPlan, reason, createdAt}' 2>/dev/null || echo "$response"
    else
        echo "❌ Falha ao obter histórico de upgrades"
        echo "Resposta: $response"
        return 1
    fi
}

# Função para obter estatísticas de upgrades
get_upgrade_stats() {
    local admin_token=$1
    
    echo "📈 Buscando estatísticas de upgrades..."
    
    response=$(curl -s -X GET "$BASE_URL/api/admin/upgrades/stats" \
        -H "Authorization: Bearer $admin_token" \
        -H "Content-Type: application/json")
    
    if echo "$response" | grep -q '"totalUpgrades"'; then
        echo "✅ Estatísticas obtidas com sucesso"
        echo "$response" | jq '.data' 2>/dev/null || echo "$response"
    else
        echo "❌ Falha ao obter estatísticas"
        echo "Resposta: $response"
        return 1
    fi
}

# Executar testes
echo "🚀 Iniciando testes de upgrade de usuário..."
echo ""

# 1. Login como admin
admin_token=$(login "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "admin")
if [ $? -ne 0 ]; then
    echo "❌ Não foi possível fazer login como admin. Encerrando testes."
    exit 1
fi

echo ""

# 2. Obter lista de usuários
users_response=$(get_users "$admin_token")
if [ $? -ne 0 ]; then
    echo "❌ Não foi possível obter lista de usuários. Encerrando testes."
    exit 1
fi

echo ""

# 3. Extrair ID do primeiro usuário (que não seja admin)
user_id=$(echo "$users_response" | jq -r '.[] | select(.email != "admin@dev.com") | .id' | head -1)
if [ -z "$user_id" ] || [ "$user_id" = "null" ]; then
    echo "❌ Não foi possível encontrar um usuário para testar. Encerrando testes."
    exit 1
fi

echo "🎯 Usuário selecionado para teste: $user_id"
echo ""

# 4. Fazer upgrade do usuário
upgrade_user "$admin_token" "$user_id" "basic" "Teste de upgrade via script de administração"
if [ $? -ne 0 ]; then
    echo "❌ Falha no upgrade. Continuando com outros testes..."
fi

echo ""

# 5. Obter histórico de upgrades
get_upgrade_history "$admin_token"

echo ""

# 6. Obter estatísticas de upgrades
get_upgrade_stats "$admin_token"

echo ""
echo "🎉 Testes de upgrade de usuário concluídos!"
echo "=========================================="
echo ""
echo "✅ Funcionalidades testadas:"
echo "- Login de administrador"
echo "- Listagem de usuários"
echo "- Upgrade de plano de usuário"
echo "- Histórico de upgrades"
echo "- Estatísticas de upgrades"
echo ""
echo "🔧 Para testar a interface:"
echo "1. Acesse http://localhost:13000/admin/users"
echo "2. Clique nos três pontos de qualquer usuário"
echo "3. Selecione 'Mudar Plano'"
echo "4. Preencha o formulário e confirme"
