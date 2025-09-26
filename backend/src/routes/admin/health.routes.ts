/**
 * Health Check Admin Routes
 * 
 * API endpoints for health monitoring and management
 */

import { FastifyInstance } from 'fastify';
import { healthCheckerService } from '../../services/health-checker.service';
import { databaseHealthService } from '../../services/database-health.service';
import { redisHealthService } from '../../services/redis-health.service';
import { websocketMetricsService } from '../../services/websocket-metrics.service';
import { adminAuthMiddleware } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';

export async function healthRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('preHandler', async (request, reply) => {
    await adminAuthMiddleware(request, reply);
  });

  /**
   * Get overall health status
   */
  fastify.get('/health', async (request, reply) => {
    try {
      const healthReport = await healthCheckerService.getCurrentHealth();
      
      logger.info('Health status requested', {
        status: healthReport.overallStatus,
        components: healthReport.components.length
      });

      return {
        success: true,
        data: healthReport
      };
    } catch (error: any) {
      logger.error('Failed to get health status', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get health status',
        error: error.message
      });
    }
  });

  /**
   * Get health metrics
   */
  fastify.get('/health/metrics', async (request, reply) => {
    try {
      const metrics = healthCheckerService.getMetrics();
      
      return {
        success: true,
        data: metrics
      };
    } catch (error: any) {
      logger.error('Failed to get health metrics', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get health metrics',
        error: error.message
      });
    }
  });

  /**
   * Get health alerts
   */
  fastify.get('/alerts', async (request, reply) => {
    try {
      const alerts = healthCheckerService.getAlerts();
      
      return {
        success: true,
        data: alerts
      };
    } catch (error: any) {
      logger.error('Failed to get health alerts', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get health alerts',
        error: error.message
      });
    }
  });

  /**
   * Resolve health alert
   */
  fastify.post('/alerts/:alertId/resolve', async (request, reply) => {
    try {
      const { alertId } = request.params as { alertId: string };
      
      healthCheckerService.resolveAlert(alertId);
      
      logger.info('Health alert resolved', { alertId });

      return {
        success: true,
        message: 'Alert resolved successfully'
      };
    } catch (error: any) {
      logger.error('Failed to resolve alert', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to resolve alert',
        error: error.message
      });
    }
  });

  /**
   * Get database health
   */
  fastify.get('/health/database', async (request, reply) => {
    try {
      const dbHealth = await databaseHealthService.getDatabaseHealth();
      
      return {
        success: true,
        data: dbHealth
      };
    } catch (error: any) {
      logger.error('Failed to get database health', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get database health',
        error: error.message
      });
    }
  });

  /**
   * Get database performance metrics
   */
  fastify.get('/health/database/performance', async (request, reply) => {
    try {
      const performanceMetrics = await databaseHealthService.getPerformanceMetrics();
      
      return {
        success: true,
        data: performanceMetrics
      };
    } catch (error: any) {
      logger.error('Failed to get database performance metrics', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get database performance metrics',
        error: error.message
      });
    }
  });

  /**
   * Optimize database performance
   */
  fastify.post('/health/database/optimize', async (request, reply) => {
    try {
      const optimizationResult = await databaseHealthService.optimizePerformance();
      
      logger.info('Database optimization performed', {
        success: optimizationResult.success,
        actions: optimizationResult.actions.length,
        errors: optimizationResult.errors.length
      });

      return {
        success: true,
        data: optimizationResult
      };
    } catch (error: any) {
      logger.error('Failed to optimize database', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to optimize database',
        error: error.message
      });
    }
  });

  /**
   * Get Redis health
   */
  fastify.get('/health/redis', async (request, reply) => {
    try {
      const redisHealth = await redisHealthService.getRedisHealth();
      
      return {
        success: true,
        data: redisHealth
      };
    } catch (error: any) {
      logger.error('Failed to get Redis health', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get Redis health',
        error: error.message
      });
    }
  });

  /**
   * Get Redis performance metrics
   */
  fastify.get('/health/redis/performance', async (request, reply) => {
    try {
      const performanceMetrics = await redisHealthService.getPerformanceMetrics();
      
      return {
        success: true,
        data: performanceMetrics
      };
    } catch (error: any) {
      logger.error('Failed to get Redis performance metrics', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get Redis performance metrics',
        error: error.message
      });
    }
  });

  /**
   * Optimize Redis performance
   */
  fastify.post('/health/redis/optimize', async (request, reply) => {
    try {
      const optimizationResult = await redisHealthService.optimizePerformance();
      
      logger.info('Redis optimization performed', {
        success: optimizationResult.success,
        actions: optimizationResult.actions.length,
        errors: optimizationResult.errors.length
      });

      return {
        success: true,
        data: optimizationResult
      };
    } catch (error: any) {
      logger.error('Failed to optimize Redis', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to optimize Redis',
        error: error.message
      });
    }
  });

  /**
   * Test Redis connectivity
   */
  fastify.get('/health/redis/test', async (request, reply) => {
    try {
      const connectivityTest = await redisHealthService.testConnectivity();
      
      return {
        success: true,
        data: connectivityTest
      };
    } catch (error: any) {
      logger.error('Failed to test Redis connectivity', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to test Redis connectivity',
        error: error.message
      });
    }
  });

  /**
   * Get WebSocket health
   */
  fastify.get('/health/websocket', async (request, reply) => {
    try {
      const metrics = websocketMetricsService.getMetrics();
      const healthScore = websocketMetricsService.getHealthScore();
      
      const websocketHealth = {
        status: healthScore > 80 ? 'healthy' : healthScore > 60 ? 'degraded' : 'unhealthy',
        healthScore,
        metrics
      };
      
      return {
        success: true,
        data: websocketHealth
      };
    } catch (error: any) {
      logger.error('Failed to get WebSocket health', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get WebSocket health',
        error: error.message
      });
    }
  });

  /**
   * Get WebSocket metrics
   */
  fastify.get('/health/websocket/metrics', async (request, reply) => {
    try {
      const metrics = websocketMetricsService.exportMetrics();
      
      return {
        success: true,
        data: metrics
      };
    } catch (error: any) {
      logger.error('Failed to get WebSocket metrics', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get WebSocket metrics',
        error: error.message
      });
    }
  });

  /**
   * Get system resources health
   */
  fastify.get('/health/system', async (request, reply) => {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();
      
      const systemHealth = {
        status: 'healthy',
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime,
        nodeVersion: process.version,
        platform: process.platform
      };
      
      return {
        success: true,
        data: systemHealth
      };
    } catch (error: any) {
      logger.error('Failed to get system health', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get system health',
        error: error.message
      });
    }
  });

  /**
   * Start health checker service
   */
  fastify.post('/health/start', async (request, reply) => {
    try {
      healthCheckerService.start();
      
      logger.info('Health checker service started');

      return {
        success: true,
        message: 'Health checker service started successfully'
      };
    } catch (error: any) {
      logger.error('Failed to start health checker', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to start health checker',
        error: error.message
      });
    }
  });

  /**
   * Stop health checker service
   */
  fastify.post('/health/stop', async (request, reply) => {
    try {
      healthCheckerService.stop();
      
      logger.info('Health checker service stopped');

      return {
        success: true,
        message: 'Health checker service stopped successfully'
      };
    } catch (error: any) {
      logger.error('Failed to stop health checker', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to stop health checker',
        error: error.message
      });
    }
  });
}
