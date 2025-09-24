# 🔧 EXEMPLOS DE IMPLEMENTAÇÃO - PAINEL ADMINISTRATIVO

## 📊 **EXEMPLOS PRÁTICOS DE INTEGRAÇÃO**

### **1. Backtest Reports - Implementação Completa**

#### **Backend Controller**
```typescript
// backend/src/controllers/admin/backtest-reports.controller.ts
export const getBacktestReports = async (req: FastifyRequest<{ Querystring: {
  search?: string;
  status?: string;
  strategy?: string;
  planType?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} }>, reply: FastifyReply) => {
  try {
    const { 
      search, 
      status, 
      strategy, 
      planType, 
      dateRange = '30d',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Calcular período
    const timeRangeMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = timeRangeMap[dateRange] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Construir filtros
    const whereClause: any = {
      created_at: { gte: startDate }
    };
    
    if (status) whereClause.status = status;
    if (strategy) whereClause.strategy_name = { contains: strategy, mode: 'insensitive' };
    if (planType) whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { strategy_name: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Buscar relatórios
    const [reports, totalCount] = await Promise.all([
      prisma.backtestReport.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, email: true, plan_type: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.backtestReport.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalReports = reports.length;
    const completedReports = reports.filter(r => r.status === 'completed').length;
    const runningReports = reports.filter(r => r.status === 'running').length;
    const failedReports = reports.filter(r => r.status === 'failed').length;
    
    const avgExecutionTime = reports
      .filter(r => r.execution_time)
      .reduce((sum, r) => sum + (r.execution_time || 0), 0) / 
      reports.filter(r => r.execution_time).length || 0;
    
    return {
      metrics: {
        totalReports,
        completedReports,
        runningReports,
        failedReports,
        avgExecutionTime
      },
      reports,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch backtest reports' });
  }
};
```

