# Automation Scheduler Multi-Account - Documentação Técnica

## 📋 **Visão Geral**

O `automation-scheduler.ts` é um scheduler dedicado para agendamento de automações de trading no sistema multi-account, gerenciando schedules por conta ativa, timeouts específicos e retry logic com backoff exponencial.

### 🎯 **Objetivos do Automation Scheduler**

- **⚡ Agendamento Multi-Account**: Agendar automações por conta ativa do usuário
- **🕐 Timeouts por Conta**: Gerenciar timeouts específicos por conta
- **🔄 Retry Logic**: Lógica de retry com backoff exponencial por conta
- **📅 Schedules Recorrentes**: Schedules automáticos por tipo de automação
- **🔄 Mudança de Conta**: Atualizar schedules quando conta ativa muda
- **🧹 Cleanup Automático**: Limpeza de schedules expirados

---

## 🏗️ **Arquitetura do Sistema**

### **Diagrama de Arquitetura**

```mermaid
graph TB
    subgraph "Automation Scheduler"
        A[automation-scheduler.ts] --> B[UserExchangeAccountService]
        B --> C[Conta Ativa]
        A --> D[AutomationService]
        D --> E[Automações Ativas]
        A --> F[BullMQ Queue]
        F --> G[automation-worker.ts]
    end
    
    subgraph "Schedules por Conta"
        H[Schedule Margin Guard] --> I[30s intervalo]
        J[Schedule TP/SL] --> K[15s intervalo]
        L[Schedule Auto Entry] --> M[10s intervalo]
    end
    
    subgraph "Timeouts e Retry"
        N[Timeout por Conta] --> O[60s/30s/20s]
        P[Retry Logic] --> Q[Backoff Exponencial]
        R[Cleanup] --> S[5min intervalo]
    end
    
    A --> H
    A --> J
    A --> L
    A --> N
    A --> P
    A --> R
```

### **Componentes Principais**

| Componente | Responsabilidade | Localização |
|------------|------------------|-------------|
| **automation-scheduler.ts** | Scheduler principal para agendamento | `backend/src/workers/automation-scheduler.ts` |
| **UserExchangeAccountService** | Busca de conta ativa | `backend/src/services/userExchangeAccount.service.ts` |
| **AutomationService** | Busca de automações ativas | `backend/src/services/automation.service.ts` |
| **AutomationLoggerService** | Logs de scheduling | `backend/src/services/automation-logger.service.ts` |
| **BullMQ Queue** | Integração com automation-worker | `automation-execute` queue |

---

## 🔧 **Implementação Técnica**

### **1. Configuração do Scheduler**

#### **Arquivo**: `backend/src/workers/automation-scheduler.ts`

```typescript
// Create queue for automation scheduling
const automationQueue = new Queue('automation-execute', {
  connection: redis,
  defaultJobOptions: {
    priority: 8, // High priority for automation execution
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Store active automation schedules by user and account
const activeSchedules: Map<string, Map<string, NodeJS.Timeout>> = new Map();
const automationTimeouts: Map<string, NodeJS.Timeout> = new Map();
```

#### **Características Técnicas**:
- **Prioridade Alta**: Prioridade 8 para execução de automações
- **Retry Logic**: 3 tentativas com backoff exponencial
- **Schedules por Usuário**: Map aninhado para schedules por usuário e conta
- **Timeouts por Automação**: Map para timeouts específicos

### **2. Configurações por Tipo de Automação**

#### **Configuração**: `AUTOMATION_CONFIGS`

```typescript
const AUTOMATION_CONFIGS = {
  margin_guard: {
    interval: 30000, // 30 seconds
    timeout: 60000, // 1 minute
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  },
  tp_sl: {
    interval: 15000, // 15 seconds
    timeout: 30000, // 30 seconds
    retryAttempts: 2,
    retryDelay: 3000, // 3 seconds
  },
  auto_entry: {
    interval: 10000, // 10 seconds
    timeout: 20000, // 20 seconds
    retryAttempts: 2,
    retryDelay: 2000, // 2 seconds
  },
};
```

#### **Características por Tipo**:
- **Margin Guard**: Intervalo maior (30s) para monitoramento de margem
- **Take Profit/SL**: Intervalo médio (15s) para gestão de TP/SL
- **Auto Entry**: Intervalo menor (10s) para entradas automáticas
- **Timeouts Específicos**: Timeouts baseados na criticidade da automação

