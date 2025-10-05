#!/bin/bash

# 🔧 Script para Garantir Configuração Correta
# Verifica e corrige configurações essenciais para execuções futuras

set -e

echo "🔧 Hub DeFiSATS - Ensure Proper Setup"
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

# Função para verificar e corrigir usuários administrativos
ensure_admin_users() {
    log_info "🔐 Verificando usuários administrativos..."
    
    # Lista de usuários que devem ser admins
    local admin_users=(
        "admin@hub-defisats.com:superadmin"
        "support@hub-defisats.com:admin"
    )
    
    for admin_info in "${admin_users[@]}"; do
        IFS=':' read -r email role <<< "$admin_info"
        
        # Verificar se usuário existe
        local user_exists=$(docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -t -c "SELECT COUNT(*) FROM \"User\" WHERE email = '$email';" | tr -d ' ')
        
        if [ "$user_exists" = "0" ]; then
            log_warning "Usuário $email não existe - será criado pelo seeder"
            continue
        fi
        
        # Verificar se tem registro de admin
        local admin_exists=$(docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -t -c "SELECT COUNT(*) FROM \"User\" u JOIN \"AdminUser\" au ON u.id = au.user_id WHERE u.email = '$email';" | tr -d ' ')
        
        if [ "$admin_exists" = "0" ]; then
            log_warning "Usuário $email não tem registro de admin - corrigindo..."
            
            # Obter ID do usuário
            local user_id=$(docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -t -c "SELECT id FROM \"User\" WHERE email = '$email';" | tr -d ' ')
            
            # Criar registro de admin
            docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "INSERT INTO \"AdminUser\" (id, user_id, role, created_at) VALUES (gen_random_uuid(), '$user_id', '$role', NOW()) ON CONFLICT (user_id) DO UPDATE SET role = '$role';"
            
            log_success "Registro de admin criado para $email ($role)"
        else
            log_success "Usuário $email já tem registro de admin"
        fi
    done
}

# Função para verificar e garantir exchange LN Markets
ensure_ln_markets_exchange() {
    log_info "🏦 Verificando exchange LN Markets..."
    
    # Verificar se exchange existe
    local exchange_exists=$(docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -t -c "SELECT COUNT(*) FROM exchanges WHERE slug = 'ln-markets';" | tr -d ' ')
    
    if [ "$exchange_exists" = "0" ]; then
        log_warning "Exchange LN Markets não encontrada - executando seeder..."
        docker compose -f config/docker/docker-compose.dev.yml run --rm backend npm run seed:exchanges
        log_success "Exchange LN Markets criada"
    else
        log_success "Exchange LN Markets já existe"
    fi
    
    # Verificar tipos de credenciais
    local credential_types_count=$(docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -t -c "SELECT COUNT(*) FROM exchange_credential_types ect JOIN exchanges e ON ect.exchange_id = e.id WHERE e.slug = 'ln-markets';" | tr -d ' ')
    
    if [ "$credential_types_count" = "0" ]; then
        log_warning "Tipos de credenciais não encontrados - executando seeder..."
        docker compose -f config/docker/docker-compose.dev.yml run --rm backend npm run seed:exchanges
        log_success "Tipos de credenciais criados"
    else
        log_success "Tipos de credenciais já existem ($credential_types_count tipos)"
    fi
}

# Função para mostrar status final
show_final_status() {
    log_info "📊 Status final da configuração:"
    
    echo ""
    log_info "🔐 Usuários Administrativos:"
    docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "SELECT u.email, u.username, au.role FROM \"User\" u LEFT JOIN \"AdminUser\" au ON u.id = au.user_id WHERE u.email LIKE '%@hub-defisats.com' ORDER BY u.email;"
    
    echo ""
    log_info "🏦 Exchanges Configuradas:"
    docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "SELECT name, slug, is_active FROM exchanges ORDER BY name;"
    
    echo ""
    log_info "🔑 Tipos de Credenciais LN Markets:"
    docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "SELECT ect.name, ect.field_name, ect.field_type, ect.is_required FROM exchange_credential_types ect JOIN exchanges e ON ect.exchange_id = e.id WHERE e.slug = 'ln-markets' ORDER BY ect.\"order\";"
}

# Executar verificações e correções
ensure_admin_users
ensure_ln_markets_exchange

# Mostrar status final
show_final_status

log_success "🎉 Configuração garantida! Agora os seeders funcionarão corretamente nas próximas execuções."
