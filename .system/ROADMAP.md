# Roadmap Técnico

## Visão Geral

Este roadmap apresenta o planejamento técnico do projeto Hub-defisats, organizado em fases que vão desde o setup inicial até a comercialização completa. Cada fase tem objetivos claros, entregas específicas e critérios de sucesso.

## Status Atual: v1.4.2 ✅ COMPLETA

**Versão**: v1.4.2  
**Status**: Correção WebSocket & Eliminação de Polling Desnecessário  
**Data**: 2025-01-19

### Funcionalidades Implementadas
- ✅ Sistema de Simulações em Tempo Real
- ✅ Margin Guard 100% Funcional
- ✅ Sistema de Automações Avançado
- ✅ Dashboard Financeiro Completo
- ✅ Sistema Seguro com Criptografia
- ✅ Interface Moderna e Responsiva
- ✅ **NOVO**: Sistema de Tooltips Configurável
- ✅ **NOVO**: Modernização Visual com Cores Vibrantes
- ✅ **NOVO**: Fonte Mono para Números
- ✅ **NOVO**: SatsIcon Proporcional
- ✅ **NOVO**: WebSocket 100% Funcional
- ✅ **NOVO**: Eliminação de Polling Desnecessário

---

## ✅ ETAPA 0: SETUP INICIAL & CONTRATOS DE API (COMPLETA)

### ✅ Tarefa 0.1: Estrutura Base do Projeto
- ✅ Criar estrutura de pastas backend e frontend
- ✅ Inicializar Fastify + TypeScript + ESLint + Prettier
- ✅ Configurar Prisma com PostgreSQL
- ✅ Criar docker-compose.dev.yml e docker-compose.prod.yml
- ✅ Criar script setup.sh para inicialização local

### ✅ Tarefa 0.2: Contratos de API
- ✅ Criar tipos TypeScript para todas as APIs
- ✅ Validar schemas com Zod
- ✅ Exportar contratos para documentação
- ✅ Implementar OpenAPI/Swagger

### ✅ Tarefa 0.3: Configuração de Ambientes
- ✅ Criar .env.development e .env.production
- ✅ Configurar carregamento condicional de variáveis
- ✅ Separar logs (detalhados em dev, mínimos em prod)
- ✅ Criar scripts de desenvolvimento e produção

### ✅ Tarefa 0.4: Correção dos Containers
- ✅ Containers Docker funcionando sem crashes
- ✅ Frontend React carregando corretamente (porta 13000)
- ✅ Backend Fastify respondendo (porta 13010)
- ✅ Workers criados e funcionais
- ✅ PostgreSQL + Redis configurados

---

## ✅ ETAPA 1: AUTENTICAÇÃO & ONBOARDING (COMPLETA)

### ✅ Tarefa 1.1: Sistema de Autenticação
- ✅ Implementar JWT + Refresh Tokens
- ✅ Criar controllers e services de autenticação
- ✅ Integrar com Prisma (User model)
- ✅ Criptografar senhas com bcrypt

### ✅ Tarefa 1.2: Validação LN Markets
- ✅ Criar endpoint de registro com validação de keys
- ✅ Implementar serviço LN Markets com validação
- ✅ Criptografar keys com AES-256
- ✅ Testar integração real com API LN Markets

### ✅ Tarefa 1.3: Sistema de Cupons
- ✅ Criar modelo Coupon e UserCoupon
- ✅ Implementar validação de cupons no registro
- ✅ Validar limite de uso e expiração
- ✅ Atualizar plan_type conforme cupom

---

## ✅ ETAPA 2: AUTOMAÇÕES — MARGIN GUARD (COMPLETA)

### ✅ Tarefa 2.1: CRUD de Automações
- ✅ Criar controllers e services de automação
- ✅ Implementar validação de config JSON por tipo
- ✅ Criar rotas para gerenciamento de automações

### ✅ Tarefa 2.2: Worker de Monitoramento
- ✅ Implementar worker margin-monitor com BullMQ
- ✅ Polling a cada 5s via LN Markets API
- ✅ Detectar risco de liquidação e acionar proteção
- ✅ Suporte a múltiplos usuários simultâneos

