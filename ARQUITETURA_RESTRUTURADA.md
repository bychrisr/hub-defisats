# Arquitetura Reestruturada - Hub-defisats

## Visão Geral

A arquitetura foi reestruturada para separar claramente os ambientes de desenvolvimento, staging e produção, com diferentes tecnologias e configurações para cada um.

## Estrutura de Ambientes

### 🖥️ **Desenvolvimento (Local)**
- **Localização**: PC do desenvolvedor
- **Tecnologia**: Docker Compose
- **Portas**: 
  - Frontend: `localhost:13000`
  - Backend: `localhost:13010`
  - PostgreSQL: `localhost:5432`
  - Redis: `localhost:6379`

### 🧪 **Staging**
- **Localização**: Servidor `defisats.site`
- **Tecnologia**: Docker Compose
- **Domínio**: `staging.defisats.site`
- **Portas**:
  - Frontend: `localhost:13001`
  - Backend: `localhost:13011`
  - PostgreSQL: `localhost:5433`
  - Redis: `localhost:6380`

### 🚀 **Produção**
- **Localização**: Servidor `defisats.site`
- **Tecnologia**: Instalação Nativa (Node.js + PM2)
- **Domínio**: `defisats.site`
- **Portas**:
  - Frontend: `localhost:3001`
  - Backend: `localhost:3000`
  - PostgreSQL: `localhost:5432`
  - Redis: `localhost:6379`

## Estrutura de Diretórios no Servidor

```
/home/ubuntu/
├── apps/
│   ├── hub-defisats/                    # Desenvolvimento (Docker)
│   ├── hub-defisats-staging/            # Staging (Docker)
│   └── hub-defisats-production/         # Produção (Nativo)
├── proxy/                               # Proxy Global
│   ├── conf.d/
│   │   ├── staging.conf                 # Configuração Staging
│   │   └── production.conf              # Configuração Produção
│   └── certs/                           # Certificados SSL
└── /var/www/hub-defisats/               # Aplicação Produção (Nativo)
    ├── backend/
    ├── frontend/
    └── ecosystem.config.js
```

## Configurações por Ambiente

### Staging (Docker)

**Docker Compose**: `docker-compose.staging.yml`
```yaml
services:
  postgres-staging:
    ports: ["5433:5432"]
  redis-staging:
    ports: ["6380:6379"]
  backend-staging:
    ports: ["13011:13010"]
  frontend-staging:
    ports: ["13001:13000"]
  nginx-staging:
    ports: ["8080:80"]
```

**Variáveis de Ambiente**: `.env.staging`
- `DATABASE_URL`: PostgreSQL na porta 5433
- `REDIS_URL`: Redis na porta 6380
- `CORS_ORIGIN`: `http://localhost:13001,https://staging.defisats.site`

### Produção (Nativo)

**PM2 Configuration**: `ecosystem.config.js`
```javascript
apps: [
  { name: 'hub-defisats-backend', script: './backend/dist/index.js' },
  { name: 'hub-defisats-margin-monitor', script: './backend/dist/workers/margin-monitor.js' },
  { name: 'hub-defisats-automation-executor', script: './backend/dist/workers/automation-executor.js' },
  { name: 'hub-defisats-notification-worker', script: './backend/dist/workers/notification-worker.js' },
  { name: 'hub-defisats-payment-validator', script: './backend/dist/workers/payment-validator.js' }
]
```

**Variáveis de Ambiente**: `.env.production`
- `DATABASE_URL`: PostgreSQL na porta 5432
- `REDIS_URL`: Redis na porta 6379
- `CORS_ORIGIN`: `https://defisats.site,https://staging.defisats.site`

## Proxy Global

O proxy global (`/home/ubuntu/proxy/`) roteia as requisições baseado no domínio:

- **`staging.defisats.site`** → Containers Docker (staging)
- **`defisats.site`** → Aplicação Nativa (produção)

### Configuração do Proxy

**Staging** (`staging.conf`):
```nginx
upstream staging_backend {
    server hub-defisats-nginx-staging:80;
}
```

**Produção** (`production.conf`):
```nginx
upstream production_backend {
    server 127.0.0.1:3000;
}
upstream production_frontend {
    server 127.0.0.1:3001;
}
```

## Fluxo de Deploy com GitHub Actions

### 🚀 **Deploy Automático (Staging)**
- **Trigger**: Push para branch `develop`
- **Workflow**: `.github/workflows/staging.yml`
- **Processo**: Testes → Deploy → Health Check
- **URL**: `https://staging.defisats.site`

### 🚀 **Deploy Manual (Produção)**
- **Trigger**: Push para branch `main` ou Workflow Dispatch
- **Workflow**: `.github/workflows/production.yml`
- **Processo**: Testes → Backup → Deploy → Health Check
- **URL**: `https://defisats.site`

