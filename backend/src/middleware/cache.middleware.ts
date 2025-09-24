import { FastifyRequest, FastifyReply } from 'fastify';
import { strategicCache } from '../services/strategic-cache.service';

export interface CacheMiddlewareOptions {
  strategy: string;
  keyGenerator: (request: FastifyRequest) => string;
  ttl?: number;
  skipCache?: (request: FastifyRequest) => boolean;
  onCacheHit?: (request: FastifyRequest, reply: FastifyReply, data: any) => void;
  onCacheMiss?: (request: FastifyRequest, reply: FastifyReply) => void;
}

export class CacheMiddleware {
  /**
   * Middleware de cache genérico
   */
  static create(options: CacheMiddlewareOptions) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Verificar se deve pular o cache
      if (options.skipCache && options.skipCache(request)) {
        return;
      }

      // Gerar chave de cache
      const cacheKey = options.keyGenerator(request);
      
      try {
        // Tentar obter dados do cache
        const cachedData = await strategicCache.get(options.strategy, cacheKey);
        
        if (cachedData !== null) {
          // Cache hit - retornar dados em cache
          reply.header('X-Cache', 'HIT');
          reply.header('X-Cache-Key', cacheKey);
          
          if (options.onCacheHit) {
            options.onCacheHit(request, reply, cachedData);
          }
          
          return reply.send(cachedData);
        } else {
          // Cache miss - continuar para o handler
          reply.header('X-Cache', 'MISS');
          reply.header('X-Cache-Key', cacheKey);
          
          if (options.onCacheMiss) {
            options.onCacheMiss(request, reply);
          }
        }
      } catch (error) {
        console.error('❌ CACHE MIDDLEWARE - Error:', error);
        // Em caso de erro, continuar sem cache
        reply.header('X-Cache', 'ERROR');
      }
    };
  }

  /**
   * Middleware de cache para dados de usuário
   */
  static userCache() {
    return this.create({
      strategy: 'user',
      keyGenerator: (request) => {
        const userId = (request as any).user?.id;
        return userId || 'anonymous';
      },
      skipCache: (request) => {
        // Pular cache para requisições POST, PUT, DELETE
        return ['POST', 'PUT', 'DELETE'].includes(request.method);
      },
    });
  }

  /**
   * Middleware de cache para posições
   */
  static positionsCache() {
    return this.create({
      strategy: 'positions',
      keyGenerator: (request) => {
        const userId = (request as any).user?.id;
        return userId || 'anonymous';
      },
      skipCache: (request) => {
        return ['POST', 'PUT', 'DELETE'].includes(request.method);
      },
    });
  }

  /**
   * Middleware de cache para configurações
   */
  static configCache() {
    return this.create({
      strategy: 'config',
      keyGenerator: () => 'system',
      skipCache: (request) => {
        return ['POST', 'PUT', 'DELETE'].includes(request.method);
      },
    });
  }

  /**
   * Middleware de cache para dados de mercado
   */
  static marketCache() {
    return this.create({
      strategy: 'market',
      keyGenerator: (request) => {
        const symbol = (request.query as any)?.symbol || 'BTC';
        return symbol;
      },
      ttl: 60, // 1 minuto para dados de mercado
    });
  }

  /**
   * Middleware de cache para dados históricos
   */
  static historicalCache() {
    return this.create({
      strategy: 'historical',
      keyGenerator: (request) => {
        const symbol = (request.query as any)?.symbol || 'BTC';
        const timeframe = (request.query as any)?.timeframe || '1h';
        return `${symbol}:${timeframe}`;
      },
    });
  }

  /**
   * Middleware de cache para planos
   */
  static plansCache() {
    return this.create({
      strategy: 'config',
      keyGenerator: () => 'plans',
      skipCache: (request) => {
        return ['POST', 'PUT', 'DELETE'].includes(request.method);
      },
    });
  }

  /**
   * Middleware de cache para automações
   */
  static automationsCache() {
    return this.create({
      strategy: 'config',
      keyGenerator: (request) => {
        const userId = (request as any).user?.id;
        return `automations:${userId}`;
      },
      skipCache: (request) => {
        return ['POST', 'PUT', 'DELETE'].includes(request.method);
      },
    });
  }

  /**
   * Middleware de cache para sessões
   */
  static sessionCache() {
    return this.create({
      strategy: 'session',
      keyGenerator: (request) => {
        const sessionId = (request as any).session?.id;
        return sessionId || 'anonymous';
      },
    });
  }
}

/**
 * Decorator para aplicar cache em métodos
 */
export function Cacheable(strategy: string, keyGenerator: (args: any[]) => string, ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(args);
      
      try {
        // Tentar obter do cache
        const cachedData = await strategicCache.get(strategy, cacheKey);
        
        if (cachedData !== null) {
          console.log(`✅ CACHE DECORATOR - Cache hit for ${strategy}:${cacheKey}`);
          return cachedData;
        }
        
        // Cache miss - executar método original
        console.log(`🔄 CACHE DECORATOR - Cache miss for ${strategy}:${cacheKey}`);
        const result = await method.apply(this, args);
        
        // Armazenar resultado no cache
        if (result !== null && result !== undefined) {
          await strategicCache.set(strategy, cacheKey, result);
          if (ttl) {
            await strategicCache.expire(strategy, cacheKey, ttl);
          }
        }
        
        return result;
      } catch (error) {
        console.error(`❌ CACHE DECORATOR - Error for ${strategy}:${cacheKey}:`, error);
        // Em caso de erro, executar método original
        return await method.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * Decorator para invalidar cache após operações
 */
export function CacheInvalidate(strategy: string, keyGenerator: (args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      try {
        const cacheKey = keyGenerator(args);
        await strategicCache.delete(strategy, cacheKey);
        console.log(`🗑️ CACHE INVALIDATE - Invalidated ${strategy}:${cacheKey}`);
      } catch (error) {
        console.error(`❌ CACHE INVALIDATE - Error:`, error);
      }
      
      return result;
    };

    return descriptor;
  };
}
