#!/bin/bash

# Script de Validação de Documentação Axisor
# Valida todos os documentos seguindo DOCUMENTATION_STANDARDS.md

set -e

echo "🔍 Validando documentação do Axisor..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
total_files=0
valid_files=0
errors=0
warnings=0

# Função para log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((warnings++))
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((errors++))
}

# Verificar se markdownlint está instalado
if ! command -v markdownlint &> /dev/null; then
    echo "Instalando markdownlint..."
    npm install -g markdownlint-cli
fi

# Verificar se jq está instalado
if ! command -v jq &> /dev/null; then
    echo "Instalando jq..."
    sudo apt-get update && sudo apt-get install -y jq
fi

echo "📁 Verificando estrutura de diretórios..."

# Verificar se docs/ existe
if [ ! -d "docs" ]; then
    error "Diretório docs/ não encontrado"
    exit 1
fi

# Verificar estrutura básica
required_dirs=(
    "docs/architecture"
    "docs/integrations"
    "docs/automations"
    "docs/deployment"
    "docs/security"
    "docs/user-management"
    "docs/charts"
    "docs/administration"
    "docs/testing"
    "docs/monitoring"
    "docs/troubleshooting"
    "docs/migrations"
    "docs/project"
    "docs/knowledge"
    "docs/workflow"
)

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        warn "Diretório obrigatório não encontrado: $dir"
    else
        log "✅ Diretório encontrado: $dir"
    fi
done

echo "📄 Validando arquivos Markdown..."

# Validar todos os arquivos .md
find docs -name "*.md" -type f | while read -r file; do
    ((total_files++))
    echo "Validando: $file"
    
    # Verificar se arquivo não está vazio
    if [ ! -s "$file" ]; then
        error "Arquivo vazio: $file"
        continue
    fi
    
    # Verificar cabeçalho YAML
    if ! head -n 10 "$file" | grep -q "^---"; then
        error "Cabeçalho YAML não encontrado em: $file"
        continue
    fi
    
    # Verificar metadados obrigatórios
    if ! head -n 20 "$file" | grep -q "title:"; then
        error "Campo 'title' não encontrado em: $file"
        continue
    fi
    
    if ! head -n 20 "$file" | grep -q "version:"; then
        error "Campo 'version' não encontrado em: $file"
        continue
    fi
    
    if ! head -n 20 "$file" | grep -q "status:"; then
        error "Campo 'status' não encontrado em: $file"
        continue
    fi
    
    # Verificar se tem índice
    if ! grep -q "## Índice\|## Index\|## Table of Contents" "$file"; then
        warn "Índice não encontrado em: $file"
    fi
    
    # Verificar se tem seção "Como usar este documento"
    if ! grep -q "Como usar este documento\|How to use this document" "$file"; then
        warn "Seção 'Como usar este documento' não encontrada em: $file"
    fi
    
    # Verificar links quebrados (básico)
    grep -o '\[.*\]([^)]*)' "$file" | while read -r link; do
        if [[ $link == *".md"* ]]; then
            # Extrair caminho do link
            path=$(echo "$link" | sed 's/.*(\([^)]*\)).*/\1/')
            if [ ! -f "docs/$path" ] && [ ! -f "$path" ]; then
                warn "Link possivelmente quebrado em $file: $link"
            fi
        fi
    done
    
    ((valid_files++))
done

echo "🔧 Validando sintaxe Markdown..."

# Executar markdownlint
if markdownlint docs/**/*.md --ignore node_modules 2>/dev/null; then
    log "✅ Sintaxe Markdown válida"
else
    error "❌ Erros de sintaxe Markdown encontrados"
fi

echo "📊 Verificando diagramas Mermaid..."

# Verificar se diagramas Mermaid estão bem formados
find docs -name "*.md" -exec grep -l "```mermaid" {} \; | while read -r file; do
    echo "Verificando diagramas Mermaid em: $file"
    
    # Extrair blocos mermaid e verificar sintaxe básica
    awk '/```mermaid/,/```/' "$file" | grep -v "^```" | while read -r line; do
        if [[ $line == *"graph"* ]] || [[ $line == *"sequenceDiagram"* ]]; then
            log "✅ Diagrama Mermaid encontrado"
        fi
    done
done

echo "🔗 Verificando cross-references..."

# Verificar se documentos principais têm cross-references
main_docs=(
    "docs/index.md"
    "docs/README.md"
    "docs/architecture/system-architecture.md"
)

for doc in "${main_docs[@]}"; do
    if [ -f "$doc" ]; then
        if ! grep -q "\[.*\](\./.*\.md)" "$doc"; then
            warn "Poucos cross-references em: $doc"
        else
            log "✅ Cross-references encontrados em: $doc"
        fi
    fi
done

echo "📈 Relatório de Validação"
echo "=========================="
echo "Total de arquivos: $total_files"
echo "Arquivos válidos: $valid_files"
echo "Erros: $errors"
echo "Warnings: $warnings"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ Validação concluída com sucesso!${NC}"
    exit 0
else
    echo -e "${RED}❌ Validação falhou com $errors erro(s)${NC}"
    exit 1
fi
