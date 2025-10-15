# Sistema de Limites por Plano

## Visão Geral

O Sistema de Limites por Plano permite que diferentes planos de assinatura tenham limites específicos para funcionalidades como número de contas de exchange, automações, indicadores, simulações e backtests. Isso garante que os usuários tenham acesso adequado às funcionalidades baseadas em seu plano.

## Arquitetura

### Estrutura de Dados

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

#### Relacionamentos
- **Plan → PlanLimits**: 1:1 (cada plano tem seus limites)
- **User → Plan**: N:1 (usuários têm um plano)
- **User → PlanLimits**: N:1 (através do plano)

### Estrutura de Dados
```typescript
interface PlanLimits {
  id: string;
  planId: string;
  maxExchangeAccounts: number;
  maxAutomations: number;
  maxIndicators: number;
  maxSimulations: number;
  maxBacktests: number;
  createdAt: string;  // ✅ Corrigido: string em vez de Date para serialização JSON
  updatedAt: string;  // ✅ Corrigido: string em vez de Date para serialização JSON
  plan: Plan;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceSats: number;
  isActive: boolean;
  planLimits: PlanLimits;
}
```

## Funcionalidades

### 1. Gerenciamento de Limites

#### Criação de Limites
```typescript
interface CreatePlanLimitsRequest {
  planId: string;
  maxExchangeAccounts: number;
  maxAutomations: number;
  maxIndicators: number;
  maxSimulations: number;
  maxBacktests: number;
}

async function createPlanLimits(data: CreatePlanLimitsRequest) {
  return await prisma.planLimits.create({
    data: {
      planId: data.planId,
      maxExchangeAccounts: data.maxExchangeAccounts,
      maxAutomations: data.maxAutomations,
      maxIndicators: data.maxIndicators,
      maxSimulations: data.maxSimulations,
      maxBacktests: data.maxBacktests
    }
  });
}
```

#### Atualização de Limites
```typescript
interface UpdatePlanLimitsRequest {
  id: string;
  maxExchangeAccounts?: number;
  maxAutomations?: number;
  maxIndicators?: number;
  maxSimulations?: number;
  maxBacktests?: number;
}

async function updatePlanLimits(data: UpdatePlanLimitsRequest) {
  return await prisma.planLimits.update({
    where: { id: data.id },
    data: {
      maxExchangeAccounts: data.maxExchangeAccounts,
      maxAutomations: data.maxAutomations,
      maxIndicators: data.maxIndicators,
      maxSimulations: data.maxSimulations,
      maxBacktests: data.maxBacktests
    }
  });
}
```

### 2. Validação de Limites

#### Serviço de Validação
```typescript
class PlanLimitsService {
  async validateLimit(
    userId: string, 
    limitType: LimitType, 
    currentCount: number
  ): Promise<boolean> {
    const user = await this.getUserWithPlan(userId);
    const limits = user.plan.planLimits;
    
    const maxLimit = this.getLimitByType(limits, limitType);
    
    if (currentCount >= maxLimit) {
      throw new LimitExceededError(
        `Limit exceeded for ${limitType}. Current: ${currentCount}, Max: ${maxLimit}`
      );
    }
    
    return true;
  }

  private getLimitByType(limits: PlanLimits, type: LimitType): number {
    switch (type) {
      case 'EXCHANGE_ACCOUNTS':
        return limits.maxExchangeAccounts;
      case 'AUTOMATIONS':
        return limits.maxAutomations;
      case 'INDICATORS':
        return limits.maxIndicators;
      case 'SIMULATIONS':
        return limits.maxSimulations;
      case 'BACKTESTS':
        return limits.maxBacktests;
      default:
        return 0;
    }
  }
}
```

#### Tipos de Limite
```typescript
type LimitType = 
  | 'EXCHANGE_ACCOUNTS'
  | 'AUTOMATIONS'
  | 'INDICATORS'
  | 'SIMULATIONS'
  | 'BACKTESTS';

interface LimitExceededError extends Error {
  limitType: LimitType;
  currentCount: number;
  maxLimit: number;
}
```

