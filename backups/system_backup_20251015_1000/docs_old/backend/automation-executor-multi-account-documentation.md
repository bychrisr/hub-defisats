# Automation Executor Multi-Account - Documentação Técnica

## 📋 **Visão Geral**

O `automation-executor.ts` é um worker especializado que executa automações de trading no sistema multi-account. Ele foi completamente refatorado para suportar múltiplas contas de exchange por usuário, garantindo que cada automação seja executada com as credenciais corretas da conta associada.

## 🏗️ **Arquitetura Multi-Account**

### **Fluxo de Execução**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Automation    │    │   Automation    │    │   LN Markets    │
│   Queue         │───►│   Executor      │───►│   API           │
│   (BullMQ)      │    │   Worker        │    │   (Credenciais) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   User Exchange │
                       │   Account       │
                       │   (Credenciais) │
                       └─────────────────┘
```

### **Componentes Principais**
- **UserExchangeAccountService**: Gerenciamento de contas de exchange
- **CredentialCacheService**: Cache de credenciais por conta
- **LNMarketsAPIService**: Interface com API da LN Markets
- **Automation Types**: Margin Guard, TP/SL, Auto Entry

## 🔧 **Funcionalidades Implementadas**

### **1. Gerenciamento de Credenciais por Conta**

#### **Função: `getUserCredentials(userId, accountId?)`**
- **Propósito**: Busca credenciais da conta específica ou conta ativa
- **Cache**: Cache específico por conta (`${userId}-${accountId}`)
- **Validação**: Verifica se credenciais existem e não estão vazias
- **Retorno**: `{ credentials: SecureCredentials; account: UserExchangeAccount }`

```typescript
// Buscar credenciais de conta específica
const credentialsData = await getUserCredentials(userId, accountId);

// Buscar credenciais da conta ativa
const credentialsData = await getUserCredentials(userId);
```

#### **Validações Implementadas**
- ✅ **Conta Existe**: Verifica se a conta pertence ao usuário
- ✅ **Credenciais Válidas**: Confirma que credenciais não estão vazias
- ✅ **Cache Inteligente**: Cache específico para cada conta
- ✅ **Logs Detalhados**: Logs com informações da conta

### **2. Configuração de Automação com Dados da Conta**

#### **Função: `getAutomationConfig(automationId)`**
- **Propósito**: Busca configuração da automação com dados da conta associada
- **Include**: Dados da conta e exchange
- **Validação**: Verifica se automação existe e tem conta vinculada

```typescript
const automation = await getAutomationConfig(automationId);
// Retorna: { id, type, config, user_exchange_account: { account_name, exchange: { name, slug } } }
```

### **3. Execução de Automações por Tipo**

#### **Margin Guard (`margin_guard`)**
- **Ações**: `close_position`, `reduce_position`, `add_margin`
- **Logs**: Incluem nome da conta em todas as operações
- **Validação**: Trade ID obrigatório para ações específicas

```typescript
await executeMarginGuardAction(lnMarkets, config, userId, accountName, tradeId);
```

#### **Take Profit / Stop Loss (`tp_sl`)**
- **Ações**: `update_tp`, `update_sl`, `close_tp`, `close_sl`
- **Logs**: Incluem nome da conta em todas as operações
- **Validação**: Parâmetros específicos para cada ação

```typescript
await executeTpSlAction(lnMarkets, config, userId, accountName, tradeId);
```

#### **Automatic Entries (`auto_entry`)**
- **Funcionalidade**: Criação automática de posições
- **Logs**: Incluem nome da conta em todas as operações
- **Validação**: Side e quantity obrigatórios

```typescript
await executeAutoEntryAction(lnMarkets, config, userId, accountName);
```

## 📊 **Sistema de Logging Multi-Account**

### **Padrão de Logs**
Todos os logs seguem o padrão: `[EMOJI] AUTOMATION EXECUTOR - [AÇÃO] for account [NOME_DA_CONTA]`

#### **Tipos de Logs**
- **🔍 DEBUG**: Busca de credenciais e configurações
- **✅ SUCCESS**: Operações executadas com sucesso
- **❌ ERROR**: Falhas e erros
- **🎯 EXECUTION**: Execução de ações específicas
- **📊 INFO**: Informações gerais

#### **Exemplos de Logs**
```typescript
// Busca de credenciais
🔍 AUTOMATION EXECUTOR - Getting credentials for user user123 and account acc456
✅ AUTOMATION EXECUTOR - Found account: Main Account (LN Markets)

// Execução de automação
🎯 AUTOMATION EXECUTOR - Executing Margin Guard action for user user123 on account Main Account
🛑 AUTOMATION EXECUTOR - Closing position trade123 for user user123 on account Main Account
✅ AUTOMATION EXECUTOR - Successfully closed position trade123 on account Main Account

