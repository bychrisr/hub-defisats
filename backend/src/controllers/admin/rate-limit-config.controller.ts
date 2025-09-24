import { FastifyRequest, FastifyReply } from 'fastify';
import { rateLimitConfigService, RateLimitConfigData } from '../../services/rate-limit-config.service';
import { DynamicRateLimiter } from '../../middleware/dynamic-rate-limit.middleware';
import { DevelopmentRateLimiter } from '../../middleware/development-rate-limit.middleware';

export class RateLimitConfigController {
  /**
   * Obtém todas as configurações de rate limiting
   */
  async getAllConfigs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const configs = await rateLimitConfigService.getAllConfigs();
      
      return reply.send({
        success: true,
        data: configs,
        meta: {
          total: configs.length,
          environments: [...new Set(configs.map(c => c.environment))],
          endpointTypes: [...new Set(configs.map(c => c.endpointType))],
        }
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error getting all configs:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get rate limit configurations'
      });
    }
  }

  /**
   * Obtém configurações por ambiente
   */
  async getConfigsByEnvironment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { environment } = request.params as { environment: string };
      
      if (!environment || !['development', 'staging', 'production', 'global'].includes(environment)) {
        return reply.code(400).send({
          success: false,
          error: 'INVALID_ENVIRONMENT',
          message: 'Environment must be development, staging, production, or global'
        });
      }

      const configs = await rateLimitConfigService.getConfigsByEnvironment(environment);
      
      return reply.send({
        success: true,
        data: configs,
        meta: {
          environment,
          total: configs.length,
        }
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error getting configs by environment:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get rate limit configurations by environment'
      });
    }
  }

  /**
   * Obtém configuração específica
   */
  async getConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { environment, endpointType } = request.params as { 
        environment: string; 
        endpointType: string; 
      };
      
      const config = await rateLimitConfigService.getConfig(environment, endpointType);
      
      if (!config) {
        return reply.code(404).send({
          success: false,
          error: 'CONFIG_NOT_FOUND',
          message: 'Rate limit configuration not found'
        });
      }

      return reply.send({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error getting specific config:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get rate limit configuration'
      });
    }
  }

  /**
   * Cria ou atualiza configuração
   */
  async upsertConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as RateLimitConfigData;
      const adminUserId = (request as any).user?.id;

      // Validar dados
      const validation = rateLimitConfigService.validateConfigData(data);
      if (!validation.isValid) {
        return reply.code(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid configuration data',
          details: validation.errors
        });
      }

      const config = await rateLimitConfigService.upsertConfig(data, adminUserId);
      
      // Limpar cache para aplicar mudanças imediatamente
      DynamicRateLimiter.clearCache();
      
      return reply.send({
        success: true,
        data: config,
        message: 'Rate limit configuration saved successfully'
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error upserting config:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save rate limit configuration'
      });
    }
  }

  /**
   * Ativa/desativa configuração
   */
  async toggleConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { isActive } = request.body as { isActive: boolean };
      const adminUserId = (request as any).user?.id;

      if (typeof isActive !== 'boolean') {
        return reply.code(400).send({
          success: false,
          error: 'INVALID_DATA',
          message: 'isActive must be a boolean value'
        });
      }

      const config = await rateLimitConfigService.toggleConfig(id, isActive, adminUserId);
      
      // Limpar cache para aplicar mudanças imediatamente
      DynamicRateLimiter.clearCache();
      
      return reply.send({
        success: true,
        data: config,
        message: `Configuration ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error toggling config:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to toggle rate limit configuration'
      });
    }
  }

  /**
   * Remove configuração
   */
  async deleteConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      await rateLimitConfigService.deleteConfig(id);
      
      // Limpar cache
      DynamicRateLimiter.clearCache();
      
      return reply.send({
        success: true,
        message: 'Rate limit configuration deleted successfully'
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error deleting config:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete rate limit configuration'
      });
    }
  }

  /**
   * Inicializa configurações padrão
   */
  async initializeDefaults(request: FastifyRequest, reply: FastifyReply) {
    try {
      const adminUserId = (request as any).user?.id;

      await rateLimitConfigService.initializeDefaultConfigs(adminUserId);
      
      // Limpar cache
      DynamicRateLimiter.clearCache();
      
      return reply.send({
        success: true,
        message: 'Default rate limit configurations initialized successfully'
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error initializing defaults:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to initialize default configurations'
      });
    }
  }

  /**
   * Obtém estatísticas das configurações
   */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await rateLimitConfigService.getConfigStats();
      
      return reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error getting stats:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get configuration statistics'
      });
    }
  }

  /**
   * Obtém configurações ativas para o ambiente atual
   */
  async getActiveConfigs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const activeConfigs = await DynamicRateLimiter.getActiveConfigs();
      
      return reply.send({
        success: true,
        data: activeConfigs
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error getting active configs:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get active rate limit configurations'
      });
    }
  }

  /**
   * Força atualização do cache
   */
  async refreshCache(request: FastifyRequest, reply: FastifyReply) {
    try {
      await DynamicRateLimiter.refreshCache();
      
      return reply.send({
        success: true,
        message: 'Rate limit cache refreshed successfully'
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error refreshing cache:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to refresh rate limit cache'
      });
    }
  }

  /**
   * Obtém informações sobre detecção de ambiente
   */
  async getEnvironmentInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const environment = DevelopmentRateLimiter.detectEnvironment();
      const rateLimitInfo = require('../../middleware/development-rate-limit.middleware').getRateLimitInfo();
      
      return reply.send({
        success: true,
        data: {
          detectedEnvironment: environment,
          rateLimitInfo,
          environmentVariables: {
            NODE_ENV: process.env.NODE_ENV,
            ENVIRONMENT: process.env.ENVIRONMENT,
            PORT: process.env.PORT,
            CORS_ORIGIN: process.env.CORS_ORIGIN,
          }
        }
      });
    } catch (error) {
      console.error('❌ ADMIN RATE LIMIT - Error getting environment info:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get environment information'
      });
    }
  }
}
