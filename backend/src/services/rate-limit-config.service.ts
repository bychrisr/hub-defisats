import { PrismaClient } from '@prisma/client';
import { cacheService } from './cache.service';

export interface RateLimitConfigData {
  environment: 'development' | 'staging' | 'production' | 'global';
  endpointType: 'auth' | 'api' | 'trading' | 'notifications' | 'payments' | 'admin' | 'global';
  maxRequests: number;
  windowMs: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  metadata?: any;
}

export interface RateLimitConfigResponse {
  id: string;
  environment: string;
  endpointType: string;
  maxRequests: number;
  windowMs: number;
  windowMinutes: number;
  message?: string;
  skipSuccessfulRequests: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  metadata?: any;
}

export class RateLimitConfigService {
  private prisma: PrismaClient;
  private cacheKey = 'rate-limit-configs';

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Obtém todas as configurações de rate limiting
   */
  async getAllConfigs(): Promise<RateLimitConfigResponse[]> {
    try {
      // Tentar obter do cache primeiro
      const cached = await cacheService.get<RateLimitConfigResponse[]>(this.cacheKey);
      if (cached) {
        return cached;
      }

      // Se não estiver no cache, buscar do banco
      const configs = await this.prisma.rateLimitConfig.findMany({
        where: { isActive: true },
        orderBy: [
          { environment: 'asc' },
          { endpointType: 'asc' }
        ]
      });

      const response = configs.map(config => ({
        id: config.id,
        environment: config.environment,
        endpointType: config.endpointType,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        windowMinutes: Math.round(config.windowMs / 60000),
        message: config.message || undefined,
        skipSuccessfulRequests: config.skipSuccessfulRequests,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        createdBy: config.createdBy || undefined,
        updatedBy: config.updatedBy || undefined,
        metadata: config.metadata || undefined,
      }));

      // Armazenar no cache por 5 minutos
      await cacheService.set(this.cacheKey, response, { ttl: 300 });
      
      return response;
    } catch (error) {
      console.error('❌ RATE LIMIT CONFIG - Error getting all configs:', error);
      throw new Error('Failed to get rate limit configurations');
    }
  }

  /**
   * Obtém configurações por ambiente
   */
  async getConfigsByEnvironment(environment: string): Promise<RateLimitConfigResponse[]> {
    try {
      const configs = await this.getAllConfigs();
      return configs.filter(config => 
        config.environment === environment || config.environment === 'global'
      );
    } catch (error) {
      console.error('❌ RATE LIMIT CONFIG - Error getting configs by environment:', error);
      throw new Error('Failed to get rate limit configurations by environment');
    }
  }

  /**
   * Obtém configuração específica por ambiente e tipo de endpoint
   */
  async getConfig(environment: string, endpointType: string): Promise<RateLimitConfigResponse | null> {
    try {
      const configs = await this.getAllConfigs();
      
      // Primeiro tentar encontrar configuração específica do ambiente
      let config = configs.find(c => 
        c.environment === environment && c.endpointType === endpointType
      );
      
      // Se não encontrar, tentar configuração global
      if (!config) {
        config = configs.find(c => 
          c.environment === 'global' && c.endpointType === endpointType
        );
      }
      
      return config || null;
    } catch (error) {
      console.error('❌ RATE LIMIT CONFIG - Error getting specific config:', error);
      throw new Error('Failed to get rate limit configuration');
    }
  }

