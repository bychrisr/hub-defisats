import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { AdvancedQueryOptimizerService } from './advanced-query-optimizer.service';
import { SecureQueryOptimizerService } from './secure-query-optimizer.service';
import { DatabaseIndexOptimizerService } from './database-index-optimizer.service';
import { VolatileMarketDataService } from './volatile-market-data.service';
import { IntelligentCacheService } from './intelligent-cache.service';

interface UnifiedAdminMetrics {
  // Performance Metrics
  queryPerformance: {
    averageExecutionTime: number;
    slowQueries: number;
    cacheHitRate: number;
    totalQueries: number;
  };
  
  // Database Metrics
  databaseHealth: {
    connectionPool: number;
    slowQueries: number;
    indexRecommendations: number;
    unusedIndexes: number;
  };
  
  // Cache Metrics
  cachePerformance: {
    hitRate: number;
    totalEntries: number;
    memoryUsage: number;
    evictions: number;
  };
  
  // Market Data Safety
  marketDataSafety: {
    cacheAge: number;
    isStale: boolean;
    lastUpdate: number;
    dataSource: string;
  };
  
  // System Health
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
  
  // Business Metrics
  businessMetrics: {
    totalUsers: number;
    activeUsers: number;
    totalTrades: number;
    totalAutomations: number;
    monthlyRevenue: number;
  };
}

interface OptimizationRecommendations {
  database: {
    createIndexes: string[];
    removeIndexes: string[];
    optimizeQueries: string[];
  };
  cache: {
    invalidatePatterns: string[];
    adjustTTL: { key: string; newTTL: number }[];
  };
  marketData: {
    forceRefresh: boolean;
    clearCache: boolean;
  };
}

/**
 * Serviço unificado para otimização e monitoramento administrativo
 * 
 * Integra todos os serviços de otimização existentes e fornece
 * uma interface única para administradores gerenciarem performance
 */
