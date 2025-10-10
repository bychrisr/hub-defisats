# 📋 DOCUMENTAÇÃO COMPLETA - SERVIDOR DEFISATS

## 🎯 Visão Geral

Este documento fornece instruções detalhadas e específicas para configurar, executar e manter a aplicação Axisor em um servidor de produção. A documentação é específica para a estrutura atual do servidor e inclui todos os passos necessários desde o acesso inicial até a configuração completa do ambiente.

---

## 📍 Informações do Servidor

- **Servidor**: AWS EC2 (Ubuntu 22.04 LTS)
- **IP Público**: 3.143.248.70
- **Domínios**: 
  - Frontend: `https://defisats.site`
  - API: `https://api.defisats.site`
- **Usuário**: `bychrisr`
- **Diretório do Projeto**: `/home/bychrisr/projects/axisor`
- **Senha sudo**: `0,0,`

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Containers

```
┌─────────────────────────────────────────────────────────────┐
│                    PROXY GLOBAL (Nginx)                    │
│  Portas: 80 (HTTP) e 443 (HTTPS)                          │
│  Container: global-nginx-proxy                             │
│  Rede: proxy-network                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                APLICAÇÃO DEFISATS                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Frontend  │  │   Backend   │  │   Database  │        │
│  │   :3001     │  │   :3010     │  │   :5432     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Redis    │  │   Workers   │  │    Nginx    │        │
│  │   :6379     │  │  (various)  │  │   :8080     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  Rede: docker_axisor-network                         │
│  + proxy-network (conectada)                               │
└─────────────────────────────────────────────────────────────┘
```

### Redes Docker

1. **proxy-network**: Rede global para comunicação entre proxy e aplicações
2. **docker_axisor-network**: Rede interna da aplicação Axisor

---

## 🚀 GUIA DE CONFIGURAÇÃO COMPLETA

### 1. Acesso ao Servidor

#### 1.1 Conexão SSH
```bash
ssh bychrisr@3.143.248.70
```

#### 1.2 Navegação para o Projeto
```bash
cd /home/bychrisr/projects/axisor
```

### 2. Estrutura de Diretórios

```
/home/bychrisr/projects/axisor/
├── backend/                    # API Node.js/TypeScript
├── frontend/                   # Aplicação React/Vite
├── config/                     # Configurações do projeto
│   ├── docker/                # Docker Compose files
│   │   ├── docker-compose.dev.yml
│   │   ├── docker-compose.prod.yml
│   │   └── nginx/             # Configuração Nginx interna
│   └── env/                   # Arquivos de ambiente
├── proxy/                     # Proxy global Nginx
│   ├── conf.d/               # Configurações de sites
│   ├── nginx.conf            # Configuração principal
│   └── docker-compose.yml    # Docker Compose do proxy
├── .env                      # Variáveis de ambiente (produção)
├── .env.prod                 # Backup das variáveis de produção
└── scripts/                  # Scripts de automação
```

### 3. Configuração do Proxy Global

#### 3.1 Localização do Proxy
```bash
cd /home/bychrisr/proxy
```

#### 3.2 Estrutura do Proxy
```
/home/bychrisr/proxy/
├── conf.d/
│   └── defisats.conf         # Configuração específica do Axisor
├── nginx.conf                # Configuração principal do Nginx
├── docker-compose.yml        # Docker Compose do proxy
└── start-proxy.sh           # Script de inicialização
```

#### 3.3 Configuração do Site (defisats.conf)
```nginx
# Frontend
server {
    listen 80;
    server_name defisats.site www.defisats.site;
    
    location / {
        proxy_pass http://axisor-frontend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API
server {
    listen 80;
    server_name api.defisats.site;
    
    location / {
        proxy_pass http://axisor-backend:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3.4 Gerenciamento do Proxy
```bash
# Iniciar proxy
cd /home/bychrisr/proxy
./start-proxy.sh start