// Erros
❌ AUTOMATION EXECUTOR - Failed to execute Margin Guard action for account Main Account: Error message
```

### **Logs por Função**

#### **getUserCredentials**
```typescript
🔍 AUTOMATION EXECUTOR - Getting credentials for user user123 and account acc456
✅ AUTOMATION EXECUTOR - Found account: Main Account (LN Markets)
✅ AUTOMATION EXECUTOR - Credentials found in cache for account Main Account
```

#### **executeMarginGuardAction**
```typescript
🎯 AUTOMATION EXECUTOR - Executing Margin Guard action for user user123 on account Main Account
📋 AUTOMATION EXECUTOR - Action: close_position
🛑 AUTOMATION EXECUTOR - Closing position trade123 for user user123 on account Main Account
✅ AUTOMATION EXECUTOR - Successfully closed position trade123 on account Main Account
```

#### **executeAutoEntryAction**
```typescript
🎯 AUTOMATION EXECUTOR - Executing Auto Entry action for user user123 on account Main Account
📈 AUTOMATION EXECUTOR - Creating LONG position: 100 contracts at 10x leverage for account Main Account
✅ AUTOMATION EXECUTOR - Auto entry executed successfully for account Main Account. Trade ID: trade456
```

## 🔄 **Fluxo de Execução Multi-Account**

### **1. Recebimento do Job**
```typescript
// Job data: { userId, automationId, action, tradeId }
const { userId, automationId, action, tradeId } = job.data;
```

### **2. Busca da Configuração**
```typescript
// Busca automação com dados da conta
const automation = await getAutomationConfig(automationId);
// Resultado: { id, type, config, user_exchange_account: { account_name, exchange: { name } } }
```

### **3. Validação da Conta**
```typescript
// Verifica se automação tem conta vinculada
const accountId = automation.user_exchange_account_id;
if (!accountId) {
  throw new Error(`Automation ${automationId} has no associated account`);
}
```

### **4. Busca de Credenciais**
```typescript
// Busca credenciais da conta específica
const credentialsData = await getUserCredentials(userId, accountId);
const { credentials, account } = credentialsData;
```

### **5. Execução da Automação**
```typescript
// Executa baseado no tipo
switch (automation.type) {
  case 'margin_guard':
    await executeMarginGuardAction(lnMarkets, config, userId, accountName, tradeId);
    break;
  case 'tp_sl':
    await executeTpSlAction(lnMarkets, config, userId, accountName, tradeId);
    break;
  case 'auto_entry':
    await executeAutoEntryAction(lnMarkets, config, userId, accountName);
    break;
}
```

### **6. Retorno com Informações da Conta**
```typescript
return {
  status: 'completed',
  action: 'margin_guard_executed',
  timestamp: new Date().toISOString(),
  automationId,
  userId,
  accountId,
  accountName,
  tradeId
};
```

## 🗄️ **Integração com Banco de Dados**

### **Tabelas Utilizadas**
- **`Automation`**: Configurações de automação
- **`UserExchangeAccounts`**: Contas de exchange dos usuários
- **`Exchange`**: Informações das exchanges
- **`TradeLog`**: Logs de execução

### **Relacionamentos**
```sql
Automation.user_exchange_account_id → UserExchangeAccounts.id
UserExchangeAccounts.exchange_id → Exchange.id
TradeLog.automation_id → Automation.id
```

### **Queries Otimizadas**
```typescript
// Busca automação com dados da conta
const automation = await prisma.automation.findUnique({
  where: { id: automationId },
  include: {
    user_exchange_account: {
      include: {
        exchange: {
          select: { id: true, name: true, slug: true }
        }
      }
    }
  }
});
```

## 🔒 **Segurança e Validações**

### **Validações de Segurança**
- ✅ **Propriedade da Conta**: Verifica se conta pertence ao usuário
- ✅ **Credenciais Válidas**: Confirma que credenciais não estão vazias
- ✅ **Conta Ativa**: Verifica se conta está ativa quando necessário
- ✅ **Autenticação**: Todos os endpoints requerem autenticação

### **Tratamento de Erros**
- **404**: Conta não encontrada
- **400**: Credenciais inválidas ou conta inativa
- **500**: Erros internos do servidor
- **Logs Detalhados**: Todos os erros incluem informações da conta

### **Cache de Segurança**
- **Cache por Conta**: Cada conta tem seu próprio cache
- **Expiração**: Cache expira automaticamente
- **Validação**: Credenciais são validadas antes do cache

## 📈 **Monitoramento e Métricas**

### **Métricas por Conta**
- **Execuções por Conta**: Contagem de automações executadas
- **Taxa de Sucesso**: Sucesso/falha por conta
- **Tempo de Execução**: Performance por conta
- **Erros por Conta**: Análise de falhas por conta

### **Logs Estruturados**
```typescript
interface AutomationLog {
  timestamp: string;
  userId: string;
  accountId: string;
  accountName: string;
  automationId: string;
  automationType: string;
  action: string;
  status: 'success' | 'error';
  duration?: number;
  error?: string;
}
```

### **Alertas por Conta**
- **Falhas de Credenciais**: Conta com credenciais inválidas
- **Conta Inativa**: Tentativa de usar conta inativa
- **Erros de API**: Falhas na comunicação com exchange
- **Timeout**: Execução que excedeu tempo limite

## 🚀 **Configuração e Deploy**

### **Variáveis de Ambiente**
```bash
# Redis
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/axisor

