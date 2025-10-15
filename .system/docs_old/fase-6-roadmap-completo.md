# 🎯 FASE 6: INTEGRAÇÃO MULTI-ACCOUNT COM AUTOMAÇÕES - ROADMAP COMPLETO

## 📋 **VISÃO GERAL**
Implementação completa do sistema multi-account com automações, onde o dropdown é o contexto global da aplicação e todas as funcionalidades refletem a conta ativa selecionada.

---

## 🎯 **OBJETIVOS PRINCIPAIS**

### **1. 🏗️ DROPDOWN COMO CONTEXTO GLOBAL**
- ✅ **Core Central**: Dropdown controla toda a aplicação
- ✅ **Trocar Conta = Trocar TUDO**: Automações, posições, cards, dashboard
- ✅ **Interface Unificada**: Sempre mostra dados da conta ativa
- ✅ **Preparado para Futuro**: Estrutura para painel unificado

### **2. 🤖 AUTOMAÇÕES MULTI-ACCOUNT**
- ✅ **Perfis por Conta**: Cada conta tem seu perfil de automações
- ✅ **Criação Automática**: Perfil criado automaticamente na criação da conta
- ✅ **Execução Simultânea**: Todas as contas ativas funcionam simultaneamente
- ✅ **Isolamento Total**: Cada conta tem suas automações e credenciais

### **3. 🚀 ESTRUTURA ESCALÁVEL**
- ✅ **Novas Automações**: Fácil adicionar novos tipos
- ✅ **Novas Contas**: Perfil criado automaticamente
- ✅ **Configurações Flexíveis**: JSON para cada tipo
- ✅ **Manutenção Simples**: Relacionamentos limpos

---

## 📅 **ROADMAP DETALHADO**

### **🔗 FASE 6.1 - VINCULAÇÃO DE AUTOMAÇÕES** (4 subtarefas)

#### **6.1.1** ✅ **Atualizar `AutomationService`** - CONCLUÍDO
- ✅ **Associação automática com conta ativa**
- ✅ **Validação de credenciais**
- ✅ **Logs detalhados**

#### **6.1.2** 🚧 **Modificar `Automation` Model** - EM PROGRESSO
- [ ] **Adicionar campo `user_exchange_account_id` (FK)**
  - Campo obrigatório para novas automações
  - Relacionamento com `UserExchangeAccounts`
  - Índices para performance

- [ ] **Manter compatibilidade com dados existentes**
  - Campo opcional inicialmente
  - Migração gradual
  - Fallback para conta ativa

- [ ] **Criar migration para campo obrigatório**
  - Migration do Prisma
  - Validação de dados existentes
  - Rollback seguro

#### **6.1.3** 🚧 **Atualizar `AutomationController`** - EM PROGRESSO
- [ ] **Filtrar automações por conta ativa**
  - Query com filtro por conta
  - Performance otimizada
  - Cache de resultados

- [ ] **Validar permissões por conta**
  - Verificar se usuário tem acesso à conta
  - Validação de propriedade
  - Logs de segurança

- [ ] **Retornar dados da conta associada**
  - Incluir informações da conta
  - Credenciais descriptografadas
  - Status da conta

#### **6.1.4** 🚧 **Criar `AutomationAccountService`** - EM PROGRESSO
- [ ] **Lógica de vinculação automática**
  - Detectar conta ativa
  - Vincular automação automaticamente
  - Validação de credenciais

- [ ] **Migração de automações existentes**
  - Script para vincular automações existentes
  - Preservar dados históricos
  - Validação de integridade

- [ ] **Validação de limites por conta**
  - Verificar limites do plano
  - Contar automações por conta
  - Bloquear se necessário

---

### **⚙️ FASE 6.2 - WORKERS E EXECUÇÃO** (4 subtarefas)

#### **6.2.1** 🚧 **Atualizar `automation-executor.ts`** - EM PROGRESSO
- [ ] **Filtros por conta ativa**
  - Executar apenas automações da conta ativa
  - Usar credenciais corretas
  - Logs de execução por conta