### ✅ Tarefa 2.3: Executor de Ordens
- ✅ Criar worker automation-executor
- ✅ Executar ordens via LN Markets API
- ✅ Tratar erros: app_error vs exchange_error
- ✅ Gerar TradeLog com status e mensagem

### ✅ Tarefa 2.4: Sistema de Logs
- ✅ Criar modelo TradeLog
- ✅ Relacionar com User e Automation
- ✅ Implementar endpoint de logs com filtros
- ✅ Diferenciar erro de app vs corretora

---

## ✅ ETAPA 3: NOTIFICAÇÕES & ALERTAS (COMPLETA)

### ✅ Tarefa 3.1: Serviço de Notificações
- ✅ Implementar serviço multi-canal
- ✅ Suporte a Telegram, Email, WhatsApp
- ✅ Configuração por usuário (Notification model)

### ✅ Tarefa 3.2: Worker de Notificações
- ✅ Criar worker notification com BullMQ
- ✅ Fila assíncrona para envio
- ✅ Retry automático em falha
- ✅ Logs de entrega

### ✅ Tarefa 3.3: Alertas de Risco
- ✅ Integrar com Margin Monitor
- ✅ Enviar alerta se margem < threshold
- ✅ Notificar via canais configurados

---

## ✅ ETAPA 4: PAGAMENTOS LIGHTNING (COMPLETA)

### ✅ Tarefa 4.1: Integração Lightning
- ✅ Implementar serviço de pagamento
- ✅ Gerar invoice Lightning (interno/externo)
- ✅ Validar pagamento via webhook/polling

### ✅ Tarefa 4.2: Worker de Validação
- ✅ Criar worker payment-validator
- ✅ Revalidar invoices expirados
- ✅ Atualizar status do Payment e User.plan_type

### ✅ Tarefa 4.3: Endpoints de Pagamento
- ✅ POST /api/payments/lightning → gera invoice
- ✅ GET /api/payments/status/:id → verifica status
- ✅ Atualizar plano do usuário ao confirmar

---

## ✅ ETAPA 5: BACKTESTS & RELATÓRIOS (COMPLETA)

### ✅ Tarefa 5.1: Sistema de Backtest
- ✅ Implementar serviço de backtest
- ✅ Puxar histórico via LN Markets API
- ✅ Aplicar lógica simulada de automação
- ✅ Salvar resultado em BacktestReport

### ✅ Tarefa 5.2: Endpoints de Backtest
- ✅ POST /api/backtests → inicia backtest
- ✅ GET /api/backtests/:id → retorna resultado
- ✅ Frontend exibe resultado

---

## ✅ ETAPA 6: DASHBOARD ADMIN (COMPLETA)

### ✅ Tarefa 6.1: Dashboard Administrativo
- ✅ Criar modelo AdminUser
- ✅ Implementar endpoint GET /api/admin/dashboard
- ✅ Retornar KPIs: usuários ativos, trades, falhas, receita

### ✅ Tarefa 6.2: Gerenciamento de Cupons
- ✅ POST /api/admin/coupons → criar cupom
- ✅ GET /api/admin/coupons → listar
- ✅ Validar uso e expiração

### ✅ Tarefa 6.3: Logs e Auditoria
- ✅ Listar TradeLogs com filtros
- ✅ Visualizar SystemAlerts globais

---

## ✅ ETAPA 7: SEGURANÇA E HARDENING (COMPLETA)

### ✅ Tarefa 7.1: Segurança de Autenticação
- ✅ Validação de e-mail único e formato válido
- ✅ Senhas com requisitos mínimos e hash seguro
- ✅ Verificação de senhas vazadas (HIBP)
- ✅ Rate limiting no cadastro e login
- ✅ Proteção contra bots (CAPTCHA)

### ✅ Tarefa 7.2: Segurança de Sessão
- ✅ Cookies seguros (HttpOnly, Secure, SameSite)
- ✅ ID de sessão único e randômico
- ✅ Sessão armazenada no servidor (Redis)
- ✅ Expiração de sessão e inatividade

### ✅ Tarefa 7.3: Segurança Geral
- ✅ HTTPS em todo o site
- ✅ Cabeçalhos de segurança HTTP
- ✅ Prevenção de CSRF, XSS, SQL Injection
- ✅ Logs de segurança

---

## ✅ ETAPA 8: TESTES, DOCUMENTAÇÃO & DEPLOY (COMPLETA)

