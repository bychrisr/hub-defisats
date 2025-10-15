# Integração de Automações com Sistema Multi-Account

## Visão Geral

O sistema de automações foi atualizado para suportar múltiplas contas de exchange, permitindo que cada automação seja vinculada a uma conta específica. Isso garante que as operações sejam executadas com as credenciais corretas e permite maior organização e controle.

## Arquitetura

### Estrutura de Dados Atualizada

#### Tabela Automation
```sql
ALTER TABLE automations ADD COLUMN user_exchange_account_id TEXT REFERENCES user_exchange_accounts(id) ON DELETE SET NULL;
```

#### Relacionamentos
- **Automation → UserExchangeAccount**: N:1 (múltiplas automações podem usar a mesma conta)
- **UserExchangeAccount → Automation**: 1:N (uma conta pode ter múltiplas automações)
- **User → Automation**: 1:N (um usuário pode ter múltiplas automações)

### Estrutura de Dados
```typescript
interface Automation {
  id: string;
  userId: string;
  userExchangeAccountId?: string; // NOVO CAMPO
  type: string;
  config: Json;
  isActive: boolean;
  status: string;
  riskLevel?: string;
  planType?: PlanType;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  userExchangeAccount?: UserExchangeAccount; // NOVO RELACIONAMENTO
  tradeLogs: TradeLog[];
}
```

## Funcionalidades

### 1. Vinculação de Automações

#### Criação de Automação
```typescript
interface CreateAutomationRequest {
  type: string;
  config: Json;
  userExchangeAccountId?: string; // Conta específica (opcional)
  riskLevel?: string;
}

// Se userExchangeAccountId não for fornecido, usa conta ativa
async function createAutomation(data: CreateAutomationRequest) {
  const activeAccountId = await getActiveAccount();
  const accountId = data.userExchangeAccountId || activeAccountId;
  
  return await prisma.automation.create({
    data: {
      ...data,
      userExchangeAccountId: accountId,
      userId: currentUser.id
    }
  });
}
```

#### Atualização de Automação
```typescript
interface UpdateAutomationRequest {
  id: string;
  userExchangeAccountId?: string;
  config?: Json;
  isActive?: boolean;
}

async function updateAutomation(data: UpdateAutomationRequest) {
  return await prisma.automation.update({
    where: { id: data.id },
    data: {
      userExchangeAccountId: data.userExchangeAccountId,
      config: data.config,
      isActive: data.isActive
    }
  });
}
```

### 2. Filtros por Conta

#### Listagem de Automações
```typescript
// Todas as automações do usuário
async function getUserAutomations(userId: string) {
  return await prisma.automation.findMany({
    where: { userId },
    include: {
      userExchangeAccount: {
        include: { exchange: true }
      }
    }
  });
}

// Automações de uma conta específica
async function getAutomationsByAccount(accountId: string) {
  return await prisma.automation.findMany({
    where: { userExchangeAccountId: accountId },
    include: {
      userExchangeAccount: {
        include: { exchange: true }
      }
    }
  });
}

// Automações da conta ativa
async function getActiveAccountAutomations(userId: string) {
  const activeAccountId = await getActiveAccount();
  return await prisma.automation.findMany({
    where: { 
      userId,
      userExchangeAccountId: activeAccountId 
    }
  });
}
```

### 3. Execução de Automações

#### Worker Atualizado
```typescript
class AutomationExecutor {
  async executeAutomation(automation: Automation) {
    // Obter credenciais da conta vinculada
    const account = await this.getAccountCredentials(automation.userExchangeAccountId);
    
    if (!account) {
      throw new Error('Account not found or credentials invalid');
    }

    // Inicializar API com credenciais corretas
    const apiService = this.createAPIService(account.credentials);
    
    // Executar automação
    return await this.runAutomation(automation, apiService);
  }

  private async getAccountCredentials(accountId: string) {
    return await prisma.userExchangeAccount.findUnique({
      where: { id: accountId },
      include: { exchange: true }
    });
  }

  private createAPIService(credentials: Json) {
    // Criar serviço API com credenciais específicas
    return new ExchangeAPIService(credentials);
  }
}
```

## Interface do Usuário

### 1. Criação de Automação

#### Formulário Atualizado
```typescript
interface AutomationFormProps {
  onSave: (data: CreateAutomationRequest) => void;
  availableAccounts: UserExchangeAccount[];
  defaultAccountId?: string;
}

function AutomationForm({ onSave, availableAccounts, defaultAccountId }: AutomationFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Seleção de conta */}
      <div className="account-selection">
        <label>Conta de Exchange:</label>
        <select 
          value={selectedAccountId} 
          onChange={(e) => setSelectedAccountId(e.target.value)}
        >
          {availableAccounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.exchange.name} - {account.accountName}
            </option>
          ))}
        </select>
      </div>
      
      {/* Configuração da automação */}
      {/* ... outros campos ... */}
    </form>
  );
}
```

### 2. Listagem de Automações

#### Filtros por Conta
```typescript
interface AutomationListProps {
  automations: Automation[];
  activeAccountId?: string;
  onFilterByAccount: (accountId: string | null) => void;
}

function AutomationList({ automations, activeAccountId, onFilterByAccount }: AutomationListProps) {
  const [filteredAccountId, setFilteredAccountId] = useState<string | null>(activeAccountId);
  
  const filteredAutomations = useMemo(() => {
    if (!filteredAccountId) return automations;
    return automations.filter(a => a.userExchangeAccountId === filteredAccountId);
  }, [automations, filteredAccountId]);

  return (
    <div className="automation-list">
      {/* Filtro por conta */}
      <div className="account-filter">
        <button 
          className={!filteredAccountId ? 'active' : ''}
          onClick={() => onFilterByAccount(null)}
        >
          Todas as Contas
        </button>
        {availableAccounts.map(account => (
          <button
            key={account.id}
            className={filteredAccountId === account.id ? 'active' : ''}
            onClick={() => onFilterByAccount(account.id)}
          >
            {account.exchange.name} - {account.accountName}
          </button>
        ))}
      </div>
      
      {/* Lista de automações */}
      {filteredAutomations.map(automation => (
        <AutomationCard 
          key={automation.id} 
          automation={automation}
          showAccountInfo={!filteredAccountId}
        />
      ))}
    </div>
  );
}
```