### 3. Verificação de Limites

#### Middleware de Validação
```typescript
async function validateExchangeAccountLimit(userId: string) {
  const currentCount = await prisma.userExchangeAccount.count({
    where: { userId }
  });

  await planLimitsService.validateLimit(
    userId, 
    'EXCHANGE_ACCOUNTS', 
    currentCount
  );
}

async function validateAutomationLimit(userId: string) {
  const currentCount = await prisma.automation.count({
    where: { userId }
  });

  await planLimitsService.validateLimit(
    userId, 
    'AUTOMATIONS', 
    currentCount
  );
}
```

#### Controllers Atualizados
```typescript
// UserExchangeAccountController
async createAccount(req: Request, res: Response) {
  try {
    const { userId } = req.user;
    
    // Validar limite de contas
    await validateExchangeAccountLimit(userId);
    
    // Criar conta
    const account = await userExchangeAccountService.create(req.body);
    
    res.json(account);
  } catch (error) {
    if (error instanceof LimitExceededError) {
      res.status(403).json({
        error: 'LIMIT_EXCEEDED',
        message: error.message,
        limitType: error.limitType,
        currentCount: error.currentCount,
        maxLimit: error.maxLimit
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

// AutomationController
async createAutomation(req: Request, res: Response) {
  try {
    const { userId } = req.user;
    
    // Validar limite de automações
    await validateAutomationLimit(userId);
    
    // Criar automação
    const automation = await automationService.create(req.body);
    
    res.json(automation);
  } catch (error) {
    if (error instanceof LimitExceededError) {
      res.status(403).json({
        error: 'LIMIT_EXCEEDED',
        message: error.message,
        limitType: error.limitType,
        currentCount: error.currentCount,
        maxLimit: error.maxLimit
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}
```

## Interface do Usuário

### 1. Exibição de Limites

