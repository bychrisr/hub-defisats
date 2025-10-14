#!/bin/bash

# Script para criar super admin sem API Keys
# Uso: ./scripts/admin/create-super-admin-fixed.sh [email] [username] [password]

set -e

# Valores padrão
EMAIL=${1:-"admin@axisor.com"}
USERNAME=${2:-"admin"}
PASSWORD=${3:-"Admin123!@#"}

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

# Verificar se o backend está rodando
if ! curl -s "http://localhost:13010/api/health-check" > /dev/null; then
    echo "❌ Backend não está rodando. Execute 'dev-up' primeiro."
    exit 1
fi

echo "🔐 Gerando hash da senha usando bcrypt..."
# Usar o backend para gerar a hash da senha corretamente
PASSWORD_HASH=$(docker exec axisor-backend node -e "
const bcrypt = require('bcryptjs');
const password = '$PASSWORD';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
")

echo "📝 Criando usuário super admin no banco de dados..."
docker exec axisor-postgres psql -U axisor -d axisor -c "
INSERT INTO \"User\" (
  id,
  email,
  username,
  password_hash,
  is_active,
  email_verified,
  plan_type,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  '$EMAIL',
  '$USERNAME',
  '$PASSWORD_HASH',
  true,
  true,
  'lifetime',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  plan_type = 'lifetime',
  updated_at = NOW();
"

echo "✅ Usuário super admin criado/atualizado!"

echo "👑 Criando permissões de super admin..."
USER_ID=$(docker exec axisor-postgres psql -U axisor -d axisor -t -c "SELECT id FROM \"User\" WHERE email = '$EMAIL';" | tr -d ' \n')

echo "🔍 User ID encontrado: $USER_ID"

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
  role = 'superadmin',
  created_at = NOW();
"

echo "✅ Permissões de super admin criadas!"

# Aguardar um pouco para o banco processar
sleep 2

# Testar login
echo "🧪 Testando login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "📋 Resposta do login:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo ""
    echo "🎉 SUCESSO! Super admin criado com sucesso!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"