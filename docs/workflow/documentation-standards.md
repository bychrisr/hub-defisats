---
title: "Documentation Standards"
version: "1.0.0"
created: "2025-10-23"
updated: "2025-10-23"
author: "Documentation Sync Agent"
status: "active"
last_synced: "2025-10-23T12:12:05.350Z"
source_of_truth: "/docs"
---

# Documentation Standards

## Overview

This document outlines documentation standards and best practices for the Axisor project. It covers documentation structure, writing guidelines, maintenance procedures, and quality standards to ensure consistent and high-quality documentation.

## Documentation Principles

### Core Documentation Principles

#### Documentation Fundamentals
```typescript
// Documentation Principles
interface DocumentationPrinciples {
  clarity: {
    clear_language: "Use clear and concise language";
    simple_structure: "Simple and logical structure";
    consistent_format: "Consistent formatting and style";
    appropriate_audience: "Write for the appropriate audience";
  };
  completeness: {
    comprehensive_coverage: "Comprehensive coverage of topics";
    detailed_examples: "Detailed examples and use cases";
    troubleshooting: "Troubleshooting and common issues";
    references: "References and cross-references";
  };
  accuracy: {
    up_to_date: "Keep documentation up to date";
    verified_content: "Verify content accuracy";
    tested_examples: "Test all code examples";
    reviewed_content: "Review content for accuracy";
  };
  usability: {
    easy_navigation: "Easy navigation and search";
    logical_organization: "Logical organization of content";
    quick_reference: "Quick reference sections";
    user_focused: "User-focused documentation";
  };
}
```

#### Documentation Objectives
- **Knowledge Transfer**: Transfer knowledge effectively
- **User Support**: Support users and developers
- **Process Documentation**: Document processes and procedures
- **Quality Assurance**: Ensure documentation quality
- **Maintenance**: Maintain documentation over time

### Documentation Structure

#### Documentation Hierarchy
```typescript
// Documentation Structure
interface DocumentationStructure {
  overview: {
    project_overview: "Project overview and introduction";
    getting_started: "Getting started guide";
    quick_start: "Quick start tutorial";
    architecture: "System architecture overview";
  };
  user_guides: {
    user_manual: "User manual and guides";
    tutorials: "Step-by-step tutorials";
    examples: "Examples and use cases";
    troubleshooting: "Troubleshooting guides";
  };
  developer_guides: {
    api_reference: "API reference documentation";
    development_guide: "Development guide";
    contribution_guide: "Contribution guidelines";
    testing_guide: "Testing guide";
  };
  operations: {
    deployment_guide: "Deployment guide";
    configuration: "Configuration documentation";
    monitoring: "Monitoring and maintenance";
    troubleshooting: "Operations troubleshooting";
  };
}
```

#### Documentation Types
```typescript
// Documentation Types
interface DocumentationTypes {
  technical: {
    api_docs: "API documentation";
    code_docs: "Code documentation";
    architecture_docs: "Architecture documentation";
    design_docs: "Design documentation";
  };
  user_facing: {
    user_guides: "User guides and manuals";
    tutorials: "Tutorials and walkthroughs";
    faqs: "Frequently asked questions";
    troubleshooting: "Troubleshooting guides";
  };
  process: {
    workflows: "Process workflows";
    procedures: "Standard procedures";
    guidelines: "Guidelines and best practices";
    templates: "Documentation templates";
  };
  reference: {
    glossaries: "Glossaries and terminology";
    indexes: "Indexes and cross-references";
    changelogs: "Change logs and version history";
    resources: "Additional resources and links";
  };
}
```

## Writing Guidelines

### Writing Standards

