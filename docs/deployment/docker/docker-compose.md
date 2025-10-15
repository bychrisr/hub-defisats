---
title: "Docker Compose - Deployment Configuration"
version: "1.0.0"
created: "2025-01-26"
updated: "2025-01-26"
author: "Documentation Agent"
status: "active"
tags: ["deployment", "docker", "docker-compose", "infrastructure"]
---

# Docker Compose - Deployment Configuration

> **Status**: Active  
> **Última Atualização**: 2025-01-26  
> **Versão**: 1.0.0  
> **Responsável**: Axisor DevOps Team  

## Índice

- [Visão Geral](#visão-geral)
- [Configuração Base](#configuração-base)
- [Ambientes](#ambientes)
- [Serviços](#serviços)
- [Volumes e Networks](#volumes-e-networks)
- [Health Checks](#health-checks)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

## Visão Geral

O Axisor utiliza Docker Compose para orquestração de containers em ambientes de desenvolvimento e produção. A configuração suporta múltiplos ambientes com diferentes níveis de recursos e serviços.

## Configuração Base

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    ports:
      - "13000:80"
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://backend:13010
    depends_on:
      - backend
    networks:
      - axisor-network
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "13010:13010"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/axisor
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - axisor-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:13010/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=axisor
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - axisor-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - axisor-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - axisor-network
    restart: unless-stopped

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - axisor-network
    restart: unless-stopped

  # Grafana Dashboard
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana-dashboard.json:/etc/grafana/provisioning/dashboards/dashboard.json
    networks:
      - axisor-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  axisor-network:
    driver: bridge
```

## Ambientes

### Development (docker-compose.dev.yml)

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
      target: development
    ports:
      - "13000:13000"
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:13010
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "13010:13010"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/axisor_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

  postgres:
    environment:
      - POSTGRES_DB=axisor_dev
    ports:
      - "5433:5432"  # Different port for dev

  redis:
    command: redis-server --appendonly yes  # No password in dev
```

### Production (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      target: production
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://api.axisor.com
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  postgres:
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  nginx:
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    deploy:
      replicas: 2
```

## Serviços

### Frontend Service

```dockerfile
# Dockerfile (frontend)
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Service

```dockerfile
# Dockerfile.prod (backend)
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs
EXPOSE 13010
CMD ["node", "dist/index.js"]
```

## Volumes e Networks

### Volume Configuration

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/docker/volumes/axisor_postgres

  redis_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/docker/volumes/axisor_redis

  prometheus_data:
    driver: local

  grafana_data:
    driver: local
```

### Network Configuration

```yaml
networks:
  axisor-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
    driver_opts:
      com.docker.network.bridge.name: axisor-br
```

## Health Checks

### Service Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:13010/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Database Health Check

```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres -d axisor"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s
```

### Redis Health Check

```yaml
redis:
  healthcheck:
    test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
    interval: 10s
    timeout: 3s
    retries: 3
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose up --scale backend=3 --scale frontend=2

# Scale with resource limits
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up
```

### docker-compose.scale.yml

```yaml
version: '3.8'

services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

  frontend:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M
```

## Troubleshooting

### Common Issues

#### Service Not Starting

```bash
# Check service logs
docker-compose logs backend
docker-compose logs postgres

# Check service status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

#### Database Connection Issues

```bash
# Test database connection
docker-compose exec backend npm run test:db

# Check database logs
docker-compose logs postgres

# Access database directly
docker-compose exec postgres psql -U postgres -d axisor
```

#### Memory Issues

```bash
# Check resource usage
docker stats

# Increase memory limits
docker-compose up --scale backend=2

# Monitor with Prometheus
curl http://localhost:9090/targets
```

### Debug Commands

```bash
# Build and run with debug
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up

# Execute commands in running container
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres

# View service configuration
docker-compose config
```

## Referências

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Configuration](../../nginx/nginx.conf)
- [Database Setup](../database-setup.md)
- [Monitoring Setup](../monitoring-setup.md)

## Como Usar Este Documento

• **Para Desenvolvedores**: Use como referência para configurar o ambiente de desenvolvimento local.

• **Para DevOps**: Utilize para deploy e gerenciamento de ambientes de produção.

• **Para Troubleshooting**: Use os comandos de debug para diagnosticar problemas de deployment.
