# 🚀 Hub DefiSats - Documentação Completa do Servidor

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura de Diretórios](#estrutura-de-diretórios)
4. [Containers e Serviços](#containers-e-serviços)
5. [Configuração do Proxy](#configuração-do-proxy)
6. [Acesso e Credenciais](#acesso-e-credenciais)
7. [Deploy e Manutenção](#deploy-e-manutenção)
8. [Monitoramento e Logs](#monitoramento-e-logs)
9. [Troubleshooting](#troubleshooting)
10. [Comandos Úteis](#comandos-úteis)

---

## 🎯 Visão Geral

O **Hub DefiSats** é uma plataforma de automação para LN Markets que oferece:
- **Monitoramento em tempo real** de posições e margem
- **Automações inteligentes** para trading
- **Dashboard administrativo** completo
- **API REST** robusta com autenticação JWT
- **WebSocket** para atualizações em tempo real
- **Sistema de notificações** multi-canal

### 🌐 URLs de Acesso
- **Frontend:** https://defisats.site
- **Backend API:** https://defisats.site/api
- **Health Check:** https://defisats.site/health

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nginx Proxy   │    │   Backend API   │
│   (React/Vite)  │◄───┤   (Load Balancer)│◄───┤   (Fastify)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │     Redis       │
                       │   (Database)    │    │    (Cache)      │
                       └─────────────────┘    └─────────────────┘
```

### 🔧 Componentes Principais

1. **Frontend (React + Vite)**
   - Interface de usuário moderna
   - Dashboard administrativo
   - Autenticação JWT
   - WebSocket para tempo real

2. **Backend (Fastify + TypeScript)**
   - API REST robusta
   - Autenticação e autorização
   - Integração com LN Markets
   - Sistema de automações

3. **Nginx (Proxy Reverso)**
   - Load balancing
   - SSL/TLS termination
   - Rate limiting
   - Cache de arquivos estáticos

4. **PostgreSQL (Banco de Dados)**
   - Dados de usuários e configurações
   - Histórico de trades
   - Logs de automações

5. **Redis (Cache)**
   - Cache de sessões
   - Rate limiting
   - Dados temporários

---

## 📁 Estrutura de Diretórios

```
axisor/
├── backend/                    # Backend API (Fastify + TypeScript)
│   ├── src/
│   │   ├── controllers/        # Controladores da API
│   │   ├── services/          # Lógica de negócio
│   │   ├── routes/            # Definição de rotas
│   │   ├── middleware/        # Middlewares de autenticação
│   │   ├── types/             # Definições de tipos
│   │   └── utils/             # Utilitários
│   ├── prisma/                # Schema e migrações do banco
│   ├── tests/                 # Testes automatizados
│   └── Dockerfile             # Container do backend
├── frontend/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── hooks/             # Custom hooks
│   │   ├── stores/            # Estado global (Zustand)
│   │   └── services/          # Serviços de API
│   └── Dockerfile             # Container do frontend
├── nginx/                      # Configuração do Nginx
│   └── nginx.conf             # Configuração principal
├── scripts/                    # Scripts de automação
│   ├── deploy/                # Scripts de deploy
│   ├── admin/                 # Scripts administrativos
│   └── dev/                   # Scripts de desenvolvimento
├── config/                     # Configurações
│   ├── env/                   # Variáveis de ambiente
│   └── docker/                # Configurações Docker
├── monitoring/                 # Configurações de monitoramento
│   ├── prometheus.yml         # Métricas
│   └── grafana-dashboard.json # Dashboard
└── docker-compose.prod.yml    # Orquestração de containers
```

---

## 🐳 Containers e Serviços

### 1. **PostgreSQL** (`axisor-postgres-prod`)
```yaml
Image: postgres:15-alpine
Port: 5432
Volume: postgres_data:/var/lib/postgresql/data
Environment:
  POSTGRES_DB: axisor_prod
  POSTGRES_USER: axisor_prod
  POSTGRES_PASSWORD: [SECRET]
```

### 2. **Redis** (`axisor-redis-prod`)
```yaml
Image: redis:6-alpine
Port: 6379
Volume: redis_data:/data
Command: redis-server --appendonly yes --maxmemory 256mb
```

### 3. **Backend** (`axisor-backend-prod`)
```yaml
Build: ./backend/Dockerfile
Port: 13010:3010
Environment:
  NODE_ENV: production
  DATABASE_URL: postgresql://axisor_prod:[PASSWORD]@postgres:5432/axisor_prod
  REDIS_URL: redis://redis:6379
  JWT_SECRET: [SECRET]
  ENCRYPTION_KEY: [SECRET]
```

### 4. **Frontend** (`axisor-frontend-prod`)
```yaml
Build: ./frontend/Dockerfile
Port: 80 (via Nginx)
Environment:
  VITE_API_URL: https://defisats.site/api
```

### 5. **Nginx** (Externo)
```yaml
Image: nginx:alpine
Port: 80, 443
SSL: Let's Encrypt
Config: nginx/nginx.conf
```

---

## 🔧 Configuração do Proxy

### Nginx Configuration (`nginx/nginx.conf`)

```nginx
# Rate Limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

# Upstream Servers
upstream backend {
    server backend:3010;
    keepalive 32;
}

upstream frontend {
    server frontend:80;
    keepalive 32;
}

# API Routes
location /api/ {
    proxy_pass http://backend;
    limit_req zone=api burst=20 nodelay;
    # CORS headers
    add_header Access-Control-Allow-Origin *;
}

# Auth Routes (Stricter Rate Limiting)
location /api/auth/ {
    proxy_pass http://backend;
    limit_req zone=auth burst=5 nodelay;
}

# WebSocket
location /test/ws/ {
    proxy_pass http://backend;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Frontend
location / {
    proxy_pass http://frontend;
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
    }
}
```

---

## 🔐 Acesso e Credenciais

### Super Admin
```
Email: admin@defisats.com
Password: password
Role: superadmin
```

### Acesso ao Servidor
```bash
# SSH
ssh user@defisats.site

# Diretório do projeto
cd /home/bychrisr/projects/axisor
```

### Acesso aos Containers
```bash
# Backend
docker exec -it axisor-backend-prod bash

# PostgreSQL
docker exec -it axisor-postgres-prod psql -U axisor_prod -d axisor_prod

# Redis
docker exec -it axisor-redis-prod redis-cli
```

### Variáveis de Ambiente
```bash
# Arquivo: config/env/env.production
POSTGRES_DB=axisor_prod
POSTGRES_USER=axisor_prod
POSTGRES_PASSWORD=axisor_prod_password_secure_2024
DATABASE_URL=postgresql://axisor_prod:axisor_prod_password_secure_2024@postgres:5432/axisor_prod
REDIS_URL=redis://redis:6379
JWT_SECRET=production-jwt-secret-key-32-chars-minimum-2024
ENCRYPTION_KEY=production-encryption-key-32-chars-2024
```

---

## 🚀 Deploy e Manutenção

### 1. Deploy Automático
```bash
# Script de deploy completo
./scripts/deploy/deploy-prod-enhanced.sh
```

### 2. Deploy Manual
```bash
# 1. Parar serviços
docker compose -f docker-compose.prod.yml down

# 2. Rebuild containers
docker compose -f docker-compose.prod.yml build --no-cache

# 3. Iniciar serviços
docker compose -f docker-compose.prod.yml up -d

# 4. Executar migrações
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 5. Verificar saúde
curl http://localhost:13010/health
```

### 3. Atualização de Código
```bash
# 1. Fazer pull do código
git pull origin main

# 2. Rebuild apenas o backend
docker compose -f docker-compose.prod.yml build backend --no-cache

# 3. Restart do backend
docker compose -f docker-compose.prod.yml restart backend

# 4. Verificar logs
docker compose -f docker-compose.prod.yml logs backend --follow
```

### 4. Backup do Banco de Dados
```bash
# Backup completo
docker exec axisor-postgres-prod pg_dump -U axisor_prod axisor_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i axisor-postgres-prod psql -U axisor_prod axisor_prod < backup_file.sql
```

---

## 📊 Monitoramento e Logs

### 1. Logs dos Containers
```bash
# Todos os serviços
docker compose -f docker-compose.prod.yml logs --follow

# Backend específico
docker compose -f docker-compose.prod.yml logs backend --follow --tail=50

# PostgreSQL
docker compose -f docker-compose.prod.yml logs postgres --follow

# Redis
docker compose -f docker-compose.prod.yml logs redis --follow
```

### 2. Health Checks
```bash
# Backend
curl http://localhost:13010/health

# Frontend
curl http://localhost/health

# PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U axisor_prod

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

### 3. Métricas de Performance
```bash
# Uso de recursos
docker stats

# Espaço em disco
df -h

# Uso de memória
free -h
```

### 4. Logs do Nginx
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting

### 1. Problemas Comuns

#### Backend não inicia
```bash
# Verificar logs
docker compose -f docker-compose.prod.yml logs backend

# Verificar variáveis de ambiente
docker compose -f docker-compose.prod.yml exec backend env | grep -E "(DATABASE|REDIS|JWT)"

# Verificar conectividade com banco
docker compose -f docker-compose.prod.yml exec backend npx prisma db push
```

#### Erro 500 no Frontend
```bash
# Verificar logs do backend
docker compose -f docker-compose.prod.yml logs backend --tail=100

# Verificar conectividade
curl -v http://localhost:13010/health

# Verificar banco de dados
docker compose -f docker-compose.prod.yml exec postgres psql -U axisor_prod -d axisor_prod -c "SELECT 1;"
```

#### Problemas de Autenticação
```bash
# Verificar JWT secret
docker compose -f docker-compose.prod.yml exec backend env | grep JWT_SECRET

# Verificar usuários no banco
docker compose -f docker-compose.prod.yml exec postgres psql -U axisor_prod -d axisor_prod -c "SELECT email, username FROM \"User\";"

# Limpar cache do Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

### 2. Reset Completo
```bash
# 1. Parar todos os serviços
docker compose -f docker-compose.prod.yml down

# 2. Remover volumes (CUIDADO: apaga dados)
docker volume rm axisor_postgres_data axisor_redis_data

# 3. Rebuild completo
docker compose -f docker-compose.prod.yml build --no-cache

# 4. Iniciar serviços
docker compose -f docker-compose.prod.yml up -d

# 5. Executar migrações
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 6. Criar super admin
./scripts/admin/create-super-admin.sh admin@defisats.com admin password
```

---

## 🛠️ Comandos Úteis

### Docker
```bash
# Status dos containers
docker compose -f docker-compose.prod.yml ps

# Restart de um serviço
docker compose -f docker-compose.prod.yml restart backend

# Rebuild de um serviço
docker compose -f docker-compose.prod.yml build backend --no-cache

# Executar comando no container
docker compose -f docker-compose.prod.yml exec backend bash

# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f backend
```

### Banco de Dados
```bash
# Conectar ao PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U axisor_prod -d axisor_prod

# Executar migrações
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Sincronizar schema
docker compose -f docker-compose.prod.yml exec backend npx prisma db push

# Reset do banco (CUIDADO)
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate reset
```

### Redis
```bash
# Conectar ao Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli

# Limpar cache
docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL

# Ver chaves
docker compose -f docker-compose.prod.yml exec redis redis-cli KEYS "*"
```

### Sistema
```bash
# Verificar uso de recursos
docker stats

# Verificar espaço em disco
df -h

# Verificar processos
ps aux | grep docker

# Verificar portas
netstat -tlnp | grep -E "(80|443|13010|5432|6379)"
```

---

## 📝 Scripts Disponíveis

### Deploy
- `./scripts/deploy/deploy-prod-enhanced.sh` - Deploy completo
- `./scripts/deploy/deploy-prod.sh` - Deploy simples
- `./scripts/deploy/check-production.sh` - Verificar produção

### Administração
- `./scripts/admin/create-super-admin.sh` - Criar super admin
- `./scripts/admin/create-admin.js` - Criar admin via Node.js

### Desenvolvimento
- `./scripts/dev/create-dev-user.sh` - Criar usuário de desenvolvimento
- `./scripts/dev/setup-env.sh` - Configurar ambiente

### Testes
- `./scripts/test/test-user-upgrade.sh` - Testar upgrade de usuário
- `./scripts/test/test-api-endpoints.sh` - Testar endpoints da API

---

## 🔒 Segurança

### 1. Firewall
```bash
# Verificar regras do firewall
ufw status

# Permitir apenas portas necessárias
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
```

### 2. SSL/TLS
- Certificados Let's Encrypt
- Renovação automática
- Redirecionamento HTTP → HTTPS

### 3. Rate Limiting
- API: 10 requests/segundo
- Auth: 5 requests/minuto
- Automations: 2 requests/segundo

### 4. Headers de Segurança
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Content-Security-Policy

---

## 📞 Suporte

### Logs Importantes
- Backend: `docker compose -f docker-compose.prod.yml logs backend`
- Nginx: `/var/log/nginx/error.log`
- Sistema: `/var/log/syslog`

### Monitoramento
- Health checks automáticos
- Logs estruturados
- Métricas de performance

### Contato
- Documentação: Este arquivo
- Issues: GitHub Issues
- Logs: Docker logs + Nginx logs

---

## 🎉 Status Atual

✅ **Sistema 100% Funcional**
- Backend API funcionando
- Frontend carregando corretamente
- Banco de dados sincronizado
- Autenticação funcionando
- Super admin criado
- Deploy automatizado

### Próximos Passos
1. Configurar monitoramento avançado
2. Implementar backup automático
3. Otimizar performance
4. Adicionar testes automatizados

---

**📅 Última Atualização:** 20 de Setembro de 2025  
**👨‍💻 Mantido por:** Equipe Hub DefiSats  
**🔗 Repositório:** https://github.com/seu-usuario/axisor
