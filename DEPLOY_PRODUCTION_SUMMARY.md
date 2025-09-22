# 🚀 Deploy em Produção - Hub DeFiSats

## 📋 **DOCUMENTAÇÃO COMPLETA DE DEPLOY EM PRODUÇÃO**

Baseado na documentação existente, aqui está o guia completo para fazer deploy em produção do Hub DeFiSats.

---

## 🎯 **SITUAÇÃO ATUAL**

### **Servidor de Produção:**
- **Frontend**: `https://defisats.site`
- **API**: `https://api.defisats.site`
- **IP**: `3.143.248.70` (AWS Ubuntu 24.04.3 LTS)
- **Usuário**: `ubuntu`
- **Chave SSH**: `~/.ssh/debian.pem`

### **Status Atual:**
- ✅ **Infraestrutura**: 100% Pronta
- ✅ **Scripts de Deploy**: Criados e testados
- ✅ **Configurações**: Docker Compose e Nginx configurados
- ✅ **Backup**: Sistema de backup automático
- ✅ **Monitoramento**: Health checks implementados

---

## 🛠️ **ARQUIVOS DE CONFIGURAÇÃO**

### **1. Docker Compose de Produção**
- **Localização**: `config/docker/docker-compose.prod.yml`
- **Serviços**: PostgreSQL, Redis, Backend, Frontend, Nginx, Workers
- **Rede**: `hub-defisats-network`
- **Volumes**: Persistentes para dados

### **2. Variáveis de Ambiente**
- **Exemplo**: `config/env/env.production.example`
- **Produção**: `config/env/.env.production`
- **Configurações**: Database, Redis, JWT, LN Markets, Notificações

### **3. Scripts de Deploy**
- **Deploy Seguro**: `scripts/deploy/deploy-safe.sh`
- **Verificação**: `scripts/deploy/check-production.sh`
- **Deploy Padrão**: `scripts/deploy/deploy-prod.sh`

---

## 🚀 **PROCESSO DE DEPLOY**

### **FASE 1: PREPARAÇÃO**

#### 1.1 Acessar Servidor
```bash
ssh -i ~/.ssh/debian.pem ubuntu@defisats.site
cd /home/ubuntu/apps/hub-defisats
```

#### 1.2 Verificar Status Atual
```bash
# Verificar se produção está funcionando
./scripts/deploy/check-production.sh

# Verificar containers
docker ps | grep hub-defisats
```

#### 1.3 Atualizar Código
```bash
# Pull das últimas mudanças
git pull origin main

# Verificar se há mudanças
git log --oneline -5
```

### **FASE 2: DEPLOY SEGURO**

#### 2.1 Executar Deploy Seguro
```bash
# Executar script de deploy seguro
./scripts/deploy/deploy-safe.sh
```

**O que o script faz:**
1. ✅ Verifica saúde da produção atual
2. ✅ Cria backup automático
3. ✅ Testa ambiente de staging
4. ✅ Testa localmente
5. ✅ Para produção atual
6. ✅ Inicia nova versão
7. ✅ Verifica saúde da nova versão
8. ✅ Rollback automático se falhar

#### 2.2 Monitoramento Pós-Deploy
```bash
# Verificar status após deploy
./scripts/deploy/check-production.sh

# Verificar logs
docker logs hub-defisats-backend-prod
docker logs hub-defisats-frontend-prod
```

---

## 🔧 **CONFIGURAÇÕES NECESSÁRIAS**

### **Variáveis de Ambiente Obrigatórias:**

```bash
# Database
POSTGRES_DB=hubdefisats_prod
POSTGRES_USER=hubdefisats_prod
POSTGRES_PASSWORD=your_secure_database_password

# Security
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum
ENCRYPTION_KEY=your_secure_encryption_key_32_chars

# URLs
CORS_ORIGIN=https://defisats.site
VITE_API_URL=https://api.defisats.site

# LN Markets
LN_MARKETS_API_URL=https://api.lnmarkets.com
```

