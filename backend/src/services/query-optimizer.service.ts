import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

export interface QueryOptimizationOptions {
  includeRelations?: boolean;
  batchSize?: number;
  maxDepth?: number;
}

export class QueryOptimizerService {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Otimiza queries N+1 usando include estratégico
   */
  async getUsersWithAutomations(userIds: string[]): Promise<any[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            in: userIds
          }
        },
        include: {
          automations: {
            where: {
              is_active: true
            },
            orderBy: {
              created_at: 'desc'
            }
          },
          trade_logs: {
            take: 10,
            orderBy: {
              created_at: 'desc'
            }
          }
        }
      });

      this.logger.debug(`Optimized query: fetched ${users.length} users with relations`);
      return users;
    } catch (error) {
      this.logger.error('Query optimization error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Otimiza queries de dashboard com dados agregados
   */
  async getDashboardData(userId: string): Promise<any> {
    try {
      const [user, automations, recentTrades, notifications] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            plan_type: true,
            created_at: true,
            last_activity_at: true
          }
        }),
        this.prisma.automation.findMany({
          where: { user_id: userId },
          select: {
            id: true,
            type: true,
            is_active: true,
            created_at: true,
            updated_at: true
          },
          orderBy: { created_at: 'desc' }
        }),
        this.prisma.tradeLog.findMany({
          where: { user_id: userId },
          select: {
            id: true,
            status: true,
            executed_at: true,
            error_message: true
          },
          take: 20,
          orderBy: { executed_at: 'desc' }
        }),
        this.prisma.notification.findMany({
          where: { user_id: userId },
          select: {
            id: true,
            type: true,
            status: true,
            created_at: true,
            message: true
          },
          take: 10,
          orderBy: { created_at: 'desc' }
        })
      ]);

      this.logger.debug(`Dashboard data optimized for user: ${userId}`);
      return {
        user,
        automations,
        recentTrades,
        notifications
      };
    } catch (error) {
      this.logger.error('Dashboard query optimization error', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Otimiza queries de simulações com paginação
   */
  async getSimulationsPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const offset = (page - 1) * limit;
      
      const [simulations, total] = await Promise.all([
        this.prisma.simulation.findMany({
          where: { user_id: userId },
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.simulation.count({
          where: { user_id: userId }
        })
      ]);

      const pages = Math.ceil(total / limit);

      this.logger.debug(`Simulations paginated: page ${page}/${pages}, total: ${total}`);
      
      return {
        data: simulations,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      };
    } catch (error) {
      this.logger.error('Simulations pagination error', { userId, page, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Otimiza queries de trade logs com filtros
   */
  async getTradeLogsFiltered(
    userId: string,
    filters: {
      status?: string;
      automationId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const offset = (page - 1) * limit;
      
      const whereClause: any = {
        user_id: userId
      };

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.automationId) {
        whereClause.automation_id = filters.automationId;
      }

      if (filters.startDate || filters.endDate) {
        whereClause.executed_at = {};
        if (filters.startDate) {
          whereClause.executed_at.gte = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.executed_at.lte = filters.endDate;
        }
      }

      const [tradeLogs, total] = await Promise.all([
        this.prisma.tradeLog.findMany({
          where: whereClause,
          include: {
            automation: {
              select: {
                id: true,
                type: true,
                is_active: true
              }
            }
          },
          orderBy: { executed_at: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.tradeLog.count({
          where: whereClause
        })
      ]);

      const pages = Math.ceil(total / limit);

      this.logger.debug(`Trade logs filtered: page ${page}/${pages}, total: ${total}`);
      
      return {
        data: tradeLogs,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      };
    } catch (error) {
      this.logger.error('Trade logs filtering error', { userId, filters, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Otimiza queries de notificações com status
   */
  async getNotificationsByStatus(
    userId: string,
    status: 'pending' | 'sent' | 'failed' = 'pending'
  ): Promise<any[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          user_id: userId,
          status: status
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      this.logger.debug(`Notifications by status optimized: ${notifications.length} ${status} notifications`);
      return notifications;
    } catch (error) {
      this.logger.error('Notifications query optimization error', { userId, status, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Otimiza queries de métricas agregadas
   */
  async getAggregatedMetrics(userId: string): Promise<{
    totalAutomations: number;
    activeAutomations: number;
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    totalSimulations: number;
    completedSimulations: number;
  }> {
    try {
      const [
        totalAutomations,
        activeAutomations,
        totalTrades,
        successfulTrades,
        failedTrades,
        totalSimulations,
        completedSimulations
      ] = await Promise.all([
        this.prisma.automation.count({
          where: { user_id: userId }
        }),
        this.prisma.automation.count({
          where: { 
            user_id: userId,
            is_active: true
          }
        }),
        this.prisma.tradeLog.count({
          where: { user_id: userId }
        }),
        this.prisma.tradeLog.count({
          where: { 
            user_id: userId,
            status: 'success'
          }
        }),
        this.prisma.tradeLog.count({
          where: { 
            user_id: userId,
            status: 'app_error'
          }
        }),
        this.prisma.simulation.count({
          where: { user_id: userId }
        }),
        this.prisma.simulation.count({
          where: { 
            user_id: userId,
            status: 'completed'
          }
        })
      ]);

      this.logger.debug(`Aggregated metrics optimized for user: ${userId}`);
      
      return {
        totalAutomations,
        activeAutomations,
        totalTrades,
        successfulTrades,
        failedTrades,
        totalSimulations,
        completedSimulations
      };
    } catch (error) {
      this.logger.error('Aggregated metrics query error', { userId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Otimiza queries de busca com texto
   */
  async searchUsers(
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const offset = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: {
            OR: [
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { username: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            email: true,
            username: true,
            plan_type: true,
            is_active: true,
            created_at: true,
            last_activity_at: true
          },
          orderBy: { created_at: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.user.count({
          where: {
            OR: [
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { username: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        })
      ]);

      const pages = Math.ceil(total / limit);

      this.logger.debug(`User search optimized: "${searchTerm}", page ${page}/${pages}, total: ${total}`);
      
      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      };
    } catch (error) {
      this.logger.error('User search optimization error', { searchTerm, error: (error as Error).message });
      throw error;
    }
  }
}