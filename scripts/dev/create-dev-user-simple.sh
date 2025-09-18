#!/bin/bash

# Script simples para criar usuários de teste no ambiente de desenvolvimento
# Uso: ./scripts/create-dev-user-simple.sh [email] [username] [password] [--admin]

set -e

# Valores padrão
EMAIL=${1:-"test@dev.com"}
USERNAME=${2:-"testuser"}
PASSWORD=${3:-"Password123!"}
IS_ADMIN=${4:-""}

echo "🚀 Criando usuário de teste para desenvolvimento..."
echo "📧 Email: $EMAIL"
echo "👤 Username: $USERNAME"
echo "🔑 Password: $PASSWORD"
if [ "$IS_ADMIN" = "--admin" ]; then
    echo "👑 Tipo: SUPER ADMIN"
else
    echo "👤 Tipo: Usuário normal"
fi

# Verificar se o container está rodando
if ! docker ps | grep -q "hub-defisats-backend"; then
    echo "❌ Container backend não está rodando. Execute 'dev-up' primeiro."
    exit 1
fi

# Criar usuário usando o próprio backend
echo "📝 Criando usuário via API do backend..."
RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\",
    \"confirmPassword\": \"$PASSWORD\",
    \"ln_markets_api_key\": \"test_key_dev_1234567890\",
    \"ln_markets_api_secret\": \"test_secret_dev_1234567890\",
    \"ln_markets_passphrase\": \"testpassphrase_dev\"
  }" 2>/dev/null || echo '{"error": "API_ERROR"}')

# Verificar se o usuário foi criado
if echo "$RESPONSE" | grep -q "token\|user_id"; then
    echo "✅ Usuário criado com sucesso via API!"
elif echo "$RESPONSE" | grep -q "already exists\|duplicate"; then
    echo "⚠️  Usuário já existe, continuando..."
else
    echo "❌ Erro ao criar usuário via API:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Se for admin, criar registro na tabela AdminUser
if [ "$IS_ADMIN" = "--admin" ]; then
    echo "👑 Criando permissões de super admin..."
    USER_ID=$(docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -t -c "SELECT id FROM \"User\" WHERE email = '$EMAIL';" | tr -d ' \n')
    
    docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "
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
      role = EXCLUDED.role;
    "
    echo "✅ Permissões de super admin criadas!"
fi

# Testar login
echo "🧪 Testando login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login funcionando! Token gerado com sucesso."
    echo "🌐 Acesse: http://localhost:13000"
    echo "📧 Email: $EMAIL"
    echo "🔑 Password: $PASSWORD"
    if [ "$IS_ADMIN" = "--admin" ]; then
        echo "👑 Acesso: Painel de administração disponível"
    fi
else
    echo "❌ Erro no login:"
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
fi

