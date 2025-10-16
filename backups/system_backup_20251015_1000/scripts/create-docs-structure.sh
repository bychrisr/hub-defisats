#!/bin/bash

# Script para criar estrutura de documentação padronizada
# Uso: ./create-docs-structure.sh {feature-name}

set -e

FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
  echo "❌ Erro: Nome do feature é obrigatório"
  echo "📖 Uso: ./create-docs-structure.sh {feature-name}"
  echo ""
  echo "Exemplos:"
  echo "  ./create-docs-structure.sh stripe-integration"
  echo "  ./create-docs-structure.sh websocket-v3"
  echo "  ./create-docs-structure.sh cache-system"
  exit 1
fi

DOCS_PATH=".system/docs/$FEATURE_NAME"

# Verificar se já existe
if [ -d "$DOCS_PATH" ]; then
  echo "⚠️  Aviso: Pasta $DOCS_PATH já existe"
  read -p "Deseja sobrescrever? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
  fi
fi

echo "📁 Criando estrutura de documentação para: $FEATURE_NAME"
echo ""

# Criar estrutura de pastas
mkdir -p "$DOCS_PATH"/{external-api,internal-implementation,formulas,diagrams}

# Função para criar arquivo com template
create_file() {
  local file_path=$1
  local title=$2
  local description=$3
  
  cat > "$file_path" << EOF
# $FEATURE_NAME - $title

> **Status**: Draft  
> **Última Atualização**: $(date +%Y-%m-%d)  
> **Versão**: 0.1.0  
> **Responsável**: $FEATURE_NAME System  

## Índice

- [Visão Geral](#visão-geral)
- [Referências](#referências)

## Visão Geral

$description

## Referências

- [README](../README.md)
- [DOCUMENTATION_STANDARDS](../../DOCUMENTATION_STANDARDS.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
EOF
  
  echo "  ✅ Criado: $file_path"
}

# Criar README.md
cat > "$DOCS_PATH/README.md" << 'EOF'
# {FEATURE_NAME} Documentation

> **Status**: Draft  
> **Última Atualização**: {DATE}  
> **Versão**: 0.1.0  
> **Responsável**: {FEATURE_NAME} System  

## Índice

- [Visão Geral](#visão-geral)
- [Estrutura da Documentação](#estrutura-da-documentação)
- [Acesso Rápido](#acesso-rápido)
- [Histórico](#histórico)

## Visão Geral

{Descreva aqui o que é este módulo/feature/integração}

## Estrutura da Documentação

### 📡 [external-api/](./external-api/)
Documentação da API externa (se aplicável):
- [01-overview.md](./external-api/01-overview.md) - Visão geral da API
- [02-authentication.md](./external-api/02-authentication.md) - Autenticação
- [03-endpoints.md](./external-api/03-endpoints.md) - Endpoints disponíveis
- [04-rate-limits.md](./external-api/04-rate-limits.md) - Limites e throttling

### 🏗️ [internal-implementation/](./internal-implementation/)
Nossa implementação:
- [01-architecture.md](./internal-implementation/01-architecture.md) - Arquitetura
- [02-best-practices.md](./internal-implementation/02-best-practices.md) - Boas práticas
- [03-migration-guide.md](./internal-implementation/03-migration-guide.md) - Migração
- [04-troubleshooting.md](./internal-implementation/04-troubleshooting.md) - Troubleshooting
- [05-examples.md](./internal-implementation/05-examples.md) - Exemplos práticos

### 🧮 [formulas/](./formulas/)
Fórmulas e cálculos (se aplicável)

### 📊 [diagrams/](./diagrams/)
Diagramas e fluxogramas (se aplicável)

## Acesso Rápido

### Para Desenvolvedores
- [Exemplos de Uso](./internal-implementation/05-examples.md)
- [Troubleshooting](./internal-implementation/04-troubleshooting.md)

### Para Arquitetos
- [Arquitetura](./internal-implementation/01-architecture.md)
- [Diagramas](./diagrams/)

## Histórico

Ver [HISTORY.md](./HISTORY.md) para histórico completo de mudanças.

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
EOF

# Substituir placeholders
sed -i "s/{FEATURE_NAME}/$FEATURE_NAME/g" "$DOCS_PATH/README.md"
sed -i "s/{DATE}/$(date +%Y-%m-%d)/g" "$DOCS_PATH/README.md"

echo "  ✅ Criado: $DOCS_PATH/README.md"

# Criar HISTORY.md
cat > "$DOCS_PATH/HISTORY.md" << 'EOF'
# {FEATURE_NAME} - Histórico

> **Status**: Draft  
> **Última Atualização**: {DATE}  
> **Versão**: 0.1.0  
> **Responsável**: {FEATURE_NAME} System  

## Índice

- [Visão Geral](#visão-geral)
- [Timeline de Mudanças](#timeline-de-mudanças)
- [Versões](#versões)

## Visão Geral

Este documento registra o histórico completo de mudanças do {FEATURE_NAME}.

## Timeline de Mudanças

### {DATE} - Versão Inicial (v0.1.0)

**🚀 Implementação Inicial**

#### Mudanças Principais

1. **Implementação Base**
   - {Descrever implementação inicial}

#### Arquivos Criados

```
{FEATURE_NAME}/
├── {lista de arquivos}
```

## Versões

### v0.1.0 ({DATE}) - Initial Release

**🎯 Release Inicial**

#### Features

- ✅ {Feature 1}
- ✅ {Feature 2}

#### Known Issues

- {Issue 1 se houver}

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
EOF

# Substituir placeholders
sed -i "s/{FEATURE_NAME}/$FEATURE_NAME/g" "$DOCS_PATH/HISTORY.md"
sed -i "s/{DATE}/$(date +%Y-%m-%d)/g" "$DOCS_PATH/HISTORY.md"

echo "  ✅ Criado: $DOCS_PATH/HISTORY.md"

# Criar arquivos da external-api
create_file "$DOCS_PATH/external-api/01-overview.md" "API Overview" \
  "Visão geral da API externa de $FEATURE_NAME. Descreva aqui a API de terceiros que estamos integrando."

create_file "$DOCS_PATH/external-api/02-authentication.md" "Authentication" \
  "Detalhes de autenticação da API de $FEATURE_NAME. Descreva o método de autenticação (API Key, OAuth, HMAC, etc.)."

create_file "$DOCS_PATH/external-api/03-endpoints.md" "Endpoints" \
  "Lista completa de endpoints da API de $FEATURE_NAME. Documente todos os endpoints disponíveis."

create_file "$DOCS_PATH/external-api/04-rate-limits.md" "Rate Limits" \
  "Limites de taxa e throttling da API de $FEATURE_NAME. Documente os limites de requisições."

# Criar arquivos da internal-implementation
create_file "$DOCS_PATH/internal-implementation/01-architecture.md" "Architecture" \
  "Arquitetura interna da integração com $FEATURE_NAME. Descreva componentes, fluxos de dados e padrões de design."

create_file "$DOCS_PATH/internal-implementation/02-best-practices.md" "Best Practices" \
  "Guia de boas práticas para usar $FEATURE_NAME. Inclua exemplos de uso correto e incorreto."

create_file "$DOCS_PATH/internal-implementation/03-migration-guide.md" "Migration Guide" \
  "Guia de migração para $FEATURE_NAME. Documente breaking changes e como migrar de versões antigas."

create_file "$DOCS_PATH/internal-implementation/04-troubleshooting.md" "Troubleshooting" \
  "Resolução de problemas comuns com $FEATURE_NAME. Liste erros conhecidos e suas soluções."

create_file "$DOCS_PATH/internal-implementation/05-examples.md" "Examples" \
  "Exemplos práticos de uso de $FEATURE_NAME. Inclua code snippets testados e funcionais."

echo ""
echo "✅ Estrutura de documentação criada em: $DOCS_PATH"
echo ""
echo "📝 Próximos passos:"
echo "  1. Preencher os templates com conteúdo real"
echo "  2. Adicionar code snippets testados"
echo "  3. Criar diagramas se necessário (em diagrams/)"
echo "  4. Adicionar fórmulas se necessário (em formulas/)"
echo "  5. Atualizar cross-references"
echo "  6. Testar todos os links"
echo "  7. Commitar documentação junto com código"
echo ""
echo "📚 Referência: .system/docs/lnmarkets/ (gold standard)"
echo "📖 Padrões: .system/DOCUMENTATION_STANDARDS.md"

