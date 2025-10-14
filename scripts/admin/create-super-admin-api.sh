#!/bin/bash

# Script para criar super admin via API do backend
# Uso: ./scripts/admin/create-super-admin-api.sh [email] [username] [password]

set -e

# Valores padrão
EMAIL=${1:-"admin@axisor.com"}
USERNAME=${2:-"admin"}
PASSWORD=${3:-"Admin123!@#"}

echo "👑 Criando SUPER ADMIN via API..."
echo "📧 Email: $EMAIL"
echo "👤 Username: $USERNAME"
echo "🔑 Password: $PASSWORD"

# Verificar se o backend está rodando
if ! docker ps | grep -q "axisor-backend"; then
    echo "❌ Container Backend não está rodando. Execute 'docker compose up -d' primeiro."
    exit 1
fi

echo "🔐 Criando usuário via API..."

# Criar usuário via API de registro
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\",
    \"confirmPassword\": \"$PASSWORD\"
  }")

echo "📋 Resposta do registro: $REGISTER_RESPONSE"

# Verificar se o registro foi bem-sucedido
if echo "$REGISTER_RESPONSE" | grep -q "success\|token"; then
    echo "✅ Usuário criado com sucesso via API!"
else
    # Se falhou, pode ser porque o usuário já existe
    echo "⚠️ Registro falhou, tentando login..."
fi

echo "🔑 Testando login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "📋 Resposta do login: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login funcionando!"
    
    # Extrair token para usar nas próximas requisições
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "🎫 Token obtido: ${TOKEN:0:20}..."
        
        echo "👑 Criando permissões de super admin..."
        
        # Atualizar plano para lifetime
        echo "💎 Atualizando plano para lifetime..."
        PLAN_RESPONSE=$(curl -s -X PUT http://localhost:13010/api/user/plan \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{\"plan_type\": \"lifetime\"}")
        
        echo "📋 Resposta do plano: $PLAN_RESPONSE"
        
        # Criar permissões de admin diretamente no banco
        echo "👑 Criando permissões de super admin no banco..."
        USER_ID=$(docker exec axisor-postgres psql -U axisor -d axisor -t -c "SELECT id FROM \"User\" WHERE email = '$EMAIL';" | tr -d ' \n')
        
        if [ -n "$USER_ID" ]; then
            docker exec axisor-postgres psql -U axisor -d axisor -c "
            INSERT INTO \"AdminUser\" (
              id,
              user_id,
              role,
              created_at
            ) VALUES (
              gen_random_uuid()::text,
              '$USER_ID',
              'superadmin',
              NOW()
            ) ON CONFLICT (user_id) DO UPDATE SET
              role = 'superadmin';
            "
            echo "✅ Permissões de super admin criadas!"
        else
            echo "❌ Não foi possível obter o ID do usuário"
        fi
        
        echo ""
        echo "🎉 SUCESSO! Super admin criado com sucesso!"
        echo "═══════════════════════════════════════════════════════════════"
        echo "🌐 Acesse: http://localhost:13000"
        echo "📧 Email: $EMAIL"
        echo "🔑 Password: $PASSWORD"
        echo "👑 Acesso: Painel de administração disponível"
        echo "🔓 Sem necessidade de API Keys LN Markets"
        echo "💎 Plano: Lifetime (todas as funcionalidades)"
        echo "🎫 Token: ${TOKEN:0:30}..."
        echo "═══════════════════════════════════════════════════════════════"
    else
        echo "❌ Não foi possível obter o token"
    fi
else
    echo "❌ Erro no login:"
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    echo ""
    echo "🔍 Verificando se o usuário existe no banco..."
    docker exec axisor-postgres psql -U axisor -d axisor -c "SELECT id, email, username, is_active, email_verified, plan_type FROM \"User\" WHERE email = '$EMAIL';"
fi

echo ""
echo "🏁 Script finalizado!"