### 3. Card de Automação

#### Informações da Conta
```typescript
interface AutomationCardProps {
  automation: Automation;
  showAccountInfo?: boolean;
}

function AutomationCard({ automation, showAccountInfo }: AutomationCardProps) {
  return (
    <div className="automation-card">
      <div className="automation-header">
        <h3>{automation.type}</h3>
        <span className={`status ${automation.status}`}>
          {automation.status}
        </span>
      </div>
      
      {/* Informações da conta (se solicitado) */}
      {showAccountInfo && automation.userExchangeAccount && (
        <div className="account-info">
          <span className="exchange">
            {automation.userExchangeAccount.exchange.name}
          </span>
          <span className="account-name">
            {automation.userExchangeAccount.accountName}
          </span>
        </div>
      )}
      
      {/* Configurações da automação */}
      <div className="automation-config">
        {/* ... configurações ... */}
      </div>
      
      {/* Ações */}
      <div className="automation-actions">
        <button onClick={() => editAutomation(automation.id)}>
          Editar
        </button>
        <button onClick={() => toggleAutomation(automation.id)}>
          {automation.isActive ? 'Desativar' : 'Ativar'}
        </button>
      </div>
    </div>
  );
}
```

## Migração de Dados

### Automações Existentes

#### Script de Migração
```typescript
async function migrateExistingAutomations() {
  // 1. Obter todas as automações sem userExchangeAccountId
  const automations = await prisma.automation.findMany({
    where: { userExchangeAccountId: null }
  });

  for (const automation of automations) {
    // 2. Encontrar ou criar conta padrão para o usuário
    const defaultAccount = await findOrCreateDefaultAccount(automation.userId);
    
    // 3. Atualizar automação com conta padrão
    await prisma.automation.update({
      where: { id: automation.id },
      data: { userExchangeAccountId: defaultAccount.id }
    });
  }
}

async function findOrCreateDefaultAccount(userId: string) {
  // Buscar conta padrão existente
  let defaultAccount = await prisma.userExchangeAccount.findFirst({
    where: { 
      userId,
      accountName: 'Account 01'
    }
  });

  // Se não existir, criar conta padrão
  if (!defaultAccount) {
    // Obter credenciais antigas do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.ln_markets_api_key) {
      // Criar conta com credenciais antigas
      defaultAccount = await prisma.userExchangeAccount.create({
        data: {
          userId,
          exchangeId: 'ln-markets', // ID da exchange LN Markets
          accountName: 'Account 01',
          credentials: {
            apiKey: user.ln_markets_api_key,
            apiSecret: user.ln_markets_api_secret,
            passphrase: user.ln_markets_passphrase
          },
          isActive: true,
          isVerified: true
        }
      });
    }
  }

  return defaultAccount;
}
```

## Validação e Segurança

### Validações

#### Conta Válida
```typescript
async function validateAutomationAccount(automationId: string, accountId: string) {
  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
    include: { user: true }
  });

  if (!automation) {
    throw new Error('Automation not found');
  }

  // Verificar se a conta pertence ao usuário
  const account = await prisma.userExchangeAccount.findFirst({
    where: {
      id: accountId,
      userId: automation.userId
    }
  });

  if (!account) {
    throw new Error('Account does not belong to user');
  }

  // Verificar se a conta está ativa e verificada
  if (!account.isActive || !account.isVerified) {
    throw new Error('Account is not active or verified');
  }

  return true;
}
```

#### Limites por Plano
```typescript
async function checkAutomationLimits(userId: string, accountId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: { include: { planLimits: true } } }
  });

  if (!user?.plan?.planLimits) {
    throw new Error('Plan limits not found');
  }

  const limits = user.plan.planLimits;
  const currentCount = await prisma.automation.count({
    where: { userId }
  });

  if (currentCount >= limits.maxAutomations) {
    throw new Error('Automation limit reached for current plan');
  }

  return true;
}
```

## Monitoramento

### Métricas

#### Por Conta
- Número de automações por conta
- Taxa de sucesso por conta
- Volume de operações por conta
- Erros por conta

#### Por Usuário
- Total de automações
- Distribuição por conta
- Performance geral
- Uso de limites

### Logs

#### Criação de Automação
```typescript
await auditLog.create({
  userId,
  action: 'AUTOMATION_CREATED',
  resource: 'Automation',
  resourceId: automation.id,
  details: {
    type: automation.type,
    accountId: automation.userExchangeAccountId,
    config: automation.config
  }
});
```

#### Execução de Automação
```typescript
await auditLog.create({
  userId,
  action: 'AUTOMATION_EXECUTED',
  resource: 'Automation',
  resourceId: automation.id,
  details: {
    accountId: automation.userExchangeAccountId,
    result: executionResult,
    duration: executionTime
  }
});
```

## Roadmap

### Fase 1 ✅
- [x] Estrutura de dados atualizada
- [x] Relacionamentos configurados
- [x] Migração de dados existentes

### Fase 2 🔄
- [ ] Interface de gerenciamento
- [ ] Filtros por conta
- [ ] Validações completas

### Fase 3 📋
- [ ] Monitoramento avançado
- [ ] Relatórios por conta
- [ ] Otimizações de performance
