#!/bin/bash

echo "🧪 TESTING FRONTEND REGISTRATION WITH UNIQUE DATA"
echo "================================================"

# Gerar dados únicos
TIMESTAMP=$(date +%s)
RANDOM_SUFFIX=$((RANDOM % 10000))

EMAIL="test_${TIMESTAMP}_${RANDOM_SUFFIX}@example.com"
USERNAME="user_${TIMESTAMP}_${RANDOM_SUFFIX}"

echo "📧 Test data:"
echo "  Email: $EMAIL"
echo "  Username: $USERNAME"
echo "  Password: Test123!@#"
echo "  API Key: test_key_${TIMESTAMP}_${RANDOM_SUFFIX}"
echo "  API Secret: test_secret_${TIMESTAMP}_${RANDOM_SUFFIX}"
echo "  Passphrase: testpassphrase_${TIMESTAMP}"

echo ""
echo "🔍 Step 1: Checking email availability..."
EMAIL_CHECK=$(curl -s -X POST "http://localhost:13010/api/auth/check-email" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

echo "Email check result: $EMAIL_CHECK"

echo ""
echo "🚀 Step 2: Registering user..."
REGISTRATION=$(curl -s -X POST "http://localhost:13010/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"username\": \"$USERNAME\",
    \"password\": \"Test123!@#\",
    \"confirmPassword\": \"Test123!@#\",
    \"ln_markets_api_key\": \"test_key_${TIMESTAMP}_${RANDOM_SUFFIX}\",
    \"ln_markets_api_secret\": \"test_secret_${TIMESTAMP}_${RANDOM_SUFFIX}\",
    \"ln_markets_passphrase\": \"testpassphrase_${TIMESTAMP}\"
  }")

echo "Registration result: $REGISTRATION"

# Verificar se foi bem-sucedido
if echo "$REGISTRATION" | grep -q "user_id"; then
  echo ""
  echo "🎉 SUCCESS! Registration is working correctly."
  echo "✅ User ID: $(echo "$REGISTRATION" | jq -r '.user_id')"
  echo "✅ Plan Type: $(echo "$REGISTRATION" | jq -r '.plan_type')"
else
  echo ""
  echo "❌ FAILED! Registration error:"
  echo "$REGISTRATION" | jq .
fi
