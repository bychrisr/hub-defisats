#!/bin/bash

# Script de proteção contra processos antigos
# Verifica se já há processos rodando antes de iniciar

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Verificar se já há processos rodando
check_running_processes() {
    local backend_pid=$(pgrep -f "npm run dev" || true)
    local tsx_pid=$(pgrep -f "tsx watch" || true)
    local vite_pid=$(pgrep -f "vite" || true)
    
    if [ ! -z "$backend_pid" ] || [ ! -z "$tsx_pid" ] || [ ! -z "$vite_pid" ]; then
        error "Processos antigos detectados!"
        if [ ! -z "$backend_pid" ]; then
            warn "Backend rodando (PID: $backend_pid)"
        fi
        if [ ! -z "$tsx_pid" ]; then
            warn "TSX rodando (PID: $tsx_pid)"
        fi
        if [ ! -z "$vite_pid" ]; then
            warn "Vite rodando (PID: $vite_pid)"
        fi
        
        echo
        echo "Deseja matar os processos antigos e continuar? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            log "Matando processos antigos..."
            [ ! -z "$backend_pid" ] && kill $backend_pid 2>/dev/null || true
            [ ! -z "$tsx_pid" ] && kill $tsx_pid 2>/dev/null || true
            [ ! -z "$vite_pid" ] && kill $vite_pid 2>/dev/null || true
            sleep 2
            log "Processos antigos removidos!"
        else
            error "Abortando execução. Resolva os processos antigos manualmente."
            exit 1
        fi
    fi
}

# Verificar se as dependências estão instaladas
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        log "Instalando dependências..."
        npm install
    fi
}

# Verificar se o TypeScript compila
check_typescript() {
    log "Verificando compilação TypeScript..."
    if ! npm run build > /dev/null 2>&1; then
        error "Erros de compilação TypeScript detectados!"
        warn "Executando verificação detalhada..."
        npm run build
        exit 1
    fi
    log "TypeScript compilando corretamente!"
}

# Função principal
main() {
    log "Iniciando verificação de segurança..."
    
    # Verificar se estamos no diretório correto
    if [ ! -f "package.json" ]; then
        error "Execute este script no diretório backend/"
        exit 1
    fi
    
    # Executar verificações
    check_running_processes
    check_dependencies
    check_typescript
    
    log "Todas as verificações passaram! Iniciando servidor..."
    
    # Iniciar o servidor
    npm run dev
}

# Executar função principal
main "$@"