  /**
   * Cria ou atualiza configuração de rate limiting
   */
  async upsertConfig(
    data: RateLimitConfigData,
    adminUserId?: string
  ): Promise<RateLimitConfigResponse> {
    try {
      const config = await this.prisma.rateLimitConfig.upsert({
        where: {
          environment_endpointType: {
            environment: data.environment,
            endpointType: data.endpointType,
          }
        },
        update: {
          maxRequests: data.maxRequests,
          windowMs: data.windowMs,
          message: data.message,
          skipSuccessfulRequests: data.skipSuccessfulRequests || false,
          metadata: data.metadata,
          updatedBy: adminUserId,
          updatedAt: new Date(),
        },
        create: {
          environment: data.environment,
          endpointType: data.endpointType,
          maxRequests: data.maxRequests,
          windowMs: data.windowMs,
          message: data.message,
          skipSuccessfulRequests: data.skipSuccessfulRequests || false,
          metadata: data.metadata,
          createdBy: adminUserId,
          updatedBy: adminUserId,
        }
      });

      // Limpar cache para forçar atualização
      await cacheService.delete(this.cacheKey);

      return {
        id: config.id,
        environment: config.environment,
        endpointType: config.endpointType,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        windowMinutes: Math.round(config.windowMs / 60000),
        message: config.message || undefined,
        skipSuccessfulRequests: config.skipSuccessfulRequests,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        createdBy: config.createdBy || undefined,
        updatedBy: config.updatedBy || undefined,
        metadata: config.metadata || undefined,
      };
    } catch (error) {
      console.error('❌ RATE LIMIT CONFIG - Error upserting config:', error);
      throw new Error('Failed to save rate limit configuration');
    }
  }

  /**
   * Ativa/desativa configuração
   */
  async toggleConfig(
    id: string,
    isActive: boolean,
    adminUserId?: string
  ): Promise<RateLimitConfigResponse> {
    try {
      const config = await this.prisma.rateLimitConfig.update({
        where: { id },
        data: {
          isActive,
          updatedBy: adminUserId,
          updatedAt: new Date(),
        }
      });

      // Limpar cache
      await cacheService.delete(this.cacheKey);

      return {
        id: config.id,
        environment: config.environment,
        endpointType: config.endpointType,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        windowMinutes: Math.round(config.windowMs / 60000),
        message: config.message || undefined,
        skipSuccessfulRequests: config.skipSuccessfulRequests,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        createdBy: config.createdBy || undefined,
        updatedBy: config.updatedBy || undefined,
        metadata: config.metadata || undefined,
      };
    } catch (error) {
      console.error('❌ RATE LIMIT CONFIG - Error toggling config:', error);
      throw new Error('Failed to toggle rate limit configuration');
    }
  }

  /**
   * Remove configuração
   */
  async deleteConfig(id: string): Promise<boolean> {
    try {
      await this.prisma.rateLimitConfig.delete({
        where: { id }
      });

      // Limpar cache
      await cacheService.delete(this.cacheKey);

      return true;
    } catch (error) {
      console.error('❌ RATE LIMIT CONFIG - Error deleting config:', error);
      throw new Error('Failed to delete rate limit configuration');
    }
  }

