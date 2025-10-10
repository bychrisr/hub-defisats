#!/bin/bash

# Script para testar permissões de diferentes tipos de usuário
# Este script cria usuários de teste com diferentes planos e testa o redirecionamento

echo "🧪 Testando Sistema de Permissões de Usuário"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para fazer login e obter token
login_user() {
    local email=$1
    local password=$2
    local plan_type=$3
    
    echo -e "${BLUE}🔐 Fazendo login como $email (Plano: $plan_type)${NC}"
    
    response=$(curl -s -X POST "http://localhost:13000/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$response" | grep -q "token"; then
        token=$(echo "$response" | jq -r '.token')
        echo -e "${GREEN}✅ Login bem-sucedido${NC}"
        echo "Token: ${token:0:20}..."
        return 0
    else
        echo -e "${RED}❌ Falha no login${NC}"
        echo "Resposta: $response"
        return 1
    fi
}

# Função para testar acesso a uma rota
test_route_access() {
    local token=$1
    local route=$2
    local expected_status=$3
    local plan_type=$4
    
    echo -e "${YELLOW}🔍 Testando acesso a $route (Esperado: $expected_status)${NC}"
    
    response=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Authorization: Bearer $token" \
        "http://localhost:13000$route")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Acesso correto: $route -> $response${NC}"
    else
        echo -e "${RED}❌ Acesso incorreto: $route -> $response (esperado: $expected_status)${NC}"
    fi
}

# Função para obter perfil do usuário
get_user_profile() {
    local token=$1
    
    response=$(curl -s -X GET "http://localhost:13000/api/profile" \
        -H "Authorization: Bearer $token")
    
    if echo "$response" | grep -q "plan_type"; then
        plan_type=$(echo "$response" | jq -r '.plan_type')
        is_admin=$(echo "$response" | jq -r '.is_admin')
        echo "Plano: $plan_type, Admin: $is_admin"
    else
        echo "Erro ao obter perfil"
    fi
}

echo -e "${BLUE}📋 Testando diferentes tipos de usuário...${NC}"

# Teste 1: Usuário FREE
echo -e "\n${YELLOW}=== TESTE 1: Usuário FREE ===${NC}"
if login_user "test@free.com" "password123" "free"; then
    get_user_profile "$token"
    
    # Testar rotas que usuário FREE pode acessar
    test_route_access "$token" "/dashboard" "200" "free"
    test_route_access "$token" "/profile" "200" "free"
    
    # Testar rotas que usuário FREE NÃO pode acessar
    test_route_access "$token" "/automation" "403" "free"
    test_route_access "$token" "/positions" "403" "free"
    test_route_access "$token" "/margin-guard" "403" "free"
    test_route_access "$token" "/admin" "403" "free"
fi

# Teste 2: Usuário BASIC
echo -e "\n${YELLOW}=== TESTE 2: Usuário BASIC ===${NC}"
if login_user "test@basic.com" "password123" "basic"; then
    get_user_profile "$token"
    
    # Testar rotas que usuário BASIC pode acessar
    test_route_access "$token" "/dashboard" "200" "basic"
    test_route_access "$token" "/profile" "200" "basic"
    test_route_access "$token" "/automation" "200" "basic"
    test_route_access "$token" "/positions" "200" "basic"
    test_route_access "$token" "/reports" "200" "basic"
    
    # Testar rotas que usuário BASIC NÃO pode acessar
    test_route_access "$token" "/margin-guard" "403" "basic"
    test_route_access "$token" "/trading" "403" "basic"
    test_route_access "$token" "/admin" "403" "basic"
fi

# Teste 3: Usuário ADVANCED
echo -e "\n${YELLOW}=== TESTE 3: Usuário ADVANCED ===${NC}"
if login_user "test@advanced.com" "password123" "advanced"; then
    get_user_profile "$token"
    
    # Testar rotas que usuário ADVANCED pode acessar
    test_route_access "$token" "/dashboard" "200" "advanced"
    test_route_access "$token" "/automation" "200" "advanced"
    test_route_access "$token" "/positions" "200" "advanced"
    test_route_access "$token" "/margin-guard" "200" "advanced"
    test_route_access "$token" "/trading" "200" "advanced"
    test_route_access "$token" "/logs" "200" "advanced"
    
    # Testar rotas que usuário ADVANCED NÃO pode acessar
    test_route_access "$token" "/admin" "403" "advanced"
fi

# Teste 4: Usuário ADMIN
echo -e "\n${YELLOW}=== TESTE 4: Usuário ADMIN ===${NC}"
if login_user "admin@axisor.com" "admin123" "admin"; then
    get_user_profile "$token"
    
    # Testar rotas que usuário ADMIN pode acessar
    test_route_access "$token" "/dashboard" "200" "admin"
    test_route_access "$token" "/admin" "200" "admin"
    test_route_access "$token" "/admin/users" "200" "admin"
    test_route_access "$token" "/admin/settings" "200" "admin"
fi

# Teste 5: Usuário não autenticado
echo -e "\n${YELLOW}=== TESTE 5: Usuário NÃO AUTENTICADO ===${NC}"
echo -e "${BLUE}🔍 Testando acesso sem token...${NC}"

# Testar redirecionamento para login
test_route_access "" "/dashboard" "401" "none"
test_route_access "" "/admin" "401" "none"

echo -e "\n${GREEN}🎉 Testes de permissões concluídos!${NC}"
echo -e "${BLUE}📊 Resumo dos testes:${NC}"
echo "- Usuários FREE: Acesso limitado ao dashboard e perfil"
echo "- Usuários BASIC: Acesso a funcionalidades básicas de trading"
echo "- Usuários ADVANCED: Acesso a funcionalidades avançadas"
echo "- Usuários ADMIN: Acesso completo incluindo painel administrativo"
echo "- Usuários não autenticados: Redirecionados para login"