#### Componente de Limites
```typescript
interface PlanLimitsDisplayProps {
  userId: string;
  planLimits: PlanLimits;
  currentUsage: {
    exchangeAccounts: number;
    automations: number;
    indicators: number;
    simulations: number;
    backtests: number;
  };
}

function PlanLimitsDisplay({ planLimits, currentUsage }: PlanLimitsDisplayProps) {
  const limits = [
    {
      name: 'Contas de Exchange',
      current: currentUsage.exchangeAccounts,
      max: planLimits.maxExchangeAccounts,
      type: 'EXCHANGE_ACCOUNTS'
    },
    {
      name: 'Automações',
      current: currentUsage.automations,
      max: planLimits.maxAutomations,
      type: 'AUTOMATIONS'
    },
    {
      name: 'Indicadores',
      current: currentUsage.indicators,
      max: planLimits.maxIndicators,
      type: 'INDICATORS'
    },
    {
      name: 'Simulações',
      current: currentUsage.simulations,
      max: planLimits.maxSimulations,
      type: 'SIMULATIONS'
    },
    {
      name: 'Backtests',
      current: currentUsage.backtests,
      max: planLimits.maxBacktests,
      type: 'BACKTESTS'
    }
  ];

  return (
    <div className="plan-limits">
      <h3>Limites do Plano</h3>
      {limits.map(limit => (
        <div key={limit.type} className="limit-item">
          <div className="limit-header">
            <span className="limit-name">{limit.name}</span>
            <span className="limit-count">
              {limit.current} / {limit.max}
            </span>
          </div>
          <div className="limit-bar">
            <div 
              className="limit-progress"
              style={{ 
                width: `${(limit.current / limit.max) * 100}%`,
                backgroundColor: limit.current >= limit.max ? '#ef4444' : '#10b981'
              }}
            />
          </div>
          {limit.current >= limit.max && (
            <div className="limit-warning">
              Limite atingido! Considere fazer upgrade do plano.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 2. Validação no Frontend

#### Hook de Validação
```typescript
function usePlanLimits(userId: string) {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [usage, setUsage] = useState<CurrentUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLimits() {
      try {
        const [limitsData, usageData] = await Promise.all([
          planLimitsService.getUserLimits(userId),
          planLimitsService.getCurrentUsage(userId)
        ]);
        
        setLimits(limitsData);
        setUsage(usageData);
      } catch (error) {
        console.error('Error loading plan limits:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLimits();
  }, [userId]);

  const canCreate = (type: LimitType) => {
    if (!limits || !usage) return false;
    
    const current = usage[type];
    const max = limits[`max${type}`];
    
    return current < max;
  };

  return {
    limits,
    usage,
    loading,
    canCreate
  };
}
```

#### Validação em Formulários
```typescript
function CreateAccountForm() {
  const { limits, usage, canCreate } = usePlanLimits(userId);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  const handleSubmit = async (data: CreateAccountData) => {
    if (!canCreate('EXCHANGE_ACCOUNTS')) {
      setShowLimitWarning(true);
      return;
    }

    try {
      await createAccount(data);
    } catch (error) {
      if (error.code === 'LIMIT_EXCEEDED') {
        setShowLimitWarning(true);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos do formulário */}
      
      {showLimitWarning && (
        <div className="limit-warning">
          <p>Você atingiu o limite de contas para seu plano atual.</p>
          <p>Limite atual: {usage?.exchangeAccounts} / {limits?.maxExchangeAccounts}</p>
          <button onClick={() => navigateToUpgrade()}>
            Fazer Upgrade
          </button>
        </div>
      )}
    </form>
  );
}
```

## Configuração de Planos

### 1. Planos Padrão

#### Seeder de Limites
```typescript
const defaultPlanLimits = [
  {
    planSlug: 'free',
    limits: {
      maxExchangeAccounts: 1,
      maxAutomations: 1,
      maxIndicators: 3,
      maxSimulations: 1,
      maxBacktests: 1
    }
  },
  {
    planSlug: 'pro',
    limits: {
      maxExchangeAccounts: 3,
      maxAutomations: 5,
      maxIndicators: 10,
      maxSimulations: 3,
      maxBacktests: 5
    }
  },
  {
    planSlug: 'enterprise',
    limits: {
      maxExchangeAccounts: 10,
      maxAutomations: 20,
      maxIndicators: 50,
      maxSimulations: 10,
      maxBacktests: 20
    }
  },
  {
    planSlug: 'lifetime',
    limits: {
      maxExchangeAccounts: -1, // Ilimitado
      maxAutomations: -1,
      maxIndicators: -1,
      maxSimulations: -1,
      maxBacktests: -1
    }
  }
];

async function seedPlanLimits() {
  for (const planLimit of defaultPlanLimits) {
    const plan = await prisma.plan.findUnique({
      where: { slug: planLimit.planSlug }
    });

    if (plan) {
      await prisma.planLimits.upsert({
        where: { planId: plan.id },
        update: planLimit.limits,
        create: {
          planId: plan.id,
          ...planLimit.limits
        }
      });
    }
  }
}
```

### 2. Interface Administrativa

#### Gerenciamento de Limites
```typescript
function PlanLimitsManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [limits, setLimits] = useState<PlanLimits[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  const handleUpdateLimits = async (planId: string, newLimits: Partial<PlanLimits>) => {
    try {
      await planLimitsService.updateLimits(planId, newLimits);
      await loadData();
    } catch (error) {
      console.error('Error updating limits:', error);
    }
  };

  return (
    <div className="plan-limits-management">
      <h2>Gerenciamento de Limites por Plano</h2>
      
      {plans.map(plan => (
        <div key={plan.id} className="plan-limits-card">
          <h3>{plan.name}</h3>
          <p>{plan.description}</p>
          
          {editingPlan === plan.id ? (
            <PlanLimitsEditor
              plan={plan}
              limits={limits.find(l => l.planId === plan.id)}
              onSave={(newLimits) => handleUpdateLimits(plan.id, newLimits)}
              onCancel={() => setEditingPlan(null)}
            />
          ) : (
            <div className="limits-display">
              <PlanLimitsDisplay
                limits={limits.find(l => l.planId === plan.id)}
                onEdit={() => setEditingPlan(plan.id)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Monitoramento

### 1. Métricas de Uso

#### Coleta de Dados
```typescript
interface UsageMetrics {
  planId: string;
  planName: string;
  totalUsers: number;
  averageUsage: {
    exchangeAccounts: number;
    automations: number;
    indicators: number;
    simulations: number;
    backtests: number;
  };
  limitUtilization: {
    exchangeAccounts: number;
    automations: number;
    indicators: number;
    simulations: number;
    backtests: number;
  };
}

async function getUsageMetrics(): Promise<UsageMetrics[]> {
  const plans = await prisma.plan.findMany({
    include: {
      planLimits: true,
      users: {
        include: {
          exchangeAccounts: true,
          automations: true
        }
      }
    }
  });

  return plans.map(plan => ({
    planId: plan.id,
    planName: plan.name,
    totalUsers: plan.users.length,
    averageUsage: calculateAverageUsage(plan.users),
    limitUtilization: calculateLimitUtilization(plan.users, plan.planLimits)
  }));
}
```

### 2. Alertas de Limite

#### Sistema de Alertas
```typescript
class LimitAlertService {
  async checkLimitAlerts() {
    const users = await this.getUsersNearLimit();
    
    for (const user of users) {
      await this.sendLimitAlert(user);
    }
  }

  private async getUsersNearLimit() {
    return await prisma.user.findMany({
      where: {
        plan: {
          planLimits: {
            some: {}
          }
        }
      },
      include: {
        plan: {
          include: { planLimits: true }
        },
        exchangeAccounts: true,
        automations: true
      }
    });
  }

  private async sendLimitAlert(user: User) {
    const usage = await this.calculateUsage(user);
    const limits = user.plan.planLimits;
    
    const alerts = [];
    
    if (usage.exchangeAccounts >= limits.maxExchangeAccounts * 0.9) {
      alerts.push('Contas de Exchange');
    }
    
    if (usage.automations >= limits.maxAutomations * 0.9) {
      alerts.push('Automações');
    }
    
    if (alerts.length > 0) {
      await this.sendNotification(user, alerts);
    }
  }
}
```

## Correções Implementadas (v2.5.1)

### Problema de Serialização JSON ✅
**Problema:** O backend estava retornando dados corretos nos logs, mas o frontend recebia `data: {}` vazio.

**Causa:** O schema de validação do Fastify estava filtrando propriedades não explicitamente definidas na resposta.

**Solução:** Adicionado `additionalProperties: true` no schema de resposta:
```typescript
response: {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: { 
        type: 'object',
        additionalProperties: true  // ✅ Permite todas as propriedades
      },
      message: { type: 'string' }
    }
  }
}
```

### Correção de Tipos TypeScript ✅
**Problema:** Incompatibilidade entre `Date` e `string` na interface `PlanLimits`.

**Solução:** Atualizada interface para usar `string` em vez de `Date`:
```typescript
interface PlanLimits {
  // ... outras propriedades
  createdAt: string;  // ✅ Corrigido
  updatedAt: string;  // ✅ Corrigido
}
```

### Badge de Conclusão ✅
Adicionado badge "done" em verde ao item "Plan Limits" no sidebar administrativo.

## Roadmap

### Fase 1 ✅
- [x] Estrutura de dados
- [x] Serviços de validação
- [x] Middleware de validação
- [x] Interface de gerenciamento
- [x] Correções de serialização
- [x] Correções de TypeScript

### Fase 2 🔄
- [ ] Validação no frontend
- [ ] Alertas de limite

### Fase 3 📋
- [ ] Monitoramento avançado
- [ ] Relatórios de uso
- [ ] Otimizações de performance