- [ ] **Uso de credenciais corretas**
  - Buscar credenciais da conta específica
  - Validar credenciais antes da execução
  - Tratamento de erros por conta

- [ ] **Logs de execução por conta**
  - Logs separados por conta
  - Rastreamento de execução
  - Métricas por conta

#### **6.2.2** 🚧 **Modificar `automation-worker.ts`** - EM PROGRESSO
- [ ] **Buscar credenciais da conta ativa**
  - Integração com UserExchangeAccountService
  - Validação de credenciais
  - Cache de credenciais

- [ ] **Executar automações por conta**
  - Isolamento por conta
  - Execução simultânea
  - Tratamento de erros

- [ ] **Logs detalhados por conta**
  - Logs específicos por conta
  - Métricas de performance
  - Alertas por conta

#### **6.2.3** 🚧 **Atualizar `automation-scheduler.ts`** - EM PROGRESSO
- [ ] **Agendar execuções por conta**
  - Scheduler por conta
  - Priorização por conta
  - Balanceamento de carga

- [ ] **Gerenciar timeouts por conta**
  - Timeouts específicos por conta
  - Retry logic por conta
  - Fallback por conta

- [ ] **Retry logic por conta**
  - Retry específico por conta
  - Backoff por conta
  - Alertas por conta

#### **6.2.4** 🚧 **Criar `AccountCredentialsService`** - EM PROGRESSO
- [ ] **Buscar credenciais da conta ativa**
  - Integração com UserExchangeAccountService
  - Validação de credenciais
  - Cache de credenciais

- [ ] **Cache de credenciais por conta**
  - Cache específico por conta
  - Invalidação de cache
  - Performance otimizada

- [ ] **Validação de credenciais antes da execução**
  - Validação prévia
  - Teste de conectividade
  - Logs de validação

---

### **🎨 FASE 6.3 - DASHBOARD DE AUTOMAÇÕES** (4 subtarefas)

#### **6.3.1** 🚧 **Atualizar interface de automações** - EM PROGRESSO
- [ ] **Filtros por conta**
  - Filtro por conta ativa
  - Indicadores visuais de conta
  - Estatísticas por conta

- [ ] **Indicadores visuais de conta**
  - Badge da conta ativa
  - Status da conta
  - Informações da exchange

- [ ] **Estatísticas por conta**
  - Métricas por conta
  - Performance por conta
  - Logs por conta

#### **6.3.2** 🚧 **Criar `AutomationAccountFilter.tsx`** - EM PROGRESSO
- [ ] **Dropdown de seleção de conta**
  - Integração com AccountSelector
  - Filtro por conta ativa
  - Indicadores visuais

- [ ] **Filtros por status e conta**
  - Filtro por status da automação
  - Filtro por conta
  - Filtro por tipo

- [ ] **Indicadores visuais de conta ativa**
  - Badge da conta ativa
  - Status da conta
  - Informações da exchange

#### **6.3.3** 🚧 **Atualizar `AutomationCard.tsx`** - EM PROGRESSO
- [ ] **Exibir conta associada**
  - Nome da conta
  - Exchange da conta
  - Status da conta

- [ ] **Indicador visual da conta**
  - Badge da conta
  - Status da conta
  - Informações da exchange

- [ ] **Ações por conta**
  - Editar automação
  - Ativar/desativar
  - Deletar automação

#### **6.3.4** 🚧 **Criar `AutomationAccountStats.tsx`** - EM PROGRESSO
- [ ] **Estatísticas por conta**
  - Métricas por conta
  - Performance por conta
  - Logs por conta

- [ ] **Performance por conta**
  - Tempo de execução
  - Taxa de sucesso
  - Erros por conta

- [ ] **Métricas de execução**
  - Número de execuções
  - Tempo médio
  - Taxa de erro

---

