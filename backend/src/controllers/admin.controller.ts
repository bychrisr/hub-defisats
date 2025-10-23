import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminController {
  /**
   * Get advanced dashboard KPIs with detailed metrics
   */
  async getAdvancedDashboard(request: FastifyRequest<{ Querystring: { period: string } }>, reply: FastifyReply) {
    const { period = '24h' } = request.query;

    try {
      const now = new Date();
      const periods = {
        '1h': new Date(now.getTime() - 60 * 60 * 1000),
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
      const startDate = periods[period as keyof typeof periods];

      // Get comprehensive metrics
      const [
        userMetrics,
        tradeMetrics,
        paymentMetrics,
        automationMetrics,
        notificationMetrics,
        systemMetrics
      ] = await Promise.all([
        this.getUserMetrics(startDate),
        this.getTradeMetrics(startDate),
        this.getPaymentMetrics(startDate),
        this.getAutomationMetrics(startDate),
        this.getNotificationMetrics(startDate),
        this.getSystemMetrics()
      ]);

      // Calculate growth rates
      const previousPeriod = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
      const previousMetrics = await this.getUserMetrics(previousPeriod);

      const growthRate = previousMetrics.total_users > 0
        ? ((userMetrics.total_users - previousMetrics.total_users) / previousMetrics.total_users) * 100
        : 0;

      reply.send({
        success: true,
        data: {
          period,
          kpis: {
            ...userMetrics,
            ...tradeMetrics,
            ...paymentMetrics,
            ...automationMetrics,
            ...notificationMetrics,
            ...systemMetrics,
            growth_rate: Math.round(growthRate * 100) / 100,
          },
          charts: await this.getDashboardCharts(startDate, now),
          alerts: await this.getRecentAlerts(10),
        },
      });
    } catch (error: any) {
      console.error('Error getting advanced dashboard:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch dashboard data',
      });
    }
  }

  /**
   * Get user-related metrics
   */
  private async getUserMetrics(startDate: Date) {
    const [
      totalUsers,
      activeUsers,
      newUsers,
      usersByPlan,
      topUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { last_activity_at: { gte: startDate } },
      }),
      prisma.user.count({
        where: { created_at: { gte: startDate } },
      }),
      prisma.user.groupBy({
        by: ['plan_type'],
        _count: { plan_type: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          plan_type: true,
          created_at: true,
        },
      }),
    ]);

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      new_users: newUsers,
      users_by_plan: usersByPlan.map(p => ({
        plan: p.plan_type,
        count: p._count.plan_type,
      })),
      top_users: topUsers,
    };
  }

  /**
   * Get trade-related metrics
   */
  private async getTradeMetrics(startDate: Date) {
    const tradeStats = await prisma.tradeLog.groupBy({
      by: ['status'],
      where: { executed_at: { gte: startDate } },
      _count: { status: true },
    });

    const successTrades = tradeStats.find(t => t.status === 'completed')?._count.status || 0;
    const failedTrades = tradeStats.filter(t => t.status === 'failed').reduce((sum, t) => sum + t._count.status, 0);
    const totalTrades = successTrades + failedTrades;
    const successRate = totalTrades > 0 ? (successTrades / totalTrades) * 100 : 0;

    return {
      total_trades: totalTrades,
      successful_trades: successTrades,
      failed_trades: failedTrades,
      success_rate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Get payment-related metrics
   */
  private async getPaymentMetrics(startDate: Date) {
    const [
      totalRevenue,
      paymentsByStatus,
      recentPayments
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: 'paid',
          paid_at: { gte: startDate },
        },
        _sum: { amount_sats: true },
      }),
      prisma.payment.groupBy({
        by: ['status'],
        where: { created_at: { gte: startDate } },
        _count: { status: true },
        _sum: { amount_sats: true },
      }),
      prisma.payment.findMany({
        where: { created_at: { gte: startDate } },
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          amount_sats: true,
          status: true,
          plan_type: true,
          user: {
            select: { email: true, username: true },
          },
        },
      }),
    ]);

    return {
      total_revenue: totalRevenue._sum.amount_sats || 0,
      payments_by_status: paymentsByStatus.map(p => ({
        status: p.status,
        count: p._count.status,
        amount: p._sum.amount_sats || 0,
      })),
      recent_payments: recentPayments,
    };
  }

  /**
   * Get automation-related metrics
   */
  private async getAutomationMetrics(startDate: Date) {
    const [
      totalAutomations,
      automationsByType,
      automationsByStatus
    ] = await Promise.all([
      prisma.automation.count(),
      prisma.automation.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      prisma.automation.groupBy({
        by: ['is_active'],
        _count: { is_active: true },
      }),
    ]);

    return {
      total_automations: totalAutomations,
      automations_by_type: automationsByType.map(a => ({
        type: a.type,
        count: a._count.type,
      })),
      automations_by_status: automationsByStatus.map(a => ({
        active: a.is_active,
        count: a._count.is_active,
      })),
    };
  }

  /**
   * Get notification-related metrics
   */
  private async getNotificationMetrics(startDate: Date) {
    const notificationStats = await prisma.notification.findMany({
      where: { created_at: { gte: startDate } },
      select: { status: true },
    });

    const sentCount = notificationStats.filter(n => n.status === 'sent').length;
    const failedCount = notificationStats.filter(n => n.status === 'failed').length;
    const totalNotifications = sentCount + failedCount;
    const deliveryRate = totalNotifications > 0 ? (sentCount / totalNotifications) * 100 : 0;

    return {
      total_notifications: totalNotifications,
      delivered_notifications: sentCount,
      failed_notifications: failedCount,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
    };
  }

  /**
   * Get system health metrics
   */
  private async getSystemMetrics() {
    // This would integrate with actual monitoring systems
    return {
      system_health: 'healthy',
      database_connections: 10,
      redis_memory_usage: '45MB',
      api_response_time: 150, // ms
      error_rate: 2.5, // %
    };
  }

  /**
   * Get dashboard charts data
   */
  private async getDashboardCharts(startDate: Date, endDate: Date) {
    // Get hourly trade data for the period
    const hourlyTrades = await prisma.tradeLog.groupBy({
      by: ['executed_at'],
      where: {
        executed_at: { gte: startDate, lte: endDate },
        status: 'completed',
      },
      _count: { executed_at: true },
      orderBy: { executed_at: 'asc' },
    });

    // Get daily user registrations
    const dailyUsers = await prisma.user.groupBy({
      by: ['created_at'],
      where: { created_at: { gte: startDate, lte: endDate } },
      _count: { created_at: true },
      orderBy: { created_at: 'asc' },
    });

    // Get daily revenue
    const dailyRevenue = await prisma.payment.groupBy({
      by: ['paid_at'],
      where: {
        paid_at: { gte: startDate, lte: endDate },
        status: 'paid',
      },
      _sum: { amount_sats: true },
      orderBy: { paid_at: 'asc' },
    });

    return {
      trades_over_time: hourlyTrades.map(t => ({
        time: t.executed_at,
        count: t._count.executed_at,
      })),
      users_over_time: dailyUsers.map(u => ({
        date: u.created_at.toISOString().split('T')[0],
        count: u._count.created_at,
      })),
      revenue_over_time: dailyRevenue.map(r => ({
        date: r.paid_at?.toISOString().split('T')[0],
        amount: r._sum.amount_sats || 0,
      })),
    };
  }

  /**
   * Get recent system alerts
   */
  private async getRecentAlerts(limit: number) {
    return await prisma.systemAlert.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        message: true,
        severity: true,
        created_at: true,
        is_global: true,
      },
    });
  }

  /**
   * Advanced coupon management
   */
  async createCoupon(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const couponData = request.body as {
        code: string;
        plan_type: string;
        usage_limit: number;
        expires_at?: string;
        value_type?: string;
        value_amount?: number;
        time_type?: string;
        time_days?: number;
        description?: string;
        is_active?: boolean;
      };

      const coupon = await prisma.coupon.create({
        data: {
          code: couponData.code,
          plan_type: couponData.plan_type as any,
          usage_limit: couponData.usage_limit,
          expires_at: couponData.expires_at ? new Date(couponData.expires_at) : null,
          value_type: couponData.value_type || 'fixed',
          value_amount: couponData.value_amount || 0,
          time_type: couponData.time_type || 'fixed',
          time_days: couponData.time_days,
          description: couponData.description,
          is_active: couponData.is_active ?? true,
        },
      });

      reply.send({
        success: true,
        data: coupon,
      });
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to create coupon',
      });
    }
  }

  /**
   * Update coupon
   */
  async updateCoupon(request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const updateData = request.body as {
        usage_limit?: number;
        expires_at?: string;
        is_active?: boolean;
        description?: string;
      };

      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
          ...(updateData.usage_limit && { usage_limit: updateData.usage_limit }),
          ...(updateData.expires_at && { expires_at: new Date(updateData.expires_at) }),
          ...(updateData.is_active !== undefined && { is_active: updateData.is_active }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          updated_at: new Date(),
        },
      });

      reply.send({
        success: true,
        data: coupon,
      });
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to update coupon',
      });
    }
  }

  /**
   * Get coupon analytics
   */
  async getCouponAnalytics(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const [coupon, usageStats, recentUses] = await Promise.all([
        prisma.coupon.findUnique({
          where: { id },
          include: { _count: { select: { user_coupons: true } } },
        }),
        prisma.userCoupon.groupBy({
          by: ['used_at'],
          where: { coupon_id: id },
          _count: { used_at: true },
          orderBy: { used_at: 'desc' },
          take: 30,
        }),
        prisma.userCoupon.findMany({
          where: { coupon_id: id },
          take: 10,
          orderBy: { used_at: 'desc' },
          include: {
            user: {
              select: { email: true, username: true },
            },
          },
        }),
      ]);

      if (!coupon) {
        return reply.code(404).send({
          success: false,
          error: 'Coupon not found',
        });
      }

      const totalUses = coupon._count.user_coupons;
      const conversionRate = coupon.usage_limit > 0 ? (totalUses / coupon.usage_limit) * 100 : 0;

      reply.send({
        success: true,
        data: {
          coupon: {
            ...coupon,
            usage_count: totalUses,
            remaining_uses: coupon.usage_limit - totalUses,
            conversion_rate: Math.round(conversionRate * 100) / 100,
          },
          usage_stats: usageStats.map(stat => ({
            date: stat.used_at,
            uses: stat._count.used_at,
          })),
          recent_uses: recentUses,
        },
      });
    } catch (error: any) {
      console.error('Error getting coupon analytics:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get coupon analytics',
      });
    }
  }

  /**
   * Bulk user operations
   */
  async bulkUserOperation(request: FastifyRequest<{ Body: { operation: string; userIds: string[]; data?: any } }>, reply: FastifyReply) {
    try {
      const body = request.body as {
        operation: string;
        userIds: string[];
        data?: {
          plan_type?: string;
        };
      };
      const { operation, userIds, data } = body;

      let result;

      switch (operation) {
        case 'activate':
          result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { is_active: true },
          });
          break;

        case 'deactivate':
          result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { is_active: false },
          });
          break;

        case 'change_plan':
          if (!data.plan_type) {
            return reply.code(400).send({
              success: false,
              error: 'Plan type required for plan change operation',
            });
          }
          result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { plan_type: data.plan_type as any },
          });
          break;

        default:
          return reply.code(400).send({
            success: false,
            error: 'Invalid operation',
          });
      }

      // Log bulk operation
      await prisma.systemAlert.create({
        data: {
          message: `Bulk ${operation} operation performed on ${result.count} users`,
          severity: 'info',
          is_global: true,
        },
      });

      reply.send({
        success: true,
        data: {
          operation,
          affected_users: result.count,
        },
      });
    } catch (error: any) {
      console.error('Error performing bulk operation:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to perform bulk operation',
      });
    }
  }

  /**
   * Get system logs with advanced filtering
   */
  async getAdvancedLogs(request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
    try {
      const query = request.query as {
        page?: string;
        limit?: string;
        level?: string;
        service?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
      };

      const {
        page = '1',
        limit = '50',
        level,
        service,
        start_date,
        end_date,
        search
      } = query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // This would integrate with actual logging system (Winston, Pino, etc.)
      // For now, return mock data
      const logs = [
        {
          id: '1',
          timestamp: new Date(),
          level: 'info',
          service: 'api',
          message: 'User login successful',
          user_id: 'user-123',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000),
          level: 'error',
          service: 'worker',
          message: 'LN Markets API timeout',
          user_id: null,
        },
      ];

      reply.send({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: logs.length,
          pages: Math.ceil(logs.length / limitNum),
        },
      });
    } catch (error: any) {
      console.error('Error getting advanced logs:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get logs',
      });
    }
  }

  /**
   * Export data for backup/reporting
   */
  async exportData(request: FastifyRequest<{ Body: { type: string; format: string; filters?: any } }>, reply: FastifyReply) {
    try {
      const body = request.body as {
        type: string;
        format: string;
        filters?: {
          plan_type?: string;
          start_date?: string;
        };
      };
      const { type, format = 'json', filters } = body;

      let data;

      switch (type) {
        case 'users':
          data = await prisma.user.findMany({
            select: {
              id: true,
              email: true,
              username: true,
              plan_type: true,
              created_at: true,
              last_activity_at: true,
            },
            ...(filters?.plan_type && { where: { plan_type: filters.plan_type as any } }),
          });
          break;

        case 'trades':
          data = await prisma.tradeLog.findMany({
            include: {
              user: {
                select: { email: true, username: true },
              },
              automation: {
                select: { type: true },
              },
            },
            ...(filters?.start_date && {
              where: { executed_at: { gte: new Date(filters.start_date) } },
            }),
          });
          break;

        case 'payments':
          data = await prisma.payment.findMany({
            include: {
              user: {
                select: { email: true, username: true },
              },
            },
          });
          break;

        default:
          return reply.code(400).send({
            success: false,
            error: 'Invalid export type',
          });
      }

      // In a real implementation, you'd format the data according to the requested format
      // and potentially stream it or provide a download URL

      reply.send({
        success: true,
        data: {
          type,
          format,
          count: data.length,
          exported_data: data,
          export_timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to export data',
      });
    }
  }
}

// Export singleton instance
export const adminController = new AdminController();