#### **Frontend Hook**
```typescript
// frontend/src/hooks/useBacktestReports.ts
export const useBacktestReports = (filters: BacktestReportsFilters) => {
  const [data, setData] = useState<BacktestReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  const fetchBacktestReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await api.get(`/admin/backtest-reports?${params}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch backtest reports');
    } finally {
      setLoading(false);
    }
  };

  // Implementar lógica de carregamento...
  
  return { data, loading, error, refetch: fetchBacktestReports };
};
```

### **2. Simulation Analytics - Implementação Completa**

#### **Backend Controller**
```typescript
// backend/src/controllers/admin/simulation-analytics.controller.ts
export const getSimulationAnalytics = async (req: FastifyRequest<{ Querystring: {
  search?: string;
  simulationType?: string;
  status?: string;
  planType?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} }>, reply: FastifyReply) => {
  try {
    const { 
      search, 
      simulationType, 
      status, 
      planType, 
      dateRange = '30d',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Calcular período
    const timeRangeMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = timeRangeMap[dateRange] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Construir filtros
    const whereClause: any = {
      created_at: { gte: startDate }
    };
    
    if (status) whereClause.status = status;
    if (simulationType) whereClause.simulation_type = simulationType;
    if (planType) whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Buscar simulações
    const [simulations, totalCount] = await Promise.all([
      prisma.simulation.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, email: true, plan_type: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.simulation.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalSimulations = simulations.length;
    const completedSimulations = simulations.filter(s => s.status === 'completed').length;
    const runningSimulations = simulations.filter(s => s.status === 'running').length;
    const failedSimulations = simulations.filter(s => s.status === 'failed').length;
    
    const avgProgress = simulations.length > 0 
      ? simulations.reduce((sum, s) => sum + s.progress, 0) / simulations.length 
      : 0;
    
    return {
      metrics: {
        totalSimulations,
        completedSimulations,
        runningSimulations,
        failedSimulations,
        avgProgress
      },
      simulations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch simulation analytics' });
  }
};
```

### **3. Automation Management - Implementação Completa**

#### **Backend Controller**
```typescript
// backend/src/controllers/admin/automation-management.controller.ts
export const getAutomationManagement = async (req: FastifyRequest<{ Querystring: {
  search?: string;
  type?: string;
  status?: string;
  riskLevel?: string;
  planType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} }>, reply: FastifyReply) => {
  try {
    const { 
      search, 
      type, 
      status, 
      riskLevel, 
      planType, 
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Construir filtros
    const whereClause: any = {};
    
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (riskLevel) whereClause.risk_level = riskLevel;
    if (planType) whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Buscar automações
    const [automations, totalCount] = await Promise.all([
      prisma.automation.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, email: true, plan_type: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.automation.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalAutomations = automations.length;
    const activeAutomations = automations.filter(a => a.status === 'active').length;
    const pausedAutomations = automations.filter(a => a.status === 'paused').length;
    const stoppedAutomations = automations.filter(a => a.status === 'stopped').length;
    const errorAutomations = automations.filter(a => a.status === 'error').length;
    
    return {
      metrics: {
        totalAutomations,
        activeAutomations,
        pausedAutomations,
        stoppedAutomations,
        errorAutomations
      },
      automations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch automation management' });
  }
};
```

### **4. Notification Management - Implementação Completa**

#### **Backend Controller**
```typescript
// backend/src/controllers/admin/notification-management.controller.ts
export const getNotificationManagement = async (req: FastifyRequest<{ Querystring: {
  search?: string;
  channel?: string;
  category?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} }>, reply: FastifyReply) => {
  try {
    const { 
      search, 
      channel, 
      category, 
      isActive, 
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Construir filtros
    const whereClause: any = {};
    
    if (channel) whereClause.channel = channel;
    if (category) whereClause.category = category;
    if (isActive !== undefined) whereClause.is_active = isActive === 'true';
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Buscar templates
    const [templates, totalCount] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notificationTemplate.count({ where: whereClause })
    ]);
    
    // Buscar logs de notificação para métricas
    const notificationLogs = await prisma.notificationLog.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
        }
      }
    });
    
    // Calcular métricas
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.is_active).length;
    const totalNotifications = notificationLogs.length;
    const sentNotifications = notificationLogs.filter(n => n.status === 'sent').length;
    const failedNotifications = notificationLogs.filter(n => n.status === 'failed').length;
    const successRate = totalNotifications > 0 ? (sentNotifications / totalNotifications) * 100 : 0;
    
    return {
      metrics: {
        totalTemplates,
        activeTemplates,
        totalNotifications,
        sentNotifications,
        failedNotifications,
        successRate
      },
      templates,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch notification management' });
  }
};
```

### **5. System Reports - Implementação Completa**

#### **Backend Controller**
```typescript
// backend/src/controllers/admin/system-reports.controller.ts
export const getSystemReports = async (req: FastifyRequest<{ Querystring: {
  search?: string;
  type?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} }>, reply: FastifyReply) => {
  try {
    const { 
      search, 
      type, 
      status, 
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Construir filtros
    const whereClause: any = {};
    
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Buscar relatórios
    const [reports, totalCount] = await Promise.all([
      prisma.systemReport.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.systemReport.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalReports = reports.length;
    const completedReports = reports.filter(r => r.status === 'completed').length;
    const generatingReports = reports.filter(r => r.status === 'generating').length;
    const failedReports = reports.filter(r => r.status === 'failed').length;
    const scheduledReports = reports.filter(r => r.status === 'scheduled').length;
    
    const totalFileSize = reports
      .filter(r => r.file_size)
      .reduce((sum, r) => sum + (r.file_size || 0), 0);
    
    return {
      metrics: {
        totalReports,
        completedReports,
        generatingReports,
        failedReports,
        scheduledReports,
        totalFileSize
      },
      reports,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch system reports' });
  }
};
```

### **6. Audit Logs - Implementação Completa**

#### **Backend Controller**
```typescript
// backend/src/controllers/admin/audit-logs.controller.ts
export const getAuditLogs = async (req: FastifyRequest<{ Querystring: {
  search?: string;
  action?: string;
  resource?: string;
  severity?: string;
  userId?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} }>, reply: FastifyReply) => {
  try {
    const { 
      search, 
      action, 
      resource, 
      severity, 
      userId, 
      dateRange = '30d',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Calcular período
    const timeRangeMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = timeRangeMap[dateRange] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Construir filtros
    const whereClause: any = {
      created_at: { gte: startDate }
    };
    
    if (action) whereClause.action = action;
    if (resource) whereClause.resource = resource;
    if (severity) whereClause.severity = severity;
    if (userId) whereClause.user_id = userId;
    if (search) {
      whereClause.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Buscar logs
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, email: true, plan_type: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalLogs = logs.length;
    const criticalLogs = logs.filter(l => l.severity === 'critical').length;
    const highLogs = logs.filter(l => l.severity === 'high').length;
    const mediumLogs = logs.filter(l => l.severity === 'medium').length;
    const lowLogs = logs.filter(l => l.severity === 'low').length;
    
    const uniqueUsers = new Set(logs.map(l => l.user_id).filter(Boolean)).size;
    
    return {
      metrics: {
        totalLogs,
        criticalLogs,
        highLogs,
        mediumLogs,
        lowLogs,
        uniqueUsers
      },
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch audit logs' });
  }
};
```

---

## 🔧 **COMPONENTES REUTILIZÁVEIS**

### **MetricCard Component**
```typescript
// frontend/src/components/ui/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  className?: string;
}

export const MetricCard = ({ title, value, icon: Icon, trend, subtitle, className }: MetricCardProps) => {
  return (
    <div className={cn(
      "profile-sidebar-glow rounded-xl p-6 bg-card/30 backdrop-blur-xl border border-border/50",
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          trend === 'up' && "bg-green-500/20 text-green-500",
          trend === 'down' && "bg-red-500/20 text-red-500",
          trend === 'neutral' && "bg-blue-500/20 text-blue-500"
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
```

### **FilterSection Component**
```typescript
// frontend/src/components/ui/FilterSection.tsx
interface FilterSectionProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  filterConfig: FilterConfig[];
}

export const FilterSection = ({ filters, onFiltersChange, filterConfig }: FilterSectionProps) => {
  return (
    <div className="profile-sidebar-glow rounded-xl p-6 bg-card/30 backdrop-blur-xl border border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filterConfig.map((config) => (
          <div key={config.key}>
            <Label htmlFor={config.key}>{config.label}</Label>
            {config.type === 'select' ? (
              <Select
                value={filters[config.key] || ''}
                onValueChange={(value) => onFiltersChange({ ...filters, [config.key]: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={config.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {config.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={config.key}
                type={config.type}
                placeholder={config.placeholder}
                value={filters[config.key] || ''}
                onChange={(e) => onFiltersChange({ ...filters, [config.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Backend APIs**
- [ ] Implementar 9 controllers administrativos
- [ ] Adicionar validação Zod para todos os endpoints
- [ ] Implementar middleware de autenticação admin
- [ ] Adicionar rate limiting específico para admin
- [ ] Implementar logs de auditoria para todas as operações
- [ ] Adicionar testes unitários para controllers
- [ ] Documentar APIs com Swagger/OpenAPI

### **Database Schema**
- [ ] Criar 8 novas tabelas no Prisma
- [ ] Executar migrações do banco
- [ ] Adicionar índices para performance
- [ ] Configurar relacionamentos entre tabelas
- [ ] Implementar soft delete onde necessário
- [ ] Adicionar constraints de integridade

### **Frontend Hooks**
- [ ] Criar 9 hooks customizados
- [ ] Implementar cache com React Query
- [ ] Adicionar retry automático para falhas
- [ ] Implementar invalidação de cache
- [ ] Adicionar loading states consistentes
- [ ] Implementar error boundaries

### **Componentes UI**
- [ ] Migrar todos os componentes para dados reais
- [ ] Remover todos os dados mockados
- [ ] Implementar paginação real
- [ ] Adicionar filtros funcionais
- [ ] Implementar ordenação de tabelas
- [ ] Adicionar exportação de dados

### **Testes e Validação**
- [ ] Testes unitários para hooks
- [ ] Testes de integração para APIs
- [ ] Testes E2E para fluxos críticos
- [ ] Validação de performance
- [ ] Testes de segurança
- [ ] Validação de acessibilidade

---

**Este guia fornece exemplos práticos e detalhados para implementar cada funcionalidade do painel administrativo com dados reais.**

