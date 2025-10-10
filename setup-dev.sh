#!/bin/bash

# Script de Setup para Desenvolvimento Local
# Hub DeFiSats - Ambiente de Desenvolvimento

echo "🚀 Configurando ambiente de desenvolvimento Hub DeFiSats..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env de desenvolvimento..."
    cat > .env << 'EOF'
# Development Environment Variables
NODE_ENV=development
PORT=3010

# Database
POSTGRES_DB=axisor
POSTGRES_USER=axisor
POSTGRES_PASSWORD=axisor_dev_password
DATABASE_URL=postgresql://axisor:axisor_dev_password@localhost:15432/axisor?schema=public

# Redis
REDIS_URL=redis://localhost:16379

# JWT Secrets (Development keys)
JWT_SECRET=dev-jwt-secret-key-32-chars-minimum-2024
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=dev-refresh-secret-key-32-chars-minimum-2024
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption Key (Development key)
ENCRYPTION_KEY=dev-encryption-key-32-chars-2024

# LN Markets API (Development/Sandbox)
LN_MARKETS_API_URL=https://api.lnmarkets.com/sandbox
LN_MARKETS_API_KEY=your_sandbox_api_key
LN_MARKETS_API_SECRET=your_sandbox_api_secret
LN_MARKETS_PASSPHRASE=your_sandbox_passphrase

# CORS
CORS_ORIGIN=http://localhost:13000

# Frontend
VITE_API_URL=http://localhost:13010
VITE_WS_URL=ws://localhost:13010

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty

# Rate Limiting (Development - more permissive)
RATE_LIMIT_MAX=10000
RATE_LIMIT_TIME_WINDOW=60000

# Test User (for development)
TEST_USER_EMAIL=brainoschris@gmail.com
TEST_USER_PASSWORD=test123456
EOF
    echo "✅ Arquivo .env criado com sucesso!"
else
    echo "✅ Arquivo .env já existe."
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f config/docker/docker-compose.dev.yml down 2>/dev/null || true

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker compose -f config/docker/docker-compose.dev.yml up -d --build

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Verificar status dos containers
echo "📊 Status dos containers:"
docker compose -f config/docker/docker-compose.dev.yml ps

# Executar migrações do banco
echo "🗄️ Executando migrações do banco de dados..."
docker exec axisor-backend npx prisma migrate dev --name init 2>/dev/null || echo "⚠️ Migrações já executadas ou erro na execução"

# Verificar saúde dos serviços
echo "🏥 Verificando saúde dos serviços..."
echo "Backend: $(curl -s http://localhost:13010/health || echo '❌ Indisponível')"
echo "Frontend: $(curl -s http://localhost:13000 > /dev/null && echo '✅ Disponível' || echo '❌ Indisponível')"

echo ""
echo "🎉 Setup concluído!"
echo ""
echo "📋 Informações de acesso:"
echo "   Frontend: http://localhost:13000"
echo "   Backend:  http://localhost:13010"
echo "   Database: localhost:15432"
echo "   Redis:    localhost:16379"
echo ""
echo "👤 Usuário de teste:"
echo "   Email:    brainoschris@gmail.com"
echo "   Password: test123456"
echo ""
echo "🔧 Comandos úteis:"
echo "   Parar:    docker compose -f config/docker/docker-compose.dev.yml down"
echo "   Logs:     docker compose -f config/docker/docker-compose.dev.yml logs -f"
echo "   Rebuild:  docker compose -f config/docker/docker-compose.dev.yml up -d --build"
echo ""
