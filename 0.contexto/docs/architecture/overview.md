# Arquitetura do Sistema

Este documento descreve a arquitetura geral do hub-defisats, baseada na stack definida em `fullstake.md`.

## Visão Geral

O hub-defisats é uma plataforma de automação de trades para LN Markets, construída com arquitetura de microserviços e foco em performance, segurança e escalabilidade.

## Arquitetura de Alto Nível

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Internet      │    │   Global Proxy  │    │   Application   │
│   (HTTPS)       │◄──►│   (Nginx)       │◄──►│   Container     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   SSL/TLS       │    │   Frontend      │
                       │   Termination   │    │   (Next.js 14)  │
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   API Gateway   │
                                               │   (Fastify)     │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Core Services │
                                               │   (Fastify)     │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Worker        │
                                               │   Services      │
                                               │   (BullMQ)      │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Database      │
                                               │   (PostgreSQL)  │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Cache &       │
                                               │   Queue         │
                                               │   (Redis)       │
                                               └─────────────────┘
```

## Componentes Principais

### 1. Global Proxy (Nginx)
- **Responsabilidade**: SSL termination, HTTP→HTTPS redirect, roteamento de domínios
- **Tecnologias**: Nginx Alpine, Docker
- **Funcionalidades**:
  - SSL/TLS termination para todos os domínios
  - Redirecionamento automático HTTP→HTTPS
  - Roteamento para containers de aplicação
  - Headers de segurança globais
  - Rate limiting global
- **Localização**: `~/proxy/` (container separado)
- **Rede**: `proxy-network` (compartilhada entre projetos)

### 2. Frontend (Next.js 14)
- **Responsabilidade**: Interface do usuário, autenticação, visualização de dados
- **Tecnologias**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Design System**: CoinGecko Inspired com design tokens centralizados
- **Estado**: Zustand para client state, TanStack Query para server state
- **Comunicação**: REST API + WebSocket para tempo real
- **Componentes UI**: CoinGeckoCard, PriceChange, ThemeContext
- **Temas**: Light/Dark mode com transições suaves

### 2. API Gateway (Fastify)
- **Responsabilidade**: Roteamento, autenticação, rate limiting, validação
- **Tecnologias**: Fastify, TypeScript, JWT, Zod
- **Funcionalidades**:
  - Autenticação JWT + Refresh Tokens
  - Rate limiting por usuário/IP
  - Validação de payloads
  - Logging e métricas

### 3. Core Services (Fastify)
- **Responsabilidade**: Lógica de negócio, integração com LN Markets
- **Tecnologias**: Fastify, TypeScript, Prisma
- **Serviços**:
  - User Service (CRUD, autenticação)
  - Automation Service (CRUD, validação)
  - Trade Service (logs, histórico)
  - Payment Service (Lightning invoices)
  - Notification Service (multi-canal)

### 4. Worker Services (BullMQ)
- **Responsabilidade**: Processamento assíncrono, monitoramento
- **Tecnologias**: BullMQ, Redis, TypeScript
- **Workers**:
  - Margin Monitor Worker (monitoramento de margem)
  - Automation Executor Worker (execução de ordens)
  - Notification Worker (envio de alertas)
  - Payment Validator Worker (validação de pagamentos)

### 5. Database (PostgreSQL)
- **Responsabilidade**: Persistência de dados, relacionamentos
- **Tecnologias**: PostgreSQL 15+, Prisma ORM
- **Características**:
  - ACID compliance para dados financeiros
  - JSONB para configurações flexíveis
  - Índices otimizados para consultas frequentes
  - Backup automatizado

### 6. Cache & Queue (Redis)
- **Responsabilidade**: Cache, filas, pub/sub
- **Tecnologias**: Redis 7+, BullMQ
- **Uso**:
  - Cache de dados frequentes (KPIs, status)
  - Filas de processamento assíncrono
  - Pub/Sub para WebSocket
  - Rate limiting distribuído

## Fluxos de Dados

### 1. Autenticação
```
User → Frontend → API Gateway → User Service → Database
                ↓
            JWT Token ← Refresh Token (HTTP-only cookie)
```

### 2. Execução de Automação
```
User Config → Frontend → API Gateway → Automation Service → Database
                                    ↓
                            Margin Monitor Worker → LN Markets API
                                    ↓
                            Automation Executor → Trade Log
                                    ↓
                            Notification Worker → Multi-channel
```

### 3. Monitoramento em Tempo Real
```
LN Markets API → Margin Monitor Worker → Redis Pub/Sub → WebSocket → Frontend
```

### 4. Pagamento Lightning
```
User → Frontend → Payment Service → Lightning Node → Webhook → Payment Validator
```

## Design System Architecture

### 1. CoinGecko Inspired Design System
- **Design Tokens**: Centralizados em `frontend/src/lib/design-tokens.ts`
- **Paleta de Cores**: 
  - Primária: `#3773f5` (CoinGecko Blue)
  - Secundária: `#f5ac37` (CoinGecko Orange)
  - Sucesso: `#0ecb81` (CoinGecko Green)
  - Destrutiva: `#f6465d` (CoinGecko Red)
