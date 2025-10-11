# Sistema Universal de Padrões de Documentação

> **Status**: Active  
> **Versão**: 1.0.0  
> **Última Atualização**: 2025-01-09  
> **Responsável**: Sistema de Documentação  
> **Referência Gold Standard**: `.system/docs/lnmarkets/`

## 🎯 Visão Geral

Este documento define os padrões universais de documentação para o projeto Axisor, garantindo consistência, qualidade e manutenibilidade. Todos os módulos, features e integrações devem seguir esta estrutura.

## 📚 Filosofia de Documentação

###

 Princípios Fundamentais

1. **Documentação como Código**
   - Documentação é parte integral do código
   - Versionada no Git como qualquer outro artefato
   - Revisada em code reviews
   - Atualizada em cada mudança relevante

2. **Single Source of Truth**
   - Um único local para cada tipo de informação
   - Evitar duplicação
   - Links para referências cruzadas
   - Clareza sobre fonte autoritativa

3. **Documentação Viva**
   - Atualizada continuamente
   - Sincronizada com código
   - Nunca obsoleta
   - Reflete estado atual do sistema

4. **Separação Clara**
   - **External API**: Documentação de APIs externas (LN Markets, Binance, etc.)
   - **Internal Implementation**: Nossa implementação e integrações
   - Nunca misturar os dois contextos

5. **Exemplos Práticos > Teoria Abstrata**
   - Code snippets testados e funcionais
   - Casos de uso reais
   - Before/After em migrações
   - Troubleshooting baseado em problemas reais

## 🗂️ Estrutura de Pastas Padrão

### Template Universal

Para qualquer módulo/feature/integração:

```
.system/docs/{feature-name}/
├── README.md                      # Índice e visão geral
├── HISTORY.md                     # Histórico de mudanças
├── external-api/                  # API externa (se aplicável)
│   ├── 01-overview.md
│   ├── 02-authentication.md
│   ├── 03-endpoints.md
│   ├── 04-rate-limits.md
│   └── ...
├── internal-implementation/       # Nossa implementação
│   ├── 01-architecture.md
│   ├── 02-best-practices.md
│   ├── 03-migration-guide.md    # Se for refactoring
│   ├── 04-troubleshooting.md
│   ├── 05-examples.md
│   └── ...
├── formulas/                      # Cálculos e algoritmos (se aplicável)
│   ├── 01-{calculation-name}.md
│   └── ...
└── diagrams/                      # Diagramas e fluxogramas
    ├── 01-architecture-diagram.md
    ├── 02-data-flow.md
    └── ...
```

### Quando Criar Cada Pasta

