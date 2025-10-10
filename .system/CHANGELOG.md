# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Sistema completo de renomeação de "Hub DeFiSats" para "Axisor"
- Ambiente Docker completamente funcional com containers atualizados
- Banco de dados PostgreSQL com schema completo (39 tabelas)
- Sistema de seeders para popular dados iniciais
- Configuração de desenvolvimento otimizada

### Changed
- **BREAKING CHANGE**: Nome do projeto alterado de "Hub DeFiSats" para "Axisor"
- **BREAKING CHANGE**: Todos os containers Docker renomeados para `axisor-*`
- **BREAKING CHANGE**: Network Docker alterada para `axisor-network`
- **BREAKING CHANGE**: Database name alterado para `axisor`
- **BREAKING CHANGE**: Todas as métricas Prometheus prefixadas com `axisor_`
- **BREAKING CHANGE**: User-Agent strings atualizados para "Axisor"
- **BREAKING CHANGE**: Email addresses alterados para `@axisor.com`
- **BREAKING CHANGE**: Package author alterado para "Axisor Team"

### Technical Changes
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
- Problemas de migração do Prisma resolvidos
- Cache do Prisma Client atualizado
- Health checks funcionando corretamente
- API endpoints respondendo adequadamente
- Frontend servindo arquivos corretamente

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