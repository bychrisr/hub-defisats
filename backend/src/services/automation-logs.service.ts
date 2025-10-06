import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AutomationLog {
  id: string;
  userId: string;
  accountId: string;
  automationId: string;
  automationName: string;
  action: 'started' | 'completed' | 'failed' | 'paused' | 'resumed' | 'stopped' | 'error';
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RUNNING';
  details: Record<string, any>;
  errorMessage?: string;
  duration?: number;
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    executionTime: number;
    networkRequests: number;
  };
  exchangeName: string;
  accountName: string;
  userEmail: string;
  planType: string;
}

export interface AutomationLogStats {
  totalLogs: number;
  successfulLogs: number;
  failedLogs: number;
  averageExecutionTime: number;
  averageCpuUsage: number;
  averageMemoryUsage: number;
  errorRate: number;
  automationStats: Array<{
    automationId: string;
    automationName: string;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
  }>;
  accountStats: Array<{
    accountId: string;
    accountName: string;
    exchangeName: string;
    totalExecutions: number;
    successRate: number;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface AutomationLogQuery {
  userId?: string;
  accountId?: string;
  automationId?: string;
  action?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export class AutomationLogsService {
  private prisma: PrismaClient;
  private logs: Map<string, AutomationLog> = new Map();
  private stats: Map<string, AutomationLogStats> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    console.log('🚀 AUTOMATION LOGS SERVICE - Service initialized');
  }

  // ===== LOGGING PRINCIPAL =====

  public async logAutomationEvent(
    userId: string,
    accountId: string,
    automationId: string,
    action: AutomationLog['action'],
    details: Record<string, any> = {},
    errorMessage?: string,
    performance?: Partial<AutomationLog['performance']>
  ): Promise<AutomationLog> {
    try {
      console.log(`📝 AUTOMATION LOGS - Logging event: ${action} for automation ${automationId}`);

      // Obter informações da automação
      const automation = await this.prisma.automation.findUnique({
        where: { id: automationId },
        include: {
          user: {
            select: { email: true, plan_type: true }
          },
          userExchangeAccount: {
            select: {
              account_name: true,
              exchange: {
                select: { name: true }
              }
            }
          }
        }
      });

      if (!automation) {
        throw new Error(`Automation ${automationId} not found`);
      }

      // Obter informações da conta
      const account = await this.prisma.userExchangeAccount.findUnique({
        where: { id: accountId },
        include: {
          exchange: {
            select: { name: true }
          }
        }
      });

      if (!account) {
        throw new Error(`Account ${accountId} not found`);
      }

      // Calcular duração se for uma ação de conclusão
      let duration: number | undefined;
      if (action === 'completed' || action === 'failed' || action === 'stopped') {
        const startLog = await this.findLastLogByAction(userId, automationId, 'started');
        if (startLog) {
          duration = Date.now() - new Date(startLog.timestamp).getTime();
        }
      }

      // Obter métricas de performance do sistema
      const systemPerformance = await this.getSystemPerformance();

      const log: AutomationLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        accountId,
        automationId,
        automationName: automation.name,
        action,
        timestamp: new Date().toISOString(),
        status: this.getStatusFromAction(action),
        details: {
          ...details,
          automationType: automation.automation_type,
          automationConfig: automation.config,
          accountName: account.account_name,
          exchangeName: account.exchange.name
        },
        errorMessage,
        duration,
        performance: {
          cpuUsage: performance?.cpuUsage || systemPerformance.cpuUsage,
          memoryUsage: performance?.memoryUsage || systemPerformance.memoryUsage,
          executionTime: duration || 0,
          networkRequests: performance?.networkRequests || 0
        },
        exchangeName: account.exchange.name,
        accountName: account.account_name,
        userEmail: automation.user.email,
        planType: automation.user.plan_type
      };

      // Salvar no cache
      this.logs.set(log.id, log);

      // Salvar no banco de dados (se necessário)
      await this.saveLogToDatabase(log);

      // Atualizar estatísticas
      await this.updateStats(userId, log);

      console.log(`✅ AUTOMATION LOGS - Event logged: ${action} for automation ${automationId}`);
      return log;

    } catch (error) {
      console.error('❌ AUTOMATION LOGS - Error logging event:', error);
      throw error;
    }
  }

  // ===== CONSULTA DE LOGS =====

  public async getAutomationLogs(query: AutomationLogQuery = {}): Promise<{
    logs: AutomationLog[];
    total: number;
    page: number;
    limit: number;
    stats: AutomationLogStats;
  }> {
    try {
      console.log('🔍 AUTOMATION LOGS - Fetching logs with query:', query);

      const {
        userId,
        accountId,
        automationId,
        action,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        search
      } = query;

      // Construir filtros
      const filters: any = {};
      
      if (userId) filters.userId = userId;
      if (accountId) filters.accountId = accountId;
      if (automationId) filters.automationId = automationId;
      if (action) filters.action = action;
      if (status) filters.status = status;
      
      if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) filters.timestamp.gte = new Date(startDate);
        if (endDate) filters.timestamp.lte = new Date(endDate);
      }

      // Buscar logs do cache primeiro
      let logs = Array.from(this.logs.values());

      // Aplicar filtros
      if (Object.keys(filters).length > 0) {
        logs = logs.filter(log => {
          for (const [key, value] of Object.entries(filters)) {
            if (key === 'timestamp') {
              if (value.gte && new Date(log.timestamp) < new Date(value.gte)) return false;
              if (value.lte && new Date(log.timestamp) > new Date(value.lte)) return false;
            } else if (log[key as keyof AutomationLog] !== value) {
              return false;
            }
          }
          return true;
        });
      }

      // Aplicar busca por texto
      if (search) {
        const searchLower = search.toLowerCase();
        logs = logs.filter(log => 
          log.automationName.toLowerCase().includes(searchLower) ||
          log.accountName.toLowerCase().includes(searchLower) ||
          log.exchangeName.toLowerCase().includes(searchLower) ||
          log.userEmail.toLowerCase().includes(searchLower) ||
          (log.errorMessage && log.errorMessage.toLowerCase().includes(searchLower))
        );
      }

      // Ordenar
      logs.sort((a, b) => {
        const aValue = a[sortBy as keyof AutomationLog];
        const bValue = b[sortBy as keyof AutomationLog];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Paginação
      const total = logs.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLogs = logs.slice(startIndex, endIndex);

      // Calcular estatísticas
      const stats = await this.calculateStats(logs, query);

      console.log(`✅ AUTOMATION LOGS - Found ${total} logs, returning ${paginatedLogs.length}`);

      return {
        logs: paginatedLogs,
        total,
        page,
        limit,
        stats
      };

    } catch (error) {
      console.error('❌ AUTOMATION LOGS - Error fetching logs:', error);
      throw error;
    }
  }

  // ===== ESTATÍSTICAS =====

  public async getAutomationStats(
    userId?: string,
    accountId?: string,
    timeRange?: { start: string; end: string }
  ): Promise<AutomationLogStats> {
    try {
      console.log('📊 AUTOMATION LOGS - Calculating stats for:', { userId, accountId, timeRange });

      const logs = Array.from(this.logs.values());
      return await this.calculateStats(logs, { userId, accountId, ...timeRange });

    } catch (error) {
      console.error('❌ AUTOMATION LOGS - Error calculating stats:', error);
      throw error;
    }
  }

  private async calculateStats(logs: AutomationLog[], query: AutomationLogQuery): Promise<AutomationLogStats> {
    const totalLogs = logs.length;
    const successfulLogs = logs.filter(log => log.status === 'SUCCESS').length;
    const failedLogs = logs.filter(log => log.status === 'FAILED').length;
    
    const averageExecutionTime = logs
      .filter(log => log.duration)
      .reduce((sum, log) => sum + (log.duration || 0), 0) / 
      logs.filter(log => log.duration).length || 0;

    const averageCpuUsage = logs
      .reduce((sum, log) => sum + log.performance.cpuUsage, 0) / logs.length || 0;

    const averageMemoryUsage = logs
      .reduce((sum, log) => sum + log.performance.memoryUsage, 0) / logs.length || 0;

    const errorRate = totalLogs > 0 ? (failedLogs / totalLogs) * 100 : 0;

    // Estatísticas por automação
    const automationStats = this.calculateAutomationStats(logs);
    
    // Estatísticas por conta
    const accountStats = this.calculateAccountStats(logs);

    return {
      totalLogs,
      successfulLogs,
      failedLogs,
      averageExecutionTime,
      averageCpuUsage,
      averageMemoryUsage,
      errorRate,
      automationStats,
      accountStats,
      timeRange: {
        start: logs.length > 0 ? logs[logs.length - 1].timestamp : new Date().toISOString(),
        end: logs.length > 0 ? logs[0].timestamp : new Date().toISOString()
      }
    };
  }

  private calculateAutomationStats(logs: AutomationLog[]): Array<{
    automationId: string;
    automationName: string;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
  }> {
    const automationMap = new Map<string, {
      automationId: string;
      automationName: string;
      totalExecutions: number;
      successfulExecutions: number;
      totalExecutionTime: number;
    }>();

    logs.forEach(log => {
      const key = log.automationId;
      if (!automationMap.has(key)) {
        automationMap.set(key, {
          automationId: log.automationId,
          automationName: log.automationName,
          totalExecutions: 0,
          successfulExecutions: 0,
          totalExecutionTime: 0
        });
      }

      const stats = automationMap.get(key)!;
      stats.totalExecutions++;
      if (log.status === 'SUCCESS') stats.successfulExecutions++;
      if (log.duration) stats.totalExecutionTime += log.duration;
    });

    return Array.from(automationMap.values()).map(stats => ({
      automationId: stats.automationId,
      automationName: stats.automationName,
      totalExecutions: stats.totalExecutions,
      successRate: stats.totalExecutions > 0 ? (stats.successfulExecutions / stats.totalExecutions) * 100 : 0,
      averageExecutionTime: stats.totalExecutions > 0 ? stats.totalExecutionTime / stats.totalExecutions : 0
    }));
  }

  private calculateAccountStats(logs: AutomationLog[]): Array<{
    accountId: string;
    accountName: string;
    exchangeName: string;
    totalExecutions: number;
    successRate: number;
  }> {
    const accountMap = new Map<string, {
      accountId: string;
      accountName: string;
      exchangeName: string;
      totalExecutions: number;
      successfulExecutions: number;
    }>();

    logs.forEach(log => {
      const key = log.accountId;
      if (!accountMap.has(key)) {
        accountMap.set(key, {
          accountId: log.accountId,
          accountName: log.accountName,
          exchangeName: log.exchangeName,
          totalExecutions: 0,
          successfulExecutions: 0
        });
      }

      const stats = accountMap.get(key)!;
      stats.totalExecutions++;
      if (log.status === 'SUCCESS') stats.successfulExecutions++;
    });

    return Array.from(accountMap.values()).map(stats => ({
      accountId: stats.accountId,
      accountName: stats.accountName,
      exchangeName: stats.exchangeName,
      totalExecutions: stats.totalExecutions,
      successRate: stats.totalExecutions > 0 ? (stats.successfulExecutions / stats.totalExecutions) * 100 : 0
    }));
  }

  // ===== MÉTODOS AUXILIARES =====

  private getStatusFromAction(action: AutomationLog['action']): AutomationLog['status'] {
    switch (action) {
      case 'started':
      case 'resumed':
        return 'RUNNING';
      case 'completed':
        return 'SUCCESS';
      case 'failed':
      case 'error':
        return 'FAILED';
      case 'paused':
      case 'stopped':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }

  private async findLastLogByAction(
    userId: string,
    automationId: string,
    action: AutomationLog['action']
  ): Promise<AutomationLog | null> {
    const logs = Array.from(this.logs.values())
      .filter(log => 
        log.userId === userId && 
        log.automationId === automationId && 
        log.action === action
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return logs.length > 0 ? logs[0] : null;
  }

  private async getSystemPerformance(): Promise<{
    cpuUsage: number;
    memoryUsage: number;
  }> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        cpuUsage: Math.round(cpuUsage.user / 1000000), // Convert to percentage
        memoryUsage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      };
    } catch (error) {
      return { cpuUsage: 0, memoryUsage: 0 };
    }
  }

