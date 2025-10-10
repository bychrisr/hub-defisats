# Stack Tecnológica Completa

## 1. Backend

### 1.1 Runtime e Framework
- **Node.js**: 18+ (LTS)
- **Framework**: Fastify 4.x
- **Linguagem**: TypeScript 5.x
- **Build Tool**: tsx para desenvolvimento, tsc para produção

### 1.2 Justificativas Técnicas
- **Performance**: Fastify é um dos frameworks mais rápidos para Node.js, atendendo requisito de latência <200ms
- **TypeScript**: Suporte first-class com tipagem estática e DX excelente
- **Ecossistema**: Rico em plugins e middlewares para autenticação, validação e logging
- **Escalabilidade**: Arquitetura leve e modular permite escala horizontal
- **Integração**: Excelente compatibilidade com Prisma, WebSocket e APIs RESTful

### 1.3 Bibliotecas Principais
```json
{
  "fastify": "^4.24.3",
  "@fastify/cors": "^8.4.0",
  "@fastify/helmet": "^11.1.1",
  "@fastify/jwt": "^7.2.4",
  "@fastify/rate-limit": "^8.0.3",
  "@fastify/swagger": "^8.12.0",
  "@fastify/swagger-ui": "^2.0.0",
  "prisma": "^5.7.1",
  "@prisma/client": "^5.7.1",
  "bullmq": "^4.15.4",
  "ioredis": "^5.3.2",
  "axios": "^1.6.2",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "zod": "^3.22.4",
  "ws": "^8.14.2",
  "socket.io": "^4.7.4"
}
```

### 1.4 Novos Serviços Implementados
- **TooltipService**: Gerenciamento de tooltips e cards do dashboard
- **MetricsHistoryService**: Histórico de métricas e performance
- **WebSocketService**: Comunicação em tempo real com LN Markets
- **AdminMiddleware**: Middleware para verificação de permissões administrativas
- **ExchangeService**: Gerenciamento genérico de exchanges e credenciais
- **CredentialTestService**: Teste de credenciais para múltiplas exchanges
- **TestUserSeeder**: Seeder para usuários de teste com plano vitalício

## 2. Frontend

### 2.1 Framework e Build
- **Framework**: React 18
- **Build Tool**: Vite 5.x
- **Linguagem**: TypeScript 5.x
- **Bundler**: Rollup (via Vite)

### 2.2 Justificativas Técnicas
- **Performance**: Vite oferece HMR extremamente rápido
- **Modern Stack**: React 18 com Concurrent Features
- **TypeScript**: Tipagem end-to-end com backend
- **Bundle Size**: Otimização automática e code splitting
- **Developer Experience**: Hot reload instantâneo

### 2.3 Bibliotecas Principais
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.1",
  "zustand": "^4.4.7",
  "axios": "^1.6.2",
  "recharts": "^2.8.0",
  "socket.io-client": "^4.7.4",
  "react-hook-form": "^7.48.2",
  "react-query": "^3.39.3",
  "framer-motion": "^10.16.16"
}
```

### 2.4 UI e Styling
- **CSS Framework**: Tailwind CSS 3.x
- **Component Library**: shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Tooltips**: Sistema customizado com posicionamento inteligente

### 2.5 Design System
- **Paleta de Cores**: CoinGecko Inspired (Atualizada v1.4.0)
  - Primária: `#4d7cff` (Vibrant Blue)
  - Secundária: `#ffb84d` (Vibrant Orange)
  - Sucesso: `#1dd1a1` (Vibrant Green)
  - Destrutiva: `#ff6b7a` (Vibrant Red)
  - Texto: `#fafbfc` (Vibrant White), `#b8bcc8` (Vibrant Secondary)
- **Tipografia**: Inter (principal) + JetBrains Mono (dados técnicos)
- **Fonte Mono**: JetBrains Mono, Fira Code, Monaco, Cascadia Code
- **Temas**: Light/Dark mode com CSS variables
- **Tokens**: Design tokens centralizados
- **Classes CSS**: .icon-primary, .text-vibrant, .card-modern, .btn-modern

### 2.6 Sistema de Internacionalização (i18n)
- **Bibliotecas**: react-i18next, i18next, i18next-browser-languagedetector
- **Idiomas Suportados**: Português Brasileiro (PT-BR), Inglês Americano (EN-US)
- **Detecção Automática**: Baseada no navegador do usuário
- **Persistência**: localStorage para preferências do usuário
- **Conversão de Moedas**: Integração com CoinGecko e ExchangeRate APIs
- **Moedas Suportadas**: BTC, USD, BRL, EUR, sats
- **Cache Inteligente**: 5 minutos de duração com atualização automática
- **Formatação Inteligente**: Hooks customizados para formatação de valores, datas e status

## 3. Banco de Dados

### 3.1 Database Principal
- **PostgreSQL**: 15+
- **ORM**: Prisma 5.x
- **Migrations**: Prisma Migrate
- **Studio**: Prisma Studio para debugging

