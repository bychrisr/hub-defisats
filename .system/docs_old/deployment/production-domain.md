# Configuração de Produção - defisats.site

## Domínios Configurados

- **Frontend**: https://defisats.site
- **API**: https://api.defisats.site
- **Documentação**: https://api.defisats.site/docs

## Estrutura de Produção

### Serviços
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e filas
- **Backend**: API Node.js na porta 3000 (interno)
- **Frontend**: React na porta 80 (interno)
- **Nginx**: Proxy reverso com SSL

### Portas Expostas
- **80**: HTTP (redireciona para HTTPS)
- **443**: HTTPS (Frontend e API)

### Configurações de Ambiente

#### Backend (.env)
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://axisor_prod:axisor_prod_password_secure_2024@postgres:5432/axisor_prod?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=production-jwt-secret-key-32-chars-minimum-2024
ENCRYPTION_KEY=production-encryption-key-32-chars-2024
CORS_ORIGIN=https://defisats.site
```

#### Frontend (.env)
```bash
VITE_API_URL=https://api.defisats.site
```

### SSL/TLS
- Certificados SSL em `/etc/nginx/certs/`
- TLS 1.2 e 1.3
- HSTS habilitado
- Headers de segurança configurados

### Rate Limiting
- **API geral**: 10 req/s
- **Login**: 5 req/min
- **Burst**: 20 requests

### Monitoramento
- Health checks configurados
- Logs estruturados
- Métricas Prometheus (porta 9090)

## Deploy

```bash
# 1. Configurar variáveis de ambiente
cp env.production .env

# 2. Iniciar serviços
docker compose -f docker-compose.prod.yml up -d

# 3. Executar migrações
docker exec axisor-backend-prod npx prisma migrate deploy

# 4. Verificar status
docker compose -f docker-compose.prod.yml ps
```

## Testes

```bash
# Health check
curl https://api.defisats.site/health

# Frontend
curl https://defisats.site

# API docs
curl https://api.defisats.site/docs
```

## Segurança

- HTTPS obrigatório
- Headers de segurança
- Rate limiting
- CORS configurado
- Bloqueio de arquivos sensíveis
- Validação de entrada
- Autenticação JWT
