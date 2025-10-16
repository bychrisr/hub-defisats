---
title: Docker Compose Deployment
category: deployment
subcategory: docker
tags: [docker, docker-compose, containers, orchestration, deployment]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["DevOps Team"]
---

# Docker Compose Deployment

## Summary

Comprehensive guide for deploying the Axisor platform using Docker Compose. This document covers development, production, and proxy configurations, including service orchestration, networking, volumes, and health checks.

## Docker Compose Architecture

```mermaid
graph TB
    A[Docker Compose Stack] --> B[Development Environment]
    A --> C[Production Environment]
    A --> D[Proxy Environment]
    
    B --> E[PostgreSQL]
    B --> F[Redis]
    B --> G[Backend API]
    B --> H[Frontend]
    B --> I[Workers]
    B --> J[LND Node]
    
    C --> K[Production Services]
    C --> L[Nginx Proxy]
    C --> M[Worker Services]
    
    D --> N[Global Nginx]
    D --> O[SSL Termination]
    
    E --> P[Health Checks]
    F --> P
    G --> P
    H --> P
    I --> P
```

## Development Environment

### Configuration Overview

The development environment (`config/docker/docker-compose.dev.yml`) provides a complete local development stack with hot reloading and debugging capabilities.

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: axisor-postgres
    environment:
      POSTGRES_DB: axisor
      POSTGRES_USER: axisor
      POSTGRES_PASSWORD: axisor_dev_password
    ports:
      - "15432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - axisor-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U axisor -d axisor"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Service Configuration

#### Backend Service

```yaml
backend:
  build:
    context: ../../backend
    dockerfile: Dockerfile.dev
  container_name: axisor-backend
  env_file:
    - ../env/.env.development
  environment:
    NODE_ENV: development
    DATABASE_URL: postgresql://axisor:axisor_dev_password@postgres:5432/axisor?schema=public
    REDIS_URL: redis://redis:6379
    PORT: 3010
    # LN Markets API Configuration
    LN_MARKETS_API_BASE_URL: "https://api.lnmarkets.com/v2"
    LN_MARKETS_API_BASE_URL_TESTNET: "https://api.testnet4.lnmarkets.com/v2"
    LN_MARKETS_API_BASE_URL_CURRENT: "https://api.lnmarkets.com/v2"
    # LND Configuration
    LND_TESTNET_ENABLED: "true"
    LND_TESTNET_BASE_URL: "https://lnd-testnet:8080"
  ports:
    - "13010:3010"
  volumes:
    - ../../backend:/app
    - ../../.system:/app/.system
    - /app/node_modules
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  command: npm run dev
  healthcheck:
    test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:3010/api/health-check', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
    interval: 30s
    timeout: 10s
    retries: 3
```

#### Frontend Service

```yaml
frontend:
  build:
    context: ../../frontend
    dockerfile: Dockerfile.dev
  container_name: axisor-frontend
  ports:
    - "13000:3001"
  volumes:
    - ../../frontend:/app
    - /app/node_modules
  depends_on:
    backend:
      condition: service_healthy
  networks:
    - axisor-network
  command: npm run dev
  healthcheck:
    test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:3001', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
    interval: 30s
    timeout: 10s
    retries: 3
```

#### Worker Services

```yaml
# Margin Monitor Worker
margin-monitor:
  build:
    context: ../../backend
    dockerfile: Dockerfile.dev
  container_name: axisor-margin-monitor
  environment:
    NODE_ENV: development
    DATABASE_URL: postgresql://axisor:axisor_dev_password@postgres:5432/axisor?schema=public
    REDIS_URL: redis://redis:6379
  volumes:
    - ../../backend:/app
    - /app/node_modules
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  command: npm run worker:margin-monitor
  profiles:
    - workers

# Automation Executor Worker
automation-executor:
  build:
    context: ../../backend
    dockerfile: Dockerfile.dev
  container_name: axisor-automation-executor
  environment:
    NODE_ENV: development
    DATABASE_URL: postgresql://axisor:axisor_dev_password@postgres:5432/axisor?schema=public
    REDIS_URL: redis://redis:6379
  volumes:
    - ../../backend:/app
    - /app/node_modules
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  command: npm run worker:automation-executor
  profiles:
    - workers

# Notification Worker
notification-worker:
  build:
    context: ../../backend
    dockerfile: Dockerfile.dev
  container_name: axisor-notification-worker
  environment:
    NODE_ENV: development
    DATABASE_URL: postgresql://axisor:axisor_dev_password@postgres:5432/axisor?schema=public
    REDIS_URL: redis://redis:6379
  volumes:
    - ../../backend:/app
    - /app/node_modules
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  command: npm run worker:notification
  profiles:
    - workers

# Payment Validator Worker
payment-validator:
  build:
    context: ../../backend
    dockerfile: Dockerfile.dev
  container_name: axisor-payment-validator
  environment:
    NODE_ENV: development
    DATABASE_URL: postgresql://axisor:axisor_dev_password@postgres:5432/axisor?schema=public
    REDIS_URL: redis://redis:6379
  volumes:
    - ../../backend:/app
    - /app/node_modules
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  command: npm run worker:payment-validator
  profiles:
    - workers
```

