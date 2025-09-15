# Hub DefiSats - Documentação Completa

## 🎯 **Visão Geral do Sistema**

O Hub DefiSats é uma plataforma SaaS completa de automação de trading para LN Markets, oferecendo:

- ✅ **Margin Guard** - Proteção automática contra liquidação
- ✅ **Auto Entry + TP/SL** - Entradas automáticas com gestão de risco
- ✅ **Notificações Multi-canal** - Telegram, WhatsApp, Email
- ✅ **Backtests Pessoais** - Simulação com dados históricos reais
- ✅ **Sistema de Pagamentos** - Lightning Network integrado
- ✅ **Admin Dashboard** - Gestão completa com KPIs avançados
- ✅ **Segurança Avançada** - 2FA, CAPTCHA, rate limiting
- ✅ **CI/CD Completo** - Deploy automatizado
- ✅ **Monitoramento 24/7** - Prometheus, Grafana, Alerting
- ✅ **Sistema de Debug** - Logs aprimorados e troubleshooting
- ✅ **Cache Busting** - Resolução de problemas de cache
- ✅ **Retry Automático** - Recuperação automática de falhas
- ✅ **Offline Mode** - Funcionamento sem conexão
- ✅ **Performance Metrics** - Monitoramento de tempo de resposta
- ✅ **Error Notifications** - Alertas inteligentes para problemas

---

## 🚀 **Melhorias Recentes Implementadas**

### **Baseado no Projeto Anterior (lnmarkets-bot)**

Analisamos o projeto anterior e implementamos melhorias significativas:

#### **1. Sistema de Debug Aprimorado**
- Logs estruturados por categoria
- Debug em tempo real durante desenvolvimento
- Exportação de logs para análise
- Rastreamento de performance por componente

#### **2. Cache Busting Inteligente**
- Eliminação automática de cache obsoleto
- Detecção de mudanças de conectividade
- Cache-busting por versão de aplicação
- Limpeza automática de dados expirados

#### **3. Retry Automático com Backoff**
- Recuperação automática de falhas de rede
- Exponential backoff para reduzir carga
- Detecção inteligente de erros retryable
- Notificações de tentativas de retry

#### **4. Offline Mode Completo**
- Funcionamento sem conexão à internet
- Cache local de dados críticos
- Sincronização automática ao reconectar
- Notificações de status de conectividade

#### **5. Performance Metrics Avançado**
- Monitoramento de tempo de resposta da API
- Web Vitals para experiência do usuário
- Métricas de Core Web Vitals (CLS, FID, FCP, LCP, TTFB)
- Análise de performance por componente

#### **6. Sistema de Notificações de Erro**
- Alertas inteligentes para problemas da API
- Classificação automática de tipos de erro
- Sistema de retry integrado
- Dashboard de monitoramento de erros

#### **7. Saúde do Sistema em Tempo Real**
- Monitoramento contínuo de componentes
- Status visual de saúde da API
- Métricas de performance em tempo real
- Alertas automáticos para problemas

### **8. Sistema de Planos e Preços**
- Gerenciamento completo de planos via admin
- Configuração flexível de funcionalidades
- Controle de limites por plano
- Integração com sistema de pagamentos
- Relatórios de receita e uso

### **9. Sistema de Internacionalização (i18n)**
- ✅ Suporte completo a PT-BR e EN-US
- ✅ Detecção automática de idioma
- ✅ Persistência de preferências no localStorage
- ✅ Dicionários completos com 200+ traduções
- ✅ Interface totalmente traduzida
- ✅ Hook personalizado `useTranslation`

### **10. Sistema de Conversão de Moedas**
- ✅ Conversão em tempo real (BTC, USD, BRL, EUR, sats)
- ✅ Integração com APIs externas (CoinGecko, ExchangeRate)
- ✅ Cache inteligente com atualização automática
- ✅ Fallback offline robusto
- ✅ Formatação inteligente por moeda
- ✅ Suporte a satoshis e criptomoedas

