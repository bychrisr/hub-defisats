#!/bin/bash

# 🔧 Script para Corrigir Usuários Administrativos
# Verifica e corrige usuários que deveriam ser admins mas não têm registro

set -e

echo "🔧 Hub DeFiSATS - Fix Admin Users"
echo "================================="

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

log_success "Containers estão rodando"

# Função para verificar usuários administrativos
check_admin_users() {
    log_info "🔍 Verificando usuários administrativos..."
    
    # Lista de emails que deveriam ser admins
    local admin_emails=(
        "admin@axisor.com:superadmin"
        "support@axisor.com:admin"
    )
    
    for admin_info in "${admin_emails[@]}"; do
        IFS=':' read -r email role <<< "$admin_info"
        
        log_info "Verificando: $email"
        
        # Verificar se usuário existe
        local user_exists=$(docker exec axisor-postgres psql -U axisor -d axisor -t -c "SELECT COUNT(*) FROM \"User\" WHERE email = '$email';" | tr -d ' ')
        
        if [ "$user_exists" = "0" ]; then
            log_warning "Usuário $email não existe"
            continue
        fi
        
        # Verificar se tem registro de admin
        local admin_exists=$(docker exec axisor-postgres psql -U axisor -d axisor -t -c "SELECT COUNT(*) FROM \"User\" u JOIN \"AdminUser\" au ON u.id = au.user_id WHERE u.email = '$email';" | tr -d ' ')
        
        if [ "$admin_exists" = "0" ]; then
            log_warning "Usuário $email não tem registro de admin - corrigindo..."
            
            # Obter ID do usuário
            local user_id=$(docker exec axisor-postgres psql -U axisor -d axisor -t -c "SELECT id FROM \"User\" WHERE email = '$email';" | tr -d ' ')
            
            # Criar registro de admin
            docker exec axisor-postgres psql -U axisor -d axisor -c "INSERT INTO \"AdminUser\" (id, user_id, role, created_at) VALUES (gen_random_uuid(), '$user_id', '$role', NOW()) ON CONFLICT (user_id) DO UPDATE SET role = '$role';"
            
            log_success "Registro de admin criado para $email ($role)"
        else
            log_success "Usuário $email já tem registro de admin"
        fi
    done
}

# Função para mostrar status final
show_final_status() {
    log_info "📊 Status final dos usuários administrativos:"
    
    docker exec axisor-postgres psql -U axisor -d axisor -c "SELECT u.email, u.username, au.role FROM \"User\" u LEFT JOIN \"AdminUser\" au ON u.id = au.user_id WHERE u.email LIKE '%@axisor.com' ORDER BY u.email;"
}

# Executar correções
check_admin_users

# Mostrar status final
show_final_status

log_success "🎉 Correção de usuários administrativos concluída!"
