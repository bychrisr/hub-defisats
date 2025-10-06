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

## 🎯 **FASE 4: FRONTEND - PROFILE PAGE**

### **4.1 Interface de Múltiplas Contas**
- [ ] **4.1.1** Atualizar `Profile.tsx`
  - Cards por exchange (LN Markets → Account 01, Account 02)
  - Gerenciamento de múltiplas contas
  - Indicadores visuais de conta ativa

- [ ] **4.1.2** Criar `ExchangeAccountCard.tsx`
  - Componente para cada conta
  - Ações: editar, deletar, ativar
  - Status visual da conta

### **4.2 Formulários de Conta**
- [ ] **4.2.1** Criar `AddAccountForm.tsx`
  - Formulário para adicionar nova conta
  - Validação de limites por plano
  - Teste de credenciais

- [ ] **4.2.2** Criar `EditAccountForm.tsx`
  - Edição de contas existentes
  - Renomeação de contas
  - Atualização de credenciais

---

## 🎯 **FASE 5: HEADER MENU E NAVEGAÇÃO**

### **5.1 Dropdown de Contas**
- [ ] **5.1.1** Atualizar `LNMarketsHeader.tsx`
  - Dropdown com contas ativas
  - Indicador visual da conta ativa
  - Contador de contas disponíveis

- [ ] **5.1.2** Criar `AccountDropdown.tsx`
  - Lista de contas disponíveis
  - Ações: trocar conta, gerenciar contas
  - Estados: loading, error, empty

### **5.2 Troca de Conta**
- [ ] **5.2.1** Implementar lógica de troca
  - Persistência da conta selecionada
  - Eventos de mudança
  - Sincronização com sistema de persistência

- [ ] **5.2.2** Integração com Dashboard
  - Filtros automáticos por conta ativa
  - Atualização de dados em tempo real
  - Cache de dados por conta

---

## 🎯 **FASE 6: INTEGRAÇÃO COM AUTOMAÇÕES**

### **6.1 Vinculação de Automações**
- [ ] **6.1.1** Atualizar `AutomationService`
  - Associação automática com conta ativa
  - Migração de automações existentes
  - Validação de credenciais

### **6.2 Workers e Execução**
- [ ] **6.2.1** Atualizar `automation-executor.ts`
  - Filtros por conta ativa
  - Uso de credenciais corretas
  - Logs de execução por conta

### **6.3 Dashboard de Automações**
- [ ] **6.3.1** Atualizar interface de automações
  - Filtros por conta
  - Indicadores visuais de conta
  - Estatísticas por conta

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

#### **FASE 6: INTEGRAÇÃO COM AUTOMAÇÕES** ⏳ PENDENTE
- ⏳ Vinculação de automações por conta
- ⏳ Workers atualizados para conta ativa
- ⏳ Dashboard de automações por conta

### 🎯 **PRÓXIMOS PASSOS**
1. **FASE 4**: Implementar interface multi-account no Profile
2. **FASE 5**: Criar dropdown de contas no header
3. **FASE 6**: Integrar automações com sistema de contas
4. **FASE 7**: Testes e validação completa
5. **FASE 8**: Migração e deploy
6. **FASE 9**: Documentação final

### 📈 **MÉTRICAS DE PROGRESSO**
- **Backend**: 100% ✅
- **Admin Panel**: 100% ✅
- **Persistência**: 100% ✅
- **Frontend Multi-Account**: 100% ✅
- **Interface Avançada**: 100% ✅ (Credenciais, Limites, Visualização)
- **Correções de Bugs**: 100% ✅ (Planos Ilimitados, 404 Errors)
- **Limpeza de Código**: 100% ✅ (Remoção de Código Legado)
- **Header Menu**: 100% ✅ (Dropdown de Contas, Indicador Visual, Troca de Conta)
- **Integração Automações**: 0% ⏳
- **Testes**: 0% ⏳

**Progresso Geral: 80% Concluído**