### ✅ Tarefa 8.1: Testes End-to-End
- ✅ Testar fluxo completo: registro → configuração → execução → log
- ✅ Testar falhas e recuperação
- ✅ Testar notificações

### ✅ Tarefa 8.2: Documentação Técnica
- ✅ Atualizar documentação de API
- ✅ Documentar arquitetura de workers
- ✅ Atualizar ANALYSIS.md com decisões técnicas

### ✅ Tarefa 8.3: Deploy Inicial
- ✅ Criar scripts de deploy
- ✅ Configurar Docker + Kubernetes
- ✅ Deploy controlado para produção

---

## ✅ ETAPA 9: CORREÇÃO WEBSOCKET & OTIMIZAÇÃO (COMPLETA - v1.4.2)

### ✅ Tarefa 9.1: Correção WebSocket Backend
- ✅ Corrigido erro de sintaxe `connection.socket.send()` para `connection.send()`
- ✅ Ajustado CORS_ORIGIN de `localhost:3000` para `localhost:13000`
- ✅ Adicionados logs de debug para rastreamento da conexão
- ✅ WebSocket agora envia mensagens corretamente sem erros internos

### ✅ Tarefa 9.2: Correção WebSocket Frontend
- ✅ WebSocket conecta e recebe mensagens em tempo real
- ✅ Sistema de reconexão automática funcionando corretamente
- ✅ Dados reais (posições, saldo, mercado) sendo transmitidos via WebSocket
- ✅ Eliminado fallback para polling desnecessário

### ✅ Tarefa 9.3: Otimização de Performance
- ✅ Eliminadas requisições HTTP desnecessárias
- ✅ Dados atualizados instantaneamente via WebSocket
- ✅ Sistema robusto com reconexão automática e tratamento de erros
- ✅ Performance otimizada com comunicação em tempo real

---

## 🚀 ETAPA 10: SISTEMA DE SIMULAÇÕES (COMPLETA - v1.3.0)

### ✅ Tarefa 9.1: Simulações em Tempo Real
- ✅ Implementar 4 cenários realistas (Bull, Bear, Sideways, Volatile)
- ✅ Criar algoritmos de movimento de preço realistas
- ✅ Interface visual com gráficos interativos (Recharts)
- ✅ Análise detalhada de performance

### ✅ Tarefa 9.2: API REST Completa
- ✅ CRUD de simulações
- ✅ Endpoints de progresso em tempo real
- ✅ Métricas finais e dados históricos
- ✅ Workers assíncronos para processamento

### ✅ Tarefa 9.3: Integração com Automações
- ✅ Suporte a 4 tipos de automação nas simulações
- ✅ Margin Guard, Take Profit, Trailing Stop, Auto Entry
- ✅ Logs detalhados de todas as ações executadas

---

## 🎯 PLANO TÉCNICO DE EXECUÇÃO DETALHADO

### FASE 1: INFRAESTRUTURA + AUTENTICAÇÃO + VALIDAÇÃO DE KEYS (DIA 1-10)

#### ✅ OBJETIVO
Garantir que o sistema esteja 100% funcional para testers, com cadastro, autenticação, validação de keys LN Markets e painel admin.

#### 📌 TAREFA 1.1: VALIDAR KEYS LN MARKETS NO CADASTRO
**Endpoint LN Markets:** `GET /v2/user`  
**Headers obrigatórios:**  
```typescript
LNM-ACCESS-KEY: string
LNM-ACCESS-SIGNATURE: string (HMAC-SHA256 base64)
LNM-ACCESS-PASSPHRASE: string
LNM-ACCESS-TIMESTAMP: number (ms)
```

**Critérios de aceitação técnica:**
- [x] Teste unitário: `should return 401 if keys are invalid`
- [x] Teste de contrato: Mock de 401 → retorna `INVALID_LN_MARKETS_KEYS`
- [x] Teste de contrato: Mock de 200 → retorna `success: true`
- [x] Fallback: Se API down, retorna erro controlado (não crasha app)
- [x] **IMPLEMENTADO**: Validação LN Markets funcionando 100% com credenciais sandbox
- [x] **FIXED**: Corrigido bug na URL base da API LN Markets (baseURL agora inclui `/v2`)
- [x] **FIXED**: Corrigido path da assinatura HMAC-SHA256 para incluir `/v2` prefixo

