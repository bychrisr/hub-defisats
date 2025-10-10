#!/bin/bash

# 🌱 Script para Popular Banco de Dados
# Executa seeders para popular banco com dados padrão

set -e

echo "🌱 Hub DeFiSATS - Database Population"
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
    
    # Executar seeder dentro do container backend
    if docker compose -f config/docker/docker-compose.dev.yml run --rm backend npm run "seed:$seeder_name"; then
        log_success "Seeder $seeder_name executado com sucesso"
    else
        log_error "Falha ao executar seeder $seeder_name"
        return 1
    fi
}

# Função para executar todos os seeders
run_all_seeders() {
    log_info "🌱 Executando todos os seeders..."
    
    # Lista de seeders disponíveis
    local seeders=(
        "rate-limit:Configurações de rate limiting"
        "admin:Usuários administrativos padrão"
        "plans:Planos de assinatura"
        "exchanges:Configurações de exchanges"
    )
    
    local success_count=0
    local total_count=${#seeders[@]}
    
    for seeder_info in "${seeders[@]}"; do
        IFS=':' read -r seeder_name description <<< "$seeder_info"
        
        if run_seeder "$seeder_name" "$description"; then
            ((success_count++))
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

# Função para listar seeders disponíveis
list_seeders() {
    log_info "📋 Listando seeders disponíveis..."
    
    docker compose -f config/docker/docker-compose.dev.yml run --rm backend npm run seed:list
}

# Função para mostrar informações dos dados que serão populados
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

# Menu interativo
show_menu() {
    echo ""
    echo "📋 Opções disponíveis:"
    echo "1) Executar todos os seeders"
    echo "2) Executar seeder específico"
    echo "3) Listar seeders disponíveis"
    echo "4) Mostrar informações dos dados"
    echo "5) Sair"
    echo ""
    read -p "Escolha uma opção (1-5): " choice
}

# Executar opção escolhida
case $1 in
    "all")
        run_all_seeders
        ;;
    "specific")
        if [ -z "$2" ]; then
            log_error "Por favor, forneça o nome do seeder"
            log_info "Use: $0 specific <seeder-name>"
            exit 1
        fi
        run_seeder "$2" "Seeder específico"
        ;;
    "list")
        list_seeders
        ;;
    "info")
        show_data_info
        ;;
    *)
        show_menu
        case $choice in
            1)
                run_all_seeders
                ;;
            2)
                echo ""
                log_info "Seeders disponíveis:"
                echo "  • rate-limit-config"
                echo "  • admin-user"
                echo "  • plans"
                echo "  • health-check"
                echo "  • exchanges"
                echo ""
                read -p "Digite o nome do seeder: " seeder_name
                run_seeder "$seeder_name" "Seeder específico"
                ;;
            3)
                list_seeders
                ;;
            4)
                show_data_info
                ;;
            5)
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