### **🔄 FASE 6.4 - INTEGRAÇÃO COM SISTEMA DE CONTAS** (4 subtarefas)

#### **6.4.1** 🚧 **Atualizar `useAutomations` hook** - EM PROGRESSO
- [ ] **Filtrar por conta ativa**
  - Hook reativo ao contexto
  - Filtro automático por conta
  - Atualização automática

- [ ] **Refresh automático ao trocar conta**
  - Listener de mudança de conta
  - Refresh automático
  - Cache invalidation

- [ ] **Estados de loading por conta**
  - Loading específico por conta
  - Estados de erro por conta
  - Feedback visual

#### **6.4.2** 🚧 **Modificar `AutomationContext`** - EM PROGRESSO
- [ ] **Contexto de conta ativa**
  - Integração com ActiveAccountContext
  - Sincronização automática
  - Estados reativos

- [ ] **Sincronização com AccountContext**
  - Sincronização bidirecional
  - Eventos de mudança
  - Cache invalidation

- [ ] **Eventos de mudança de conta**
  - Listener de mudança
  - Refresh automático
  - Cache invalidation

#### **6.4.3** 🚧 **Atualizar `AutomationForm`** - EM PROGRESSO
- [ ] **Seleção de conta para nova automação**
  - Dropdown de contas
  - Validação de conta
  - Preenchimento automático

- [ ] **Validação de conta ativa**
  - Verificar se conta está ativa
  - Validar credenciais
  - Bloquear se necessário

- [ ] **Preenchimento automático de credenciais**
  - Buscar credenciais da conta
  - Preenchimento automático
  - Validação de credenciais

#### **6.4.4** 🚧 **Criar `AutomationAccountManager`** - EM PROGRESSO
- [ ] **Gerenciar automações por conta**
  - CRUD por conta
  - Validação por conta
  - Logs por conta

- [ ] **Migração de automações existentes**
  - Script de migração
  - Preservar dados
  - Validação de integridade

- [ ] **Validação de limites por conta**
  - Verificar limites do plano
  - Contar automações por conta
  - Bloquear se necessário

---

### **💾 FASE 6.5 - PERSISTÊNCIA E SINCRONIZAÇÃO** (3 subtarefas)

#### **6.5.1** 🚧 **Atualizar `indicatorPersistenceService`** - EM PROGRESSO
- [ ] **Persistir conta ativa para automações**
  - Salvar conta ativa
  - Sincronização cross-tab
  - Eventos de mudança

- [ ] **Sincronização cross-tab**
  - Sincronização entre abas
  - Eventos de mudança
  - Cache invalidation

- [ ] **Eventos de mudança de conta**
  - Listener de mudança
  - Refresh automático
  - Cache invalidation

#### **6.5.2** 🚧 **Modificar `useActiveAccount` hook** - EM PROGRESSO
- [ ] **Integração com automações**
  - Hook reativo
  - Sincronização automática
  - Estados reativos

- [ ] **Eventos de mudança**
  - Listener de mudança
  - Refresh automático
  - Cache invalidation

- [ ] **Sincronização com workers**
  - Sincronização com backend
  - Eventos de mudança
  - Cache invalidation

#### **6.5.3** 🚧 **Criar `AutomationAccountSync`** - EM PROGRESSO
- [ ] **Sincronização de conta ativa**
  - Sincronização automática
  - Eventos de mudança
  - Cache invalidation

- [ ] **Eventos de mudança**
  - Listener de mudança
  - Refresh automático
  - Cache invalidation

- [ ] **Persistência de estado**
  - Salvar estado
  - Restaurar estado
  - Sincronização

---

### **🔒 FASE 6.6 - VALIDAÇÃO E SEGURANÇA** (3 subtarefas)

#### **6.6.1** 🚧 **Validar credenciais por conta** - EM PROGRESSO
- [ ] **Teste de credenciais antes da execução**
  - Validação prévia
  - Teste de conectividade
  - Logs de validação

