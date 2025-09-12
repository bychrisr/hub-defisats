#!/bin/bash

# Script para corrigir problemas de Docker em produção
# Resolve o erro 'ContainerConfig' e outros problemas comuns

set -e

echo "🔧 Iniciando correção de problemas Docker para produção..."

# 1. Parar todos os containers
echo "📦 Parando containers existentes..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true

# 2. Remover containers órfãos
echo "🗑️ Removendo containers órfãos..."
docker container prune -f

# 3. Remover imagens não utilizadas
echo "🧹 Removendo imagens não utilizadas..."
docker image prune -f

# 4. Remover imagens específicas do projeto
echo "🗑️ Removendo imagens do projeto..."
docker images | grep hub-defisats | awk '{print $3}' | xargs -r docker rmi -f || true

# 5. Remover volumes órfãos
echo "📁 Removendo volumes órfãos..."
docker volume prune -f

# 6. Limpar cache do Docker
echo "🧽 Limpando cache do Docker..."
docker system prune -f

# 7. Verificar se o arquivo .env.production existe
if [ ! -f ".env.production" ]; then
    echo "⚠️ Arquivo .env.production não encontrado. Criando a partir do exemplo..."
    cp env.production.example .env.production
    echo "✅ Arquivo .env.production criado. Configure as variáveis necessárias."
fi

# 8. Reconstruir imagens do zero
echo "🔨 Reconstruindo imagens do zero..."
docker compose -f docker-compose.prod.yml build --no-cache --pull

# 9. Iniciar serviços
echo "🚀 Iniciando serviços..."
docker compose -f docker-compose.prod.yml up -d

# 10. Verificar status
echo "📊 Verificando status dos containers..."
docker compose -f docker-compose.prod.yml ps

echo "✅ Correção concluída!"
echo "📋 Para verificar logs: docker compose -f docker-compose.prod.yml logs -f"
echo "🌐 Frontend: http://localhost:23001"
echo "🔧 Backend: http://localhost:23000"