# Parar proxy
./start-proxy.sh stop

# Reiniciar proxy
./start-proxy.sh restart

# Ver logs
docker logs global-nginx-proxy
```

### 4. Configuração da Aplicação

#### 4.1 Variáveis de Ambiente

**Arquivo**: `/home/bychrisr/projects/axisor/.env`

```bash
# Production Environment Variables
NODE_ENV=production
PORT=23000

# Database
POSTGRES_DB=axisor_prod
POSTGRES_USER=axisor_prod
POSTGRES_PASSWORD=axisor_prod_password_secure_2024
DATABASE_URL=postgresql://axisor_prod:axisor_prod_password_secure_2024@postgres:5432/axisor_prod?schema=public

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=axisor_redis_password_2024

# JWT Secrets
JWT_SECRET=production-jwt-secret-key-32-chars-minimum-2024
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=production-refresh-secret-key-32-chars-minimum-2024
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption Key
ENCRYPTION_KEY=production-encryption-key-32-chars-2024

# LN Markets API
LN_MARKETS_API_URL=https://api.lnmarkets.com
LN_MARKETS_SANDBOX_URL=https://api.lnmarkets.com/sandbox
LN_MARKETS_API_KEY=your_api_key_here
LN_MARKETS_API_SECRET=your_api_secret_here
LN_MARKETS_PASSPHRASE=your_passphrase_here

# CORS
CORS_ORIGIN=https://defisats.site

# Frontend
VITE_API_URL=https://api.defisats.site

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Evolution API (Required)
EVOLUTION_API_URL=https://api.evolution.com
EVOLUTION_API_KEY=your_evolution_api_key

# Optional variables (can be empty)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
RECAPTCHA_SECRET_KEY=
RECAPTCHA_V3_SECRET_KEY=
HCAPTCHA_SECRET_KEY=
SLACK_WEBHOOK_URL=
SENTRY_DSN=
VITE_RECAPTCHA_SITE_KEY=
VITE_RECAPTCHA_V3_SITE_KEY=
VITE_HCAPTCHA_SITE_KEY=
VITE_SENTRY_DSN=
```

#### 4.2 Docker Compose - Modo Desenvolvimento

**Arquivo**: `config/docker/docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: axisor-postgres
    environment:
      POSTGRES_DB: axisor_dev
      POSTGRES_USER: axisor_dev
      POSTGRES_PASSWORD: axisor_dev_password
    ports:
      - "15432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - axisor-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U axisor_dev -d axisor_dev"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7
    container_name: axisor-redis
    ports:
      - "16379:6379"
    volumes:
      - redis_data:/data
    networks:
      - axisor-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    container_name: axisor-backend
    environment:
      NODE_ENV: development
      PORT: 3010
      DATABASE_URL: postgresql://axisor_dev:axisor_dev_password@postgres:5432/axisor_dev
      REDIS_URL: redis://redis:6379
    ports:
      - "13010:3010"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - axisor-network
    volumes:
      - ../../backend:/app
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3010/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ../../frontend
      dockerfile: Dockerfile
    container_name: axisor-frontend
    environment:
      VITE_API_URL: http://localhost:3010
    ports:
      - "13000:3001"
    depends_on:
      - backend
    networks:
      - axisor-network
    volumes:
      - ../../frontend:/app
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:

networks:
  axisor-network:
    driver: bridge
