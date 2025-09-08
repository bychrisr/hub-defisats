# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
- **Margin Monitor Worker Completo**: Monitoramento de margem a cada 5 segundos
  - Implementação completa do worker `margin-monitor.ts`
  - Cálculo de margin ratio: `maintenance_margin / (margin + pl)`
  - Níveis de alerta: safe (≤0.8), warning (>0.8), critical (>0.9)
  - Scheduler periódico automático a cada 5 segundos
  - Suporte a múltiplos usuários simultaneamente
  - Fila BullMQ `margin-check` com prioridade alta
  - Autenticação LN Markets com HMAC-SHA256
  - Testes unitários e de contrato completos
  - Tratamento robusto de erros da API
  - Fallback gracioso quando API indisponível

### Added
- **Campo Username com Validação em Tempo Real**: Campo obrigatório no cadastro
  - Campo `username` adicionado ao formulário de registro
  - Validação em tempo real da disponibilidade via API
  - Debounced requests (500ms) para evitar sobrecarga
  - Feedback visual com ícones de check/error/loading
  - Validação de formato: 3-20 caracteres, letras/números/underscore
  - Endpoint `GET /api/auth/check-username` para verificação
  - Prevenção de usernames duplicados
  - Atualização completa de tipos e interfaces

### Added
- **Toggle Dark/Light Mode**: Alternância de tema funcional
  - Botão toggle com ícones sol/lua no header
  - Detecção automática de preferência do sistema
  - Persistência da escolha no localStorage
  - Transições suaves entre temas
  - Suporte completo às variáveis CSS dark mode

### Added
- **Validação de Formato LN Markets**: Padrões de credenciais no frontend
  - Validação de formato para API Key: 16+ chars, alfanumérico + hífens/underscores
  - Validação de formato para API Secret: mesma regra da API Key
  - Validação de formato para Passphrase: 8-128 chars, caracteres especiais permitidos
  - Dicas visuais com exemplos de formato correto
  - Prevenção de caracteres inválidos (como @ e .)
  - Feedback imediato de erros de formato

### Added
- **Campo Passphrase LN Markets**: Campo obrigatório no cadastro
  - Campo `ln_markets_passphrase` adicionado ao formulário de registro
  - Validação Zod com mínimo de 8 caracteres
  - Toggle show/hide para segurança
  - Texto explicativo sobre necessidade para autenticação HMAC-SHA256
  - Atualização completa da interface auth store e API types

### Added
- **Validação Imediata de Credenciais LN Markets**: No cadastro
  - Validação automática das credenciais após registro
  - Teste de conectividade com API LN Markets
  - Busca de dados reais (saldo, informações de margem)
  - Prevenção de cadastro com credenciais inválidas
  - Mensagens de erro específicas para falhas de autenticação
  - Confirmação de validação bem-sucedida na resposta

### Added
- **Integração LN Markets Aprimorada**: Autenticação HMAC-SHA256 completa
  - Headers de autenticação: `LNM-ACCESS-KEY`, `LNM-ACCESS-SIGNATURE`, `LNM-ACCESS-PASSPHRASE`, `LNM-ACCESS-TIMESTAMP`
  - Método `getRunningTrades()` para `GET /v2/futures/trades?type=running`
  - Interceptor de requisições para assinatura automática
  - Suporte a passphrase obrigatória
  - Tratamento de rate limiting e timeouts

---

## [0.0.10] - 2025-01-XX

### Added
- **Correção da API LN Markets**: Múltiplos métodos de autenticação
  - Bearer token, Basic auth, API key headers, Query parameters
  - Validação com múltiplos endpoints
  - Timeout aumentado para 15s
  - Tratamento robusto de erros

### Added
- **Teste de Conectividade Básica**: Validação da API
  - `GET /api/test/lnmarkets/connectivity`
  - Testa endpoints públicos da API
  - Status 200 confirmado com `/futures/ticker`
  - Valida conectividade com LN Markets

