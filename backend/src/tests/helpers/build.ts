import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';

export function build(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify(opts);

  // Mock do middleware de autenticação para testes
  app.decorate('jwtVerify', async function () {
    // Mock user for testing
    (this as any).user = { id: 'test-user-id' };
  });

  // Mock do middleware administrativo
  app.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/api/admin')) {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Authentication required' });
        return;
      }

      const token = authHeader.split(' ')[1];
      if (token !== 'mock-admin-token') {
        reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token' });
        return;
      }

      // Mock admin user
      (request as any).adminUser = { id: 'test-admin-id', user_id: 'test-user-id' };
    }
  });

  // Mock das rotas administrativas com respostas simuladas
  app.get('/api/admin/dashboard/metrics', async () => {
    return {
      totalUsers: 100,
      activeUsers: 75,
      monthlyRevenue: 5000,
      totalTrades: 1000,
      systemUptime: 2592000,
      uptimePercentage: 100,
    };
  });

  app.get('/api/admin/trading/analytics', async (request) => {
    const { search, page = '1', limit = '10', sortBy = 'totalTrades', sortOrder = 'desc' } = request.query as any;
    
    return {
      users: [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          planType: 'premium',
          totalTrades: 100,
          winningTrades: 60,
          losingTrades: 40,
          totalPnL: 1500,
          winRate: 60,
          avgPnL: 15,
          createdAt: new Date(),
        },
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        totalPages: 1,
      },
      metrics: {
        totalUsers: 1,
        totalTrades: 100,
        totalWinningTrades: 60,
        totalLosingTrades: 40,
        totalPnL: 1500,
        overallWinRate: 60,
        avgPnLPerTrade: 15,
      },
    };
  });

  app.get('/api/admin/trades/logs', async (request) => {
    const { page = '1', limit = '10' } = request.query as any;
    
    return {
      tradeLogs: [
        {
          id: '1',
          user_id: 'user1',
          action: 'buy',
          symbol: 'BTCUSD',
          amount: 1000,
          price: 50000,
          status: 'completed',
          pnl: 100,
          created_at: new Date(),
          user: {
            id: 'user1',
            username: 'user1',
            email: 'user1@example.com',
            plan_type: 'premium',
          },
        },
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        totalPages: 1,
      },
    };
  });

  app.get('/api/admin/payments/analytics', async (request) => {
    const { page = '1', limit = '10' } = request.query as any;
    
    return {
      payments: [
        {
          id: '1',
          user_id: 'user1',
          amount: 100,
          status: 'completed',
          payment_method: 'lightning',
          created_at: new Date(),
          user: {
            id: 'user1',
            username: 'user1',
            email: 'user1@example.com',
          },
        },
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        totalPages: 1,
      },
      metrics: {
        totalRevenue: 100,
        totalPayments: 1,
        completedPayments: 1,
        pendingPayments: 0,
        failedPayments: 0,
        conversionRate: 100,
        avgTransactionValue: 100,
      },
    };
  });

  app.get('/api/admin/backtests/reports', async (request) => {
    const { page = '1', limit = '10' } = request.query as any;
    
    return {
      backtestReports: [
        {
          id: '1',
          user_id: 'user1',
          strategy: 'momentum',
          status: 'completed',
          start_date: new Date(),
          end_date: new Date(),
          total_trades: 100,
          winning_trades: 60,
          total_pnl: 1500,
          created_at: new Date(),
        },
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        totalPages: 1,
      },
      metrics: {
        totalReports: 1,
        completedReports: 1,
        runningReports: 0,
        failedReports: 0,
        avgExecutionTime: 300,
      },
    };
  });

  app.get('/api/admin/simulations/analytics', async (request) => {
    const { page = '1', limit = '10' } = request.query as any;
    
    return {
      simulations: [
        {
          id: '1',
          user_id: 'user1',
          type: 'paper_trading',
          status: 'completed',
          progress: 100,
          created_at: new Date(),
        },
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        totalPages: 1,
      },
      metrics: {
        totalSimulations: 1,
        completedSimulations: 1,
        runningSimulations: 0,
        failedSimulations: 0,
        avgProgress: 100,
      },
    };
  });

  app.get('/api/admin/automations/management', async (request) => {
    const { page = '1', limit = '10' } = request.query as any;
    
    return {
      automations: [
        {
          id: '1',
          user_id: 'user1',
          type: 'dca',
          status: 'active',
          risk_level: 'medium',
          created_at: new Date(),
        },
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        totalPages: 1,
      },
      metrics: {
        totalAutomations: 1,
        activeAutomations: 1,
        pausedAutomations: 0,
        stoppedAutomations: 0,
        errorAutomations: 0,
      },
    };
  });

  app.get('/api/admin/notifications/management', async (request) => {
    const { page = '1', limit = '10' } = request.query as any;
    
    return {
      templates: [
        {
          id: '1',
          name: 'Welcome Email',
          channel: 'email',
          category: 'system',
          is_active: true,
          created_at: new Date(),
        },
      ],
      notifications: [
        {
          id: '1',
          template_id: '1',
          user_id: 'user1',
          status: 'sent',
          created_at: new Date(),
        },
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        totalPages: 1,
      },
      metrics: {
        totalTemplates: 1,
        activeTemplates: 1,
        totalNotifications: 1,
        sentNotifications: 1,
        failedNotifications: 0,
        successRate: 100,
      },
    };
  });

  app.get('/api/admin/reports/system', async (request) => {
    const { page = '1', limit = '10' } = request.query as any;
    
    return {
      systemReports: [
        {
          id: '1',
          type: 'daily',
          status: 'completed',
          title: 'Daily System Report',
          file_size: 1024,
          created_at: new Date(),
        },
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        totalPages: 1,
      },
      metrics: {
        totalReports: 1,
        completedReports: 1,
        generatingReports: 0,
        failedReports: 0,
        scheduledReports: 0,
        totalFileSize: 1024,
      },
    };
  });

  app.get('/api/admin/audit/logs', async (request) => {
    const { page = '1', limit = '10' } = request.query as any;
    
    return {
      auditLogs: [
        {
          id: '1',
          user_id: 'user1',
          action: 'login',
          resource: 'auth',
          severity: 'info',
          ip_address: '127.0.0.1',
          created_at: new Date(),
        },
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        totalPages: 1,
      },
      metrics: {
        totalLogs: 1,
        criticalLogs: 0,
        highLogs: 0,
        mediumLogs: 0,
        lowLogs: 1,
        uniqueUsers: 1,
      },
    };
  });

  return app;
}