- [ ] **Validação de permissões**
  - Verificar permissões da conta
  - Validação de propriedade
  - Logs de segurança

- [ ] **Logs de segurança**
  - Logs de validação
  - Logs de erro
  - Alertas de segurança

#### **6.6.2** 🚧 **Implementar rate limiting por conta** - EM PROGRESSO
- [ ] **Limites de execução por conta**
  - Rate limiting por conta
  - Throttling por conta
  - Monitoramento de uso

- [ ] **Throttling por conta**
  - Throttling específico por conta
  - Backoff por conta
  - Alertas por conta

- [ ] **Monitoramento de uso**
  - Métricas de uso
  - Alertas de limite
  - Relatórios de uso

#### **6.6.3** 🚧 **Criar `AutomationAccountValidator`** - EM PROGRESSO
- [ ] **Validação de conta ativa**
  - Verificar se conta está ativa
  - Validar credenciais
  - Bloquear se necessário

- [ ] **Verificação de credenciais**
  - Validação de credenciais
  - Teste de conectividade
  - Logs de validação

- [ ] **Validação de limites**
  - Verificar limites do plano
  - Contar automações por conta
  - Bloquear se necessário

---

### **📊 FASE 6.7 - MONITORAMENTO E LOGS** (3 subtarefas)

#### **6.7.1** 🚧 **Atualizar sistema de logs** - EM PROGRESSO
- [ ] **Logs por conta**
  - Logs específicos por conta
  - Rastreamento por conta
  - Métricas por conta

- [ ] **Rastreamento de execução**
  - Rastreamento por conta
  - Logs de execução
  - Métricas de performance

- [ ] **Métricas por conta**
  - Métricas específicas por conta
  - Performance por conta
  - Relatórios por conta

#### **6.7.2** 🚧 **Criar `AutomationAccountMonitor`** - EM PROGRESSO
- [ ] **Monitoramento de execução**
  - Monitoramento por conta
  - Alertas por conta
  - Dashboard de métricas

- [ ] **Alertas por conta**
  - Alertas específicos por conta
  - Notificações por conta
  - Escalação por conta

- [ ] **Dashboard de métricas**
  - Dashboard por conta
  - Métricas em tempo real
  - Relatórios por conta

#### **6.7.3** 🚧 **Implementar `AutomationAccountMetrics`** - EM PROGRESSO
- [ ] **Métricas de performance**
  - Métricas por conta
  - Performance por conta
  - Relatórios por conta

- [ ] **Estatísticas de uso**
  - Estatísticas por conta
  - Uso por conta
  - Relatórios por conta

- [ ] **Relatórios por conta**
  - Relatórios específicos por conta
  - Exportação por conta
  - Agendamento por conta

---

## 🎯 **PRIORIDADES DE IMPLEMENTAÇÃO**

### **🔴 ALTA PRIORIDADE** (Core Functionality)
1. **6.1** - Vinculação de Automações
2. **6.2** - Workers e Execução  
3. **6.4** - Integração com Sistema de Contas

### **🟡 MÉDIA PRIORIDADE** (UI/UX and Persistence)
4. **6.3** - Dashboard de Automações
5. **6.5** - Persistência e Sincronização

### **🟢 BAIXA PRIORIDADE** (Security and Monitoring)
6. **6.6** - Validação e Segurança
7. **6.7** - Monitoramento e Logs

---

## 📈 **ESTIMATIVA DE TEMPO**

- **Total de Subtarefas**: 28
- **Tempo Estimado**: 5-7 dias
- **Complexidade**: Média-Alta
- **Dependências**: FASE 4 e FASE 5 concluídas

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Continuar com 6.1.2**: Modificar `Automation` Model
2. **Implementar 6.1.3**: Atualizar `AutomationController`
3. **Continuar sequencialmente** pelas subtarefas de alta prioridade
4. **Testar integração** após cada categoria
5. **Documentar progresso** em cada subtarefa

**FASE 6 está pronta para implementação completa!** 🎯
