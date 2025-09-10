# ROADMAP

## **✅ ETAPA 0: SETUP INICIAL & CONTRATOS DE API (COMPLETA)**

## **✅ ETAPA 0.2: DASHBOARD ADMIN FUNCIONAL (COMPLETA)**

### **✅ Tarefa 0.2.1: Resolver Problemas de Autenticação e Roteamento**

- ✅ **Problema Loop Infinito**: Redirecionamento infinito entre admin/login/dashboard
  - ✅ Implementada detecção de tipo de usuário baseada em email
  - ✅ Admin redirecionado para `/admin`, usuários comuns para `/dashboard`
- ✅ **Problema Token Storage**: Token não era armazenado corretamente
  - ✅ Corrigido uso de `access_token` em vez de `token` no localStorage
  - ✅ Padronizado token management em todo o frontend
- ✅ **Problema API Requests**: Frontend não conseguia acessar APIs do backend
  - ✅ Criada função utilitária centralizada `frontend/src/lib/fetch.ts`
  - ✅ Configuração de proxy do Vite para redirecionar `/api` para backend
- ✅ **Problema AdminRoute**: Componente não verificava se usuário era admin
  - ✅ Adicionada verificação `user.is_admin` no AdminRoute
  - ✅ Usuários não-admin redirecionados para dashboard comum
- ✅ **Resultado**: Dashboard admin 100% funcional com dados reais do backend

### **✅ Tarefa 0.2.2: Implementar Sistema de Detecção de Usuário**

- ✅ Adicionada flag `is_admin` na interface User
- ✅ Implementada detecção automática baseada em email `admin@hub-defisats.com`
- ✅ Atualizado método `getProfile` para incluir flag `is_admin`
- ✅ Redirecionamento inteligente após login baseado no tipo de usuário

## **✅ ETAPA 0.1: CORREÇÃO CRÍTICA - FLUXO DE CADASTRO (COMPLETA)**

### **✅ Tarefa 0.1.1: Resolver Problemas de Validação e Comunicação Frontend-Backend**

- ✅ **Problema Frontend**: Campos `undefined` no payload causando erro 400
  - ✅ Removidos campos `undefined` do payload antes do envio
  - ✅ Implementada limpeza de dados no `Register.tsx`
- ✅ **Problema Backend**: Validação automática do Fastify executando antes do middleware customizado
  - ✅ Desabilitada validação automática do Fastify na rota `/api/auth/register`
  - ✅ Middleware customizado `validateRegisterInput` agora executa corretamente
- ✅ **Problema API**: URL base incorreta do Axios
  - ✅ Corrigida URL base de `http://localhost:3000` para `http://localhost:13010`
  - ✅ Configuração correta no `frontend/src/lib/api.ts`
- ✅ **Problema Auth**: AuthService inicializado incorretamente
  - ✅ Corrigida inicialização passando `request.server` para o AuthService
  - ✅ Middleware de autenticação funcionando corretamente
- ✅ **Problema Prisma**: PrismaClient não inicializado nas rotas de automação
  - ✅ Corrigida inicialização do PrismaClient seguindo padrão das outras rotas
  - ✅ Dashboard carregando dados de automação sem erros 500

### **✅ Tarefa 0.1.2: Implementar Logging e Debugging**

- ✅ Adicionado logging detalhado no middleware de validação
- ✅ Implementado logging de payload bruto para debugging
- ✅ Adicionado logging de token no interceptor do Axios
- ✅ Re-adicionado botão "Fill with test data" na tela de registro

### **✅ Tarefa 0.1.3: Validação e Testes**

- ✅ Testado fluxo completo: cadastro → autenticação → dashboard
- ✅ Verificado funcionamento de todas as validações
- ✅ Confirmado carregamento correto dos dados de automação
- ✅ Sistema 100% operacional

**Status**: ✅ **COMPLETA** - Fluxo de cadastro totalmente funcional

### **✅ Tarefa 0.1: Criar estrutura de pastas backend e inicializar projeto**

- ✅ Criar `/backend` com `package.json`, `tsconfig.json`, `.env.example`
- ✅ Inicializar Fastify + TypeScript + ESLint + Prettier
- ✅ Configurar Prisma com PostgreSQL
- ✅ Criar `docker-compose.dev.yml` e `docker-compose.prod.yml`
- ✅ Criar script `setup.sh` para inicialização local

### **✅ Tarefa 0.2: Definir Contratos de API (OpenAPI/Swagger ou contratos TypeScript)**

- ✅ Criar `/backend/src/types/api-contracts.ts` com interfaces de:
    - `POST /api/auth/register`
    - `POST /api/auth/login`
    - `GET /api/users/me`
    - `POST /api/automations`
    - `GET /api/trades/logs`
    - `POST /api/backtests`
    - `POST /api/payments/lightning`
    - `GET /api/admin/dashboard`
    - `POST /api/admin/coupons`
- ✅ Validar schemas com Zod ou Fastify Type Providers
- ✅ Exportar contratos para `/0.contexto/docs/api/contracts/`

