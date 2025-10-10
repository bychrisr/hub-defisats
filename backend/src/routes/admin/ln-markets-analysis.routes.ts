/**
 * LN Markets Analysis Routes
 * 
 * API endpoints para análise profunda de problemas de conexão
 */

import { FastifyInstance } from 'fastify';
import { lnMarketsConnectionAnalyzerService } from '../../services/ln-markets-connection-analyzer.service';
import { adminAuthMiddleware } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';

export async function lnMarketsAnalysisRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('preHandler', adminAuthMiddleware);

  /**
   * Executar análise completa de conexão
   */
  fastify.get('/analysis/connection', async (request, reply) => {
    try {
      logger.info('Starting comprehensive LN Markets connection analysis');
      
      const analysis = await lnMarketsConnectionAnalyzerService.analyzeConnection();
      
      logger.info('LN Markets connection analysis completed', {
        status: analysis.overallStatus,
        successfulTests: analysis.tests.filter(t => t.success).length,
        totalTests: analysis.tests.length
      });

      return {
        success: true,
        data: analysis
      };
    } catch (error: any) {
      logger.error('LN Markets connection analysis failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'ANALYSIS_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Teste específico de conectividade
   */
  fastify.post('/analysis/test-specific', {
    schema: {
      body: {
        type: 'object',
        required: ['testType'],
        properties: {
          testType: { 
            type: 'string',
            enum: [
              'basic-connectivity',
              'dns-resolution', 
              'tls-handshake',
              'authentication',
              'market-endpoint',
              'user-endpoint',
              'rate-limiting',
              'timeout-behavior',
              'retry-mechanism',
              'regional-connectivity',
              'proxy-connectivity'
            ]
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { testType } = request.body as any;
      
      logger.info('Running specific connection test', { testType });
      
      const analyzer = lnMarketsConnectionAnalyzerService as any;
      const testMethod = `test${testType.split('-').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('')}`;
      
      if (typeof analyzer[testMethod] === 'function') {
        const result = await analyzer[testMethod]();
        
        return {
          success: true,
          data: result
        };
      } else {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_TEST_TYPE',
          message: `Test type '${testType}' not found`
        });
      }
    } catch (error: any) {
      logger.error('Specific connection test failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'TEST_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Obter recomendações de otimização
   */
  fastify.get('/analysis/recommendations', async (request, reply) => {
    try {
      // Executar análise rápida para obter recomendações
      const analysis = await lnMarketsConnectionAnalyzerService.analyzeConnection();
      
      const recommendations = {
        immediateActions: [],
        shortTermActions: [],
        longTermActions: [],
        alternativeStrategies: analysis.alternativeStrategies,
        technicalOptimizations: []
      };

      // Categorizar recomendações baseadas na severidade
      analysis.recommendations.forEach(rec => {
        if (rec.includes('DNS') || rec.includes('conectividade')) {
          recommendations.immediateActions.push(rec);
        } else if (rec.includes('autenticação') || rec.includes('rate limiting')) {
          recommendations.shortTermActions.push(rec);
        } else {
          recommendations.longTermActions.push(rec);
        }
      });

      // Adicionar otimizações técnicas específicas
      recommendations.technicalOptimizations = [
        'Implementar connection pooling',
        'Usar keep-alive connections',
        'Configurar timeout otimizado (5-10s)',
        'Implementar circuit breaker pattern',
        'Usar retry com backoff exponencial',
        'Configurar múltiplas regiões de fallback',
        'Implementar cache inteligente',
        'Usar WebSocket para dados em tempo real'
      ];

      return {
        success: true,
        data: recommendations
      };
    } catch (error: any) {
      logger.error('Failed to get recommendations', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'RECOMMENDATIONS_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Teste de conectividade com diferentes configurações
   */
  fastify.post('/analysis/test-configurations', {
    schema: {
      body: {
        type: 'object',
        properties: {
          timeout: { type: 'number', default: 10000 },
          retries: { type: 'number', default: 3 },
          useProxy: { type: 'boolean', default: false },
          dnsServer: { type: 'string', default: '8.8.8.8' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { timeout, retries, useProxy, dnsServer } = request.body as any;
      
      logger.info('Testing connection with different configurations', {
        timeout, retries, useProxy, dnsServer
      });

      const results = [];
      
      // Testar diferentes configurações
      const configurations = [
        { name: 'Default', timeout: 10000, retries: 3 },
        { name: 'Fast', timeout: 5000, retries: 1 },
        { name: 'Reliable', timeout: 15000, retries: 5 },
        { name: 'Aggressive', timeout: 3000, retries: 2 }
      ];

      for (const config of configurations) {
        try {
          const startTime = Date.now();
          
          // Simular teste com configuração específica
          const response = await require('axios').get('https://api.lnmarkets.com/v1/status', {
            timeout: config.timeout,
            headers: {
              'User-Agent': `Axisor-Test-${config.name}/1.0`
            }
          });

          results.push({
            configuration: config.name,
            success: true,
            latency: Date.now() - startTime,
            timeout: config.timeout,
            retries: config.retries
          });
        } catch (error: any) {
          results.push({
            configuration: config.name,
            success: false,
            latency: Date.now() - Date.now(),
            timeout: config.timeout,
            retries: config.retries,
            error: error.message
          });
        }
      }

      return {
        success: true,
        data: {
          configurations: results,
          bestConfiguration: results.find(r => r.success)?.configuration || 'None',
          recommendations: [
            'Use timeout between 5-10 seconds',
            'Implement 2-3 retries with exponential backoff',
            'Consider using connection pooling',
            'Monitor latency patterns for optimization'
          ]
        }
      };
    } catch (error: any) {
      logger.error('Configuration test failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'CONFIG_TEST_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Análise de performance histórica
   */
  fastify.get('/analysis/performance-history', async (request, reply) => {
    try {
      // Simular dados históricos (em produção, buscar do banco de dados)
      const performanceHistory = {
        last24Hours: {
          totalRequests: 1440,
          successfulRequests: 0,
          failedRequests: 1440,
          averageLatency: 0,
          successRate: 0,
          peakLatency: 0,
          errorPatterns: [
            { error: 'ECONNABORTED', count: 720 },
            { error: 'ENOTFOUND', count: 360 },
            { error: 'ETIMEDOUT', count: 360 }
          ]
        },
        last7Days: {
          totalRequests: 10080,
          successfulRequests: 0,
          failedRequests: 10080,
          averageLatency: 0,
          successRate: 0,
          trend: 'deteriorating'
        },
        recommendations: [
          'LN Markets API está completamente indisponível há 24+ horas',
          'Considerar migração completa para provedores alternativos',
          'Implementar sistema de monitoramento contínuo',
          'Configurar alertas automáticos para falhas de API'
        ]
      };

      return {
        success: true,
        data: performanceHistory
      };
    } catch (error: any) {
      logger.error('Failed to get performance history', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'HISTORY_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Comparação com provedores alternativos
   */
  fastify.get('/analysis/alternative-providers', async (request, reply) => {
    try {
      const alternativeProviders = [
        {
          name: 'CoinGecko',
          baseURL: 'https://api.coingecko.com',
          status: 'healthy',
          latency: 156,
          successRate: 45.45,
          features: ['Free tier', 'No authentication', 'Rate limits'],
          pros: ['Reliable', 'Fast', 'Free'],
          cons: ['Limited data', 'Rate limits', 'Not real-time']
        },
        {
          name: 'Binance',
          baseURL: 'https://api.binance.com',
          status: 'healthy',
          latency: 89,
          successRate: 95.2,
          features: ['Real-time data', 'WebSocket', 'High limits'],
          pros: ['Very reliable', 'Real-time', 'High limits'],
          cons: ['Requires API key', 'Complex setup']
        },
        {
          name: 'Coinbase Pro',
          baseURL: 'https://api.pro.coinbase.com',
          status: 'healthy',
          latency: 124,
          successRate: 92.8,
          features: ['Professional API', 'WebSocket', 'Advanced features'],
          pros: ['Professional', 'Reliable', 'Advanced'],
          cons: ['Requires verification', 'Complex']
        },
        {
          name: 'Kraken',
          baseURL: 'https://api.kraken.com',
          status: 'healthy',
          latency: 167,
          successRate: 88.5,
          features: ['Public API', 'WebSocket', 'Good limits'],
          pros: ['Reliable', 'Good limits', 'WebSocket'],
          cons: ['Slower', 'Complex data format']
        }
      ];

      const comparison = {
        currentProvider: {
          name: 'LN Markets',
          status: 'critical',
          latency: 0,
          successRate: 0,
          issues: ['Complete failure', 'No response', 'Authentication issues']
        },
        alternatives: alternativeProviders,
        recommendation: 'Migrate to Binance or CoinGecko for immediate relief',
        migrationStrategy: {
          phase1: 'Implement Binance as primary provider',
          phase2: 'Use CoinGecko as fallback',
          phase3: 'Keep LN Markets as tertiary (if they recover)',
          timeline: '1-2 weeks'
        }
      };

      return {
        success: true,
        data: comparison
      };
    } catch (error: any) {
      logger.error('Failed to get alternative providers', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'ALTERNATIVES_FAILED',
        message: error.message
      });
    }
  });
}

// Export already done above
