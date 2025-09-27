# 📚 DOCUMENTAÇÃO COMPLETA DO PROJETO HUB DEFISATS

## 📋 ÍNDICE

1. [Estrutura Geral do Projeto](#1-estrutura-geral-do-projeto)
2. [Backend](#2-backend)
3. [Frontend](#3-frontend)
4. [WebSocket](#4-websocket)
5. [Integração LN Markets](#5-integração-ln-markets)
6. [Banco de Dados](#6-banco-de-dados)
7. [Configurações e Ambiente](#7-configurações-e-ambiente)
8. [Docker e Deploy](#8-docker-e-deploy)

---

## 1. ESTRUTURA GERAL DO PROJETO

### 📁 Árvore de Diretórios

```
hub-defisats/
├── backend/                    # API Backend (Node.js + Fastify + TypeScript)
│   ├── src/
│   │   ├── config/            # Configurações (env, endpoints, etc.)
│   │   ├── controllers/       # Controladores de rotas
│   │   ├── routes/           # Definições de rotas
│   │   ├── services/         # Serviços de negócio
│   │   ├── middleware/       # Middlewares (auth, rate-limit, etc.)
│   │   ├── types/           # Definições de tipos TypeScript
│   │   ├── utils/           # Utilitários
│   │   ├── workers/         # Workers em background
│   │   └── index.ts         # Ponto de entrada principal
│   ├── prisma/               # Schema e migrações do banco
│   ├── tests/               # Testes unitários e de integração
│   └── package.json         # Dependências do backend
├── frontend/                 # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/       # Componentes React reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── hooks/           # Hooks customizados
│   │   ├── contexts/        # Contextos React
│   │   ├── stores/          # Estado global (Zustand)
│   │   ├── lib/             # Bibliotecas e utilitários
│   │   ├── services/        # Serviços de API
│   │   └── types/           # Definições de tipos TypeScript
│   └── package.json         # Dependências do frontend
├── config/                  # Configurações de ambiente
│   ├── docker/             # Docker Compose e Dockerfiles
│   └── env/                # Arquivos de ambiente
├── .system/                # Documentação do sistema
├── scripts/                # Scripts de automação
└── README.md               # Documentação principal
```

### 🎯 Propósito de Cada Pasta

- **`backend/`**: API REST e WebSocket server usando Fastify
- **`frontend/`**: Interface web usando React + Vite
- **`config/`**: Configurações de ambiente e Docker
- **`.system/`**: Documentação técnica e decisões arquiteturais
- **`scripts/`**: Scripts de automação e utilitários

---

## 2. BACKEND

### 🏗️ Arquitetura

**Framework**: Fastify + TypeScript + Prisma + PostgreSQL + Redis

### 📦 Dependências Principais

```json
{
  "fastify": "^4.24.3",           // Web framework
  "@fastify/jwt": "^7.2.4",       // Autenticação JWT
  "@fastify/websocket": "^11.2.0", // WebSocket support
  "@fastify/cors": "^8.4.0",      // CORS
  "@fastify/rate-limit": "^10.3.0", // Rate limiting
  "@prisma/client": "^5.7.1",     // ORM
  "axios": "^1.6.2",              // HTTP client
  "bcrypt": "^5.1.1",             // Hash de senhas
  "bullmq": "^4.15.4",            // Queue system
  "ioredis": "^5.3.2",            // Redis client
  "winston": "^3.17.0",           // Logging
  "zod": "^4.1.11"                // Validação de schemas
}
```

### 🗂️ Estrutura de Arquivos

#### **`src/config/`** - Configurações
- **`env.ts`**: Validação e configuração de variáveis de ambiente
- **`lnmarkets-endpoints.ts`**: Endpoints da API LN Markets v2

#### **`src/routes/`** - Rotas da API
- **`lnmarkets-robust.routes.ts`**: Endpoint principal `/api/lnmarkets-robust/dashboard`
- **`lnmarkets-centralized.routes.ts`**: Endpoints `/api/lnmarkets-v2/*`
- **`auth.routes.ts`**: Autenticação e login
- **`websocket.routes.ts`**: WebSocket `/ws`
- **`admin/`**: Rotas administrativas

#### **`src/services/`** - Serviços de Negócio
- **`LNMarketsRobustService.ts`**: Serviço principal para LN Markets API
- **`lnmarkets-api.service.ts`**: Serviço alternativo
- **`circuit-breaker.service.ts`**: Circuit breaker pattern
- **`retry.service.ts`**: Retry logic
- **`websocket-manager.service.ts`**: Gerenciamento de conexões WebSocket

#### **`src/middleware/`** - Middlewares
- **`auth.middleware.ts`**: Autenticação JWT
- **`rate-limit.middleware.ts`**: Rate limiting
- **`admin.middleware.ts`**: Verificação de admin

### 🔌 Endpoints Principais

#### **LN Markets API**
- **`GET /api/lnmarkets-robust/dashboard`**: Dashboard unificado com todos os dados
- **`GET /api/lnmarkets-robust/test-connection`**: Teste de conexão
- **`GET /api/lnmarkets-v2/positions`**: Posições específicas
- **`GET /api/lnmarkets-v2/test/positions-direct`**: Teste direto de posições

#### **Autenticação**
- **`POST /api/auth/login`**: Login
- **`POST /api/auth/register`**: Registro
- **`POST /api/auth/refresh`**: Refresh token

#### **WebSocket**
- **`GET /ws`**: Conexão WebSocket principal
- **`GET /ws/realtime`**: WebSocket para dados em tempo real

#### **Admin**
- **`GET /api/admin/*`**: Rotas administrativas
- **`GET /api/admin/menu`**: Menu administrativo

### 🔐 Autenticação LN Markets

#### **Formato da Assinatura**
```typescript
// String de assinatura: timestamp + method + '/v2' + path + params
const message = timestamp + method + '/v2' + path + params;
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(message, 'utf8')
  .digest('base64');
```

#### **Headers Aplicados**
```typescript
headers: {
  'LNM-ACCESS-KEY': apiKey,
  'LNM-ACCESS-SIGNATURE': signature,
  'LNM-ACCESS-PASSPHRASE': passphrase,
  'LNM-ACCESS-TIMESTAMP': timestamp,
  'Content-Type': 'application/json'
}
```

### 🚀 Serviços Principais

#### **LNMarketsRobustService**
```typescript
class LNMarketsRobustService {
  // Métodos principais
  async getAllUserData(): Promise<LNMarketsUserData>
  async getPositions(): Promise<any[]>
  async getMarketData(): Promise<any>
  async makeRequest(request: LNMarketsRequest): Promise<any>
  
  // Configuração
  private signatureFormat: 'base64' | 'hex' = 'base64'
  private circuitBreaker: CircuitBreaker
  private retryService: RetryService
}
```

#### **Circuit Breaker**
```typescript
class CircuitBreaker {
  failureThreshold: 5
  recoveryTimeout: 60000
  monitoringPeriod: 60000
}
```

---

## 3. FRONTEND

### 🏗️ Arquitetura

**Framework**: React + Vite + TypeScript + TailwindCSS + Zustand

### 📦 Dependências Principais

```json
{
  "react": "^18.3.1",                    // Framework React
  "react-dom": "^18.3.1",               // DOM renderer
  "react-router-dom": "^6.28.0",       // Roteamento
  "axios": "^1.12.2",                   // HTTP client
  "zustand": "^4.5.5",                 // Estado global
  "@tanstack/react-query": "^5.59.16", // Cache e sincronização
  "@radix-ui/react-*": "^1.x.x",       // Componentes UI
  "tailwindcss": "^3.4.14",            // CSS framework
  "lucide-react": "^0.451.0",          // Ícones
  "recharts": "^2.15.4",               // Gráficos
  "lightweight-charts": "^4.2.3"       // Gráficos de trading
}
```

### 🗂️ Estrutura de Arquivos

#### **`src/components/`** - Componentes
- **`ui/`**: Componentes base (Button, Input, Card, etc.)
- **`charts/`**: Componentes de gráficos
- **`admin/`**: Componentes administrativos
- **`layout/`**: Componentes de layout

#### **`src/hooks/`** - Hooks Customizados
- **`useOptimizedDashboardData.ts`**: Hook principal para dados da dashboard
- **`useWebSocket.ts`**: Hook para conexão WebSocket
- **`useRealtimeDashboard.ts`**: Hook para dados em tempo real
- **`usePositions.ts`**: Hook para posições

#### **`src/contexts/`** - Contextos React
- **`RealtimeDataContext.tsx`**: Contexto para dados em tempo real
- **`PositionsContext.tsx`**: Contexto para posições
- **`ThemeContext.tsx`**: Contexto para tema

#### **`src/stores/`** - Estado Global (Zustand)
- **`auth.ts`**: Estado de autenticação
- **`centralizedDataStore.ts`**: Store centralizado de dados
- **`automation.ts`**: Estado de automações

#### **`src/pages/`** - Páginas
- **`Dashboard.tsx`**: Página principal
- **`Positions.tsx`**: Página de posições
- **`admin/`**: Páginas administrativas

### 🔌 Configuração Vite

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3001,
    hmr: { clientPort: 13000 },
    proxy: {
      '/api': { target: 'http://backend:3010' },
      '/ws': { target: 'ws://backend:3010', ws: true }
    }
  }
});
```

### 🎣 Hooks Principais

#### **useOptimizedDashboardData**
```typescript
export const useOptimizedDashboardData = () => {
  // Endpoint: /api/lnmarkets-robust/dashboard
  // Retorna: dados unificados da dashboard
  return {
    data: DashboardData | null,
    isLoading: boolean,
    error: string | null,
    refresh: () => Promise<void>
  };
};
```

#### **useWebSocket**
```typescript
export const useWebSocket = (options: UseWebSocketOptions) => {
  // URL: ws://localhost:13000/ws
  // Funcionalidades: reconexão automática, retry logic
  return {
    isConnected: boolean,
    isConnecting: boolean,
    error: string | null,
    send: (message: any) => void
  };
};
```

### 🎨 Componentes UI

#### **Sistema de Design**
- **Base**: Radix UI + TailwindCSS
- **Ícones**: Lucide React
- **Gráficos**: Recharts + Lightweight Charts
- **Tema**: Dark/Light mode com next-themes

#### **Componentes Principais**
- **`Dashboard`**: Layout principal com cards de métricas
- **`PositionsTable`**: Tabela de posições com filtros
- **`TradingChart`**: Gráfico de trading interativo
- **`AdminPanel`**: Painel administrativo

---

## 4. WEBSOCKET

### 🔌 Configuração Backend

#### **Registro no Fastify**
```typescript
// backend/src/index.ts
await fastify.register(websocketRoutes, { prefix: '/ws' });
```

#### **Rota WebSocket**
```typescript
// backend/src/routes/websocket.routes.ts
fastify.get('/ws', { websocket: true }, async (connection, req) => {
  const userId = req.query.userId;
  // Registra conexão no WebSocketManager
  websocketManager.addConnection(userId, connection);
});
```

### 🔌 Configuração Frontend

#### **Hook useWebSocket**
```typescript
// frontend/src/hooks/useWebSocket.ts
const ws = new WebSocket('ws://localhost:13000/ws?userId=' + userId);
```

#### **Proxy Vite**
```typescript
// vite.config.ts
proxy: {
  '/ws': {
    target: 'ws://backend:3010',
    ws: true,
    changeOrigin: true
  }
}
```

### 📡 Funcionalidades WebSocket

- **Conexão em tempo real** com dados de mercado
- **Reconexão automática** com retry logic
- **Gerenciamento de conexões** por usuário
- **Broadcast de mensagens** para múltiplos clientes

---

## 5. INTEGRAÇÃO LN MARKETS

### 🔗 Endpoints Utilizados

#### **API LN Markets v2**
- **`/user`**: Dados do usuário
- **`/futures`**: Posições futuras (com `type=running`)
- **`/user/balance`**: Saldo do usuário
- **`/futures/btc_usd/ticker`**: Dados de mercado

#### **Endpoints Expostos pelo Backend**
- **`/api/lnmarkets-robust/dashboard`**: Dashboard unificado
- **`/api/lnmarkets-robust/test-connection`**: Teste de conexão
- **`/api/lnmarkets-v2/positions`**: Posições específicas

### 🔐 Autenticação

#### **Processo de Autenticação**
1. **Obter credenciais** do banco de dados (criptografadas)
2. **Descriptografar** usando AES-256-GCM
3. **Gerar timestamp** em milliseconds
4. **Construir string de assinatura**: `timestamp + method + '/v2' + path + params`
5. **Gerar HMAC SHA256** com codificação base64
6. **Aplicar headers** LNM-ACCESS-*

#### **Exemplo de Implementação**
```typescript
const timestamp = Date.now().toString();
const method = 'GET';
const path = '/user';
const params = '';

const message = timestamp + method + '/v2' + path + params;
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(message, 'utf8')
  .digest('base64');

headers: {
  'LNM-ACCESS-KEY': apiKey,
  'LNM-ACCESS-SIGNATURE': signature,
  'LNM-ACCESS-PASSPHRASE': passphrase,
  'LNM-ACCESS-TIMESTAMP': timestamp
}
```

### 📊 Estrutura de Dados

#### **Resposta da API LN Markets**
```typescript
interface LNMarketsUserData {
  user: {
    uid: string;
    username: string;
    email: string;
    balance: number;
    // ... outros campos
  };
  positions: Array<{
    id: string;
    symbol: string;
    side: 'long' | 'short';
    quantity: number;
    price: number;
    // ... outros campos
  }>;
  balance: number;
  market: any;
  deposits: any[];
  withdrawals: any[];
  trades: any[];
  orders: any[];
}
```

---

## 6. BANCO DE DADOS

### 🗄️ Schema Principal (Prisma)

#### **Modelo User**
```prisma
model User {
  id                         String    @id @default(dbgenerated("(gen_random_uuid())::text"))
  email                      String    @unique
  username                   String    @unique
  password_hash              String?
  ln_markets_api_key         String?   // Criptografado
  ln_markets_api_secret      String?   // Criptografado
  ln_markets_passphrase      String?   // Criptografado
  plan_type                  PlanType  @default(free)
  is_active                  Boolean   @default(true)
  created_at                 DateTime  @default(now())
  updated_at                 DateTime  @default(now())
  // ... relacionamentos
}
```

#### **Modelos Relacionados**
- **`Automation`**: Automações de trading
- **`TradeLog`**: Logs de trades executados
- **`Notification`**: Configurações de notificações
- **`Payment`**: Histórico de pagamentos
- **`AdminUser`**: Usuários administrativos

#### **Enums**
```prisma
enum PlanType {
  free
  basic
  advanced
  pro
  lifetime
}
```

### 🔐 Criptografia

#### **Algoritmo**: AES-256-GCM
#### **Campos Criptografados**:
- `ln_markets_api_key`
- `ln_markets_api_secret`
- `ln_markets_passphrase`

#### **Processo de Criptografia**
```typescript
// Criptografar
const encrypted = crypto.createCipher('aes-256-gcm', encryptionKey);

// Descriptografar
const decrypted = crypto.createDecipher('aes-256-gcm', encryptionKey);
```

---

## 7. CONFIGURAÇÕES E AMBIENTE

### 🔧 Variáveis de Ambiente

#### **Backend (.env.development)**
```bash
# Database
DATABASE_URL=postgresql://hubdefisats:hubdefisats_dev_password@postgres:5432/hubdefisats

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=2h
REFRESH_TOKEN_SECRET=your_refresh_secret_here

# Encryption
ENCRYPTION_KEY=your_encryption_key_here

# LN Markets API
LN_MARKETS_API_BASE_URL=https://api.lnmarkets.com/v2
LN_MARKETS_API_BASE_URL_TESTNET=https://api.testnet4.lnmarkets.com/v2

# CORS
CORS_ORIGIN=http://localhost:13000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

#### **Frontend (vite.config.ts)**
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api': { target: 'http://backend:3010' },
      '/ws': { target: 'ws://backend:3010', ws: true }
    }
  }
});
```

### 🐳 Docker

#### **docker-compose.dev.yml**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports: ["15432:5432"]
    environment:
      POSTGRES_DB: hubdefisats
      POSTGRES_USER: hubdefisats
      POSTGRES_PASSWORD: hubdefisats_dev_password

  redis:
    image: redis:7
    ports: ["16379:6379"]

  backend:
    build: { context: ../../backend, dockerfile: Dockerfile.dev }
    ports: ["13010:3010"]
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: postgresql://hubdefisats:hubdefisats_dev_password@postgres:5432/hubdefisats
      REDIS_URL: redis://redis:6379

  frontend:
    build: { context: ../../frontend, dockerfile: Dockerfile.dev }
    ports: ["13000:3001"]
    depends_on: [backend]
```

#### **Portas**
- **Frontend**: `13000` (externa) → `3001` (container)
- **Backend**: `13010` (externa) → `3010` (container)
- **PostgreSQL**: `15432` (externa) → `5432` (container)
- **Redis**: `16379` (externa) → `6379` (container)

---

## 8. DOCKER E DEPLOY

### 🐳 Containers

#### **Backend Container**
- **Base**: Node.js Alpine
- **Porta**: 3010 (interna) / 13010 (externa)
- **Volumes**: Código fonte montado para desenvolvimento
- **Health Check**: `/api/health-check`

#### **Frontend Container**
- **Base**: Node.js Alpine
- **Porta**: 3001 (interna) / 13000 (externa)
- **Volumes**: Código fonte montado para desenvolvimento
- **Health Check**: HTTP check na porta 3001

#### **PostgreSQL Container**
- **Base**: PostgreSQL 15 Alpine
- **Porta**: 5432 (interna) / 15432 (externa)
- **Volume**: Dados persistentes

#### **Redis Container**
- **Base**: Redis 7
- **Porta**: 6379 (interna) / 16379 (externa)
- **Volume**: Dados persistentes

### 🚀 Comandos de Deploy

#### **Desenvolvimento**
```bash
# Iniciar todos os serviços
docker compose -f config/docker/docker-compose.dev.yml up -d

# Ver logs
docker compose -f config/docker/docker-compose.dev.yml logs -f

# Parar serviços
docker compose -f config/docker/docker-compose.dev.yml down
```

#### **Produção**
```bash
# Build para produção
docker compose -f config/docker/docker-compose.prod.yml build

# Deploy
docker compose -f config/docker/docker-compose.prod.yml up -d
```

### 🔄 Workers (Background Jobs)

#### **Workers Disponíveis**
- **`margin-monitor`**: Monitoramento de margem
- **`automation-executor`**: Execução de automações
- **`notification-worker`**: Envio de notificações
- **`payment-validator`**: Validação de pagamentos

#### **Ativação**
```bash
# Ativar workers
docker compose -f config/docker/docker-compose.dev.yml --profile workers up -d
```

---

## 📊 RESUMO TÉCNICO

### 🏗️ Arquitetura Geral
- **Backend**: Fastify + TypeScript + Prisma + PostgreSQL + Redis
- **Frontend**: React + Vite + TypeScript + TailwindCSS + Zustand
- **WebSocket**: Real-time communication
- **LN Markets**: API v2 integration com autenticação HMAC
- **Docker**: Containerização completa

### 🔌 Endpoints Principais
- **Dashboard**: `/api/lnmarkets-robust/dashboard`
- **WebSocket**: `/ws`
- **Auth**: `/api/auth/*`
- **Admin**: `/api/admin/*`

### 🔐 Segurança
- **JWT**: Autenticação de usuários
- **AES-256-GCM**: Criptografia de credenciais
- **HMAC SHA256**: Assinatura para LN Markets API
- **Rate Limiting**: Proteção contra abuse
- **CORS**: Configuração de origens permitidas

### 📈 Monitoramento
- **Health Checks**: Verificação de saúde dos serviços
- **Logging**: Winston com diferentes níveis
- **Metrics**: Prometheus (produção)
- **Error Tracking**: Sentry (opcional)

---

**📝 Esta documentação reflete o estado atual do projeto Hub DeFiSats em 27/09/2025.**
