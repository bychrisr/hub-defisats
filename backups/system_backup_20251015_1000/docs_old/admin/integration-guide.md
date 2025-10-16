# 🚀 GUIA COMPLETO DE INTEGRAÇÃO - PAINEL ADMINISTRATIVO

## 📋 **VISÃO GERAL**

Este guia fornece instruções detalhadas para integrar 100% o painel administrativo ao sistema real, removendo todos os dados mockados e conectando com APIs backend reais.

---

## 🏗️ **ARQUITETURA DE INTEGRAÇÃO**

### **Estrutura de APIs Necessárias**
```
Backend APIs Required:
├── /api/admin/dashboard          # Métricas gerais
├── /api/admin/trading-analytics  # Analytics de trading
├── /api/admin/trade-logs         # Logs de trades
├── /api/admin/payment-analytics  # Analytics de pagamentos
├── /api/admin/backtest-reports   # Relatórios de backtest
├── /api/admin/simulation-analytics # Analytics de simulações
├── /api/admin/automation-management # Gestão de automações
├── /api/admin/notification-management # Gestão de notificações
├── /api/admin/system-reports     # Relatórios do sistema
└── /api/admin/audit-logs         # Logs de auditoria
```

---

## 🔧 **FASE 1: IMPLEMENTAÇÃO DAS APIs BACKEND**

### **1.1 Dashboard API**
**Endpoint**: `GET /api/admin/dashboard`

```typescript
// backend/src/controllers/admin/dashboard.controller.ts
export const getDashboardMetrics = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    // Buscar métricas do banco de dados
    const [
      totalUsers,
      activeUsers,
      monthlyRevenue,
      totalTrades,
      systemUptime
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { last_activity_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.payment.aggregate({ where: { status: 'completed', created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, _sum: { amount: true } }),
      prisma.trade.count(),
      getSystemUptime()
    ]);

    return {
      totalUsers,
      activeUsers,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      totalTrades,
      systemUptime,
      uptimePercentage: (systemUptime / (30 * 24 * 60 * 60)) * 100
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch dashboard metrics' });
  }
};
```

### **1.2 Trading Analytics API**
**Endpoint**: `GET /api/admin/trading-analytics`

```typescript
// backend/src/controllers/admin/trading-analytics.controller.ts
export const getTradingAnalytics = async (req: FastifyRequest<{ Querystring: { 
  timeRange?: string;
  planType?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} }>, reply: FastifyReply) => {
  try {
    const { timeRange = '30d', planType, userId, sortBy = 'totalTrades', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
    
    // Calcular período
    const timeRangeMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = timeRangeMap[timeRange] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Construir filtros
    const whereClause: any = {
      created_at: { gte: startDate }
    };
    
    if (planType) whereClause.user = { plan_type: planType };
    if (userId) whereClause.user_id = userId;
    
    // Buscar dados de trading
    const [trades, users] = await Promise.all([
      prisma.trade.findMany({
        where: whereClause,
        include: { user: { select: { id: true, email: true, plan_type: true } } },
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.findMany({
        where: planType ? { plan_type: planType } : {},
        select: { id: true, email: true, plan_type: true, created_at: true }
      })
    ]);
    
    // Calcular métricas por usuário
    const userMetrics = users.map(user => {
      const userTrades = trades.filter(trade => trade.user_id === user.id);
      const totalTrades = userTrades.length;
      const winningTrades = userTrades.filter(trade => trade.pnl > 0).length;
      const totalPnL = userTrades.reduce((sum, trade) => sum + trade.pnl, 0);
      const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      return {
        userId: user.id,
        email: user.email,
        planType: user.plan_type,
        totalTrades,
        winningTrades,
        losingTrades: totalTrades - winningTrades,
        totalPnL,
        avgPnL,
        winRate,
        lastTrade: userTrades[0]?.created_at || null
      };
    });
    
    // Ordenar resultados
    userMetrics.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = userMetrics.slice(startIndex, endIndex);
    
    // Calcular métricas gerais
    const totalTrades = trades.length;
    const totalWinningTrades = trades.filter(trade => trade.pnl > 0).length;
    const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const avgWinRate = totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0;
    
    return {
      metrics: {
        totalTrades,
        totalWinningTrades,
        totalLosingTrades: totalTrades - totalWinningTrades,
        totalPnL,
        avgWinRate,
        avgPnL: totalTrades > 0 ? totalPnL / totalTrades : 0
      },
      users: paginatedResults,
      pagination: {
        page,
        limit,
        total: userMetrics.length,
        totalPages: Math.ceil(userMetrics.length / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch trading analytics' });
  }
};
```

