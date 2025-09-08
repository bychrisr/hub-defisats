# Decisões Arquiteturais e Tecnológicas

Este documento registra as decisões arquiteturais e tecnológicas importantes tomadas durante o desenvolvimento do projeto hub-defisats.

## ADR-001: Stack Tecnológica Principal

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Definição da stack principal do projeto

### Decisão
- **Backend**: Node.js 18+ com Fastify
- **Frontend**: Next.js 14 (App Router)
- **Banco de Dados**: PostgreSQL 15+
- **ORM**: Prisma
- **Cache**: Redis 7+
- **Mensageria**: BullMQ + Redis

### Justificativa
- **Fastify**: Performance superior (<200ms latência), TypeScript first-class, ecossistema rico
- **Next.js 14**: SSR/SSG para SEO, App Router integrado, API Routes nativas
- **PostgreSQL**: ACID compliance para dados financeiros, JSONB para configurações flexíveis
- **Prisma**: TypeScript automático, migrations declarativas, DX excelente
- **Redis + BullMQ**: Performance in-memory, retry logic, rate limiting distribuído

### Consequências
- Desenvolvedores precisam aprender Fastify (mais leve que Express)
- PostgreSQL requer conhecimento de relacionamentos complexos
- Redis adiciona complexidade de infraestrutura

---

## ADR-002: Arquitetura de Microserviços

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Estrutura de serviços para automações

### Decisão
- API Gateway (Fastify)
- Core Services (automações, trades, pagamentos)
- Worker Services (monitoramento, notificações)
- Separação clara entre responsabilidades

### Justificativa
- Escalabilidade horizontal
- Isolamento de falhas
- Deploy independente de serviços
- Facilita manutenção e debugging

### Consequências
- Maior complexidade de deploy
- Necessidade de orquestração (Docker Compose/Kubernetes)
- Comunicação entre serviços via APIs/Redis

---

## ADR-003: Autenticação JWT + Refresh Tokens

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Sistema de autenticação seguro

### Decisão
- Access Tokens JWT curtos (15-30 min)
- Refresh Tokens long-lived em HTTP-only cookies
- Social Auth via Passport.js
- Criptografia AES-256 para keys LN Markets

### Justificativa
- Segurança: tokens curtos reduzem janela de ataque
- UX: refresh automático sem re-login
- Flexibilidade: suporte a múltiplos provedores
- Compliance: keys sensíveis criptografadas

### Consequências
- Implementação mais complexa que sessões simples
- Necessidade de gerenciamento de refresh tokens
- Dependência de bibliotecas de criptografia

---

## ADR-004: Integração LN Markets

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Integração com corretora Lightning

### Decisão
- API oficial LN Markets
- Keys criptografadas no banco
- Validação de keys no registro
- Rate limiting e retry logic

### Justificativa
- API oficial garante estabilidade
- Segurança: keys nunca em texto plano
- Confiabilidade: validação prévia evita erros
- Resiliência: retry automático em falhas

### Consequências
- Dependência da API externa
- Necessidade de monitoramento de rate limits
- Complexidade de criptografia/descriptografia

---

## ADR-005: Sistema de Notificações Multi-canal

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Alertas críticos para traders

### Decisão
- Telegram, Email, WhatsApp (EvolutionAPI)
- Configuração por usuário
- Fila assíncrona com BullMQ
- Retry automático em falhas

### Justificativa
- Redundância: múltiplos canais garantem entrega
- Flexibilidade: usuário escolhe canais preferidos
- Performance: processamento assíncrono
- Confiabilidade: retry em falhas temporárias

### Consequências
- Dependência de APIs externas (Telegram, WhatsApp)
- Complexidade de configuração por usuário
- Necessidade de monitoramento de entregas

---

## ADR-006: Pagamentos Lightning Network

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Monetização descentralizada

### Decisão
- Transferência interna LN Markets (preferencial)
- Invoice Lightning externa (fallback)
- Validação automática via webhook/polling
- Reenvio automático em expiração

### Justificativa
- Descentralização: sem KYC, 100% Bitcoin
- UX: transferência interna mais rápida
- Confiabilidade: fallback para invoice externa
- Automação: validação sem intervenção manual

### Consequências
- Dependência de infraestrutura Lightning
- Complexidade de validação de pagamentos
- Necessidade de monitoramento de invoices

---

## ADR-007: Containerização e Deploy

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Deploy em produção