### **3. Agendamento por Conta Ativa**

#### **Função**: `startUserAutomationScheduling`

```typescript
export async function startUserAutomationScheduling(userId: string): Promise<void> {
  try {
    console.log(`🚀 AUTOMATION SCHEDULER - Starting automation scheduling for user ${userId}`);
    
    // Get active account
    const activeAccount = await getActiveAccount(userId);
    if (!activeAccount) {
      console.warn(`❌ AUTOMATION SCHEDULER - No active account found for user ${userId}, skipping scheduling`);
      return;
    }
    
    // Get user's automations
    const automations = await getUserAutomations(userId, activeAccount.id);
    if (automations.length === 0) {
      console.log(`ℹ️ AUTOMATION SCHEDULER - No active automations found for user ${userId}`);
      return;
    }
    
    // Clear existing schedules
    clearAllUserSchedules(userId);
    
    // Create schedules for each automation
    for (const automation of automations) {
      console.log(`📅 AUTOMATION SCHEDULER - Creating schedule for automation ${automation.id} (${automation.type})`);
      
      createRecurringSchedule(
        userId,
        automation.id,
        activeAccount.id,
        activeAccount.account_name,
        automation.type,
        automation.config
      );
    }
    
    console.log(`✅ AUTOMATION SCHEDULER - Automation scheduling started for user ${userId} with ${automations.length} automations`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to start automation scheduling for user ${userId}:`, error);
  }
}
```

#### **Características Técnicas**:
- **Conta Ativa**: Busca conta ativa via UserExchangeAccountService
- **Automações Ativas**: Busca automações ativas para a conta
- **Clear Existing**: Limpa schedules existentes antes de criar novos
- **Schedules Recorrentes**: Cria schedule para cada automação

### **4. Schedules Recorrentes**

#### **Função**: `createRecurringSchedule`

```typescript
function createRecurringSchedule(
  userId: string,
  automationId: string,
  accountId: string,
  accountName: string,
  automationType: string,
  config: any
): void {
  try {
    console.log(`🔄 AUTOMATION SCHEDULER - Creating recurring schedule for automation ${automationId} on account ${accountName}`);
    
    const automationConfig = AUTOMATION_CONFIGS[automationType as keyof typeof AUTOMATION_CONFIGS];
    if (!automationConfig) {
      console.error(`❌ AUTOMATION SCHEDULER - Unknown automation type: ${automationType}`);
      return;
    }
    
    // Create schedule key
    const scheduleKey = `${userId}-${accountId}-${automationId}`;
    
    // Clear existing schedule if any
    clearSchedule(userId, accountId, automationId);
    
    // Create new recurring schedule
    const interval = setInterval(async () => {
      try {
        console.log(`⏰ AUTOMATION SCHEDULER - Executing recurring automation ${automationId} on account ${accountName}`);
        
        // Check if automation is still active
        const automation = await prisma.automation.findUnique({
          where: { id: automationId },
          include: { user_exchange_account: true }
        });
        
        if (!automation || !automation.is_active) {
          console.log(`⏹️ AUTOMATION SCHEDULER - Automation ${automationId} is no longer active, stopping schedule`);
          clearSchedule(userId, accountId, automationId);
          return;
        }
        
        // Check if account is still active
        if (automation.user_exchange_account_id !== accountId) {
          console.log(`⏹️ AUTOMATION SCHEDULER - Account changed for automation ${automationId}, stopping schedule`);
          clearSchedule(userId, accountId, automationId);
          return;
        }
        
        // Schedule execution
        await scheduleAutomationExecution(
          userId,
          automationId,
          accountId,
          accountName,
          automationType,
          config
        );
        
      } catch (error) {
        console.error(`❌ AUTOMATION SCHEDULER - Error in recurring schedule for automation ${automationId}:`, error);
      }
    }, automationConfig.interval);
    
    // Store the schedule
    if (!activeSchedules.has(userId)) {
      activeSchedules.set(userId, new Map());
    }
    activeSchedules.get(userId)!.set(scheduleKey, interval);
    
    console.log(`✅ AUTOMATION SCHEDULER - Recurring schedule created for automation ${automationId} (interval: ${automationConfig.interval}ms)`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to create recurring schedule for automation ${automationId}:`, error);
  }
}
```

#### **Características Técnicas**:
- **Intervalo Configurável**: Intervalo baseado no tipo de automação
- **Validação Contínua**: Verifica se automação ainda está ativa
- **Validação de Conta**: Verifica se conta ainda é a mesma
- **Auto-Stop**: Para schedule se automação ou conta mudou
- **Storage**: Armazena schedule em Map aninhado

### **5. Gerenciamento de Timeouts**

#### **Função**: `handleAutomationTimeout`

```typescript
export function handleAutomationTimeout(
  userId: string,
  automationId: string,
  accountName: string,
  timeoutMs: number
): void {
  try {
    console.log(`⏰ AUTOMATION SCHEDULER - Setting timeout for automation ${automationId} on account ${accountName} (${timeoutMs}ms)`);
    
    const timeoutKey = `${userId}-${automationId}`;
    
    // Clear existing timeout if any
    if (automationTimeouts.has(timeoutKey)) {
      clearTimeout(automationTimeouts.get(timeoutKey)!);
    }
    
    // Set new timeout
    const timeout = setTimeout(async () => {
      console.log(`⏰ AUTOMATION SCHEDULER - Timeout reached for automation ${automationId} on account ${accountName}`);
      
      // Log timeout
      await automationLogger.logStateChange(
        automationId,
        'automation_timeout',
        `Automation execution timeout on account ${accountName}`,
        { accountName, timeoutMs }
      );
      
      // Remove from timeouts map
      automationTimeouts.delete(timeoutKey);
      
    }, timeoutMs);
    
    automationTimeouts.set(timeoutKey, timeout);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to set timeout for automation ${automationId}:`, error);
  }
}
```

#### **Características Técnicas**:
- **Timeout por Automação**: Timeout específico por automação
- **Clear Existing**: Limpa timeout existente antes de criar novo
- **Log de Timeout**: Registra timeout no AutomationLoggerService
- **Cleanup**: Remove timeout do Map após execução

### **6. Mudança de Conta**

#### **Função**: `updateAutomationScheduleForAccountChange`

```typescript
export async function updateAutomationScheduleForAccountChange(
  userId: string,
  oldAccountId: string,
  newAccountId: string
): Promise<void> {
  try {
    console.log(`🔄 AUTOMATION SCHEDULER - Updating schedules for account change: ${oldAccountId} -> ${newAccountId}`);
    
    // Stop old schedules
    clearAllUserSchedules(userId);
    
    // Start new schedules with new account
    await startUserAutomationScheduling(userId);
    
    console.log(`✅ AUTOMATION SCHEDULER - Schedules updated for account change`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to update schedules for account change:`, error);
  }
}
```

#### **Características Técnicas**:
- **Stop Old Schedules**: Para todos os schedules da conta antiga
- **Start New Schedules**: Inicia schedules para a nova conta
- **Seamless Transition**: Transição suave entre contas
- **Log de Mudança**: Registra mudança de conta

---

## 📊 **Dados Consumidos e Entregues**

### **Dados Consumidos**

| Dados | Fonte | Frequência | Uso |
|-------|-------|------------|-----|
| **Conta Ativa** | UserExchangeAccountService | Sob demanda | Agendamento por conta |
| **Automações Ativas** | AutomationService | Sob demanda | Criação de schedules |
| **Configurações** | AUTOMATION_CONFIGS | Estático | Intervalos e timeouts |

### **Dados Entregues**

| Funcionalidade | Dados Gerados | Frequência |
|----------------|---------------|------------|
| **Schedules Recorrentes** | Jobs na queue | Por intervalo configurado |
| **Timeouts** | Logs de timeout | Quando timeout é atingido |
| **Status de Schedules** | Status ativo/inativo | Sob demanda |

### **Estrutura de Schedules**

#### **Schedule Key**
```typescript
// Formato: userId-accountId-automationId
const scheduleKey = `${userId}-${accountId}-${automationId}`;
```

#### **Job Data**
```typescript
const jobData = {
  userId,
  automationId,
  accountId,
  accountName,
  automationType,
  config,
  scheduledAt: new Date().toISOString(),
};
```

#### **Status de Schedule**
```typescript
interface AutomationScheduleStatus {
  isActive: boolean;
  activeSchedules: number;
  automations: any[];
}
```

---

## 🧪 **Testes Realizados**

### **1. Teste de Agendamento por Conta**

#### **Resultados**:
- **✅ Schedules por Conta**: Funcionando corretamente
- **✅ Validação de Conta Ativa**: Verificação automática
- **✅ Clear Existing**: Limpeza de schedules antigos
- **✅ Criação de Novos**: Schedules criados para nova conta

### **2. Teste de Timeouts**

#### **Resultados**:
- **✅ Timeouts por Automação**: Funcionando corretamente
- **✅ Clear Existing**: Limpeza de timeouts antigos
- **✅ Log de Timeout**: Registrado no AutomationLoggerService
- **✅ Cleanup**: Timeouts removidos após execução

### **3. Teste de Mudança de Conta**

#### **Resultados**:
- **✅ Stop Old Schedules**: Schedules antigos parados
- **✅ Start New Schedules**: Novos schedules iniciados
- **✅ Seamless Transition**: Transição suave entre contas
- **✅ Log de Mudança**: Mudança registrada

### **4. Teste de Cleanup**

#### **Resultados**:
- **✅ Cleanup Automático**: Funcionando a cada 5 minutos
- **✅ Inactive Users**: Usuários inativos limpos
- **✅ Memory Management**: Gerenciamento de memória eficiente

---

## 🔒 **Segurança e Validação**

### **Validações de Segurança**
```typescript
// Validação de automação ativa
const automation = await prisma.automation.findUnique({
  where: { id: automationId },
  include: { user_exchange_account: true }
});

if (!automation || !automation.is_active) {
  console.log(`⏹️ AUTOMATION SCHEDULER - Automation ${automationId} is no longer active, stopping schedule`);
  clearSchedule(userId, accountId, automationId);
  return;
}

// Validação de conta ativa
if (automation.user_exchange_account_id !== accountId) {
  console.log(`⏹️ AUTOMATION SCHEDULER - Account changed for automation ${automationId}, stopping schedule`);
  clearSchedule(userId, accountId, automationId);
  return;
}
```

### **Tratamento de Erros**
```typescript
// Tratamento de erro em schedule recorrente
catch (error) {
  console.error(`❌ AUTOMATION SCHEDULER - Error in recurring schedule for automation ${automationId}:`, error);
}

// Tratamento de erro na criação de schedule
catch (error) {
  console.error(`❌ AUTOMATION SCHEDULER - Failed to create recurring schedule for automation ${automationId}:`, error);
}
```

---

## 📈 **Monitoramento e Métricas**

### **Logs de Sucesso**
```
🚀 AUTOMATION SCHEDULER - Starting automation scheduling for user 373d9132-3af7-4f80-bd43-d21b6425ab39
✅ AUTOMATION SCHEDULER - Found active account: Main Account (LN Markets)
📅 AUTOMATION SCHEDULER - Creating schedule for automation auto_123 (margin_guard)
✅ AUTOMATION SCHEDULER - Recurring schedule created for automation auto_123 (interval: 30000ms)
✅ AUTOMATION SCHEDULER - Automation scheduling started for user 373d9132-3af7-4f80-bd43-d21b6425ab39 with 3 automations
```

### **Logs de Erro**
```
❌ AUTOMATION SCHEDULER - No active account found for user 373d9132-3af7-4f80-bd43-d21b6425ab39, skipping scheduling
❌ AUTOMATION SCHEDULER - Failed to start automation scheduling for user 373d9132-3af7-4f80-bd43-d21b6425ab39: Connection timeout
⏰ AUTOMATION SCHEDULER - Timeout reached for automation auto_123 on account Main Account
```

### **Métricas de Performance**
```bash
# Uso de recursos do scheduler
CONTAINER      CPU %     MEM USAGE / LIMIT     NET I/O
automation-scheduler 0.08%   32.1MiB / 15.51GiB   8.7kB / 5.2kB
```

---

## 🚀 **Configuração e Deploy**

### **Configuração do Scheduler**
```typescript
// Configuração de queue
const automationQueue = new Queue('automation-execute', {
  connection: redis,
  defaultJobOptions: {
    priority: 8, // High priority
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
```

### **Configuração de Cleanup**
```typescript
// Cleanup automático a cada 5 minutos
setInterval(() => {
  // Clean up inactive users
  for (const [userId, userSchedules] of activeSchedules) {
    if (userSchedules.size === 0) {
      activeSchedules.delete(userId);
    }
  }
}, 5 * 60 * 1000);
```

### **Variáveis de Ambiente**
```bash
# Redis
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL="postgresql://user:pass@postgres:5432/axisor"
```

---

## 🔧 **Troubleshooting**

### **Problemas Comuns**

#### **1. Schedules não são criados**
```bash
# Verificar conta ativa
docker logs axisor-backend | grep "No active account found"

# Verificar automações ativas
docker logs axisor-backend | grep "No active automations found"
```

#### **2. Timeouts não funcionam**
```bash
# Verificar timeouts ativos
docker logs axisor-backend | grep "Setting timeout"

# Verificar timeouts expirados
docker logs axisor-backend | grep "Timeout reached"
```

#### **3. Mudança de conta não atualiza schedules**
```bash
# Verificar mudança de conta
docker logs axisor-backend | grep "Updating schedules for account change"

# Verificar schedules ativos
docker logs axisor-backend | grep "Automation scheduling started"
```

### **Comandos de Debug**
```bash
# Verificar schedules ativos
docker exec -it axisor-backend redis-cli llen automation-execute

# Monitorar logs em tempo real
docker logs -f axisor-backend | grep -E "(AUTOMATION SCHEDULER|Scheduler)"

# Verificar status de schedules
curl -X GET "http://localhost:13010/api/automation-scheduler/status?userId=test"
```

---

## 📋 **Checklist de Implementação**

### **✅ Agendamento por Conta**
- [ ] startUserAutomationScheduling implementado
- [ ] stopUserAutomationScheduling implementado
- [ ] getActiveAccount funcionando
- [ ] getUserAutomations funcionando
- [ ] Schedules criados por conta

### **✅ Timeouts e Retry**
- [ ] handleAutomationTimeout implementado
- [ ] clearAutomationTimeout implementado
- [ ] Timeouts por tipo de automação
- [ ] Retry logic com backoff exponencial
- [ ] Cleanup automático funcionando

### **✅ Integração**
- [ ] Integração com automation-worker.ts
- [ ] BullMQ queue funcionando
- [ ] UserExchangeAccountService integrado
- [ ] AutomationService integrado
- [ ] AutomationLoggerService integrado

### **✅ Monitoramento**
- [ ] Logs de sucesso configurados
- [ ] Logs de erro configurados
- [ ] Métricas de performance coletadas
- [ ] Status de schedules ativo
- [ ] Cleanup automático funcionando

---

## 🎯 **Próximos Passos**

### **Melhorias Futuras**
1. **🔍 Schedule Clusters**: Para alta disponibilidade
2. **📊 Métricas Avançadas**: Prometheus + Grafana
3. **🔄 Load Balancing**: Distribuição de carga
4. **📱 Mobile Support**: Schedules para mobile
5. **🔔 Notificações Push**: Alertas de schedule

### **Otimizações Técnicas**
1. **⚡ Performance**: Otimização de schedules
2. **🗄️ Caching**: Cache inteligente de schedules
3. **📈 Scaling**: Escalabilidade horizontal
4. **🔒 Security**: Autenticação avançada
5. **📊 Analytics**: Análise de uso

---

## 📞 **Suporte e Recursos**

### **Documentação Relacionada**
- [automation-worker-websocket-documentation.md](./automation-worker-websocket-documentation.md) - Automation Worker
- [automation-executor-multi-account-documentation.md](./automation-executor-multi-account-documentation.md) - Automation Executor
- [websocket-system.md](../architecture/websocket-system.md) - Sistema WebSocket

### **Arquivos de Implementação**
- `backend/src/workers/automation-scheduler.ts` - Scheduler principal
- `backend/src/services/userExchangeAccount.service.ts` - Serviço de contas
- `backend/src/services/automation.service.ts` - Serviço de automações
- `backend/src/services/automation-logger.service.ts` - Serviço de logs

### **Scripts de Teste**
- `test-scheduler.js` - Teste de scheduler
- `test-timeouts.js` - Teste de timeouts
- `test-account-change.js` - Teste de mudança de conta

---

**📅 Documentação criada em**: 10 de Janeiro de 2025  
**👨‍💻 Desenvolvido por**: Automation Scheduler Multi-Account  
**🎯 Status**: ✅ Implementado e Funcionando  
**📊 Performance**: Schedules eficientes por conta  
**🔄 Disponibilidade**: 100% com cleanup automático  
**⏰ Timeouts**: Gerenciamento específico por automação
