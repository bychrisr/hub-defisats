/**
 * LN Markets Discovery Routes
 * 
 * Rotas para descobrir endpoints funcionais da LN Markets
 */

import { FastifyInstance } from 'fastify';
import { lnMarketsEndpointDiscoveryService } from '../../services/ln-markets-endpoint-discovery.service';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { logger } from '../../utils/logger';

export async function lnMarketsDiscoveryRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('preHandler', async (request, reply) => {
    await adminMiddleware(request, reply);
  });

  /**
   * Descobrir endpoints funcionais
   */
  fastify.get('/discovery/endpoints', async (request, reply) => {
    try {
      logger.info('Starting LN Markets endpoint discovery');
      
      const discovery = await lnMarketsEndpointDiscoveryService.discoverEndpoints();
      
      logger.info('LN Markets endpoint discovery completed', {
        workingEndpoints: discovery.workingEndpoints.length,
        failedEndpoints: discovery.failedEndpoints.length,
        bestBaseURL: discovery.baseURL
      });

      return {
        success: true,
        data: discovery
      };
    } catch (error: any) {
      logger.error('LN Markets endpoint discovery failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'DISCOVERY_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Verificar status geral da LN Markets
   */
  fastify.get('/discovery/status', async (request, reply) => {
    try {
      logger.info('Checking LN Markets overall status');
      
      const status = await lnMarketsEndpointDiscoveryService.checkLNMarketsStatus();
      
      logger.info('LN Markets status check completed', {
        online: status.online,
        latency: status.latency
      });

      return {
        success: true,
        data: status
      };
    } catch (error: any) {
      logger.error('LN Markets status check failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'STATUS_CHECK_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Testar conectividade básica
   */
  fastify.get('/discovery/connectivity', async (request, reply) => {
    try {
      logger.info('Testing LN Markets basic connectivity');
      
      const connectivity = await lnMarketsEndpointDiscoveryService.testBasicConnectivity();
      
      logger.info('LN Markets connectivity test completed', {
        success: connectivity.success,
        latency: connectivity.latency
      });

      return {
        success: true,
        data: connectivity
      };
    } catch (error: any) {
      logger.error('LN Markets connectivity test failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'CONNECTIVITY_TEST_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Obter recomendações de configuração
   */
  fastify.get('/discovery/recommendations', async (request, reply) => {
    try {
      logger.info('Generating LN Markets configuration recommendations');
      
      // Executar descoberta completa
      const discovery = await lnMarketsEndpointDiscoveryService.discoverEndpoints();
      const status = await lnMarketsEndpointDiscoveryService.checkLNMarketsStatus();
      
      const recommendations = {
        immediateActions: [],
        configurationChanges: [],
        fallbackStrategies: [],
        monitoringSuggestions: []
      };

      // Ações imediatas baseadas na descoberta
      if (discovery.workingEndpoints.length === 0) {
        recommendations.immediateActions.push('LN Markets está completamente offline - ativar fallback imediato');
        recommendations.immediateActions.push('Notificar usuários sobre indisponibilidade');
        recommendations.immediateActions.push('Usar dados em cache se disponível');
      } else if (discovery.workingEndpoints.length < 5) {
        recommendations.immediateActions.push('LN Markets com funcionalidade limitada - implementar fallback parcial');
        recommendations.immediateActions.push('Monitorar endpoints funcionais');
      }

      // Mudanças de configuração
      if (discovery.baseURL !== 'none') {
        recommendations.configurationChanges.push(`Atualizar base URL para: ${discovery.baseURL}`);
        recommendations.configurationChanges.push('Configurar timeout otimizado (5-10 segundos)');
        recommendations.configurationChanges.push('Implementar retry com backoff exponencial');
      }

      // Estratégias de fallback
      recommendations.fallbackStrategies.push('Usar CoinGecko para dados de mercado básicos');
      recommendations.fallbackStrategies.push('Implementar cache local com TTL de 30 segundos');
      recommendations.fallbackStrategies.push('Configurar alertas automáticos para falhas');
      recommendations.fallbackStrategies.push('Manter dados históricos para análise offline');

      // Sugestões de monitoramento
      recommendations.monitoringSuggestions.push('Monitorar endpoints funcionais a cada 30 segundos');
      recommendations.monitoringSuggestions.push('Alertar quando taxa de sucesso < 70%');
      recommendations.monitoringSuggestions.push('Registrar latência média por endpoint');
      recommendations.monitoringSuggestions.push('Monitorar mudanças de status HTTP');

      return {
        success: true,
        data: {
          discovery,
          status,
          recommendations
        }
      };
    } catch (error: any) {
      logger.error('Failed to generate recommendations', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'RECOMMENDATIONS_FAILED',
        message: error.message
      });
    }
  });
}
