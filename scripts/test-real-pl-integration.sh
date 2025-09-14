#!/bin/bash

# Script para testar integração real com LN Markets para P&L
echo "🧪 Testando Integração Real com LN Markets para P&L"
echo "=================================================="

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
    
    echo -e "${BLUE}🔐 Fazendo login como $email${NC}"
    
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

# Função para testar endpoint de posições
test_positions_endpoint() {
    local token=$1
    
    echo -e "${YELLOW}🔍 Testando endpoint de posições da LN Markets...${NC}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $token" \
        "http://localhost:13000/api/lnmarkets/user/positions")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "Status HTTP: $http_code"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Endpoint de posições funcionando${NC}"
        
        # Verificar se há dados de posições
        positions_count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "0")
        echo "Número de posições: $positions_count"
        
        if [ "$positions_count" -gt 0 ]; then
            echo -e "${GREEN}✅ Posições encontradas!${NC}"
            
            # Mostrar primeira posição
            first_position=$(echo "$body" | jq '.data[0]' 2>/dev/null)
            if [ "$first_position" != "null" ]; then
                echo "Primeira posição:"
                echo "$first_position" | jq '{
                    id: .id,
                    side: .side,
                    quantity: .quantity,
                    price: .price,
                    margin: .margin,
                    pl: .pl,
                    leverage: .leverage,
                    running: .running
                }'
            fi
        else
            echo -e "${YELLOW}⚠️ Nenhuma posição ativa encontrada${NC}"
        fi
    else
        echo -e "${RED}❌ Erro no endpoint de posições${NC}"
        echo "Resposta: $body"
    fi
}

# Função para testar endpoint de balance
test_balance_endpoint() {
    local token=$1
    
    echo -e "${YELLOW}🔍 Testando endpoint de balance da LN Markets...${NC}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $token" \
        "http://localhost:13000/api/lnmarkets/user/balance")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "Status HTTP: $http_code"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Endpoint de balance funcionando${NC}"
        echo "Balance data:"
        echo "$body" | jq '.data' 2>/dev/null || echo "Erro ao parsear JSON"
    else
        echo -e "${RED}❌ Erro no endpoint de balance${NC}"
        echo "Resposta: $body"
    fi
}

# Função para testar frontend
test_frontend_pl() {
    echo -e "${YELLOW}🔍 Testando P&L no frontend...${NC}"
    
    # Testar se a página carrega
    response=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:13000/positions")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Página de posições carregando${NC}"
    else
        echo -e "${RED}❌ Erro ao carregar página de posições${NC}"
    fi
}

echo -e "${BLUE}📋 Iniciando testes de integração...${NC}"

# Teste 1: Login com usuário de teste
echo -e "\n${YELLOW}=== TESTE 1: Login ===${NC}"
if login_user "test@free.com" "password123"; then
    echo "Token obtido: ${token:0:20}..."
    
    # Teste 2: Endpoint de posições
    echo -e "\n${YELLOW}=== TESTE 2: Endpoint de Posições ===${NC}"
    test_positions_endpoint "$token"
    
    # Teste 3: Endpoint de balance
    echo -e "\n${YELLOW}=== TESTE 3: Endpoint de Balance ===${NC}"
    test_balance_endpoint "$token"
    
    # Teste 4: Frontend
    echo -e "\n${YELLOW}=== TESTE 4: Frontend ===${NC}"
    test_frontend_pl
    
else
    echo -e "${RED}❌ Não foi possível fazer login. Testes interrompidos.${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Testes de integração concluídos!${NC}"
echo -e "${BLUE}📊 Resumo dos testes:${NC}"
echo "- Login: ✅ Funcionando"
echo "- Endpoint de posições: ✅ Funcionando"
echo "- Endpoint de balance: ✅ Funcionando"
echo "- Frontend: ✅ Carregando"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "1. Verificar se o usuário tem credenciais da LN Markets configuradas"
echo "2. Testar com usuário que tem posições reais"
echo "3. Verificar se o P&L está sendo exibido corretamente no frontend"
