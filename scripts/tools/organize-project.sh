#!/bin/bash

# 🗂️ Script de Organização Automática de Projetos
# Baseado na estrutura do Hub DeFiSats
# Uso: ./organize-project.sh [caminho-do-projeto]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Função para imprimir header
print_header() {
    echo ""
    print_color $PURPLE "=========================================="
    print_color $PURPLE "🗂️  ORGANIZAÇÃO AUTOMÁTICA DE PROJETOS"
    print_color $PURPLE "=========================================="
    echo ""
}

# Função para verificar se o diretório existe
check_directory() {
    local dir=$1
    if [ ! -d "$dir" ]; then
        print_color $RED "❌ Diretório não encontrado: $dir"
        exit 1
    fi
}

# Função para criar backup
create_backup() {
    local project_dir=$1
    local backup_dir="${project_dir}-backup-$(date +%Y%m%d-%H%M%S)"
    
    print_color $YELLOW "📦 Criando backup do projeto..."
    cp -r "$project_dir" "$backup_dir"
    print_color $GREEN "✅ Backup criado: $backup_dir"
}

# Função para criar estrutura de pastas
create_structure() {
    local project_dir=$1
    
    print_color $YELLOW "🏗️ Criando estrutura de pastas..."
    
    # Criar pastas principais
    mkdir -p "$project_dir/scripts"{admin,deploy,dev,test}
    mkdir -p "$project_dir/config"{docker,env,k8s}
    mkdir -p "$project_dir/docs"{api,architecture,security}
    mkdir -p "$project_dir/tools"
    mkdir -p "$project_dir/monitoring"
    mkdir -p "$project_dir/infra"
    mkdir -p "$project_dir/tests"
    mkdir -p "$project_dir/logs"
    mkdir -p "$project_dir/backups"
    
    print_color $GREEN "✅ Estrutura de pastas criada"
}

