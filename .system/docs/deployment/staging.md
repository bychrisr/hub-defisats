# 🚀 DOCUMENTAÇÃO AMBIENTE DE STAGING - DEFISATS

## 📍 Visão Geral

O ambiente de staging é uma réplica do ambiente de produção usado para testes e validação antes do deploy em produção. Ele utiliza o subdomínio `staging.defisats.site` e possui configurações específicas para desenvolvimento e testes.

---

## 🌐 URLs de Acesso

- **Frontend Staging**: `https://staging.defisats.site`
- **API Staging**: `https://api-staging.defisats.site`
- **Health Check**: `https://api-staging.defisats.site/health`

---

## 🏗️ Arquitetura do Staging

### Containers do Staging

```
┌─────────────────────────────────────────────────────────────┐
│                    PROXY GLOBAL (Nginx)                    │
│  Portas: 80 (HTTP) e 443 (HTTPS)                          │
│  Container: global-nginx-proxy                             │
│  Rede: proxy-network                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                APLICAÇÃO DEFISATS STAGING                  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Frontend  │  │   Backend   │  │   Database  │        │
│  │   :3001     │  │   :3010     │  │   :5432     │        │
│  │  (staging)  │  │  (staging)  │  │  (staging)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Redis    │  │   Workers   │  │    Nginx    │        │
│  │   :6379     │  │  (various)  │  │   :8080     │        │
│  │  (staging)  │  │  (staging)  │  │  (staging)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  Rede: docker_hub-defisats-staging-network                 │
│  + proxy-network (conectada)                               │
└─────────────────────────────────────────────────────────────┘
```

### Portas do Staging

| Serviço | Porta Externa | Porta Interna | Container |
|---------|---------------|---------------|-----------|
| Frontend | 13010 | 3001 | hub-defisats-frontend-staging |
| Backend | 13020 | 3010 | hub-defisats-backend-staging |
| PostgreSQL | 15432 | 5432 | hub-defisats-postgres-staging |
| Redis | 16379 | 6379 | hub-defisats-redis-staging |
| Nginx | 8080 | 80 | hub-defisats-nginx-staging |

---

## 🚀 COMANDOS DE EXECUÇÃO

### 1. Inicialização do Staging

#### 1.1 Iniciar Ambiente de Staging
```bash
cd /home/bychrisr/projects/hub-defisats
docker compose -f config/docker/docker-compose.staging.yml up -d
```

#### 1.2 Conectar ao Proxy Global
```bash
# Conectar containers de staging ao proxy global
docker network connect proxy-network hub-defisats-backend-staging
docker network connect proxy-network hub-defisats-frontend-staging
```

#### 1.3 Reiniciar Proxy Global
```bash
cd /home/bychrisr/proxy
./start-proxy.sh restart
```

### 2. Comandos de Gerenciamento

#### 2.1 Controle do Staging
```bash
# Parar staging
docker compose -f config/docker/docker-compose.staging.yml down

# Reiniciar staging
docker compose -f config/docker/docker-compose.staging.yml restart

# Ver logs
docker compose -f config/docker/docker-compose.staging.yml logs -f

# Ver status
docker compose -f config/docker/docker-compose.staging.yml ps
```

#### 2.2 Containers Individuais
```bash
# Ver containers de staging
docker ps | grep staging

# Ver logs específicos
docker logs hub-defisats-backend-staging
docker logs hub-defisats-frontend-staging

# Reiniciar container específico
docker restart hub-defisats-backend-staging
```

### 3. Testes de Conectividade

#### 3.1 Testes Locais
```bash
# Testar frontend localmente
curl -s http://localhost:13010/ | head -5

# Testar API localmente
curl -s http://localhost:13020/health

# Testar banco de dados
docker exec -it hub-defisats-postgres-staging psql -U hubdefisats_staging -d hubdefisats_staging
```

#### 3.2 Testes Externos
```bash
# Testar frontend externamente
curl -I https://staging.defisats.site

# Testar API externamente
curl -I https://api-staging.defisats.site/health

# Testar através do proxy
docker exec global-nginx-proxy curl -s http://hub-defisats-backend-staging:3010/health
```

---

## ⚙️ CONFIGURAÇÕES ESPECÍFICAS

### 1. Variáveis de Ambiente

**Arquivo**: `/home/bychrisr/projects/hub-defisats/.env.staging`

