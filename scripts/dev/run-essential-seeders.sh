#!/bin/bash

# 🌱 Script para Executar Seeders Essenciais
# Executa apenas os seeders que funcionam e são essenciais

set -e

echo "🌱 Hub DeFiSATS - Essential Seeders"
echo "===================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "config/docker/docker-compose.dev.yml" ]; then
    log_error "Execute este script a partir da raiz do projeto"
    exit 1
fi

# Verificar se containers estão rodando
log_info "Verificando containers..."
if ! docker ps | grep -q "axisor-postgres"; then
    log_error "Container PostgreSQL não está rodando"
    log_info "Execute: docker compose -f config/docker/docker-compose.dev.yml up -d"
    exit 1
fi

if ! docker ps | grep -q "axisor-backend"; then
    log_error "Container Backend não está rodando"
    log_info "Execute: docker compose -f config/docker/docker-compose.dev.yml up -d"
    exit 1
fi

log_success "Containers estão rodando"

# Função para executar seeder
run_seeder() {
    local seeder_name=$1
    local description=$2
    
    log_info "Executando seeder: $seeder_name"
    log_info "Descrição: $description"
    
    if docker compose -f config/docker/docker-compose.dev.yml run --rm backend npm run "seed:$seeder_name"; then
        log_success "Seeder $seeder_name executado com sucesso"
        return 0
    else
        log_error "Falha ao executar seeder $seeder_name"
        return 1
    fi
}

# Lista de seeders essenciais que funcionam
log_info "🌱 Executando seeders essenciais..."

# 1. Exchanges (essencial para LN Markets)
run_seeder "exchanges" "Configurações de exchanges (LN Markets)"

# 2. Plans (se funcionar)
log_info "Tentando executar seeder de planos..."
if docker compose -f config/docker/docker-compose.dev.yml run --rm backend npm run seed:plans 2>/dev/null; then
    log_success "Seeder plans executado com sucesso"
else
    log_warning "Seeder plans falhou - continuando..."
fi

# Verificar status final
log_info "📊 Verificando status final..."

# Verificar exchanges
log_info "🔍 Verificando exchanges..."
docker exec axisor-postgres psql -U axisor -d axisor -c "SELECT name, slug, is_active FROM exchanges;"

# Verificar planos (se existir)
log_info "🔍 Verificando planos..."
if docker exec axisor-postgres psql -U axisor -d axisor -c "SELECT name, slug FROM plans LIMIT 3;" 2>/dev/null; then
    log_success "Planos encontrados"
else
    log_warning "Tabela de planos não encontrada ou vazia"
fi

log_success "🎉 Seeders essenciais executados!"
log_info "🌐 Agora você pode configurar suas credenciais LN Markets no frontend"
