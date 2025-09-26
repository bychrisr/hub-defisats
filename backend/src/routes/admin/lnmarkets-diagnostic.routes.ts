/**
 * LN Markets Diagnostic Routes
 * 
 * API endpoints for testing and analyzing LN Markets API performance
 */

import { FastifyInstance } from 'fastify';
import { lnMarketsDiagnosticService } from '../../services/lnmarkets-diagnostic.service';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { logger } from '../../utils/logger';

export async function lnMarketsDiagnosticRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('preHandler', async (request, reply) => {
    await adminMiddleware(request, reply);
  });

  /**
   * Run comprehensive diagnostic test
   */
  fastify.get('/diagnostic/full', async (request, reply) => {
    try {
      logger.info('Starting full LN Markets diagnostic');
      
      const result = await lnMarketsDiagnosticService.runFullDiagnostic();
      
      logger.info('LN Markets diagnostic completed', {
        connectionQuality: result.analysis.connectionQuality,
        averageLatency: result.analysis.averageLatency,
        successRate: result.analysis.successRate
      });

      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      logger.error('LN Markets diagnostic failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'Diagnostic test failed',
        message: error.message
      });
    }
  });

  /**
   * Test specific endpoint
   */
  fastify.post('/diagnostic/test-endpoint', {
    schema: {
      body: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string' },
          method: { type: 'string', default: 'GET' },
          requiresAuth: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { path, method, requiresAuth } = request.body as any;
      
      logger.info('Testing specific endpoint', { path, method, requiresAuth });
      
      const result = await lnMarketsDiagnosticService.testSpecificEndpoint(path, method, requiresAuth);
      
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      logger.error('Endpoint test failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'Endpoint test failed',
        message: error.message
      });
    }
  });

  /**
   * Run continuous monitoring
   */
  fastify.post('/diagnostic/continuous-monitoring', {
    schema: {
      body: {
        type: 'object',
        properties: {
          durationMinutes: { type: 'number', default: 5, minimum: 1, maximum: 60 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { durationMinutes = 5 } = request.body as any;
      
      logger.info('Starting continuous monitoring', { durationMinutes });
      
      // Run monitoring in background
      const monitoringPromise = lnMarketsDiagnosticService.runContinuousMonitoring(durationMinutes);
      
      // Return immediately with monitoring ID
      const monitoringId = `monitoring_${Date.now()}`;
      
      // Store monitoring promise for later retrieval
      (fastify as any).monitoringTasks = (fastify as any).monitoringTasks || {};
      (fastify as any).monitoringTasks[monitoringId] = monitoringPromise;
      
      return {
        success: true,
        data: {
          monitoringId,
          durationMinutes,
          status: 'started',
          message: `Continuous monitoring started for ${durationMinutes} minutes`
        }
      };
    } catch (error: any) {
      logger.error('Continuous monitoring failed to start', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'Continuous monitoring failed to start',
        message: error.message
      });
    }
  });

  /**
   * Get monitoring results
   */
  fastify.get('/diagnostic/monitoring-results/:monitoringId', async (request, reply) => {
    try {
      const { monitoringId } = request.params as any;
      
      const monitoringTasks = (fastify as any).monitoringTasks || {};
      const monitoringPromise = monitoringTasks[monitoringId];
      
      if (!monitoringPromise) {
        return reply.status(404).send({
          success: false,
          error: 'Monitoring task not found'
        });
      }
      
      // Check if monitoring is still running
      try {
        const results = await Promise.race([
          monitoringPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Still running')), 100))
        ]);
        
        // Monitoring completed
        delete monitoringTasks[monitoringId];
        
        return {
          success: true,
          data: {
            monitoringId,
            status: 'completed',
            results
          }
        };
      } catch (error: any) {
        if (error.message === 'Still running') {
          return {
            success: true,
            data: {
              monitoringId,
              status: 'running',
              message: 'Monitoring is still in progress'
            }
          };
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('Failed to get monitoring results', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'Failed to get monitoring results',
        message: error.message
      });
    }
  });

  /**
   * Test connection quality
   */
  fastify.get('/diagnostic/connection-test', async (request, reply) => {
    try {
      logger.info('Running connection quality test');
      
      // Run multiple quick tests
      const tests = [];
      for (let i = 0; i < 5; i++) {
        tests.push(lnMarketsDiagnosticService.testSpecificEndpoint('/v1/status', 'GET', false));
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between tests
      }
      
      const results = await Promise.all(tests);
      
      const analysis = {
        totalTests: results.length,
        successfulTests: results.filter(r => r.status === 'success').length,
        averageLatency: results
          .filter(r => r.status === 'success')
          .reduce((sum, r) => sum + r.latency, 0) / results.filter(r => r.status === 'success').length,
        latencies: results.map(r => r.latency),
        errors: results.filter(r => r.status === 'error').map(r => r.error)
      };
      
      return {
        success: true,
        data: analysis
      };
    } catch (error: any) {
      logger.error('Connection test failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'Connection test failed',
        message: error.message
      });
    }
  });

  /**
   * Get diagnostic recommendations
   */
  fastify.get('/diagnostic/recommendations', async (request, reply) => {
    try {
      // Run quick diagnostic to get current recommendations
      const diagnostic = await lnMarketsDiagnosticService.runFullDiagnostic();
      
      const recommendations = {
        currentStatus: diagnostic.analysis.connectionQuality,
        averageLatency: diagnostic.analysis.averageLatency,
        successRate: diagnostic.analysis.successRate,
        recommendations: diagnostic.analysis.recommendations,
        immediateActions: [],
        longTermActions: []
      };

      // Add immediate actions based on current status
      if (diagnostic.analysis.connectionQuality === 'critical') {
        recommendations.immediateActions.push(
          'Implementar fallback para dados de mercado',
          'Configurar retry automático com backoff exponencial',
          'Verificar configuração de autenticação'
        );
      }

      if (diagnostic.analysis.averageLatency > 1000) {
        recommendations.immediateActions.push(
          'Implementar cache local para dados de mercado',
          'Configurar timeout mais agressivo (5-10s)',
          'Considerar usar CDN para dados estáticos'
        );
      }

      // Add long-term actions
      recommendations.longTermActions.push(
        'Implementar múltiplos provedores de dados',
        'Configurar monitoramento contínuo de latência',
        'Implementar circuit breaker pattern',
        'Considerar usar WebSocket para dados em tempo real'
      );

      return {
        success: true,
        data: recommendations
      };
    } catch (error: any) {
      logger.error('Failed to get recommendations', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'Failed to get recommendations',
        message: error.message
      });
    }
  });
}
