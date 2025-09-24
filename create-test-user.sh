#!/bin/bash

# Script para criar usuário de teste
# Hub DeFiSats - Usuário de Desenvolvimento

echo "👤 Criando usuário de teste..."

# Verificar se o backend está rodando
if ! curl -s http://localhost:13010/health > /dev/null; then
    echo "❌ Backend não está rodando. Execute primeiro: ./setup-dev.sh"
    exit 1
fi

# Dados do usuário de teste
TEST_EMAIL="brainoschris@gmail.com"
TEST_PASSWORD="TestPassword123!"
TEST_USERNAME="brainoschris"
TEST_API_KEY="hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE="
TEST_API_SECRET="r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA=="
TEST_PASSPHRASE="a6c1bh56jc33"

echo "📋 Dados do usuário de teste:"
echo "   Email: $TEST_EMAIL"
echo "   Username: $TEST_USERNAME"
echo "   Password: $TEST_PASSWORD"

# Fazer requisição de registro
echo "🚀 Registrando usuário..."
RESPONSE=$(curl -s -X POST http://localhost:13010/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"$TEST_PASSWORD\",
    \"confirmPassword\": \"$TEST_PASSWORD\",
    \"ln_markets_api_key\": \"$TEST_API_KEY\",
    \"ln_markets_api_secret\": \"$TEST_API_SECRET\",
    \"ln_markets_passphrase\": \"$TEST_PASSPHRASE\"
  }")

# Verificar resposta
if echo "$RESPONSE" | grep -q "user_id"; then
    echo "✅ Usuário criado com sucesso!"
    echo "📧 Email: $TEST_EMAIL"
    echo "🔑 Password: $TEST_PASSWORD"
    echo ""
    echo "🌐 Acesse: http://localhost:13000"
elif echo "$RESPONSE" | grep -q "already exists"; then
    echo "ℹ️ Usuário já existe no sistema."
    echo "📧 Email: $TEST_EMAIL"
    echo "🔑 Password: $TEST_PASSWORD"
    echo ""
    echo "🌐 Acesse: http://localhost:13000"
else
    echo "❌ Erro ao criar usuário:"
    echo "$RESPONSE"
    exit 1
fi

echo "🎉 Setup do usuário de teste concluído!"
