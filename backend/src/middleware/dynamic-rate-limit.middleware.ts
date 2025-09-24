import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimiter } from './rate-limit.middleware';
import { DevelopmentRateLimiter } from './development-rate-limit.middleware';
import { rateLimitConfigService } from '../services/rate-limit-config.service';

export interface DynamicRateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}

export class DynamicRateLimiter {
  private static configCache = new Map<string, DynamicRateLimitConfig>();
  private static lastCacheUpdate = 0;
  private static cacheTTL = 60000; // 1 minuto

  /**
   * Obtém configuração dinâmica do banco de dados ou cache
   */
  private static async getDynamicConfig(
    environment: string,
    endpointType: string
  ): Promise<DynamicRateLimitConfig | null> {
    try {
      const cacheKey = `${environment}:${endpointType}`;
      const now = Date.now();

      // Verificar se o cache ainda é válido
      if (this.configCache.has(cacheKey) && (now - this.lastCacheUpdate) < this.cacheTTL) {
        return this.configCache.get(cacheKey)!;
      }

      // Buscar configuração do banco de dados
      const config = await rateLimitConfigService.getConfig(environment, endpointType);
      
      if (config) {
        const dynamicConfig: DynamicRateLimitConfig = {
          windowMs: config.windowMs,
          max: config.maxRequests,
          message: config.message || `Too many ${endpointType} requests`,
          skipSuccessfulRequests: config.skipSuccessfulRequests,
        };

        // Atualizar cache
        this.configCache.set(cacheKey, dynamicConfig);
        this.lastCacheUpdate = now;

        return dynamicConfig;
      }

      return null;
    } catch (error) {
      console.error('❌ DYNAMIC RATE LIMIT - Error getting dynamic config:', error);
      return null;
    }
  }

  /**
   * Cria middleware de rate limiting dinâmico
   */
  static createDynamicMiddleware(endpointType: string) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const environment = DevelopmentRateLimiter.detectEnvironment();
        
        // Tentar obter configuração dinâmica
        const dynamicConfig = await this.getDynamicConfig(environment, endpointType);
        
        if (dynamicConfig) {
          // Usar configuração do banco de dados
          const rateLimiter = RateLimiter.create(dynamicConfig);
          await rateLimiter(request, reply);
          return;
        }

        // Fallback para configuração estática baseada no ambiente
        const staticConfig = DevelopmentRateLimiter.getConfig();
        const rateLimiter = staticConfig[endpointType as keyof typeof staticConfig];
        
        if (rateLimiter) {
          await rateLimiter(request, reply);
          return;
        }

        // Fallback para configuração global
        const globalRateLimiter = staticConfig.global;
        await globalRateLimiter(request, reply);
        
      } catch (error) {
        console.error('❌ DYNAMIC RATE LIMIT - Error in middleware:', error);
        
        // Em caso de erro, usar configuração de desenvolvimento como fallback
        const fallbackConfig = DevelopmentRateLimiter.createDevelopmentConfig();
        const fallbackRateLimiter = fallbackConfig[endpointType as keyof typeof fallbackConfig] || fallbackConfig.global;
        await fallbackRateLimiter(request, reply);
      }
    };
  }

  /**
   * Middleware para rate limiting de auth dinâmico
   */
  static async authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const middleware = this.createDynamicMiddleware('auth');
    await middleware(request, reply);
  }

  /**
   * Middleware para rate limiting de API dinâmico
   */
  static async apiMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const middleware = this.createDynamicMiddleware('api');
    await middleware(request, reply);
  }

  /**
   * Middleware para rate limiting de trading dinâmico
   */
  static async tradingMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const middleware = this.createDynamicMiddleware('trading');
    await middleware(request, reply);
  }

  /**
   * Middleware para rate limiting de notifications dinâmico
   */
  static async notificationsMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const middleware = this.createDynamicMiddleware('notifications');
    await middleware(request, reply);
  }

  /**
   * Middleware para rate limiting de payments dinâmico
   */
  static async paymentsMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const middleware = this.createDynamicMiddleware('payments');
    await middleware(request, reply);
  }

  /**
   * Middleware para rate limiting de admin dinâmico
   */
  static async adminMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const middleware = this.createDynamicMiddleware('admin');
    await middleware(request, reply);
  }

  /**
   * Middleware para rate limiting global dinâmico
   */
  static async globalMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const middleware = this.createDynamicMiddleware('global');
    await middleware(request, reply);
  }

  /**
   * Limpa cache de configurações
   */
  static clearCache(): void {
    this.configCache.clear();
    this.lastCacheUpdate = 0;
    console.log('✅ DYNAMIC RATE LIMIT - Cache cleared');
  }

  /**
   * Obtém informações sobre configurações ativas
   */
  static async getActiveConfigs(): Promise<any> {
    try {
      const environment = DevelopmentRateLimiter.detectEnvironment();
      const configs = await rateLimitConfigService.getConfigsByEnvironment(environment);
      
      return {
        environment,
        configs: configs.map(config => ({
          endpointType: config.endpointType,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          windowMinutes: config.windowMinutes,
          message: config.message,
          skipSuccessfulRequests: config.skipSuccessfulRequests,
          isActive: config.isActive,
        })),
        cacheInfo: {
          cachedConfigs: this.configCache.size,
          lastUpdate: new Date(this.lastCacheUpdate),
          cacheAge: Date.now() - this.lastCacheUpdate,
        }
      };
    } catch (error) {
      console.error('❌ DYNAMIC RATE LIMIT - Error getting active configs:', error);
      throw new Error('Failed to get active rate limit configurations');
    }
  }

  /**
   * Força atualização do cache
   */
  static async refreshCache(): Promise<void> {
    try {
      this.clearCache();
      
      // Pré-carregar configurações para o ambiente atual
      const environment = DevelopmentRateLimiter.detectEnvironment();
      const endpointTypes = ['auth', 'api', 'trading', 'notifications', 'payments', 'admin', 'global'];
      
      for (const endpointType of endpointTypes) {
        await this.getDynamicConfig(environment, endpointType);
      }
      
      console.log('✅ DYNAMIC RATE LIMIT - Cache refreshed');
    } catch (error) {
      console.error('❌ DYNAMIC RATE LIMIT - Error refreshing cache:', error);
      throw new Error('Failed to refresh rate limit cache');
    }
  }
}

// Exportar middlewares para uso nas rotas
export const dynamicRateLimiters = {
  auth: DynamicRateLimiter.authMiddleware,
  api: DynamicRateLimiter.apiMiddleware,
  trading: DynamicRateLimiter.tradingMiddleware,
  notifications: DynamicRateLimiter.notificationsMiddleware,
  payments: DynamicRateLimiter.paymentsMiddleware,
  admin: DynamicRateLimiter.adminMiddleware,
  global: DynamicRateLimiter.globalMiddleware,
};
