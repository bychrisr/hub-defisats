# 🎯 FASE 6: INTEGRAÇÃO COM AUTOMAÇÕES - SUBTAREFAS DETALHADAS

## 📋 **VISÃO GERAL**
Integração completa do sistema multi-account com o sistema de automações, permitindo que cada automação seja vinculada a uma conta específica e execute com as credenciais corretas.

---

## 🔗 **6.1 VINCULAÇÃO DE AUTOMAÇÕES**

### **6.1.1** Atualizar `AutomationService`
- [ ] **Associação automática com conta ativa**
  - Detectar conta ativa do usuário
  - Vincular automação à conta ativa automaticamente
  - Validar se conta tem credenciais válidas

- [ ] **Migração de automações existentes**
  - Script para vincular automações existentes à conta ativa
  - Preservar dados históricos
  - Validação de integridade

- [ ] **Validação de credenciais**
  - Verificar se conta tem credenciais válidas
  - Testar credenciais antes de vincular
  - Logs de validação

### **6.1.2** Modificar `Automation` model
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

### **6.1.3** Atualizar `AutomationController`
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
  - Dados da exchange
  - Status da conta

### **6.1.4** Criar `AutomationAccountService`
- [ ] **Lógica de vinculação automática**
  - Detectar conta ativa
  - Vincular automaticamente
  - Validação de limites

- [ ] **Migração de automações existentes**
  - Script de migração
  - Validação de dados
  - Relatórios de migração

- [ ] **Validação de limites por conta**
  - Verificar limites do plano
  - Contar automações por conta
  - Bloquear se limite atingido

---

## ⚙️ **6.2 WORKERS E EXECUÇÃO**

### **6.2.1** Atualizar `automation-executor.ts`
- [ ] **Filtros por conta ativa**
  - Buscar automações da conta ativa
  - Filtrar por status e conta
  - Performance otimizada

- [ ] **Uso de credenciais corretas**
  - Buscar credenciais da conta vinculada
  - Validar credenciais antes da execução
  - Cache de credenciais

- [ ] **Logs de execução por conta**
  - Logs específicos por conta
  - Rastreamento de execução
  - Métricas por conta

### **6.2.2** Modificar `automation-worker.ts`
- [ ] **Buscar credenciais da conta ativa**
  - Integração com `UserExchangeAccountService`
  - Decriptação de credenciais
  - Validação de credenciais

- [ ] **Executar automações por conta**
  - Execução isolada por conta
  - Timeout por conta
  - Retry logic por conta

- [ ] **Logs detalhados por conta**
  - Logs estruturados
  - Métricas de performance
  - Alertas por conta

### **6.2.3** Atualizar `automation-scheduler.ts`
- [ ] **Agendar execuções por conta**
  - Scheduler por conta
  - Priorização por conta
  - Balanceamento de carga

- [ ] **Gerenciar timeouts por conta**
  - Timeout específico por conta
  - Configuração por exchange
  - Monitoramento de timeouts

- [ ] **Retry logic por conta**
  - Retry específico por conta
  - Backoff por conta
  - Logs de retry

### **6.2.4** Criar `AccountCredentialsService`
- [ ] **Buscar credenciais da conta ativa**
  - Cache de credenciais
  - Validação de credenciais
  - Refresh automático

- [ ] **Cache de credenciais por conta**
  - Cache em memória
  - TTL configurável
  - Invalidação automática

- [ ] **Validação de credenciais antes da execução**
  - Teste de credenciais
  - Validação de permissões
  - Logs de validação

---

## 🎨 **6.3 DASHBOARD DE AUTOMAÇÕES**

### **6.3.1** Atualizar interface de automações
- [ ] **Filtros por conta**
  - Dropdown de seleção de conta
  - Filtros combinados
  - Persistência de filtros

- [ ] **Indicadores visuais de conta**
  - Badge da conta ativa
  - Ícones por exchange
  - Status visual da conta

- [ ] **Estatísticas por conta**
  - Métricas por conta
  - Performance por conta
  - Relatórios por conta

