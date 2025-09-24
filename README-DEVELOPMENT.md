# 🚀 Hub DeFiSats - Ambiente de Desenvolvimento

## 📋 Setup Rápido

### 1. Iniciar Ambiente de Desenvolvimento
```bash
# Executar script de setup completo
./setup-dev.sh
```

### 2. Criar Usuário de Teste
```bash
# Criar usuário de teste
./create-test-user.sh
```

## 🌐 Acesso aos Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:13000 | Interface principal |
| **Backend API** | http://localhost:13010 | API REST |
| **Database** | localhost:15432 | PostgreSQL |
| **Redis** | localhost:16379 | Cache & Queue |

## 👤 Usuário de Teste

- **Email**: `brainoschris@gmail.com`
- **Password**: `test123456`
- **Username**: `brainoschris`

## 🔧 Comandos Úteis

### Docker Compose
```bash
# Iniciar todos os serviços
docker compose -f config/docker/docker-compose.dev.yml up -d

# Parar todos os serviços
docker compose -f config/docker/docker-compose.dev.yml down

# Ver logs
docker compose -f config/docker/docker-compose.dev.yml logs -f

# Rebuild containers
docker compose -f config/docker/docker-compose.dev.yml up -d --build

# Status dos containers
docker compose -f config/docker/docker-compose.dev.yml ps
```

### Banco de Dados
```bash
# Executar migrações
docker exec hub-defisats-backend npx prisma migrate dev

# Reset do banco
docker exec hub-defisats-backend npx prisma migrate reset

# Acessar banco via CLI
docker exec -it hub-defisats-postgres psql -U hubdefisats -d hubdefisats
```

### Workers (Opcionais)
```bash
# Iniciar workers
docker compose -f config/docker/docker-compose.dev.yml --profile workers up -d

# Ver logs dos workers
docker compose -f config/docker/docker-compose.dev.yml logs -f margin-monitor automation-executor
```

## 🏗️ Estrutura do Projeto

```
hub-defisats/
├── backend/                 # API Node.js + TypeScript
├── frontend/                # React + Vite + TypeScript
├── config/                  # Configurações Docker e ambiente
│   ├── docker/             # Docker Compose files
│   └── env/                # Variáveis de ambiente
├── setup-dev.sh            # Script de setup automático
├── create-test-user.sh      # Script para criar usuário de teste
└── README-DEVELOPMENT.md   # Este arquivo
```

## 🔍 Troubleshooting

### Problema: "Port already in use"
```bash
# Verificar portas em uso
netstat -tulpn | grep :13000
netstat -tulpn | grep :13010

# Matar processo
sudo kill -9 <PID>
```

### Problema: "Container não inicia"
```bash
# Verificar logs
docker compose -f config/docker/docker-compose.dev.yml logs backend

# Rebuild completo
docker compose -f config/docker/docker-compose.dev.yml down
docker compose -f config/docker/docker-compose.dev.yml up -d --build
```

### Problema: "Database connection failed"
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs do banco
docker logs hub-defisats-postgres

# Reset do banco
docker exec hub-defisats-backend npx prisma migrate reset
```

### Problema: "Frontend não carrega"
```bash
# Verificar se frontend está rodando
docker ps | grep frontend

# Verificar logs do frontend
docker logs hub-defisats-frontend

# Rebuild frontend
docker compose -f config/docker/docker-compose.dev.yml up -d --build frontend
```

## 📊 Health Checks

```bash
# Backend
curl http://localhost:13010/health

# Frontend
curl http://localhost:13000

# Database
docker exec hub-defisats-postgres pg_isready -U hubdefisats -d hubdefisats

# Redis
docker exec hub-defisats-redis redis-cli ping
```

## 🧪 Testes

```bash
# Testes do backend
cd backend && npm test

# Testes E2E
cd backend && npm run test:e2e

# Testes de integração
cd backend && npm run test:integration
```

## 📝 Desenvolvimento

### Hot Reload
- **Backend**: Modificações no código são refletidas automaticamente
- **Frontend**: Modificações no código são refletidas automaticamente
- **Database**: Use Prisma Studio para visualizar dados: `npx prisma studio`

### Estrutura de Desenvolvimento
- **Backend**: `backend/src/` - Código fonte da API
- **Frontend**: `frontend/src/` - Código fonte da interface
- **Config**: `config/` - Configurações Docker e ambiente
- **Scripts**: Scripts de automação na raiz do projeto

## 🔒 Segurança

- **Desenvolvimento**: Usa chaves de desenvolvimento (não usar em produção)
- **Banco**: Senha simples para desenvolvimento
- **API Keys**: Usa sandbox do LN Markets
- **CORS**: Configurado para localhost

## 📞 Suporte

Para problemas de desenvolvimento:
1. Verificar logs dos containers
2. Executar health checks
3. Consultar este README
4. Verificar documentação específica em `config/README.md`

---

**Última atualização**: 2025-01-19  
**Ambiente**: Desenvolvimento Local  
**Status**: ✅ Pronto para uso