```bash
# Staging Environment Variables
NODE_ENV=staging
PORT=13020

# Database (Staging)
POSTGRES_DB=hubdefisats_staging
POSTGRES_USER=hubdefisats_staging
POSTGRES_PASSWORD=hubdefisats_staging_password_2024
DATABASE_URL=postgresql://hubdefisats_staging:hubdefisats_staging_password_2024@postgres:5432/hubdefisats_staging?schema=public

# Redis (Staging)
REDIS_URL=redis://:hubdefisats_staging_redis_2024@redis:6379
REDIS_PASSWORD=hubdefisats_staging_redis_2024

# JWT Secrets (Staging)
JWT_SECRET=staging-jwt-secret-key-32-chars-minimum-2024
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=staging-refresh-secret-key-32-chars-minimum-2024
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption Key (Staging)
ENCRYPTION_KEY=staging-encryption-key-32-chars-2024

# LN Markets API (Staging - usar sandbox)
LN_MARKETS_API_URL=https://api.lnmarkets.com/sandbox
LN_MARKETS_SANDBOX_URL=https://api.lnmarkets.com/sandbox
LN_MARKETS_API_KEY=staging_api_key_here
LN_MARKETS_API_SECRET=staging_api_secret_here
LN_MARKETS_PASSPHRASE=staging_passphrase_here

# CORS (Staging)
CORS_ORIGIN=https://staging.defisats.site

# Frontend (Staging)
VITE_API_URL=https://staging.defisats.site/api

# Logging (Staging)
LOG_LEVEL=debug
LOG_FORMAT=json

# Evolution API (Required)
EVOLUTION_API_URL=https://api.evolution.com
EVOLUTION_API_KEY=staging_evolution_api_key

# Rate Limiting (Staging - mais permissivo)
RATE_LIMIT_MAX=2000
RATE_LIMIT_TIME_WINDOW=60000
```

### 2. Docker Compose Staging

**Arquivo**: `config/docker/docker-compose.staging.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: hub-defisats-postgres-staging
    environment:
      POSTGRES_DB: hubdefisats_staging
      POSTGRES_USER: hubdefisats_staging
      POSTGRES_PASSWORD: hubdefisats_staging_password_2024
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data
    networks:
      - hub-defisats-staging-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hubdefisats_staging -d hubdefisats_staging"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: hub-defisats-redis-staging
    command: redis-server --appendonly yes --requirepass hubdefisats_staging_redis_2024
    volumes:
      - redis_staging_data:/data
    networks:
      - hub-defisats-staging-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "hubdefisats_staging_redis_2024", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    container_name: hub-defisats-backend-staging
    env_file:
      - ../../.env.staging
    environment:
      NODE_ENV: staging
      PORT: 3010
      DATABASE_URL: postgresql://hubdefisats_staging:hubdefisats_staging_password_2024@postgres:5432/hubdefisats_staging?schema=public
      REDIS_URL: redis://:hubdefisats_staging_redis_2024@redis:6379
      JWT_SECRET: staging-jwt-secret-key-32-chars-minimum-2024
      REFRESH_TOKEN_SECRET: staging-refresh-secret-key-32-chars-minimum-2024
      ENCRYPTION_KEY: staging-encryption-key-32-chars-2024
      CORS_ORIGIN: https://staging.defisats.site
      VITE_API_URL: https://staging.defisats.site/api
    ports:
      - "13020:3010"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - hub-defisats-staging-network
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
    container_name: hub-defisats-frontend-staging
    environment:
      VITE_API_URL: https://staging.defisats.site/api
      NODE_ENV: staging
    ports:
      - "13010:3001"
    depends_on:
      - backend
    networks:
      - hub-defisats-staging-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Workers (opcionais)
  margin-monitor:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    container_name: hub-defisats-margin-monitor-staging
    command: ["npm", "run", "worker:margin-monitor"]
    env_file:
      - ../../.env.staging
    environment:
      NODE_ENV: staging
      DATABASE_URL: postgresql://hubdefisats_staging:hubdefisats_staging_password_2024@postgres:5432/hubdefisats_staging
      REDIS_URL: redis://:hubdefisats_staging_redis_2024@redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - hub-defisats-staging-network
    restart: unless-stopped

  # ... outros workers ...

volumes:
  postgres_staging_data:
    driver: local
  redis_staging_data:
    driver: local
  nginx_staging_logs:
    driver: local

networks:
  hub-defisats-staging-network:
    driver: bridge
```

### 3. Configuração do Nginx Staging

