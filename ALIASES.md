# 🚀 Aliases para Hub DeFiSats Development

Este arquivo contém todos os aliases disponíveis para facilitar o desenvolvimento e gerenciamento dos ambientes.

## 📋 **ALIASES PRINCIPAIS**

### **Desenvolvimento**
```bash
dev-up          # Subir ambiente de desenvolvimento
dev-down        # Parar ambiente de desenvolvimento
dev-logs        # Ver logs do desenvolvimento
dev-restart     # Reiniciar ambiente de desenvolvimento
dev-status      # Status dos containers de desenvolvimento
```

### **Staging**
```bash
staging-up      # Subir ambiente de staging
staging-down    # Parar ambiente de staging
staging-logs    # Ver logs do staging
staging-restart # Reiniciar ambiente de staging
staging-status  # Status dos containers de staging
staging-setup   # Executar script de setup do staging
```

### **Produção**
```bash
prod-up         # Subir ambiente de produção
prod-down       # Parar ambiente de produção
prod-logs       # Ver logs de produção
prod-restart    # Reiniciar ambiente de produção
prod-status     # Status dos containers de produção
```

## 🔧 **UTILITÁRIOS DOCKER**

```bash
docker-clean    # Limpar containers e volumes não utilizados
docker-all      # Listar todos os containers
docker-images   # Listar todas as imagens
```

## 🌐 **ACESSO RÁPIDO AOS SERVIÇOS**

### **Desenvolvimento**
```bash
dev-frontend    # Abrir frontend de desenvolvimento (localhost:3000)
dev-backend     # Abrir backend de desenvolvimento (localhost:3001)
```

### **Staging**
```bash
staging-frontend # Abrir frontend de staging (localhost:23010)
staging-backend  # Abrir backend de staging (localhost:23020)
```

### **Produção**
```bash
prod-frontend   # Abrir frontend de produção (localhost:23001)
prod-backend    # Abrir backend de produção (localhost:23000)
```

## 📊 **LOGS ESPECÍFICOS**

### **Desenvolvimento**
```bash
dev-backend-logs  # Logs do backend de desenvolvimento
dev-frontend-logs # Logs do frontend de desenvolvimento
```

### **Staging**
```bash
staging-backend-logs  # Logs do backend de staging
staging-frontend-logs # Logs do frontend de staging
```

## 🗄️ **BANCO DE DADOS**

```bash
dev-db      # Conectar ao banco de desenvolvimento
staging-db  # Conectar ao banco de staging
prod-db     # Conectar ao banco de produção
```

## 🔄 **PRISMA**

```bash
dev-prisma      # Executar comandos Prisma no desenvolvimento
staging-prisma  # Executar comandos Prisma no staging
prod-prisma     # Executar comandos Prisma na produção
```

**Exemplos:**
```bash
dev-prisma studio      # Abrir Prisma Studio
staging-prisma migrate # Executar migrações
prod-prisma generate   # Gerar cliente Prisma
```

## 🏥 **HEALTH CHECKS**

```bash
dev-health      # Verificar saúde do desenvolvimento
staging-health  # Verificar saúde do staging
prod-health     # Verificar saúde da produção
```

## 📝 **GIT SHORTCUTS**

```bash
gs  # git status
ga  # git add .
gc  # git commit -m
gp  # git push origin main
gl  # git log --oneline -10
```

## 🏠 **PROJETO**

```bash
cd-hub      # Navegar para o diretório do projeto
hub-status  # Ver status de todos os ambientes
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
