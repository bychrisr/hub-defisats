# 🗂️ Guia de Organização de Projetos - Axisor

## 📋 Visão Geral

Este documento explica como organizar um projeto de software de forma profissional, hierárquica e escalável, baseado na estrutura implementada no Axisor. A organização segue princípios de **Clean Architecture** e **Domain-Driven Design**.

## 🎯 Princípios da Organização

### 1. **Separação por Responsabilidade**
- Cada pasta tem uma responsabilidade específica
- Arquivos relacionados ficam agrupados
- Fácil localização e manutenção

### 2. **Hierarquia Lógica**
- Estrutura de pastas intuitiva
- Nomenclatura consistente
- Padrão profissional

### 3. **Escalabilidade**
- Estrutura preparada para crescimento
- Fácil adição de novos componentes
- Manutenção simplificada

## 🏗️ Estrutura Padrão Recomendada

```
projeto/
├── 📁 src/                        # Código fonte principal
│   ├── 📁 backend/                # API/Backend
│   ├── 📁 frontend/               # Interface/Frontend
│   └── 📁 shared/                 # Código compartilhado
├── 📁 scripts/                    # Scripts organizados por categoria
│   ├── 📁 admin/                  # Scripts de administração
│   ├── 📁 deploy/                 # Scripts de deploy
│   ├── 📁 dev/                    # Scripts de desenvolvimento
│   └── 📁 test/                   # Scripts de teste
├── 📁 config/                     # Configurações centralizadas
│   ├── 📁 docker/                 # Docker Compose files
│   ├── 📁 env/                    # Arquivos de ambiente
│   └── 📁 k8s/                    # Configurações Kubernetes
├── 📁 docs/                       # Documentação do projeto
│   ├── 📁 api/                    # Documentação da API
│   ├── 📁 architecture/           # Documentação arquitetural
│   └── 📁 security/               # Documentação de segurança
├── 📁 tools/                      # Ferramentas e utilitários
├── 📁 monitoring/                 # Configurações de monitoramento
├── 📁 infra/                      # Infraestrutura
├── 📁 tests/                      # Testes organizados
├── 📁 logs/                       # Logs do sistema
├── 📁 backups/                    # Backups
├── 📄 README.md                   # Documentação principal
├── 📄 .gitignore                  # Configuração Git
└── 📄 package.json                # Dependências (se aplicável)
```

## 📝 Passo a Passo da Organização

### **Passo 1: Análise do Projeto Atual**

```bash
# 1. Listar todos os arquivos na raiz
ls -la

# 2. Identificar tipos de arquivos
find . -maxdepth 1 -type f -name "*.sh" -o -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.env*" -o -name "Dockerfile*"

# 3. Identificar pastas existentes
find . -maxdepth 1 -type d | grep -v node_modules | grep -v .git
```

### **Passo 2: Criação da Estrutura Base**

```bash
# Criar pastas principais
mkdir -p scripts/{admin,deploy,dev,test}
mkdir -p config/{docker,env,k8s}
mkdir -p docs/{api,architecture,security}
mkdir -p tools
mkdir -p monitoring
mkdir -p infra
mkdir -p tests
mkdir -p logs
mkdir -p backups
```

### **Passo 3: Categorização de Arquivos**

#### **Scripts (`.sh`, `.js` executáveis)**
```bash
# Scripts de administração
mv create-admin.js scripts/admin/
mv create-super-admin.sh scripts/admin/

# Scripts de deploy
mv deploy-prod.sh scripts/deploy/
mv setup-staging.sh scripts/deploy/

# Scripts de desenvolvimento
mv setup-dev.sh scripts/dev/
mv create-dev-user.sh scripts/dev/
mv fix-*.sh scripts/dev/

# Scripts de teste
mv test-*.sh scripts/test/
mv test-*.js scripts/test/
```

#### **Configurações (`.env*`, `docker-compose.*`, `*.yml`)**
```bash
# Arquivos de ambiente
mv .env.* config/env/
mv env.* config/env/

# Docker Compose
mv docker-compose.*.yml config/docker/

# Kubernetes
mv *.yaml config/k8s/
```

#### **Ferramentas e Utilitários**
```bash
# Ferramentas de debug e manutenção
mv debug-*.sh tools/
mv fix-*.sh tools/
```