  /**
   * Inicializa configurações padrão para todos os ambientes
   */
  async initializeDefaultConfigs(adminUserId?: string): Promise<void> {
    try {
      const defaultConfigs: RateLimitConfigData[] = [
        // Development
        { environment: 'development', endpointType: 'auth', maxRequests: 50, windowMs: 5 * 60 * 1000, message: 'Too many authentication attempts in development. Please wait 5 minutes.' },
        { environment: 'development', endpointType: 'api', maxRequests: 1000, windowMs: 60 * 1000, message: 'Too many requests in development. Please slow down.' },
        { environment: 'development', endpointType: 'trading', maxRequests: 2000, windowMs: 60 * 1000, message: 'Too many trading requests in development. Please slow down.' },
        { environment: 'development', endpointType: 'notifications', maxRequests: 300, windowMs: 60 * 1000, message: 'Too many notification requests in development. Please slow down.' },
        { environment: 'development', endpointType: 'payments', maxRequests: 100, windowMs: 60 * 1000, message: 'Too many payment requests in development. Please slow down.' },
        { environment: 'development', endpointType: 'admin', maxRequests: 500, windowMs: 60 * 1000, message: 'Too many admin requests in development. Please slow down.' },
        { environment: 'development', endpointType: 'global', maxRequests: 2000, windowMs: 60 * 1000, message: 'Global rate limit exceeded in development.' },

        // Staging
        { environment: 'staging', endpointType: 'auth', maxRequests: 20, windowMs: 10 * 60 * 1000, message: 'Too many authentication attempts in staging. Please wait 10 minutes.' },
        { environment: 'staging', endpointType: 'api', maxRequests: 500, windowMs: 60 * 1000, message: 'Too many requests in staging. Please slow down.' },
        { environment: 'staging', endpointType: 'trading', maxRequests: 1000, windowMs: 60 * 1000, message: 'Too many trading requests in staging. Please slow down.' },
        { environment: 'staging', endpointType: 'notifications', maxRequests: 150, windowMs: 60 * 1000, message: 'Too many notification requests in staging. Please slow down.' },
        { environment: 'staging', endpointType: 'payments', maxRequests: 50, windowMs: 60 * 1000, message: 'Too many payment requests in staging. Please slow down.' },
        { environment: 'staging', endpointType: 'admin', maxRequests: 250, windowMs: 60 * 1000, message: 'Too many admin requests in staging. Please slow down.' },
        { environment: 'staging', endpointType: 'global', maxRequests: 1500, windowMs: 60 * 1000, message: 'Global rate limit exceeded in staging.' },

        // Production
        { environment: 'production', endpointType: 'auth', maxRequests: 5, windowMs: 15 * 60 * 1000, message: 'Too many authentication attempts. Please wait 15 minutes before trying again.' },
        { environment: 'production', endpointType: 'api', maxRequests: 100, windowMs: 60 * 1000, message: 'Too many requests. Please slow down.' },
        { environment: 'production', endpointType: 'trading', maxRequests: 200, windowMs: 60 * 1000, message: 'Too many trading requests. Please slow down.' },
        { environment: 'production', endpointType: 'notifications', maxRequests: 30, windowMs: 60 * 1000, message: 'Too many notification requests. Please slow down.' },
        { environment: 'production', endpointType: 'payments', maxRequests: 10, windowMs: 60 * 1000, message: 'Too many payment requests. Please slow down.' },
        { environment: 'production', endpointType: 'admin', maxRequests: 50, windowMs: 60 * 1000, message: 'Too many admin requests. Please slow down.' },
        { environment: 'production', endpointType: 'global', maxRequests: 1000, windowMs: 60 * 1000, message: 'Global rate limit exceeded.' },
      ];

      for (const configData of defaultConfigs) {
        await this.upsertConfig(configData, adminUserId);
      }

      console.log('✅ RATE LIMIT CONFIG - Default configurations initialized');
    } catch (error) {
      console.error('❌ RATE LIMIT CONFIG - Error initializing default configs:', error);
      throw new Error('Failed to initialize default rate limit configurations');
    }
  }

  /**
   * Obtém estatísticas de uso das configurações
   */
  async getConfigStats(): Promise<any> {
    try {
      const configs = await this.getAllConfigs();
      
      const stats = {
        total: configs.length,
        byEnvironment: {} as Record<string, number>,
        byEndpointType: {} as Record<string, number>,
        active: configs.filter(c => c.isActive).length,
        inactive: configs.filter(c => !c.isActive).length,
      };

      configs.forEach(config => {
        stats.byEnvironment[config.environment] = (stats.byEnvironment[config.environment] || 0) + 1;
        stats.byEndpointType[config.endpointType] = (stats.byEndpointType[config.endpointType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ RATE LIMIT CONFIG - Error getting config stats:', error);
      throw new Error('Failed to get rate limit configuration statistics');
    }
  }

  /**
   * Valida dados de configuração
   */
  validateConfigData(data: RateLimitConfigData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.environment || !['development', 'staging', 'production', 'global'].includes(data.environment)) {
      errors.push('Environment must be development, staging, production, or global');
    }

    if (!data.endpointType || !['auth', 'api', 'trading', 'notifications', 'payments', 'admin', 'global'].includes(data.endpointType)) {
      errors.push('Endpoint type must be auth, api, trading, notifications, payments, admin, or global');
    }

    if (!data.maxRequests || data.maxRequests < 1 || data.maxRequests > 10000) {
      errors.push('Max requests must be between 1 and 10000');
    }

    if (!data.windowMs || data.windowMs < 1000 || data.windowMs > 3600000) {
      errors.push('Window must be between 1 second and 1 hour');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Instância singleton
export const rateLimitConfigService = new RateLimitConfigService();
