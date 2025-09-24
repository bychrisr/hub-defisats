#!/bin/bash

# Script de Manutenção Automática da Documentação
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
DOCS_DIR="/home/bychrisr/projects/hub-defisats/.system/docs"
SYSTEM_DIR="/home/bychrisr/projects/hub-defisats/.system"
LOG_FILE="${DOCS_DIR}/scripts/maintenance.log"

# Função para logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo -e "$1"
}

# Header
echo -e "${BLUE}🔧 Script de Manutenção da Documentação${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# 1. Validar Links Internos
log "${YELLOW}🔍 Validando links internos...${NC}"
if "${DOCS_DIR}/scripts/validate-links.sh" > /dev/null 2>&1; then
    log "${GREEN}✅ Links validados com sucesso${NC}"
else
    log "${RED}❌ Encontrados links quebrados - execute validate-links.sh para detalhes${NC}"
fi

# 2. Atualizar Estatísticas no README
log "${YELLOW}📊 Atualizando estatísticas...${NC}"

# Contar arquivos
TOTAL_FILES=$(find "$DOCS_DIR" -name "*.md" | wc -l)
TOTAL_DIRS=$(find "$DOCS_DIR" -type d | grep -v "^${DOCS_DIR}$" | wc -l)
TOTAL_LINES=$(find "$DOCS_DIR" -name "*.md" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
TOTAL_SIZE=$(du -sh "$SYSTEM_DIR" | awk '{print $1}')

# Atualizar README.md com estatísticas
README_FILE="${DOCS_DIR}/README.md"
if [ -f "$README_FILE" ]; then
    # Backup do README
    cp "$README_FILE" "${README_FILE}.bak"
    
    # Atualizar seção de estatísticas
    sed -i "s/- \*\*📁 Total de diretórios\*\*:.*/- **📁 Total de diretórios**: $TOTAL_DIRS/" "$README_FILE"
    sed -i "s/- \*\*📄 Total de arquivos\*\*:.*/- **📄 Total de arquivos**: $TOTAL_FILES documentos/" "$README_FILE"
    sed -i "s/- \*\*📊 Total de linhas\*\*:.*/- **📊 Total de linhas**: $TOTAL_LINES linhas/" "$README_FILE"
    sed -i "s/- \*\*💾 Tamanho total\*\*:.*/- **💾 Tamanho total**: $TOTAL_SIZE/" "$README_FILE"
    
    log "${GREEN}✅ Estatísticas atualizadas no README.md${NC}"
else
    log "${RED}❌ README.md não encontrado${NC}"
fi

# 3. Verificar Arquivos Órfãos
log "${YELLOW}🔍 Verificando arquivos órfãos...${NC}"
ORPHAN_COUNT=0

# Procurar por arquivos .md que não estão referenciados
find "$DOCS_DIR" -name "*.md" | while read -r file; do
    filename=$(basename "$file")
    # Verificar se o arquivo é referenciado em algum lugar
    if ! grep -r "$filename" "$DOCS_DIR" --exclude="$filename" > /dev/null 2>&1; then
        if [ "$filename" != "README.md" ] && [ "$filename" != "NAVIGATION_GUIDE.md" ] && [ "$filename" != "TEAM_PRESENTATION.md" ]; then
            echo "⚠️  Arquivo órfão encontrado: $file"
            ((ORPHAN_COUNT++))
        fi
    fi
done

if [ $ORPHAN_COUNT -eq 0 ]; then
    log "${GREEN}✅ Nenhum arquivo órfão encontrado${NC}"
else
    log "${YELLOW}⚠️  Encontrados $ORPHAN_COUNT arquivos órfãos${NC}"
fi

# 4. Verificar Formatação Markdown
log "${YELLOW}📝 Verificando formatação Markdown...${NC}"
FORMAT_ISSUES=0

find "$DOCS_DIR" -name "*.md" | while read -r file; do
    # Verificar se arquivo tem título (linha começando com #)
    if ! head -10 "$file" | grep -q "^# "; then
        echo "⚠️  Arquivo sem título principal: $file"
        ((FORMAT_ISSUES++))
    fi
    
    # Verificar se arquivo tem conteúdo mínimo
    if [ $(wc -l < "$file") -lt 5 ]; then
        echo "⚠️  Arquivo muito pequeno (< 5 linhas): $file"
        ((FORMAT_ISSUES++))
    fi
done

if [ $FORMAT_ISSUES -eq 0 ]; then
    log "${GREEN}✅ Formatação Markdown OK${NC}"
else
    log "${YELLOW}⚠️  Encontrados $FORMAT_ISSUES problemas de formatação${NC}"
fi

# 5. Atualizar Timestamp de Última Manutenção
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "# Última Manutenção: $TIMESTAMP" > "${DOCS_DIR}/scripts/last-maintenance.txt"

# 6. Gerar Relatório de Manutenção
REPORT_FILE="${DOCS_DIR}/scripts/maintenance-report.md"
cat > "$REPORT_FILE" << EOF
# Relatório de Manutenção da Documentação

**Data**: $(date '+%Y-%m-%d %H:%M:%S')

## 📊 Estatísticas Atuais

- **📁 Diretórios**: $TOTAL_DIRS
- **📄 Arquivos**: $TOTAL_FILES
- **📊 Linhas**: $TOTAL_LINES
- **💾 Tamanho**: $TOTAL_SIZE

## ✅ Verificações Realizadas

- [x] Validação de links internos
- [x] Atualização de estatísticas
- [x] Verificação de arquivos órfãos
- [x] Verificação de formatação Markdown
- [x] Atualização de timestamps

## 🎯 Status Geral

- **Links**: $(if "${DOCS_DIR}/scripts/validate-links.sh" > /dev/null 2>&1; then echo "✅ OK"; else echo "❌ Problemas"; fi)
- **Órfãos**: $(if [ $ORPHAN_COUNT -eq 0 ]; then echo "✅ Nenhum"; else echo "⚠️ $ORPHAN_COUNT encontrados"; fi)
- **Formatação**: $(if [ $FORMAT_ISSUES -eq 0 ]; then echo "✅ OK"; else echo "⚠️ $FORMAT_ISSUES problemas"; fi)

## 📝 Próximas Ações

1. Revisar arquivos órfãos identificados
2. Corrigir problemas de formatação
3. Validar links quebrados (se houver)

---
*Relatório gerado automaticamente pelo script update-docs.sh*
EOF

log "${GREEN}✅ Relatório de manutenção gerado: $REPORT_FILE${NC}"

# 7. Resumo Final
echo ""
echo -e "${BLUE}📋 Resumo da Manutenção${NC}"
echo -e "${BLUE}=====================${NC}"
echo -e "📁 Diretórios: ${GREEN}$TOTAL_DIRS${NC}"
echo -e "📄 Arquivos: ${GREEN}$TOTAL_FILES${NC}"
echo -e "📊 Linhas: ${GREEN}$TOTAL_LINES${NC}"
echo -e "💾 Tamanho: ${GREEN}$TOTAL_SIZE${NC}"
echo ""
echo -e "${GREEN}✅ Manutenção concluída com sucesso!${NC}"
echo -e "📄 Log: $LOG_FILE"
echo -e "📋 Relatório: $REPORT_FILE"

log "${GREEN}🎉 Manutenção da documentação concluída${NC}"
