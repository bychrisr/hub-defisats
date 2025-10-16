#!/bin/bash

# Script para Gerar Índice Automático da Documentação
# Hub DeFiSats - Sistema de Documentação
# Versão: 1.0.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
DOCS_DIR="/home/bychrisr/projects/axisor/.system/docs"
INDEX_FILE="${DOCS_DIR}/AUTO_INDEX.md"

echo -e "${BLUE}📚 Gerador de Índice Automático${NC}"
echo -e "${BLUE}===============================${NC}"
echo ""

# Função para extrair título do arquivo
get_title() {
    local file="$1"
    # Pegar a primeira linha que começa com #
    grep -m 1 "^# " "$file" 2>/dev/null | sed 's/^# //' | sed 's/[[:space:]]*$//' || echo "$(basename "$file" .md)"
}

# Função para extrair descrição do arquivo
get_description() {
    local file="$1"
    # Procurar por linha que começa com > ou primeira linha após título que não seja vazia
    grep -A 10 "^# " "$file" 2>/dev/null | grep -E "^> |^[A-Z]" | head -1 | sed 's/^> //' | sed 's/[[:space:]]*$//' || echo ""
}

# Iniciar geração do índice
cat > "$INDEX_FILE" << 'EOF'
# 📚 Índice Automático da Documentação

> Índice gerado automaticamente de toda a documentação técnica do Hub DeFiSats

**📅 Última Atualização**: 
EOF

echo "$(date '+%Y-%m-%d %H:%M:%S')" >> "$INDEX_FILE"

cat >> "$INDEX_FILE" << 'EOF'

## 📋 Visão Geral

Este índice é gerado automaticamente e lista todos os documentos disponíveis na estrutura `.system/docs/`, organizados por categoria.

---

EOF

# Processar cada diretório
find "$DOCS_DIR" -type d | sort | while read -r dir; do
    # Pular o diretório raiz e scripts
    if [ "$dir" = "$DOCS_DIR" ] || [[ "$dir" == *"/scripts" ]]; then
        continue
    fi
    
    # Nome da categoria
    category=$(basename "$dir")
    category_title=""
    
    # Mapear nomes de diretórios para títulos
    case "$category" in
        "admin") category_title="🛠️ Administração" ;;
        "api") category_title="🔌 API" ;;
        "architecture") category_title="🏛️ Arquitetura" ;;
        "deployment") category_title="🚀 Deploy" ;;
        "development") category_title="💻 Desenvolvimento" ;;
        "features") category_title="✨ Features" ;;
        "infrastructure") category_title="🏗️ Infraestrutura" ;;
        "ln_markets") category_title="⚡ LN Markets" ;;
        "migrations") category_title="🔄 Migrações" ;;
        "monitoring") category_title="📊 Monitoramento" ;;
        "performance") category_title="⚡ Performance" ;;
        "security") category_title="🔒 Segurança" ;;
        "troubleshooting") category_title="🔧 Troubleshooting" ;;
        "ui") category_title="🎨 Interface" ;;
        *) category_title="📁 $category" ;;
    esac
    
    # Verificar se há arquivos .md no diretório
    if find "$dir" -maxdepth 1 -name "*.md" | grep -q .; then
        echo "## $category_title" >> "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        
        # Listar arquivos .md no diretório
        find "$dir" -maxdepth 1 -name "*.md" | sort | while read -r file; do
            filename=$(basename "$file")
            relative_path=$(realpath --relative-to="$DOCS_DIR" "$file")
            title=$(get_title "$file")
            description=$(get_description "$file")
            
            echo "### 📄 [$title]($relative_path)" >> "$INDEX_FILE"
            
            if [ -n "$description" ]; then
                echo "> $description" >> "$INDEX_FILE"
            fi
            
            # Estatísticas do arquivo
            lines=$(wc -l < "$file")
            size=$(du -h "$file" | awk '{print $1}')
            modified=$(stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null || stat -c "%y" "$file" | cut -d' ' -f1)
            
            echo "" >> "$INDEX_FILE"
            echo "- **📊 Linhas**: $lines" >> "$INDEX_FILE"
            echo "- **💾 Tamanho**: $size" >> "$INDEX_FILE"
            echo "- **📅 Modificado**: $modified" >> "$INDEX_FILE"
            echo "" >> "$INDEX_FILE"
        done
        
        echo "---" >> "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
    fi
done

# Processar arquivos na raiz do docs
echo "## 📋 Documentos Principais" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

find "$DOCS_DIR" -maxdepth 1 -name "*.md" | sort | while read -r file; do
    filename=$(basename "$file")
    
    # Pular arquivos específicos
    if [[ "$filename" == "AUTO_INDEX.md" ]] || [[ "$filename" == "README.md" ]]; then
        continue
    fi
    
    title=$(get_title "$file")
    description=$(get_description "$file")
    relative_path=$(basename "$file")
    
    echo "### 📄 [$title]($relative_path)" >> "$INDEX_FILE"
    
    if [ -n "$description" ]; then
        echo "> $description" >> "$INDEX_FILE"
    fi
    
    # Estatísticas do arquivo
    lines=$(wc -l < "$file")
    size=$(du -h "$file" | awk '{print $1}')
    modified=$(stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null || stat -c "%y" "$file" | cut -d' ' -f1)
    
    echo "" >> "$INDEX_FILE"
    echo "- **📊 Linhas**: $lines" >> "$INDEX_FILE"
    echo "- **💾 Tamanho**: $size" >> "$INDEX_FILE"
    echo "- **📅 Modificado**: $modified" >> "$INDEX_FILE"
    echo "" >> "$INDEX_FILE"
done

# Adicionar estatísticas gerais
cat >> "$INDEX_FILE" << 'EOF'

---

## 📊 Estatísticas Gerais

EOF

# Calcular estatísticas
TOTAL_FILES=$(find "$DOCS_DIR" -name "*.md" | wc -l)
TOTAL_DIRS=$(find "$DOCS_DIR" -type d | grep -v "^${DOCS_DIR}$" | wc -l)
TOTAL_LINES=$(find "$DOCS_DIR" -name "*.md" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
TOTAL_SIZE=$(du -sh "$DOCS_DIR" | awk '{print $1}')

cat >> "$INDEX_FILE" << EOF
- **📁 Total de diretórios**: $TOTAL_DIRS
- **📄 Total de arquivos**: $TOTAL_FILES documentos
- **📊 Total de linhas**: $TOTAL_LINES linhas
- **💾 Tamanho total**: $TOTAL_SIZE

## 🔍 Como Usar Este Índice

1. **📋 Navegação**: Clique nos links para acessar diretamente os documentos
2. **🔍 Busca**: Use Ctrl+F para procurar por termos específicos
3. **📊 Estatísticas**: Veja informações sobre tamanho e última modificação
4. **🔄 Atualização**: Execute \`generate-index.sh\` para regenerar este índice

## 🛠️ Ferramentas

- **🔍 Validar Links**: \`scripts/validate-links.sh\`
- **🔧 Manutenção**: \`scripts/update-docs.sh\`
- **📚 Gerar Índice**: \`scripts/generate-index.sh\`

---

*📅 Índice gerado automaticamente em $(date '+%Y-%m-%d %H:%M:%S')*
*🤖 Para regenerar: \`./scripts/generate-index.sh\`*
EOF

echo -e "${GREEN}✅ Índice gerado com sucesso!${NC}"
echo -e "📄 Arquivo: $INDEX_FILE"
echo -e "📊 Total de arquivos indexados: $TOTAL_FILES"
echo -e "📁 Total de diretórios: $TOTAL_DIRS"
