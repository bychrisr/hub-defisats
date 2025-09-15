# ⚙️ Configurações Necessárias - Hub DefiSats

## 📋 **Variáveis de Ambiente Obrigatórias**

### **Backend (.env)**

```bash
# Ambiente
NODE_ENV=production
PORT=3010

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/hub_defisats
POSTGRES_USER=hub_defisats
POSTGRES_PASSWORD=your-secure-password-here

# Redis
REDIS_URL=redis://:your-redis-password@redis:6379
REDIS_PASSWORD=your-secure-redis-password

# JWT & Segurança
JWT_SECRET=your-super-secure-jwt-secret-64-chars-minimum
ENCRYPTION_KEY=32-character-encryption-key-for-sensitive-data

# LN Markets (Produção)
LN_MARKETS_API_KEY=your-production-api-key
LN_MARKETS_API_SECRET=your-production-api-secret
LN_MARKETS_PASSPHRASE=your-production-passphrase

# 2FA & CAPTCHA
HCAPTCHA_SITE_KEY=your-hcaptcha-site-key
HCAPTCHA_SECRET_KEY=your-hcaptcha-secret-key
RECAPTCHA_V3_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_V3_SECRET_KEY=your-recaptcha-secret-key

# Notificações
EVOLUTION_API_URL=https://api.evolution-api.com
EVOLUTION_API_KEY=your-evolution-api-key

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoramento
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Frontend URLs
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

---

## 💰 **Sistema de Pagamentos - Lightning Network**

### **Opção 1: LN Markets (Recomendado)**

1. **Crie conta em:** https://lnmarkets.com
2. **Gere API Keys:** Settings → API Keys
3. **Configure produção:**
```bash
LN_MARKETS_API_KEY=lm_prod_xxxxxxxxxxxxxxxxxxxx
LN_MARKETS_API_SECRET=your-production-secret
LN_MARKETS_PASSPHRASE=your-secure-passphrase
```

### **Opção 2: LND Node**

1. **Configure LND:** https://github.com/lightningnetwork/lnd
2. **Configure REST API:**
```bash
LND_REST_URL=https://your-lnd-node:8080
LND_MACAROON=your-macaroon-hex-string
```

### **Opção 3: LNbits (Simples)**

1. **Instale LNbits:** https://github.com/lnbits/lnbits
2. **Configure API Key:**
```bash
LNBITS_URL=https://your-lnbits-instance.com
LNBITS_API_KEY=your-lnbits-api-key
```

---

## 📱 **Sistema de Notificações**

### **EvolutionAPI (WhatsApp & Telegram)**

1. **Instale EvolutionAPI:**
```bash
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
docker-compose up -d
```

2. **Configure:**
```bash
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-api-key-from-evolution
```

3. **Conecte WhatsApp:**
   - Acesse: http://localhost:8080
   - Escaneie QR code do WhatsApp

4. **Configure Telegram Bot:**
   - Contate @BotFather no Telegram
   - Crie bot: `/newbot`
   - Obtenha token: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

---

## 🔐 **Sistema de Segurança**

### **2FA Configuration**

**Google Authenticator ou similar:**
- App já integrado, não precisa configuração externa
- Usuários configuram via interface: `/security/2fa`

### **CAPTCHA Services**

#### **hCaptcha (Recomendado)**
1. **Registre:** https://hcaptcha.com/
2. **Configure domínio:** yourdomain.com
3. **Obtenha keys:**
```bash
HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
HCAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000
```

#### **reCAPTCHA v3**
1. **Registre:** https://google.com/recaptcha
2. **Configure domínio:** yourdomain.com
3. **Obtenha keys:**
```bash
RECAPTCHA_V3_SITE_KEY=your-site-key
RECAPTCHA_V3_SECRET_KEY=your-secret-key
```

---

## 📊 **Monitoramento e Alertas**

### **Prometheus + Grafana**

1. **Inicie monitoramento:**
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

2. **Configure alertas:**
```bash
# Edite monitoring/alertmanager.yml
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_PAYMENT_CHAT_ID=your-chat-id
```

3. **Acesse dashboards:**
- **Grafana:** http://localhost:3000 (admin/admin)
- **Prometheus:** http://localhost:9090
- **Alertmanager:** http://localhost:9093

### **Sentry (Error Tracking)**

1. **Registre:** https://sentry.io/
2. **Configure projeto:** hub-defisats
3. **Obtenha DSN:**
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

---

## 🏗️ **Infraestrutura**

### **Docker Production**

1. **Configure produção:**
```bash
cp docker-compose.prod.yml docker-compose.override.yml
# Edite variáveis no override
```

2. **SSL com Let's Encrypt:**
```bash
# Instale certbot
sudo apt install certbot

# Gere certificado
sudo certbot certonly --standalone -d yourdomain.com

# Configure nginx
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
```

### **Kubernetes (Opcional)**

1. **Configure cluster:**
```bash
kubectl create namespace hub-defisats
kubectl apply -f k8s/
```

2. **Configure ingress:**
```yaml
# Adicione em k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hub-defisats-ingress
  namespace: hub-defisats
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: hub-defisats-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

