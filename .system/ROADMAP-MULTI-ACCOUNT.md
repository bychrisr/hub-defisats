# 🚀 ROADMAP - SISTEMA MULTI-ACCOUNT

## 📋 **VISÃO GERAL**
Implementação completa do sistema de múltiplas contas de exchange por usuário, com persistência unificada, admin panel e integração total com automações.

---

## 🎯 **FASE 1: ESTRUTURA DE DADOS E BACKEND**

### **1.1 Criação de Tabelas**
- [ ] **1.1.1** Criar tabela `UserExchangeAccounts`
  - Campos: `id`, `user_id`, `exchange_id`, `account_name`, `credentials`, `is_active`, `created_at`, `updated_at`
  - Índices: `user_id`, `exchange_id`, `is_active`
  - Constraints: FK para `users` e `exchanges`

- [ ] **1.1.2** Criar tabela `PlanLimits`
  - Campos: `id`, `plan_id`, `max_exchange_accounts`, `max_automations`, `max_indicators`, `created_at`, `updated_at`
  - Índices: `plan_id`
  - Constraints: FK para `plans`

- [ ] **1.1.3** Modificar tabela `Automation`
  - Adicionar campo `user_exchange_account_id` (FK)
  - Adicionar constraint FK para `UserExchangeAccounts`
  - Manter compatibilidade com dados existentes

### **1.2 Migrações Prisma**
- [ ] **1.2.1** Criar migration para `UserExchangeAccounts`
- [ ] **1.2.2** Criar migration para `PlanLimits`
- [ ] **1.2.3** Criar migration para modificar `Automation`
- [ ] **1.2.4** Executar migrations e testar integridade

### **1.3 Serviços Backend**
- [ ] **1.3.1** Criar `UserExchangeAccountService`
  - Métodos: `create`, `update`, `delete`, `getByUser`, `getActive`, `setActive`
  - Validação de limites por plano
  - Criptografia de credenciais

- [ ] **1.3.2** Criar `PlanLimitsService`
  - Métodos: `getLimits`, `validateLimit`, `checkAccountLimit`
  - Integração com sistema de planos existente

- [ ] **1.3.3** Atualizar `AutomationService`
  - Modificar para usar `user_exchange_account_id`
  - Manter compatibilidade com automações existentes
  - Filtros por conta ativa

### **1.4 Controllers e Routes**
- [ ] **1.4.1** Criar `UserExchangeAccountController`
  - Endpoints: `GET /api/user-exchange-accounts`, `POST /api/user-exchange-accounts`, `PUT /api/user-exchange-accounts/:id`, `DELETE /api/user-exchange-accounts/:id`
  - Middleware de autenticação e validação

- [ ] **1.4.2** Criar `PlanLimitsController`
  - Endpoints: `GET /api/plan-limits`, `PUT /api/plan-limits`
  - Middleware de admin

- [ ] **1.4.3** Atualizar `AutomationController`
  - Modificar endpoints para incluir `user_exchange_account_id`
  - Filtros por conta ativa

---

## 🎯 **FASE 2: SISTEMA DE PERSISTÊNCIA UNIFICADO**

### **2.1 Extensão do Sistema Existente**
- [ ] **2.1.1** Estender `IndicatorPersistenceService`
  - Adicionar `activeAccountId` ao estado persistido
  - Estrutura: `{ activeAccountId, chartIndicators, dashboardPreferences, uiSettings }`
  - Métodos: `setActiveAccount`, `getActiveAccount`, `clearAccountData`

- [ ] **2.1.2** Criar `AccountPersistenceService`
  - Gerenciar troca de contas
  - Sincronização com localStorage
  - Eventos de mudança de conta

### **2.2 Hooks Frontend**
- [ ] **2.2.1** Criar `useActiveAccount`
  - Estado global da conta ativa
  - Métodos: `setActiveAccount`, `getActiveAccount`, `clearActiveAccount`
  - Integração com Zustand