- **external-api/**: Quando integrar com API externa (LN Markets, Stripe, AWS, etc.)
- **internal-implementation/**: Sempre (nossa implementação)
- **formulas/**: Para cálculos complexos (taxas, saldos, PnL, etc.)
- **diagrams/**: Para sistemas com múltiplos componentes ou fluxos complexos

## 📝 Template de Arquivo Markdown

### Estrutura Obrigatória

```markdown
# {Feature Name} - {Document Title}

> **Status**: [Active | Deprecated | Draft]  
> **Última Atualização**: YYYY-MM-DD  
> **Versão**: X.Y.Z  
> **Responsável**: [Nome do Sistema/Módulo]  

## Índice

- [Visão Geral](#visão-geral)
- [Seção 1](#seção-1)
- [Seção 2](#seção-2)
- [Referências](#referências)

## Visão Geral

[Descrição breve em 2-3 linhas sobre o que este documento cobre]

## Seção Principal

[Conteúdo com code snippets testados e funcionais]

### Subsseção

[Detalhes específicos]

## Exemplos Práticos

[Exemplos reais do projeto, não exemplos genéricos]

```typescript
// Exemplo funcional
const service = new ExampleService({
  config: realConfig
});

const result = await service.doSomething();
console.log('Result:', result);
```

## Referências

- [Link para código fonte](../../../backend/src/services/example.service.ts)
- [Documentação relacionada](./02-related-doc.md)
- [API Externa](https://external-api.com/docs)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
```

### Metadados Obrigatórios

Cada documento **DEVE** ter:

| Campo | Descrição | Valores Possíveis |
|-------|-----------|-------------------|
| **Status** | Estado do documento | `Active`, `Deprecated`, `Draft` |
| **Última Atualização** | Data ISO | `YYYY-MM-DD` |
| **Versão** | Versão semântica | `X.Y.Z` |
| **Responsável** | Quem mantém | Nome do sistema/módulo |

## 🏷️ Convenções de Nomenclatura

### Arquivos

```bash
# ✅ CORRETO
01-overview.md
02-authentication.md
03-best-practices.md
balance-calculations.md
architecture-diagram.md

# ❌ ERRADO
Overview.md                    # Não usar PascalCase
auth.md                        # Não abreviar
Best_Practices.md              # Não usar underscore
1-overview.md                  # Usar 01, não 1
```

**Regras:**
- Kebab-case (lowercase com hífens)
- Numeração: `01-`, `02-`, `03-` para ordem lógica
- Nomes descritivos completos (não abreviações)
- Inglês para nomes de arquivos

### Pastas

```bash
# ✅ CORRETO
external-api/
internal-implementation/
formulas/
diagrams/

# ❌ ERRADO
External_API/                  # Não usar underscore
internalImplementation/        # Não usar camelCase
implementacao-interna/         # Inglês preferencial
```

**Regras:**
- Kebab-case
- Inglês preferencial
- Descritivo, não siglas
- Singular quando faz sentido contextual

## 💻 Code Snippets

### Regras para Code Snippets

1. **Sempre com Syntax Highlighting**
   ```typescript
   // ✅ CORRETO
   const example = 'with highlighting';
   ```

2. **Comentários Explicativos Inline**
   ```typescript
   // ✅ CORRETO
   const apiKey = credentials['API Key'];  // Access with bracket notation
   const balance = user.balance ?? 0;      // Fallback para 0 se null
   ```

3. **Exemplos Testados e Funcionais**
   - Nunca inventar exemplos
   - Usar código real do projeto
   - Se simplificar, indicar

4. **Before/After Quando Aplicável**
   ```typescript
   // ❌ ANTES (v1)
   const balance = await service.getUserBalance(credentials);

   // ✅ DEPOIS (v2)
   const user = await service.user.getUser();
   const balance = user.balance;
   ```

5. **Links para Código Fonte Real**
   ```markdown
   Ver implementação completa em:
   - [DashboardDataService](../../../backend/src/services/dashboard-data.service.ts)
   - [LNMarketsAPIv2](../../../backend/src/services/lnmarkets/LNMarketsAPIv2.service.ts)
   ```

## 🔗 Cross-References

### Links Relativos

```markdown
# ✅ CORRETO
Ver [Arquitetura](./internal-implementation/01-architecture.md)
Ver [Troubleshooting](./internal-implementation/04-troubleshooting.md#erro-signature)

# ❌ ERRADO
Ver Arquitetura (sem link)
Ver /home/user/docs/architecture.md (caminho absoluto)
```

### Estrutura de Links

```markdown
# Links Internos ao Módulo
[Best Practices](./internal-implementation/02-best-practices.md)

# Links para Outros Módulos
[WebSocket Architecture](../websocket/internal-implementation/01-architecture.md)

# Links para Código
[DashboardService](../../../backend/src/services/dashboard-data.service.ts)

# Links para Docs Externas
[LN Markets API](https://docs.lnmarkets.com/)
```

## 📊 Tipos de Documentação

### 1. Architecture (01-architecture.md)

**Quando Criar**: Sistemas com múltiplos componentes ou arquitetura não trivial

**Estrutura:**
```markdown
## Visão Geral
## Arquitetura do Sistema
## Componentes Principais
## Fluxo de Dados
## Padrões de Design
## Configuração
## Integração com Outros Sistemas
## Referências
```

**Exemplo**: `.system/docs/lnmarkets/internal-implementation/01-architecture.md`

### 2. Best Practices (02-best-practices.md)

**Quando Criar**: Sempre que houver padrões a seguir

**Estrutura:**
```markdown
## Visão Geral
## Instanciação e Configuração
## Uso em [Contexto 1]
## Uso em [Contexto 2]
## Error Handling
## Performance
## Segurança
## Logging
## Referências
```

**Exemplo**: `.system/docs/lnmarkets/internal-implementation/02-best-practices.md`

### 3. Migration Guide (03-migration-guide.md)

**Quando Criar**: Ao fazer breaking changes ou refactoring

**Estrutura:**
```markdown
## Visão Geral
## Mapeamento de Métodos
## Migração por Tipo de Arquivo
## Exemplos de Migração
## Checklist de Migração
## Troubleshooting
## Referências
```

**Exemplo**: `.system/docs/lnmarkets/internal-implementation/03-migration-guide.md`

### 4. Troubleshooting (04-troubleshooting.md)

**Quando Criar**: Sempre que houver erros comuns ou debugging complexo

**Estrutura:**
```markdown
## Visão Geral
## Erros de [Categoria 1]
## Erros de [Categoria 2]
## Debug Tools
## Logs e Monitoramento
## Referências
```

**Exemplo**: `.system/docs/lnmarkets/internal-implementation/04-troubleshooting.md`

### 5. Examples (05-examples.md)

**Quando Criar**: Sempre (exemplos práticos são essenciais)

**Estrutura:**
```markdown
## Visão Geral
## Configuração Básica
## Exemplos por Domínio
## Exemplos Avançados
## Casos de Uso Completos
## Referências
```

**Exemplo**: `.system/docs/lnmarkets/internal-implementation/05-examples.md`

## ✅ Checklist de Qualidade

Antes de considerar documentação completa:

- [ ] **Metadados**: Status, versão, data, responsável preenchidos
- [ ] **TOC**: Índice presente e atualizado
- [ ] **Code Snippets**: Testados e funcionais
- [ ] **Exemplos Práticos**: Incluídos e reais
- [ ] **Cross-References**: Links funcionando corretamente
- [ ] **Links para Código**: Referências ao código fonte
- [ ] **Typos**: Sem erros ortográficos (usar spell checker)
- [ ] **Markdown Válido**: Sem erros de sintaxe (usar linter)
- [ ] **Diagramas**: Incluídos quando necessário (Mermaid preferencial)
- [ ] **Changelog**: Atualizado em `.system/CHANGELOG.md`

## 🛠️ Tools e Automação

### Ferramentas Recomendadas

1. **markdownlint**: Validação de sintaxe Markdown
2. **markdown-toc**: Geração automática de índices
3. **mermaid**: Diagramas como código
4. **Cursor AI**: Manter consistência e gerar docs

### Script de Criação de Estrutura

Ver [create-docs-structure.sh](#script-create-docs-structuresh) abaixo.

## 📖 Manutenção da Documentação

### Regras de Manutenção

1. **Atualizar docs ANTES de commitar código**
   - Documentação é parte do commit
   - Não deixar docs obsoletas no main

2. **Changelog sempre atualizado**
   - Toda mudança relevante vai no CHANGELOG.md
   - Usar Conventional Commits

3. **Documentação obsoleta → Deprecated**
   - Marcar como `Status: Deprecated`
   - Adicionar link para versão nova
   - Manter por período de transição

4. **Review de docs a cada 3 meses**
   - Validar se ainda está atual
   - Atualizar exemplos
   - Corrigir links quebrados

5. **Remover docs antigas após 6 meses de deprecated**
   - Documentar remoção no HISTORY.md
   - Garantir que não há referências

### Workflow de Atualização

```bash
# 1. Fazer mudança no código
git checkout -b feature/new-feature

# 2. Atualizar documentação relacionada
vim .system/docs/{feature}/internal-implementation/01-architecture.md

# 3. Atualizar CHANGELOG.md
vim .system/CHANGELOG.md

# 4. Commit incluindo docs
git add backend/src/... .system/docs/... .system/CHANGELOG.md
git commit -m "feat(feature): implement new feature

- Implement new feature X
- Update architecture documentation
- Add examples to docs"

# 5. PR com docs incluídas
gh pr create
```

## 🚀 Script: create-docs-structure.sh

### Uso

```bash
# Criar estrutura de documentação para novo módulo
./.system/scripts/create-docs-structure.sh stripe-integration

# Resultado:
# .system/docs/stripe-integration/
# ├── README.md (template)
# ├── HISTORY.md (template)
# ├── external-api/
# │   ├── 01-overview.md (template)
# │   ├── 02-authentication.md (template)
# │   ├── 03-endpoints.md (template)
# │   └── 04-rate-limits.md (template)
# └── internal-implementation/
#     ├── 01-architecture.md (template)
#     ├── 02-best-practices.md (template)
#     ├── 03-migration-guide.md (template)
#     ├── 04-troubleshooting.md (template)
#     └── 05-examples.md (template)
```

### Script Completo

```bash
#!/bin/bash

# Script para criar estrutura de documentação padronizada
# Uso: ./create-docs-structure.sh {feature-name}

set -e

FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
  echo "Erro: Nome do feature é obrigatório"
  echo "Uso: ./create-docs-structure.sh {feature-name}"
  exit 1
fi

DOCS_PATH=".system/docs/$FEATURE_NAME"

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

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
EOF
}

# Criar README.md
create_file "$DOCS_PATH/README.md" "Documentation Index" \
  "Este documento é o índice principal da documentação de $FEATURE_NAME."

# Criar HISTORY.md
create_file "$DOCS_PATH/HISTORY.md" "History" \
  "Histórico de mudanças e refatorações do $FEATURE_NAME."

# Criar arquivos da external-api
create_file "$DOCS_PATH/external-api/01-overview.md" "API Overview" \
  "Visão geral da API externa de $FEATURE_NAME."

create_file "$DOCS_PATH/external-api/02-authentication.md" "Authentication" \
  "Detalhes de autenticação da API de $FEATURE_NAME."

create_file "$DOCS_PATH/external-api/03-endpoints.md" "Endpoints" \
  "Lista completa de endpoints da API de $FEATURE_NAME."

create_file "$DOCS_PATH/external-api/04-rate-limits.md" "Rate Limits" \
  "Limites de taxa e throttling da API de $FEATURE_NAME."

# Criar arquivos da internal-implementation
create_file "$DOCS_PATH/internal-implementation/01-architecture.md" "Architecture" \
  "Arquitetura interna da integração com $FEATURE_NAME."

create_file "$DOCS_PATH/internal-implementation/02-best-practices.md" "Best Practices" \
  "Guia de boas práticas para usar $FEATURE_NAME."

create_file "$DOCS_PATH/internal-implementation/03-migration-guide.md" "Migration Guide" \
  "Guia de migração para $FEATURE_NAME (se aplicável)."

create_file "$DOCS_PATH/internal-implementation/04-troubleshooting.md" "Troubleshooting" \
  "Resolução de problemas comuns com $FEATURE_NAME."

create_file "$DOCS_PATH/internal-implementation/05-examples.md" "Examples" \
  "Exemplos práticos de uso de $FEATURE_NAME."

echo "✅ Estrutura de documentação criada em: $DOCS_PATH"
echo "📝 Próximos passos:"
echo "  1. Preencher os templates com conteúdo real"
echo "  2. Adicionar code snippets testados"
echo "  3. Criar diagramas se necessário"
echo "  4. Atualizar cross-references"
echo "  5. Commitar documentação junto com código"
```

## 🎨 Integração com Cursor/IDEs

### .cursor/rules/documentation.mdc

```markdown
# Regras de Documentação para Cursor AI

Ao criar ou atualizar documentação:

1. **SEMPRE seguir DOCUMENTATION_STANDARDS.md**
   - Estrutura de pastas padrão
   - Template de arquivo obrigatório
   - Metadados completos

2. **Usar .system/docs/lnmarkets/ como referência**
   - Gold standard de documentação
   - Copiar estrutura e estilo
   - Manter mesmo nível de qualidade

3. **Separar external-api de internal-implementation**
   - NUNCA misturar os dois contextos
   - External: API de terceiros
   - Internal: Nossa implementação

4. **Incluir exemplos práticos testados**
   - Code snippets do projeto real
   - Não inventar exemplos
   - Testar antes de documentar

5. **Manter metadados atualizados**
   - Status, versão, data
   - Atualizar em cada mudança
   - Marcar como Deprecated quando obsoleto

6. **Cross-references devem funcionar**
   - Testar links
   - Usar caminhos relativos
   - Atualizar se arquivos movidos

7. **Code snippets devem ter syntax highlighting**
   - Sempre especificar linguagem
   - Comentários explicativos
   - Links para código real

8. **Diagramas quando úteis**
   - Mermaid preferencial
   - ASCII art aceitável
   - Imagens como último recurso

9. **Changelog sempre atualizado**
   - Toda mudança relevante
   - Conventional Commits
   - Link para documentação atualizada

10. **Documentação antes do commit**
    - Nunca commitar código sem docs
    - Docs fazem parte do PR
    - Review inclui documentação
```

## 📚 Exemplos de Aplicação

### Exemplo 1: Módulo Simples (Logging)

```
.system/docs/logging/
├── README.md
├── HISTORY.md
└── internal-implementation/
    ├── 01-architecture.md
    ├── 02-best-practices.md
    ├── 04-troubleshooting.md
    └── 05-examples.md
```

*Não precisa de external-api (sem API externa)*  
*Não precisa de formulas (sem cálculos complexos)*  
*Não precisa de diagrams (arquitetura simples)*

### Exemplo 2: Integração Complexa (Stripe)

```
.system/docs/stripe/
├── README.md
├── HISTORY.md
├── external-api/
│   ├── 01-overview.md
│   ├── 02-authentication.md
│   ├── 03-endpoints.md
│   ├── 04-rate-limits.md
│   └── 05-webhooks.md
├── internal-implementation/
│   ├── 01-architecture.md
│   ├── 02-best-practices.md
│   ├── 03-migration-guide.md
│   ├── 04-troubleshooting.md
│   └── 05-examples.md
├── formulas/
│   ├── 01-pricing-calculations.md
│   └── 02-tax-calculations.md
└── diagrams/
    ├── 01-architecture-diagram.md
    ├── 02-payment-flow.md
    └── 03-webhook-flow.md
```

*Possui external-api (Stripe API)*  
*Possui formulas (cálculos de pricing e tax)*  
*Possui diagrams (fluxos complexos)*

### Exemplo 3: Feature Interna (Cache System)

```
.system/docs/cache-system/
├── README.md
├── HISTORY.md
├── internal-implementation/
│   ├── 01-architecture.md
│   ├── 02-best-practices.md
│   ├── 04-troubleshooting.md
│   └── 05-examples.md
└── diagrams/
    ├── 01-architecture-diagram.md
    └── 02-invalidation-flow.md
```

*Não precisa de external-api (sistema interno)*  
*Não precisa de formulas (sem cálculos)*  
*Possui diagrams (fluxos de invalidação complexos)*

## 🔍 Referência Gold Standard

O exemplo perfeito de documentação seguindo estes padrões:

**`.system/docs/lnmarkets/`**

Use como referência para:
- Estrutura de pastas
- Template de arquivos
- Qualidade de conteúdo
- Code snippets
- Cross-references
- Diagramas Mermaid
- Metadados completos
- Exemplos práticos

## 📋 Checklist Rápido

Ao criar documentação de um novo módulo:

- [ ] Usar `create-docs-structure.sh {feature-name}`
- [ ] Preencher README.md com índice
- [ ] Decidir se precisa external-api/, formulas/, diagrams/
- [ ] Preencher internal-implementation/ (mínimo: 01, 02, 04, 05)
- [ ] Adicionar code snippets testados
- [ ] Criar diagramas se necessário
- [ ] Adicionar cross-references
- [ ] Atualizar CHANGELOG.md
- [ ] Verificar markdown válido (markdownlint)
- [ ] Commitar junto com código

## 🚨 Avisos Importantes

### ❌ NÃO Fazer

1. **Documentação Genérica**
   - Não copiar exemplos de outros projetos
   - Usar código real do Axisor

2. **Documentação Desatualizada**
   - Não deixar docs antigas no main
   - Atualizar ou marcar como Deprecated

3. **Documentação Duplicada**
   - Uma fonte de verdade por informação
   - Usar links para evitar duplicação

4. **Documentação Sem Exemplos**
   - Sempre incluir código funcionál
   - Exemplos são obrigatórios

### ✅ SEMPRE Fazer

1. **Documentar ANTES de commitar**
2. **Testar code snippets**
3. **Atualizar CHANGELOG.md**
4. **Seguir DOCUMENTATION_STANDARDS.md**
5. **Usar .system/docs/lnmarkets/ como referência**

---

**Versão**: 1.0.0  
**Última Atualização**: 2025-01-09  
**Referência Gold Standard**: `.system/docs/lnmarkets/`  
**Responsável**: Sistema de Documentação Axisor

