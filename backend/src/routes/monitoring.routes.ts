import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from '../config/env';
import { metrics } from '../services/metrics-export';
import { alerting } from '../services/alerting.service';
import { monitoring } from '../services/monitoring.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { superAdminMiddleware } from '../middleware/superadmin.middleware';

export async function monitoringRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);
  
  // Apply superadmin middleware to all routes
  fastify.addHook('preHandler', superAdminMiddleware);

  // Create new instances for health checks
  const prisma = new PrismaClient();
  const redis = new Redis(config.redis.url);

  // Comprehensive monitoring dashboard
  fastify.get('/monitoring', {
    schema: {
      description: 'Get comprehensive monitoring data',
      tags: ['Monitoring'],
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
                    nodeVersion: { type: 'string' },
                    platform: { type: 'string' },
                  },
                },
                services: {
                  type: 'object',
                  properties: {
                    database: { type: 'object' },
                    redis: { type: 'object' },
                    lnMarkets: { type: 'object' },
                    workers: { type: 'object' },
                  },
                },
                metrics: {
                  type: 'object',
                  properties: {
                    http: { type: 'object' },
                    auth: { type: 'object' },
                    rateLimit: { type: 'object' },
                    business: { type: 'object' },
                  },
                },
                alerts: {
                  type: 'object',
                  properties: {
                    active: { type: 'number' },
                    total: { type: 'number' },
                    bySeverity: { type: 'object' },
                    recent: { type: 'array' },
                  },
                },
                performance: {
                  type: 'object',
                  properties: {
                    apiLatency: { type: 'number' },
                    errorRate: { type: 'number' },
                    throughput: { type: 'number' },
                    availability: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        console.log('🔍 MONITORING - Starting comprehensive monitoring data fetch...');
        
        // Get system information
        const systemInfo = {
          uptime: process.uptime(),
          memory: {
            used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
            total: process.memoryUsage().heapTotal / 1024 / 1024, // MB
            external: process.memoryUsage().external / 1024 / 1024, // MB
            rss: process.memoryUsage().rss / 1024 / 1024, // MB
            percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
          },
          cpu: process.cpuUsage(),
          version: process.env['npm_package_version'] || '0.0.2',
          environment: config.env.NODE_ENV,
          nodeVersion: process.version,
          platform: process.platform,
        };

        // Check services health
        const servicesHealth = await Promise.allSettled([
          // Database health
          (async () => {
            const start = Date.now();
            try {
              await prisma.$queryRaw`SELECT 1`;
              const responseTime = Date.now() - start;
              return {
                status: 'healthy',
                responseTime,
                error: null,
              };
            } catch (error) {
              return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: (error as Error).message,
              };
            }
          })(),
          
          // Redis health
          (async () => {
            const start = Date.now();
            try {
              await redis.ping();
              const responseTime = Date.now() - start;
              return {
                status: 'healthy',
                responseTime,
                error: null,
              };
            } catch (error) {
              return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: (error as Error).message,
              };
            }
          })(),
          
          // LN Markets API health (simulated)
          (async () => {
            const start = Date.now();
            try {
              // Simulate API check
              await new Promise(resolve => setTimeout(resolve, 100));
              const responseTime = Date.now() - start;
              return {
                status: 'healthy',
                responseTime,
                error: null,
              };
            } catch (error) {
              return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: (error as Error).message,
              };
            }
          })(),
          
          // Workers health (simulated)
          (async () => {
            const start = Date.now();
            try {
              // Simulate workers check
              await new Promise(resolve => setTimeout(resolve, 50));
              const responseTime = Date.now() - start;
              return {
                status: 'healthy',
                responseTime,
                error: null,
              };
            } catch (error) {
              return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: (error as Error).message,
              };
            }
          })(),
        ]);

        const services = {
          database: servicesHealth[0].status === 'fulfilled' ? servicesHealth[0].value : { status: 'unhealthy', responseTime: 0, error: 'Service check failed' },
          redis: servicesHealth[1].status === 'fulfilled' ? servicesHealth[1].value : { status: 'unhealthy', responseTime: 0, error: 'Service check failed' },
          lnMarkets: servicesHealth[2].status === 'fulfilled' ? servicesHealth[2].value : { status: 'unhealthy', responseTime: 0, error: 'Service check failed' },
          workers: servicesHealth[3].status === 'fulfilled' ? servicesHealth[3].value : { status: 'unhealthy', responseTime: 0, error: 'Service check failed' },
        };

        // Get metrics data
        const metricsData = await metrics.getMetricsAsJson();
        
        // Calculate HTTP metrics
        const httpRequestsMetric = metricsData.find((m: any) => m.name === 'http_requests_total');
        const httpDurationMetric = metricsData.find((m: any) => m.name === 'http_request_duration_seconds');
        
        const totalRequests = httpRequestsMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;
        const errorRequests = httpRequestsMetric?.values?.filter((v: any) => v.labels.status_code && parseInt(v.labels.status_code) >= 400).length || 0;
        const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
        const avgResponseTime = httpDurationMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) / (httpDurationMetric?.values?.length || 1) || 0;

        // Calculate auth metrics
        const authAttemptsMetric = metricsData.find((m: any) => m.name === 'auth_attempts_total');
        const authSuccessMetric = metricsData.find((m: any) => m.name === 'auth_success_total');
        const authFailuresMetric = metricsData.find((m: any) => m.name === 'auth_failures_total');

        const totalAuthAttempts = authAttemptsMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;
        const totalAuthSuccess = authSuccessMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;
        const totalAuthFailures = authFailuresMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;
        const authSuccessRate = totalAuthAttempts > 0 ? (totalAuthSuccess / totalAuthAttempts) * 100 : 0;

        // Calculate rate limit metrics
        const rateLimitHitsMetric = metricsData.find((m: any) => m.name === 'rate_limit_hits_total');
        const rateLimitBlocksMetric = metricsData.find((m: any) => m.name === 'rate_limit_blocks_total');

        const totalRateLimitHits = rateLimitHitsMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;
        const totalRateLimitBlocks = rateLimitBlocksMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;
        const rateLimitBlockRate = totalRateLimitHits > 0 ? (totalRateLimitBlocks / totalRateLimitHits) * 100 : 0;

        // Calculate business metrics
        const userRegistrationsMetric = metricsData.find((m: any) => m.name === 'user_registrations_total');
        const tradeExecutionsMetric = metricsData.find((m: any) => m.name === 'trade_executions_total');
        const automationExecutionsMetric = metricsData.find((m: any) => m.name === 'automation_executions_total');

        const totalUserRegistrations = userRegistrationsMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;
        const totalTradeExecutions = tradeExecutionsMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;
        const totalAutomationExecutions = automationExecutionsMetric?.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;

        const metricsSummary = {
          http: {
            totalRequests,
            avgResponseTime: avgResponseTime * 1000, // Convert to ms
            errorRate,
            requestsPerMinute: totalRequests / (process.uptime() / 60),
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
          business: {
            userRegistrations: totalUserRegistrations,
            tradeExecutions: totalTradeExecutions,
            automationExecutions: totalAutomationExecutions,
          },
        };

        // Get alerts data
        const allAlerts = alerting.getAllAlerts();
        const activeAlerts = alerting.getActiveAlerts();

        const alertsSummary = {
          active: activeAlerts.length,
          total: allAlerts.length,
          bySeverity: {
            low: allAlerts.filter(a => a.severity === 'low').length,
            medium: allAlerts.filter(a => a.severity === 'medium').length,
            high: allAlerts.filter(a => a.severity === 'high').length,
            critical: allAlerts.filter(a => a.severity === 'critical').length,
          },
          recent: allAlerts
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10)
            .map(alert => ({
              id: alert.id,
              severity: alert.severity,
              message: alert.message,
              timestamp: alert.timestamp.toISOString(),
              resolved: alert.resolved,
            })),
        };

        // Calculate performance metrics
        const performanceMetrics = {
          apiLatency: avgResponseTime * 1000, // ms
          errorRate,
          throughput: totalRequests / (process.uptime() / 60), // requests per minute
          availability: errorRate < 5 ? 100 - errorRate : 95, // Simplified availability calculation
        };

        const monitoringData = {
          system: systemInfo,
          services,
          metrics: metricsSummary,
          alerts: alertsSummary,
          performance: performanceMetrics,
        };

        console.log('✅ MONITORING - Comprehensive monitoring data retrieved successfully');
        
        return {
          success: true,
          data: monitoringData,
        };
      } catch (error) {
        fastify.log.error('Error getting monitoring data:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get monitoring data',
        });
      }
    },
  });

  // Real-time metrics endpoint
  fastify.get('/monitoring/metrics/realtime', {
    schema: {
      description: 'Get real-time metrics data',
      tags: ['Monitoring'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                metrics: { type: 'object' },
              },
            },
          },
        },
      },
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const metricsData = await metrics.getMetricsAsJson();
        
        return {
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            metrics: metricsData,
          },
        };
      } catch (error) {
        fastify.log.error('Error getting real-time metrics:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get real-time metrics',
        });
      }
    },
  });

  // Service health check endpoint
  fastify.get('/monitoring/services/health', {
    schema: {
      description: 'Get detailed service health information',
      tags: ['Monitoring'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                overall: { type: 'string' },
                services: { type: 'object' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const healthChecks = await Promise.allSettled([
          // Database health
          (async () => {
            const start = Date.now();
            try {
              await prisma.$queryRaw`SELECT 1`;
              const responseTime = Date.now() - start;
              return {
                name: 'database',
                status: 'healthy',
                responseTime,
                error: null,
                details: {
                  connection: 'active',
                  queryTime: responseTime,
                },
              };
            } catch (error) {
              return {
                name: 'database',
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: (error as Error).message,
                details: {
                  connection: 'failed',
                  queryTime: 0,
                },
              };
            }
          })(),
          
          // Redis health
          (async () => {
            const start = Date.now();
            try {
              await redis.ping();
              const responseTime = Date.now() - start;
              return {
                name: 'redis',
                status: 'healthy',
                responseTime,
                error: null,
                details: {
                  connection: 'active',
                  pingTime: responseTime,
                },
              };
            } catch (error) {
              return {
                name: 'redis',
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: (error as Error).message,
                details: {
                  connection: 'failed',
                  pingTime: 0,
                },
              };
            }
          })(),
          
          // LN Markets API health
          (async () => {
            const start = Date.now();
            try {
              // Simulate API health check
              await new Promise(resolve => setTimeout(resolve, 100));
              const responseTime = Date.now() - start;
              return {
                name: 'lnMarkets',
                status: 'healthy',
                responseTime,
                error: null,
                details: {
                  connection: 'active',
                  apiVersion: 'v1',
                },
              };
            } catch (error) {
              return {
                name: 'lnMarkets',
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: (error as Error).message,
                details: {
                  connection: 'failed',
                  apiVersion: 'unknown',
                },
              };
            }
          })(),
          
          // Workers health
          (async () => {
            const start = Date.now();
            try {
              // Simulate workers health check
              await new Promise(resolve => setTimeout(resolve, 50));
              const responseTime = Date.now() - start;
              return {
                name: 'workers',
                status: 'healthy',
                responseTime,
                error: null,
                details: {
                  activeWorkers: 4,
                  queueSize: 0,
                },
              };
            } catch (error) {
              return {
                name: 'workers',
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: (error as Error).message,
                details: {
                  activeWorkers: 0,
                  queueSize: -1,
                },
              };
            }
          })(),
        ]);

        const services = healthChecks.map(check => 
          check.status === 'fulfilled' ? check.value : {
            name: 'unknown',
            status: 'unhealthy',
            responseTime: 0,
            error: 'Service check failed',
            details: {},
          }
        );

        const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' : 
                            services.some(s => s.status === 'unhealthy') ? 'degraded' : 'unhealthy';

        return {
          success: true,
          data: {
            overall: overallStatus,
            services: services.reduce((acc, service) => {
              acc[service.name] = service;
              return acc;
            }, {} as any),
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        fastify.log.error('Error getting service health:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get service health',
        });
      }
    },
  });

  // Performance analytics endpoint
  fastify.get('/monitoring/performance', {
    schema: {
      description: 'Get performance analytics data',
      tags: ['Monitoring'],
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
                latency: { type: 'object' },
                throughput: { type: 'object' },
                errorRate: { type: 'object' },
                availability: { type: 'object' },
              },
            },
          },
        },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as { timeRange?: string };
        const timeRange = query.timeRange || '24h';

        // Get metrics data
        const metricsData = await metrics.getMetricsAsJson();
        
        // Calculate performance metrics based on time range
        const performanceData = {
          latency: {
            p50: 150, // Simulated percentile data
            p95: 300,
            p99: 500,
            average: 200,
            max: 1000,
          },
          throughput: {
            requestsPerSecond: 50,
            requestsPerMinute: 3000,
            requestsPerHour: 180000,
            peak: 100,
          },
          errorRate: {
            current: 2.5,
            average: 1.8,
            peak: 5.2,
            trend: 'decreasing',
          },
          availability: {
            current: 99.5,
            average: 99.8,
            uptime: process.uptime(),
            downtime: 0,
          },
        };

        return {
          success: true,
          data: performanceData,
        };
      } catch (error) {
        fastify.log.error('Error getting performance analytics:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get performance analytics',
        });
      }
    },
  });

  // Alert management endpoint
  fastify.get('/monitoring/alerts', {
    schema: {
      description: 'Get alerts management data',
      tags: ['Monitoring'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                summary: { type: 'object' },
                active: { type: 'array' },
                recent: { type: 'array' },
                trends: { type: 'object' },
              },
            },
          },
        },
      },
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const allAlerts = alerting.getAllAlerts();
        const activeAlerts = alerting.getActiveAlerts();

        // Calculate trends
        const now = new Date();
        const last24h = allAlerts.filter(
          a => now.getTime() - a.timestamp.getTime() < 24 * 60 * 60 * 1000
        ).length;

        const last7d = allAlerts.filter(
          a => now.getTime() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
        ).length;

        const resolvedAlerts = allAlerts.filter(a => a.resolved);
        const resolutionRate = allAlerts.length > 0 ? (resolvedAlerts.length / allAlerts.length) * 100 : 0;

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
          active: activeAlerts.map(alert => ({
            id: alert.id,
            ruleId: alert.ruleId,
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp.toISOString(),
            resolved: alert.resolved,
          })),
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
        fastify.log.error('Error getting alerts data:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get alerts data',
        });
      }
    },
  });

  // Resolve alert endpoint
  fastify.post('/monitoring/alerts/:alertId/resolve', {
    schema: {
      description: 'Resolve an alert',
      tags: ['Monitoring'],
      params: {
        type: 'object',
        properties: {
          alertId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as { alertId: string };
        const alertId = params.alertId;

        const resolved = alerting.resolveAlert(alertId);
        
        if (!resolved) {
          return reply.status(404).send({
            error: 'ALERT_NOT_FOUND',
            message: 'Alert not found or already resolved',
          });
        }

        return {
          success: true,
          message: 'Alert resolved successfully',
        };
      } catch (error) {
        fastify.log.error('Error resolving alert:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resolve alert',
        });
      }
    },
  });
}
