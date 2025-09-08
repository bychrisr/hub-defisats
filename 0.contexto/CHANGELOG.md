# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
- N/A

---

## [0.0.6] - 2025-01-XX

### Fixed
- **Containers e Infraestrutura**: Correção completa dos containers Docker
  - Corrigido HTML do frontend com estrutura completa para React
  - Corrigido API URL mismatch entre frontend e backend (porta 3010)
  - Corrigido Swagger documentation server URL
  - Criados workers stub para prevenir container crashes
  - Padronizados comandos entre Dockerfile e docker-compose
  - Corrigida configuração do Vite (porta 3001)

### Added
- **Workers Stub**: Implementação inicial dos workers
  - `margin-monitor.ts` - Monitoramento de margem
  - `automation-executor.ts` - Executor de automações
  - `notification.ts` - Sistema de notificações
  - `payment-validator.ts` - Validação de pagamentos
- **Infraestrutura de Desenvolvimento**: Setup completo
  - PostgreSQL configurado na porta 5432
  - Redis configurado na porta 6379
  - Docker Compose com todos os serviços
  - Scripts de setup automatizados

### Changed
- **Backend**: Padronização do servidor simples para desenvolvimento
- **Frontend**: Configuração correta do Vite para containers
- **Documentação**: Atualização do estado atual do projeto

---

## [0.0.4] - 2024-01-XX

### Added
- Comprehensive security implementation
- Password validation with strength checking
- Have I Been Pwned integration for password security
- Email verification system with nodemailer
- CAPTCHA protection (reCAPTCHA v3 and hCaptcha)
- Input sanitization and XSS prevention
- Rate limiting middleware for login/registration
- Secure cookie management
- Session management with Redis
- Password reset system with secure tokens
- CSRF protection middleware
- Security logging and monitoring
- Two-factor authentication (2FA) system
- Admin security enhancements

### Changed
- Enhanced user model with security fields
- Updated authentication flow with security checks
- Improved password requirements and validation
- Enhanced session management

### Security
- Implemented comprehensive security checklist
- Added protection against common attacks (XSS, CSRF, SQL injection)
- Enhanced authentication with 2FA support
- Added security monitoring and logging
- Implemented rate limiting and CAPTCHA protection
- Enhanced data encryption and sanitization

---

## [0.0.1] - 2024-01-XX

### Added
- Estrutura inicial do projeto hub-defisats
- Documentação técnica completa em `0.contexto/`
- Stack definida: Node.js + Fastify (backend), Next.js 14 (frontend), PostgreSQL + Prisma
- Arquitetura de microserviços com workers para automações
- Sistema de autenticação JWT + Refresh Tokens
- Integração com LN Markets API
- Sistema de notificações multi-canal (Telegram, Email, WhatsApp)
- Pagamentos Lightning Network
- Dashboard administrativo
- Contratos de API completos
- User stories com critérios de aceitação
- ADRs (Architectural Decision Records)
- Estrutura de versionamento 0.X até versão estável

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## [0.1.0] - 2024-01-XX (Planejado)

### Added
- MVP funcional para testers
- Margin Guard 100% funcional
- Cadastro de usuários + keys LN Markets
- Dashboard admin básico
- Logs completos de trades
- Alertas (default: todos ativos)

---

## [0.2.0] - 2024-XX-XX (Planejado)

### Added
- Entradas automáticas, TP/SL
- Backtests pessoais
- Relatórios (exportáveis no futuro)
- Configuração granular de notificações

---

## [0.3.0] - 2024-XX-XX (Planejado)

### Added
- Planos pagos (Basic, Advanced, Pro)
- Pagamentos Lightning (transferência interna + invoice externa)
- Dashboard admin completo (KPIs, faturamento, cupons avançados)
- Marketing site + onboarding comercial

---

## [1.0.0] - 2024-XX-XX (Planejado)

### Added
- Versão estável com todas as funcionalidades básicas
- Testes completos e documentação final
- Deploy em produção com monitoramento
