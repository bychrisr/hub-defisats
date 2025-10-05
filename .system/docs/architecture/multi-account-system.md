# Sistema Multi-Account

## Visão Geral

O Sistema Multi-Account permite que usuários gerenciem múltiplas contas de exchange, cada uma com suas próprias credenciais e configurações. Este sistema é fundamental para traders que operam com diferentes estratégias ou contas.

## Arquitetura

### Estrutura de Dados

#### Tabela `UserExchangeAccounts`
```sql
CREATE TABLE user_exchange_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange_id TEXT NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL DEFAULT 'Account 01',
  credentials JSON NOT NULL, -- Credenciais criptografadas
  is_active BOOLEAN DEFAULT false, -- Apenas uma conta ativa por usuário
  is_verified BOOLEAN DEFAULT false,
  last_test TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabela `PlanLimits`
```sql
CREATE TABLE plan_limits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  max_exchange_accounts INTEGER DEFAULT 1,
  max_automations INTEGER DEFAULT 5,
  max_indicators INTEGER DEFAULT 10,
  max_simulations INTEGER DEFAULT 3,
  max_backtests INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Atualização da Tabela `Automation`
```sql
ALTER TABLE automations ADD COLUMN user_exchange_account_id TEXT REFERENCES user_exchange_accounts(id) ON DELETE SET NULL;
```

### Relacionamentos

- **User → UserExchangeAccounts**: 1:N (um usuário pode ter múltiplas contas)
- **Exchange → UserExchangeAccounts**: 1:N (uma exchange pode ter múltiplas contas de usuários)
- **UserExchangeAccounts → Automation**: 1:N (uma conta pode ter múltiplas automações)
- **Plan → PlanLimits**: 1:1 (cada plano tem seus limites)

## Funcionalidades

### 1. Gerenciamento de Contas

#### Criação de Conta
```typescript
interface CreateAccountRequest {
  exchangeId: string;
  accountName: string;
  credentials: {
    apiKey: string;
    apiSecret: string;
    passphrase?: string;
  };
}
```

#### Listagem de Contas
```typescript
interface UserAccount {
  id: string;
  exchangeName: string;
  accountName: string;
  isActive: boolean;
  isVerified: boolean;
  lastTest?: Date;
  createdAt: Date;
}
```

### 2. Conta Ativa

#### Sistema de Persistência
- **LocalStorage**: Armazena ID da conta ativa
- **Sincronização**: Entre abas do navegador
- **Migração**: Automática de dados antigos

#### Gerenciamento
```typescript
// Definir conta ativa
setActiveAccount(accountId: string | null): boolean

// Obter conta ativa
getActiveAccount(): string | null

// Limpar conta ativa
clearActiveAccount(): boolean
```

### 3. Limites por Plano

#### Estrutura de Limites
```typescript
interface PlanLimits {
  maxExchangeAccounts: number;
  maxAutomations: number;
  maxIndicators: number;
  maxSimulations: number;
  maxBacktests: number;
}
```

#### Validação
- Verificação automática ao criar nova conta
- Bloqueio quando limite é atingido
- Mensagens informativas para o usuário

## Implementação

### Backend

#### Serviços
- **UserExchangeAccountService**: CRUD de contas
- **PlanLimitsService**: Gerenciamento de limites
- **AutomationService**: Atualizado para usar conta ativa

#### Controllers
- **UserExchangeAccountController**: Endpoints para contas
- **PlanLimitsController**: Endpoints para limites
- **AutomationController**: Atualizado para filtrar por conta

### Frontend

#### Hooks
- **useActiveAccount**: Gerenciamento de conta ativa
- **useExchangeAccounts**: Listagem e CRUD de contas
- **usePlanLimits**: Verificação de limites

#### Componentes
- **AccountCard**: Exibição de conta individual
- **AccountSelector**: Seletor de conta ativa
- **AccountForm**: Formulário de criação/edição

## Segurança

### Criptografia
- Credenciais armazenadas com AES-256
- Chaves de criptografia por usuário
- Rotação automática de chaves

### Validação
- Teste automático de credenciais
- Verificação de limites por plano
- Auditoria de mudanças de conta

## Migração

### Dados Existentes
- Credenciais antigas → "Account 01"
- Automações existentes → Conta padrão
- Configurações preservadas

### Script de Migração
```typescript
async function migrateExistingData() {
  // 1. Criar conta padrão para usuários existentes
  // 2. Migrar credenciais antigas
  // 3. Atualizar automações existentes
  // 4. Configurar limites por plano
}
```

## Monitoramento

### Métricas
- Número de contas por usuário
- Uso de limites por plano
- Performance de troca de conta
- Erros de validação

### Logs
- Criação/edição de contas
- Troca de conta ativa
- Violações de limite
- Falhas de validação

## Roadmap

### Fase 1 ✅
- [x] Estrutura de dados
- [x] Sistema de persistência
- [x] Hooks básicos

### Fase 2 🔄
- [ ] Interface de gerenciamento
- [ ] Admin panel
- [ ] Testes completos

### Fase 3 📋
- [ ] Dashboard unificado
- [ ] Relatórios por conta
- [ ] Otimizações de performance