### **6.3.2** Criar `AutomationAccountFilter.tsx`
- [ ] **Dropdown de seleção de conta**
  - Lista de contas do usuário
  - Filtro por exchange
  - Busca de contas

- [ ] **Filtros por status e conta**
  - Filtros combinados
  - Persistência de estado
  - Reset de filtros

- [ ] **Indicadores visuais de conta ativa**
  - Badge de conta ativa
  - Ícones de status
  - Contadores por conta

### **6.3.3** Atualizar `AutomationCard.tsx`
- [ ] **Exibir conta associada**
  - Nome da conta
  - Exchange da conta
  - Status da conta

- [ ] **Indicador visual da conta**
  - Badge da conta
  - Ícone da exchange
  - Status visual

- [ ] **Ações por conta**
  - Editar automação
  - Trocar conta
  - Testar credenciais

### **6.3.4** Criar `AutomationAccountStats.tsx`
- [ ] **Estatísticas por conta**
  - Total de automações
  - Automações ativas
  - Performance por conta

- [ ] **Performance por conta**
  - Tempo de execução
  - Taxa de sucesso
  - Métricas de erro

- [ ] **Métricas de execução**
  - Execuções por dia
  - Última execução
  - Próxima execução

---

## 🔄 **6.4 INTEGRAÇÃO COM SISTEMA DE CONTAS**

### **6.4.1** Atualizar `useAutomations` hook
- [ ] **Filtrar por conta ativa**
  - Filtro automático por conta
  - Refresh ao trocar conta
  - Cache por conta

- [ ] **Refresh automático ao trocar conta**
  - Eventos de mudança de conta
  - Refresh automático
  - Sincronização de estado

- [ ] **Estados de loading por conta**
  - Loading específico por conta
  - Estados de erro por conta
  - Feedback visual

### **6.4.2** Modificar `AutomationContext`
- [ ] **Contexto de conta ativa**
  - Estado da conta ativa
  - Eventos de mudança
  - Sincronização

- [ ] **Sincronização com AccountContext**
  - Integração com sistema de contas
  - Eventos compartilhados
  - Estado sincronizado

- [ ] **Eventos de mudança de conta**
  - Listeners de eventos
  - Callbacks de mudança
  - Notificações

### **6.4.3** Atualizar `AutomationForm`
- [ ] **Seleção de conta para nova automação**
  - Dropdown de contas
  - Validação de conta
  - Preenchimento automático

- [ ] **Validação de conta ativa**
  - Verificar conta ativa
  - Validar credenciais
  - Feedback de validação

- [ ] **Preenchimento automático de credenciais**
  - Credenciais da conta selecionada
  - Validação automática
  - Cache de credenciais

### **6.4.4** Criar `AutomationAccountManager`
- [ ] **Gerenciar automações por conta**
  - CRUD por conta
  - Validação de limites
  - Sincronização

- [ ] **Migração de automações existentes**
  - Script de migração
  - Validação de dados
  - Relatórios

- [ ] **Validação de limites por conta**
  - Verificar limites do plano
  - Contar automações
  - Bloquear se necessário

---

## 💾 **6.5 PERSISTÊNCIA E SINCRONIZAÇÃO**

### **6.5.1** Atualizar `indicatorPersistenceService`
- [ ] **Persistir conta ativa para automações**
  - Estado da conta ativa
  - Sincronização cross-tab
  - Persistência local

- [ ] **Sincronização cross-tab**
  - Eventos de storage
  - Sincronização automática
  - Conflitos de estado

- [ ] **Eventos de mudança de conta**
  - Listeners de eventos
  - Callbacks de mudança
  - Notificações

### **6.5.2** Modificar `useActiveAccount` hook
- [ ] **Integração com automações**
  - Eventos de mudança
  - Sincronização de estado
  - Callbacks de automação

- [ ] **Eventos de mudança**
  - Listeners de eventos
  - Callbacks de mudança
  - Notificações

- [ ] **Sincronização com workers**
  - Integração com workers
  - Eventos de execução
  - Sincronização de estado