# Função para mover scripts
move_scripts() {
    local project_dir=$1
    
    print_color $YELLOW "📁 Organizando scripts..."
    
    # Scripts de administração
    mv "$project_dir"/*admin*.js "$project_dir/scripts/admin/" 2>/dev/null || true
    mv "$project_dir"/*admin*.sh "$project_dir/scripts/admin/" 2>/dev/null || true
    
    # Scripts de deploy
    mv "$project_dir"/deploy-*.sh "$project_dir/scripts/deploy/" 2>/dev/null || true
    mv "$project_dir"/setup-staging.sh "$project_dir/scripts/deploy/" 2>/dev/null || true
    
    # Scripts de desenvolvimento
    mv "$project_dir"/setup*.sh "$project_dir/scripts/dev/" 2>/dev/null || true
    mv "$project_dir"/create-dev*.sh "$project_dir/scripts/dev/" 2>/dev/null || true
    mv "$project_dir"/fix-*.sh "$project_dir/scripts/dev/" 2>/dev/null || true
    mv "$project_dir"/seed-*.js "$project_dir/scripts/dev/" 2>/dev/null || true
    
    # Scripts de teste
    mv "$project_dir"/test-*.sh "$project_dir/scripts/test/" 2>/dev/null || true
    mv "$project_dir"/test-*.js "$project_dir/scripts/test/" 2>/dev/null || true
    
    print_color $GREEN "✅ Scripts organizados"
}

# Função para mover configurações
move_configs() {
    local project_dir=$1
    
    print_color $YELLOW "⚙️ Organizando configurações..."
    
    # Arquivos de ambiente
    mv "$project_dir"/.env.* "$project_dir/config/env/" 2>/dev/null || true
    mv "$project_dir"/env.* "$project_dir/config/env/" 2>/dev/null || true
    
    # Docker Compose
    mv "$project_dir"/docker-compose.*.yml "$project_dir/config/docker/" 2>/dev/null || true
    
    # Kubernetes
    mv "$project_dir"/*.yaml "$project_dir/config/k8s/" 2>/dev/null || true
    
    # Configurações específicas
    mv "$project_dir"/playwright.config.ts "$project_dir/config/" 2>/dev/null || true
    mv "$project_dir"/jest.config.js "$project_dir/config/" 2>/dev/null || true
    mv "$project_dir"/tsconfig.json "$project_dir/config/" 2>/dev/null || true
    
    print_color $GREEN "✅ Configurações organizadas"
}

# Função para mover ferramentas
move_tools() {
    local project_dir=$1
    
    print_color $YELLOW "🛠️ Organizando ferramentas..."
    
    # Ferramentas de debug e manutenção
    mv "$project_dir"/debug-*.sh "$project_dir/tools/" 2>/dev/null || true
    mv "$project_dir"/fix-*.sh "$project_dir/tools/" 2>/dev/null || true
    
    print_color $GREEN "✅ Ferramentas organizadas"
}

# Função para criar READMEs
create_readmes() {
    local project_dir=$1
    
    print_color $YELLOW "📚 Criando documentação..."
    
    # README principal
    cat > "$project_dir/README.md" << 'EOF'
# Nome do Projeto

## 🎯 Visão Geral
Breve descrição do projeto

## 🏗️ Estrutura do Projeto
```
projeto/
├── scripts/          # Scripts organizados por categoria
├── config/           # Configurações centralizadas
├── docs/             # Documentação do projeto
├── tools/            # Ferramentas e utilitários
└── ...
```

## 🚀 Início Rápido
Como executar o projeto

## 📚 Documentação
Links para documentação específica

## 🤝 Contribuição
Como contribuir com o projeto
EOF

    # README de scripts
    cat > "$project_dir/scripts/README.md" << 'EOF'
# Scripts do Projeto

## 📁 Estrutura
- `admin/` - Scripts de administração
- `deploy/` - Scripts de deploy
- `dev/` - Scripts de desenvolvimento
- `test/` - Scripts de teste

## 🔧 Como usar
Cada script tem sua documentação específica na pasta correspondente.
EOF

    # README de configurações
    cat > "$project_dir/config/README.md" << 'EOF'
# Configurações do Projeto

## 📁 Estrutura
- `docker/` - Docker Compose files
- `env/` - Arquivos de ambiente
- `k8s/` - Configurações Kubernetes

## 🔧 Como usar
Cada configuração tem sua documentação específica na pasta correspondente.
EOF

    print_color $GREEN "✅ Documentação criada"
}

# Função para validar estrutura
validate_structure() {
    local project_dir=$1
    
    print_color $YELLOW "🔍 Validando estrutura..."
    
    # Verificar pastas obrigatórias
    local required_dirs=("scripts" "config" "docs" "tools")
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$project_dir/$dir" ]; then
            print_color $RED "❌ Pasta obrigatória não encontrada: $dir"
            return 1
        fi
    done
    
    # Verificar READMEs
    local required_readmes=("README.md" "scripts/README.md" "config/README.md")
    for readme in "${required_readmes[@]}"; do
        if [ ! -f "$project_dir/$readme" ]; then
            print_color $RED "❌ README obrigatório não encontrado: $readme"
            return 1
        fi
    done
    
    print_color $GREEN "✅ Estrutura validada com sucesso"
    return 0
}

# Função para mostrar resumo
show_summary() {
    local project_dir=$1
    
    print_color $CYAN "📊 RESUMO DA ORGANIZAÇÃO"
    print_color $CYAN "========================="
    echo ""
    
    # Contar arquivos por categoria
    local scripts_count=$(find "$project_dir/scripts" -type f 2>/dev/null | wc -l)
    local configs_count=$(find "$project_dir/config" -type f 2>/dev/null | wc -l)
    local tools_count=$(find "$project_dir/tools" -type f 2>/dev/null | wc -l)
    local docs_count=$(find "$project_dir/docs" -type f 2>/dev/null | wc -l)
    
    print_color $GREEN "📁 Scripts organizados: $scripts_count"
    print_color $GREEN "⚙️ Configurações organizadas: $configs_count"
    print_color $GREEN "🛠️ Ferramentas organizadas: $tools_count"
    print_color $GREEN "📚 Documentação criada: $docs_count"
    
    echo ""
    print_color $PURPLE "🎉 Organização concluída com sucesso!"
    print_color $PURPLE "📁 Projeto organizado em: $project_dir"
}

# Função principal
main() {
    local project_dir=${1:-.}
    
    print_header
    
    # Verificar se o diretório existe
    check_directory "$project_dir"
    
    # Criar backup
    create_backup "$project_dir"
    
    # Criar estrutura
    create_structure "$project_dir"
    
    # Mover arquivos
    move_scripts "$project_dir"
    move_configs "$project_dir"
    move_tools "$project_dir"
    
    # Criar documentação
    create_readmes "$project_dir"
    
    # Validar estrutura
    if validate_structure "$project_dir"; then
        show_summary "$project_dir"
    else
        print_color $RED "❌ Falha na validação da estrutura"
        exit 1
    fi
}

# Verificar se o script está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