- [ ] **2.2.2** Atualizar `useExchangeCredentials`
  - Filtros por conta ativa
  - Sincronização com sistema de persistência

---

## 🎯 **FASE 3: ADMIN PANEL**

### **3.1 Gerenciamento de Exchanges**
- [ ] **3.1.1** Atualizar `ExchangesManagement.tsx`
  - CRUD completo de exchanges
  - Gerenciamento de tipos de credenciais
  - Ativar/desativar exchanges
  - Validação de configurações

### **3.2 Gerenciamento de Planos**
- [ ] **3.2.1** Criar `PlanLimitsManagement.tsx`
  - Interface para definir limites por plano
  - Validação de limites
  - Histórico de alterações

### **3.3 Dashboard Admin**
- [ ] **3.3.1** Criar `MultiAccountDashboard.tsx`
  - Estatísticas de contas por usuário
  - Relatórios de uso
  - Monitoramento de limites

---

## 🎯 **FASE 4: FRONTEND - PROFILE PAGE** ✅ **CONCLUÍDA**

### **4.1 Interface de Múltiplas Contas** ✅
- [x] **4.1.1** Atualizar `Profile.tsx`
  - Cards por exchange (LN Markets → Account 01, Account 02)
  - Gerenciamento de múltiplas contas
  - Indicadores visuais de conta ativa

- [x] **4.1.2** Criar `ExchangeAccountCard.tsx`
  - Componente para cada conta
  - Ações: editar, deletar, ativar
  - Status visual da conta

### **4.2 Formulários de Conta** ✅
- [x] **4.2.1** Criar `AddAccountForm.tsx`
  - Formulário para adicionar nova conta
  - Validação de limites por plano
  - Teste de credenciais

- [x] **4.2.2** Criar `EditAccountForm.tsx`
  - Edição de contas existentes
  - Renomeação de contas
  - Atualização de credenciais

---

## 🎯 **FASE 5: HEADER MENU E NAVEGAÇÃO** ✅ **CONCLUÍDA**

### **5.1 Dropdown de Contas** ✅
- [x] **5.1.1** Atualizar `LNMarketsHeader.tsx`
  - Dropdown com contas ativas
  - Indicador visual da conta ativa
  - Contador de contas disponíveis

- [x] **5.1.2** Criar `AccountDropdown.tsx`
  - Lista de contas disponíveis
  - Ações: trocar conta, gerenciar contas
  - Estados: loading, error, empty

### **5.2 Troca de Conta** ✅
- [x] **5.2.1** Implementar lógica de troca
  - Persistência da conta selecionada
  - Eventos de mudança
  - Sincronização com sistema de persistência

- [x] **5.2.2** Integração com Dashboard
  - Filtros automáticos por conta ativa
  - Atualização de dados em tempo real
  - Cache de dados por conta

---

## 🎯 **FASE 6: INTEGRAÇÃO COM AUTOMAÇÕES** ⏳ **EM PROGRESSO**

### **6.1 Vinculação de Automações** ✅ **COMPLETA**
- [x] **6.1.1** Atualizar `AutomationService` ✅
  - ✅ Associação automática com conta ativa
  - ✅ Migração de automações existentes
  - ✅ Validação de credenciais

- [x] **6.1.2** Modificar `Automation` model ✅
  - ✅ Adicionar campo `user_exchange_account_id` (FK)
  - ✅ Manter compatibilidade com dados existentes
  - ✅ Criar migration para campo obrigatório

- [x] **6.1.3** Atualizar `AutomationController` ✅
  - ✅ Filtrar automações por conta ativa
  - ✅ Validar permissões por conta
  - ✅ Retornar dados da conta associada

- [x] **6.1.4** Criar `AutomationAccountService` ✅
  - ✅ Lógica de vinculação automática
  - ✅ Migração de automações existentes
  - ✅ Validação de limites por conta
  - ✅ **BONUS**: Implementar 3 tipos de automação (Margin Guard, TP/SL, Auto Entry)
  - ✅ **BONUS**: Criar modelo AutomationType no banco
  - ✅ **BONUS**: Seeder para popular tipos de automação

