import { FastifyInstance } from 'fastify';
import { metrics } from '@/utils/metrics';

export async function metricsRoutes(fastify: FastifyInstance) {
  // Endpoint para métricas Prometheus
  fastify.get('/metrics', {
    schema: {
      description: 'Prometheus metrics endpoint',
      tags: ['Metrics'],
      response: {
        200: {
          type: 'string',
          description: 'Prometheus metrics in text format',
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
    handler: async (_request, reply) => {
      try {
        const metricsData = metrics.getMetricsAsPrometheus();
        reply.type('text/plain; version=0.0.4; charset=utf-8');
        return metricsData;
      } catch (error) {
        fastify.log.error('Error getting metrics:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get metrics',
        });
      }
    },
  });

  // Endpoint para métricas em JSON (para dashboards)
  fastify.get('/metrics/json', {
    schema: {
      description: 'Metrics in JSON format for dashboards',
      tags: ['Metrics'],
      response: {
        200: {
          type: 'object',
          description: 'Metrics in JSON format',
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
    handler: async (_request, reply) => {
      try {
        const metricsData = metrics.getMetricsAsJSON();
        return {
          success: true,
          data: metricsData,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        fastify.log.error('Error getting metrics JSON:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get metrics JSON',
        });
      }
    },
  });

  // Endpoint para health check das métricas
  fastify.get('/metrics/health', {
    schema: {
      description: 'Health check for metrics service',
      tags: ['Metrics'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            metrics_count: { type: 'number' },
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
    handler: async (_request, reply) => {
      try {
        const metricsData = metrics.getMetricsAsJSON();
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          metrics_count: metricsData.length,
        };
      } catch (error) {
        fastify.log.error('Error checking metrics health:', error as any);
        return reply.status(500).send({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: (error as any).message,
        });
      }
    },
  });
}
