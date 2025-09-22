# 🚀 Hub DefiSats - Comandos Rápidos

## 🔐 Acesso e Credenciais
```bash
# Super Admin
Email: admin@defisats.com
Password: password

# Acesso SSH
ssh user@defisats.site
cd /home/bychrisr/projects/hub-defisats
```

## 🐳 Docker - Comandos Essenciais

### Status e Controle
```bash
# Ver status dos containers
docker compose -f docker-compose.prod.yml ps

# Parar todos os serviços
docker compose -f docker-compose.prod.yml down

# Iniciar todos os serviços
docker compose -f docker-compose.prod.yml up -d

# Restart de um serviço específico
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
```

### Logs
```bash
# Todos os logs
docker compose -f docker-compose.prod.yml logs --follow

# Backend logs
docker compose -f docker-compose.prod.yml logs backend --follow --tail=50

# PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres --follow

# Redis logs
docker compose -f docker-compose.prod.yml logs redis --follow
```

### Acesso aos Containers
```bash
# Backend
docker compose -f docker-compose.prod.yml exec backend bash

# PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U hubdefisats_prod -d hubdefisats_prod

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli
```

## 🗄️ Banco de Dados

### Comandos SQL
```bash
# Conectar ao banco
docker compose -f docker-compose.prod.yml exec postgres psql -U hubdefisats_prod -d hubdefisats_prod

# Ver usuários
docker compose -f docker-compose.prod.yml exec postgres psql -U hubdefisats_prod -d hubdefisats_prod -c "SELECT email, username, is_active FROM \"User\";"

# Ver admins
docker compose -f docker-compose.prod.yml exec postgres psql -U hubdefisats_prod -d hubdefisats_prod -c "SELECT u.email, u.username, au.role FROM \"User\" u LEFT JOIN \"AdminUser\" au ON u.id = au.user_id WHERE au.role IS NOT NULL;"

# Backup
docker exec hub-defisats-postgres-prod pg_dump -U hubdefisats_prod hubdefisats_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Migrações
```bash
# Executar migrações
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Sincronizar schema
docker compose -f docker-compose.prod.yml exec backend npx prisma db push

# Reset do banco (CUIDADO)
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate reset
```

## 🔄 Deploy

### Deploy Automático
```bash
# Deploy completo
./scripts/deploy/deploy-prod-enhanced.sh

# Deploy simples
./scripts/deploy/deploy-prod.sh

# Verificar produção
./scripts/deploy/check-production.sh
```

### Deploy Manual
```bash
# 1. Parar serviços
docker compose -f docker-compose.prod.yml down

# 2. Rebuild
docker compose -f docker-compose.prod.yml build --no-cache

# 3. Iniciar
docker compose -f docker-compose.prod.yml up -d

# 4. Migrações
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## 👤 Administração

### Criar Usuários
```bash
# Super admin
./scripts/admin/create-super-admin.sh admin@defisats.com admin password

# Admin via Node.js
node scripts/admin/create-admin.js
```

### Gerenciar Usuários
```bash
# Listar usuários
docker compose -f docker-compose.prod.yml exec postgres psql -U hubdefisats_prod -d hubdefisats_prod -c "SELECT id, email, username, is_active, created_at FROM \"User\" ORDER BY created_at DESC;"

# Ativar/desativar usuário
docker compose -f docker-compose.prod.yml exec postgres psql -U hubdefisats_prod -d hubdefisats_prod -c "UPDATE \"User\" SET is_active = true WHERE email = 'user@example.com';"

# Deletar usuário
docker compose -f docker-compose.prod.yml exec postgres psql -U hubdefisats_prod -d hubdefisats_prod -c "DELETE FROM \"User\" WHERE email = 'user@example.com';"
```

## 🔍 Troubleshooting

### Verificar Saúde
```bash
# Backend
curl http://localhost:13010/health

# Frontend
curl http://localhost/health

# PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U hubdefisats_prod

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

### Problemas Comuns
```bash
# Backend não inicia
docker compose -f docker-compose.prod.yml logs backend

# Erro de banco
docker compose -f docker-compose.prod.yml exec backend npx prisma db push

# Limpar cache Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL

# Verificar variáveis de ambiente
docker compose -f docker-compose.prod.yml exec backend env | grep -E "(DATABASE|REDIS|JWT)"
```

### Reset Completo
```bash
# 1. Parar tudo
docker compose -f docker-compose.prod.yml down

# 2. Remover volumes (CUIDADO: apaga dados)
docker volume rm hub-defisats_postgres_data hub-defisats_redis_data

# 3. Rebuild
docker compose -f docker-compose.prod.yml build --no-cache

# 4. Iniciar
docker compose -f docker-compose.prod.yml up -d

# 5. Migrações
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 6. Criar super admin
./scripts/admin/create-super-admin.sh admin@defisats.com admin password
```

## 📊 Monitoramento

### Recursos do Sistema
```bash
# Uso de recursos
docker stats

# Espaço em disco
df -h

# Uso de memória
free -h

# Processos Docker
ps aux | grep docker
```

### Logs do Sistema
```bash
# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Sistema logs
tail -f /var/log/syslog

# Docker logs
docker compose -f docker-compose.prod.yml logs --follow
```

## 🔧 Manutenção

### Limpeza
```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Remover volumes não utilizados
docker volume prune

# Limpeza completa (CUIDADO)
docker system prune -a
```

### Backup
```bash
# Backup do banco
docker exec hub-defisats-postgres-prod pg_dump -U hubdefisats_prod hubdefisats_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup dos volumes
docker run --rm -v hub-defisats_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

## 🌐 URLs e Portas

### URLs de Acesso
- **Frontend:** https://defisats.site
- **Backend API:** https://defisats.site/api
- **Health Check:** https://defisats.site/health

### Portas Internas
- **Backend:** 13010 (externa) → 3010 (interna)
- **PostgreSQL:** 5432
- **Redis:** 6379
- **Nginx:** 80, 443

### Testes de Conectividade
```bash
# Testar API
curl -X GET "https://defisats.site/api/health"

# Testar login
curl -X POST "https://defisats.site/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@defisats.com","password":"password"}'

# Testar endpoints públicos
curl -X GET "https://defisats.site/api/cards-with-tooltips"
curl -X GET "https://defisats.site/api/market/index/public"
```

## 🚨 Emergência

### Parar Tudo
```bash
docker compose -f docker-compose.prod.yml down
```

### Iniciar Tudo
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Verificar Status
```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost:13010/health
```

### Logs de Erro
```bash
docker compose -f docker-compose.prod.yml logs --tail=100 | grep -i error
```

---

**💡 Dica:** Use `docker compose -f docker-compose.prod.yml` em todos os comandos para garantir que está trabalhando com o ambiente de produção.

**⚠️ Cuidado:** Comandos que modificam dados (como `prisma migrate reset` ou `docker volume rm`) podem causar perda de dados. Sempre faça backup antes.

**📞 Suporte:** Para problemas complexos, consulte o arquivo `SERVIDOR_COMPLETO_DOCUMENTACAO.md` para documentação detalhada.