### **11. Interface Multilíngue**
- ✅ Seletor de idioma/moeda no header
- ✅ Página completa de configurações
- ✅ Conversor de moeda integrado
- ✅ Feedback visual em tempo real
- ✅ Interface responsiva
- ✅ Demonstração interativa do sistema

---

## 🔧 **Instalação e Configuração**

### **Sistema de Internacionalização**

#### **Configuração Inicial**
O sistema de i18n está configurado automaticamente no arquivo `frontend/src/main.tsx`:

```typescript
import './i18n'; // Sistema carregado automaticamente
```

#### **Estrutura de Arquivos**
```
frontend/src/
├── i18n/
│   ├── index.ts              # Configuração principal
│   └── locales/
│       ├── pt-BR.json       # Traduções em português
│       └── en-US.json       # Traduções em inglês
├── hooks/
│   ├── useTranslation.ts    # Hook para traduções
│   ├── useCurrency.ts       # Hook para conversões
│   └── useSmartFormat.ts    # Hook para formatação
├── services/
│   └── currency.service.ts   # Serviço de câmbio
└── components/
    ├── common/
    │   ├── LanguageCurrencySelector.tsx
    │   ├── CurrencyConverter.tsx
    │   └── InternationalizationDemo.tsx
    └── layout/
        └── Header.tsx        # Seletor integrado
```

#### **Uso Básico das Traduções**

```typescript
import { useTranslation } from '@/hooks/useTranslation';

const MyComponent = () => {
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.loading')}</p>

      <button onClick={() => changeLanguage('en-US')}>
        {t('settings.language')}
      </button>
    </div>
  );
};
```

#### **Uso do Sistema de Moedas**

```typescript
import { useCurrency } from '@/hooks/useCurrency';

const PriceComponent = () => {
  const { convert, format, supportedCurrencies } = useCurrency();

  const price = convert(1000, 'BRL', 'USD');

  return (
    <div>
      <span>{price.formatted}</span>
      <small>Taxa: {price.rate}</small>
    </div>
  );
};
```

#### **Formatação Inteligente**

```typescript
import { useSmartFormat } from '@/hooks/useSmartFormat';

const TradingData = ({ pnl, volume, timestamp }) => {
  const {
    formatValue,
    formatPercentage,
    formatDate,
    formatSats,
    formatPnL
  } = useSmartFormat();

  return (
    <div>
      <div>P&L: {formatPnL(pnl)}</div>
      <div>Volume: {formatValue(volume)}</div>
      <div>Data: {formatDate(timestamp)}</div>
      <div>Sats: {formatSats(5000000)}</div>
    </div>
  );
};
```

#### **Chaves de Tradução Disponíveis**

**Interface Geral:**
- `common.*` - Elementos comuns (loading, error, success, etc.)
- `navigation.*` - Menu de navegação
- `dashboard.*` - Página do dashboard

**Funcionalidades:**
- `automations.*` - Sistema de automações
- `backtests.*` - Sistema de backtests
- `settings.*` - Página de configurações
- `currency.*` - Sistema de moedas
- `market.*` - Dados de mercado

**Validação e Erros:**
- `validation.*` - Mensagens de validação
- `errors.*` - Mensagens de erro
- `success.*` - Mensagens de sucesso

### **Sistema de Conversão de Moedas**

#### **Moedas Suportadas**
- **BTC** - Bitcoin
- **USD** - Dólar americano
- **BRL** - Real brasileiro
- **EUR** - Euro
- **sats** - Satoshis

#### **APIs Utilizadas**
- **CoinGecko API**: Preços de BTC em tempo real
- **ExchangeRate API**: Taxas de câmbio fiat
- **Cache**: Atualização automática a cada 5 minutos
- **Fallback**: Valores padrão para funcionamento offline