#### 📌 TAREFA 1.2: CRIPTOGRAFAR KEYS NO BANCO
**Arquivo:** `backend/src/utils/encryption.ts`  
**Biblioteca:** `libsodium-wrappers`  
**Chave:** `ENCRYPTION_KEY` do `.env` (32 chars)

**Critérios de aceitação técnica:**  
- [x] Teste unitário: `should encrypt and decrypt correctly`  
- [x] Teste de integração: Registrar usuário → verificar no banco → keys em `bytea`  
- [x] Validação Zod: `ln_markets_api_key: z.string().min(16)`
- [x] **IMPLEMENTADO**: Criptografia funcionando 100% com libsodium-wrappers  

#### 📌 TAREFA 1.3: ATIVAR CUPOM ALPHATESTER VITALÍCIO
**Arquivo:** `backend/src/controllers/auth.controller.ts`  
**Fluxo:**  
1. Recebe `coupon_code` no `POST /api/auth/register`  
2. Verifica em `Coupon` (code = ALPHATESTER, usage_limit > used_count)  
3. Se válido → seta `plan_type = 'free'` + registra em `user_coupon`  
4. Incrementa `used_count`

**Critérios de aceitação técnica:**  
- [x] Teste unitário: `should apply ALPHATESTER coupon and set plan_type to free`  
- [x] Teste de contrato: Registrar com cupom → GET `/api/users/me` → `plan_type = 'free'`  
- [x] Rate limiting: 3 tentativas/hora por IP (Redis)
- [x] **IMPLEMENTADO**: Cupom ALPHATESTER funcionando 100% com relacionamento UserCoupon

#### 📌 TAREFA 1.4: PAINEL ADMIN BÁSICO FUNCIONAL
**Rotas:**  
- `GET /api/admin/dashboard` → KPIs básicos  
- `GET /api/admin/users` → lista de usuários

**Critérios de aceitação técnica:**  
- [x] Teste de contrato: Login superadmin → acessar dashboard → retorna dados reais  
- [x] Teste de performance: Latência < 200ms (Prometheus)  
- [x] Teste de segurança: Acesso negado se não for superadmin (403)

### FASE 2: MARGIN GUARD + LOGS + NOTIFICAÇÕES (DIA 11-35)

#### ✅ OBJETIVO
Ter o **Margin Guard 100% funcional**, com logs granulares e notificações via Telegram em tempo real.

#### ✅ TAREFA 2.1: WORKER — MARGIN MONITOR (EXECUTA A CADA 5S)
**Endpoint LN Markets:** `GET /v2/futures/trades?type=running`
**Cálculo de risco:**
```typescript
const marginRatio = position.maintenance_margin / (position.margin + position.pl);
const level = marginRatio > 0.9 ? 'critical' : marginRatio > 0.8 ? 'warning' : 'safe';
```

**Critérios de aceitação técnica:**
- [x] Teste unitário: `should calculate margin ratio correctly`
- [x] Teste de contrato: Simular margin_ratio = 0.92 → dispara alerta
- [x] Fallback: Se API down, loga erro, não crasha worker
- [x] Implementado scheduler periódico a cada 5 segundos
- [x] Autenticação LN Markets com HMAC-SHA256
- [x] Suporte a múltiplos usuários simultaneamente

#### 📌 TAREFA 2.2: WORKER — AUTOMATION EXECUTOR (EXECUTA MARGIN GUARD)  
**Endpoint LN Markets:** `POST /v2/futures/close`  
**Payload:** `{ "id": "trade_id" }`  
**Log de execução:** Registrar em `TradeLog` com `status = 'success' | 'app_error' | 'exchange_error'`

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Simular execução → verificar se trade é fechado na LN Markets  
- [ ] Teste de resiliência: Mock de 500 → retry 3x com backoff exponencial  
- [ ] Log granular: Registrar `raw_response` da API LN Markets

