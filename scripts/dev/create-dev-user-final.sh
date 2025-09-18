#!/bin/bash

# Script final para criar usuários de teste no ambiente de desenvolvimento
# Uso: ./scripts/create-dev-user-final.sh [email] [username] [password] [--admin]

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

# Criar usuário via API
echo "📝 Criando usuário via API..."

# Preparar dados JSON
JSON_DATA="{\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\",\"confirmPassword\":\"$PASSWORD\",\"ln_markets_api_key\":\"test_key_dev_1234567890\",\"ln_markets_api_secret\":\"test_secret_dev_1234567890\",\"ln_markets_passphrase\":\"testpassphrase_dev\"}"

# Fazer requisição
RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/register -H "Content-Type: application/json" -d "$JSON_DATA")

# Verificar resposta
if echo "$RESPONSE" | grep -q "token"; then
    echo "✅ Usuário criado com sucesso via API!"
elif echo "$RESPONSE" | grep -q "already exists"; then
    echo "⚠️  Usuário já existe, continuando..."
else
    echo "❌ Erro ao criar usuário:"
    echo "$RESPONSE"
    exit 1
fi

# Se for admin, criar permissões
if [ "$IS_ADMIN" = "--admin" ]; then
    echo "👑 Criando permissões de super admin..."
    
    # Obter ID do usuário
    USER_ID=$(docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -t -c "SELECT id FROM \"User\" WHERE email = '$EMAIL';" | tr -d ' \n')
    
    # Criar registro de admin
    docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "INSERT INTO \"AdminUser\" (id, user_id, role, created_at) VALUES (gen_random_uuid()::text, '$USER_ID', 'superadmin', NOW()) ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';"
    
    echo "✅ Permissões de super admin criadas!"
fi

# Testar login
echo "🧪 Testando login..."
LOGIN_JSON="{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/login -H "Content-Type: application/json" -d "$LOGIN_JSON")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login funcionando!"
    echo "🌐 Acesse: http://localhost:13000"
    echo "📧 Email: $EMAIL"
    echo "🔑 Password: $PASSWORD"
    if [ "$IS_ADMIN" = "--admin" ]; then
        echo "👑 Acesso: Painel de administração disponível"
    fi
else
    echo "❌ Erro no login:"
    echo "$LOGIN_RESPONSE"
fi

