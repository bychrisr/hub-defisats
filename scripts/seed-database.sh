#!/bin/bash

# 🌱 Database Seeding Script
# Script para popular banco de dados com dados padrão

set -e

echo "🌱 Hub DeFiSATS - Database Seeding"
echo "=================================="

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
if [ ! -f "docker-compose.dev.yml" ]; then
    log_error "Execute este script a partir da raiz do projeto"
    exit 1
fi

# Verificar se containers estão rodando
log_info "Verificando containers..."
if ! docker ps | grep -q "axisor-postgres"; then
    log_error "Container PostgreSQL não está rodando"
    log_info "Execute: docker-compose -f docker-compose.dev.yml up -d"
    exit 1
fi

if ! docker ps | grep -q "axisor-backend"; then
    log_error "Container Backend não está rodando"
    log_info "Execute: docker-compose -f docker-compose.dev.yml up -d"
    exit 1
fi

log_success "Containers estão rodando"

# Função para executar seeder
run_seeder() {
    local seeder_name=$1
    local description=$2
    
    log_info "Executando seeder: $seeder_name"
    log_info "Descrição: $description"
    
    # Executar seeder dentro do container backend
    if docker exec axisor-backend npm run "seed:$seeder_name"; then
        log_success "Seeder $seeder_name executado com sucesso"
    else
        log_error "Falha ao executar seeder $seeder_name"
        return 1
    fi
}

# Menu interativo
show_menu() {
    echo ""
    echo "📋 Opções disponíveis:"
    echo "1) Executar todos os seeders"
    echo "2) Executar apenas Rate Limiting"
    echo "3) Executar apenas Admin Users"
    echo "4) Executar apenas Plans"
    echo "5) Listar seeders disponíveis"
    echo "6) Sair"
    echo ""
}

# Função principal
main() {
    while true; do
        show_menu
        read -p "Escolha uma opção (1-6): " choice
        
        case $choice in
            1)
                log_info "Executando todos os seeders..."
                run_seeder "all" "Todos os seeders"
                ;;
            2)
                run_seeder "rate-limit" "Configurações de Rate Limiting"
                ;;
            3)
                run_seeder "admin" "Usuários Administrativos"
                ;;
            4)
                run_seeder "plans" "Planos de Assinatura"
                ;;
            5)
                log_info "Listando seeders disponíveis..."
                docker exec axisor-backend npm run seed:list
                ;;
            6)
                log_success "Saindo..."
                exit 0
                ;;
            *)
                log_error "Opção inválida. Escolha entre 1-6."
                ;;
        esac
        
        echo ""
        read -p "Pressione Enter para continuar..."
    done
}

# Verificar argumentos da linha de comando
if [ $# -eq 0 ]; then
    # Modo interativo
    main
else
    # Modo direto
    case $1 in
        "all")
            run_seeder "all" "Todos os seeders"
            ;;
        "rate-limit")
            run_seeder "rate-limit" "Configurações de Rate Limiting"
            ;;
        "admin")
            run_seeder "admin" "Usuários Administrativos"
            ;;
        "plans")
            run_seeder "plans" "Planos de Assinatura"
            ;;
        "list")
            docker exec axisor-backend npm run seed:list
            ;;
        *)
            echo "Uso: $0 [all|rate-limit|admin|plans|list]"
            echo ""
            echo "Exemplos:"
            echo "  $0                    # Modo interativo"
            echo "  $0 all                # Executar todos"
            echo "  $0 rate-limit         # Apenas rate limiting"
            echo "  $0 admin              # Apenas admin users"
            echo "  $0 plans              # Apenas plans"
            echo "  $0 list               # Listar disponíveis"
            exit 1
            ;;
    esac
fi

log_success "Script concluído!"