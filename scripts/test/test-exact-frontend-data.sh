#!/bin/bash

echo "🧪 TESTING EXACT FRONTEND DATA"
echo "=============================="

# Dados exatos que o frontend está enviando
EMAIL="rodrigues0christian@gmail.com"
USERNAME="christian"
PASSWORD="Test123!@#"
CONFIRM_PASSWORD="Test123!@#"
API_KEY="hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE"
API_SECRET="r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA=="
PASSPHRASE="testpassphrase123"

echo "📧 Test data (exact from frontend):"
echo "  Email: $EMAIL"
echo "  Username: $USERNAME"
echo "  Password: $PASSWORD"
echo "  Confirm Password: $CONFIRM_PASSWORD"
echo "  Passwords match: $([ "$PASSWORD" = "$CONFIRM_PASSWORD" ] && echo "YES" || echo "NO")"
echo "  API Key: $API_KEY"
echo "  API Secret: $API_SECRET"
echo "  Passphrase: $PASSPHRASE"

echo ""
echo "🔍 Step 1: Checking email availability..."
EMAIL_CHECK=$(curl -s -X POST "http://localhost:13010/api/auth/check-email" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

echo "Email check result: $EMAIL_CHECK"

echo ""
echo "🚀 Step 2: Registering user with exact frontend data..."
REGISTRATION=$(curl -s -X POST "http://localhost:13010/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\",
    \"confirmPassword\": \"$CONFIRM_PASSWORD\",
    \"ln_markets_api_key\": \"$API_KEY\",
    \"ln_markets_api_secret\": \"$API_SECRET\",
    \"ln_markets_passphrase\": \"$PASSPHRASE\"
  }")

echo "Registration result: $REGISTRATION"

# Verificar se foi bem-sucedido
if echo "$REGISTRATION" | grep -q "user_id"; then
  echo ""
  echo "🎉 SUCCESS! Backend accepts the exact frontend data."
  echo "✅ User ID: $(echo "$REGISTRATION" | jq -r '.user_id')"
  echo "✅ Plan Type: $(echo "$REGISTRATION" | jq -r '.plan_type')"
else
  echo ""
  echo "❌ FAILED! Backend rejected the exact frontend data:"
  echo "$REGISTRATION" | jq .
fi
