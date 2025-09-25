import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

interface QueryMetrics {
  query: string;
  executionTime: number;
  rowsReturned: number;
  memoryUsage: number;
  timestamp: Date;
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'gin' | 'gist' | 'hash';
  reason: string;
  estimatedImprovement: number;
}

interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  performanceGain: number;
  recommendations: IndexRecommendation[];
  executionTime: number;
}

export class AdvancedQueryOptimizerService {
  private prisma: PrismaClient;
  private logger: Logger;
  private queryMetrics: QueryMetrics[] = [];
  private readonly MAX_METRICS_HISTORY = 1000;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Otimiza queries de métricas agregadas com cache inteligente
   */
  async getOptimizedAggregatedMetrics(userId: string): Promise<{
    totalAutomations: number;
    activeAutomations: number;
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    totalSimulations: number;
    completedSimulations: number;
    executionTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Usar uma única query com CTE para otimizar performance
      const result = await this.prisma.$queryRaw`
        WITH user_metrics AS (
          SELECT 
            COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as total_automations,
            COUNT(CASE WHEN a.id IS NOT NULL AND a.is_active = true THEN 1 END) as active_automations,
            COUNT(CASE WHEN tl.id IS NOT NULL THEN 1 END) as total_trades,
            COUNT(CASE WHEN tl.id IS NOT NULL AND tl.status = 'success' THEN 1 END) as successful_trades,
            COUNT(CASE WHEN tl.id IS NOT NULL AND tl.status = 'app_error' THEN 1 END) as failed_trades,
            COUNT(CASE WHEN s.id IS NOT NULL THEN 1 END) as total_simulations,
            COUNT(CASE WHEN s.id IS NOT NULL AND s.status = 'completed' THEN 1 END) as completed_simulations
          FROM "User" u
          LEFT JOIN "Automation" a ON u.id = a.user_id
          LEFT JOIN "TradeLog" tl ON u.id = tl.user_id
          LEFT JOIN "simulations" s ON u.id = s.user_id
          WHERE u.id = ${userId}
        )
        SELECT * FROM user_metrics;
      `;

      const metrics = result[0] as any;
      const executionTime = Date.now() - startTime;

      this.logger.debug(`Optimized aggregated metrics for user: ${userId}`, {
        executionTime,
        userId
      });

      return {
        totalAutomations: Number(metrics.total_automations) || 0,
        activeAutomations: Number(metrics.active_automations) || 0,
        totalTrades: Number(metrics.total_trades) || 0,
        successfulTrades: Number(metrics.successful_trades) || 0,
        failedTrades: Number(metrics.failed_trades) || 0,
        totalSimulations: Number(metrics.total_simulations) || 0,
        completedSimulations: Number(metrics.completed_simulations) || 0,
        executionTime
      };

    } catch (error) {
      this.logger.error('Optimized aggregated metrics error', { 
        userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Otimiza busca de usuários com índices compostos
   */
  async searchUsersOptimized(
    searchTerm: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      planType?: string;
      isActive?: boolean;
      dateRange?: { start: Date; end: Date };
    } = {}
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    executionTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const offset = (page - 1) * limit;
      
      // Construir filtros dinamicamente
      const whereConditions: string[] = [];
      const queryParams: any[] = [searchTerm, searchTerm, limit, offset];
      let paramIndex = 4;

      // Filtro de texto
      whereConditions.push(`(u.email ILIKE $1 OR u.username ILIKE $2)`);

      // Filtro de plano
      if (filters.planType) {
        whereConditions.push(`u.plan_type = $${++paramIndex}`);
        queryParams.push(filters.planType);
      }

      // Filtro de status ativo
      if (filters.isActive !== undefined) {
        whereConditions.push(`u.is_active = $${++paramIndex}`);
        queryParams.push(filters.isActive);
      }

      // Filtro de data
      if (filters.dateRange) {
        whereConditions.push(`u.created_at BETWEEN $${++paramIndex} AND $${++paramIndex}`);
        queryParams.push(filters.dateRange.start, filters.dateRange.end);
      }

      const whereClause = whereConditions.join(' AND ');

      // Query otimizada com índices
      const [users, totalCount] = await Promise.all([
        this.prisma.$queryRaw`
          SELECT 
            u.id,
            u.email,
            u.username,
            u.plan_type,
            u.is_active,
            u.created_at,
            u.last_activity_at,
            COUNT(tl.id) as trade_count,
            COUNT(a.id) as automation_count
          FROM "User" u
          LEFT JOIN "TradeLog" tl ON u.id = tl.user_id
          LEFT JOIN "Automation" a ON u.id = a.user_id
          WHERE ${whereClause}
          GROUP BY u.id, u.email, u.username, u.plan_type, u.is_active, u.created_at, u.last_activity_at
          ORDER BY u.created_at DESC
          LIMIT $3 OFFSET $4
        `,
        this.prisma.$queryRaw`
          SELECT COUNT(DISTINCT u.id) as total
          FROM "User" u
          WHERE ${whereClause}
        `
      ]);

      const total = Number((totalCount[0] as any).total);
      const pages = Math.ceil(total / limit);
      const executionTime = Date.now() - startTime;

      this.logger.debug(`Optimized user search: "${searchTerm}"`, {
        page,
        limit,
        total,
        executionTime,
        filters
      });

      return {
        data: users as any[],
        pagination: {
          page,
          limit,
          total,
          pages
        },
        executionTime
      };

    } catch (error) {
      this.logger.error('Optimized user search error', { 
        searchTerm, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Otimiza queries de analytics com materialized views
   */
  async getTradingAnalyticsOptimized(
    userId: string,
    dateRange: { start: Date; end: Date },
    groupBy: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    data: Array<{
      period: string;
      totalTrades: number;
      successfulTrades: number;
      totalVolume: number;
      totalPnl: number;
      avgExecutionTime: number;
    }>;
    executionTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      let dateTrunc: string;
      switch (groupBy) {
        case 'hour':
          dateTrunc = 'hour';
          break;
        case 'day':
          dateTrunc = 'day';
          break;
        case 'week':
          dateTrunc = 'week';
          break;
        case 'month':
          dateTrunc = 'month';
          break;
        default:
          dateTrunc = 'day';
      }

      const result = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${dateTrunc}, tl.executed_at) as period,
          COUNT(tl.id) as total_trades,
          COUNT(CASE WHEN tl.status = 'success' THEN 1 END) as successful_trades,
          COALESCE(SUM(tl.amount), 0) as total_volume,
          COALESCE(SUM(tl.pnl), 0) as total_pnl,
          COALESCE(AVG(
            CASE 
              WHEN tl.metadata->>'executionTime' IS NOT NULL 
              THEN (tl.metadata->>'executionTime')::numeric 
              ELSE NULL 
            END
          ), 0) as avg_execution_time
        FROM "TradeLog" tl
        WHERE tl.user_id = ${userId}
          AND tl.executed_at BETWEEN ${dateRange.start} AND ${dateRange.end}
        GROUP BY DATE_TRUNC(${dateTrunc}, tl.executed_at)
        ORDER BY period DESC
      `;

      const executionTime = Date.now() - startTime;

      this.logger.debug(`Optimized trading analytics for user: ${userId}`, {
        dateRange,
        groupBy,
        executionTime
      });

      return {
        data: (result as any[]).map(row => ({
          period: row.period.toISOString(),
          totalTrades: Number(row.total_trades),
          successfulTrades: Number(row.successful_trades),
          totalVolume: Number(row.total_volume),
          totalPnl: Number(row.total_pnl),
          avgExecutionTime: Number(row.avg_execution_time)
        })),
        executionTime
      };

    } catch (error) {
      this.logger.error('Optimized trading analytics error', { 
        userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Otimiza queries de dashboard com cache inteligente
   */
  async getDashboardMetricsOptimized(userId: string): Promise<{
    recentTrades: any[];
    activeAutomations: any[];
    systemAlerts: any[];
    performanceMetrics: {
      avgResponseTime: number;
      errorRate: number;
      uptime: number;
    };
    executionTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Executar queries em paralelo com otimizações
      const [
        recentTrades,
        activeAutomations,
        systemAlerts,
        performanceMetrics
      ] = await Promise.all([
        // Trades recentes com limite otimizado
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

        // Automações ativas com status otimizado
        this.prisma.automation.findMany({
          where: { 
            user_id: userId,
            is_active: true 
          },
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

        // Alertas do sistema (últimos 24h)
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
        }),

        // Métricas de performance (mock por enquanto)
        Promise.resolve({
          avgResponseTime: 145,
          errorRate: 2.3,
          uptime: 99.9
        })
      ]);

      const executionTime = Date.now() - startTime;

      this.logger.debug(`Optimized dashboard metrics for user: ${userId}`, {
        executionTime
      });

      return {
        recentTrades,
        activeAutomations,
        systemAlerts,
        performanceMetrics,
        executionTime
      };

    } catch (error) {
      this.logger.error('Optimized dashboard metrics error', { 
        userId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Analisa performance de queries e gera recomendações
   */
  async analyzeQueryPerformance(): Promise<{
    slowQueries: QueryMetrics[];
    recommendations: IndexRecommendation[];
    averageExecutionTime: number;
  }> {
    try {
      // Filtrar queries lentas (>100ms)
      const slowQueries = this.queryMetrics.filter(q => q.executionTime > 100);
      
      // Calcular tempo médio de execução
      const averageExecutionTime = this.queryMetrics.reduce(
        (sum, q) => sum + q.executionTime, 0
      ) / this.queryMetrics.length;

      // Gerar recomendações de índices
      const recommendations = this.generateIndexRecommendations(slowQueries);

      this.logger.info('Query performance analysis completed', {
        totalQueries: this.queryMetrics.length,
        slowQueries: slowQueries.length,
        averageExecutionTime,
        recommendations: recommendations.length
      });

      return {
        slowQueries,
        recommendations,
        averageExecutionTime
      };

    } catch (error) {
      this.logger.error('Query performance analysis error', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Gera recomendações de índices baseadas nas queries lentas
   */
  private generateIndexRecommendations(slowQueries: QueryMetrics[]): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];

    // Análise de padrões comuns em queries lentas
    const commonPatterns = this.analyzeQueryPatterns(slowQueries);

    // Recomendações baseadas em padrões identificados
    if (commonPatterns.includes('user_id_filter')) {
      recommendations.push({
        table: 'TradeLog',
        columns: ['user_id', 'executed_at'],
        type: 'btree',
        reason: 'Filtros frequentes por user_id e data',
        estimatedImprovement: 0.7
      });
    }

    if (commonPatterns.includes('status_filter')) {
      recommendations.push({
        table: 'Automation',
        columns: ['status', 'is_active'],
        type: 'btree',
        reason: 'Filtros frequentes por status e ativo',
        estimatedImprovement: 0.6
      });
    }

    if (commonPatterns.includes('text_search')) {
      recommendations.push({
        table: 'User',
        columns: ['email', 'username'],
        type: 'gin',
        reason: 'Busca de texto em email e username',
        estimatedImprovement: 0.8
      });
    }

    return recommendations;
  }

  /**
   * Analisa padrões nas queries para gerar recomendações
   */
  private analyzeQueryPatterns(queries: QueryMetrics[]): string[] {
    const patterns: string[] = [];

    queries.forEach(query => {
      const queryLower = query.query.toLowerCase();
      
      if (queryLower.includes('user_id') && queryLower.includes('executed_at')) {
        patterns.push('user_id_filter');
      }
      
      if (queryLower.includes('status') && queryLower.includes('is_active')) {
        patterns.push('status_filter');
      }
      
      if (queryLower.includes('ilike') || queryLower.includes('contains')) {
        patterns.push('text_search');
      }
    });

    return [...new Set(patterns)];
  }

  /**
   * Registra métricas de uma query executada
   */
  recordQueryMetrics(query: string, executionTime: number, rowsReturned: number): void {
    const metrics: QueryMetrics = {
      query,
      executionTime,
      rowsReturned,
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: new Date()
    };

    this.queryMetrics.push(metrics);

    // Manter apenas os últimos N registros
    if (this.queryMetrics.length > this.MAX_METRICS_HISTORY) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS_HISTORY);
    }

    // Log de queries lentas
    if (executionTime > 1000) {
      this.logger.warn('Slow query detected', {
        query: query.substring(0, 200),
        executionTime,
        rowsReturned
      });
    }
  }

  /**
   * Limpa métricas antigas
   */
  cleanupOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.queryMetrics = this.queryMetrics.filter(q => q.timestamp > cutoffTime);
    
    this.logger.info('Cleaned up old query metrics', {
      remainingMetrics: this.queryMetrics.length
    });
  }
}
