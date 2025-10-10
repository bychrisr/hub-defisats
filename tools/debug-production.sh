#!/bin/bash

echo "🔍 DIAGNÓSTICO DE PRODUÇÃO - Axisor"
echo "=========================================="

echo ""
echo "📊 Status dos containers:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 Testando conectividade:"
echo "  - Health check (nginx): $(curl -s -o /dev/null -w "%{http_code}" https://defisats.site/health)"
echo "  - API health check: $(curl -s -o /dev/null -w "%{http_code}" https://defisats.site/api/health)"

echo ""
echo "📋 Logs do backend (últimas 10 linhas):"
docker compose -f docker-compose.prod.yml logs --tail=10 backend

echo ""
echo "📋 Logs do nginx (últimas 10 linhas):"
docker compose -f docker-compose.prod.yml logs --tail=10 nginx

echo ""
echo "🔌 Testando conectividade interna:"
echo "  - Backend interno: $(docker compose -f docker-compose.prod.yml exec backend curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "ERRO")"
echo "  - Frontend interno: $(docker compose -f docker-compose.prod.yml exec frontend curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "ERRO")"

echo ""
echo "✅ Diagnóstico concluído!"