- **Tipografia**: Inter (principal) + JetBrains Mono (dados técnicos)
- **Temas**: Light/Dark mode com CSS variables
- **Componentes**: CoinGeckoCard, PriceChange, ThemeContext

### 2. Componentes UI Específicos
- **CoinGeckoCard**: Card component com estilo CoinGecko
- **PriceChange**: Componente para exibir mudanças de preço com cores semânticas
- **ThemeContext**: Context para gerenciamento de temas
- **Design System Page**: Página de demonstração dos componentes

### 3. Configuração Tailwind
- Cores específicas do CoinGecko mapeadas para classes Tailwind
- CSS variables para temas light/dark
- Animações e transições otimizadas
- Breakpoints responsivos

## Padrões Arquiteturais

### 1. Microserviços
- Separação clara de responsabilidades
- Deploy independente
- Escalabilidade horizontal
- Isolamento de falhas

### 2. Event-Driven Architecture
- Workers processam eventos assíncronos
- Pub/Sub para comunicação entre serviços
- WebSocket para tempo real
- Retry automático em falhas

### 3. CQRS (Command Query Responsibility Segregation)
- Comandos (writes) via API REST
- Queries (reads) otimizadas com cache
- Separação de modelos de leitura/escrita

### 4. Circuit Breaker
- Proteção contra falhas em cascata
- Fallback para serviços externos
- Monitoramento de saúde dos serviços

## Segurança

### 1. Autenticação
- JWT com expiração curta (15-30 min)
- Refresh tokens em HTTP-only cookies
- Social auth (Google, GitHub)
- Criptografia AES-256 para keys sensíveis

### 2. Autorização
- RBAC (Role-Based Access Control)
- Middleware de autorização por rota
- Validação de permissões por plano

### 3. Criptografia
- Senhas com bcrypt/argon2
- Keys LN Markets com AES-256
- HTTPS obrigatório
- Secrets em variáveis de ambiente

### 4. Rate Limiting
- Por usuário autenticado
- Por IP para endpoints públicos
- Diferentes limites por plano
- Redis para rate limiting distribuído

## Monitoramento e Observabilidade

### 1. Logging
- Structured logging (JSON)
- Níveis: DEBUG, INFO, WARN, ERROR
- Correlação de requests (trace ID)
- Logs centralizados (ELK Stack)

### 2. Métricas
- Prometheus para métricas
- Grafana para dashboards
- Métricas customizadas por serviço
- Alertas automáticos

### 3. Tracing
- Distributed tracing
- Performance monitoring
- Error tracking (Sentry)
- Health checks

### 4. Alertas
- Falhas de automação
- Latência alta
- Erros de integração
- Uso de recursos

## Escalabilidade

### 1. Horizontal Scaling
- Global Proxy (Nginx) para load balancing
- Múltiplas instâncias de API
- Workers distribuídos
- Database read replicas
- Proxy global escalável para múltiplos projetos

### 2. Caching Strategy
- Redis para cache de aplicação
- CDN para assets estáticos
- Cache de queries frequentes
- Invalidação inteligente

### 3. Database Optimization
- Índices otimizados
- Connection pooling
- Query optimization
- Partitioning por data

### 4. Queue Management
- Múltiplas filas por prioridade
- Dead letter queues
- Retry policies
- Monitoring de filas

## Deploy e Infraestrutura

### 1. Containerização
- Docker para todos os serviços
- Multi-stage builds
- Imagens otimizadas
- Health checks

### 2. Orquestração
- Docker Compose para desenvolvimento
- Global Proxy separado para SSL/HTTPS
- Kubernetes para produção
- Helm charts para configuração
- Auto-scaling baseado em métricas
- Rede compartilhada (proxy-network) entre projetos

### 3. CI/CD
- GitHub Actions
- Testes automatizados
- Deploy por ambiente
- Rollback automático

### 4. Backup e Recovery
- Backup automatizado do banco
- Backup de configurações
- Disaster recovery plan
- RTO/RPO definidos

## Considerações de Performance

### 1. Latência
- Meta: <200ms para automações
- Cache de dados frequentes
- Connection pooling
- Otimização de queries

### 2. Throughput
- Processamento assíncrono
- Workers paralelos
- Rate limiting inteligente
- Load balancing

### 3. Disponibilidade
- Meta: 99.5% uptime
- Health checks
- Circuit breakers
- Failover automático

### 4. Recursos
- Monitoramento de CPU/Memory
- Auto-scaling
- Resource limits
- Garbage collection otimizado