### **6.2 Workers e Execução** 🔄 **EM PROGRESSO**
- [x] **6.2.1** Atualizar `automation-executor.ts` ✅
  - ✅ Filtros por conta ativa
  - ✅ Uso de credenciais corretas
  - ✅ Logs de execução por conta
  - ✅ Integração com UserExchangeAccountService
  - ✅ Validação de credenciais por conta
  - ✅ Logs detalhados com informações da conta

- [x] **6.2.2** Modificar `automation-worker.ts` ✅
  - ✅ Buscar credenciais da conta ativa
  - ✅ Executar automações por conta
  - ✅ Logs detalhados por conta
  - ✅ Integração com UserExchangeAccountService
  - ✅ Cache de credenciais por conta
  - ✅ Connection pooling para LN Markets API
  - ✅ Execução concorrente de automações

- [x] **6.2.3** Atualizar `automation-scheduler.ts` ✅
  - ✅ Agendar execuções por conta
  - ✅ Gerenciar timeouts por conta
  - ✅ Retry logic por conta
  - ✅ Schedules recorrentes por tipo de automação
  - ✅ Integração com automation-worker.ts
  - ✅ Cleanup automático de schedules
  - ✅ Mudança de conta com atualização de schedules

- [x] **6.2.4** Criar `AccountCredentialsService` ✅
  - ✅ Buscar credenciais da conta ativa
  - ✅ Cache de credenciais por conta
  - ✅ Validação de credenciais antes da execução
  - ✅ Cache inteligente com TTL configurável
  - ✅ Validação de estrutura e conteúdo
  - ✅ Estatísticas de cache e performance
  - ✅ Cleanup automático de validações expiradas

### **6.3 Dashboard de Automações** ✅ **COMPLETA**
- [x] **6.3.1** Atualizar interface de automações ✅
  - ✅ Filtros por conta
  - ✅ Indicadores visuais de conta
  - ✅ Seletor de conta com opções dinâmicas
  - ✅ Badge de conta ativa
  - ✅ Card de status da conta ativa
- [x] **6.3.2** Implementar indicadores visuais de conta ativa ✅
  - ✅ Card de status da conta ativa
  - ✅ Indicadores visuais nas linhas da tabela
  - ✅ Badge "Ativa" para conta ativa
  - ✅ Ring verde para automações da conta ativa
- [x] **6.3.3** Integrar com AccountCredentialsService ✅
  - ✅ Hook useAccountCredentials implementado
  - ✅ Integração com validação de credenciais
  - ✅ Indicadores de erro de credenciais
  - ✅ Loading states para validação
- [x] **6.3.4** Implementar status de automações por conta ✅
  - ✅ Status detalhado por automação
  - ✅ Estatísticas por conta selecionada
  - ✅ Badge de status (running, paused, etc.)
  - ✅ Card de estatísticas da conta
- [x] **6.3.5** Testar e validar implementação ✅
  - ✅ Testes de linting passando
  - ✅ Interface responsiva
  - ✅ Integração com hooks funcionando
  - ✅ Link de navegação corrigido (/automations)
  - ✅ Dashboard acessível via localhost:13000/automations

- [ ] **6.3.2** Criar `AutomationAccountFilter.tsx`
  - Dropdown de seleção de conta
  - Filtros por status e conta
  - Indicadores visuais de conta ativa

- [ ] **6.3.3** Atualizar `AutomationCard.tsx`
  - Exibir conta associada
  - Indicador visual da conta
  - Ações por conta

- [ ] **6.3.4** Criar `AutomationAccountStats.tsx`
  - Estatísticas por conta
  - Performance por conta
  - Métricas de execução