#### LND Testnet Node

```yaml
lnd-testnet:
  image: lightninglabs/lnd:v0.17.0-beta
  container_name: axisor-lnd-testnet
  environment:
    - LND_TLSAUTOREFRESH=1
    - LND_TLSEXTRADOMAIN=lnd-testnet
  ports:
    - "19735:9735"  # P2P
    - "20009:10009" # gRPC
    - "18080:8080"  # REST
  volumes:
    - lnd_testnet_data:/lnd
  networks:
    - axisor-network
  command: >
    lnd 
    --bitcoin.active
    --bitcoin.testnet
    --bitcoin.node=neutrino
    --neutrino.addpeer=faucet.lightning.community
    --neutrino.addpeer=btcd-testnet.lightning.computer
    --alias=Axisor-Testnet-Node
    --color=#FF6B35
    --listen=0.0.0.0:9735
    --rpclisten=0.0.0.0:10009
    --restlisten=0.0.0.0:8080
    --accept-keysend
    --accept-amp
    --debuglevel=info
  healthcheck:
    test: ["CMD", "lndcli", "--network=testnet", "getinfo"]
    interval: 30s
    timeout: 10s
    retries: 5
  profiles:
    - lnd
```

### Development Commands

```bash
# Start all services
docker-compose -f config/docker/docker-compose.dev.yml up -d

# Start with workers
docker-compose -f config/docker/docker-compose.dev.yml --profile workers up -d

# Start with LND node
docker-compose -f config/docker/docker-compose.dev.yml --profile lnd up -d

# Start everything including workers and LND
docker-compose -f config/docker/docker-compose.dev.yml --profile workers --profile lnd up -d

# View logs
docker-compose -f config/docker/docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f config/docker/docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f config/docker/docker-compose.dev.yml down -v
```

## Production Environment

### Configuration Overview

The production environment (`config/docker/docker-compose.prod.yml`) provides a production-ready stack with optimized settings, security configurations, and monitoring.

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: axisor-postgres
    environment:
      POSTGRES_DB: axisor
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/prisma/migrations:/docker-entrypoint-initdb.d/migrations
    networks:
      - axisor-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d axisor"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Production Service Configuration

#### Backend Service

```yaml
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
    DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/axisor
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    JWT_SECRET: ${JWT_SECRET}
    ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    LN_MARKETS_API_KEY: ${LN_MARKETS_API_KEY}
    LN_MARKETS_API_SECRET: ${LN_MARKETS_API_SECRET}
    LN_MARKETS_PASSPHRASE: ${LN_MARKETS_PASSPHRASE}
    EVOLUTION_API_URL: ${EVOLUTION_API_URL}
    EVOLUTION_API_KEY: ${EVOLUTION_API_KEY}
    HCAPTCHA_SECRET_KEY: ${HCAPTCHA_SECRET_KEY}
    RECAPTCHA_SECRET_KEY: ${RECAPTCHA_SECRET_KEY}
    RECAPTCHA_V3_SECRET_KEY: ${RECAPTCHA_V3_SECRET_KEY}
    SMTP_HOST: ${SMTP_HOST}
    SMTP_PORT: ${SMTP_PORT}
    SMTP_USER: ${SMTP_USER}
    SMTP_PASS: ${SMTP_PASS}
    SLACK_WEBHOOK_URL: ${SLACK_WEBHOOK_URL}
    SENTRY_DSN: ${SENTRY_DSN}
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
```

#### Frontend Service

