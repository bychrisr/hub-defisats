#!/bin/bash

# Script para transformar usuário existente em super admin
# Uso: ./scripts/admin/upgrade-to-super-admin.sh [email]

set -e

# Valores padrão
EMAIL=${1:-"admin@axisor.com"}

echo "👑 Transformando usuário em SUPER ADMIN..."
echo "📧 Email: $EMAIL"

# Verificar se o PostgreSQL está rodando
if ! docker ps | grep -q "axisor-postgres"; then
    echo "❌ Container PostgreSQL não está rodando."
    exit 1
fi

echo "🔍 Verificando se usuário existe..."
USER_EXISTS=$(docker exec axisor-postgres psql -U axisor -d axisor -t -c "SELECT COUNT(*) FROM \"User\" WHERE email = '$EMAIL';" | tr -d ' \n')

if [ "$USER_EXISTS" = "0" ]; then
    echo "❌ Usuário não encontrado: $EMAIL"
    echo "💡 Crie o usuário primeiro via interface web ou API"
    exit 1
fi

echo "✅ Usuário encontrado!"

# Obter ID do usuário
USER_ID=$(docker exec axisor-postgres psql -U axisor -d axisor -t -c "SELECT id FROM \"User\" WHERE email = '$EMAIL';" | tr -d ' \n')
echo "🆔 User ID: $USER_ID"

# Atualizar plano para lifetime
echo "💎 Atualizando plano para lifetime..."
docker exec axisor-postgres psql -U axisor -d axisor -c "
UPDATE \"User\" 
SET 
  plan_type = 'lifetime',
  updated_at = NOW()
WHERE email = '$EMAIL';
"

echo "✅ Plano atualizado para lifetime!"

# Criar permissões de super admin
echo "👑 Criando permissões de super admin..."
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

# Verificar resultado
echo "🔍 Verificando resultado..."
docker exec axisor-postgres psql -U axisor -d axisor -c "
SELECT 
  u.email,
  u.username,
  u.plan_type,
  u.is_active,
  u.email_verified,
  au.role as admin_role
FROM \"User\" u
LEFT JOIN \"AdminUser\" au ON u.id = au.user_id
WHERE u.email = '$EMAIL';
"

echo ""
echo "🎉 SUCESSO! Usuário transformado em super admin!"
echo "═══════════════════════════════════════════════════════════════"
echo "🌐 Acesse: http://localhost:13000"
echo "📧 Email: $EMAIL"
echo "👑 Acesso: Painel de administração disponível"
echo "💎 Plano: Lifetime (todas as funcionalidades)"
echo "🔓 Sem necessidade de API Keys LN Markets"
echo "═══════════════════════════════════════════════════════════════"

echo ""
echo "🧪 Testando login com senha padrão..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"emailOrUsername\": \"$EMAIL\", \"password\": \"Admin123!@#\"}")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login funcionando!"
    echo "🔑 Senha padrão: Admin123!@#"
else
    echo "⚠️ Login falhou. Use a senha que você configurou para este usuário."
    echo "📋 Resposta: $LOGIN_RESPONSE"
fi

echo ""
echo "🏁 Script finalizado!"
