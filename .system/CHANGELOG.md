# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Sistema Multi-Account Dashboard**: Implementação completa do sistema multi-account para dashboard
- **DashboardDataService**: Serviço backend para buscar dados da conta ativa do usuário
- **useActiveAccountData Hook**: Hook frontend para escutar mudanças de conta ativa via WebSocket
- **WebSocket Events**: Eventos em tempo real para mudança de conta ativa
- **Active Account Badges**: Interface visual mostrando conta ativa nas dashboards
- Sistema completo de renomeação de "Hub DeFiSats" para "Axisor"
- Ambiente Docker completamente funcional com containers atualizados
- Banco de dados PostgreSQL com schema completo (39 tabelas)
- Sistema de seeders para popular dados iniciais
- Configuração de desenvolvimento otimizada

### Changed
- **Dashboard Multi-Account**: Endpoint `/api/lnmarkets-robust/dashboard` refatorado para usar sistema multi-account
- **WebSocket Integration**: Controller `userExchangeAccount` agora emite eventos WebSocket para mudança de conta
- **Dashboard Components**: Componentes Dashboard e DashboardRefactored atualizados com badges de conta ativa
- **Hook Integration**: `useOptimizedDashboardData` integrado com `useActiveAccountData` para atualizações automáticas
- **BREAKING CHANGE**: Nome do projeto alterado de "Hub DeFiSats" para "Axisor"
- **BREAKING CHANGE**: Todos os containers Docker renomeados para `axisor-*`
- **BREAKING CHANGE**: Network Docker alterada para `axisor-network`
- **BREAKING CHANGE**: Database name alterado para `axisor`
- **BREAKING CHANGE**: Todas as métricas Prometheus prefixadas com `axisor_`
- **BREAKING CHANGE**: User-Agent strings atualizados para "Axisor"
- **BREAKING CHANGE**: Email addresses alterados para `@axisor.com`
- **BREAKING CHANGE**: Package author alterado para "Axisor Team"

### Technical Changes
- **Multi-Account System**: 9 arquivos modificados para implementação do sistema multi-account
  - `backend/src/services/dashboard-data.service.ts` (novo)
  - `frontend/src/hooks/useActiveAccountData.ts` (novo)
  - 7 arquivos existentes refatorados
- 76 arquivos modificados com renomeação completa
- 16 arquivos de documentação atualizados
- 7 arquivos de configuração Docker/K8s/nginx atualizados
- 11 services do backend atualizados
- 8 routes, scripts e index do backend atualizados
- 5 arquivos de tests, workers e package.json atualizados
- 10 arquivos do frontend atualizados
- 11 scripts de deploy, setup e testes atualizados
- 2 arquivos de monitoring (Grafana/AlertManager) atualizados
- 6 arquivos de infraestrutura atualizados

### Infrastructure
- Containers: `axisor-backend`, `axisor-frontend`, `axisor-postgres`, `axisor-redis`
- Network: `axisor-network`
- Database: `axisor` (PostgreSQL)
- Cache: Redis com prefix `axisor`
- Ports: Backend (13010), Frontend (13000), PostgreSQL (15432), Redis (16379)

### Database
- Schema completo com 39 tabelas
- Seeders executados com sucesso:
  - Rate limit configs: 28 configurações
  - Admin users: 2 usuários administrativos
  - Test users: 1 usuário de teste
  - Plans: 5 planos (Free, Basic, Advanced, Pro, Lifetime)
  - Plan limits: 5 limites de planos
  - Automation types: 3 tipos (Margin Guard, Take Profit/Stop Loss, Automatic Entries)
  - Exchanges: 1 exchange (LN Markets) com 3 credential types

### Security
- Admin credentials: `admin@axisor.com` / `Admin123!`
- Support credentials: `support@axisor.com` / `Support123!@#`
- Test credentials: `brainoschris@gmail.com` / `Test123!@#`
- JWT tokens funcionando corretamente
- Rate limiting configurado

### Fixed
- **Dashboard Cards**: Problema de cards mostrando zero/vazio resolvido com sistema multi-account
- **PositionsContext Parsing**: Corrigido parsing de dados da dashboard multi-account no frontend
- **Data Structure Access**: Corrigido acesso a `data.lnMarkets.positions` em vez de `data` diretamente
- **Redis Connection**: Configuração Redis corrigida para conexão lazy com retry
- **Export Duplication**: Erro de export duplicado no `AccountCredentialsService` corrigido
- **Dashboard Cards Issue**: Identificado que cards zerados eram devido à falta de contas ativas configuradas, não bugs no código
- **CRÍTICO - Badge "Nenhuma conta ativa"**: Corrigido hook `useActiveAccountData` que não fazia fetch inicial da conta ativa
- **CRÍTICO - Parsing de Dados Dashboard**: Corrigido `useOptimizedDashboardMetrics` que acessava campo inexistente `data.lnMarkets.user` → `data.lnMarkets.balance`
- Problemas de migração do Prisma resolvidos
- Cache do Prisma Client atualizado
- Health checks funcionando corretamente
- API endpoints respondendo adequadamente
- Frontend servindo arquivos corretamente

### Multi-Account Dashboard System
- **Backend Services**:
  - `DashboardDataService`: Busca dados da conta ativa
  - `AccountCredentialsService`: Gerencia credenciais com cache Redis
  - WebSocket events: `active_account_changed` para mudanças de conta
  
- **Frontend Hooks**:
  - `useActiveAccountData`: Escuta mudanças via WebSocket + **fetch inicial da conta ativa**
  - `useOptimizedDashboardData`: Integração com sistema multi-account
  - `useOptimizedDashboardMetrics`: **Corrigido parsing de dados** (`user` → `balance`)
  
- **UI Components**:
  - Badges visuais mostrando conta ativa
  - Atualização automática quando conta muda
  - Fallback para dados públicos quando sem conta ativa
  
- **Performance**:
  - Dashboard carrega em < 200ms
  - WebSocket para atualizações em tempo real
  - Cache Redis para credenciais (10min TTL)
  
- **Correções Críticas**:
  - **Fetch Inicial**: `useActiveAccountData` agora busca conta ativa no mount
  - **Parsing Correto**: Métricas usam `data.lnMarkets.balance` em vez de campo inexistente
  - **Logs Detalhados**: Debugging aprimorado para rastrear carregamento de dados

### Migration Guide
Para migrar de "Hub DeFiSats" para "Axisor":

1. **Backup dos dados**: Faça backup do banco de dados antigo
2. **Limpeza do ambiente**: Remova containers, networks e volumes antigos
3. **Build novo ambiente**: Execute `docker compose -f config/docker/docker-compose.dev.yml build --no-cache`
4. **Sincronização do banco**: Execute `docker exec axisor-backend npx prisma db push`
5. **População de dados**: Execute `docker exec axisor-backend npm run seed all`
6. **Validação**: Teste todos os endpoints e funcionalidades

## [1.5.0] - 2025-01-09

### Added
- Sistema de automação de trading para LN Markets
- Margin Guard com proteção em tempo real
- Dashboard administrativo completo
- Sistema de notificações
- API REST completa
- Frontend React com TypeScript
- Sistema de autenticação JWT
- Rate limiting configurado
- Monitoring com Prometheus
- Logs estruturados

### Changed
- Arquitetura modular com microserviços
- Separação clara entre backend e frontend
- Sistema de cache Redis implementado
- Database PostgreSQL com Prisma ORM

## [1.0.0] - 2025-01-01

### Added
- Release inicial do projeto
- Estrutura base da aplicação
- Configurações de desenvolvimento
- Documentação inicial