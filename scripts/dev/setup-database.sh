#!/bin/bash

# 🗄️ Script Principal para Configuração do Banco de Dados
# Combina correção de migrações e população de dados

set -e

echo "🗄️ Hub DeFiSATS - Database Setup"
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

# Função para verificar containers
check_containers() {
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
}

# Função para corrigir migrações
fix_migrations() {
    log_info "🔧 Corrigindo problemas de migração..."
    
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
    
    # Aguardar backend ficar saudável
    log_info "Aguardando backend ficar saudável..."
    sleep 30
    
    log_success "Migrações corrigidas com sucesso!"
}

# Função para popular banco
populate_database() {
    log_info "🌱 Populando banco de dados..."
    
    # Lista de seeders disponíveis
    local seeders=(
        "rate-limit-config:Configurações de rate limiting"
        "admin-user:Usuários administrativos padrão"
        "plans:Planos de assinatura"
        "health-check:Configurações de health check"
        "exchanges:Configurações de exchanges"
    )
    
    local success_count=0
    local total_count=${#seeders[@]}
    
    for seeder_info in "${seeders[@]}"; do
        IFS=':' read -r seeder_name description <<< "$seeder_info"
        
        log_info "Executando seeder: $seeder_name"
        log_info "Descrição: $description"
        
        if docker compose -f config/docker/docker-compose.dev.yml run --rm backend npm run "seed:$seeder_name"; then
            log_success "Seeder $seeder_name executado com sucesso"
            ((success_count++))
        else
            log_error "Falha ao executar seeder $seeder_name"
        fi
        
        echo "" # Linha em branco para separar
    done
    
    log_info "📊 Resultado: $success_count/$total_count seeders executados com sucesso"
    
    if [ $success_count -eq $total_count ]; then
        log_success "Todos os seeders foram executados com sucesso!"
    else
        log_warning "Alguns seeders falharam. Verifique os logs acima."
    fi
}

# Função para mostrar informações dos dados
show_data_info() {
    echo ""
    echo "📊 DADOS QUE SERÃO POPULADOS:"
    echo "============================"
    echo ""
    echo "🔐 ADMIN USERS:"
    echo "  • admin@axisor.com (superadmin) - Senha: Admin123!@#"
    echo "  • support@axisor.com (admin) - Senha: Support123!@#"
    echo ""
    echo "💰 PLANS:"
    echo "  • Free - $0/mês - 3 posições, 1 automação"
    echo "  • Pro - $29.99/mês - 10 posições, 5 automações"
    echo "  • Enterprise - $99.99/mês - Ilimitado"
    echo "  • Pro Annual - $299.99/ano - Desconto anual"
    echo ""
    echo "⚙️  RATE LIMITS:"
    echo "  • Configurações para development, staging, production"
    echo "  • Limites por tipo de endpoint (auth, api, trading, etc.)"
    echo ""
    echo "🏥 HEALTH CHECK:"
    echo "  • Configurações de monitoramento"
    echo "  • Alertas de sistema"
    echo ""
    echo "🏦 EXCHANGES:"
    echo "  • Configurações de exchanges suportadas"
    echo "  • APIs e credenciais padrão"
    echo ""
}

# Função para verificar status final
check_final_status() {
    log_info "🔍 Verificando status final..."
    
    # Verificar se backend está saudável
    if docker compose -f config/docker/docker-compose.dev.yml ps | grep -q "axisor-backend.*healthy"; then
        log_success "Backend está saudável"
    else
        log_warning "Backend pode não estar totalmente saudável"
    fi
    
    # Verificar se frontend está rodando
    if docker compose -f config/docker/docker-compose.dev.yml ps | grep -q "axisor-frontend"; then
        log_success "Frontend está rodando"
    else
        log_warning "Frontend não está rodando"
    fi
    
    # Testar API
    log_info "Testando API..."
    if curl -s "http://localhost:13010/api/version" > /dev/null; then
        log_success "API está respondendo"
    else
        log_warning "API pode não estar respondendo"
    fi
    
    # Testar Frontend
    log_info "Testando Frontend..."
    if curl -s -I "http://localhost:13000" | head -1 | grep -q "200 OK"; then
        log_success "Frontend está respondendo"
    else
        log_warning "Frontend pode não estar respondendo"
    fi
}

# Função principal
main() {
    log_info "🚀 Iniciando configuração completa do banco de dados..."
    
    # Verificar containers
    check_containers
    
    # Mostrar informações dos dados
    show_data_info
    
    # Perguntar se deve continuar
    echo ""
    read -p "Deseja continuar com a população do banco? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log_info "Operação cancelada pelo usuário"
        exit 0
    fi
    
    # Corrigir migrações
    fix_migrations
    
    # Popular banco
    populate_database
    
    # Verificar status final
    check_final_status
    
    log_success "🎉 Configuração do banco de dados concluída!"
    echo ""
    log_info "🌐 Acessos:"
    log_info "  • Frontend: http://localhost:13000"
    log_info "  • Backend API: http://localhost:13010"
    log_info "  • Swagger Docs: http://localhost:13010/docs"
    echo ""
    log_info "🔐 Usuários criados:"
    log_info "  • admin@axisor.com (superadmin) - Senha: Admin123!@#"
    log_info "  • support@axisor.com (admin) - Senha: Support123!@#"
}

# Executar função principal
main
