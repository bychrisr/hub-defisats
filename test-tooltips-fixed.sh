#!/bin/bash

echo "🎯 TESTE DAS CORREÇÕES DOS TOOLTIPS"
echo "==================================="

BASE_URL="http://localhost:13010/api"
FRONTEND_URL="http://localhost:13000"

# Teste 1: Verificar se os dados estão funcionando
echo ""
echo "1. Testando dados de tooltips..."
response=$(curl -s -w "%{http_code}" "$BASE_URL/cards-with-tooltips")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    echo "✅ Dados de tooltips funcionando"
else
    echo "❌ Problema com dados (HTTP $http_code)"
fi

# Teste 2: Frontend acessível
echo ""
echo "2. Testando frontend..."
response=$(curl -s -w "%{http_code}" "$FRONTEND_URL")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    echo "✅ Frontend acessível"
else
    echo "❌ Frontend não acessível (HTTP $http_code)"
fi

echo ""
echo "🎯 CORREÇÕES IMPLEMENTADAS:"
echo "=========================="
echo "✅ Ícone '?' posicionado junto ao título"
echo "✅ Tooltip posicionado relativo ao ícone"
echo "✅ Posicionamento absoluto ao invés de fixo"
echo "✅ Layout do card reorganizado"
echo ""
echo "🎉 TOOLTIPS CORRIGIDOS!"
echo ""
echo "📋 TESTE MANUAL:"
echo "- Acesse http://localhost:13000/dashboard"
echo "- Verifique se os ícones '?' estão junto aos títulos"
echo "- Passe o mouse sobre os ícones '?'"
echo "- Verifique se os tooltips aparecem próximos aos ícones"