#### **Funcionalidades Avançadas**
- ✅ Conversão bidirecional
- ✅ Cache inteligente
- ✅ Formatação automática
- ✅ Suporte a satoshis
- ✅ Interface responsiva
- ✅ Atualização em tempo real

### **Pré-requisitos**

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker e Docker Compose
sudo apt-get install docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# PostgreSQL (opcional, para desenvolvimento local)
sudo apt-get install postgresql postgresql-contrib
```

### **Configuração Inicial**

1. **Clone o repositório:**
```bash
git clone https://github.com/your-org/hub-defisats.git
cd hub-defisats
```

2. **Configure as variáveis de ambiente:**
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

3. **Configure as chaves necessárias:**
```bash
# Edite backend/.env
NODE_ENV=development
PORT=13010
DATABASE_URL=postgresql://user:password@localhost:5432/hub_defisats
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_KEY=32-char-encryption-key-here

# LN Markets (Sandbox para desenvolvimento)
LN_MARKETS_API_KEY=your-sandbox-api-key
LN_MARKETS_API_SECRET=your-sandbox-api-secret
LN_MARKETS_PASSPHRASE=your-sandbox-passphrase

# Notificações
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key

# CAPTCHA
HCAPTCHA_SITE_KEY=your-hcaptcha-site-key
HCAPTCHA_SECRET_KEY=your-hcaptcha-secret-key
```

---

## 🚀 **Deploy e Execução**

### **Desenvolvimento Local**

```bash
# Iniciar todos os serviços
docker-compose -f docker-compose.dev.yml up -d

# Executar migrations
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.dev.yml exec backend npx prisma db push

# Iniciar workers
npm run workers:start-all

# Acessar aplicações
# Frontend: http://localhost:3001
# Backend API: http://localhost:13010
# Admin: http://localhost:3001/admin
```

### **Produção com Docker**

```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Deploy em produção
docker-compose -f docker-compose.prod.yml up -d

# Verificar health checks
curl http://localhost/health
curl http://localhost:3010/health
```

### **Produção com Kubernetes**

```bash
# Aplicar manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Verificar rollout
kubectl get pods -n hub-defisats
kubectl rollout status deployment/hub-defisats-backend -n hub-defisats
```

---

## 🔐 **Configurações de Segurança**

### **2FA (Two-Factor Authentication)**

```typescript
// Para habilitar 2FA em um usuário
POST /api/security/2fa/setup
{
  "userId": "user-uuid"
}

// Verificar código 2FA
POST /api/security/2fa/verify-setup
{
  "token": "123456"
}
```

### **CAPTCHA Configuration**

**hCaptcha:**
```env
HCAPTCHA_SITE_KEY=your-site-key
HCAPTCHA_SECRET_KEY=your-secret-key
```

**reCAPTCHA v3:**
```env
RECAPTCHA_V3_SITE_KEY=your-site-key
RECAPTCHA_V3_SECRET_KEY=your-secret-key
```

### **Rate Limiting**

Configurado automaticamente com limites:
- **Auth endpoints:** 5 tentativas/15min
- **API geral:** 100 req/min
- **Trading:** 200 req/min
- **Admin:** 50 req/min

---

## 💰 **Sistema de Pagamentos**

### **Configuração Lightning Network**

#### **LN Markets (Recomendado)**
```env
LN_MARKETS_API_KEY=your-production-api-key
LN_MARKETS_API_SECRET=your-production-api-secret
LN_MARKETS_PASSPHRASE=your-production-passphrase
```

#### **LND (Alternativo)**
```env
LND_REST_URL=https://your-lnd-node:8080
LND_MACAROON=your-macaroon-hex
```

#### **LNbits (Simples)**
```env
LNBITS_URL=https://your-lnbits-instance.com
LNBITS_API_KEY=your-api-key
```

### **Preços dos Planos**

```javascript
const pricing = {
  basic: { amount: 21000, sats: '21k sats' },     // ~$10-15
  advanced: { amount: 42000, sats: '42k sats' },  // ~$20-30
  pro: { amount: 84000, sats: '84k sats' },       // ~$40-60
  lifetime: { amount: 210000, sats: '210k sats'} // ~$100-150
};
```

### **Fluxo de Pagamento**

```typescript
// 1. Criar invoice
POST /api/payments/lightning
{
  "plan_type": "pro"
}

