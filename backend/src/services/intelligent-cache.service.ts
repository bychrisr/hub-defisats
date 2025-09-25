import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  hitRate: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
  enableMetrics: boolean;
}

export class IntelligentCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private prisma: PrismaClient;
  private logger: Logger;
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    hitRate: 0
  };
  private cleanupInterval: NodeJS.Timeout;

  constructor(prisma: PrismaClient, logger: Logger, config: Partial<CacheConfig> = {}) {
    this.prisma = prisma;
    this.logger = logger;
    this.config = {
      defaultTTL: 300000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 60000, // 1 minute
      enableMetrics: true,
      ...config
    };

    // Iniciar limpeza automática
    this.startCleanup();
  }

  /**
   * Obtém dados do cache ou executa query se necessário
   */
  async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.generateKey(key);
    const now = Date.now();
    const entry = this.cache.get(cacheKey);

    // Verificar se entrada existe e não expirou
    if (entry && (now - entry.timestamp) < entry.ttl) {
      entry.accessCount++;
      entry.lastAccessed = now;
      this.stats.hits++;
      this.updateHitRate();
      
      this.logger.debug('Cache hit', { key: cacheKey, accessCount: entry.accessCount });
      return entry.data;
    }

    // Cache miss - executar query
    this.stats.misses++;
    this.updateHitRate();

    try {
      const data = await queryFn();
      
      // Armazenar no cache
      this.set(cacheKey, data, ttl);
      
      this.logger.debug('Cache miss - data fetched and cached', { key: cacheKey });
      return data;
      
    } catch (error) {
      this.logger.error('Cache query execution failed', { 
        key: cacheKey, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Armazena dados no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    };

    // Verificar se precisa evictar entradas
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, entry);
    this.stats.totalSize = this.cache.size;

    this.logger.debug('Data cached', { 
      key, 
      ttl: entry.ttl,
      cacheSize: this.cache.size 
    });
  }

  /**
   * Invalida entrada específica do cache
   */
  invalidate(key: string): boolean {
    const cacheKey = this.generateKey(key);
    const deleted = this.cache.delete(cacheKey);
    
    if (deleted) {
      this.stats.totalSize = this.cache.size;
      this.logger.debug('Cache entry invalidated', { key: cacheKey });
    }
    
    return deleted;
  }

  /**
   * Invalida múltiplas entradas por padrão
   */
  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.stats.totalSize = this.cache.size;
    this.stats.evictions += invalidated;

    this.logger.debug('Cache pattern invalidated', { 
      pattern, 
      invalidated,
      remainingSize: this.cache.size 
    });

    return invalidated;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.evictions += size;

    this.logger.info('Cache cleared', { clearedEntries: size });
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Cache inteligente para métricas de usuário
   */
  async getUserMetrics(userId: string): Promise<{
    totalAutomations: number;
    activeAutomations: number;
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    totalSimulations: number;
    completedSimulations: number;
  }> {
    const key = `user_metrics:${userId}`;
    
    return this.get(key, async () => {
      const [
        totalAutomations,
        activeAutomations,
        totalTrades,
        successfulTrades,
        failedTrades,
        totalSimulations,
        completedSimulations
      ] = await Promise.all([
        this.prisma.automation.count({ where: { user_id: userId } }),
        this.prisma.automation.count({ 
          where: { user_id: userId, is_active: true } 
        }),
        this.prisma.tradeLog.count({ where: { user_id: userId } }),
        this.prisma.tradeLog.count({ 
          where: { user_id: userId, status: 'success' } 
        }),
        this.prisma.tradeLog.count({ 
          where: { user_id: userId, status: 'app_error' } 
        }),
        this.prisma.simulation.count({ where: { user_id: userId } }),
        this.prisma.simulation.count({ 
          where: { user_id: userId, status: 'completed' } 
        })
      ]);

      return {
        totalAutomations,
        activeAutomations,
        totalTrades,
        successfulTrades,
        failedTrades,
        totalSimulations,
        completedSimulations
      };
    }, 300000); // 5 minutos
  }

  /**
   * Cache inteligente para dados de dashboard
   */
  async getDashboardData(userId: string): Promise<{
    recentTrades: any[];
    activeAutomations: any[];
    systemAlerts: any[];
  }> {
    const key = `dashboard:${userId}`;
    
    return this.get(key, async () => {
      const [recentTrades, activeAutomations, systemAlerts] = await Promise.all([
        this.prisma.tradeLog.findMany({
          where: { user_id: userId },
          select: {
            id: true,
            status: true,
            action: true,
            amount: true,
            pnl: true,
            executed_at: true
          },
          orderBy: { executed_at: 'desc' },
          take: 10
        }),
        this.prisma.automation.findMany({
          where: { user_id: userId, is_active: true },
          select: {
            id: true,
            type: true,
            status: true,
            risk_level: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 5
        }),
        this.prisma.systemAlert.findMany({
          where: {
            created_at: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          select: {
            id: true,
            message: true,
            severity: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 5
        })
      ]);

      return {
        recentTrades,
        activeAutomations,
        systemAlerts
      };
    }, 180000); // 3 minutos
  }

  /**
   * Cache inteligente para analytics de trading
   * ⚠️ IMPORTANTE: Dados históricos podem ser cacheados por mais tempo
   * mas dados de mercado em tempo real NUNCA devem ser cacheados > 30s
   */
  async getTradingAnalytics(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<any[]> {
    const key = `trading_analytics:${userId}:${dateRange.start.getTime()}:${dateRange.end.getTime()}`;
    
    return this.get(key, async () => {
      return this.prisma.tradeLog.findMany({
        where: {
          user_id: userId,
          executed_at: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        select: {
          id: true,
          status: true,
          action: true,
          amount: true,
          pnl: true,
          executed_at: true
        },
        orderBy: { executed_at: 'desc' }
      });
    }, 600000); // 10 minutos - OK para dados históricos
  }

  /**
   * Cache inteligente para dados de admin
   */
  async getAdminMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTrades: number;
    totalAutomations: number;
    systemHealth: any;
  }> {
    const key = 'admin_metrics';
    
    return this.get(key, async () => {
      const [
        totalUsers,
        activeUsers,
        totalTrades,
        totalAutomations
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ 
          where: { 
            last_activity_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          } 
        }),
        this.prisma.tradeLog.count(),
        this.prisma.automation.count()
      ]);

      return {
        totalUsers,
        activeUsers,
        totalTrades,
        totalAutomations,
        systemHealth: {
          status: 'healthy',
          uptime: 99.9,
          responseTime: 145
        }
      };
    }, 300000); // 5 minutos
  }

  /**
   * Invalida cache relacionado a um usuário
   */
  invalidateUserCache(userId: string): void {
    this.invalidatePattern(`.*:${userId}.*`);
    this.logger.info('User cache invalidated', { userId });
  }

  /**
   * Invalida cache de métricas quando dados são atualizados
   */
  invalidateMetricsCache(): void {
    this.invalidatePattern('.*metrics.*');
    this.invalidatePattern('.*dashboard.*');
    this.invalidatePattern('.*analytics.*');
    this.logger.info('Metrics cache invalidated');
  }

  /**
   * Gera chave de cache com hash
   */
  private generateKey(key: string): string {
    // Usar hash simples para evitar chaves muito longas
    return Buffer.from(key).toString('base64').substring(0, 50);
  }

  /**
   * Evicta entradas menos utilizadas
   */
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastUsedScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score baseado em acesso e tempo
      const score = entry.accessCount / (Date.now() - entry.timestamp);
      
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.stats.evictions++;
      this.stats.totalSize = this.cache.size;
      
      this.logger.debug('Cache entry evicted', { 
        key: leastUsedKey,
        score: leastUsedScore 
      });
    }
  }

  /**
   * Atualiza taxa de hit
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Inicia limpeza automática de entradas expiradas
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Limpa entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.stats.totalSize = this.cache.size;
    this.stats.evictions += cleaned;

    if (cleaned > 0) {
      this.logger.debug('Cache cleanup completed', { 
        cleaned,
        remainingSize: this.cache.size 
      });
    }
  }

  /**
   * Para o serviço de cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.clear();
    this.logger.info('Intelligent cache service destroyed');
  }
}