**Arquivo**: `config/docker/nginx/nginx-staging.conf`

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
    
    # Rate limiting (Staging - mais permissivo)
    limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=60r/s;
    
    # Upstream servers
    upstream backend {
        server hub-defisats-backend-staging:3010;
    }
    
    upstream frontend {
        server hub-defisats-frontend-staging:3001;
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
        add_header X-Environment "staging" always;
        
        # API routes
        location /api/ {
            limit_req zone=api burst=40 nodelay;
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
            limit_req zone=web burst=100 nodelay;
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

### 4. Configuração do Proxy Global

**Arquivo**: `~/proxy/conf.d/defisats.conf`

```nginx
# Staging Environment
server {
    listen 80;
    server_name staging.defisats.site;
    
    location / {
        proxy_pass http://hub-defisats-frontend-staging:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api-staging.defisats.site;
    
    location / {
        proxy_pass http://hub-defisats-backend-staging:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔧 TROUBLESHOOTING

### 1. Problemas Comuns

#### 1.1 Staging não inicia
```bash
# Verificar logs
docker compose -f config/docker/docker-compose.staging.yml logs

# Verificar variáveis de ambiente
docker exec hub-defisats-backend-staging env | grep -E "(DATABASE_URL|JWT_SECRET)"

# Verificar conectividade do banco
docker exec hub-defisats-backend-staging npx prisma db push
```

#### 1.2 Proxy não consegue acessar staging
```bash
# Verificar se containers estão na rede do proxy
docker network inspect proxy-network | grep staging

# Conectar containers manualmente
docker network connect proxy-network hub-defisats-backend-staging
docker network connect proxy-network hub-defisats-frontend-staging

# Testar conectividade interna
docker exec global-nginx-proxy curl -s http://hub-defisats-backend-staging:3010/health
```

#### 1.3 Frontend bloqueia acesso
```bash
# Verificar configuração do Vite
docker exec hub-defisats-frontend-staging cat /app/vite.config.js | grep allowedHosts

# Testar localmente
curl -s http://localhost:13010/ | head -5
```

### 2. Verificações de Saúde

#### 2.1 Status dos Serviços
```bash
# Verificar containers de staging
docker ps | grep staging

# Verificar health checks
docker inspect hub-defisats-backend-staging | grep -A 5 "Health"
docker inspect hub-defisats-frontend-staging | grep -A 5 "Health"
```

#### 2.2 Testes de Conectividade
```bash
# Testar frontend localmente
curl -I http://localhost:13010

# Testar API localmente
curl -I http://localhost:13020/health

# Testar através do proxy
docker exec global-nginx-proxy curl -s http://hub-defisats-backend-staging:3010/health
```

---

## 📊 MONITORAMENTO

### 1. Logs de Staging
```bash
# Logs em tempo real
docker compose -f config/docker/docker-compose.staging.yml logs -f

# Logs específicos
docker logs -f hub-defisats-backend-staging
docker logs -f hub-defisats-frontend-staging
```

### 2. Métricas de Sistema
```bash
# Uso de recursos
docker stats --no-stream | grep staging

# Uso de disco
docker system df
```

---

## 🔄 PROCEDIMENTOS DE MANUTENÇÃO

### 1. Backup do Staging
```bash
# Backup do banco de staging
docker exec hub-defisats-postgres-staging pg_dump -U hubdefisats_staging hubdefisats_staging > staging_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Atualizações
```bash
# Atualizar código
git pull origin develop

# Rebuild dos containers
docker compose -f config/docker/docker-compose.staging.yml build --no-cache

# Reiniciar staging
docker compose -f config/docker/docker-compose.staging.yml up -d
```

### 3. Limpeza
```bash
# Parar staging
docker compose -f config/docker/docker-compose.staging.yml down

# Remover volumes (cuidado!)
docker volume rm docker_postgres_staging_data docker_redis_staging_data
```

---

## 📝 DIFERENÇAS ENTRE STAGING E PRODUÇÃO

| Aspecto | Staging | Produção |
|---------|---------|----------|
| **Domínio** | staging.defisats.site | defisats.site |
| **API** | api-staging.defisats.site | api.defisats.site |
| **Banco** | hubdefisats_staging | hubdefisats_prod |
| **Redis** | hubdefisats_staging_redis_2024 | hubdefisats_redis_password_2024 |
| **JWT Secret** | staging-jwt-secret-... | production-jwt-secret-... |
| **LN Markets** | Sandbox | Production |
| **Log Level** | debug | info |
| **Rate Limit** | 20r/s (API), 60r/s (Web) | 10r/s (API), 30r/s (Web) |
| **Portas** | 13010, 13020, 15432, 16379 | 13000, 13010, 15432, 16379 |

---

## 🚨 PROCEDIMENTOS DE EMERGÊNCIA

### 1. Reinicialização Rápida
```bash
# Parar staging
docker compose -f config/docker/docker-compose.staging.yml down

# Iniciar staging
docker compose -f config/docker/docker-compose.staging.yml up -d

# Conectar ao proxy
docker network connect proxy-network hub-defisats-backend-staging
docker network connect proxy-network hub-defisats-frontend-staging

# Reiniciar proxy
cd ~/proxy && ./start-proxy.sh restart
```

### 2. Rollback
```bash
# Voltar para commit anterior
git log --oneline -5
git reset --hard HEAD~1

# Rebuild e restart
docker compose -f config/docker/docker-compose.staging.yml build --no-cache
docker compose -f config/docker/docker-compose.staging.yml up -d
```

---

## 📞 INFORMAÇÕES DE CONTATO

### URLs de Acesso
- **Frontend**: https://staging.defisats.site
- **API**: https://api-staging.defisats.site
- **Health Check**: https://api-staging.defisats.site/health

### Comandos de Verificação Rápida
```bash
# Status geral
docker ps | grep staging

# Teste de conectividade
curl -I https://staging.defisats.site
curl -I https://api-staging.defisats.site/health

# Logs recentes
docker logs --tail 10 hub-defisats-backend-staging
docker logs --tail 10 hub-defisats-frontend-staging
```

---

*Documentação criada em: 22 de Setembro de 2024*
*Versão: 1.0*
*Ambiente: Staging - defiSATS*
