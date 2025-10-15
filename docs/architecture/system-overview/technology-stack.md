---
title: "Axisor - Technology Stack"
version: "1.0.0"
created: "2025-01-26"
updated: "2025-01-26"
author: "Documentation Agent"
status: "active"
tags: ["architecture", "technology", "stack", "dependencies"]
---

# Axisor - Technology Stack

> **Status**: Active  
> **Última Atualização**: 2025-01-26  
> **Versão**: 1.0.0  
> **Responsável**: Axisor System Architecture  

## Índice

- [Visão Geral](#visão-geral)
- [Frontend Stack](#frontend-stack)
- [Backend Stack](#backend-stack)
- [Database Stack](#database-stack)
- [Infrastructure Stack](#infrastructure-stack)
- [Development Tools](#development-tools)
- [Monitoring & Observability](#monitoring--observability)
- [External Services](#external-services)
- [Version Compatibility](#version-compatibility)
- [Referências](#referências)

## Visão Geral

O Axisor utiliza uma stack tecnológica moderna e robusta, escolhida para garantir performance, escalabilidade e facilidade de manutenção. A arquitetura é baseada em JavaScript/TypeScript com separação clara entre frontend e backend.

## Frontend Stack

### Core Framework

**React 18.3.1**
- Biblioteca principal para interface de usuário
- Hooks modernos para gerenciamento de estado
- Concurrent Features para melhor performance

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

**Next.js 15.0.3**
- Framework React para SSR/SSG
- Otimizações automáticas
- Roteamento baseado em arquivos

```json
{
  "next": "^15.0.3"
}
```

### Build Tools

**Vite 6.0.5**
- Build tool para desenvolvimento
- Hot Module Replacement (HMR)
- Build otimizado para produção

```json
{
  "vite": "^6.0.5",
  "@vitejs/plugin-react": "^4.3.4"
}
```

### Styling & UI

**Tailwind CSS 3.4.17**
- Framework CSS utilitário
- Design system consistente
- Responsive design

```json
{
  "tailwindcss": "^3.4.17",
  "postcss": "^8.4.49",
  "autoprefixer": "^10.4.20"
}
```

**shadcn/ui**
- Biblioteca de componentes
- Acessibilidade built-in
- Customização via CSS variables

```json
{
  "@radix-ui/react-accordion": "^1.2.2",
  "@radix-ui/react-alert-dialog": "^1.1.4",
  "@radix-ui/react-avatar": "^1.1.2",
  "@radix-ui/react-button": "^1.1.2"
}
```

### State Management

**Zustand 5.0.2**
- Gerenciamento de estado global
- API simples e performática
- TypeScript support nativo

```typescript
// Exemplo de store Zustand
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    // Login logic
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

**TanStack Query 5.66.4**
- Cache e sincronização de dados
- Background updates
- Optimistic updates

```typescript
// Exemplo de query
const { data, isLoading, error } = useQuery({
  queryKey: ['positions', userId],
  queryFn: () => fetchPositions(userId),
  staleTime: 30000, // 30 seconds
  refetchInterval: 60000, // 1 minute
});
```

### Charts & Visualization

**Lightweight Charts 5.0.9**
- Biblioteca de gráficos financeiros
- Performance otimizada
- TradingView-style charts

```json
{
  "lightweight-charts": "5.0.9"
}
```

**Recharts 2.13.3**
- Gráficos React simples
- Responsive charts
- Customização fácil

```json
{
  "recharts": "^2.13.3"
}
```

## Backend Stack

### Runtime & Framework

**Node.js 18+**
- Runtime JavaScript server-side
- V8 engine otimizado
- Async/await nativo

**Fastify 5.1.0**
- Framework web performático
- TypeScript support
- Plugin ecosystem

```json
{
  "fastify": "^5.1.0",
  "@fastify/cors": "^10.0.1",
  "@fastify/helmet": "^12.0.1",
  "@fastify/jwt": "^8.0.1",
  "@fastify/websocket": "^11.0.1"
}
```

### Language & Type Safety

**TypeScript 5.7.3**
- Superset do JavaScript
- Type safety
- IntelliSense avançado

```json
{
  "typescript": "^5.7.3",
  "@types/node": "^22.10.2"
}
```

### Database & ORM

**Prisma 6.16.3**
- ORM moderno
- Type-safe database client
- Migrations automáticas

```json
{
  "prisma": "^6.16.3",
  "@prisma/client": "^6.16.3"
}
```

**PostgreSQL 15+**
- Banco relacional robusto
- ACID compliance
- JSON support nativo

```sql
-- Exemplo de schema Prisma
model User {
  id        String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  email     String   @unique
  username  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Cache & Sessions

**Redis 7+**
- Cache em memória
- Pub/Sub messaging
- Persistence opcional

```json
{
  "ioredis": "^5.4.1"
}
```

### Background Jobs

**BullMQ 5.28.4**
- Queue system baseado em Redis
- Job processing
- Retry logic

```json
{
  "bullmq": "^5.28.4"
}
```

```typescript
// Exemplo de worker
const worker = new Worker('margin-monitor', async (job) => {
  const { userId } = job.data;
  await checkMarginLevels(userId);
}, {
  connection: redis,
  concurrency: 5
});
```

### Authentication & Security

**JWT (jsonwebtoken)**
- Stateless authentication
- Token-based auth
- Refresh token support

```json
{
  "jsonwebtoken": "^9.0.2",
  "@types/jsonwebtoken": "^9.0.7"
}
```

**bcrypt**
- Password hashing
- Salt rounds configuráveis
- Security best practices

```json
{
  "bcrypt": "^6.0.0",
  "@types/bcrypt": "^5.0.2"
}
```

## Database Stack

### Primary Database

**PostgreSQL 15+**
- Relational database
- ACID compliance
- Advanced indexing
- JSON/JSONB support

### Database Features Used

```sql
-- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- JSON operations
SELECT jsonb_extract_path_text(data, 'field') FROM table;

-- Full-text search
CREATE INDEX idx_search ON table USING gin(to_tsvector('english', content));
```

### Database Tools

**Prisma Studio**
- Database browser
- Visual query builder
- Data editing interface

**pgAdmin**
- PostgreSQL administration
- Query execution
- Database monitoring

## Infrastructure Stack

### Containerization

**Docker 24+**
- Container runtime
- Multi-stage builds
- Image optimization

```dockerfile
# Exemplo Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 13010
CMD ["npm", "start"]
```

**Docker Compose**
- Multi-container orchestration
- Service dependencies
- Environment configuration

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "13010:13010"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/axisor
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
```

### Orchestration

**Kubernetes 1.28+**
- Container orchestration
- Auto-scaling
- Service discovery

```yaml
# Exemplo deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axisor-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: axisor-backend
  template:
    spec:
      containers:
      - name: backend
        image: axisor/backend:latest
        ports:
        - containerPort: 13010
```

### Reverse Proxy

**Nginx 1.24+**
- Load balancing
- SSL termination
- Static file serving

```nginx
upstream backend {
    server backend1:13010;
    server backend2:13010;
    server backend3:13010;
}

server {
    listen 443 ssl;
    server_name api.axisor.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Development Tools

### Code Quality

**ESLint 9.17.0**
- JavaScript/TypeScript linting
- Code style enforcement
- Custom rules

```json
{
  "eslint": "^9.17.0",
  "@typescript-eslint/eslint-plugin": "^8.18.2",
  "@typescript-eslint/parser": "^8.18.2"
}
```

**Prettier 3.4.2**
- Code formatting
- Consistent style
- Editor integration

```json
{
  "prettier": "^3.4.2",
  "prettier-plugin-tailwindcss": "^0.6.8"
}
```

### Testing

**Jest 29.7.0**
- Unit testing framework
- Snapshot testing
- Coverage reports

```json
{
  "jest": "^29.7.0",
  "@types/jest": "^29.5.14",
  "ts-jest": "^29.2.5"
}
```

**Playwright 1.49.1**
- End-to-end testing
- Cross-browser testing
- Visual testing

```json
{
  "@playwright/test": "^1.49.1"
}
```

### Build Tools

**Turborepo**
- Monorepo management
- Build caching
- Task orchestration

```json
{
  "turbo": "^2.3.3"
}
```

## Monitoring & Observability

### Metrics & Monitoring

**Prometheus 2.48+**
- Metrics collection
- Time-series database
- Alerting rules

```yaml
# Exemplo configuração Prometheus
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'axisor-backend'
    static_configs:
      - targets: ['backend:13010']
    metrics_path: '/metrics'
```

**Grafana 10.4+**
- Metrics visualization
- Dashboard creation
- Alert management

### Error Tracking

**Sentry**
- Error monitoring
- Performance tracking
- Release tracking

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Logging

**Pino**
- High-performance logging
- JSON structured logs
- Multiple transports

```json
{
  "pino": "^9.6.0",
  "pino-pretty": "^11.2.2"
}
```

## External Services

### Trading APIs

**LN Markets API v2**
- Bitcoin trading
- Lightning Network integration
- REST API

**Binance API**
- Market data
- Price feeds
- Backup data source

### Lightning Network

**LND (Lightning Network Daemon)**
- Lightning payments
- Invoice generation
- Channel management

### Communication

**Telegram Bot API**
- User notifications
- Admin alerts
- Real-time updates

**SMTP**
- Email notifications
- Transaction receipts
- System alerts

## Version Compatibility

### Node.js Compatibility

| Version | Status | Notes |
|---------|--------|-------|
| Node.js 18.x | ✅ Supported | Recommended LTS |
| Node.js 20.x | ✅ Supported | Latest LTS |
| Node.js 16.x | ❌ Deprecated | End of life |

### Database Compatibility

| Version | Status | Notes |
|---------|--------|-------|
| PostgreSQL 15+ | ✅ Supported | Recommended |
| PostgreSQL 14 | ✅ Supported | Legacy support |
| PostgreSQL 13 | ❌ Deprecated | End of life |

### Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |

## Referências

- [High Level Architecture](./high-level-architecture.md)
- [Data Flow Diagrams](./data-flow-diagrams.md)
- [Component Interactions](./component-interactions.md)
- [Package.json Backend](../../../backend/package.json)
- [Package.json Frontend](../../../frontend/package.json)

## Como Usar Este Documento

• **Para Desenvolvedores**: Use como referência para entender as tecnologias utilizadas e suas versões específicas.

• **Para DevOps**: Utilize para configurar ambientes de desenvolvimento e produção com as versões corretas.

• **Para Onboarding**: Use para familiarizar novos desenvolvedores com a stack tecnológica do projeto.