#### Writing Best Practices
```typescript
// Writing Best Practices
interface WritingBestPractices {
  language: {
    clear_concise: "Clear and concise language";
    active_voice: "Use active voice when possible";
    simple_sentences: "Simple and direct sentences";
    consistent_terminology: "Consistent terminology and naming";
  };
  structure: {
    logical_flow: "Logical flow and organization";
    headings: "Clear and descriptive headings";
    paragraphs: "Short and focused paragraphs";
    lists: "Use lists for clarity";
  };
  formatting: {
    consistent_style: "Consistent formatting style";
    code_blocks: "Properly formatted code blocks";
    links: "Meaningful and descriptive links";
    images: "Relevant and clear images";
  };
  content: {
    accurate: "Accurate and up-to-date content";
    complete: "Complete and comprehensive coverage";
    examples: "Relevant examples and use cases";
    troubleshooting: "Troubleshooting and common issues";
  };
}
```

#### Writing Style Guide
```typescript
// Writing Style Guide
interface WritingStyleGuide {
  tone: {
    professional: "Professional and authoritative tone";
    helpful: "Helpful and supportive";
    concise: "Concise and to the point";
    accessible: "Accessible to target audience";
  };
  voice: {
    active_voice: "Use active voice when possible";
    second_person: "Use second person (you) for user guides";
    third_person: "Use third person for technical documentation";
    consistent_voice: "Consistent voice throughout";
  };
  terminology: {
    consistent_terms: "Consistent terminology";
    technical_terms: "Define technical terms";
    abbreviations: "Define abbreviations on first use";
    jargon: "Minimize jargon and technical language";
  };
  formatting: {
    headings: "Use descriptive headings";
    lists: "Use numbered lists for procedures";
    code: "Format code blocks properly";
    emphasis: "Use emphasis sparingly and effectively";
  };
}
```

### Content Guidelines

#### Content Standards
```typescript
// Content Standards
interface ContentStandards {
  accuracy: {
    verified_facts: "Verify all facts and information";
    tested_examples: "Test all code examples";
    current_information: "Keep information current";
    reviewed_content: "Review content for accuracy";
  };
  completeness: {
    comprehensive_coverage: "Comprehensive coverage of topics";
    detailed_examples: "Detailed examples and use cases";
    edge_cases: "Cover edge cases and exceptions";
    troubleshooting: "Include troubleshooting information";
  };
  clarity: {
    clear_explanations: "Clear explanations and descriptions";
    logical_organization: "Logical organization of content";
    appropriate_detail: "Appropriate level of detail";
    user_focused: "User-focused content";
  };
  consistency: {
    consistent_style: "Consistent writing style";
    consistent_format: "Consistent formatting";
    consistent_terminology: "Consistent terminology";
    consistent_structure: "Consistent document structure";
  };
}
```

#### Content Types
```typescript
// Content Types
interface ContentTypes {
  procedural: {
    step_by_step: "Step-by-step procedures";
    clear_instructions: "Clear and detailed instructions";
    expected_results: "Expected results and outcomes";
    troubleshooting: "Troubleshooting and common issues";
  };
  descriptive: {
    overview: "Overview and introduction";
    concepts: "Concepts and principles";
    features: "Features and capabilities";
    benefits: "Benefits and advantages";
  };
  reference: {
    api_reference: "API reference documentation";
    configuration: "Configuration options";
    parameters: "Parameters and options";
    examples: "Code examples and samples";
  };
  troubleshooting: {
    common_issues: "Common issues and solutions";
    error_messages: "Error messages and resolutions";
    diagnostics: "Diagnostic procedures";
    escalation: "Escalation procedures";
  };
}
```

## Documentation Maintenance

### Maintenance Procedures

#### Documentation Lifecycle
```typescript
// Documentation Lifecycle
interface DocumentationLifecycle {
  creation: {
    planning: "Documentation planning and design";
    writing: "Content creation and writing";
    review: "Content review and validation";
    approval: "Content approval and sign-off";
  };
  maintenance: {
    updates: "Regular content updates";
    reviews: "Periodic content reviews";
    improvements: "Content improvements and enhancements";
    versioning: "Version control and change management";
  };
  retirement: {
    deprecation: "Content deprecation notices";
    archiving: "Content archiving and storage";
    replacement: "Content replacement and migration";
    cleanup: "Content cleanup and removal";
  };
}
```

