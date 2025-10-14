#!/bin/bash

# Script para criar super admin CORRIGIDO
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

# Verificar se os containers estão rodando
if ! docker ps | grep -q "axisor-postgres"; then
    echo "❌ Container PostgreSQL não está rodando. Execute 'docker compose up -d' primeiro."
    exit 1
fi

if ! docker ps | grep -q "axisor-backend"; then
    echo "❌ Container Backend não está rodando. Execute 'docker compose up -d' primeiro."
    exit 1
fi

echo "🔐 Gerando hash da senha usando o backend..."

# Usar o backend para gerar a hash correta da senha
PASSWORD_HASH=$(docker exec axisor-backend node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('$PASSWORD', 10);
console.log(hash);
")

echo "📝 Hash gerado: $PASSWORD_HASH"

echo "📝 Criando usuário super admin no banco de dados..."

# Criar usuário com hash correta
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

if [ -z "$USER_ID" ]; then
    echo "❌ Erro: Não foi possível obter o ID do usuário"
    exit 1
fi

echo "🆔 User ID: $USER_ID"

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

# Aguardar um pouco para o backend processar
echo "⏳ Aguardando backend processar..."
sleep 3

# Testar login
echo "🧪 Testando login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "📋 Resposta do login: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo ""
    echo "🎉 SUCESSO! Super admin criado com sucesso!"
    echo "═══════════════════════════════════════════════════════════════"
    echo "🌐 Acesse: http://localhost:13000"
    echo "📧 Email: $EMAIL"
    echo "🔑 Password: $PASSWORD"
    echo "👑 Acesso: Painel de administração disponível"
    echo "🔓 Sem necessidade de API Keys LN Markets"
    echo "💎 Plano: Lifetime (todas as funcionalidades)"
    echo "═══════════════════════════════════════════════════════════════"
else
    echo "❌ Erro no login:"
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
    echo ""
    echo "🔍 Verificando se o usuário foi criado..."
    docker exec axisor-postgres psql -U axisor -d axisor -c "SELECT id, email, username, is_active, email_verified, plan_type FROM \"User\" WHERE email = '$EMAIL';"
    echo ""
    echo "🔍 Verificando permissões de admin..."
    docker exec axisor-postgres psql -U axisor -d axisor -c "SELECT au.role, u.email FROM \"AdminUser\" au JOIN \"User\" u ON au.user_id = u.id WHERE u.email = '$EMAIL';"
fi

echo ""
echo "🏁 Script finalizado!"
