#!/bin/bash

echo "🧪 TESTANDO OPERAÇÕES CRUD PARA USUÁRIOS"
echo "========================================"

BASE_URL="http://localhost:13010"
TOKEN="test-token" # Em produção, usar token real

echo ""
echo "1. 📖 READ - Listar usuários"
echo "----------------------------"
curl -s "$BASE_URL/api/admin/users?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.' || echo "❌ Erro na listagem"

echo ""
echo "2. ✏️ UPDATE - Atualizar usuário (teste com UUID inválido)"
echo "--------------------------------------------------------"
curl -s -X PUT "$BASE_URL/api/admin/users/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username": "testuser", "email": "test@example.com", "plan_type": "basic"}' | jq '.' || echo "❌ Erro na atualização"

echo ""
echo "3. 🗑️ DELETE - Excluir usuário (teste com UUID inválido)"
echo "------------------------------------------------------"
curl -s -X DELETE "$BASE_URL/api/admin/users/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN" | jq '.' || echo "❌ Erro na exclusão"

echo ""
echo "4. 🔄 TOGGLE - Toggle status (teste com UUID inválido)"
echo "----------------------------------------------------"
curl -s -X PATCH "$BASE_URL/api/admin/users/00000000-0000-0000-0000-000000000000/toggle" \
  -H "Authorization: Bearer $TOKEN" | jq '.' || echo "❌ Erro no toggle"

echo ""
echo "5. ➕ CREATE - Criar usuário (teste com dados válidos)"
echo "---------------------------------------------------"
curl -s -X POST "$BASE_URL/api/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "testuser123",
    "email": "testuser123@example.com",
    "password": "TestPassword123!",
    "plan_type": "basic",
    "is_active": true,
    "notes": "Test user created via API"
  }' | jq '.' || echo "❌ Erro na criação"

echo ""
echo "6. 📊 BULK - Operações em lote"
echo "------------------------------"
curl -s -X POST "$BASE_URL/api/admin/users/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "operation": "activate",
    "userIds": ["00000000-0000-0000-0000-000000000000"]
  }' | jq '.' || echo "❌ Erro nas operações em lote"

echo ""
echo "✅ TESTE DE OPERAÇÕES CRUD CONCLUÍDO"
echo "===================================="