### **✅ Tarefa 0.3: Configurar Ambientes (Dev/Prod)**

- ✅ Criar `.env.development` e `.env.production`
- ✅ Criar `config/env.ts` com carregamento condicional
- ✅ Separar logs (detalhados em dev, mínimos em prod)
- ✅ Criar scripts:
    - `npm run dev` → com hot reload
    - `npm run build` → otimizado para prod
    - `npm run start` → modo produção

### **✅ Tarefa 0.4: Correção dos Containers (COMPLETA - v0.0.6)**

- ✅ **Containers Funcionando**: Todos os serviços Docker rodando sem crashes
- ✅ **Frontend Corrigido**: HTML completo com React sendo carregado (porta 3001)
- ✅ **Backend Corrigido**: Servidor simples com health check (porta 3010)
- ✅ **Workers Criados**: Stubs para todos os workers necessários
- ✅ **Infraestrutura**: PostgreSQL + Redis configurados e funcionais
- ✅ **URLs Corretas**: API URLs consistentes entre frontend e backend

---

## **🔐 ETAPA 1: AUTENTICAÇÃO & ONBOARDING (DIA 4–10)**

### **✅ Tarefa 1.1: Implementar serviço de autenticação JWT + Refresh Tokens**

- Criar `services/auth.service.ts` (login, registro, JWT, refresh)
- Criar `controllers/auth.controller.ts`
- Criar `routes/auth.routes.ts`
- Integrar com Prisma (User model)
- Criptografar senhas com bcrypt/argon2

### **✅ Tarefa 1.2: Registrar e validar keys LN Markets**

- Criar endpoint `POST /api/auth/register` com validação de keys
- Criar `services/lnmarkets.service.ts` com método `validateKeys()`
- Criptografar keys com libsodium/AES-256 antes de salvar
- Testar integração real com API LN Markets (sandbox)

### **✅ Tarefa 1.3: Implementar cupons (testers vitalícios)**

- Criar modelo `Coupon` e `UserCoupon`
- Criar endpoint `POST /api/auth/register` aceitando `coupon_code`
- Validar limite de uso e expiração
- Atualizar `plan_type` do usuário conforme cupom

---

## **🤖 ETAPA 2: AUTOMAÇÕES — MARGIN GUARD (CORE MVP) (DIA 11–25)**

### **✅ Tarefa 2.1: Implementar CRUD de automações**

- Criar `controllers/automation.controller.ts`
- Criar `services/automation.service.ts`
- Criar `routes/automation.routes.ts`
- Validar config JSON por tipo (MarginGuardConfig, etc)

### **✅ Tarefa 2.2: Implementar Worker de Monitoramento de Margem**

- Criar `workers/margin-monitor.worker.ts`
- Usar BullMQ + Redis para fila
- Polling a cada 5s (configurável) via LN Markets API
- Detectar risco de liquidação → acionar proteção

### **✅ Tarefa 2.3: Implementar Executor de Ordens Automáticas**

- Criar `workers/automation-executor.worker.ts`
- Executar ordens via LN Markets API
- Tratar erros: app_error vs exchange_error
- Gerar TradeLog com status e mensagem

### **✅ Tarefa 2.4: Logs de Trades com rastreabilidade**

- Criar `TradeLog` model
- Relacionar com User e Automation
- Endpoint `GET /api/trades/logs` com filtros
- Diferenciar erro de app vs corretora no log

---

## **🔔 ETAPA 3: NOTIFICAÇÕES & ALERTAS (DIA 26–35)**

### **✅ Tarefa 3.1: Implementar serviço de notificações multi-canal**

- Criar `services/notification.service.ts`
- Suporte a Telegram, Email, WhatsApp (EvolutionAPI)
- Configuração por usuário (`Notification` model)

### **✅ Tarefa 3.2: Worker de Notificações**

- Criar `workers/notification.worker.ts`
- Fila BullMQ para envio assíncrono
- Retry automático em falha
- Logs de entrega

### **✅ Tarefa 3.3: Alertas de Risco em Tempo Real**

- Integrar com Margin Monitor
- Enviar alerta se margem < threshold e sem automação ativa
- Notificar via canais configurados pelo usuário

---

## **💰 ETAPA 4: PAGAMENTOS LIGHTNING (DIA 36–45)**

### **✅ Tarefa 4.1: Integração com LN Markets Transfer ou LND/LNbits**

- Criar `services/payment.service.ts`
- Gerar invoice Lightning (interno ou externo)
- Validar pagamento via webhook ou polling

### **✅ Tarefa 4.2: Worker de Validação de Pagamentos**

- Criar `workers/payment-validator.worker.ts`
- Revalidar invoices expirados
- Atualizar status do Payment e User.plan_type

### **✅ Tarefa 4.3: Endpoint de Pagamento**

- `POST /api/payments/lightning` → gera invoice
- `GET /api/payments/status/:id` → verifica status
- Atualizar plano do usuário ao confirmar pagamento

---

## **📊 ETAPA 5: BACKTESTS & RELATÓRIOS (DIA 46–55)**