#### 📌 TAREFA 2.3: WORKER — NOTIFICAÇÃO (TELEGRAM VIA EVOLUTIONAPI)  
**Endpoint:** `POST https://api.evolution-api.com/message/sendText`  
**Payload:**  
```json
{
  "number": "5511999999999",
  "text": "⚠️ Margem crítica! Margin Ratio: 92%"
}
```

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Simular alerta → verificar se mensagem chega no Telegram  
- [ ] Teste de fallback: Se EvolutionAPI down → loga erro, não crasha  
- [ ] Rate limiting: Max 20 concorrentes, timeout 10s

#### 📌 TAREFA 2.4: LOGS GRANULARES DE TRADES  
**Tabela:** `TradeLog`  
**Campos obrigatórios:**  
- `error_message`: string  
- `raw_response`: JSON (resposta completa da LN Markets)  
- `status`: `success | app_error | exchange_error`

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Simular erro → verificar se log distingue `app_error` vs `exchange_error`  
- [ ] Teste de performance: Inserção < 50ms  
- [ ] Teste de segurança: Dados sensíveis não expostos nos logs

### FASE 3: BACKTESTING + RELATÓRIOS (DIA 36-50)

#### ✅ OBJETIVO
Ter **backtest funcional** (mesmo que via CSV manual) e relatórios visuais básicos.

#### 📌 TAREFA 3.1: BACKTEST SIMPLES (HISTÓRICO PESSOAL)  
**Endpoint LN Markets:** `GET /v2/futures/trades?type=closed&from=...&to=...`  
**Lógica:** Simular automação sobre trades fechados → calcular win_rate, PnL, drawdown

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Executar backtest → retornar métricas corretas  
- [ ] Teste de performance: Processamento < 2s para 100 trades  
- [ ] Fallback: Se API down, usa dados mockados (CSV local)

#### 📌 TAREFA 3.2: RELATÓRIO VISUAL (GRÁFICOS BÁSICOS)  
**Biblioteca:** `Recharts`  
**Componente:** `src/components/BacktestReport.tsx`  
**Gráficos:**  
- Evolução de PnL ao longo do tempo  
- Distribuição de trades (win/loss)

**Critérios de aceitação técnica:**  
- [ ] Teste visual: Gráficos refletem dados do backtest  
- [ ] Teste de acessibilidade: Labels corretas, contraste adequado  
- [ ] Teste de responsividade: Funciona em mobile

### FASE 4: ENTRADAS AUTOMÁTICAS + TP/SL (DIA 51-60)

#### ✅ OBJETIVO
Ter **entradas automáticas + Take Profit/Stop Loss** funcionando.

#### 📌 TAREFA 4.1: WORKER — ENTRADAS AUTOMÁTICAS  
**Endpoint LN Markets:** `POST /v2/futures/new-trade`  
**Payload:**  
```json
{
  "type": "m",
  "side": "b",
  "leverage": 10,
  "quantity": 100,
  "stoploss": 18000,
  "takeprofit": 22000
}
```

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Simular entrada → verificar se ordem é criada na LN Markets  
- [ ] Teste de validação: Zod schema para payload  
- [ ] Teste de segurança: Validação de saldo antes de executar

#### 📌 TAREFA 4.2: ATUALIZAR TRADE (TP/SL)  
**Endpoint LN Markets:** `POST /v2/futures/update-trade`  
**Payload:** `{ "id": "trade_id", "type": "stoploss", "value": 18000 }`

**Critérios de aceitação técnica:**  
- [ ] Teste de contrato: Atualizar TP/SL → verificar se trade é atualizado na LN Markets  
- [ ] Teste de idempotência: Mesma requisição 2x → não duplica ação  
- [ ] Log de auditoria: Registrar quem atualizou e quando

## 🎯 PRÓXIMAS ETAPAS (FUTURO)

## ETAPA 10: SISTEMA DE TRADING REAL (PLANEJADA)

### Tarefa 10.1: Execução Real de Trades
- [ ] Implementar execução real via LN Markets API
- [ ] Sistema de confirmação de ordens
- [ ] Validação de saldo e margem antes da execução
- [ ] Logs detalhados de execução real

### Tarefa 10.2: Risk Management Avançado
- [ ] Controle automático de exposição
- [ ] Limites de perda por usuário
- [ ] Alertas de risco em tempo real
- [ ] Sistema de stop loss automático

### Tarefa 10.3: Portfolio Tracking
- [ ] Acompanhamento de múltiplas posições
- [ ] Cálculo de P&L em tempo real
- [ ] Métricas de performance avançadas
- [ ] Relatórios de performance