#### Maintenance Best Practices
```typescript
// Maintenance Best Practices
interface MaintenanceBestPractices {
  regular_updates: {
    scheduled_reviews: "Scheduled content reviews";
    update_triggers: "Update triggers and events";
    change_management: "Change management processes";
    version_control: "Version control and tracking";
  };
  quality_assurance: {
    accuracy_checks: "Regular accuracy checks";
    completeness_reviews: "Completeness reviews";
    usability_testing: "Usability testing and feedback";
    user_feedback: "User feedback and suggestions";
  };
  continuous_improvement: {
    feedback_analysis: "Feedback analysis and action";
    process_improvement: "Process improvement initiatives";
    tool_updates: "Tool and technology updates";
    best_practices: "Best practices adoption";
  };
}
```

### Quality Assurance

#### Quality Standards
```typescript
// Quality Standards
interface QualityStandards {
  accuracy: {
    factual_accuracy: "Factual accuracy and correctness";
    technical_accuracy: "Technical accuracy and precision";
    tested_examples: "Tested and verified examples";
    reviewed_content: "Peer reviewed content";
  };
  completeness: {
    comprehensive_coverage: "Comprehensive topic coverage";
    detailed_examples: "Detailed examples and use cases";
    troubleshooting: "Troubleshooting and common issues";
    references: "Complete references and cross-references";
  };
  clarity: {
    clear_language: "Clear and understandable language";
    logical_organization: "Logical content organization";
    appropriate_detail: "Appropriate level of detail";
    user_focused: "User-focused content";
  };
  consistency: {
    consistent_style: "Consistent writing style";
    consistent_format: "Consistent formatting";
    consistent_terminology: "Consistent terminology";
    consistent_structure: "Consistent document structure";
  };
}
```

#### Quality Assurance Process
```typescript
// Quality Assurance Process
interface QualityAssuranceProcess {
  review_process: {
    peer_review: "Peer review process";
    technical_review: "Technical review and validation";
    editorial_review: "Editorial review and editing";
    final_approval: "Final approval and sign-off";
  };
  testing: {
    accuracy_testing: "Accuracy testing and verification";
    usability_testing: "Usability testing and feedback";
    user_testing: "User testing and validation";
    feedback_integration: "Feedback integration and action";
  };
  continuous_improvement: {
    feedback_analysis: "Feedback analysis and action";
    process_improvement: "Process improvement initiatives";
    tool_updates: "Tool and technology updates";
    best_practices: "Best practices adoption";
  };
}
```

## Documentation Tools

### Documentation Tools

#### Documentation Platforms
```typescript
// Documentation Platforms
interface DocumentationPlatforms {
  static_sites: {
    docusaurus: "Docusaurus for React-based documentation";
    gitbook: "GitBook for collaborative documentation";
    mkdocs: "MkDocs for Python-based documentation";
    vuepress: "VuePress for Vue-based documentation";
  };
  wikis: {
    confluence: "Confluence for team wikis";
    notion: "Notion for collaborative documentation";
    mediawiki: "MediaWiki for open-source wikis";
    github_wiki: "GitHub wikis for code documentation";
  };
  publishing: {
    github_pages: "GitHub Pages for static site hosting";
    netlify: "Netlify for static site hosting";
    vercel: "Vercel for static site hosting";
    aws_s3: "AWS S3 for static site hosting";
  };
}
```