// 2. Retorno
{
  "id": "payment-uuid",
  "bolt11": "lnbc8400n1...",
  "amount_sats": 84000,
  "description": "Plano Pro - Recursos Completos"
}

// 3. Verificar status
GET /api/payments/{id}/status

// 4. Retry se expirado
POST /api/payments/{id}/retry
```

---

## 📱 **Sistema de Notificações**

### **EvolutionAPI (WhatsApp & Telegram)**

```env
EVOLUTION_API_URL=https://api.evolution-api.com
EVOLUTION_API_KEY=your-api-key
```

### **Configuração por Usuário**

```typescript
// Configurar notificações
POST /api/notifications
{
  "type": "telegram",
  "channel_config": {
    "chatId": "123456789"
  }
}

// Enviar teste
POST /api/notifications/test
{
  "type": "telegram",
  "message": "Teste de notificação"
}
```

### **Templates de Notificação**

```javascript
const templates = {
  margin_alert: {
    title: "🚨 Alerta Crítico de Margem",
    message: "Margin Ratio: {marginRatio}% - Ação necessária!"
  },
  trade_executed: {
    title: "✅ Trade Executado",
    message: "Trade {tradeId} executado com sucesso"
  },
  system_alert: {
    title: "🔧 Alerta do Sistema",
    message: "{message}"
  }
};
```

---

## 🤖 **Automação de Trading**

### **Margin Guard Configuration**

```typescript
POST /api/automations
{
  "type": "margin_guard",
  "config": {
    "margin_threshold": 15,
    "action": "close_position",
    "reduce_percentage": 50,
    "add_margin_amount": 1000
  }
}
```

### **Auto Entry Configuration**

```typescript
POST /api/automations
{
  "type": "auto_entry",
  "config": {
    "market": "btcusd",
    "side": "b", // b=buy, s=sell
    "quantity": 100,
    "leverage": 5,
    "stoploss": 25000,
    "takeprofit": 35000,
    "trigger_price": 30000,
    "trigger_type": "market"
  }
}
```

### **TP/SL Configuration**

```typescript
POST /api/automations
{
  "type": "tp_sl",
  "config": {
    "action": "update_tp",
    "new_takeprofit": 25,
    "trigger_pnl_percentage": 10
  }
}
```

---

## 📊 **Backtests**

### **Executar Backtest**

```typescript
POST /api/backtests
{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "initialBalance": 100000,
  "automationType": "margin_guard",
  "automationConfig": {
    "margin_threshold": 10,
    "action": "close_position"
  }
}
```

### **Métricas Calculadas**

```javascript
const metrics = {
  totalTrades: 150,
  winningTrades: 120,
  losingTrades: 30,
  winRate: 80.0,
  totalPnl: 25000,
  maxDrawdown: 5000,
  sharpeRatio: 1.8
};
```

---

## 👨‍💼 **Admin Dashboard**

### **KPIs em Tempo Real**

```typescript
GET /api/admin/advanced-dashboard?period=24h
```

**Métricas retornadas:**
- Total de usuários ativos
- Taxa de sucesso de trades
- Receita total
- Uso de automações
- Performance do sistema
- Status de workers

### **Gerenciamento de Cupons**

```typescript
// Criar cupom
POST /api/admin/coupons
{
  "code": "BLACKFRIDAY",
  "plan_type": "pro",
  "usage_limit": 100,
  "value_type": "percentage",
  "value_amount": 50,
  "expires_at": "2024-12-31T23:59:59Z"
}