#### **Configurações do Projeto**
```bash
# Configurações específicas
mv playwright.config.ts config/
mv jest.config.js config/
mv tsconfig.json config/
```

### **Passo 4: Organização de Documentação**

```bash
# Documentação principal
mv README.md docs/
mv CHANGELOG.md docs/
mv CONTRIBUTING.md docs/

# Documentação técnica
mv docs/api/ docs/api/
mv docs/architecture/ docs/architecture/
mv docs/security/ docs/security/
```

### **Passo 5: Criação de READMEs Explicativos**

#### **README Principal (`README.md`)**
```markdown
# Nome do Projeto

## 🎯 Visão Geral
Breve descrição do projeto

## 🏗️ Estrutura do Projeto
Explicação da organização de pastas

## 🚀 Início Rápido
Como executar o projeto

## 📚 Documentação
Links para documentação específica

## 🤝 Contribuição
Como contribuir com o projeto
```

#### **README de Scripts (`scripts/README.md`)**
```markdown
# Scripts do Projeto

## 📁 Estrutura
Explicação das categorias de scripts

## 🔧 Scripts de Administração
Lista e descrição dos scripts admin

## 🚀 Scripts de Deploy
Lista e descrição dos scripts de deploy

## 🛠️ Scripts de Desenvolvimento
Lista e descrição dos scripts de dev

## 🧪 Scripts de Teste
Lista e descrição dos scripts de teste
```

#### **README de Configurações (`config/README.md`)**
```markdown
# Configurações do Projeto

## 📁 Estrutura
Explicação das categorias de configuração

## 🐳 Docker Compose
Configurações de containers

## 🌍 Variáveis de Ambiente
Configurações de ambiente

## 🔧 Configuração Rápida
Como configurar o projeto
```

## 🎨 Padrões de Nomenclatura

### **Pastas**
- **kebab-case**: `user-management`, `api-gateway`
- **Singular**: `script`, `config`, `tool`
- **Plural**: `scripts`, `configs`, `tools`

### **Arquivos**
- **kebab-case**: `create-user.sh`, `deploy-prod.sh`
- **Ponto separador**: `docker-compose.dev.yml`
- **Underscore**: `env.production.example`

### **Scripts**
- **Prefixo por categoria**: `admin-`, `deploy-`, `dev-`, `test-`
- **Sufixo por tipo**: `.sh`, `.js`, `.py`
- **Descrição clara**: `create-admin-user.sh`

## 🔧 Ferramentas de Organização

### **Scripts de Automação**

#### **`organize-project.sh`**
```bash
#!/bin/bash
# Script para organizar projeto automaticamente

echo "🗂️ Organizando projeto..."

# Criar estrutura
mkdir -p scripts/{admin,deploy,dev,test}
mkdir -p config/{docker,env,k8s}
mkdir -p docs/{api,architecture,security}
mkdir -p tools

# Mover scripts
mv create-admin.js scripts/admin/ 2>/dev/null
mv create-super-admin.sh scripts/admin/ 2>/dev/null
mv deploy-*.sh scripts/deploy/ 2>/dev/null
mv setup-*.sh scripts/dev/ 2>/dev/null
mv test-*.sh scripts/test/ 2>/dev/null
mv test-*.js scripts/test/ 2>/dev/null

# Mover configurações
mv .env.* config/env/ 2>/dev/null
mv env.* config/env/ 2>/dev/null
mv docker-compose.*.yml config/docker/ 2>/dev/null

# Mover ferramentas
mv debug-*.sh tools/ 2>/dev/null
mv fix-*.sh tools/ 2>/dev/null

echo "✅ Projeto organizado com sucesso!"
```

#### **`validate-structure.sh`**
```bash
#!/bin/bash
# Script para validar estrutura do projeto

echo "🔍 Validando estrutura do projeto..."

# Verificar pastas obrigatórias
required_dirs=("scripts" "config" "docs" "tools")
for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Pasta obrigatória não encontrada: $dir"
        exit 1
    fi
done

# Verificar READMEs
required_readmes=("README.md" "scripts/README.md" "config/README.md")
for readme in "${required_readmes[@]}"; do
    if [ ! -f "$readme" ]; then
        echo "❌ README obrigatório não encontrado: $readme"
        exit 1
    fi
done

echo "✅ Estrutura validada com sucesso!"
```

## 📊 Checklist de Organização

