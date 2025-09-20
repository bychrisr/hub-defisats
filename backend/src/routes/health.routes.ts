import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from '../config/env';
import { metrics } from '../utils/metrics';

export async function healthRoutes(fastify: FastifyInstance) {
  // Create new instances instead of accessing from fastify
  const prisma = new PrismaClient();
  const redis = new Redis(config.redis.url);

  // Hook para garantir que as rotas de health sejam públicas
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Pular autenticação para rotas de health
    if (request.url.startsWith('/health') || request.url.startsWith('/api/health')) {
      return; // Continue sem autenticação
    }
    // Para outras rotas, aplicar autenticação normal se necessário
  });

  // Basic health check
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env['npm_package_version'] || '0.1.1',
        environment: config.env.NODE_ENV,
        services: {
          database: 'unknown',
          redis: 'unknown',
          api: 'healthy'
        }
      };

      // Check database
      try {
        await prisma.$queryRaw`SELECT 1`;
        health.services.database = 'healthy';
      } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
      }

      // Check Redis
      try {
        await redis.ping();
        health.services.redis = 'healthy';
      } catch (error) {
        health.services.redis = 'unhealthy';
        health.status = 'degraded';
      }

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/health', 200, duration);

      return reply.status(200).send(health);
    } catch (error) {
      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/health', 500, duration);
      
      return reply.status(500).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      });
    }
  });

  // Detailed health check
  fastify.get('/health/detailed', async (_request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env['npm_package_version'] || '0.1.1',
        environment: config.env.NODE_ENV,
        services: {
          database: {
            status: 'unknown',
            responseTime: 0,
            error: null
          },
          redis: {
            status: 'unknown',
            responseTime: 0,
            error: null
          }
        },
        metrics: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime()
        }
      };

      // Check database with timing
      try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbDuration = Date.now() - dbStart;
        
        health.services.database = {
          status: 'healthy',
          responseTime: dbDuration,
          error: null
        };
      } catch (error) {
        health.services.database = {
          status: 'unhealthy',
          responseTime: 0,
          error: (error as Error).message
        } as any;
        health.status = 'degraded';
      }

      // Check Redis with timing
      try {
        const redisStart = Date.now();
        await redis.ping();
        const redisDuration = Date.now() - redisStart;
        
        health.services.redis = {
          status: 'healthy',
          responseTime: redisDuration,
          error: null
        };
      } catch (error) {
        health.services.redis = {
          status: 'unhealthy',
          responseTime: 0,
          error: (error as Error).message
        } as any;
        health.status = 'degraded';
      }

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/health/detailed', 200, duration);

      return reply.status(200).send(health);
    } catch (error) {
      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/health/detailed', 500, duration);
      
      return reply.status(500).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      });
    }
  });

  // Metrics endpoint
  fastify.get('/metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    
    try {
      const prometheusMetrics = metrics.getMetricsAsPrometheus();
      
      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/metrics', 200, duration);

      return reply
        .type('text/plain')
        .status(200)
        .send(prometheusMetrics);
    } catch (error) {
      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/metrics', 500, duration);
      
      return reply.status(500).send({
        error: 'Failed to retrieve metrics',
        message: (error as Error).message
      });
    }
  });

  // Metrics as JSON
  fastify.get('/metrics/json', async (_request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    
    try {
      const jsonMetrics = metrics.getMetricsAsJSON();
      
      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/metrics/json', 200, duration);

      return reply.status(200).send({
        metrics: jsonMetrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/metrics/json', 500, duration);
      
      return reply.status(500).send({
        error: 'Failed to retrieve metrics',
        message: (error as Error).message
      });
    }
  });
}