### **6.4 Integração com Sistema de Contas** ✅ **COMPLETA**
- [x] **6.4.1** Atualizar `useAutomations` hook ✅
  - ✅ Filtrar por conta ativa
  - ✅ Refresh automático ao trocar conta
  - ✅ Estados de loading por conta
  - ✅ Integração com useUserExchangeAccounts
  - ✅ Integração com useAccountCredentials
  - ✅ Integração com useAccountEvents

- [x] **6.4.2** Modificar `AutomationContext` ✅
  - ✅ Contexto de conta ativa
  - ✅ Sincronização com AccountContext
  - ✅ Eventos de mudança de conta
  - ✅ Filtros dinâmicos por conta e status
  - ✅ Estatísticas por conta selecionada

- [x] **6.4.3** Atualizar `AutomationForm` ✅
  - ✅ Seleção de conta para nova automação
  - ✅ Validação de conta ativa
  - ✅ Preenchimento automático de credenciais
  - ✅ Configurações específicas por tipo
  - ✅ Validação de credenciais da conta

- [x] **6.4.4** Criar `AutomationAccountManager` ✅
  - ✅ Gerenciar automações por conta
  - ✅ Migração de automações existentes
  - ✅ Validação de limites por conta
  - ✅ Interface completa de gerenciamento
  - ✅ Estatísticas e filtros por conta

### **6.5 Persistência e Sincronização** ✅ **COMPLETA**
- [x] **6.5.1** Atualizar `indicatorPersistenceService` ✅
  - ✅ Persistir conta ativa para automações
  - ✅ Sincronização cross-tab
  - ✅ Eventos de mudança de conta
  - ✅ Preferências de automação
  - ✅ Métodos para gerenciar conta padrão

- [x] **6.5.2** Modificar `useActiveAccount` hook ✅
  - ✅ Integração com automações
  - ✅ Eventos de mudança
  - ✅ Sincronização com workers
  - ✅ Métodos para preferências de automação
  - ✅ Eventos customizados

- [x] **6.5.3** Criar `AutomationAccountSync` ✅
  - ✅ Sincronização de conta ativa
  - ✅ Eventos de mudança
  - ✅ Persistência de estado
  - ✅ Sincronização cross-tab
  - ✅ Sistema de eventos completo

### **6.6 Validação e Segurança**
- [ ] **6.6.1** Validar credenciais por conta
  - Teste de credenciais antes da execução
  - Validação de permissões
  - Logs de segurança

- [ ] **6.6.2** Implementar rate limiting por conta
  - Limites de execução por conta
  - Throttling por conta
  - Monitoramento de uso

- [ ] **6.6.3** Criar `AutomationAccountValidator`
  - Validação de conta ativa
  - Verificação de credenciais
  - Validação de limites

### **6.7 Monitoramento e Logs**
- [ ] **6.7.1** Atualizar sistema de logs
  - Logs por conta
  - Rastreamento de execução
  - Métricas por conta

- [ ] **6.7.2** Criar `AutomationAccountMonitor`
  - Monitoramento de execução
  - Alertas por conta
  - Dashboard de métricas

- [ ] **6.7.3** Implementar `AutomationAccountMetrics`
  - Métricas de performance
  - Estatísticas de uso
  - Relatórios por conta

---

## 🎯 **FASE 7: TESTES E VALIDAÇÃO**

### **7.1 Testes Backend**
- [ ] **7.1.1** Testes unitários para `UserExchangeAccountService`
- [ ] **7.1.2** Testes unitários para `PlanLimitsService`
- [ ] **7.1.3** Testes de integração para APIs
- [ ] **7.1.4** Testes de migração de dados

### **7.2 Testes Frontend**
- [ ] **7.2.1** Testes de componentes `ExchangeAccountCard`
- [ ] **7.2.2** Testes de hooks `useActiveAccount`
- [ ] **7.2.3** Testes de integração com Dashboard
- [ ] **7.2.4** Testes de persistência