### **1.3 Trade Logs API**
**Endpoint**: `GET /api/admin/trade-logs`

```typescript
// backend/src/controllers/admin/trade-logs.controller.ts
export const getTradeLogs = async (req: FastifyRequest<{ Querystring: {
  search?: string;
  status?: string;
  action?: string;
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
      action, 
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
    if (action) whereClause.action = action;
    if (planType) whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { trade_id: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Buscar logs
    const [logs, totalCount] = await Promise.all([
      prisma.tradeLog.findMany({
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
      prisma.tradeLog.count({ where: whereClause })
    ]);
    
    return {
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch trade logs' });
  }
};
```

---

## 🗄️ **FASE 2: ESTRUTURA DO BANCO DE DADOS**

### **2.1 Schema Prisma Atualizado**

```prisma
// backend/prisma/schema.prisma

model TradeLog {
  id          String   @id @default(cuid())
  user_id     String
  trade_id    String?
  action      String   // 'buy', 'sell', 'modify', 'cancel'
  status      String   // 'success', 'failed', 'pending', 'cancelled'
  message     String?
  metadata    Json?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  user        User     @relation(fields: [user_id], references: [id])
  
  @@map("trade_logs")
}

model BacktestReport {
  id            String   @id @default(cuid())
  user_id       String
  strategy_name String
  status        String   // 'running', 'completed', 'failed', 'paused'
  start_date    DateTime
  end_date      DateTime?
  total_trades  Int      @default(0)
  winning_trades Int     @default(0)
  total_pnl     Float    @default(0)
  sharpe_ratio  Float?
  max_drawdown  Float?
  profit_factor Float?
  execution_time Int?    // em segundos
  parameters    Json?
  results       Json?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  user          User     @relation(fields: [user_id], references: [id])
  
  @@map("backtest_reports")
}

model Simulation {
  id            String   @id @default(cuid())
  user_id       String
  simulation_type String // 'monte_carlo', 'stress_test', 'scenario', 'optimization'
  status        String   // 'running', 'completed', 'failed', 'paused'
  parameters    Json
  results       Json?
  progress      Int      @default(0) // 0-100
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  user          User     @relation(fields: [user_id], references: [id])
  
  @@map("simulations")
}

model Automation {
  id            String   @id @default(cuid())
  user_id       String
  name          String
  type          String   // 'dca', 'grid', 'martingale', 'scalping', 'arbitrage', 'custom'
  status        String   // 'active', 'paused', 'stopped', 'error'
  parameters    Json
  performance   Json?
  risk_level    String   // 'low', 'medium', 'high'
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  user          User     @relation(fields: [user_id], references: [id])
  
  @@map("automations")
}

model NotificationTemplate {
  id          String   @id @default(cuid())
  name        String
  channel     String   // 'email', 'telegram', 'whatsapp', 'push', 'webhook'
  category    String   // 'trading', 'payment', 'system', 'automation', 'security'
  subject     String?
  content     String
  variables   Json?
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  @@map("notification_templates")
}

model NotificationLog {
  id          String   @id @default(cuid())
  user_id     String?
  template_id String
  channel     String
  status      String   // 'sent', 'failed', 'pending'
  recipient   String
  subject     String?
  content     String
  sent_at     DateTime?
  error_message String?
  created_at  DateTime @default(now())
  
  template    NotificationTemplate @relation(fields: [template_id], references: [id])
  user        User?                @relation(fields: [user_id], references: [id])
  
  @@map("notification_logs")
}

model SystemReport {
  id          String   @id @default(cuid())
  name        String
  type        String   // 'performance', 'usage', 'security', 'financial', 'user_activity', 'error_analysis'
  status      String   // 'generating', 'completed', 'failed', 'scheduled'
  parameters  Json?
  file_path   String?
  file_size   Int?
  generated_at DateTime?
  created_at  DateTime @default(now())
  
  @@map("system_reports")
}

model AuditLog {
  id          String   @id @default(cuid())
  user_id     String?
  action      String
  resource    String
  resource_id String?
  old_values  Json?
  new_values  Json?
  ip_address  String?
  user_agent  String?
  session_id  String?
  request_id  String?
  severity    String   // 'low', 'medium', 'high', 'critical'
  created_at  DateTime @default(now())
  
  user        User?    @relation(fields: [user_id], references: [id])
  
  @@map("audit_logs")
}

// Adicionar relações ao modelo User existente
model User {
  // ... campos existentes ...
  
  trade_logs        TradeLog[]
  backtest_reports  BacktestReport[]
  simulations       Simulation[]
  automations       Automation[]
  notification_logs NotificationLog[]
  audit_logs        AuditLog[]
}
```