// Analytics do cupom
GET /api/admin/coupons/{id}/analytics
```

### **Operações em Massa**

```typescript
// Operações bulk
POST /api/admin/users/bulk
{
  "operation": "activate", // or "deactivate", "change_plan"
  "userIds": ["user1", "user2", "user3"],
  "data": {
    "plan_type": "pro" // for change_plan operation
  }
}
```

---

## 🧪 **Testes**

### **Executar Todos os Testes**

```bash
# E2E Tests
npm run test:e2e

# Integration Tests
npm run test:integration

# Unit Tests
npm run test

# Todos os testes
npm run test:all
```

### **Testes Específicos**

```bash
# Testes de autenticação
npm run test:e2e:auth

# Testes de automação
npm run test:e2e:automation

# Testes de notificações
npm run test:e2e:notification

# Testes de pagamentos
npm run test:e2e:payment
```

---

## 📈 **Monitoramento**

### **Stack de Monitoramento**

```bash
# Iniciar monitoramento
docker-compose -f docker-compose.monitoring.yml up -d

# Acessar interfaces
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
# Alertmanager: http://localhost:9093
```

### **Dashboards Disponíveis**

1. **System Health** - Status de todos os serviços
2. **API Performance** - Tempos de resposta e taxa de erro
3. **Database Metrics** - Conexões e performance
4. **Redis Metrics** - Uso de memória e conexões
5. **Trade Analytics** - Taxa de sucesso e volume
6. **Worker Performance** - Filas e processamento
7. **User Activity** - Atividade e engajamento
8. **Payment Processing** - Processamento de pagamentos

### **Alertas Configurados**

- **Críticos:** Serviços down, alta taxa de erro
- **Avisos:** Performance degradada, uso alto de recursos
- **Info:** Manutenções, atualizações

---

## 🔧 **Manutenção e Troubleshooting**

### **Logs**

```bash
# Ver logs de containers
docker-compose logs -f backend
docker-compose logs -f frontend

# Logs de workers
docker-compose logs -f margin-monitor
docker-compose logs -f automation-executor