```yaml
frontend:
  build:
    context: ../../frontend
    dockerfile: Dockerfile
  container_name: axisor-frontend
  environment:
    VITE_API_URL: ${VITE_API_URL:-http://localhost:3010}
    VITE_WS_URL: ${VITE_WS_URL:-ws://localhost:3010}
    VITE_HCAPTCHA_SITE_KEY: ${VITE_HCAPTCHA_SITE_KEY}
    VITE_RECAPTCHA_SITE_KEY: ${VITE_RECAPTCHA_SITE_KEY}
    VITE_RECAPTCHA_V3_SITE_KEY: ${VITE_RECAPTCHA_V3_SITE_KEY}
    VITE_SENTRY_DSN: ${VITE_SENTRY_DSN}
  ports:
    - "8080:80"
  depends_on:
    - backend
  networks:
    - axisor-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost"]
    interval: 30s
    timeout: 10s
    retries: 3
```

#### Nginx Reverse Proxy

```yaml
nginx:
  image: nginx:alpine
  container_name: axisor-nginx
  ports:
    - "8443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
    - nginx_logs:/var/log/nginx
  depends_on:
    - backend
    - frontend
  networks:
    - axisor-network
  restart: unless-stopped
```

#### Production Worker Services

```yaml
# Margin Monitor Worker
margin-monitor:
  build:
    context: ../../backend
    dockerfile: Dockerfile
  container_name: axisor-margin-monitor
  command: ["npm", "run", "worker:margin-monitor"]
  environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/axisor
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    JWT_SECRET: ${JWT_SECRET}
    ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    LN_MARKETS_API_KEY: ${LN_MARKETS_API_KEY}
    LN_MARKETS_API_SECRET: ${LN_MARKETS_API_SECRET}
    LN_MARKETS_PASSPHRASE: ${LN_MARKETS_PASSPHRASE}
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  restart: unless-stopped

# Automation Executor Worker
automation-executor:
  build:
    context: ../../backend
    dockerfile: Dockerfile
  container_name: axisor-automation-executor
  command: ["npm", "run", "worker:automation-executor"]
  environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/axisor
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    JWT_SECRET: ${JWT_SECRET}
    ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    LN_MARKETS_API_KEY: ${LN_MARKETS_API_KEY}
    LN_MARKETS_API_SECRET: ${LN_MARKETS_API_SECRET}
    LN_MARKETS_PASSPHRASE: ${LN_MARKETS_PASSPHRASE}
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  restart: unless-stopped

# Notification Worker
notification-worker:
  build:
    context: ../../backend
    dockerfile: Dockerfile
  container_name: axisor-notification-worker
  command: ["npm", "run", "worker:notification"]
  environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/axisor
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    EVOLUTION_API_URL: ${EVOLUTION_API_URL}
    EVOLUTION_API_KEY: ${EVOLUTION_API_KEY}
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  restart: unless-stopped

# Payment Validator Worker
payment-validator:
  build:
    context: ../../backend
    dockerfile: Dockerfile
  container_name: axisor-payment-validator
  command: ["npm", "run", "worker:payment-validator"]
  environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/axisor
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    LN_MARKETS_API_KEY: ${LN_MARKETS_API_KEY}
    LN_MARKETS_API_SECRET: ${LN_MARKETS_API_SECRET}
    LN_MARKETS_PASSPHRASE: ${LN_MARKETS_PASSPHRASE}
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  restart: unless-stopped

# Simulation Executor Worker
simulation-executor:
  build:
    context: ../../backend
    dockerfile: Dockerfile
  container_name: axisor-simulation-executor
  command: ["npm", "run", "worker:simulation-executor"]
  environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/axisor
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - axisor-network
  restart: unless-stopped
```

### Production Commands

```bash
# Build and start production services
docker-compose -f config/docker/docker-compose.prod.yml up -d --build

# View logs
docker-compose -f config/docker/docker-compose.prod.yml logs -f

# Stop services
docker-compose -f config/docker/docker-compose.prod.yml down

# Update services
docker-compose -f config/docker/docker-compose.prod.yml pull
docker-compose -f config/docker/docker-compose.prod.yml up -d

# Scale backend service
docker-compose -f config/docker/docker-compose.prod.yml up -d --scale backend=3
```

## Proxy Environment

### Global Nginx Proxy

The proxy environment (`proxy/docker-compose.yml`) provides a global reverse proxy for multiple services.

