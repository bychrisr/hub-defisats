import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

interface IndexAnalysis {
  table: string;
  column: string;
  usageCount: number;
  avgSelectivity: number;
  recommendation: 'create' | 'drop' | 'modify';
  reason: string;
  estimatedImprovement: number;
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'gin' | 'gist' | 'hash' | 'brin';
  unique: boolean;
  partial?: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImprovement: number;
}

interface DatabaseStats {
  totalTables: number;
  totalIndexes: number;
  unusedIndexes: number;
  duplicateIndexes: number;
  missingIndexes: number;
  averageQueryTime: number;
  slowQueries: number;
}

export class DatabaseIndexOptimizerService {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Analisa índices existentes e gera recomendações
   */
  async analyzeIndexes(): Promise<{
    stats: DatabaseStats;
    recommendations: IndexRecommendation[];
    unusedIndexes: string[];
    duplicateIndexes: string[];
  }> {
    try {
      this.logger.info('Starting database index analysis...');

      // Obter estatísticas do banco
      const stats = await this.getDatabaseStats();
      
      // Analisar índices existentes
      const existingIndexes = await this.getExistingIndexes();
      
      // Identificar índices não utilizados
      const unusedIndexes = await this.findUnusedIndexes();
      
      // Identificar índices duplicados
      const duplicateIndexes = await this.findDuplicateIndexes();
      
      // Gerar recomendações de novos índices
      const recommendations = await this.generateIndexRecommendations();

      this.logger.info('Database index analysis completed', {
        totalTables: stats.totalTables,
        totalIndexes: stats.totalIndexes,
        recommendations: recommendations.length,
        unusedIndexes: unusedIndexes.length,
        duplicateIndexes: duplicateIndexes.length
      });

      return {
        stats,
        recommendations,
        unusedIndexes,
        duplicateIndexes
      };

    } catch (error) {
      this.logger.error('Database index analysis failed', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Cria índices recomendados com base na análise
   */
  async createRecommendedIndexes(
    recommendations: IndexRecommendation[],
    dryRun: boolean = true
  ): Promise<{
    created: string[];
    failed: Array<{ index: string; error: string }>;
    executionTime: number;
  }> {
    const startTime = Date.now();
    const created: string[] = [];
    const failed: Array<{ index: string; error: string }> = [];

    this.logger.info(`Creating recommended indexes (dryRun: ${dryRun})`, {
      totalRecommendations: recommendations.length
    });

    for (const rec of recommendations) {
      try {
        const indexName = this.generateIndexName(rec.table, rec.columns);
        const sql = this.generateCreateIndexSQL(rec, indexName);

        if (!dryRun) {
          await this.prisma.$executeRawUnsafe(sql);
        }

        created.push(indexName);
        this.logger.info(`Index created: ${indexName}`, {
          table: rec.table,
          columns: rec.columns,
          type: rec.type,
          dryRun
        });

      } catch (error) {
        const errorMsg = (error as Error).message;
        failed.push({
          index: `${rec.table}.${rec.columns.join('_')}`,
          error: errorMsg
        });

        this.logger.error(`Failed to create index: ${rec.table}.${rec.columns.join('_')}`, {
          error: errorMsg,
          recommendation: rec
        });
      }
    }

    const executionTime = Date.now() - startTime;

    this.logger.info('Index creation completed', {
      created: created.length,
      failed: failed.length,
      executionTime
    });

    return {
      created,
      failed,
      executionTime
    };
  }

  /**
   * Remove índices não utilizados
   */
  async removeUnusedIndexes(
    unusedIndexes: string[],
    dryRun: boolean = true
  ): Promise<{
    removed: string[];
    failed: Array<{ index: string; error: string }>;
    executionTime: number;
  }> {
    const startTime = Date.now();
    const removed: string[] = [];
    const failed: Array<{ index: string; error: string }> = [];

    this.logger.info(`Removing unused indexes (dryRun: ${dryRun})`, {
      totalUnused: unusedIndexes.length
    });

    for (const indexName of unusedIndexes) {
      try {
        if (!dryRun) {
          await this.prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "${indexName}";`);
        }

        removed.push(indexName);
        this.logger.info(`Index removed: ${indexName}`, { dryRun });

      } catch (error) {
        const errorMsg = (error as Error).message;
        failed.push({
          index: indexName,
          error: errorMsg
        });

        this.logger.error(`Failed to remove index: ${indexName}`, {
          error: errorMsg
        });
      }
    }

    const executionTime = Date.now() - startTime;

    this.logger.info('Unused index removal completed', {
      removed: removed.length,
      failed: failed.length,
      executionTime
    });

    return {
      removed,
      failed,
      executionTime
    };
  }

  /**
   * Otimiza índices existentes
   */
  async optimizeExistingIndexes(): Promise<{
    optimized: string[];
    failed: Array<{ index: string; error: string }>;
    executionTime: number;
  }> {
    const startTime = Date.now();
    const optimized: string[] = [];
    const failed: Array<{ index: string; error: string }> = [];

    try {
      // Reindexar tabelas principais
      const mainTables = ['User', 'TradeLog', 'Automation', 'simulations'];
      
      for (const table of mainTables) {
        try {
          await this.prisma.$executeRawUnsafe(`REINDEX TABLE "${table}";`);
          optimized.push(table);
          this.logger.info(`Table reindexed: ${table}`);
        } catch (error) {
          const errorMsg = (error as Error).message;
          failed.push({
            index: table,
            error: errorMsg
          });
          this.logger.error(`Failed to reindex table: ${table}`, { error: errorMsg });
        }
      }

      // Atualizar estatísticas
      await this.prisma.$executeRawUnsafe(`ANALYZE;`);

      const executionTime = Date.now() - startTime;

      this.logger.info('Index optimization completed', {
        optimized: optimized.length,
        failed: failed.length,
        executionTime
      });

      return {
        optimized,
        failed,
        executionTime
      };

    } catch (error) {
      this.logger.error('Index optimization failed', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Obtém estatísticas do banco de dados
   */
  private async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const [
        tableStats,
        indexStats,
        queryStats
      ] = await Promise.all([
        this.prisma.$queryRaw`
          SELECT 
            COUNT(*) as total_tables,
            SUM(n_tup_ins + n_tup_upd + n_tup_del) as total_operations
          FROM pg_stat_user_tables
        `,
        this.prisma.$queryRaw`
          SELECT 
            COUNT(*) as total_indexes,
            SUM(idx_scan) as total_scans,
            AVG(idx_tup_read::float / NULLIF(idx_scan, 0)) as avg_tuples_per_scan
          FROM pg_stat_user_indexes
        `,
        this.prisma.$queryRaw`
          SELECT 
            AVG(mean_exec_time) as avg_query_time,
            COUNT(*) as slow_queries
          FROM pg_stat_statements 
          WHERE mean_exec_time > 100
        `
      ]);

      const tableData = tableStats[0] as any;
      const indexData = indexStats[0] as any;
      const queryData = queryStats[0] as any;

      return {
        totalTables: Number(tableData.total_tables) || 0,
        totalIndexes: Number(indexData.total_indexes) || 0,
        unusedIndexes: 0, // Calculado separadamente
        duplicateIndexes: 0, // Calculado separadamente
        missingIndexes: 0, // Calculado separadamente
        averageQueryTime: Number(queryData.avg_query_time) || 0,
        slowQueries: Number(queryData.slow_queries) || 0
      };

    } catch (error) {
      this.logger.error('Failed to get database stats', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Obtém índices existentes
   */
  private async getExistingIndexes(): Promise<any[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `;

      return result as any[];

    } catch (error) {
      this.logger.error('Failed to get existing indexes', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Identifica índices não utilizados
   */
  private async findUnusedIndexes(): Promise<string[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT indexname
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0 
          AND schemaname = 'public'
          AND indexname NOT LIKE '%_pkey'
        ORDER BY indexname
      `;

      return (result as any[]).map(row => row.indexname);

    } catch (error) {
      this.logger.error('Failed to find unused indexes', {
        error: (error as Error).message
      });
      return [];
    }
  }

  /**
   * Identifica índices duplicados
   */
  private async findDuplicateIndexes(): Promise<string[]> {
    try {
      const result = await this.prisma.$queryRaw`
        WITH index_columns AS (
          SELECT 
            schemaname,
            tablename,
            indexname,
            array_agg(attname ORDER BY attnum) as columns
          FROM pg_index i
          JOIN pg_attribute a ON i.indexrelid = a.attrelid
          WHERE schemaname = 'public'
          GROUP BY schemaname, tablename, indexname
        ),
        duplicate_indexes AS (
          SELECT 
            tablename,
            columns,
            array_agg(indexname) as index_names
          FROM index_columns
          GROUP BY tablename, columns
          HAVING COUNT(*) > 1
        )
        SELECT unnest(index_names[2:]) as duplicate_index
        FROM duplicate_indexes
      `;

      return (result as any[]).map(row => row.duplicate_index);

    } catch (error) {
      this.logger.error('Failed to find duplicate indexes', {
        error: (error as Error).message
      });
      return [];
    }
  }

  /**
   * Gera recomendações de índices baseadas em padrões de uso
   */
  private async generateIndexRecommendations(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    // Recomendações baseadas no schema e padrões de uso conhecidos
    recommendations.push(
      // Índices para TradeLog
      {
        table: 'TradeLog',
        columns: ['user_id', 'executed_at'],
        type: 'btree',
        unique: false,
        reason: 'Filtros frequentes por usuário e data',
        priority: 'high',
        estimatedImprovement: 0.8
      },
      {
        table: 'TradeLog',
        columns: ['status', 'executed_at'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por status e data para analytics',
        priority: 'high',
        estimatedImprovement: 0.7
      },
      {
        table: 'TradeLog',
        columns: ['automation_id', 'executed_at'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por automação e data',
        priority: 'medium',
        estimatedImprovement: 0.6
      },

      // Índices para Automation
      {
        table: 'Automation',
        columns: ['user_id', 'is_active'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por usuário e status ativo',
        priority: 'high',
        estimatedImprovement: 0.8
      },
      {
        table: 'Automation',
        columns: ['type', 'status'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por tipo e status',
        priority: 'medium',
        estimatedImprovement: 0.6
      },

      // Índices para User
      {
        table: 'User',
        columns: ['plan_type', 'is_active'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por plano e status ativo',
        priority: 'high',
        estimatedImprovement: 0.7
      },
      {
        table: 'User',
        columns: ['last_activity_at'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por última atividade',
        priority: 'medium',
        estimatedImprovement: 0.5
      },

      // Índices para Simulation
      {
        table: 'simulations',
        columns: ['user_id', 'status'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por usuário e status',
        priority: 'high',
        estimatedImprovement: 0.8
      },
      {
        table: 'simulations',
        columns: ['simulation_type', 'status'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por tipo e status',
        priority: 'medium',
        estimatedImprovement: 0.6
      },

      // Índices para Payment
      {
        table: 'Payment',
        columns: ['user_id', 'status'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por usuário e status de pagamento',
        priority: 'high',
        estimatedImprovement: 0.7
      },
      {
        table: 'Payment',
        columns: ['plan_type', 'status'],
        type: 'btree',
        unique: false,
        reason: 'Filtros por plano e status',
        priority: 'medium',
        estimatedImprovement: 0.6
      },

      // Índices para busca de texto
      {
        table: 'User',
        columns: ['email'],
        type: 'gin',
        unique: false,
        reason: 'Busca de texto em email',
        priority: 'medium',
        estimatedImprovement: 0.8
      },
      {
        table: 'User',
        columns: ['username'],
        type: 'gin',
        unique: false,
        reason: 'Busca de texto em username',
        priority: 'medium',
        estimatedImprovement: 0.8
      }
    );

    return recommendations;
  }

  /**
   * Gera nome para índice
   */
  private generateIndexName(table: string, columns: string[]): string {
    const columnStr = columns.join('_');
    return `idx_${table.toLowerCase()}_${columnStr}`;
  }

  /**
   * Gera SQL para criar índice
   */
  private generateCreateIndexSQL(
    rec: IndexRecommendation,
    indexName: string
  ): string {
    const columns = rec.columns.map(col => `"${col}"`).join(', ');
    const unique = rec.unique ? 'UNIQUE ' : '';
    const partial = rec.partial ? ` WHERE ${rec.partial}` : '';

    return `CREATE ${unique}INDEX IF NOT EXISTS "${indexName}" ON "${rec.table}" USING ${rec.type} (${columns})${partial};`;
  }

  /**
   * Monitora performance de queries e ajusta índices automaticamente
   */
  async monitorAndOptimize(): Promise<void> {
    try {
      this.logger.info('Starting automatic index optimization...');

      // Analisar performance atual
      const analysis = await this.analyzeIndexes();
      
      // Criar índices recomendados se houver melhorias significativas
      const highPriorityRecs = analysis.recommendations.filter(r => r.priority === 'high');
      
      if (highPriorityRecs.length > 0) {
        await this.createRecommendedIndexes(highPriorityRecs, false);
      }

      // Remover índices não utilizados
      if (analysis.unusedIndexes.length > 0) {
        await this.removeUnusedIndexes(analysis.unusedIndexes, false);
      }

      // Otimizar índices existentes
      await this.optimizeExistingIndexes();

      this.logger.info('Automatic index optimization completed');

    } catch (error) {
      this.logger.error('Automatic index optimization failed', {
        error: (error as Error).message
      });
      throw error;
    }
  }
}