export class UnifiedAdminOptimizationService {
  private prisma: PrismaClient;
  private logger: Logger;
  private queryOptimizer: AdvancedQueryOptimizerService;
  private secureOptimizer: SecureQueryOptimizerService;
  private indexOptimizer: DatabaseIndexOptimizerService;
  private marketDataService: VolatileMarketDataService;
  private cacheService: IntelligentCacheService;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
    this.queryOptimizer = new AdvancedQueryOptimizerService(prisma, logger);
    this.secureOptimizer = new SecureQueryOptimizerService(prisma, logger);
    this.indexOptimizer = new DatabaseIndexOptimizerService(prisma, logger);
    this.marketDataService = new VolatileMarketDataService(prisma, logger);
    this.cacheService = new IntelligentCacheService(prisma, logger);
  }

  /**
   * Obtém métricas unificadas para o painel administrativo
   */
  async getUnifiedMetrics(): Promise<UnifiedAdminMetrics> {
    try {
      this.logger.info('Fetching unified admin metrics...');

      const [
        queryMetrics,
        databaseHealth,
        cacheStats,
        marketDataStats,
        systemHealth,
        businessMetrics
      ] = await Promise.all([
        this.getQueryPerformanceMetrics(),
        this.getDatabaseHealthMetrics(),
        this.getCachePerformanceMetrics(),
        this.getMarketDataSafetyMetrics(),
        this.getSystemHealthMetrics(),
        this.getBusinessMetrics()
      ]);

      const metrics: UnifiedAdminMetrics = {
        queryPerformance: queryMetrics,
        databaseHealth,
        cachePerformance: cacheStats,
        marketDataSafety: marketDataStats,
        systemHealth,
        businessMetrics
      };

      this.logger.info('Unified admin metrics fetched successfully', {
        queryCount: queryMetrics.totalQueries,
        cacheHitRate: cacheStats.hitRate,
        databaseConnections: databaseHealth.connectionPool
      });

      return metrics;

    } catch (error) {
      this.logger.error('Failed to fetch unified admin metrics', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Obtém recomendações de otimização
   */
  async getOptimizationRecommendations(): Promise<OptimizationRecommendations> {
    try {
      this.logger.info('Generating optimization recommendations...');

      const [
        indexAnalysis,
        cacheStats,
        marketDataStats
      ] = await Promise.all([
        this.indexOptimizer.analyzeIndexes(),
        this.secureOptimizer.getCacheStats(),
        this.marketDataService.getCacheStats()
      ]);

      const recommendations: OptimizationRecommendations = {
        database: {
          createIndexes: indexAnalysis.recommendations
            .filter(r => r.priority === 'high')
            .map(r => `${r.table}.${r.columns.join('_')}`),
          removeIndexes: indexAnalysis.unusedIndexes,
          optimizeQueries: indexAnalysis.recommendations
            .filter(r => r.estimatedImprovement > 0.5)
            .map(r => `Optimize ${r.table} queries with ${r.type} index`)
        },
        cache: {
          invalidatePatterns: this.getCacheInvalidationPatterns(cacheStats),
          adjustTTL: this.getTTLAdjustments(cacheStats)
        },
        marketData: {
          forceRefresh: marketDataStats.isStale,
          clearCache: marketDataStats.cacheAge > 30000
        }
      };

      this.logger.info('Optimization recommendations generated', {
        databaseRecommendations: recommendations.database.createIndexes.length,
        cacheRecommendations: recommendations.cache.invalidatePatterns.length
      });

      return recommendations;

    } catch (error) {
      this.logger.error('Failed to generate optimization recommendations', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Executa otimizações automáticas
   */
  async executeAutomaticOptimizations(): Promise<{
    executed: string[];
    failed: Array<{ action: string; error: string }>;
  }> {
    const executed: string[] = [];
    const failed: Array<{ action: string; error: string }> = [];

    try {
      this.logger.info('Starting automatic optimizations...');

      // 1. Otimizar índices do banco
      try {
        await this.indexOptimizer.monitorAndOptimize();
        executed.push('Database indexes optimized');
      } catch (error) {
        failed.push({
          action: 'Database index optimization',
          error: (error as Error).message
        });
      }

      // 2. Limpar cache expirado
      try {
        this.secureOptimizer.cleanupExpiredCache();
        this.cacheService.cleanupOldMetrics(24);
        executed.push('Expired cache cleaned up');
      } catch (error) {
        failed.push({
          action: 'Cache cleanup',
          error: (error as Error).message
        });
      }

      // 3. Forçar refresh de dados de mercado se necessário
      try {
        const marketStats = this.marketDataService.getCacheStats();
        if (marketStats.isStale) {
          await this.marketDataService.forceRefresh();
          executed.push('Market data refreshed');
        }
      } catch (error) {
        failed.push({
          action: 'Market data refresh',
          error: (error as Error).message
        });
      }

      // 4. Limpar métricas antigas
      try {
        this.queryOptimizer.cleanupOldMetrics(24);
        executed.push('Old metrics cleaned up');
      } catch (error) {
        failed.push({
          action: 'Metrics cleanup',
          error: (error as Error).message
        });
      }

      this.logger.info('Automatic optimizations completed', {
        executed: executed.length,
        failed: failed.length
      });

      return { executed, failed };

    } catch (error) {
      this.logger.error('Automatic optimizations failed', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Obtém métricas de performance de queries
   */
  private async getQueryPerformanceMetrics() {
    const metrics = this.queryOptimizer.getQueryMetrics();
    
    return {
      averageExecutionTime: metrics.averageExecutionTime,
      slowQueries: metrics.slowQueries.length,
      cacheHitRate: metrics.cacheHitRate,
      totalQueries: metrics.totalQueries
    };
  }

  /**
   * Obtém métricas de saúde do banco de dados
   */
  private async getDatabaseHealthMetrics() {
    const analysis = await this.indexOptimizer.analyzeIndexes();
    
    return {
      connectionPool: 0, // TODO: Implementar métricas de connection pool
      slowQueries: analysis.stats.slowQueries,
      indexRecommendations: analysis.recommendations.length,
      unusedIndexes: analysis.unusedIndexes.length
    };
  }

  /**
   * Obtém métricas de performance do cache
   */
  private async getCachePerformanceMetrics() {
    const cacheStats = this.secureOptimizer.getCacheStats();
    
    return {
      hitRate: cacheStats.entriesByType.market ? 0.85 : 0, // Mock para agora
      totalEntries: cacheStats.totalEntries,
      memoryUsage: 0, // TODO: Implementar métricas de memória
      evictions: 0 // TODO: Implementar contador de evictions
    };
  }

  /**
   * Obtém métricas de segurança de dados de mercado
   */
  private async getMarketDataSafetyMetrics() {
    const stats = this.marketDataService.getCacheStats();
    
    return {
      cacheAge: stats.cacheAge,
      isStale: stats.isStale,
      lastUpdate: stats.hasData ? Date.now() - stats.cacheAge : 0,
      dataSource: 'lnmarkets' // TODO: Obter da fonte real
    };
  }

  /**
   * Obtém métricas de saúde do sistema
   */
  private async getSystemHealthMetrics() {
    // TODO: Implementar métricas reais do sistema
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: 0, // TODO: Implementar métricas de CPU
      activeConnections: 0 // TODO: Implementar contador de conexões
    };
  }

  /**
   * Obtém métricas de negócio
   */
  private async getBusinessMetrics() {
    const [
      totalUsers,
      activeUsers,
      totalTrades,
      totalAutomations,
      monthlyRevenue
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
      this.prisma.automation.count(),
      this.getMonthlyRevenue()
    ]);

    return {
      totalUsers,
      activeUsers,
      totalTrades,
      totalAutomations,
      monthlyRevenue
    };
  }

  /**
   * Calcula receita mensal
   */
  private async getMonthlyRevenue(): Promise<number> {
    try {
      const paymentData = await this.prisma.payment.aggregate({
        where: {
          status: 'completed',
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { amount_sats: true }
      });

      return paymentData._sum.amount_sats || 0;
    } catch (error) {
      this.logger.warn('Failed to calculate monthly revenue', {
        error: (error as Error).message
      });
      return 0;
    }
  }

  /**
   * Gera padrões de invalidação de cache
   */
  private getCacheInvalidationPatterns(cacheStats: any): string[] {
    const patterns: string[] = [];

    // Invalidar cache antigo
    if (cacheStats.averageAge > 300000) { // 5 minutos
      patterns.push('.*:stale.*');
    }

    // Invalidar cache de dados de mercado se estiver antigo
    if (cacheStats.entriesByType?.market > 0) {
      patterns.push('.*market.*');
    }

    return patterns;
  }

  /**
   * Gera ajustes de TTL
   */
  private getTTLAdjustments(cacheStats: any): Array<{ key: string; newTTL: number }> {
    const adjustments: Array<{ key: string; newTTL: number }> = [];

    // Ajustar TTL baseado na taxa de hit
    if (cacheStats.hitRate < 0.5) {
      adjustments.push({ key: 'user_data', newTTL: 600000 }); // 10 minutos
    }

    return adjustments;
  }

  /**
   * Obtém relatório de performance detalhado
   */
  async getDetailedPerformanceReport(): Promise<{
    summary: UnifiedAdminMetrics;
    recommendations: OptimizationRecommendations;
    trends: any;
    alerts: any[];
  }> {
    try {
      const [summary, recommendations] = await Promise.all([
        this.getUnifiedMetrics(),
        this.getOptimizationRecommendations()
      ]);

      // TODO: Implementar análise de tendências
      const trends = {
        queryPerformance: 'stable',
        cacheEfficiency: 'improving',
        databaseHealth: 'good'
      };

      // TODO: Implementar sistema de alertas
      const alerts: any[] = [];

      return {
        summary,
        recommendations,
        trends,
        alerts
      };

    } catch (error) {
      this.logger.error('Failed to generate detailed performance report', {
        error: (error as Error).message
      });
      throw error;
    }
  }
}