### **Variáveis Opcionais:**
```bash
# Notifications
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring
SENTRY_DSN=your_sentry_dsn

# Social Auth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 🐳 **ESTRUTURA DOCKER**

### **Containers da Aplicação:**
| Container | Status | Função | Porta Interna |
|-----------|--------|--------|---------------|
| `hub-defisats-backend-prod` | ✅ Healthy | API Backend | 3010 |
| `hub-defisats-frontend-prod` | ✅ Running | Frontend React | 80 |
| `hub-defisats-nginx-prod` | ✅ Running | Nginx interno | 80 |
| `hub-defisats-postgres-prod` | ✅ Healthy | Banco de dados | 5432 |
| `hub-defisats-redis-prod` | ✅ Healthy | Cache Redis | 6379 |
| `hub-defisats-margin-monitor-prod` | ⚠️ Restarting | Worker | - |
| `hub-defisats-automation-executor-prod` | ⚠️ Restarting | Worker | - |

### **Rede Docker:**
- **Nome**: `hub-defisats_hub-defisats-network`
- **Subnet**: `172.21.0.0/16`
- **Gateway**: `172.21.0.1`

---

## 🔍 **VERIFICAÇÃO E TESTES**

### **Health Checks:**
```bash
# Frontend
curl -I https://defisats.site

# API
curl -I https://api.defisats.site/health

# Conectividade interna
docker exec global-nginx-proxy curl -s http://hub-defisats-nginx-prod:80
```

### **Testes de Funcionalidade:**
```bash
# Testar login
curl -X POST "https://api.defisats.site/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@defisats.com","password":"password"}'

# Testar endpoints públicos
curl -X GET "https://api.defisats.site/api/cards-with-tooltips"
curl -X GET "https://api.defisats.site/api/market/index/public"
```

---

## 🚨 **PLANO DE ROLLBACK**

### **Rollback Automático:**
O script `deploy-safe.sh` faz rollback automático se:
- ❌ Health check falhar
- ❌ Frontend não responder
- ❌ API não responder
- ❌ Timeout de 10 minutos

### **Rollback Manual:**
```bash
# Se precisar fazer rollback manual
cd backups/YYYYMMDD_HHMMSS
cp .env.production.backup ../../config/env/.env.production
cp docker-compose.prod.yml.backup ../../docker-compose.prod.yml
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

---

## 📊 **MONITORAMENTO**

### **Comandos de Diagnóstico:**
```bash
# Ver todos os containers
docker ps -a

# Ver logs em tempo real
docker logs -f hub-defisats-backend-prod

# Ver uso de recursos
docker stats

# Verificar espaço em disco
df -h
```

### **Logs Importantes:**
```
~/proxy/logs/                    # Logs do proxy global
/var/log/nginx/                  # Logs do nginx (sistema)
docker logs <container>          # Logs dos containers
```

---

## 🔐 **SEGURANÇA**

### **Certificados SSL:**
- **Localização**: `~/proxy/certs/`
- **Arquivos**: `defisats.site.crt`, `defisats.site.key`

### **Firewall:**
- **Portas abertas**: 80 (HTTP), 443 (HTTPS)
- **Portas internas**: 3010 (Backend), 80 (Frontend)

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

#### 1. **Frontend não carrega (502 Bad Gateway)**
```bash
# Verificar logs
docker logs hub-defisats-frontend-prod

# Verificar se container está rodando
docker ps | grep frontend

# Reiniciar aplicação
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

#### 2. **API não responde**
```bash
# Verificar logs
docker logs hub-defisats-backend-prod

# Verificar health
curl https://api.defisats.site/health

# Verificar banco de dados
docker logs hub-defisats-postgres-prod
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

## 📞 **COMANDOS DE EMERGÊNCIA**

```bash
# Parar tudo
docker compose -f docker-compose.prod.yml down
cd ~/proxy && ./start-proxy.sh stop

# Iniciar tudo
cd ~/proxy && ./start-proxy.sh start
cd /home/ubuntu/apps/hub-defisats && docker compose -f docker-compose.prod.yml up -d
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

## 🎯 **PRÓXIMOS PASSOS**

1. **Executar Deploy Seguro** - Usar `./scripts/deploy/deploy-safe.sh`
2. **Monitorar Produção** - Acompanhar logs e performance
3. **Testar Funcionalidades** - Verificar todas as funcionalidades
4. **Documentar Resultados** - Registrar status pós-deploy

---

**🎉 A documentação está completa e pronta para deploy em produção!**

**📅 Última Atualização:** 22 de Setembro de 2025  
**✅ Status:** Pronto para Deploy  
**🚀 Comando:** `./scripts/deploy/deploy-safe.sh`