### **6.5.3** Criar `AutomationAccountSync`
- [ ] **Sincronização de conta ativa**
  - Estado sincronizado
  - Eventos de mudança
  - Sincronização cross-tab

- [ ] **Eventos de mudança**
  - Listeners de eventos
  - Callbacks de mudança
  - Notificações

- [ ] **Persistência de estado**
  - Estado persistido
  - Sincronização automática
  - Conflitos de estado

---

## 🔒 **6.6 VALIDAÇÃO E SEGURANÇA**

### **6.6.1** Validar credenciais por conta
- [ ] **Teste de credenciais antes da execução**
  - Validação automática
  - Teste de conectividade
  - Logs de validação

- [ ] **Validação de permissões**
  - Verificar permissões da conta
  - Validação de acesso
  - Logs de segurança

- [ ] **Logs de segurança**
  - Logs de validação
  - Logs de segurança
  - Auditoria

### **6.6.2** Implementar rate limiting por conta
- [ ] **Limites de execução por conta**
  - Rate limiting por conta
  - Configuração por exchange
  - Monitoramento de uso

- [ ] **Throttling por conta**
  - Throttling específico
  - Configuração por conta
  - Monitoramento

- [ ] **Monitoramento de uso**
  - Métricas de uso
  - Alertas de limite
  - Relatórios

### **6.6.3** Criar `AutomationAccountValidator`
- [ ] **Validação de conta ativa**
  - Verificar conta ativa
  - Validação de estado
  - Logs de validação

- [ ] **Verificação de credenciais**
  - Teste de credenciais
  - Validação de conectividade
  - Logs de validação

- [ ] **Validação de limites**
  - Verificar limites do plano
  - Contar automações
  - Bloquear se necessário

---

## 📊 **6.7 MONITORAMENTO E LOGS**

### **6.7.1** Atualizar sistema de logs
- [ ] **Logs por conta**
  - Logs estruturados por conta
  - Rastreamento de execução
  - Métricas por conta

- [ ] **Rastreamento de execução**
  - Logs de execução
  - Rastreamento de performance
  - Métricas de tempo

- [ ] **Métricas por conta**
  - Métricas de performance
  - Estatísticas de uso
  - Relatórios

### **6.7.2** Criar `AutomationAccountMonitor`
- [ ] **Monitoramento de execução**
  - Monitoramento em tempo real
  - Alertas de erro
  - Métricas de performance

- [ ] **Alertas por conta**
  - Alertas específicos por conta
  - Notificações de erro
  - Alertas de limite

- [ ] **Dashboard de métricas**
  - Dashboard por conta
  - Métricas em tempo real
  - Relatórios

### **6.7.3** Implementar `AutomationAccountMetrics`
- [ ] **Métricas de performance**
  - Tempo de execução
  - Taxa de sucesso
  - Métricas de erro

- [ ] **Estatísticas de uso**
  - Uso por conta
  - Estatísticas de execução
  - Relatórios

- [ ] **Relatórios por conta**
  - Relatórios específicos
  - Exportação de dados
  - Análise de performance

---

## 📈 **RESUMO DE SUBTAREFAS**

### **Total de Subtarefas**: 28
- **6.1 Vinculação de Automações**: 4 subtarefas
- **6.2 Workers e Execução**: 4 subtarefas
- **6.3 Dashboard de Automações**: 4 subtarefas
- **6.4 Integração com Sistema de Contas**: 4 subtarefas
- **6.5 Persistência e Sincronização**: 3 subtarefas
- **6.6 Validação e Segurança**: 3 subtarefas
- **6.7 Monitoramento e Logs**: 3 subtarefas

### **Prioridade de Implementação**:
1. **Alta**: 6.1, 6.2, 6.4 (Core functionality)
2. **Média**: 6.3, 6.5 (UI/UX and persistence)
3. **Baixa**: 6.6, 6.7 (Security and monitoring)

---

**Última Atualização**: 2025-01-09  
**Versão**: v2.6.0  
**Status**: ⏳ Em Progresso