### 3.2 Justificativas Técnicas
- **Relacional**: Perfeito para o schema complexo com relacionamentos definidos
- **JSONB**: Suporte nativo para campos configuráveis (automation.config, notification.channel_config)
- **Confiabilidade**: ACID compliance para integridade de dados financeiros
- **Escalabilidade**: Suporte a réplicas e particionamento
- **Extensions**: Suporte a extensões como pgcrypto para criptografia

### 3.3 Cache e Storage
- **Redis**: 7+ (Cache primário e filas)
- **Object Storage**: MinIO (relatórios, backups)
- **Session Storage**: Redis
- **Rate Limiting**: Redis com sliding window

## 4. Autenticação e Segurança

### 4.1 Autenticação
- **JWT**: Access tokens (15min) + refresh tokens (7d)
- **Social Auth**: Passport.js com Google/GitHub
- **2FA**: Google Authenticator (obrigatório para admins)
- **Session Management**: Redis com controle de sessões ativas

### 4.2 Criptografia
- **Senhas**: bcrypt com salt rounds 12
- **Keys LN Markets**: AES-256
- **Dados Sensíveis**: libsodium
- **Tokens**: JWT com chave secreta forte

### 4.3 Proteção contra Ataques
- **Rate Limiting**: 5 tentativas/15min login, 3 tentativas/1h registro
- **CAPTCHA**: reCAPTCHA v3 + hCaptcha fallback
- **CSRF**: Tokens CSRF para operações state-changing
- **XSS**: DOMPurify, escape de HTML, CSP headers
- **SQL Injection**: Prisma ORM com prepared statements

## 5. Mensageria e Filas

### 5.1 Sistema de Filas
- **Redis**: 7+ como broker
- **BullMQ**: Gerenciamento de filas
- **Workers**: Processamento assíncrono
- **Retry Logic**: Backoff exponencial

### 5.2 Filas Específicas
```typescript
// Filas principais
'margin-check'           // Monitoramento de margem (alta prioridade)
'automation-executor'    // Execução de automações
'simulation-executor'    // Simulações em tempo real
'notification'           // Envio de notificações
'payment-validator'      // Validação de pagamentos
'backtest-processor'     // Processamento de backtests
```

### 5.3 WebSockets
- **Socket.IO**: Comunicação em tempo real
- **Eventos**: Atualizações de margem, status de automações, notificações
- **Rooms**: Por usuário para dados privados
- **Fallback**: Long polling para compatibilidade

## 6. Integração com APIs Externas

### 6.1 LN Markets API
- **Base URL**: `https://api.lnmarkets.com/v2`
- **Autenticação**: HMAC-SHA256
- **Rate Limiting**: 100 requests/minuto
- **Retry**: Backoff exponencial

### 6.2 Lightning Network
- **LNbits**: Integração para pagamentos
- **LND**: Node Lightning (opcional)
- **WebLN**: Integração com carteiras

### 6.3 Serviços de Notificação
- **Telegram**: Bot API
- **Email**: SMTP (Gmail/SendGrid)
- **WhatsApp**: EvolutionAPI
- **Webhook**: Notificações customizadas

## 7. Infraestrutura e Deploy

### 7.1 Containerização
- **Docker**: Multi-stage builds otimizados
- **Docker Compose**: Desenvolvimento local
- **Kubernetes**: Produção com Helm charts
- **Images**: Alpine Linux para tamanho mínimo

### 7.2 Orquestração
- **Kubernetes**: Deploy em produção
- **Helm**: Gerenciamento de charts
- **Ingress**: Traefik para roteamento
- **Secrets**: Kubernetes Secrets para dados sensíveis

### 7.3 Networking
- **Nginx**: Reverse proxy, SSL termination
- **SSL**: Let's Encrypt com auto-renewal
- **Load Balancing**: Distribuição de carga
- **CDN**: CloudFlare para assets estáticos

## 8. Monitoramento e Observabilidade

### 8.1 Logs
- **Estruturados**: JSON format com níveis
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Correlação**: Request ID para rastreamento
- **Rotação**: Logrotate para arquivos grandes

### 8.2 Métricas
- **Prometheus**: Coleta de métricas
- **Grafana**: Dashboards e visualizações
- **Custom Metrics**: Métricas de negócio
- **Alerting**: AlertManager para notificações

### 8.3 APM
- **Sentry**: Error tracking e performance
- **New Relic**: APM completo (opcional)
- **Custom Dashboards**: Métricas específicas do negócio

## 9. CI/CD e Qualidade

### 9.1 Pipeline
- **GitHub Actions**: CI/CD automatizado
- **Testing**: Jest + Cypress
- **Linting**: ESLint + Prettier
- **Security**: Snyk + Trivy
- **Deploy**: Automático para staging, manual para produção