### Decisão
- Docker para containerização
- Docker Compose para desenvolvimento
- Kubernetes + Helm para produção
- Deploy apenas sob comando explícito

### Justificativa
- Consistência: mesmo ambiente dev/prod
- Escalabilidade: Kubernetes para produção
- Segurança: deploy controlado, não automático
- Manutenibilidade: Helm charts para configuração

### Consequências
- Curva de aprendizado para Kubernetes
- Complexidade de configuração inicial
- Necessidade de scripts de deploy customizados

---

## ADR-008: Implementação de Segurança Abrangente

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Implementação de checklist completo de segurança

### Decisão
- **Autenticação**: JWT + Refresh Tokens + 2FA obrigatório para admins
- **Senhas**: Validação robusta + verificação HIBP + bcrypt
- **Proteção**: Rate limiting + CAPTCHA + CSRF + XSS prevention
- **Criptografia**: AES-256 para dados sensíveis + libsodium
- **Monitoramento**: Logs de segurança + alertas de atividades suspeitas
- **Compliance**: GDPR + auditoria + backup criptografado

### Justificativa
- **Segurança**: Proteção contra ataques comuns (XSS, CSRF, SQL injection)
- **Compliance**: Atendimento a regulamentações de proteção de dados
- **Confiabilidade**: Monitoramento proativo de ameaças
- **Auditoria**: Rastreabilidade completa de ações críticas
- **Resiliência**: Backup e recuperação de dados

### Consequências
- Maior complexidade de implementação
- Necessidade de configurações externas (CAPTCHA, SMTP, SSL)
- Dependência de serviços de monitoramento
- Curva de aprendizado para ferramentas de segurança

---

## ADR-009: Validação de Senhas com HIBP

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Prevenção de uso de senhas vazadas

### Decisão
- Integração com Have I Been Pwned (HIBP) via k-Anonymity
- Verificação no cadastro e alteração de senhas
- Bloqueio de senhas comprometidas
- Fallback gracioso se serviço indisponível

### Justificativa
- **Segurança**: Prevenção de uso de senhas vazadas em vazamentos
- **Privacidade**: k-Anonymity protege a senha do usuário
- **UX**: Bloqueio proativo sem exposição da senha
- **Confiabilidade**: Fallback permite funcionamento mesmo com HIBP down

### Consequências
- Dependência de serviço externo (HIBP)
- Latência adicional no cadastro
- Necessidade de tratamento de falhas

---

## ADR-010: Sistema de 2FA com Google Authenticator

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Autenticação de dois fatores para admins

### Decisão
- 2FA obrigatório para usuários admin
- Google Authenticator como app principal
- Backup codes para recuperação
- QR code para configuração inicial

### Justificativa
- **Segurança**: Proteção adicional para contas administrativas
- **Padrão**: Google Authenticator é amplamente adotado
- **Recuperação**: Backup codes evitam lockout
- **UX**: QR code facilita configuração

### Consequências
- Complexidade adicional para admins
- Necessidade de gerenciamento de backup codes
- Dependência de app externo

---

## ADR-011: Rate Limiting e CAPTCHA

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Proteção contra ataques automatizados

### Decisão
- Rate limiting: 5 tentativas/15min login, 3 tentativas/1h registro
- CAPTCHA após 3 falhas de login
- reCAPTCHA v3 como principal, hCaptcha como fallback
- Rate limiting distribuído via Redis

### Justificativa
- **Proteção**: Prevenção de brute force e ataques automatizados
- **UX**: CAPTCHA apenas quando necessário
- **Redundância**: Múltiplos provedores de CAPTCHA
- **Escalabilidade**: Rate limiting distribuído

### Consequências
- Dependência de serviços externos (Google, hCaptcha)
- Complexidade de configuração
- Necessidade de monitoramento de rate limits

---

## ADR-012: Logs de Segurança e Monitoramento

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Auditoria e detecção de ameaças

### Decisão
- Logs estruturados de todas as ações críticas
- Alertas automáticos para atividades suspeitas
- Retenção configurável de logs
- Integração com sistemas de monitoramento

### Justificativa
- **Auditoria**: Rastreabilidade completa de ações
- **Detecção**: Identificação proativa de ameaças
- **Compliance**: Atendimento a requisitos regulatórios
- **Investigação**: Suporte a investigações de incidentes

### Consequências
- Volume significativo de logs
- Necessidade de storage e processamento
- Complexidade de análise de alertas
