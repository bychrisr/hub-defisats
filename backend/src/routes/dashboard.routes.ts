import { FastifyInstance } from 'fastify';
import { metrics } from '@/services/metrics.service';
import { alerting } from '@/services/alerting.service';
// import { monitoring } from '@/services/monitoring.service';
import { authMiddleware } from '@/middleware/auth.middleware';

// Interfaces for metrics
interface MetricValue {
  value: number;
  labels: {
    status_code?: string;
    [key: string]: string | undefined;
  };
}

// interface Metric {
//   values?: MetricValue[];
// }

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  fastify.addHook('preHandler', authMiddleware);

  // Dashboard principal
  fastify.get('/dashboard', {
    schema: {
      description: 'Get main dashboard data',
      tags: ['Dashboard'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                system: {
                  type: 'object',
                  properties: {
                    uptime: { type: 'number' },
                    memory: { type: 'object' },
                    cpu: { type: 'number' },
                    version: { type: 'string' },
                    environment: { type: 'string' },
                  },
                },
                metrics: {
                  type: 'object',
                  properties: {
                    http: {
                      type: 'object',
                      properties: {
                        totalRequests: { type: 'number' },
                        avgResponseTime: { type: 'number' },
                        errorRate: { type: 'number' },
                        requestsPerMinute: { type: 'number' },
                      },
                    },
                    auth: {
                      type: 'object',
                      properties: {
                        totalAttempts: { type: 'number' },
                        successRate: { type: 'number' },
                        failures: { type: 'number' },
                      },
                    },
                    rateLimit: {
                      type: 'object',
                      properties: {
                        totalHits: { type: 'number' },
                        totalBlocks: { type: 'number' },
                        blockRate: { type: 'number' },
                      },
                    },
                  },
                },
                alerts: {
                  type: 'object',
                  properties: {
                    active: { type: 'number' },
                    total: { type: 'number' },
                    bySeverity: {
                      type: 'object',
                      properties: {
                        low: { type: 'number' },
                        medium: { type: 'number' },
                        high: { type: 'number' },
                        critical: { type: 'number' },
                      },
                    },
                  },
                },
                recentAlerts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      severity: { type: 'string' },
                      message: { type: 'string' },
                      timestamp: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const metricsData = await metrics.getMetricsAsJSON();
        const activeAlerts = alerting.getActiveAlerts();
        const allAlerts = alerting.getAllAlerts();

        // Calcular métricas de HTTP
        const httpRequestsMetric = metricsData.find(
          (m: any) => m.name === 'http_requests_total'
        );
        const httpDurationMetric = metricsData.find(
          (m: any) => m.name === 'http_request_duration_seconds'
        );

        const totalRequests =
          httpRequestsMetric?.values?.reduce(
            (sum: number, val: MetricValue) => sum + val.value,
            0
          ) || 0;
        const errorRequests =
          httpRequestsMetric?.values?.filter(
            (v: MetricValue) => v.labels.status_code && v.labels.status_code >= '400'
          ).length || 0;
        const errorRate =
          totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

        const avgResponseTime =
          httpDurationMetric?.values?.reduce(
            (sum: number, val: MetricValue) => sum + val.value,
            0
          ) / (httpDurationMetric?.values?.length || 1) || 0;

        // Calcular métricas de autenticação
        const authAttemptsMetric = metricsData.find(
          (m: any) => m.name === 'auth_attempts_total'
        );
        const authSuccessMetric = metricsData.find(
          (m: any) => m.name === 'auth_success_total'
        );
        const authFailuresMetric = metricsData.find(
          (m: any) => m.name === 'auth_failures_total'
        );

        const totalAuthAttempts =
          authAttemptsMetric?.values?.reduce(
            (sum: number, val: MetricValue) => sum + val.value,
            0
          ) || 0;
        const totalAuthSuccess =
          authSuccessMetric?.values?.reduce(
            (sum: number, val: MetricValue) => sum + val.value,
            0
          ) || 0;
        const totalAuthFailures =
          authFailuresMetric?.values?.reduce(
            (sum: number, val: MetricValue) => sum + val.value,
            0
          ) || 0;
        const authSuccessRate =
          totalAuthAttempts > 0
            ? (totalAuthSuccess / totalAuthAttempts) * 100
            : 0;

        // Calcular métricas de rate limiting
        const rateLimitHitsMetric = metricsData.find(
          (m: any) => m.name === 'rate_limit_hits_total'
        );
        const rateLimitBlocksMetric = metricsData.find(
          (m: any) => m.name === 'rate_limit_blocks_total'
        );

        const totalRateLimitHits =
          rateLimitHitsMetric?.values?.reduce(
            (sum: number, val: MetricValue) => sum + val.value,
            0
          ) || 0;
        const totalRateLimitBlocks =
          rateLimitBlocksMetric?.values?.reduce(
            (sum: number, val: MetricValue) => sum + val.value,
            0
          ) || 0;
        const rateLimitBlockRate =
          totalRateLimitHits > 0
            ? (totalRateLimitBlocks / totalRateLimitHits) * 100
            : 0;

        // Calcular métricas de memória
        const memoryMetric = metricsData.find(
          (m: any) => m.name === 'memory_usage_bytes' && m.labels.type === 'heapUsed'
        );
        const memoryUsageMB =
          memoryMetric?.values?.[0]?.value / 1024 / 1024 || 0;

        // Calcular métricas de CPU
        const cpuMetric = metricsData.find((m: any) => m.name === 'cpu_usage_percent');
        const cpuUsage = cpuMetric?.values?.[0]?.value || 0;

        // Calcular estatísticas de alertas
        const alertStats = {
          active: activeAlerts.length,
          total: allAlerts.length,
          bySeverity: {
            low: allAlerts.filter(a => a.severity === 'low').length,
            medium: allAlerts.filter(a => a.severity === 'medium').length,
            high: allAlerts.filter(a => a.severity === 'high').length,
            critical: allAlerts.filter(a => a.severity === 'critical').length,
          },
        };

        // Obter alertas recentes (últimos 10)
        const recentAlerts = allAlerts
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10)
          .map(alert => ({
            id: alert.id,
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp.toISOString(),
          }));

        const dashboardData = {
          system: {
            uptime: process.uptime(),
            memory: {
              used: memoryUsageMB,
              total: process.memoryUsage().heapTotal / 1024 / 1024,
              percentage:
                (memoryUsageMB /
                  (process.memoryUsage().heapTotal / 1024 / 1024)) *
                100,
            },
            cpu: cpuUsage,
            version: '0.0.2',
            environment: process.env['NODE_ENV'] || 'development',
          },
          metrics: {
            http: {
              totalRequests,
              avgResponseTime: avgResponseTime * 1000, // converter para ms
              errorRate,
              requestsPerMinute: totalRequests / (process.uptime() / 60), // aproximação
            },
            auth: {
              totalAttempts: totalAuthAttempts,
              successRate: authSuccessRate,
              failures: totalAuthFailures,
            },
            rateLimit: {
              totalHits: totalRateLimitHits,
              totalBlocks: totalRateLimitBlocks,
              blockRate: rateLimitBlockRate,
            },
          },
          alerts: alertStats,
          recentAlerts,
        };

        return {
          success: true,
          data: dashboardData,
        };
      } catch (error) {
        fastify.log.error('Error getting dashboard data:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get dashboard data',
        });
      }
    },
  });

  // Dashboard de métricas detalhadas
  fastify.get('/dashboard/metrics', {
    schema: {
      description: 'Get detailed metrics for dashboard',
      tags: ['Dashboard'],
      querystring: {
        type: 'object',
        properties: {
          timeRange: { type: 'string', enum: ['1h', '6h', '24h', '7d'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                http: { type: 'object' },
                auth: { type: 'object' },
                system: { type: 'object' },
                lnMarkets: { type: 'object' },
                workers: { type: 'object' },
              },
            },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        // const query = request.query as { timeRange?: string };
        // const timeRange = query.timeRange || '24h';

        const metricsData = await metrics.getMetricsAsJSON();

        // Filtrar métricas por período (simplificado)
        // const now = Date.now();
        // const timeRanges = {
        //   '1h': 60 * 60 * 1000,
        //   '6h': 6 * 60 * 60 * 1000,
        //   '24h': 24 * 60 * 60 * 1000,
        //   '7d': 7 * 24 * 60 * 60 * 1000,
        // };

        // const cutoff = now - (timeRanges[timeRange] || timeRanges['24h']);

        const detailedMetrics = {
          http: {
            requests: metricsData.filter((m: any) => m.name === 'http_requests_total'),
            duration: metricsData.filter(
              (m: any) => m.name === 'http_request_duration_seconds'
            ),
            responseSize: metricsData.filter(
              (m: any) => m.name === 'http_response_size_bytes'
            ),
          },
          auth: {
            attempts: metricsData.filter((m: any) => m.name === 'auth_attempts_total'),
            success: metricsData.filter((m: any) => m.name === 'auth_success_total'),
            failures: metricsData.filter((m: any) => m.name === 'auth_failures_total'),
          },
          system: {
            memory: metricsData.filter((m: any) => m.name === 'memory_usage_bytes'),
            cpu: metricsData.filter((m: any) => m.name === 'cpu_usage_percent'),
          },
          lnMarkets: {
            calls: metricsData.filter(
              (m: any) => m.name === 'lnmarkets_api_calls_total'
            ),
            duration: metricsData.filter(
              (m: any) => m.name === 'lnmarkets_api_duration_seconds'
            ),
            errors: metricsData.filter(
              (m: any) => m.name === 'lnmarkets_api_errors_total'
            ),
          },
          workers: {
            jobs: metricsData.filter((m: any) => m.name === 'worker_jobs_total'),
            duration: metricsData.filter(
              (m: any) => m.name === 'worker_job_duration_seconds'
            ),
            failures: metricsData.filter(
              (m: any) => m.name === 'worker_job_failures_total'
            ),
          },
        };

        return {
          success: true,
          data: detailedMetrics,
        };
      } catch (error) {
        fastify.log.error('Error getting detailed metrics:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get detailed metrics',
        });
      }
    },
  });

  // Dashboard de alertas
  fastify.get('/dashboard/alerts', {
    schema: {
      description: 'Get alerts dashboard data',
      tags: ['Dashboard'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                summary: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    active: { type: 'number' },
                    resolved: { type: 'number' },
                    bySeverity: { type: 'object' },
                  },
                },
                recent: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      ruleId: { type: 'string' },
                      severity: { type: 'string' },
                      message: { type: 'string' },
                      timestamp: { type: 'string' },
                      resolved: { type: 'boolean' },
                    },
                  },
                },
                trends: {
                  type: 'object',
                  properties: {
                    last24h: { type: 'number' },
                    last7d: { type: 'number' },
                    resolutionRate: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const allAlerts = alerting.getAllAlerts();
        const activeAlerts = alerting.getActiveAlerts();

        // Calcular tendências
        const now = new Date();
        const last24h = allAlerts.filter(
          a => now.getTime() - a.timestamp.getTime() < 24 * 60 * 60 * 1000
        ).length;

        const last7d = allAlerts.filter(
          a => now.getTime() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
        ).length;

        const resolvedAlerts = allAlerts.filter(a => a.resolved);
        const resolutionRate =
          allAlerts.length > 0
            ? (resolvedAlerts.length / allAlerts.length) * 100
            : 0;

        const alertsData = {
          summary: {
            total: allAlerts.length,
            active: activeAlerts.length,
            resolved: allAlerts.length - activeAlerts.length,
            bySeverity: {
              low: allAlerts.filter(a => a.severity === 'low').length,
              medium: allAlerts.filter(a => a.severity === 'medium').length,
              high: allAlerts.filter(a => a.severity === 'high').length,
              critical: allAlerts.filter(a => a.severity === 'critical').length,
            },
          },
          recent: allAlerts
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 20)
            .map(alert => ({
              id: alert.id,
              ruleId: alert.ruleId,
              severity: alert.severity,
              message: alert.message,
              timestamp: alert.timestamp.toISOString(),
              resolved: alert.resolved,
            })),
          trends: {
            last24h,
            last7d,
            resolutionRate,
          },
        };

        return {
          success: true,
          data: alertsData,
        };
      } catch (error) {
        fastify.log.error('Error getting alerts dashboard:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get alerts dashboard data',
        });
      }
    },
  });
}