  private async saveLogToDatabase(log: AutomationLog): Promise<void> {
    try {
      // TODO: Implementar salvamento no banco de dados se necessário
      // Por enquanto, mantemos apenas no cache
      console.log('💾 AUTOMATION LOGS - Log saved to cache:', log.id);
    } catch (error) {
      console.error('❌ AUTOMATION LOGS - Error saving to database:', error);
    }
  }

  private async updateStats(userId: string, log: AutomationLog): Promise<void> {
    try {
      // Atualizar estatísticas em tempo real
      const statsKey = `${userId}-${log.accountId}`;
      const currentStats = this.stats.get(statsKey);
      
      if (currentStats) {
        // Atualizar estatísticas existentes
        currentStats.totalLogs++;
        if (log.status === 'SUCCESS') currentStats.successfulLogs++;
        if (log.status === 'FAILED') currentStats.failedLogs++;
        
        this.stats.set(statsKey, currentStats);
      }
    } catch (error) {
      console.error('❌ AUTOMATION LOGS - Error updating stats:', error);
    }
  }

  // ===== MÉTODOS PÚBLICOS =====

  public async clearLogs(userId?: string, accountId?: string): Promise<void> {
    try {
      if (userId && accountId) {
        // Limpar logs específicos
        const keysToDelete = Array.from(this.logs.keys()).filter(key => {
          const log = this.logs.get(key);
          return log && log.userId === userId && log.accountId === accountId;
        });
        
        keysToDelete.forEach(key => this.logs.delete(key));
        console.log(`🧹 AUTOMATION LOGS - Cleared ${keysToDelete.length} logs for user ${userId}, account ${accountId}`);
      } else {
        // Limpar todos os logs
        this.logs.clear();
        this.stats.clear();
        console.log('🧹 AUTOMATION LOGS - Cleared all logs');
      }
    } catch (error) {
      console.error('❌ AUTOMATION LOGS - Error clearing logs:', error);
    }
  }

  public getLogsCount(): number {
    return this.logs.size;
  }

  public getStatsCount(): number {
    return this.stats.size;
  }
}
