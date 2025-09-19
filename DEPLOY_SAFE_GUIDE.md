# 🛡️ GUIA DE DEPLOY SEGURO - Hub DeFiSats

## ⚠️ **IMPORTANTE: NÃO QUEBRAR PRODUÇÃO**

Este guia foi criado para fazer deploy seguro das novas funcionalidades (Margin Guard, automações, workers) sem afetar a versão atual em produção.

---

## 📊 **SITUAÇÃO ATUAL**

### **Servidor de Produção:**
- **Frontend**: `https://defisats.site`
- **API**: `https://api.defisats.site`
- **Status**: Versão antiga rodando com usuários ativos
- **Configuração**: `.env.production` já configurado

### **Novas Funcionalidades:**
- ✅ Margin Guard 100% funcional
- ✅ Sistema de automações completo
- ✅ Workers otimizados (BullMQ + Redis)
- ✅ Nova estrutura de ambiente
- ✅ CI/CD configurado
- ✅ Documentação completa

---

## 🚀 **ESTRATÉGIA DE DEPLOY SEGURO**

### **FASE 1: VERIFICAÇÃO PRÉ-DEPLOY**

#### 1.1 Verificar Status Atual
```bash
# Verificar se produção está funcionando
./scripts/deploy/check-production.sh
```

**O que verifica:**
- ✅ Frontend acessível
- ✅ API respondendo
- ✅ Health checks passando
- ✅ SSL válido
- ✅ Tempos de resposta
- ✅ Containers Docker

#### 1.2 Backup da Versão Atual
```bash
# O script de deploy seguro já faz backup automático
# Mas você pode fazer backup manual se quiser
mkdir -p backups/manual-$(date +%Y%m%d_%H%M%S)
```

### **FASE 2: TESTE EM STAGING**

#### 2.1 Configurar Staging
```bash
# Criar ambiente de staging
cp config/env/.env.production config/env/.env.staging

# Atualizar URLs para staging
sed -i 's/defisats\.site/localhost:13000/g' config/env/.env.staging
sed -i 's/api\.defisats\.site/localhost:13010/g' config/env/.env.staging
```

#### 2.2 Testar Staging
```bash
# Iniciar ambiente de desenvolvimento (que serve como staging)
docker compose -f config/docker/docker-compose.dev.yml up -d

# Verificar se está funcionando
curl http://localhost:13000
curl http://localhost:13010/health
```

### **FASE 3: DEPLOY SEGURO**

#### 3.1 Executar Deploy Seguro
```bash
# Executar script de deploy seguro
./scripts/deploy/deploy-safe.sh
```

**O que o script faz:**
1. ✅ Verifica saúde da produção atual
2. ✅ Cria backup automático
3. ✅ Testa staging
4. ✅ Testa localmente
5. ✅ Para produção atual
6. ✅ Inicia nova versão
7. ✅ Verifica saúde da nova versão
8. ✅ Rollback automático se falhar

#### 3.2 Monitoramento Pós-Deploy
```bash
# Verificar status após deploy
./scripts/deploy/check-production.sh

# Verificar logs
docker logs hub-defisats-backend-prod
docker logs hub-defisats-frontend-prod
```

---

## 🔧 **CONFIGURAÇÕES NECESSÁRIAS**

### **Variáveis de Ambiente Atualizadas:**

```bash
# config/env/.env.production
NODE_ENV=production
PORT=23000

# Database (manter as mesmas)
POSTGRES_DB=hubdefisats_prod
POSTGRES_USER=hubdefisats_prod
POSTGRES_PASSWORD=hubdefisats_prod_password_secure_2024

# Security (manter as mesmas)
JWT_SECRET=production-jwt-secret-key-32-chars-minimum-2024
ENCRYPTION_KEY=production-encryption-key-32-chars-2024

# URLs (manter as mesmas)
CORS_ORIGIN=https://defisats.site
VITE_API_URL=https://api.defisats.site

# LN Markets (manter as mesmas)
LN_MARKETS_API_URL=https://api.lnmarkets.com
```

