import { PrismaClient } from '@prisma/client';
import { FastifyRequest, FastifyReply } from 'fastify';

interface TradeLogQuery {
  page?: string;
  limit?: string;
  status?: 'success' | 'app_error' | 'exchange_error';
  automation_id?: string;
}

interface TradeLogParams {
  id: string;
}

export class TradeLogController {
  constructor(private prisma: PrismaClient) {}

  async getUserTradeLogs(
    request: FastifyRequest<{ Querystring: TradeLogQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const page = parseInt(request.query.page || '1');
      const limit = Math.min(parseInt(request.query.limit || '20'), 100);
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        automation: {
          user_id: userId,
        },
      };

      if (request.query.status) {
        where.status = request.query.status;
      }

      if (request.query.automation_id) {
        where.automation_id = request.query.automation_id;
      }

      // Get trade logs with pagination
      const [tradeLogs, total] = await Promise.all([
        this.prisma.tradeLog.findMany({
          where,
          include: {
            automation: {
              select: {
                id: true,
                type: true,
                config: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.tradeLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        success: true,
        data: {
          tradeLogs,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching user trade logs:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch trade logs',
      });
    }
  }

  async getTradeLogById(
    request: FastifyRequest<{ Params: TradeLogParams }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const { id } = request.params;

      const tradeLog = await this.prisma.tradeLog.findFirst({
        where: {
          id,
          automation: {
            user_id: userId,
          },
        },
        include: {
          automation: {
            select: {
              id: true,
              type: true,
              config: true,
            },
          },
        },
      });

      if (!tradeLog) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Trade log not found',
        });
      }

      return reply.send({
        success: true,
        data: tradeLog,
      });
    } catch (error) {
      console.error('Error fetching trade log by ID:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch trade log',
      });
    }
  }

  async getTradeLogStats(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const where = {
        automation: {
          user_id: userId,
        },
      };

      // Get basic counts
      const [total, success, errors, recent] = await Promise.all([
        this.prisma.tradeLog.count({ where }),
        this.prisma.tradeLog.count({
          where: { ...where, status: 'success' },
        }),
        this.prisma.tradeLog.count({
          where: {
            ...where,
            status: { in: ['app_error', 'exchange_error'] },
          },
        }),
        this.prisma.tradeLog.count({
          where: {
            ...where,
            created_at: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      // Get counts by status
      const byStatus = await this.prisma.tradeLog.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true,
        },
      });

      const byStatusObj = byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      // Get count by automation
      const byAutomation = await this.prisma.tradeLog.groupBy({
        by: ['automation_id'],
        where,
        _count: {
          automation_id: true,
        },
      });

      const successRate = total > 0 ? (success / total) * 100 : 0;

      return reply.send({
        success: true,
        data: {
          total,
          success,
          errors,
          successRate: Math.round(successRate * 100) / 100,
          recent,
          byStatus: byStatusObj,
          byAutomation: byAutomation.length,
        },
      });
    } catch (error) {
      console.error('Error fetching trade log stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch trade log statistics',
      });
    }
  }
}