```

#### 4.3 Docker Compose - Modo Produção

**Arquivo**: `config/docker/docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: axisor-postgres
    command: postgres -c 'max_connections=200' -c 'shared_buffers=256MB'
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - axisor-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: axisor-redis
    command: redis-server --appendonly yes --requirepass axisor_redis_password_2024
    volumes:
      - redis_data:/data
    networks:
      - axisor-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "axisor_redis_password_2024", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    container_name: axisor-backend
    env_file:
      - ../../.env
    environment:
      NODE_ENV: production
      PORT: 3010
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    ports:
      - "3010:3010"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - axisor-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3010/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ../../frontend
      dockerfile: Dockerfile
    container_name: axisor-frontend
    environment:
      VITE_API_URL: https://api.defisats.site
    ports:
      - "8080:80"
    depends_on:
      - backend
    networks:
      - axisor-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Workers (opcionais para produção)
  margin-monitor:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    container_name: axisor-margin-monitor
    command: ["npm", "run", "worker:margin-monitor"]
    env_file:
      - ../../.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - axisor-network
    restart: unless-stopped

  automation-executor:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    container_name: axisor-automation-executor
    command: ["npm", "run", "worker:automation-executor"]
    env_file:
      - ../../.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - axisor-network
    restart: unless-stopped

  notification-worker:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    container_name: axisor-notification-worker
    command: ["npm", "run", "worker:notification"]
    env_file:
      - ../../.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - axisor-network
    restart: unless-stopped

  payment-validator:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    container_name: axisor-payment-validator
    command: ["npm", "run", "worker:payment-validator"]
    env_file:
      - ../../.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - axisor-network
    restart: unless-stopped

  simulation-executor:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    container_name: axisor-simulation-executor
    command: ["npm", "run", "worker:simulation-executor"]
    env_file:
      - ../../.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - axisor-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: axisor-nginx
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - axisor-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  nginx_logs:
    driver: local

networks:
  axisor-network:
    driver: bridge
