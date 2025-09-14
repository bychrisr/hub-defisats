#!/bin/bash

echo "🔧 CORREÇÃO 502 - Servidor de Produção"
echo "======================================"

echo ""
echo "📋 Comandos para executar no servidor defisats.site:"
echo ""

echo "1. Verificar containers:"
echo "   docker ps"
echo ""

echo "2. Verificar redes Docker:"
echo "   docker network ls"
echo "   docker network inspect proxy-network"
echo ""

echo "3. Parar e reiniciar aplicação:"
echo "   cd /home/bychrisr/projects/hub-defisats"
echo "   docker compose -f docker-compose.prod.yml down"
echo "   docker compose -f docker-compose.prod.yml up -d"
echo ""

echo "4. Verificar logs do nginx:"
echo "   docker logs global-nginx-proxy"
echo ""

echo "5. Verificar logs da aplicação:"
echo "   docker compose -f docker-compose.prod.yml logs nginx"
echo "   docker compose -f docker-compose.prod.yml logs backend"
echo ""

echo "6. Testar conectividade interna:"
echo "   docker exec global-nginx-proxy curl -s http://hub-defisats-nginx-prod:80"
echo ""

echo "7. Se necessário, recriar rede proxy:"
echo "   docker network rm proxy-network"
echo "   docker network create proxy-network"
echo ""

echo "✅ Execute estes comandos no servidor para diagnosticar e corrigir o erro 502!"