### 🧪 **Validação de Pull Request**
- **Trigger**: Pull Request para `main` ou `develop`
- **Workflow**: `.github/workflows/pr-validation.yml`
- **Processo**: Lint → Testes → Type Check → Security Audit → Build

## Scripts de Deploy (Manual)

### Staging
```bash
cd /home/ubuntu/apps/hub-defisats-staging
./scripts/deploy-staging-github.sh
```

### Produção
```bash
cd /home/ubuntu/apps/hub-defisats-production
./scripts/deploy-production-github.sh
```

## Comandos de Gerenciamento

### Staging (Docker)
```bash
# Iniciar
docker compose -f docker-compose.staging.yml up -d

# Parar
docker compose -f docker-compose.staging.yml down

# Logs
docker compose -f docker-compose.staging.yml logs -f

# Status
docker compose -f docker-compose.staging.yml ps
```

### Produção (PM2)
```bash
# Iniciar
pm2 start ecosystem.config.js --env production

# Parar
pm2 stop all

# Reiniciar
pm2 reload all

# Logs
pm2 logs

# Status
pm2 status

# Monitoramento
pm2 monit
```

## Vantagens da Nova Arquitetura

### ✅ **Separação Clara de Ambientes**
- Desenvolvimento: Local com Docker
- Staging: Servidor com Docker (testes)
- Produção: Servidor nativo (performance)

### ✅ **Performance Otimizada**
- Produção sem overhead do Docker
- PM2 para gerenciamento de processos
- Nginx otimizado para produção

### ✅ **Facilidade de Deploy**
- Scripts automatizados para cada ambiente
- Deploy independente por ambiente
- Rollback fácil com PM2

### ✅ **Segurança Aprimorada**
- Rate limiting por ambiente
- Headers de segurança configurados
- SSL/TLS para ambos os domínios

### ✅ **Monitoramento**
- Logs centralizados por ambiente
- PM2 para monitoramento de processos
- Health checks configurados

## Fluxo de Desenvolvimento com Pull Requests

### 1. **Criação de Feature Branch**
```bash
# Criar feature branch
git checkout -b feature/nova-funcionalidade

# Fazer commits
git add .
git commit -m "feat: adiciona nova funcionalidade"

# Push para GitHub
git push origin feature/nova-funcionalidade
```

### 2. **Pull Request para Develop (Staging)**
- Criar PR de `feature/nova-funcionalidade` → `develop`
- GitHub Actions executa validações automaticamente:
  - ✅ Lint (backend + frontend)
  - ✅ Type Check (backend + frontend)
  - ✅ Testes (backend + frontend)
  - ✅ Security Audit
  - ✅ Build
- Merge automático após aprovação dos testes
- Deploy automático para staging

### 3. **Testes em Staging**
- Acessar `https://staging.defisats.site`
- Testes manuais e automatizados
- Validação com stakeholders
- Correções se necessário

### 4. **Pull Request para Main (Produção)**
- Criar PR de `develop` → `main`
- Requer aprovação manual (configurado no GitHub)
- Deploy manual para produção após merge
- Backup automático antes do deploy

### 5. **Configuração de Proteções de Branch**
- **`main`**: Requer aprovação + status checks
- **`develop`**: Requer status checks apenas
- **`staging`**: Permite force push para testes

## Configuração de Secrets no GitHub

### Secrets Necessários
```bash
# SSH Key para acesso ao servidor
SERVER_SSH_KEY

# Credenciais de email (opcional)
EMAIL_USERNAME
EMAIL_PASSWORD

# Webhook do Slack/Discord (opcional)
SLACK_WEBHOOK
```

### Configuração via GitHub CLI
```bash
# Adicionar SSH key
gh secret set SERVER_SSH_KEY < ~/.ssh/debian.pem

# Verificar secrets
gh secret list
```

## Próximos Passos

1. **Configurar Secrets no GitHub**:
   ```bash
   gh secret set SERVER_SSH_KEY < ~/.ssh/debian.pem
   ```

2. **Configurar Proteções de Branch**:
   - Acessar Settings → Branches
   - Configurar regras para `main` e `develop`
   - Ver documentação em `.github/BRANCH_PROTECTION.md`

3. **Instalar ambiente de produção**:
   ```bash
   sudo /home/ubuntu/apps/hub-defisats-production/scripts/install-production.sh
   ```

4. **Configurar DNS**:
   - Adicionar registro A para `staging.defisats.site`
   - Verificar configuração do `defisats.site`

5. **Deploy inicial**:
   - Deploy para staging primeiro
   - Testes completos
   - Deploy para produção

6. **Monitoramento**:
   - Configurar alertas
   - Monitorar logs
   - Verificar performance

---

**Documento**: Arquitetura Reestruturada  
**Versão**: 1.0.0  
**Data**: 2025-01-20  
**Status**: ✅ Implementado
