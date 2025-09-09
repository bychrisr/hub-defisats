# Decisões Arquiteturais e Tecnológicas

Este documento registra as decisões arquiteturais e tecnológicas importantes tomadas durante o desenvolvimento do projeto hub-defisats.

## ADR-013: Schema Validation Fix - Fastify + Zod

**Data**: 2025-01-09  
**Status**: Aceito  
**Contexto**: Resolução de problemas críticos de schema validation que causavam "socket hang up"

### Decisão
- **Validação de Schema**: Usar JSON Schema válidos no Fastify em vez de schemas Zod diretos
- **Validação Manual**: Implementar validação Zod manual no controller
- **Schemas Separados**: Criar arquivo `src/schemas/auth.schemas.ts` com JSON Schema válidos
- **Logs Detalhados**: Adicionar logs extensivos em desenvolvimento para diagnóstico

### Justificativa
- **Problema**: Schemas Zod com `z.any()` causavam erros de serialização no Fastify
- **Solução**: JSON Schema é nativo do Fastify e mais estável
- **Flexibilidade**: Validação Zod manual permite mais controle e logs detalhados
- **Debugging**: Logs extensivos facilitam identificação de problemas

### Implementação
```typescript
// src/schemas/auth.schemas.ts
export const RegisterRequestSchema = {
  type: 'object',
  required: ['email', 'username', 'password', 'ln_markets_api_key', 'ln_markets_api_secret', 'ln_markets_passphrase'],
  properties: {
    email: { type: 'string', format: 'email' },
    // ... outros campos
  },
  additionalProperties: false
};

// src/controllers/auth.controller.ts
const RegisterRequestZodSchema = z.object({
  email: z.string().email('Invalid email format'),
  // ... validação manual
});
```

### Consequências
- ✅ **Positivas**: Servidor estável, validação robusta, logs detalhados
- ⚠️ **Negativas**: Duplicação de schemas (JSON + Zod)
- 🔄 **Reversível**: Sim, mas requer refatoração

---

## ADR-014: Database Schema Cleanup

**Data**: 2025-01-09  
**Status**: Aceito  
**Contexto**: Limpeza de schema Prisma e correção de relacionamentos

### Decisão
- **Relacionamentos**: Usar tabela `UserCoupon` em vez de campo `used_coupon_id`
- **Campos**: Remover campos inexistentes como `ln_markets_passphrase`
- **ENUMs**: Criar todos os tipos ENUM necessários no PostgreSQL
- **Permissões**: Configurar permissões corretas para usuário `hubdefisats`

### Justificativa
- **Problema**: Campos inexistentes causavam erros de validação
- **Relacionamentos**: Tabela de junção é mais flexível e normalizada
- **ENUMs**: Necessários para tipos de dados do Prisma
- **Permissões**: Essenciais para operações do banco

### Implementação
```sql
-- Criar ENUMs
CREATE TYPE "PlanType" AS ENUM ('free', 'basic', 'advanced', 'pro');

-- Configurar permissões
GRANT ALL PRIVILEGES ON SCHEMA public TO hubdefisats;
```

### Consequências
- ✅ **Positivas**: Schema limpo, relacionamentos corretos, permissões adequadas
- ⚠️ **Negativas**: Requer migração de dados existentes
- 🔄 **Reversível**: Sim, com backup

---

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

---

## ADR-013: Margin Monitor Worker com Scheduler Periódico

**Data**: 2025-09-08
**Status**: Aceito
**Contexto**: Implementação do worker de monitoramento de margem a cada 5 segundos

### Decisão
- Worker BullMQ `margin-check` com prioridade alta
- Scheduler periódico usando `setInterval` a cada 5 segundos
- Cálculo de margin ratio: `maintenance_margin / (margin + pl)`
- Níveis de alerta: safe (≤0.8), warning (>0.8), critical (>0.9)
- Autenticação LN Markets HMAC-SHA256 completa
- Suporte a múltiplos usuários simultaneamente
- Fallback gracioso quando API indisponível

### Justificativa
- **Performance**: BullMQ para processamento assíncrono e rate limiting
- **Precisão**: Cálculo exato conforme especificação técnica
- **Escalabilidade**: Suporte a múltiplos usuários sem degradação
- **Segurança**: Autenticação HMAC-SHA256 oficial da LN Markets
- **Resiliência**: Fallback gracioso evita crashes do sistema
- **Conformidade**: Implementação rigorosa do plano técnico

### Alternativas Consideradas
- **Cron jobs**: Menos preciso para intervalos curtos
- **WebSocket**: Maior complexidade, dependência de conexão persistente
- **Polling simples**: Sem controle de concorrência e rate limiting

### Consequências
- Dependência de Redis para filas BullMQ
- Monitoramento contínuo consome recursos da API
- Necessidade de configuração de rate limiting
- Logs volumosos para múltiplos usuários