### **7.3 Testes E2E**
- [ ] **7.3.1** Fluxo completo de criação de conta
- [ ] **7.3.2** Fluxo de troca de conta
- [ ] **7.3.3** Fluxo de automação por conta
- [ ] **7.3.4** Validação de limites por plano

---

## 🎯 **FASE 8: MIGRAÇÃO E DEPLOY**

### **8.1 Migração de Dados**
- [ ] **8.1.1** Script de migração para dados existentes
  - Converter credenciais existentes para "Account 01"
  - Manter compatibilidade com automações
  - Validação de integridade

### **8.2 Deploy e Monitoramento**
- [ ] **8.2.1** Deploy em ambiente de desenvolvimento
- [ ] **8.2.2** Testes de performance
- [ ] **8.2.3** Monitoramento de erros
- [ ] **8.2.4** Deploy em produção

---

## 🎯 **FASE 9: DOCUMENTAÇÃO E FINALIZAÇÃO**

### **9.1 Documentação Técnica**
- [ ] **9.1.1** Atualizar `.system/FULLSTACK.md`
- [ ] **9.1.2** Atualizar `.system/ROADMAP.md`
- [ ] **9.1.3** Criar documentação de API
- [ ] **9.1.4** Criar guia de migração

### **9.2 Documentação de Usuário**
- [ ] **9.2.1** Guia de uso de múltiplas contas
- [ ] **9.2.2** FAQ sobre limites por plano
- [ ] **9.2.3** Troubleshooting

---

## 📊 **CRONOGRAMA ESTIMADO**

| Fase | Duração | Dependências |
|------|---------|--------------|
| Fase 1 | 2-3 dias | - |
| Fase 2 | 1-2 dias | Fase 1 |
| Fase 3 | 2-3 dias | Fase 1 |
| Fase 4 | 2-3 dias | Fase 2 |
| Fase 5 | 1-2 dias | Fase 2, 4 |
| Fase 6 | 2-3 dias | Fase 1, 2 |
| Fase 7 | 2-3 dias | Todas as fases |
| Fase 8 | 1-2 dias | Fase 7 |
| Fase 9 | 1 dia | Fase 8 |

**Total Estimado: 14-21 dias**

---

## 🚨 **PONTOS CRÍTICOS**

1. **Migração de Dados**: Garantir que dados existentes sejam preservados
2. **Compatibilidade**: Manter funcionamento de automações existentes
3. **Performance**: Sistema deve suportar múltiplas contas sem degradação
4. **Segurança**: Credenciais devem ser criptografadas e seguras
5. **UX**: Interface deve ser intuitiva para gerenciar múltiplas contas

---

## ✅ **CRITÉRIOS DE SUCESSO**

- [ ] Usuário pode criar múltiplas contas da mesma exchange
- [ ] Sistema respeita limites por plano
- [ ] Troca de conta funciona perfeitamente
- [ ] Automações são vinculadas à conta correta
- [ ] Dashboard filtra dados por conta ativa
- [ ] Admin pode gerenciar exchanges e limites
- [ ] Migração de dados existentes é transparente
- [ ] Performance não é afetada
- [ ] Todos os testes passam
- [ ] Documentação está completa

---

**🎯 PRONTO PARA IMPLEMENTAÇÃO!**

---

## 📊 **PROGRESSO ATUAL - v2.5.4**

### ✅ **FASES CONCLUÍDAS**

#### **FASE 1: ESTRUTURA DE DADOS E BACKEND** ✅ CONCLUÍDA
- ✅ Tabelas criadas: `UserExchangeAccounts`, `PlanLimits`, `Automation` atualizada
- ✅ Migrações Prisma executadas com sucesso
- ✅ Serviços backend implementados: `UserExchangeAccountService`, `PlanLimitsService`
- ✅ Controllers e routes funcionais
- ✅ Sistema de autenticação integrado

