#!/bin/bash

# Script avançado para criar usuários de teste no ambiente de desenvolvimento
# Uso: ./scripts/create-dev-user-advanced.sh [email] [username] [password] [--admin]

set -e

# Valores padrão
EMAIL=${1:-"test@dev.com"}
USERNAME=${2:-"testuser"}
PASSWORD=${3:-"password"}
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
    \"ln_markets_api_key\": \"test_key_dev_1234567890\",
    \"ln_markets_api_secret\": \"test_secret_dev_1234567890\",
    \"ln_markets_passphrase\": \"testpassphrase_dev\"
  }" 2>/dev/null || echo '{"error": "API_ERROR"}')

# Verificar se o usuário foi criado ou se já existe
if echo "$RESPONSE" | grep -q "token\|user_id"; then
    echo "✅ Usuário criado com sucesso via API!"
elif echo "$RESPONSE" | grep -q "already exists\|duplicate"; then
    echo "⚠️  Usuário já existe, continuando..."
else
    echo "❌ Erro ao criar usuário via API:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "🔄 Tentando criar diretamente no banco..."
    
    # Fallback: criar diretamente no banco
    docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "
    INSERT INTO \"User\" (
      id,
      email,
      username,
      password_hash,
      ln_markets_api_key,
      ln_markets_api_secret,
      ln_markets_passphrase,
      is_active,
      email_verified,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid()::text,
      '$EMAIL',
      '$USERNAME',
      '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
      'test_key_dev_1234567890',
      'test_secret_dev_1234567890',
      'testpassphrase_dev',
      true,
      true,
      NOW(),
      NOW()
    ) ON CONFLICT (email) DO UPDATE SET
      username = EXCLUDED.username,
      password_hash = EXCLUDED.password_hash,
      updated_at = NOW();
    "
    echo "✅ Usuário criado/atualizado no banco!"
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