```

### 5. Configuração do Nginx Interno

**Arquivo**: `config/docker/nginx/nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;
    
    # Upstream servers
    upstream backend {
        server axisor-backend:3010;
    }
    
    upstream frontend {
        server axisor-frontend:3001;
    }
    
    # Main server block
    server {
        listen 80;
        server_name _;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Health check
        location /health {
            proxy_pass http://backend/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Frontend routes
        location / {
            limit_req zone=web burst=50 nodelay;
            proxy_pass http://frontend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
    }
}
```

---

## 🚀 COMANDOS DE EXECUÇÃO

### 1. Inicialização Completa do Sistema

#### 1.1 Iniciar Proxy Global
```bash
cd /home/bychrisr/proxy
./start-proxy.sh start
```

#### 1.2 Iniciar Aplicação (Modo Desenvolvimento)
```bash
cd /home/bychrisr/projects/axisor
docker compose -f config/docker/docker-compose.dev.yml up -d
```

#### 1.3 Conectar Redes
```bash
# Conectar containers da aplicação ao proxy global
docker network connect proxy-network axisor-backend
docker network connect proxy-network axisor-frontend
```

### 2. Comandos de Gerenciamento

#### 2.1 Aplicação
```bash
# Parar aplicação
docker compose -f config/docker/docker-compose.dev.yml down

# Reiniciar aplicação
docker compose -f config/docker/docker-compose.dev.yml restart

# Ver logs
docker compose -f config/docker/docker-compose.dev.yml logs -f

# Ver status
docker compose -f config/docker/docker-compose.dev.yml ps
```

#### 2.2 Proxy Global
```bash
# Parar proxy
cd /home/bychrisr/proxy
./start-proxy.sh stop

# Reiniciar proxy
./start-proxy.sh restart

# Ver logs
docker logs global-nginx-proxy
```

#### 2.3 Containers Individuais
```bash
# Ver todos os containers
docker ps

# Ver logs de um container específico
docker logs axisor-backend
docker logs axisor-frontend

# Reiniciar container específico
docker restart axisor-backend
```

### 3. Comandos de Desenvolvimento

#### 3.1 Backend
```bash
# Entrar no container do backend
docker exec -it axisor-backend bash

# Executar migrações do banco
docker exec axisor-backend npx prisma migrate dev

# Executar seed do banco
docker exec axisor-backend npm run db:seed

# Ver logs em tempo real
docker logs -f axisor-backend
```

#### 3.2 Frontend
```bash
# Entrar no container do frontend
docker exec -it axisor-frontend bash

# Ver logs em tempo real
docker logs -f axisor-frontend
```

#### 3.3 Banco de Dados
```bash
# Conectar ao PostgreSQL
docker exec -it axisor-postgres psql -U axisor_dev -d axisor_dev

# Backup do banco
docker exec axisor-postgres pg_dump -U axisor_dev axisor_dev > backup.sql

# Restaurar backup
docker exec -i axisor-postgres psql -U axisor_dev -d axisor_dev < backup.sql
```

---

## 🔧 TROUBLESHOOTING

### 1. Problemas Comuns

#### 1.1 Aplicação não inicia
```bash
# Verificar logs
docker logs axisor-backend
docker logs axisor-frontend

# Verificar variáveis de ambiente
docker exec axisor-backend env | grep -E "(DATABASE_URL|JWT_SECRET)"

# Verificar conectividade do banco
docker exec axisor-backend npx prisma db push
```

#### 1.2 Proxy não consegue acessar aplicação
```bash
# Verificar se containers estão na mesma rede
docker network inspect proxy-network
docker network inspect docker_axisor-network

# Conectar containers manualmente
docker network connect proxy-network axisor-backend
docker network connect proxy-network axisor-frontend

# Testar conectividade interna
docker exec global-nginx-proxy curl -s http://axisor-backend:3010/health
```

#### 1.3 Problemas de permissão
```bash
# Corrigir permissões do arquivo .env
sudo chown bychrisr:bychrisr /home/bychrisr/projects/axisor/.env
sudo chmod 644 /home/bychrisr/projects/axisor/.env

# Corrigir permissões do nginx.conf
sudo chown root:root /home/bychrisr/projects/axisor/config/docker/nginx/nginx.conf
sudo chmod 644 /home/bychrisr/projects/axisor/config/docker/nginx/nginx.conf
```

### 2. Verificações de Saúde

#### 2.1 Status dos Serviços
```bash
# Verificar status de todos os containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar health checks
docker inspect axisor-backend | grep -A 5 "Health"
docker inspect axisor-frontend | grep -A 5 "Health"
```

#### 2.2 Testes de Conectividade
```bash
# Testar frontend externamente
curl -I https://defisats.site

# Testar API externamente
curl -I https://api.defisats.site/health

# Testar API internamente
docker exec global-nginx-proxy curl -s http://axisor-backend:3010/health
```

#### 2.3 Verificação de Logs
```bash
# Logs do proxy global
docker logs global-nginx-proxy --tail 50

# Logs da aplicação
docker compose -f config/docker/docker-compose.dev.yml logs --tail 50

# Logs específicos do nginx interno
docker logs axisor-nginx --tail 50
```

---

## 📊 MONITORAMENTO

### 1. Métricas de Sistema
```bash
# Uso de CPU e memória
docker stats --no-stream

# Uso de disco
df -h

# Uso de memória
free -h

# Processos em execução
ps aux | grep -E "(node|nginx|postgres|redis)"
```

### 2. Logs de Aplicação
```bash
# Logs em tempo real
docker compose -f config/docker/docker-compose.dev.yml logs -f

# Logs específicos por serviço
docker logs -f axisor-backend
docker logs -f axisor-frontend
docker logs -f global-nginx-proxy
```

### 3. Monitoramento de Rede
```bash
# Verificar portas em uso
netstat -tlnp | grep -E "(80|443|3001|3010|5432|6379)"

# Verificar conectividade entre containers
docker exec axisor-backend ping axisor-postgres
docker exec global-nginx-proxy ping axisor-backend
```

---

## 🔄 PROCEDIMENTOS DE MANUTENÇÃO

### 1. Backup e Restore

#### 1.1 Backup do Banco de Dados
```bash
# Backup completo
docker exec axisor-postgres pg_dump -U axisor_dev axisor_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup apenas dados
docker exec axisor-postgres pg_dump -U axisor_dev -d axisor_dev --data-only > data_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 Restore do Banco de Dados
```bash
# Restaurar backup completo
docker exec -i axisor-postgres psql -U axisor_dev -d axisor_dev < backup_20241222_143000.sql
```

### 2. Atualizações

#### 2.1 Atualizar Código
```bash
# Fazer pull das mudanças
git pull origin main

# Rebuild dos containers
docker compose -f config/docker/docker-compose.dev.yml build --no-cache

# Reiniciar aplicação
docker compose -f config/docker/docker-compose.dev.yml up -d
```

#### 2.2 Atualizar Dependências
```bash
# Backend
docker exec axisor-backend npm update

# Frontend
docker exec axisor-frontend npm update
```

### 3. Limpeza

#### 3.1 Limpeza de Containers
```bash
# Parar e remover containers parados
docker container prune -f

# Remover imagens não utilizadas
docker image prune -f

# Limpeza completa (cuidado!)
docker system prune -a -f
```

#### 3.2 Limpeza de Logs
```bash
# Limpar logs antigos
docker logs --tail 0 -f axisor-backend > /dev/null
docker logs --tail 0 -f axisor-frontend > /dev/null
```

---

## 🚨 PROCEDIMENTOS DE EMERGÊNCIA

### 1. Recuperação Rápida

#### 1.1 Reinicialização Completa
```bash
# Parar tudo
docker compose -f config/docker/docker-compose.dev.yml down
cd /home/bychrisr/proxy && ./start-proxy.sh stop

# Iniciar tudo
cd /home/bychrisr/proxy && ./start-proxy.sh start
cd /home/bychrisr/projects/axisor
docker compose -f config/docker/docker-compose.dev.yml up -d
docker network connect proxy-network axisor-backend
docker network connect proxy-network axisor-frontend
```

#### 1.2 Recuperação de Rede
```bash
# Recriar redes se necessário
docker network rm docker_axisor-network
docker network create docker_axisor-network

# Reconectar containers
docker network connect proxy-network axisor-backend
docker network connect proxy-network axisor-frontend
```

### 2. Rollback

#### 2.1 Rollback de Código
```bash
# Voltar para commit anterior
git log --oneline -5
git reset --hard HEAD~1

# Rebuild e restart
docker compose -f config/docker/docker-compose.dev.yml build --no-cache
docker compose -f config/docker/docker-compose.dev.yml up -d
```

#### 2.2 Rollback de Banco
```bash
# Restaurar backup anterior
docker exec -i axisor-postgres psql -U axisor_dev -d axisor_dev < backup_anterior.sql
```

---

## 📞 CONTATOS E SUPORTE

### Informações do Servidor
- **Servidor**: AWS EC2 (3.143.248.70)
- **Usuário**: bychrisr
- **Projeto**: /home/bychrisr/projects/axisor
- **Proxy**: /home/bychrisr/proxy

### URLs de Acesso
- **Frontend**: https://defisats.site
- **API**: https://api.defisats.site
- **Health Check**: https://api.defisats.site/health

### Comandos de Verificação Rápida
```bash
# Status geral
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Teste de conectividade
curl -I https://defisats.site
curl -I https://api.defisats.site/health

# Logs recentes
docker logs --tail 10 axisor-backend
docker logs --tail 10 axisor-frontend
```

---

## 📝 NOTAS IMPORTANTES

1. **Sempre use o modo desenvolvimento** (`docker-compose.dev.yml`) para este servidor
2. **O proxy global deve ser iniciado antes** da aplicação
3. **Sempre conectar as redes** após iniciar os containers
4. **Verificar as variáveis de ambiente** antes de iniciar a aplicação
5. **Fazer backup regular** do banco de dados
6. **Monitorar logs** para identificar problemas rapidamente

---

*Documentação criada em: 22 de Setembro de 2024*
*Versão: 1.0*
*Projeto: Axisor - Sistema de Trading DeFi*