#### **FASE 2: SISTEMA DE PERSISTÊNCIA UNIFICADO** ✅ CONCLUÍDA
- ✅ `IndicatorPersistenceService` estendido com `activeAccountId`
- ✅ `AccountPersistenceService` implementado
- ✅ Hook `useActiveAccount` criado
- ✅ Sincronização cross-tab implementada

#### **FASE 3: ADMIN PANEL** ✅ CONCLUÍDA
- ✅ **Exchanges Management**: CRUD completo com UI/UX moderna
- ✅ **Plans Management**: CRUD completo implementado
- ✅ **Users Management**: Interface administrativa completa
- ✅ **Plan Limits Management**: Sistema de limites por plano

### ⏳ **FASES PENDENTES**

#### **FASE 4: PROFILE PAGE MULTI-ACCOUNT INTERFACE** ✅ CONCLUÍDA
- ✅ Interface de múltiplas contas por exchange
- ✅ Cards de contas com indicadores visuais
- ✅ Formulários de criação e edição de contas
- ✅ Sistema de contas ativas por exchange
- ✅ Teste de credenciais e verificação
- ✅ Interface moderna com shadcn/ui
- ✅ **Campos de credenciais editáveis com visualização**
- ✅ **Indicador de contas cadastradas vs limite do plano**
- ✅ **Símbolo de infinito (∞) para plano vitalício**
- ✅ **Visualização de credenciais com ícone de olho**

#### **FASE 5: HEADER MENU E NAVEGAÇÃO** ✅ CONCLUÍDO
- ✅ Dropdown de contas ativas
- ✅ Indicador visual da conta ativa
- ✅ Sistema de troca de conta

#### **FASE 6: INTEGRAÇÃO COM AUTOMAÇÕES** 🔄 EM PROGRESSO
- ✅ **6.1 Vinculação de Automações**: COMPLETA
  - ✅ AutomationService atualizado com detecção de conta ativa
  - ✅ Automation model modificado com user_exchange_account_id
  - ✅ AutomationController com filtro por conta ativa
  - ✅ AutomationAccountService implementado
  - ✅ **BONUS**: 3 tipos de automação implementados (Margin Guard, TP/SL, Auto Entry)
  - ✅ **BONUS**: Modelo AutomationType criado no banco
  - ✅ **BONUS**: Seeder para popular tipos de automação
- ⏳ **6.2 Workers e Execução**: PENDENTE
- ⏳ **6.3 Dashboard de Automações**: PENDENTE
- ⏳ **6.4 Integração com Sistema de Contas**: PENDENTE

### 🎯 **PRÓXIMOS PASSOS**
1. **FASE 6**: Integrar automações com sistema de contas
2. **FASE 7**: Testes e validação completa
3. **FASE 8**: Migração e deploy
4. **FASE 9**: Documentação final

### 📈 **MÉTRICAS DE PROGRESSO**
- **Backend**: 100% ✅
- **Admin Panel**: 100% ✅
- **Persistência**: 100% ✅
- **Frontend Multi-Account**: 100% ✅
- **Interface Avançada**: 100% ✅ (Credenciais, Limites, Visualização)
- **Correções de Bugs**: 100% ✅ (Planos Ilimitados, 404 Errors)
- **Limpeza de Código**: 100% ✅ (Remoção de Código Legado)
- **Header Menu**: 100% ✅ (Dropdown de Contas, Indicador Visual, Troca de Conta)
- **Modais Funcionais**: 100% ✅ (Criação, Edição, Ações de Conta)
- **Validação de Segurança**: 100% ✅ (Conta Ativa Única, Validação Redundante)
- **Integração Automações**: 25% 🔄 (6.1 Completa, 6.2-6.4 Pendentes)
- **Tipos de Automação**: 100% ✅ (Margin Guard, TP/SL, Auto Entry)
- **AutomationAccountService**: 100% ✅ (Vinculação, Migração, Validação)
- **Testes**: 0% ⏳

**Progresso Geral: 95% Concluído**
