# 🚀 Aliases para Hub DeFiSats Development

Este arquivo contém todos os aliases disponíveis para facilitar o desenvolvimento e gerenciamento dos ambientes.

## 📋 **ALIASES PRINCIPAIS**

### **Desenvolvimento**
```bash
# Comandos completos:
alias dev-up='docker compose -f docker-compose.dev.yml up -d --remove-orphans'
alias dev-down='docker compose -f docker-compose.dev.yml down'
alias dev-logs='docker compose -f docker-compose.dev.yml logs -f'
alias dev-restart='docker compose -f docker-compose.dev.yml restart'
alias dev-status='docker compose -f docker-compose.dev.yml ps'
```

### **Staging**
```bash
# Comandos completos:
alias staging-up='docker compose -f docker-compose.staging.yml up -d'
alias staging-down='docker compose -f docker-compose.staging.yml down'
alias staging-logs='docker compose -f docker-compose.staging.yml logs -f'
alias staging-restart='docker compose -f docker-compose.staging.yml restart'
alias staging-status='docker compose -f docker-compose.staging.yml ps'
alias staging-setup='./scripts/setup-staging.sh'
```

### **Produção**
```bash
# Comandos completos:
alias prod-up='docker compose -f docker-compose.prod.yml up -d'
alias prod-down='docker compose -f docker-compose.prod.yml down'
alias prod-logs='docker compose -f docker-compose.prod.yml logs -f'
alias prod-restart='docker compose -f docker-compose.prod.yml restart'
alias prod-status='docker compose -f docker-compose.prod.yml ps'
```

## 🔧 **UTILITÁRIOS DOCKER**

```bash
# Comandos completos:
alias docker-clean='docker system prune -f && docker volume prune -f'
alias docker-all='docker ps -a'
alias docker-images='docker images'
```

## 🌐 **ACESSO RÁPIDO AOS SERVIÇOS**

### **Desenvolvimento**
```bash
# Comandos completos:
alias dev-frontend='open http://localhost:3000'
alias dev-backend='open http://localhost:3001'
```

### **Staging**
```bash
# Comandos completos:
alias staging-frontend='open http://localhost:23010'
alias staging-backend='open http://localhost:23020'
```

### **Produção**
```bash
# Comandos completos:
alias prod-frontend='open http://localhost:23001'
alias prod-backend='open http://localhost:23000'
```

## 📊 **LOGS ESPECÍFICOS**

### **Desenvolvimento**
```bash
# Comandos completos:
alias dev-backend-logs='docker compose -f docker-compose.dev.yml logs -f backend'
alias dev-frontend-logs='docker compose -f docker-compose.dev.yml logs -f frontend'
```

### **Staging**
```bash
# Comandos completos:
alias staging-backend-logs='docker compose -f docker-compose.staging.yml logs -f backend-staging'
alias staging-frontend-logs='docker compose -f docker-compose.staging.yml logs -f frontend-staging'
```

## 🗄️ **BANCO DE DADOS**

```bash
# Comandos completos:
alias dev-db='docker exec -it hub-defisats-postgres-dev psql -U hubdefisats -d defisats_dev'
alias staging-db='docker exec -it hub-defisats-postgres-staging psql -U hubdefisats -d defisats_staging'
alias prod-db='docker exec -it hub-defisats-postgres-prod psql -U hubdefisats -d defisats_prod'
```

## 🔄 **PRISMA**

```bash
# Comandos completos:
alias dev-prisma='docker exec -it hub-defisats-backend-dev npx prisma'
alias staging-prisma='docker exec -it hub-defisats-backend-staging npx prisma'
alias prod-prisma='docker exec -it hub-defisats-backend-prod npx prisma'
```

**Exemplos:**
```bash
dev-prisma studio      # Abrir Prisma Studio
staging-prisma migrate # Executar migrações
prod-prisma generate   # Gerar cliente Prisma
```

## 🏥 **HEALTH CHECKS**

```bash
# Comandos completos:
alias dev-health='curl -s http://localhost:3001/api/health | jq'
alias staging-health='curl -s http://localhost:23020/api/health | jq'
alias prod-health='curl -s http://localhost:23000/api/health | jq'
```

## 📝 **GIT SHORTCUTS**

```bash
# Comandos completos:
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push origin main'
alias gl='git log --oneline -10'
```

## 🏠 **PROJETO**

```bash
# Comandos completos:
alias cd-hub='cd /home/bychrisr/projects/hub-defisats'
alias hub-status='echo "=== DESENVOLVIMENTO ===" && dev-status && echo "=== STAGING ===" && staging-status && echo "=== PRODUÇÃO ===" && prod-status'
```

## 🎯 **EXEMPLOS DE USO**

### **Desenvolvimento diário:**
```bash
# Iniciar desenvolvimento
dev-up

# Ver logs em tempo real
dev-logs

# Abrir aplicação no navegador
dev-frontend
dev-backend

# Verificar saúde
dev-health
```

### **Teste em staging:**
```bash
# Configurar staging
staging-setup

# Ver logs
staging-logs

# Testar aplicação
staging-frontend
staging-backend

# Verificar saúde
staging-health
```

### **Deploy em produção:**
```bash
# Subir produção
prod-up

# Verificar status
prod-status

# Ver logs
prod-logs

# Testar aplicação
prod-frontend
prod-backend
```

### **Manutenção:**
```bash
# Ver status de todos os ambientes
hub-status

# Limpar Docker
docker-clean

# Conectar ao banco
staging-db
```

## ⚠️ **NOTAS IMPORTANTES**

1. **Desenvolvimento**: Usa `docker-compose.dev.yml`
2. **Staging**: Usa `docker-compose.staging.yml`
3. **Produção**: Usa `docker-compose.prod.yml`
4. **Portas**:
   - Dev: Frontend (3000), Backend (3001)
   - Staging: Frontend (23010), Backend (23020)
   - Prod: Frontend (23001), Backend (23000)

## 🔄 **ATUALIZAÇÃO DOS ALIASES**

Os aliases são adicionados automaticamente ao `~/.zshrc`. Para recarregar:

```bash
source ~/.zshrc
```

Ou simplesmente abra um novo terminal.