```yaml
version: '3.8'

services:
  global-nginx-proxy:
    image: nginx:alpine
    container_name: global-nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./conf.d:/etc/nginx/conf.d:ro
      - ./certs:/etc/nginx/certs:ro
      - ./logs:/var/log/nginx
    networks:
      - proxy-network
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  proxy-network:
    external: true
```

### Proxy Commands

```bash
# Start proxy
docker-compose -f proxy/docker-compose.yml up -d

# Reload nginx configuration
docker-compose -f proxy/docker-compose.yml exec global-nginx-proxy nginx -s reload

# View proxy logs
docker-compose -f proxy/docker-compose.yml logs -f
```

## Networking

### Network Configuration

```yaml
networks:
  axisor-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Service Communication

```yaml
# Backend can communicate with database and cache
backend:
  networks:
    - axisor-network
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy

# Frontend can communicate with backend
frontend:
  networks:
    - axisor-network
  depends_on:
    backend:
      condition: service_healthy
```

## Volumes

### Volume Configuration

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/postgres
  
  redis_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/redis
  
  nginx_logs:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./logs/nginx
  
  lnd_testnet_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/lnd/testnet
  
  lnd_mainnet_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/lnd/mainnet
```

### Volume Management

```bash
# Create volume directories
mkdir -p data/postgres data/redis logs/nginx data/lnd/testnet data/lnd/mainnet

# Set proper permissions
sudo chown -R 999:999 data/postgres
sudo chown -R 999:999 data/redis
sudo chown -R 1001:1001 data/lnd/testnet
sudo chown -R 1001:1001 data/lnd/mainnet

# Backup volumes
docker run --rm -v axisor_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
docker run --rm -v axisor_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v axisor_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
docker run --rm -v axisor_redis_data:/data -v $(pwd):/backup alpine tar xzf /backup/redis_backup.tar.gz -C /data
```

## Health Checks

### Health Check Configuration

```yaml
# Database health check
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d axisor"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s

# Redis health check
redis:
  healthcheck:
    test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 10s

# Backend health check
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3010/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s

# Frontend health check
frontend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

### Health Check Monitoring

```bash
# Check service health
docker-compose ps

# Check health status
docker inspect --format='{{.State.Health.Status}}' axisor-postgres
docker inspect --format='{{.State.Health.Status}}' axisor-redis
docker inspect --format='{{.State.Health.Status}}' axisor-backend
docker inspect --format='{{.State.Health.Status}}' axisor-frontend

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' axisor-backend
```

## Environment Variables

### Required Environment Variables

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/axisor

# Redis Configuration
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://:your_redis_password@redis:6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ENCRYPTION_KEY=your_encryption_key

# LN Markets API
LN_MARKETS_API_KEY=your_api_key
LN_MARKETS_API_SECRET=your_api_secret
LN_MARKETS_PASSPHRASE=your_passphrase

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# Notification Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EVOLUTION_API_URL=https://api.evolution.com
EVOLUTION_API_KEY=your_evolution_api_key

# Security
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
RECAPTCHA_V3_SECRET_KEY=your_recaptcha_v3_secret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Environment File Template

```bash
# Copy template
cp .env.example .env

# Edit environment file
nano .env

# Validate environment variables
docker-compose config
```

## Troubleshooting

### Common Issues

#### Service Startup Issues

```bash
# Check service logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# Check service status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

#### Database Connection Issues

```bash
# Check database connectivity
docker-compose exec backend npx prisma db push

# Reset database
docker-compose exec backend npx prisma db push --force-reset

# Check database logs
docker-compose logs postgres
```

#### Redis Connection Issues

```bash
# Check Redis connectivity
docker-compose exec backend redis-cli -h redis -a your_redis_password ping

# Check Redis logs
docker-compose logs redis
```

#### Port Conflicts

```bash
# Check port usage
netstat -tulpn | grep :3010
netstat -tulpn | grep :5432
netstat -tulpn | grep :6379

# Change ports in docker-compose.yml
ports:
  - "13010:3010"  # Change 13010 to available port
```

### Performance Optimization

#### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

#### Logging Configuration

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## How to Use This Document

- **For Development**: Use the development environment configuration for local development
- **For Production**: Use the production environment configuration for production deployments
- **For Proxy Setup**: Use the proxy environment for global reverse proxy configuration
- **For Troubleshooting**: Reference the troubleshooting section for common issues
- **For Monitoring**: Use the health check configurations for service monitoring