### **Docker Compose Atualizado:**
- ✅ Novos workers (margin-monitor, automation-executor)
- ✅ Configuração Redis otimizada
- ✅ Health checks melhorados
- ✅ Volumes persistentes

---

## 🚨 **PLANO DE ROLLBACK**

### **Se algo der errado:**

#### Rollback Automático
O script `deploy-safe.sh` faz rollback automático se:
- ❌ Health check falhar
- ❌ Frontend não responder
- ❌ API não responder
- ❌ Timeout de 10 minutos

#### Rollback Manual
```bash
# Se precisar fazer rollback manual
cd backups/YYYYMMDD_HHMMSS
cp .env.production.backup ../../config/env/.env.production
cp docker-compose.prod.yml.backup ../../docker-compose.prod.yml
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

---

## 📋 **CHECKLIST PRÉ-DEPLOY**

### **Antes de executar o deploy:**

- [ ] ✅ Produção atual está funcionando
- [ ] ✅ Backup foi criado
- [ ] ✅ Staging foi testado
- [ ] ✅ Variáveis de ambiente estão corretas
- [ ] ✅ Docker images foram buildadas
- [ ] ✅ Teste local passou
- [ ] ✅ Tem acesso ao servidor
- [ ] ✅ Tem plano de rollback
- [ ] ✅ Usuários foram notificados (se necessário)

### **Durante o deploy:**

- [ ] ✅ Monitorar logs em tempo real
- [ ] ✅ Verificar health checks
- [ ] ✅ Testar funcionalidades principais
- [ ] ✅ Verificar workers
- [ ] ✅ Verificar automações

### **Após o deploy:**

- [ ] ✅ Frontend carregando
- [ ] ✅ API respondendo
- [ ] ✅ Login funcionando
- [ ] ✅ Margin Guard funcionando
- [ ] ✅ Automações funcionando
- [ ] ✅ Workers rodando
- [ ] ✅ Logs sem erros

---

## 🆘 **TROUBLESHOOTING**

### **Problemas Comuns:**

#### 1. **Frontend não carrega**
```bash
# Verificar logs
docker logs hub-defisats-frontend-prod

# Verificar se container está rodando
docker ps | grep frontend
```

#### 2. **API não responde**
```bash
# Verificar logs
docker logs hub-defisats-backend-prod

# Verificar health
curl https://api.defisats.site/health
```

#### 3. **Workers não funcionam**
```bash
# Verificar logs dos workers
docker logs hub-defisats-margin-monitor
docker logs hub-defisats-automation-executor

# Verificar Redis
docker logs hub-defisats-redis-prod
```

#### 4. **Database connection failed**
```bash
# Verificar PostgreSQL
docker logs hub-defisats-postgres-prod

# Verificar connection string
echo $DATABASE_URL
```

---

## 📞 **SUPORTE**

### **Se precisar de ajuda:**

1. **Verificar logs**: `docker logs <container_name>`
2. **Verificar status**: `./scripts/deploy/check-production.sh`
3. **Rollback**: `./scripts/deploy/deploy-safe.sh` (tem rollback automático)
4. **Documentação**: Ver arquivos em `MARGIN_GUARD_*.md`

### **Comandos úteis:**

```bash
# Ver todos os containers
docker ps -a

# Ver logs em tempo real
docker logs -f hub-defisats-backend-prod

# Restart um container
docker restart hub-defisats-backend-prod

# Ver uso de recursos
docker stats
```

---

## ✅ **RESULTADO ESPERADO**

Após o deploy bem-sucedido:

- ✅ **Frontend**: `https://defisats.site` funcionando
- ✅ **API**: `https://api.defisats.site` funcionando
- ✅ **Margin Guard**: 100% funcional
- ✅ **Automações**: Sistema completo
- ✅ **Workers**: Rodando em background
- ✅ **Performance**: Otimizada
- ✅ **Monitoramento**: Ativo

---

**🎯 LEMBRE-SE: O script de deploy seguro foi projetado para NÃO QUEBRAR a produção. Ele faz backup, testa tudo e tem rollback automático!**