## ETAPA 11: ANÁLISES AVANÇADAS (PLANEJADA)

### Tarefa 11.1: Backtesting Histórico
- [ ] Teste com dados reais do passado
- [ ] Múltiplos timeframes de análise
- [ ] Comparação de estratégias
- [ ] Otimização de parâmetros

### Tarefa 11.2: Machine Learning
- [ ] Algoritmos de predição de mercado
- [ ] Análise de sentiment
- [ ] Detecção de padrões
- [ ] Recomendações automáticas

### Tarefa 11.3: Risk Metrics Avançadas
- [ ] VaR (Value at Risk)
- [ ] Sharpe Ratio
- [ ] Maximum Drawdown
- [ ] Correlation Analysis

## ETAPA 12: MELHORIAS TÉCNICAS (PLANEJADA)

### Tarefa 12.1: Performance e Escalabilidade
- [ ] API Rate Limiting avançado
- [ ] Caching estratégico com Redis
- [ ] Load balancing entre workers
- [ ] Otimização de queries do banco

### Tarefa 12.2: Monitoramento Avançado
- [ ] Dashboards de performance
- [ ] Alertas automáticos
- [ ] Métricas de negócio
- [ ] Análise de uso

### Tarefa 12.3: CI/CD Avançado
- [ ] Deploy automático com approval
- [ ] Testes de performance automatizados
- [ ] Rollback automático em falhas
- [ ] Blue-green deployment

## ETAPA 13: UX/UI ENHANCEMENTS (PLANEJADA)

### Tarefa 13.1: Mobile Optimization
- [ ] Interface otimizada para dispositivos móveis
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Offline mode

### Tarefa 13.2: Acessibilidade
- [ ] Conformidade com WCAG 2.1
- [ ] Suporte a leitores de tela
- [ ] Navegação por teclado
- [ ] Contraste adequado

### Tarefa 13.3: Dark Mode Completo
- [ ] Tema escuro em todos os componentes
- [ ] Persistência de preferência
- [ ] Transições suaves
- [ ] Ícones adaptativos

## ETAPA 14: COMERCIALIZAÇÃO (PLANEJADA)

### Tarefa 14.1: Landing Page e Marketing
- [ ] Site de marketing profissional
- [ ] Onboarding comercial
- [ ] Sistema de trials
- [ ] Analytics de conversão

### Tarefa 14.2: Planos e Preços
- [ ] Definição final de preços
- [ ] Sistema de cobrança automática
- [ ] Upgrade/downgrade de planos
- [ ] Relatórios de receita

### Tarefa 14.3: Suporte ao Cliente
- [ ] Sistema de tickets
- [ ] Chat em tempo real
- [ ] Base de conhecimento
- [ ] Treinamentos

---

## 📊 Métricas de Sucesso

### Métricas Técnicas
- **Performance**: Latência < 200ms para automações
- **Disponibilidade**: Uptime ≥ 99.5%
- **Segurança**: Zero vazamentos de dados
- **Qualidade**: Cobertura de testes ≥ 80%

### Métricas de Negócio
- **Usuários**: 50 usuários ativos em 3 meses
- **Conversão**: 10 planos Pro vendidos
- **Confiabilidade**: 90%+ taxa de execução sem falhas
- **Volume**: 10.000 trades processados

### Métricas de Produto
- **Adoção**: Taxa de uso das funcionalidades
- **Retenção**: Usuários ativos mensalmente
- **Satisfação**: NPS e feedback dos usuários
- **Crescimento**: Crescimento orgânico de usuários

---

## 🔄 Processo de Atualização

### Revisão Mensal
- Revisar progresso das etapas ativas
- Ajustar prioridades baseado em feedback
- Atualizar estimativas de tempo
- Identificar riscos e dependências

### Revisão Trimestral
- Avaliar métricas de sucesso
- Planejar próximas etapas
- Ajustar roadmap baseado em dados
- Definir objetivos para próximo trimestre

### Revisão Anual
- Avaliação completa do roadmap
- Planejamento estratégico de longo prazo
- Definição de novas funcionalidades
- Ajuste de métricas e objetivos

---

**Documento**: Roadmap Técnico  
**Versão**: 1.3.0  
**Última Atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento
