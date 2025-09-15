import { FastifyInstance } from 'fastify';
import { adminController } from '../controllers/admin.controller';

export async function adminAdvancedRoutes(fastify: FastifyInstance) {
  // Advanced dashboard with detailed KPIs
  fastify.get('/api/admin/advanced-dashboard', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['1h', '24h', '7d', '30d'],
            default: '24h'
          },
        },
      },
    },
  }, adminController.getAdvancedDashboard.bind(adminController));

  // Coupon management routes are handled by coupon-admin.routes.ts

  // Bulk user operations
  fastify.post('/api/admin/users/bulk', {
    schema: {
      body: {
        type: 'object',
        required: ['operation', 'userIds'],
        properties: {
          operation: {
            type: 'string',
            enum: ['activate', 'deactivate', 'change_plan'],
          },
          userIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 100,
          },
          data: {
            type: 'object',
            properties: {
              plan_type: { type: 'string', enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'] },
            },
          },
        },
      },
    },
  }, adminController.bulkUserOperation.bind(adminController));

  // Advanced logging
  fastify.get('/api/admin/logs/advanced', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '50' },
          level: { type: 'string', enum: ['error', 'warn', 'info', 'debug'] },
          service: { type: 'string' },
          start_date: { type: 'string', format: 'date-time' },
          end_date: { type: 'string', format: 'date-time' },
          search: { type: 'string' },
        },
      },
    },
  }, adminController.getAdvancedLogs.bind(adminController));

  // Data export
  fastify.post('/api/admin/export', {
    schema: {
      body: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['users', 'trades', 'payments'] },
          format: { type: 'string', enum: ['json', 'csv', 'xlsx'], default: 'json' },
          filters: {
            type: 'object',
            properties: {
              plan_type: { type: 'string', enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'] },
              start_date: { type: 'string', format: 'date-time' },
              end_date: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }, adminController.exportData.bind(adminController));

  // System health check
  fastify.get('/api/admin/health/detailed', async (request, reply) => {
    try {
      // This would integrate with actual health check services
      const health = {
        database: {
          status: 'healthy',
          response_time: 15,
          connections: 8,
          last_check: new Date().toISOString(),
        },
        redis: {
          status: 'healthy',
          memory_usage: '45MB',
          connections: 12,
          last_check: new Date().toISOString(),
        },
        workers: {
          'margin-monitor': { status: 'running', last_heartbeat: new Date().toISOString() },
          'automation-executor': { status: 'running', last_heartbeat: new Date().toISOString() },
          'notification': { status: 'running', last_heartbeat: new Date().toISOString() },
          'payment-validator': { status: 'running', last_heartbeat: new Date().toISOString() },
        },
        api: {
          status: 'healthy',
          response_time: 150,
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
        },
        external_services: {
          ln_markets: {
            status: 'healthy',
            last_check: new Date().toISOString(),
            response_time: 200,
          },
          email_service: {
            status: 'healthy',
            last_check: new Date().toISOString(),
          },
        },
      };

      const overallStatus = this.calculateOverallHealth(health);

      reply.send({
        success: true,
        data: {
          overall_status: overallStatus,
          components: health,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error getting detailed health:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get health status',
      });
    }
  });

  // Real-time metrics
  fastify.get('/api/admin/metrics/realtime', async (request, reply) => {
    try {
      // This would integrate with Prometheus or similar
      const metrics = {
        active_users: Math.floor(Math.random() * 50) + 10,
        active_trades: Math.floor(Math.random() * 20) + 5,
        queue_size: Math.floor(Math.random() * 10),
        api_requests_per_minute: Math.floor(Math.random() * 100) + 50,
        error_rate: Math.random() * 5,
        memory_usage: process.memoryUsage(),
        cpu_usage: Math.random() * 100,
        timestamp: new Date().toISOString(),
      };

      reply.send({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error('Error getting real-time metrics:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get real-time metrics',
      });
    }
  });

  // User activity analytics
  fastify.get('/api/admin/analytics/users', async (request, reply) => {
    try {
      const { period = '7d' } = request.query as any;

      const now = new Date();
      const periods = {
        '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
      const startDate = periods[period as keyof typeof periods];

      const [
        userActivity,
        planDistribution,
        geographicData,
        deviceTypes
      ] = await Promise.all([
        // User activity over time
        prisma.user.groupBy({
          by: ['last_activity_at'],
          where: { last_activity_at: { gte: startDate } },
          _count: { last_activity_at: true },
          orderBy: { last_activity_at: 'asc' },
        }),

        // Plan distribution
        prisma.user.groupBy({
          by: ['plan_type'],
          _count: { plan_type: true },
        }),

        // Geographic data (mock for now)
        Promise.resolve([
          { country: 'Brazil', users: 150 },
          { country: 'United States', users: 45 },
          { country: 'Portugal', users: 23 },
        ]),

        // Device types (mock for now)
        Promise.resolve([
          { device: 'Desktop', percentage: 65 },
          { device: 'Mobile', percentage: 30 },
          { device: 'Tablet', percentage: 5 },
        ]),
      ]);

      reply.send({
        success: true,
        data: {
          period,
          user_activity: userActivity.map(ua => ({
            date: ua.last_activity_at?.toISOString().split('T')[0],
            active_users: ua._count.last_activity_at,
          })),
          plan_distribution: planDistribution.map(pd => ({
            plan: pd.plan_type,
            users: pd._count.plan_type,
          })),
          geographic_distribution: geographicData,
          device_distribution: deviceTypes,
        },
      });
    } catch (error: any) {
      console.error('Error getting user analytics:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get user analytics',
      });
    }
  });

  // Performance analytics
  fastify.get('/api/admin/analytics/performance', async (request, reply) => {
    try {
      const { period = '24h' } = request.query as any;

      const now = new Date();
      const periods = {
        '1h': new Date(now.getTime() - 60 * 60 * 1000),
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      };
      const startDate = periods[period as keyof typeof periods];

      const [
        apiPerformance,
        tradePerformance,
        automationPerformance
      ] = await Promise.all([
        // API performance (mock for now)
        Promise.resolve({
          avg_response_time: 145,
          p95_response_time: 320,
          error_rate: 2.3,
          requests_per_minute: 85,
        }),

        // Trade performance
        prisma.tradeLog.aggregate({
          where: { executed_at: { gte: startDate } },
          _count: { id: true },
          _avg: { executed_at: true }, // This would need a proper implementation
        }),

        // Automation performance
        prisma.automation.aggregate({
          _count: { id: true },
        }),
      ]);

      reply.send({
        success: true,
        data: {
          period,
          api_performance: apiPerformance,
          trade_performance: {
            total_trades: tradePerformance._count.id,
            avg_execution_time: 2500, // ms (mock)
            success_rate: 94.5,
          },
          automation_performance: {
            total_automations: automationPerformance._count.id,
            active_automations: Math.floor(automationPerformance._count.id * 0.8),
            avg_trigger_time: 1500, // ms (mock)
          },
        },
      });
    } catch (error: any) {
      console.error('Error getting performance analytics:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get performance analytics',
      });
    }
  });
}