---

## 🔄 **FASE 3: ATUALIZAÇÃO DOS COMPONENTES FRONTEND**

### **3.1 Hook para Trading Analytics**

```typescript
// frontend/src/hooks/useTradingAnalytics.ts
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface TradingAnalyticsFilters {
  search: string;
  planType: string;
  timeRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface TradingAnalyticsData {
  metrics: {
    totalTrades: number;
    totalWinningTrades: number;
    totalLosingTrades: number;
    totalPnL: number;
    avgWinRate: number;
    avgPnL: number;
  };
  users: Array<{
    userId: string;
    email: string;
    planType: string;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalPnL: number;
    avgPnL: number;
    winRate: number;
    lastTrade: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useTradingAnalytics = (filters: TradingAnalyticsFilters) => {
  const [data, setData] = useState<TradingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  const fetchTradingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await api.get(`/admin/trading-analytics?${params}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trading analytics');
    } finally {
      setLoading(false);
    }
  };

  // Carregamento inicial
  useEffect(() => {
    fetchTradingData();
    isInitialLoad.current = false;
  }, []);

  // Recarregamento com filtros
  useEffect(() => {
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.planType !== filters.planType ||
        lastFilters.current.timeRange !== filters.timeRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder ||
        lastFilters.current.page !== filters.page;
      
      if (filtersChanged) {
        lastFilters.current = { ...filters };
        fetchTradingData();
      }
    }
  }, [filters.search, filters.planType, filters.timeRange, filters.sortBy, filters.sortOrder, filters.page]);

  return { data, loading, error, refetch: fetchTradingData };
};
```

### **3.2 Hook para Trade Logs**

```typescript
// frontend/src/hooks/useTradeLogs.ts
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface TradeLogsFilters {
  search: string;
  status: string;
  action: string;
  planType: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface TradeLog {
  id: string;
  user_id: string;
  trade_id: string | null;
  action: string;
  status: string;
  message: string | null;
  metadata: any;
  created_at: string;
  user: {
    id: string;
    email: string;
    plan_type: string;
  };
}

interface TradeLogsData {
  logs: TradeLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useTradeLogs = (filters: TradeLogsFilters) => {
  const [data, setData] = useState<TradeLogsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  const fetchTradeLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await api.get(`/admin/trade-logs?${params}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trade logs');
    } finally {
      setLoading(false);
    }
  };

  // Carregamento inicial
  useEffect(() => {
    fetchTradeLogs();
    isInitialLoad.current = false;
  }, []);

  // Recarregamento com filtros
  useEffect(() => {
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.status !== filters.status ||
        lastFilters.current.action !== filters.action ||
        lastFilters.current.planType !== filters.planType ||
        lastFilters.current.dateRange !== filters.dateRange ||
        lastFilters.current.sortBy !== filters.sortBy ||
        lastFilters.current.sortOrder !== filters.sortOrder ||
        lastFilters.current.page !== filters.page;
      
      if (filtersChanged) {
        lastFilters.current = { ...filters };
        fetchTradeLogs();
      }
    }
  }, [filters.search, filters.status, filters.action, filters.planType, filters.dateRange, filters.sortBy, filters.sortOrder, filters.page]);

  return { data, loading, error, refetch: fetchTradeLogs };
};
```

---

## 📊 **FASE 4: IMPLEMENTAÇÃO DAS DEMAIS APIs**

### **4.1 Payment Analytics API**

```typescript
// backend/src/controllers/admin/payment-analytics.controller.ts
export const getPaymentAnalytics = async (req: FastifyRequest<{ Querystring: {
  search?: string;
  status?: string;
  paymentMethod?: string;
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
      paymentMethod, 
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
    if (paymentMethod) whereClause.payment_method = paymentMethod;
    if (planType) whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { payment_id: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Buscar pagamentos
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
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
      prisma.payment.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const conversionRate = payments.length > 0 
      ? (payments.filter(p => p.status === 'completed').length / payments.length) * 100 
      : 0;
    
    const avgTransactionValue = payments.length > 0 
      ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length 
      : 0;
    
    return {
      metrics: {
        totalPayments: payments.length,
        completedPayments: payments.filter(p => p.status === 'completed').length,
        failedPayments: payments.filter(p => p.status === 'failed').length,
        totalRevenue,
        conversionRate,
        avgTransactionValue
      },
      payments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch payment analytics' });
  }
};
```

---

## 🔧 **FASE 5: CONFIGURAÇÃO DE ROTAS**

### **5.1 Rotas Admin**

```typescript
// backend/src/routes/admin.routes.ts
import { FastifyInstance } from 'fastify';
import { 
  getDashboardMetrics,
  getTradingAnalytics,
  getTradeLogs,
  getPaymentAnalytics,
  getBacktestReports,
  getSimulationAnalytics,
  getAutomationManagement,
  getNotificationManagement,
  getSystemReports,
  getAuditLogs
} from '../controllers/admin';

export async function adminRoutes(fastify: FastifyInstance) {
  // Middleware de autenticação admin
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.status(401).send({ error: 'Token required' });
      }
      
      const decoded = fastify.jwt.verify(token) as any;
      const user = await fastify.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, is_admin: true }
      });
      
      if (!user || !user.is_admin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }
      
      request.user = user;
    } catch (error) {
      return reply.status(401).send({ error: 'Invalid token' });
    }
  });

  // Dashboard
  fastify.get('/dashboard', getDashboardMetrics);
  
  // Analytics
  fastify.get('/trading-analytics', getTradingAnalytics);
  fastify.get('/payment-analytics', getPaymentAnalytics);
  
  // Logs
  fastify.get('/trade-logs', getTradeLogs);
  fastify.get('/audit-logs', getAuditLogs);
  
  // Reports
  fastify.get('/backtest-reports', getBacktestReports);
  fastify.get('/simulation-analytics', getSimulationAnalytics);
  fastify.get('/system-reports', getSystemReports);
  
  // Management
  fastify.get('/automation-management', getAutomationManagement);
  fastify.get('/notification-management', getNotificationManagement);
}
```

---

## 🚀 **FASE 6: MIGRAÇÃO DOS DADOS MOCKADOS**

### **6.1 Atualizar TradingAnalytics.tsx**

```typescript
// frontend/src/pages/admin/TradingAnalytics.tsx
import { useTradingAnalytics } from '@/hooks/useTradingAnalytics';

const TradingAnalytics = () => {
  const [filters, setFilters] = useState({
    search: '',
    planType: '',
    timeRange: '30d',
    sortBy: 'totalTrades',
    sortOrder: 'desc' as 'asc' | 'desc',
    page: 1,
    limit: 10
  });

  const { data, loading, error, refetch } = useTradingAnalytics(filters);

  // Remover todos os dados mockados e usar apenas os dados reais
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="profile-sidebar-glow rounded-xl p-6 bg-card/30 backdrop-blur-xl border border-border/50">
        <h1 className="text-2xl font-bold text-foreground">Trading Analytics</h1>
        <p className="text-muted-foreground">Análise detalhada de performance de trading</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Trades"
          value={data.metrics.totalTrades}
          icon={BarChart3}
          trend="up"
        />
        <MetricCard
          title="Taxa de Sucesso"
          value={`${data.metrics.avgWinRate.toFixed(1)}%`}
          icon={Target}
          trend="up"
        />
        <MetricCard
          title="P&L Total"
          value={`$${data.metrics.totalPnL.toFixed(2)}`}
          icon={TrendingUp}
          trend={data.metrics.totalPnL >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="P&L Médio"
          value={`$${data.metrics.avgPnL.toFixed(2)}`}
          icon={Activity}
          trend={data.metrics.avgPnL >= 0 ? "up" : "down"}
        />
      </div>

      {/* Filtros */}
      <FilterSection filters={filters} onFiltersChange={setFilters} />

      {/* Tabela de Usuários */}
      <DataTable
        data={data.users}
        columns={userColumns}
        pagination={data.pagination}
        onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
      />
    </div>
  );
};
```

---

## 📋 **CHECKLIST DE INTEGRAÇÃO**

### **Backend (APIs)**
- [ ] Implementar todas as 9 APIs administrativas
- [ ] Adicionar modelos Prisma para novas tabelas
- [ ] Executar migrações do banco de dados
- [ ] Implementar middleware de autenticação admin
- [ ] Adicionar validação de dados com Zod
- [ ] Implementar rate limiting para APIs admin
- [ ] Adicionar logs de auditoria para todas as operações

### **Frontend (Hooks e Componentes)**
- [ ] Criar hooks customizados para cada funcionalidade
- [ ] Remover todos os dados mockados
- [ ] Implementar tratamento de erros robusto
- [ ] Adicionar loading states consistentes
- [ ] Implementar paginação real
- [ ] Adicionar refresh automático onde necessário
- [ ] Implementar cache de dados com React Query

### **Banco de Dados**
- [ ] Criar tabelas: trade_logs, backtest_reports, simulations, automations, notification_templates, notification_logs, system_reports, audit_logs
- [ ] Adicionar índices para performance
- [ ] Configurar backups automáticos
- [ ] Implementar retenção de dados configurável

### **Segurança**
- [ ] Implementar controle de acesso baseado em roles
- [ ] Adicionar logs de auditoria para todas as ações
- [ ] Implementar rate limiting por usuário
- [ ] Adicionar validação de entrada rigorosa
- [ ] Configurar CORS adequadamente

### **Performance**
- [ ] Implementar cache Redis para consultas frequentes
- [ ] Otimizar queries do banco de dados
- [ ] Implementar lazy loading para componentes pesados
- [ ] Adicionar compressão de dados
- [ ] Configurar CDN para assets estáticos

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Implementar APIs Backend** (Prioridade 1)
2. **Atualizar Schema do Banco** (Prioridade 1)
3. **Criar Hooks Frontend** (Prioridade 2)
4. **Migrar Componentes** (Prioridade 2)
5. **Testes e Validação** (Prioridade 3)
6. **Deploy e Monitoramento** (Prioridade 3)

---

**Este guia fornece uma base sólida para integrar 100% o painel administrativo ao sistema real, removendo todos os dados mockados e conectando com APIs backend funcionais.**