### **Antes da Organização**
- [ ] Backup do projeto atual
- [ ] Análise de arquivos existentes
- [ ] Identificação de categorias
- [ ] Planejamento da estrutura

### **Durante a Organização**
- [ ] Criação de pastas base
- [ ] Movimentação de arquivos
- [ ] Criação de READMEs
- [ ] Atualização de referências

### **Após a Organização**
- [ ] Validação da estrutura
- [ ] Teste de scripts
- [ ] Atualização de documentação
- [ ] Commit das mudanças

## 🚨 Cuidados Importantes

### **1. Backup Antes de Organizar**
```bash
# Criar backup completo
cp -r projeto projeto-backup-$(date +%Y%m%d)

# Ou usar Git
git add -A
git commit -m "Backup antes da organização"
```

### **2. Atualizar Referências**
```bash
# Buscar referências quebradas
grep -r "old-path" . --exclude-dir=node_modules --exclude-dir=.git

# Atualizar imports
find . -name "*.js" -o -name "*.ts" -o -name "*.json" | xargs sed -i 's/old-path/new-path/g'
```

### **3. Testar Após Organização**
```bash
# Testar scripts
./scripts/dev/setup-dev.sh
./scripts/test/test-local.sh

# Testar configurações
docker compose -f config/docker/docker-compose.dev.yml up -d
```

## 🎯 Benefícios da Organização

### **Para Desenvolvedores**
- **Localização rápida** de arquivos
- **Manutenção simplificada** do código
- **Onboarding** mais fácil para novos membros
- **Padrão consistente** em todo o projeto

### **Para o Projeto**
- **Escalabilidade** preparada para crescimento
- **Documentação** organizada e acessível
- **Configurações** centralizadas e versionadas
- **Scripts** categorizados e reutilizáveis

### **Para a Equipe**
- **Colaboração** mais eficiente
- **Padrões** claros e definidos
- **Manutenção** distribuída e organizada
- **Qualidade** de código melhorada

## 📚 Exemplos de Uso

### **Projeto Node.js + React**
```
projeto/
├── src/
│   ├── backend/          # API Node.js
│   ├── frontend/         # React App
│   └── shared/           # Código compartilhado
├── scripts/
│   ├── admin/            # Scripts de admin
│   ├── deploy/           # Deploy scripts
│   ├── dev/              # Dev scripts
│   └── test/             # Test scripts
├── config/
│   ├── docker/           # Docker configs
│   └── env/              # Environment files
└── docs/                 # Documentation
```

### **Projeto Python + Django**
```
projeto/
├── src/
│   ├── api/              # Django API
│   ├── web/              # Django Web
│   └── shared/           # Shared code
├── scripts/
│   ├── admin/            # Admin scripts
│   ├── deploy/           # Deploy scripts
│   ├── dev/              # Dev scripts
│   └── test/             # Test scripts
├── config/
│   ├── docker/           # Docker configs
│   └── env/              # Environment files
└── docs/                 # Documentation
```

### **Projeto Microservices**
```
projeto/
├── services/
│   ├── user-service/     # User microservice
│   ├── order-service/    # Order microservice
│   └── payment-service/  # Payment microservice
├── scripts/
│   ├── admin/            # Admin scripts
│   ├── deploy/           # Deploy scripts
│   ├── dev/              # Dev scripts
│   └── test/             # Test scripts
├── config/
│   ├── docker/           # Docker configs
│   └── env/              # Environment files
└── docs/                 # Documentation
```

## 🔄 Manutenção da Organização

### **Revisão Mensal**
- Verificar se novos arquivos estão na pasta correta
- Atualizar documentação se necessário
- Reorganizar se a estrutura não estiver clara

### **Revisão Trimestral**
- Avaliar se a estrutura ainda faz sentido
- Considerar refatoração se necessário
- Atualizar padrões e convenções

### **Revisão Anual**
- Revisão completa da organização
- Atualização de documentação
- Implementação de melhorias

## 📞 Suporte e Dúvidas

Para dúvidas sobre organização de projetos:
1. Consultar este documento
2. Verificar exemplos na pasta `examples/`
3. Abrir issue no repositório
4. Contatar: dev@axisor.com

---

**Última atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento  
**Versão**: 1.0.0

---

*Este guia foi criado baseado na experiência de organização do Axisor e pode ser adaptado para qualquer tipo de projeto de software.*
