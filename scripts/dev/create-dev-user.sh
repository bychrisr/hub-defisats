#!/bin/bash

# Script para criar usuário de teste no ambiente de desenvolvimento
# Uso: ./scripts/create-dev-user.sh [email] [username] [password] [--admin]

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
if ! docker ps | grep -q "axisor-postgres"; then
    echo "❌ Container PostgreSQL não está rodando. Execute 'dev-up' primeiro."
    exit 1
fi

# Hash da senha (usando bcrypt com salt padrão)
# Esta é a hash para a senha "password"
PASSWORD_HASH='$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'

# Criar usuário no banco
echo "📝 Criando usuário no banco de dados..."
docker exec axisor-postgres psql -U axisor -d axisor -c "
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
  '$PASSWORD_HASH',
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

echo "✅ Usuário criado/atualizado com sucesso!"

# Se for admin, criar registro na tabela AdminUser
if [ "$IS_ADMIN" = "--admin" ]; then
    echo "👑 Criando permissões de super admin..."
    USER_ID=$(docker exec axisor-postgres psql -U axisor -d axisor -t -c "SELECT id FROM \"User\" WHERE email = '$EMAIL';" | tr -d ' \n')
    
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
      role = EXCLUDED.role;
    "
    echo "✅ Permissões de super admin criadas!"
fi

# Testar login
echo "🧪 Testando login..."
RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

if echo "$RESPONSE" | grep -q "token"; then
    echo "✅ Login funcionando! Token gerado com sucesso."
    echo "🌐 Acesse: http://localhost:13000"
    echo "📧 Email: $EMAIL"
    echo "🔑 Password: $PASSWORD"
else
    echo "❌ Erro no login:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
fi
