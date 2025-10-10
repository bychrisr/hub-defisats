#!/bin/bash

# Script para criar super admin sem API Keys
# Uso: ./scripts/create-super-admin.sh [email] [username] [password]

set -e

# Valores padrão
EMAIL=${1:-"admin@dev.com"}
USERNAME=${2:-"admin"}
PASSWORD=${3:-"password"}

echo "👑 Criando SUPER ADMIN para desenvolvimento..."
echo "📧 Email: $EMAIL"
echo "👤 Username: $USERNAME"
echo "🔑 Password: $PASSWORD"
echo "🔓 Sem API Keys (não necessário para admin)"

# Verificar se o container está rodando
if ! docker ps | grep -q "axisor-postgres"; then
    echo "❌ Container PostgreSQL não está rodando. Execute 'dev-up' primeiro."
    exit 1
fi

# Hash da senha (usando bcrypt com salt padrão)
# Esta é a hash para a senha "password"
PASSWORD_HASH='$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'

echo "📝 Criando usuário super admin no banco de dados..."
docker exec axisor-postgres psql -U axisor -d axisor -c "
INSERT INTO \"User\" (
  id,
  email,
  username,
  password_hash,
  is_active,
  email_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  '$EMAIL',
  '$USERNAME',
  '$PASSWORD_HASH',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();
"

echo "✅ Usuário super admin criado/atualizado!"

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
  role = 'superadmin';
"

echo "✅ Permissões de super admin criadas!"

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
    echo "👑 Acesso: Painel de administração disponível"
    echo "🔓 Sem necessidade de API Keys LN Markets"
else
    echo "❌ Erro no login:"
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
fi