### 9.2 Qualidade de Código
- **TypeScript**: Tipagem estática
- **ESLint**: Linting automático
- **Prettier**: Formatação consistente
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Padrão de commits

### 9.3 Testes
- **Unit Tests**: Jest para funções isoladas
- **Integration Tests**: Testes de API
- **E2E Tests**: Cypress para fluxos completos
- **Load Tests**: Artillery para performance
- **Coverage**: 80%+ backend, 70%+ frontend

## 10. Workers e Processamento Assíncrono

### 10.1 Workers Principais
- **Margin Monitor Worker**: Monitoramento contínuo da margem (5s)
- **Automation Executor Worker**: Execução de ordens automatizadas
- **Simulation Executor Worker**: Execução de simulações em tempo real
- **Notification Worker**: Envio de notificações multi-canal
- **Payment Validator Worker**: Validação de pagamentos Lightning (30s)

### 10.2 Tecnologias de Workers
- **BullMQ**: Sistema de filas robusto e escalável
- **Redis**: Backend para filas e cache
- **TypeScript**: Tipagem estática para workers
- **Docker**: Containerização para isolamento
- **Kubernetes**: Orquestração e auto-scaling

### 10.3 Configuração de Workers
- **Concorrência**: Configurável por worker (10-20 jobs simultâneos)
- **Retry Logic**: Exponential backoff com máximo de tentativas
- **Dead Letter Queue**: Jobs que falharam definitivamente
- **Monitoring**: Métricas de performance e taxa de sucesso
- **Health Checks**: Verificação de saúde dos workers

### 10.4 Filas e Prioridades
- **Critical**: Alertas de margem crítica
- **High**: Execução de automações
- **Normal**: Notificações e validações
- **Low**: Logs e relatórios

## 11. Backup e Disaster Recovery

### 11.1 Backup de Dados
- **PostgreSQL**: pgBackRest com retenção configurável
- **Redis**: RDB + AOF para persistência
- **Files**: Restic para arquivos e objetos
- **Encryption**: Backup criptografado

### 10.2 Disaster Recovery
- **RTO**: 4 horas (Recovery Time Objective)
- **RPO**: 1 hora (Recovery Point Objective)
- **Multi-region**: Backup em região diferente
- **Testing**: Testes regulares de restore

## 11. Desenvolvimento e Ferramentas

### 11.1 Ambiente de Desenvolvimento
- **Docker Compose**: Todos os serviços locais
- **Hot Reload**: Frontend e backend
- **Database**: PostgreSQL local com dados de seed
- **Redis**: Instância local para desenvolvimento

### 11.2 Ferramentas de Desenvolvimento
- **IDE**: VS Code com extensões TypeScript
- **Database**: Prisma Studio + pgAdmin
- **API**: Swagger UI + Postman
- **Git**: Git Flow para versionamento

### 11.3 Scripts de Desenvolvimento
```bash
# Desenvolvimento
npm run dev              # Inicia todos os serviços
npm run dev:backend      # Apenas backend
npm run dev:frontend     # Apenas frontend
npm run workers          # Apenas workers

# Testes
npm run test             # Todos os testes
npm run test:unit        # Testes unitários
npm run test:e2e         # Testes E2E
npm run test:coverage    # Cobertura de testes

# Build e Deploy
npm run build            # Build para produção
npm run start            # Inicia em produção
npm run deploy:staging   # Deploy para staging
npm run deploy:prod      # Deploy para produção
```

## 12. Configuração de Ambiente

### 12.1 Variáveis de Ambiente
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/axisor"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# LN Markets
LNMARKETS_API_URL="https://api.lnmarkets.com/v2"
LNMARKETS_SANDBOX_URL="https://api.lnmarkets.com/v2"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# External APIs
TELEGRAM_BOT_TOKEN="your-bot-token"
SENTRY_DSN="your-sentry-dsn"
```

### 12.2 Configuração Docker
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: axisor
      POSTGRES_USER: axisor
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    ports:
      - "13010:13010"
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
  
  frontend:
    build: ./frontend
    ports:
      - "13000:13000"
    depends_on:
      - backend
```

## 13. Considerações de Performance

### 13.1 Otimizações Backend
- **Connection Pooling**: Prisma com pool otimizado
- **Caching**: Redis para dados frequentes
- **Compression**: Gzip para responses
- **Rate Limiting**: Proteção contra abuse

### 13.2 Otimizações Frontend
- **Code Splitting**: Lazy loading de rotas
- **Bundle Optimization**: Tree shaking e minificação
- **CDN**: Assets estáticos via CDN
- **Caching**: Service Worker para cache offline

### 13.3 Otimizações Database
- **Indexes**: Índices otimizados para queries
- **Query Optimization**: Queries eficientes
- **Connection Pooling**: Pool de conexões otimizado
- **Read Replicas**: Para consultas de leitura

---

**Documento**: Stack Tecnológica Completa  
**Versão**: 1.3.0  
**Última Atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento
