# Automation Account Service - Documentação Técnica

## 📋 **Visão Geral**

O `AutomationAccountService` é um serviço especializado que gerencia a vinculação de automações com contas de exchange no sistema multi-account. Ele fornece funcionalidades para vinculação automática, migração de dados e validação de limites por conta.

## 🏗️ **Arquitetura**

### **Dependências**
- `PrismaClient`: ORM para acesso ao banco de dados
- `UserExchangeAccountService`: Gerenciamento de contas de exchange
- `AutomationService`: Gerenciamento de automações
- `AutomationLoggerService`: Logging de eventos de automação

### **Interfaces Principais**

```typescript
interface AutomationAccountData {
  userId: string;
  automationId: string;
  accountId: string;
}

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
}

interface AccountLimitsValidation {
  isValid: boolean;
  currentCount: number;
  maxLimit: number;
  limitType: string;
  message?: string;
}
```

## 🔧 **Funcionalidades Implementadas**

### **1. Vinculação Automática de Automações**

#### **Método: `linkAutomationToActiveAccount`**
- **Propósito**: Vincula uma automação à conta ativa do usuário
- **Validações**:
  - Verifica se a conta existe e pertence ao usuário
  - Confirma se a conta está ativa
  - Valida se a conta tem credenciais válidas
- **Logs**: Registra a vinculação no sistema de logs

```typescript
const automation = await automationAccountService.linkAutomationToActiveAccount({
  userId: 'user-id',
  automationId: 'automation-id',
  accountId: 'account-id'
});
```

### **2. Migração de Automações Existentes**

#### **Método: `migrateExistingAutomations`**
- **Propósito**: Migra automações existentes para a conta ativa
- **Processo**:
  1. Busca automações sem conta vinculada
  2. Identifica a conta ativa do usuário
  3. Vincula cada automação à conta ativa
  4. Registra logs de migração
- **Retorno**: `MigrationResult` com estatísticas da migração

```typescript
const result = await automationAccountService.migrateExistingAutomations('user-id');
console.log(`Migrated ${result.migratedCount} automations`);
```

### **3. Validação de Limites por Conta**

#### **Método: `validateAccountLimits`**
- **Propósito**: Valida se o usuário pode criar mais automações para uma conta
- **Verificações**:
  - Conta existe e pertence ao usuário
  - Conta está ativa
  - Limites do plano do usuário
  - Contagem atual de automações
- **Retorno**: `AccountLimitsValidation` com detalhes da validação

```typescript
const validation = await automationAccountService.validateAccountLimits(
  'user-id',
  'account-id',
  'margin_guard'
);

if (validation.isValid) {
  console.log('Account can create more automations');
} else {
  console.log(validation.message);
}
```

### **4. Busca de Automações por Conta**

#### **Método: `getAutomationsByAccount`**
- **Propósito**: Busca todas as automações de uma conta específica
- **Inclui**: Dados da conta e exchange associada
- **Ordenação**: Por data de criação (mais recentes primeiro)

```typescript
const automations = await automationAccountService.getAutomationsByAccount(
  'user-id',
  'account-id'
);
```

### **5. Estatísticas de Automações por Conta**

#### **Método: `getAccountAutomationStats`**
- **Propósito**: Fornece estatísticas detalhadas de automações por conta
- **Métricas**:
  - Total de automações
  - Automações ativas/inativas
  - Contagem por tipo (margin_guard, tp_sl, auto_entry)

```typescript
const stats = await automationAccountService.getAccountAutomationStats(
  'user-id',
  'account-id'
);
// stats: { total: 5, active: 3, inactive: 2, byType: { margin_guard: 2, tp_sl: 2, auto_entry: 1 } }
```

### **6. Migração para Nova Conta Ativa**

#### **Método: `migrateToNewActiveAccount`**
- **Propósito**: Migra todas as automações ativas para uma nova conta ativa
- **Uso**: Quando o usuário troca de conta ativa
- **Processo**:
  1. Busca todas as automações ativas do usuário
  2. Verifica se a nova conta existe e está ativa
  3. Migra cada automação para a nova conta
  4. Registra logs de migração

```typescript
const result = await automationAccountService.migrateToNewActiveAccount(
  'user-id',
  'new-account-id'
);
```

## 🎯 **Tipos de Automação Implementados**

### **1. Margin Guard**
- **Slug**: `margin_guard`
- **Descrição**: Proteção automática contra liquidação
- **Funcionalidade**: Monitora margem de posição e toma ações protetivas

### **2. Take Profit / Stop Loss**
- **Slug**: `tp_sl`
- **Descrição**: Fechamento automático de posições
- **Funcionalidade**: Fecha posições quando metas de lucro são atingidas ou stop loss é acionado

### **3. Automatic Entries**
- **Slug**: `auto_entry`
- **Descrição**: Entradas automáticas baseadas em indicadores
- **Funcionalidade**: Abre posições baseadas em condições técnicas e de mercado

## 🔗 **Integração com Sistema Multi-Account**

### **Fluxo de Vinculação Automática**
1. **Usuário cria automação** → `AutomationService.createAutomation`
2. **Detecção de conta ativa** → `UserExchangeAccountService.getUserExchangeAccounts`
3. **Validação de credenciais** → Verificação de credenciais não vazias
4. **Vinculação automática** → Campo `user_exchange_account_id` preenchido
5. **Log de vinculação** → `AutomationLoggerService.logStateChange`

### **Fluxo de Migração**
1. **Troca de conta ativa** → `UserExchangeAccountService.setActiveAccount`
2. **Migração automática** → `AutomationAccountService.migrateToNewActiveAccount`
3. **Atualização de automações** → Todas as automações ativas migradas
4. **Logs de migração** → Registro de cada migração

## 📊 **Endpoints da API**

### **Controller: `AutomationAccountController`**

#### **POST `/api/automation-account/link`**
- **Propósito**: Vincular automação à conta ativa
- **Body**: `{ automationId: string, accountId: string }`
- **Autenticação**: Requerida

#### **POST `/api/automation-account/migrate`**
- **Propósito**: Migrar automações existentes
- **Autenticação**: Requerida

#### **GET `/api/automation-account/:accountId/validate-limits`**
- **Propósito**: Validar limites da conta
- **Query**: `?automationType=margin_guard`
- **Autenticação**: Requerida

#### **GET `/api/automation-account/:accountId/automations`**
- **Propósito**: Buscar automações da conta
- **Autenticação**: Requerida

#### **GET `/api/automation-account/:accountId/stats`**
- **Propósito**: Estatísticas da conta
- **Autenticação**: Requerida

#### **POST `/api/automation-account/migrate-to-new`**
- **Propósito**: Migrar para nova conta ativa
- **Body**: `{ newAccountId: string }`
- **Autenticação**: Requerida

## 🗄️ **Modelo de Dados**

### **AutomationType**
```sql
CREATE TABLE "AutomationType" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Relação com Automation**
```sql
-- Campo adicionado ao modelo Automation
"user_exchange_account_id" TEXT NOT NULL REFERENCES "UserExchangeAccounts"("id")

-- Relação com AutomationType
"automation_type" AutomationType? @relation(fields: [type], references: [slug])
```

## 🔍 **Logs e Monitoramento**

### **Tipos de Logs**
- **Vinculação**: `account_linking` - Quando automação é vinculada à conta
- **Migração**: `migration` - Quando automações são migradas
- **Migração para Nova Conta**: `account_migration` - Quando migra para nova conta ativa

### **Exemplo de Log**
```json
{
  "userId": "user-id",
  "automationId": "automation-id",
  "automationType": "margin_guard",
  "changeType": "account_linking",
  "reason": "Automation linked to active account Main Account"
}
```

## 🚀 **Uso em Produção**

### **Inicialização do Serviço**
```typescript
import { AutomationAccountService } from './services/automation-account.service';
import { getPrisma } from './lib/prisma';

const prisma = await getPrisma();
const automationAccountService = new AutomationAccountService(prisma);
```

### **Exemplo de Uso Completo**
```typescript
// 1. Validar limites antes de criar automação
const validation = await automationAccountService.validateAccountLimits(
  userId, accountId, 'margin_guard'
);

if (!validation.isValid) {
  throw new Error(validation.message);
}

// 2. Criar automação (vinculação automática via AutomationService)
const automation = await automationService.createAutomation({
  userId,
  type: 'margin_guard',
  config: { margin_threshold: 20 }
});

// 3. Obter estatísticas da conta
const stats = await automationAccountService.getAccountAutomationStats(
  userId, accountId
);
```

## 🔒 **Segurança e Validações**

### **Validações Implementadas**
- ✅ **Propriedade da Conta**: Verifica se conta pertence ao usuário
- ✅ **Conta Ativa**: Confirma se conta está ativa
- ✅ **Credenciais Válidas**: Verifica se credenciais não estão vazias
- ✅ **Limites do Plano**: Respeita limites de automações por plano
- ✅ **Autenticação**: Todos os endpoints requerem autenticação

### **Tratamento de Erros**
- **404**: Conta não encontrada
- **400**: Conta inativa ou credenciais inválidas
- **500**: Erros internos do servidor

## 📈 **Métricas e Performance**

### **Métricas Disponíveis**
- **Total de Automações**: Por conta e por usuário
- **Automações Ativas/Inativas**: Status das automações
- **Distribuição por Tipo**: Contagem por tipo de automação
- **Taxa de Migração**: Sucesso/falha em migrações

### **Otimizações**
- **Índices de Banco**: Otimizados para consultas por conta
- **Cache de Credenciais**: Evita consultas repetidas
- **Logs Estruturados**: Facilita monitoramento e debugging

---

## 📝 **Changelog**

### **v2.6.5 - 2025-01-09**
- ✅ Implementado `AutomationAccountService` completo
- ✅ Criado modelo `AutomationType` no banco
- ✅ Implementados 3 tipos de automação (Margin Guard, TP/SL, Auto Entry)
- ✅ Seeder para popular tipos de automação
- ✅ Controller e rotas para automation-account
- ✅ Validação de limites por conta
- ✅ Migração de automações existentes
- ✅ Logs detalhados para debugging

---

**Status**: ✅ **COMPLETO** - FASE 6.1.4 implementada com sucesso
**Próximo**: FASE 6.2.1 - Atualizar automation-executor.ts