---

## 🔑 **Configurações Administrativas**

### **Super Admin Setup**

1. **Configure primeiro admin:**
```sql
-- Execute no banco de dados
INSERT INTO "AdminUser" (user_id, role)
VALUES (
  (SELECT id FROM "User" WHERE email = 'admin@hubdefisats.com'),
  'superadmin'
);
```

2. **Configure credenciais:**
```bash
# Usuário admin
Email: admin@hubdefisats.com
Password: Configure via interface
```

### **Cupons de Teste**

1. **Crie cupons iniciais:**
```sql
INSERT INTO "Coupon" (code, plan_type, usage_limit, expires_at, description)
VALUES
  ('ALPHATESTER', 'free', 30, '2025-12-31', 'Acesso vitalício para testers'),
  ('BETA2025', 'basic', 50, '2025-06-30', 'Beta testers 2025');
```

---

## 🚀 **Deploy Checklist**

### **Pré-deploy**

- [ ] **Domínio configurado** (DNS A record → server IP)
- [ ] **SSL certificado** (Let's Encrypt ou similar)
- [ ] **Database backup** (procedimento documentado)
- [ ] **Environment variables** (todos configurados)
- [ ] **API keys válidas** (LN Markets, notificações)
- [ ] **Monitoramento ativo** (Sentry, Slack webhooks)

### **Deploy Steps**

```bash
# 1. Build e push imagens
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml push

# 2. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 3. Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 4. Health check
curl https://yourdomain.com/health
curl https://api.yourdomain.com/health

# 5. Start workers
docker-compose -f docker-compose.prod.yml exec backend npm run workers:start-all
```

### **Pós-deploy**

- [ ] **Testes funcionais** (login, automação, pagamentos)
- [ ] **Monitoramento ativo** (dashboards carregando)
- [ ] **Alertas configurados** (Slack/Telegram funcionando)
- [ ] **Backup verificado** (automático funcionando)
- [ ] **Logs centralizados** (Loki/Promtail ativo)

---

## 🔧 **Troubleshooting**

### **Problemas Comuns**

#### **Workers não iniciam**
```bash
# Verificar logs
docker-compose logs margin-monitor
docker-compose logs automation-executor

# Verificar Redis
docker-compose exec redis redis-cli ping
```

#### **Pagamentos falham**
```bash
# Verificar LN Markets
curl -X GET "https://api.lnmarkets.com/v2/user" \
  -H "LNM-ACCESS-KEY: $LN_MARKETS_API_KEY"

# Verificar EvolutionAPI
curl $EVOLUTION_API_URL/instance/status
```

#### **Notificações não chegam**
```bash
# Testar EvolutionAPI
curl -X POST $EVOLUTION_API_URL/message/sendText \
  -H "Content-Type: application/json" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{"number": "5511999999999", "text": "Test"}'
```

---

## 📊 **Monitoramento de Produção**

### **KPIs Principais**

- **Uptime:** >99.5%
- **Response Time:** <200ms (API), <3s (frontend)
- **Error Rate:** <1%
- **Trade Success Rate:** >90%
- **Payment Success Rate:** >95%

### **Dashboards Essenciais**

1. **System Health** - Todos os serviços UP
2. **API Performance** - Latência e taxa de erro
3. **User Activity** - Registros e engajamento
4. **Revenue Metrics** - Receita e conversões
5. **Error Tracking** - Erros por serviço

### **Alertas Críticos**

- Backend/Frontend down
- Database indisponível
- Pagamentos falhando (>5%)
- Taxa de erro >5%
- Workers parados

---

## 📞 **Suporte em Produção**

### **Canais de Monitoramento**

- **Slack:** #alerts, #production
- **Email:** alerts@yourdomain.com
- **Sentry:** Error tracking automático
- **Grafana:** Dashboards em tempo real

### **Equipe de Resposta**

1. **DevOps:** Infraestrutura e deploy
2. **Backend:** API e workers
3. **Frontend:** Interface e UX
4. **Product:** Negócios e usuários

### **Runbooks**

- **Database failover**
- **Service restart procedures**
- **Emergency rollback**
- **User communication templates**

---

## 🔄 **Atualizações**

### **Zero-downtime Deploy**

```bash
# Blue-green deployment
kubectl set image deployment/backend backend=new-image:v2
kubectl rollout status deployment/backend

# Verificar health
curl https://api.yourdomain.com/health

# Switch traffic (se usando ingress)
kubectl patch ingress hub-defisats -p '{"spec":{"rules":[{"host":"yourdomain.com","http":{"paths":[{"path":"/","backend":{"serviceName":"backend-v2"}}]}}]}}'

# Cleanup old version
kubectl delete deployment backend-v1
```

---

*Esta documentação deve ser mantida atualizada conforme mudanças na infraestrutura e configurações.*

