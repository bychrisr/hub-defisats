# Configurações do Hub DeFiSats

Esta pasta contém todas as configurações do projeto organizadas por categoria.

## 📁 Estrutura

```
config/
├── docker/         # Arquivos Docker Compose
├── env/            # Arquivos de ambiente
└── README.md       # Este arquivo
```

## 🐳 Docker Compose (`docker/`)

### `docker-compose.dev.yml`
Configuração para desenvolvimento local.

```bash
docker compose -f config/docker/docker-compose.dev.yml up -d
```

**Serviços incluídos:**
- PostgreSQL (porta 5432)
- Redis (porta 6379)
- Backend (porta 13010)
- Frontend (porta 13000)

### `docker-compose.prod.yml`
Configuração para produção.

```bash
docker compose -f config/docker/docker-compose.prod.yml up -d
```

**Características:**
- SSL/TLS habilitado
- Nginx como proxy reverso
- Configurações otimizadas
- Health checks

### `docker-compose.staging.yml`
Configuração para ambiente de staging.

```bash
docker compose -f config/docker/docker-compose.staging.yml up -d
```

### `docker-compose.test.yml`
Configuração para testes automatizados.

```bash
docker compose -f config/docker/docker-compose.test.yml up -d
```

### `docker-compose.monitoring.yml`
Configuração para monitoramento (Prometheus + Grafana).

```bash
docker compose -f config/docker/docker-compose.monitoring.yml up -d
```

## 🌍 Variáveis de Ambiente (`env/`)

### `.env.development`
Configurações para desenvolvimento local.

```bash
# Copiar para .env
cp config/env/.env.development .env
```

**Variáveis principais:**
- `NODE_ENV=development`
- `PORT=13010`
- `DATABASE_URL=postgresql://...`
- `REDIS_URL=redis://...`

### `.env.production`
Configurações para produção.

```bash
# Copiar para .env
cp config/env/.env.production .env
```

**Características:**
- Configurações de segurança
- URLs de produção
- Chaves de API reais
- SSL habilitado

### `.env.staging`
Configurações para ambiente de staging.

```bash
# Copiar para .env
cp config/env/.env.staging .env
```

### `env.production.example`
Template para configuração de produção.

```bash
# Copiar e personalizar
cp config/env/env.production.example .env.production
```

## 🔧 Configuração Rápida

### Desenvolvimento
```bash
# 1. Copiar variáveis de ambiente
cp config/env/.env.development .env

# 2. Iniciar serviços
docker compose -f config/docker/docker-compose.dev.yml up -d

# 3. Executar migrações
docker exec hub-defisats-backend-dev npx prisma migrate dev

# 4. Acessar aplicação
# Frontend: http://localhost:13000
# Backend: http://localhost:13010
```

### Produção
```bash
# 1. Copiar variáveis de ambiente
cp config/env/.env.production .env

# 2. Configurar SSL (se necessário)
# 3. Iniciar serviços
docker compose -f config/docker/docker-compose.prod.yml up -d

# 4. Executar migrações
docker exec hub-defisats-backend-prod npx prisma migrate deploy
```

### Staging
```bash
# 1. Copiar variáveis de ambiente
cp config/env/.env.staging .env

# 2. Iniciar serviços
docker compose -f config/docker/docker-compose.staging.yml up -d
```

## 🔒 Segurança

### Variáveis Sensíveis
- **JWT_SECRET**: Chave secreta para JWT (32+ caracteres)
- **ENCRYPTION_KEY**: Chave de criptografia (32 caracteres)
- **LN_MARKETS_***: Credenciais da API LN Markets
- **DATABASE_URL**: URL do banco de dados
- **REDIS_URL**: URL do Redis

### Boas Práticas
1. **Nunca commitar** arquivos `.env` com dados reais
2. **Usar** `env.*.example` como template
3. **Rotacionar** chaves regularmente
4. **Usar** variáveis de ambiente do sistema quando possível
5. **Validar** configurações antes do deploy

## 📊 Monitoramento

### Health Checks
```bash
# Backend
curl http://localhost:13010/health

# Frontend
curl http://localhost:13000

# Banco de dados
docker exec hub-defisats-postgres-dev pg_isready
```

### Logs
```bash
# Todos os serviços
docker compose -f config/docker/docker-compose.dev.yml logs

# Serviço específico
docker compose -f config/docker/docker-compose.dev.yml logs backend
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Porta em uso**:
   ```bash
   # Verificar portas
   netstat -tulpn | grep :13010
   
   # Matar processo
   sudo kill -9 <PID>
   ```

2. **Docker não inicia**:
   ```bash
   # Verificar logs
   docker compose -f config/docker/docker-compose.dev.yml logs
   
   # Rebuild
   docker compose -f config/docker/docker-compose.dev.yml up --build
   ```

3. **Banco não conecta**:
   ```bash
   # Verificar se PostgreSQL está rodando
   docker ps | grep postgres
   
   # Verificar logs do banco
   docker logs hub-defisats-postgres-dev
   ```

4. **Variáveis de ambiente**:
   ```bash
   # Verificar se arquivo .env existe
   ls -la .env
   
   # Verificar variáveis
   cat .env | grep DATABASE_URL
   ```

## 📋 Checklist de Deploy

### Desenvolvimento
- [ ] Arquivo `.env` configurado
- [ ] Docker rodando
- [ ] Portas livres (13000, 13010, 5432, 6379)
- [ ] Migrações executadas
- [ ] Testes passando

### Produção
- [ ] Arquivo `.env.production` configurado
- [ ] SSL configurado
- [ ] Domínio configurado
- [ ] Backup do banco
- [ ] Monitoramento ativo
- [ ] Logs configurados

## 📞 Suporte

Para problemas de configuração:
1. Verificar logs de erro
2. Consultar documentação específica
3. Abrir issue no GitHub
4. Contatar: dev@hub-defisats.com

---

**Última atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento
