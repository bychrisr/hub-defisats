#!/bin/bash

# 👤 Script para Criar Usuário com Hash Correto
# Cria usuários com hash de senha correto e plano específico

set -e

echo "👤 Hub DeFiSATS - Create User with Hash"
echo "======================================="

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

log_success "Containers estão rodando"

# Função para criar usuário
create_user() {
    local email=$1
    local username=$2
    local password=$3
    local plan_type=${4:-"free"}
    
    log_info "🔐 Criando usuário: $email"
    log_info "👤 Username: $username"
    log_info "💰 Plano: $plan_type"
    
    # Verificar se usuário já existe
    local user_exists=$(docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -t -c "SELECT COUNT(*) FROM \"User\" WHERE email = '$email';" | tr -d ' ')
    
    if [ "$user_exists" != "0" ]; then
        log_warning "Usuário $email já existe - removendo..."
        docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "DELETE FROM \"User\" WHERE email = '$email';"
    fi
    
    # Gerar hash da senha
    log_info "🔐 Gerando hash da senha..."
    local password_hash=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$password', 12).then(hash => console.log(hash));" 2>/dev/null)
    
    if [ -z "$password_hash" ]; then
        log_error "Falha ao gerar hash da senha"
        exit 1
    fi
    
    # Criar usuário
    log_info "👤 Criando usuário no banco..."
    docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "INSERT INTO \"User\" (id, email, username, password_hash, plan_type, is_active, email_verified, created_at, updated_at) VALUES (gen_random_uuid(), '$email', '$username', '$password_hash', '$plan_type', true, true, NOW(), NOW());"
    
    log_success "✅ Usuário criado com sucesso!"
    
    # Verificar usuário criado
    log_info "📊 Verificando usuário criado..."
    docker exec hub-defisats-postgres psql -U hubdefisats -d hubdefisats -c "SELECT email, username, plan_type, is_active, email_verified FROM \"User\" WHERE email = '$email';"
}

# Menu interativo
show_menu() {
    echo ""
    echo "📋 Opções disponíveis:"
    echo "1) Criar usuário personalizado"
    echo "2) Criar usuário brainoschris@gmail.com (lifetime)"
    echo "3) Sair"
    echo ""
    read -p "Escolha uma opção (1-3): " choice
}

# Executar opção escolhida
case $1 in
    "brainoschris")
        create_user "brainoschris@gmail.com" "brainoschris" "TestPassword123!" "lifetime"
        ;;
    "custom")
        if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
            log_error "Uso: $0 custom <email> <username> <password> [plan_type]"
            log_info "Exemplo: $0 custom user@example.com user MyPassword123! lifetime"
            exit 1
        fi
        create_user "$2" "$3" "$4" "$5"
        ;;
    *)
        show_menu
        case $choice in
            1)
                echo ""
                read -p "Email: " email
                read -p "Username: " username
                read -p "Password: " password
                read -p "Plan type (free/pro/lifetime): " plan_type
                create_user "$email" "$username" "$password" "$plan_type"
                ;;
            2)
                create_user "brainoschris@gmail.com" "brainoschris" "TestPassword123!" "lifetime"
                ;;
            3)
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

log_success "🎉 Script concluído!"