### **✅ Tarefa 5.1: Implementar Backtest Simples (via script + CSV)**

- Criar `services/backtest.service.ts`
- Puxar histórico de trades do usuário via LN Markets API
- Aplicar lógica simulada de automação
- Salvar resultado em `BacktestReport`

### **✅ Tarefa 5.2: Endpoint de Backtest**

- `POST /api/backtests` → inicia backtest
- `GET /api/backtests/:id` → retorna resultado
- Frontend exibe resultado (sem exportar ainda — MVP)

---

## **👨‍💼 ETAPA 6: DASHBOARD ADMIN (DIA 56–60)**

### **✅ Tarefa 6.1: Implementar Superadmin e Dashboard**

- Criar `AdminUser` model
- Criar endpoint `GET /api/admin/dashboard`
- Retornar KPIs: usuários ativos, trades, falhas, receita

### **✅ Tarefa 6.2: Gerenciamento de Cupons (Admin)**

- `POST /api/admin/coupons` → criar cupom
- `GET /api/admin/coupons` → listar
- Validar uso e expiração

### **✅ Tarefa 6.3: Logs e Auditoria (Admin)**

- Listar TradeLogs com filtros (erro app vs exchange)
- Visualizar SystemAlerts globais

---

## **🔒 ETAPA 7: SEGURANÇA E HARDENING (DIA 61–70)**

### **✅ Tarefa 7.1: Implementar Segurança de Autenticação**

- Validação de e-mail único e formato válido
- Senhas com requisitos mínimos e hash seguro (bcrypt)
- Verificação de senhas vazadas (Have I Been Pwned)
- Confirmação de e-mail obrigatória
- Rate limiting no cadastro e login
- Proteção contra bots (CAPTCHA)
- Sanitização de entrada (XSS/SQL Injection)

### **✅ Tarefa 7.2: Implementar Segurança de Sessão**

- Cookies seguros (HttpOnly, Secure, SameSite)
- ID de sessão único e randômico
- Sessão armazenada no servidor (Redis)
- Expiração de sessão e inatividade
- Invalidar sessão ao logout
- Prevenir login concorrente

### **✅ Tarefa 7.3: Implementar Recuperação de Senha Segura**

- Token único e seguro com expiração
- Token de uso único
- Não revelar status sensível
- Limite de tentativas
- Link HTTPS obrigatório
- Registro de solicitação

### **✅ Tarefa 7.4: Implementar Segurança Geral**

- HTTPS em todo o site
- Cabeçalhos de segurança HTTP
- Prevenção de CSRF
- Prevenção de XSS
- Prevenção de SQL Injection
- Logs de segurança
- Monitoramento de atividades suspeitas

### **✅ Tarefa 7.5: Implementar Segurança do Painel Admin**

- 2FA obrigatória (Google Authenticator)
- Sessão de admin com tempo curto
- Re-autenticação para ações críticas
- Logs de ações detalhadas
- Controle de acesso baseado em papéis (RBAC)
- Interface em subdomínio protegido
- Alertas de acesso incomum

### **✅ Tarefa 7.6: Implementar Testes e Manutenção**

- Testes de penetração
- Scanner de vulnerabilidades
- Política de senhas fortes
- Verificação de senhas vazadas
- Auditoria de contas inativas
- Plano de resposta a incidentes

---

## **🚀 ETAPA 8: TESTES, DOCUMENTAÇÃO & DEPLOY (DIA 71+)**

### **✅ Tarefa 8.1: Testes End-to-End (Cypress/Jest)**

- Testar fluxo completo: registro → configuração → execução → log
- Testar falhas e recuperação
- Testar notificações

### **✅ Tarefa 8.2: Documentação Técnica Completa**

- Atualizar `0.contexto/docs/api/endpoints.md`
- Atualizar `0.contexto/docs/architecture/workers.md`
- Atualizar `0.contexto/ANALYSIS.md` com decisões técnicas

### **✅ Tarefa 8.3: Deploy Inicial (Sob Comando)**

- Criar `scripts/deploy.sh`
- Configurar Docker + Kubernetes (Helm)
- Deploy apenas com comando: "suba backend para produção"

### **✅ Tarefa 8.4: Code Quality & ESLint Resolution (v0.8.0)**

- ✅ **Resolução de Warnings**: Correção sistemática de 133+ warnings ESLint
- ✅ **Type Safety**: Substituição de `any` por tipos específicos (Record<string, unknown>)
- ✅ **Interface Creation**: Criadas interfaces AuthenticatedRequest, MockRequest, MetricValue
- ✅ **Error Handling**: Aplicados type guards e assertions para tratamento robusto
- ✅ **Code Cleanup**: Removido simple-server.ts e variáveis não utilizadas
- ✅ **Regex Fixes**: Corrigidos character class ranges no sanitizer
- ✅ **Funcionalidade Mantida**: Zero impacto na funcionalidade da aplicação

**Resultado**: Redução de warnings de 133 para ~20 warnings não críticos, melhor developer experience