# LN Markets API
LN_MARKETS_API_URL=https://api.lnmarkets.com
```

### **Docker Compose**
```yaml
services:
  automation-executor:
    build: ./backend
    command: npm run worker:automation-executor
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/axisor
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
```

### **Scripts NPM**
```json
{
  "scripts": {
    "worker:automation-executor": "tsx src/workers/automation-executor.ts",
    "worker:automation-executor:dev": "tsx --watch src/workers/automation-executor.ts"
  }
}
```

## 🔧 **Desenvolvimento e Debugging**

### **Logs de Debug**
```typescript
// Habilitar logs detalhados
console.log('🔍 AUTOMATION EXECUTOR - Getting credentials for user', userId);
console.log('✅ AUTOMATION EXECUTOR - Found account:', accountName);
console.log('🎯 AUTOMATION EXECUTOR - Executing action for account:', accountName);
```

### **Testes Locais**
```bash
# Executar worker em modo desenvolvimento
npm run worker:automation-executor:dev

# Verificar logs
docker logs automation-executor-worker

# Testar com dados específicos
curl -X POST http://localhost:13000/api/automation/execute \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "automationId": "auto456", "action": "margin_guard"}'
```

### **Monitoramento em Tempo Real**
```bash
# Acompanhar logs do worker
docker logs -f automation-executor-worker

# Verificar filas Redis
redis-cli monitor

# Verificar métricas
curl http://localhost:13000/api/health/workers
```

## 📊 **Performance e Otimização**

### **Otimizações Implementadas**
- **Cache por Conta**: Evita consultas repetidas ao banco
- **Connection Pooling**: Reutilização de conexões
- **Batch Processing**: Processamento em lote quando possível
- **Lazy Loading**: Carregamento sob demanda

### **Limites e Throttling**
- **Rate Limiting**: Limite de requisições por conta
- **Timeout**: Timeout configurável por operação
- **Retry Logic**: Lógica de retry com backoff exponencial
- **Circuit Breaker**: Pausa após muitas falhas

### **Métricas de Performance**
```typescript
interface PerformanceMetrics {
  executionsPerMinute: number;
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
  cacheHitRate: number;
  accountsActive: number;
}
```

## 🔄 **Migração e Compatibilidade**

### **Compatibilidade com Sistema Anterior**
- ✅ **Backward Compatibility**: Mantém compatibilidade com automações existentes
- ✅ **Migração Automática**: Automações são migradas automaticamente para contas
- ✅ **Fallback**: Sistema de fallback para casos de erro
- ✅ **Validação**: Validação de integridade dos dados

### **Migração de Dados**
```typescript
// Migração automática de automações existentes
const result = await automationAccountService.migrateExistingAutomations(userId);
console.log(`Migrated ${result.migratedCount} automations`);
```

## 📝 **Exemplos de Uso**

### **Execução de Margin Guard**
```typescript
// Job data
const jobData = {
  userId: 'user123',
  automationId: 'auto456',
  action: 'close_position',
  tradeId: 'trade789'
};

// Resultado esperado
{
  status: 'completed',
  action: 'close_position',
  timestamp: '2025-01-09T23:55:00Z',
  automationId: 'auto456',
  userId: 'user123',
  accountId: 'acc789',
  accountName: 'Main Account',
  tradeId: 'trade789'
}
```

### **Execução de Auto Entry**
```typescript
// Job data
const jobData = {
  userId: 'user123',
  automationId: 'auto789',
  action: 'auto_entry'
};

// Resultado esperado
{
  status: 'completed',
  action: 'auto_entry_executed',
  timestamp: '2025-01-09T23:55:00Z',
  automationId: 'auto789',
  userId: 'user123',
  accountId: 'acc789',
  accountName: 'Main Account',
  tradeId: 'trade456',
  result: {
    status: 'completed',
    tradeId: 'trade456',
    side: 'b',
    quantity: 100,
    leverage: 10,
    market: 'btcusd'
  }
}
```

---

## 📝 **Changelog**

### **v2.6.6 - 2025-01-09**
- ✅ **Integração Multi-Account**: Integração completa com UserExchangeAccountService
- ✅ **Credenciais por Conta**: Uso de credenciais específicas da conta ativa
- ✅ **Logs Detalhados**: Logs com informações da conta em todas as operações
- ✅ **Validação Robusta**: Validação de credenciais por conta
- ✅ **Cache Inteligente**: Cache de credenciais por conta específica
- ✅ **Tratamento de Erros**: Logs de erro com informações da conta
- ✅ **Compatibilidade**: Mantém compatibilidade com sistema anterior

---

**Status**: ✅ **COMPLETO** - FASE 6.2.1 implementada com sucesso  
**Próximo**: FASE 6.2.2 - Modificar automation-worker.ts  
**Versão**: v2.6.6  
**Última Atualização**: 2025-01-09
