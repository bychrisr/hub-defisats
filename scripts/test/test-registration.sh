#!/bin/bash

echo "🧪 TESTING REGISTRATION SYSTEM COMPREHENSIVELY"
echo "=============================================="

# Test 1: Test with completely unique data
echo "Test 1: Unique data registration"
TIMESTAMP=$(date +%s)
RANDOM_SUFFIX=$((RANDOM % 10000))

EMAIL="test_${TIMESTAMP}_${RANDOM_SUFFIX}@example.com"
USERNAME="user_${TIMESTAMP}_${RANDOM_SUFFIX}"

echo "Using email: $EMAIL"
echo "Using username: $USERNAME"

curl -X POST "http://localhost:13010/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"username\": \"$USERNAME\",
    \"password\": \"Test123!@#\",
    \"confirmPassword\": \"Test123!@#\",
    \"ln_markets_api_key\": \"test_key_${TIMESTAMP}_${RANDOM_SUFFIX}\",
    \"ln_markets_api_secret\": \"test_secret_${TIMESTAMP}_${RANDOM_SUFFIX}\",
    \"ln_markets_passphrase\": \"testpassphrase_${TIMESTAMP}\"
  }" | jq

echo ""
echo "Test 2: Duplicate email test"
curl -X POST "http://localhost:13010/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"username\": \"different_user_${TIMESTAMP}\",
    \"password\": \"Test123!@#\",
    \"confirmPassword\": \"Test123!@#\",
    \"ln_markets_api_key\": \"different_key_${TIMESTAMP}\",
    \"ln_markets_api_secret\": \"different_secret_${TIMESTAMP}\",
    \"ln_markets_passphrase\": \"differentpassphrase_${TIMESTAMP}\"
  }" | jq

echo ""
echo "Test 3: Duplicate username test"
curl -X POST "http://localhost:13010/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"different_${TIMESTAMP}@example.com\",
    \"username\": \"$USERNAME\",
    \"password\": \"Test123!@#\",
    \"confirmPassword\": \"Test123!@#\",
    \"ln_markets_api_key\": \"different_key2_${TIMESTAMP}\",
    \"ln_markets_api_secret\": \"different_secret2_${TIMESTAMP}\",
    \"ln_markets_passphrase\": \"differentpassphrase2_${TIMESTAMP}\"
  }" | jq

echo ""
echo "Test 4: Invalid password format test"
curl -X POST "http://localhost:13010/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"invalid_pass_${TIMESTAMP}@example.com\",
    \"username\": \"invalid_pass_${TIMESTAMP}\",
    \"password\": \"weak\",
    \"confirmPassword\": \"weak\",
    \"ln_markets_api_key\": \"test_key_${TIMESTAMP}\",
    \"ln_markets_api_secret\": \"test_secret_${TIMESTAMP}\",
    \"ln_markets_passphrase\": \"testpassphrase_${TIMESTAMP}\"
  }" | jq

echo ""
echo "Test 5: Missing required fields test"
curl -X POST "http://localhost:13010/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"missing_fields_${TIMESTAMP}@example.com\",
    \"username\": \"missing_fields_${TIMESTAMP}\"
  }" | jq

echo ""
echo "✅ ALL TESTS COMPLETED"
