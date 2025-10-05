#!/bin/bash

# 🔧 Script para Corrigir Ordem de Migrações
# Resolve problemas de ordem de migrações do Prisma

set -e

echo "🔧 Hub DeFiSATS - Fix Migration Order"
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
if ! docker ps | grep -q "hub-defisats-postgres"; then
    log_error "Container PostgreSQL não está rodando"
    log_info "Execute: docker compose -f config/docker/docker-compose.dev.yml up -d"
    exit 1
fi

if ! docker ps | grep -q "hub-defisats-backend"; then
    log_error "Container Backend não está rodando"
    log_info "Execute: docker compose -f config/docker/docker-compose.dev.yml up -d"
    exit 1
fi

log_success "Containers estão rodando"

# Função para resetar migrações
reset_migrations() {
    log_info "🔄 Resetando migrações..."
    
    # Parar backend temporariamente
    log_info "Parando backend..."
    docker compose -f config/docker/docker-compose.dev.yml stop backend
    
    # Resetar banco de dados
    log_info "Resetando banco de dados..."
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma migrate reset --force
    
    # Aplicar schema diretamente (bypass migrações)
    log_info "Aplicando schema diretamente..."
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma db push
    
    # Marcar migrações como aplicadas
    log_info "Marcando migrações como aplicadas..."
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma migrate resolve --applied 20250924164514_init
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma migrate resolve --applied 20250925013108_add_missing_tables
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma migrate resolve --applied 20250928055655_add_registration_progress
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma migrate resolve --applied 20250929000756_add_user_name_and_marketing_fields
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma migrate resolve --applied 20250126_add_user_preferences
    
    # Reiniciar backend
    log_info "Reiniciando backend..."
    docker compose -f config/docker/docker-compose.dev.yml start backend
    
    log_success "Migrações resetadas com sucesso!"
}

# Função para verificar status das migrações
check_migration_status() {
    log_info "📊 Verificando status das migrações..."
    
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma migrate status
}

# Função para aplicar migrações em ordem
apply_migrations_in_order() {
    log_info "🔄 Aplicando migrações em ordem correta..."
    
    # Aplicar migrações uma por uma
    log_info "Aplicando migração inicial..."
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma migrate deploy --name init
    
    log_info "Aplicando migrações adicionais..."
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npx prisma migrate deploy
    
    log_success "Migrações aplicadas com sucesso!"
}

# Menu interativo
show_menu() {
    echo ""
    echo "📋 Opções disponíveis:"
    echo "1) Resetar migrações (recomendado para desenvolvimento)"
    echo "2) Verificar status das migrações"
    echo "3) Aplicar migrações em ordem"
    echo "4) Sair"
    echo ""
    read -p "Escolha uma opção (1-4): " choice
}

# Executar opção escolhida
case $1 in
    "reset")
        reset_migrations
        ;;
    "status")
        check_migration_status
        ;;
    "apply")
        apply_migrations_in_order
        ;;
    *)
        show_menu
        case $choice in
            1)
                reset_migrations
                ;;
            2)
                check_migration_status
                ;;
            3)
                apply_migrations_in_order
                ;;
            4)
                log_info "Saindo..."
                exit 0
                ;;
            *)
                log_error "Opção inválida"
                exit 1
                ;;
        esac
        ;;
esac

log_success "Script concluído!"