# Logs do sistema
tail -f /var/log/hub-defisats/*.log
```

### **Database Maintenance**

```bash
# Backup
docker-compose exec postgres pg_dump -U postgres hub_defisats > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres hub_defisats < backup.sql

# Migrations
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db push
```

### **Performance Tuning**

```env
# Database
POSTGRES_MAX_CONNECTIONS=20
POSTGRES_SHARED_BUFFERS=256MB

# Redis
REDIS_MAXMEMORY=512mb
REDIS_MAXMEMORY_POLICY=allkeys-lru

# Node.js
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048
```

---

## 🚨 **Alertas e Notificações**

### **Configuração de Alertas**

```yaml
# monitoring/alertmanager.yml
receivers:
- name: 'slack'
  slack_configs:
  - api_url: '${SLACK_WEBHOOK_URL}'
    channel: '#alerts'

- name: 'email'
  email_configs:
  - to: 'admin@hubdefisats.com'
    subject: '{{ .GroupLabels.alertname }}'
```

### **Canais de Notificação**

- **Slack:** Alertas críticos e avisos
- **Email:** Relatórios diários e alertas administrativos
- **SMS:** Apenas para alertas críticos (via Twilio)

---

## 🔄 **Atualizações e Deploy**

### **CI/CD Pipeline**

```yaml
# .github/workflows/ci-cd.yml
# Build, test, security scan, deploy
# Stages: security → backend → frontend → e2e → deploy
```

### **Rollback Procedure**

```bash
# Rollback automático em falha
kubectl rollout undo deployment/hub-defisats-backend

# Ou manual
docker-compose down
docker-compose pull
docker-compose up -d
```

### **Zero-downtime Deploy**

```bash
# Blue-green deployment
kubectl set image deployment/hub-defisats-backend backend=new-image
kubectl rollout status deployment/hub-defisats-backend
kubectl delete deployment hub-defisats-backend-old
```

---

## 📚 **APIs e Integrações**

### **Endpoints Principais**

```typescript
// Authentication
POST /api/auth/register
POST /api/auth/login
GET  /api/users/me

// Automations
POST /api/automations
GET  /api/automations
PUT  /api/automations/{id}
DELETE /api/automations/{id}

// Payments
POST /api/payments/lightning
GET  /api/payments/{id}/status

// Notifications
POST /api/notifications
POST /api/notifications/test

// Backtests
POST /api/backtests
GET  /api/backtests/{id}

// Admin
GET  /api/admin/advanced-dashboard
POST /api/admin/coupons
```

### **Webhooks**

```typescript
// Payment confirmations
POST /api/webhooks/payments
{
  "payment_hash": "hash",
  "preimage": "preimage",
  "amount": 21000
}
```

---

## 🎯 **Novos Hooks e Utilitários**

### **Hooks de Performance e Monitoramento**

#### **useDebug**
```typescript
const { info, warn, error, debug, exportLogs } = useDebug({
  enabled: process.env.NODE_ENV === 'development',
  maxLogs: 100,
  persistLogs: true,
  categories: ['api', 'component', 'performance']
});
```

#### **useCacheBusting**
```typescript
const { cacheVersion, bustCache, getCacheBustedUrl } = useCacheBusting({
  enabled: true,
  interval: 300000, // 5 minutes
});
```

#### **useRetry**
```typescript
const { executeWithRetry, cancelCurrentRequest } = useRetry({
  maxRetries: 3,
  retryDelay: 1000,
  retryDelayMultiplier: 2,
});
```

#### **useOfflineMode**
```typescript
const { status, saveOfflineData, loadOfflineData } = useOfflineMode();
```

#### **usePerformanceMetrics**
```typescript
const { startMetric, endMetric, measureApiCall, getMetricsStats } = usePerformanceMetrics();
```

#### **useApiErrorHandler**
```typescript
const { handleApiError, isRetryableError, isAuthError } = useApiErrorHandler();
```

### **Componentes de Sistema**

#### **SystemHealth**
```typescript
// Monitora saúde do sistema em tempo real
<SystemHealth />
```

---

## 🎯 **Próximos Passos**

### **Funcionalidades Planejadas**

1. **Mobile App** - React Native
2. **Advanced Analytics** - Machine Learning
3. **Social Trading** - Copiar estratégias
4. **Multi-exchange** - Suporte a outras corretoras
5. **API Pública** - Para desenvolvedores

### **Melhorias de Performance**

1. **Database Optimization** - Índices e cache
2. **CDN Integration** - Cloudflare
3. **Horizontal Scaling** - Kubernetes HPA
4. **Caching Strategy** - Redis clusters

---

## 📞 **Suporte**

### **Canais de Suporte**

- **Discord:** https://discord.gg/hubdefisats
- **Email:** support@hubdefisats.com
- **GitHub Issues:** Para bugs e features

### **Documentação**

- **README:** Visão geral e instalação
- **API Docs:** `/docs` (Swagger UI)
- **Architecture:** `0.contexto/` folder
- **Troubleshooting:** Esta documentação

---

## 📋 **Checklist de Produção**

- [ ] **Segurança:** 2FA, CAPTCHA, rate limiting configurados
- [ ] **Pagamentos:** Lightning Network configurado
- [ ] **Notificações:** Canais configurados e testados
- [ ] **Monitoramento:** Prometheus/Grafana ativos
- [ ] **Backup:** Estratégia de backup implementada
- [ ] **SSL:** Certificado HTTPS configurado
- [ ] **Domain:** DNS configurado
- [ ] **CI/CD:** Pipeline automatizado ativo
- [ ] **Logs:** Agregação centralizada configurada
- [ ] **Alertas:** Notificações de monitoramento ativas

---

*Última atualização: Janeiro 2025*
*Versão: 1.0.0*
*Status: MVP Completo e Pronto para Produção* 🚀