#### Documentation Tools
```typescript
// Documentation Tools
interface DocumentationTools {
  writing: {
    markdown: "Markdown for content creation";
    asciidoc: "AsciiDoc for technical documentation";
    restructured_text: "reStructuredText for Python documentation";
    sphinx: "Sphinx for Python documentation";
  };
  editing: {
    vs_code: "VS Code with documentation extensions";
    typora: "Typora for Markdown editing";
    notion: "Notion for collaborative editing";
    gitbook: "GitBook for collaborative editing";
  };
  review: {
    github: "GitHub for code review and collaboration";
    gitlab: "GitLab for code review and collaboration";
    pull_requests: "Pull requests for content review";
    comments: "Inline comments and feedback";
  };
  publishing: {
    ci_cd: "CI/CD for automated publishing";
    version_control: "Version control and change tracking";
    deployment: "Automated deployment and updates";
    monitoring: "Documentation monitoring and analytics";
  };
}
```

### Documentation Automation

#### Automation Tools
```typescript
// Documentation Automation
interface DocumentationAutomation {
  generation: {
    api_docs: "Automated API documentation generation";
    code_docs: "Automated code documentation generation";
    changelogs: "Automated changelog generation";
    reports: "Automated report generation";
  };
  validation: {
    link_checking: "Automated link checking";
    spell_checking: "Automated spell checking";
    style_checking: "Automated style checking";
    format_validation: "Automated format validation";
  };
  deployment: {
    ci_cd: "CI/CD for documentation deployment";
    versioning: "Automated versioning and releases";
    publishing: "Automated publishing and updates";
    monitoring: "Automated monitoring and alerts";
  };
}
```

#### Automation Examples
```yaml
# GitHub Actions for Documentation
name: Documentation CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['docs/**']
  pull_request:
    branches: [main, develop]
    paths: ['docs/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Validate documentation
        run: |
          npm run docs:validate
          npm run docs:lint
          npm run docs:test

  build:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build documentation
        run: npm run docs:build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/build
```

## Documentation Standards

### Standards Implementation

#### Documentation Standards
```typescript
// Documentation Standards
interface DocumentationStandards {
  structure: {
    consistent_headers: "Consistent header structure";
    logical_organization: "Logical content organization";
    navigation: "Clear navigation and structure";
    cross_references: "Proper cross-references";
  };
  content: {
    accuracy: "Accurate and up-to-date content";
    completeness: "Complete and comprehensive coverage";
    clarity: "Clear and understandable language";
    consistency: "Consistent style and format";
  };
  formatting: {
    consistent_style: "Consistent formatting style";
    code_blocks: "Properly formatted code blocks";
    links: "Meaningful and descriptive links";
    images: "Relevant and clear images";
  };
  maintenance: {
    regular_updates: "Regular content updates";
    version_control: "Version control and change tracking";
    review_process: "Content review and approval";
    quality_assurance: "Quality assurance processes";
  };
}
```

#### Standards Compliance
```typescript
// Standards Compliance
interface StandardsCompliance {
  compliance_checking: {
    automated_checks: "Automated compliance checking";
    manual_reviews: "Manual compliance reviews";
    quality_gates: "Quality gates and thresholds";
    reporting: "Compliance reporting and tracking";
  };
  enforcement: {
    process_enforcement: "Process enforcement and controls";
    tool_enforcement: "Tool-based enforcement";
    review_enforcement: "Review-based enforcement";
    training: "Training and education";
  };
  improvement: {
    feedback_analysis: "Feedback analysis and action";
    process_improvement: "Process improvement initiatives";
    tool_updates: "Tool and technology updates";
    best_practices: "Best practices adoption";
  };
}
```

## Conclusion

This documentation standards guide provides a comprehensive approach to creating and maintaining high-quality documentation for the Axisor project. By following the guidelines and best practices outlined in this document, the team can ensure consistent, accurate, and useful documentation.

Key principles for effective documentation:
- **Clarity**: Write clear and understandable content
- **Completeness**: Provide comprehensive coverage
- **Accuracy**: Ensure accurate and up-to-date information
- **Consistency**: Maintain consistent style and format
- **Usability**: Focus on user needs and usability

Remember that good documentation is essential for project success and requires ongoing attention, maintenance, and improvement.


---

## Conteúdo Adicional

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

