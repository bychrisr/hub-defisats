import { strategicCache } from './strategic-cache.service';
import { prisma } from '../lib/prisma';
import { User, Automation, Plan } from '@prisma/client';

export class CacheManagerService {
  /**
   * Cache de dados de usuário
   */
  async getUser(userId: string): Promise<User | null> {
    return await strategicCache.get('user', userId, async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          automations: true,
          admin_user: true,
        },
      });
    });
  }

  /**
   * Cache de dados de usuário por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await strategicCache.get('user', `email:${email}`, async () => {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          automations: true,
          admin_user: true,
        },
      });
    });
  }

  /**
   * Cache de automações do usuário
   */
  async getUserAutomations(userId: string): Promise<Automation[]> {
    return await strategicCache.get('config', `automations:${userId}`, async () => {
      return await prisma.automation.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });
    });
  }

  /**
   * Cache de planos
   */
  async getPlans(): Promise<Plan[]> {
    return await strategicCache.get('config', 'plans', async () => {
      return await prisma.plan.findMany({
        orderBy: { created_at: 'asc' },
      });
    });
  }

  /**
   * Cache de configurações do sistema
   */
  async getSystemConfig(): Promise<any> {
    return await strategicCache.get('config', 'system', async () => {
      const configs = await prisma.systemConfig.findMany();
      return configs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, any>);
    });
  }

  /**
   * Cache de dados de mercado (preços, etc.)
   */
  async getMarketData(symbol: string): Promise<any> {
    return await strategicCache.get('market', symbol, async () => {
      // Aqui você pode integrar com APIs externas como Binance, CoinGecko, etc.
      // Por enquanto, retornamos null para indicar que não há dados em cache
      return null;
    });
  }

  /**
   * Cache de dados históricos
   */
  async getHistoricalData(symbol: string, timeframe: string): Promise<any> {
    const key = `${symbol}:${timeframe}`;
    return await strategicCache.get('historical', key, async () => {
      // Implementar busca de dados históricos
      return null;
    });
  }

  /**
   * Cache de sessão do usuário
   */
  async getSession(sessionId: string): Promise<any> {
    return await strategicCache.get('session', sessionId, async () => {
      // Session não existe no schema atual, retornar null
      return null;
    });
  }

  /**
   * Cache de rate limiting
   */
  async getRateLimit(key: string): Promise<number> {
    const result = await strategicCache.get('rateLimit', key, async () => {
      return 0;
    });
    return result || 0;
  }

  /**
   * Incrementa contador de rate limiting
   */
  async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    const current = await this.getRateLimit(key);
    const newValue = current + 1;
    await strategicCache.set('rateLimit', key, newValue);
    await strategicCache.expire('rateLimit', key, ttl);
    return newValue;
  }

  /**
   * Invalida cache de usuário
   */
  async invalidateUser(userId: string): Promise<void> {
    await strategicCache.delete('user', userId);
    await strategicCache.delete('positions', userId);
    await strategicCache.delete('config', `automations:${userId}`);
  }

  /**
   * Invalida cache de usuário por email
   */
  async invalidateUserByEmail(email: string): Promise<void> {
    await strategicCache.delete('user', `email:${email}`);
  }

  /**
   * Invalida cache de posições
   */
  async invalidatePositions(userId: string): Promise<void> {
    await strategicCache.delete('positions', userId);
  }

  /**
   * Invalida cache de automações
   */
  async invalidateAutomations(userId: string): Promise<void> {
    await strategicCache.delete('config', `automations:${userId}`);
  }

  /**
   * Invalida cache de configurações do sistema
   */
  async invalidateSystemConfig(): Promise<void> {
    await strategicCache.delete('config', 'system');
  }

  /**
   * Invalida cache de planos
   */
  async invalidatePlans(): Promise<void> {
    await strategicCache.delete('config', 'plans');
  }

  /**
   * Invalida cache de sessão
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await strategicCache.delete('session', sessionId);
  }

  /**
   * Invalida cache de dados de mercado
   */
  async invalidateMarketData(symbol: string): Promise<void> {
    await strategicCache.delete('market', symbol);
  }

  /**
   * Invalida cache de dados históricos
   */
  async invalidateHistoricalData(symbol: string, timeframe: string): Promise<void> {
    const key = `${symbol}:${timeframe}`;
    await strategicCache.delete('historical', key);
  }

  /**
   * Limpa todo o cache de um usuário
   */
  async clearUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateUser(userId),
      this.invalidatePositions(userId),
      this.invalidateAutomations(userId),
    ]);
  }

  /**
   * Limpa cache por padrão
   */
  async clearCachePattern(strategy: string, pattern: string): Promise<number> {
    return await strategicCache.clearPattern(strategy, pattern);
  }

  /**
   * Obtém métricas de cache
   */
  async getCacheMetrics(): Promise<any> {
    return strategicCache.getMetrics();
  }

  /**
   * Obtém informações do cache
   */
  async getCacheInfo(): Promise<any> {
    return await strategicCache.getCacheInfo();
  }

  /**
   * Reseta métricas de cache
   */
  async resetCacheMetrics(): Promise<void> {
    strategicCache.resetMetrics();
  }

  /**
   * Verifica saúde do cache
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const ping = await strategicCache.ping();
      const metrics = strategicCache.getMetrics();
      const info = await strategicCache.getCacheInfo();

      return {
        healthy: true,
        details: {
          ping,
          metrics,
          info,
          connected: strategicCache.isRedisConnected(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error.message,
          connected: strategicCache.isRedisConnected(),
        },
      };
    }
  }
}

// Instância singleton
export const cacheManager = new CacheManagerService();