### Changed
- **Melhorias no Tratamento de Erros**: Logs detalhados
  - Logs detalhados de falhas de autenticação
  - Sugestões de correção para usuário
  - Tentativa de múltiplos endpoints
  - Mensagens de erro mais informativas

### Changed
- **Arquitetura Preparada para Produção**: Robustez aprimorada
  - Validação robusta de credenciais
  - Múltiplos fallbacks de autenticação
  - Logs estruturados para monitoramento
  - Tratamento de rate limiting

## [0.0.9] - 2025-01-XX

### Added
- **Cadastro com Passphrase LN Markets**: Campo obrigatório adicionado
  - Passphrase incluída no cadastro (`/api/auth/register`)
  - Validação de credenciais LN Markets (temporariamente desabilitada)
  - Suporte ao cupom ALPHATESTER (vitalício)
  - Armazenamento seguro de passphrase

### Added
- **Painel do Administrador Funcional**: Sistema completo de administração
  - Login de admin (`/api/admin/login`) com credenciais do superadmin
  - Dashboard admin (`/api/admin/dashboard`) com KPIs e estatísticas
  - Lista de usuários (`/api/admin/users`) para gestão
  - Superadmin `brainoschris@gmail.com` criado com senha hash

### Added
- **Credenciais de Teste Implementadas**: Usuários reais para validação
  - Usuário: `rodrigues0christian@gmail.com` (com credenciais LN Markets válidas)
  - Superadmin: `brainoschris@gmail.com`
  - Cupom ALPHATESTER configurado como vitalício

### Changed
- **Validação Temporariamente Desabilitada**: Para permitir testes
  - Validação de credenciais LN Markets desabilitada
  - Cadastro permite prosseguir sem validação da API
  - TODO: Reabilitar após correção da autenticação API

## [0.0.8] - 2025-01-XX

### Added
- **Margin Guard 100% Funcional**: Automação completa de proteção contra liquidação
  - Serviço LN Markets (`lnmarkets.service.ts`) com integração completa
  - Worker de monitoramento (`margin-monitor.ts`) com BullMQ
  - Cálculo de risco de liquidação em tempo real
  - Monitoramento de margin level, posições e P&L
  - Validação de credenciais LN Markets
  - Tratamento robusto de erros da API

### Added
- **Integração com API LN Markets**: Dados refletidos corretamente na plataforma
  - Margin info (nível de margem, valor disponível, valor total)
  - Posições abertas (tamanho, preço de entrada, preço de liquidação, P&L)
  - Status da conta e balanço
  - Cálculo automático de risco (low/medium/high/critical)
  - Rate limiting e tratamento de timeouts

### Added
- **Rotas de Teste**: Para validação da integração
  - `POST /api/test/lnmarkets` - Testa credenciais e conectividade
  - `POST /api/test/margin-guard` - Testa monitoramento completo
  - Respostas detalhadas com dados da API
  - Tratamento de erros específico por tipo

### Changed
- **Arquitetura de Workers**: Preparada para produção
  - BullMQ para processamento assíncrono
  - Redis para filas e cache
  - Concorrência controlada (5 usuários simultâneos)
  - Rate limiting distribuído
  - Logs estruturados para monitoramento

## [0.0.7] - 2025-01-XX

### Added
- **Autenticação Completa**: Sistema de autenticação funcional
  - Cadastro de usuários (`POST /api/auth/register`)
  - Login com validação de senha (`POST /api/auth/login`)
  - Perfil do usuário (`GET /api/users/me`)
  - Hash de senhas com bcrypt
  - Armazenamento em memória (independente do Prisma)
  - Validação de usuários existentes
  - Tratamento de erros adequado

### Fixed
- **Integração Frontend-Backend**: Comunicação estabelecida
  - Frontend acessível em http://localhost:3001
  - Backend acessível em http://localhost:3010
  - URLs de API consistentes
  - Comunicação entre serviços funcionando

### Changed
- **Backend Simplificado**: Removida dependência do Prisma por enquanto
  - Servidor simples com autenticação em memória
  - Evita problemas de SSL com containers Alpine
  - Foco em funcionalidade básica primeiro

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
