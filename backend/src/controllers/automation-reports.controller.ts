import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

export class AutomationReportsController {
  constructor(private prisma: PrismaClient) {}

  // Get user's automation execution reports
  async getUserAutomationReports(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const { 
        type = 'all',
        status = 'all',
        limit = '50',
        offset = '0'
      } = request.query as any;

      console.log('🔍 AUTOMATION REPORTS - Fetching reports for user:', userId);

      // Build where clause
      const whereClause: any = {
        user_id: userId
      };

      if (type !== 'all') {
        whereClause.automation = {
          type: type
        };
      }

      if (status !== 'all') {
        whereClause.status = status;
      }

      // Get automation executions (from trade_logs table)
      const executions = await this.prisma.tradeLog.findMany({
        where: whereClause,
        include: {
          automation: {
            select: {
              id: true,
              type: true,
              config: true,
              is_active: true
            }
          }
        },
        orderBy: {
          executed_at: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      // Get automation statistics
      const totalExecutions = await this.prisma.tradeLog.count({
        where: {
          user_id: userId,
          automation_id: { not: null }
        }
      });

      const successCount = await this.prisma.tradeLog.count({
        where: {
          user_id: userId,
          automation_id: { not: null },
          status: 'success'
        }
      });

      const errorCount = await this.prisma.tradeLog.count({
        where: {
          user_id: userId,
          automation_id: { not: null },
          status: { in: ['app_error', 'exchange_error'] }
        }
      });

      // Get recent executions by automation type
      const recentByType = await this.prisma.tradeLog.groupBy({
        by: ['automation_id'],
        where: {
          user_id: userId,
          automation_id: { not: null },
          executed_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        _count: {
          id: true
        },
        _max: {
          executed_at: true
        }
      });

      // Get user's active automations
      const activeAutomations = await this.prisma.automation.findMany({
        where: {
          user_id: userId,
          is_active: true
        },
        select: {
          id: true,
          type: true,
          config: true,
          created_at: true,
          updated_at: true
        }
      });

      const successRate = totalExecutions > 0 ? Math.round((successCount / totalExecutions) * 100) : 0;

      const response = {
        success: true,
        data: {
          executions: executions.map(exec => ({
            id: exec.id,
            automation_id: exec.automation_id,
            automation_type: exec.automation?.type || 'unknown',
            status: exec.status,
            error_message: exec.error_message,
            executed_at: exec.executed_at,
            created_at: exec.created_at,
            automation: exec.automation
          })),
          statistics: {
            total_executions: totalExecutions,
            success_count: successCount,
            error_count: errorCount,
            success_rate: successRate,
            recent_executions_24h: recentByType.length
          },
          active_automations: activeAutomations,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: totalExecutions
          }
        }
      };

      console.log('✅ AUTOMATION REPORTS - Reports fetched successfully:', {
        userId,
        totalExecutions,
        successRate,
        activeAutomations: activeAutomations.length
      });

      return reply.send(response);

    } catch (error: any) {
      console.error('❌ AUTOMATION REPORTS - Error fetching reports:', error);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch automation reports'
      });
    }
  }

  // Get automation execution details
  async getAutomationExecutionDetails(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      const { executionId } = request.params as { executionId: string };

      if (!userId) {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const execution = await this.prisma.tradeLog.findFirst({
        where: {
          id: executionId,
          user_id: userId,
          automation_id: { not: null }
        },
        include: {
          automation: {
            select: {
              id: true,
              type: true,
              config: true,
              is_active: true
            }
          }
        }
      });

      if (!execution) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'Automation execution not found'
        });
      }

      return reply.send({
        success: true,
        data: {
          id: execution.id,
          automation_id: execution.automation_id,
          automation_type: execution.automation?.type || 'unknown',
          status: execution.status,
          error_message: execution.error_message,
          executed_at: execution.executed_at,
          created_at: execution.created_at,
          automation: execution.automation
        }
      });

    } catch (error: any) {
      console.error('❌ AUTOMATION REPORTS - Error fetching execution details:', error);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch execution details'
      });
    }
  }
}
