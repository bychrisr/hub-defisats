import { PrismaClient } from '@prisma/client';
import { CreateCouponRequest, CouponResponse, PlanType } from '@/types/api-contracts';

export class CouponService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new coupon
   */
  async createCoupon(data: CreateCouponRequest, createdBy?: string): Promise<CouponResponse> {
    const { 
      code, 
      plan_type, 
      usage_limit, 
      expires_at,
      value_type,
      value_amount,
      time_type,
      time_days,
      description,
      is_active = true
    } = data as { 
      code: string; 
      plan_type: string; 
      usage_limit?: number; 
      expires_at?: string;
      value_type: string;
      value_amount: number;
      time_type: string;
      time_days?: number;
      description?: string;
      is_active?: boolean;
    };

    // Check if coupon code already exists
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    // Validate coupon configuration
    this.validateCouponConfiguration({
      value_type,
      value_amount,
      time_type,
      time_days
    });

    // Create coupon
    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        plan_type,
        usage_limit: usage_limit ?? null,
        expires_at: expires_at ? new Date(expires_at) : null,
        value_type,
        value_amount,
        time_type,
        time_days: time_type === 'fixed' ? time_days : null,
        description,
        is_active,
        created_by: createdBy,
      },
    });

    return this.mapCouponToResponse(coupon);
  }

  /**
   * Map coupon database model to response format
   */
  private mapCouponToResponse(coupon: any): CouponResponse {
    return {
      id: coupon.id,
      code: coupon.code,
      plan_type: coupon.plan_type as PlanType,
      usage_limit: coupon.usage_limit ?? 0,
      used_count: coupon.used_count ?? 0,
      expires_at: coupon.expires_at?.toISOString(),
      created_at: coupon.created_at.toISOString(),
      updated_at: coupon.updated_at.toISOString(),
      value_type: coupon.value_type as any,
      value_amount: coupon.value_amount,
      time_type: coupon.time_type as any,
      time_days: coupon.time_days ?? undefined,
      is_active: coupon.is_active,
      description: coupon.description,
      created_by: coupon.created_by,
      total_revenue_saved: coupon.total_revenue_saved,
      new_users_count: coupon.new_users_count,
      conversion_rate: coupon.conversion_rate,
    };
  }

  /**
   * Validate coupon configuration
   */
  private validateCouponConfiguration(config: {
    value_type: string;
    value_amount: number;
    time_type: string;
    time_days?: number;
  }): void {
    const { value_type, value_amount, time_type, time_days } = config;

    // Validate value type and amount
    if (value_type === 'percentage' && (value_amount < 1 || value_amount > 100)) {
      throw new Error('Percentage value must be between 1 and 100');
    }

    if (value_type === 'fixed' && (value_amount < 1 || value_amount > 1000000)) {
      throw new Error('Fixed value must be between 1 and 1,000,000 sats');
    }

    // Validate time type and days
    if (time_type === 'fixed' && (!time_days || time_days < 1 || time_days > 3650)) {
      throw new Error('Fixed time type requires time_days between 1 and 3650');
    }

    if (time_type === 'lifetime' && time_days) {
      throw new Error('Lifetime time type cannot have time_days');
    }
  }

  /**
   * Get all coupons
   */
  async getCoupons(): Promise<CouponResponse[]> {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { created_at: 'desc' },
    });

    return coupons.map(coupon => this.mapCouponToResponse(coupon));
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(id: string): Promise<CouponResponse | null> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return null;
    }

    return this.mapCouponToResponse(coupon);
  }

  /**
   * Update coupon
   */
  async updateCoupon(id: string, data: UpdateCouponRequest): Promise<CouponResponse> {
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      throw new Error('Coupon not found');
    }

    // If code is being updated, check if new code already exists
    if (data.code && data.code !== existingCoupon.code) {
      const codeExists = await this.prisma.coupon.findUnique({
        where: { code: data.code },
      });

      if (codeExists) {
        throw new Error('Coupon code already exists');
      }
    }

    // Validate configuration if relevant fields are being updated
    if (data.value_type || data.value_amount || data.time_type || data.time_days) {
      this.validateCouponConfiguration({
        value_type: data.value_type || existingCoupon.value_type,
        value_amount: data.value_amount || existingCoupon.value_amount,
        time_type: data.time_type || existingCoupon.time_type,
        time_days: data.time_days || existingCoupon.time_days,
      });
    }

    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return this.mapCouponToResponse(coupon);
  }

  /**
   * Delete coupon
   */
  async deleteCoupon(id: string): Promise<void> {
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      throw new Error('Coupon not found');
    }

    await this.prisma.coupon.delete({
      where: { id },
    });
  }

  /**
   * Toggle coupon active status
   */
  async toggleCouponActive(id: string, isActive: boolean): Promise<CouponResponse> {
    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });

    return this.mapCouponToResponse(coupon);
  }

  /**
   * Get coupon by code
   */
  async getCouponByCode(code: string): Promise<CouponResponse | null> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return null;
    }

    return this.mapCouponToResponse(coupon);
  }

  /**
   * Get coupon dashboard metrics
   */
  async getCouponDashboard(): Promise<any> {
    const [
      totalCoupons,
      activeCoupons,
      inactiveCoupons,
      totalUses,
      totalRevenueSaved,
      totalNewUsers,
      topCoupons,
      recentActivity,
      dailyMetrics
    ] = await Promise.all([
      // Total coupons
      this.prisma.coupon.count(),
      
      // Active coupons
      this.prisma.coupon.count({
        where: { is_active: true }
      }),
      
      // Inactive coupons
      this.prisma.coupon.count({
        where: { is_active: false }
      }),
      
      // Total uses
      this.prisma.userCoupon.count(),
      
      // Total revenue saved
      this.prisma.coupon.aggregate({
        _sum: { total_revenue_saved: true }
      }),
      
      // Total new users
      this.prisma.coupon.aggregate({
        _sum: { new_users_count: true }
      }),
      
      // Top coupons by usage
      this.prisma.coupon.findMany({
        orderBy: { used_count: 'desc' },
        take: 5,
        select: {
          id: true,
          code: true,
          used_count: true,
          total_revenue_saved: true,
          conversion_rate: true,
        }
      }),
      
      // Recent activity (simplified for now)
      this.prisma.coupon.findMany({
        orderBy: { updated_at: 'desc' },
        take: 10,
        select: {
          id: true,
          code: true,
          updated_at: true,
        }
      }),
      
      // Daily metrics for last 30 days
      this.prisma.couponAnalytics.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          views_count: true,
          clicks_count: true,
          uses_count: true,
          new_users_count: true,
          revenue_saved: true,
        }
      })
    ]);

    // Calculate average conversion rate
    const averageConversionRate = totalCoupons > 0 
      ? await this.prisma.coupon.aggregate({
          _avg: { conversion_rate: true }
        }).then(result => result._avg.conversion_rate || 0)
      : 0;

    return {
      total_coupons: totalCoupons,
      active_coupons: activeCoupons,
      inactive_coupons: inactiveCoupons,
      total_uses: totalUses,
      total_revenue_saved: totalRevenueSaved._sum.total_revenue_saved || 0,
      total_new_users: totalNewUsers._sum.new_users_count || 0,
      average_conversion_rate: averageConversionRate,
      top_coupons: topCoupons,
      recent_activity: recentActivity.map(activity => ({
        id: activity.id,
        code: activity.code,
        action: 'updated',
        timestamp: activity.updated_at.toISOString(),
      })),
      daily_metrics: dailyMetrics.map(metric => ({
        date: metric.date.toISOString(),
        views: metric.views_count,
        clicks: metric.clicks_count,
        uses: metric.uses_count,
        new_users: metric.new_users_count,
        revenue_saved: metric.revenue_saved,
      })),
    };
  }

  /**
   * Track coupon analytics
   */
  async trackCouponAnalytics(couponId: string, event: 'view' | 'click' | 'use', newUser = false, revenueSaved = 0): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create analytics record for today
    let analytics = await this.prisma.couponAnalytics.findUnique({
      where: {
        coupon_id_date: {
          coupon_id: couponId,
          date: today,
        }
      }
    });

    if (!analytics) {
      analytics = await this.prisma.couponAnalytics.create({
        data: {
          coupon_id: couponId,
          date: today,
          views_count: 0,
          clicks_count: 0,
          uses_count: 0,
          new_users_count: 0,
          revenue_saved: 0,
          conversion_rate: 0,
          click_through_rate: 0,
        }
      });
    }

    // Update metrics based on event
    const updateData: any = {};
    
    switch (event) {
      case 'view':
        updateData.views_count = { increment: 1 };
        break;
      case 'click':
        updateData.clicks_count = { increment: 1 };
        break;
      case 'use':
        updateData.uses_count = { increment: 1 };
        updateData.revenue_saved = { increment: revenueSaved };
        if (newUser) {
          updateData.new_users_count = { increment: 1 };
        }
        break;
    }

    // Update analytics
    await this.prisma.couponAnalytics.update({
      where: { id: analytics.id },
      data: updateData,
    });

    // Recalculate conversion rates
    const updatedAnalytics = await this.prisma.couponAnalytics.findUnique({
      where: { id: analytics.id },
    });

    if (updatedAnalytics) {
      const conversionRate = updatedAnalytics.views_count > 0 
        ? (updatedAnalytics.uses_count / updatedAnalytics.views_count) * 100 
        : 0;
      
      const clickThroughRate = updatedAnalytics.views_count > 0 
        ? (updatedAnalytics.clicks_count / updatedAnalytics.views_count) * 100 
        : 0;

      await this.prisma.couponAnalytics.update({
        where: { id: analytics.id },
        data: {
          conversion_rate: conversionRate,
          click_through_rate: clickThroughRate,
        }
      });
    }

    // Update coupon totals
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        total_revenue_saved: { increment: revenueSaved },
        new_users_count: newUser ? { increment: 1 } : undefined,
        conversion_rate: await this.calculateCouponConversionRate(couponId),
      }
    });
  }

  /**
   * Calculate coupon conversion rate
   */
  private async calculateCouponConversionRate(couponId: string): Promise<number> {
    const analytics = await this.prisma.couponAnalytics.findMany({
      where: { coupon_id: couponId },
    });

    const totalViews = analytics.reduce((sum, a) => sum + a.views_count, 0);
    const totalUses = analytics.reduce((sum, a) => sum + a.uses_count, 0);

    return totalViews > 0 ? (totalUses / totalViews) * 100 : 0;
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(code: string): Promise<{
    valid: boolean;
    coupon?: CouponResponse;
    error?: string;
  }> {
    try {
      const coupon = await this.getCouponByCode(code);

      if (!coupon) {
        return {
          valid: false,
          error: 'Coupon code not found',
        };
      }

      // Check if coupon has expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return {
          valid: false,
          error: 'Coupon has expired',
        };
      }

      // Check if usage limit has been reached
      if ((coupon.used_count ?? 0) >= (coupon.usage_limit ?? 0)) {
        return {
          valid: false,
          error: 'Coupon usage limit exceeded',
        };
      }

      return {
        valid: true,
        coupon,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Use coupon (increment usage count)
   */
  async useCoupon(code: string, userId: string): Promise<CouponResponse> {
    // Validate coupon first
    const validation = await this.validateCoupon(code);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid coupon');
    }

    // Check if user has already used this coupon
    const existingUsage = await this.prisma.userCoupon.findUnique({
      where: {
        user_id_coupon_id: {
          user_id: userId,
          coupon_id: validation.coupon!.id,
        },
      },
    });

    if (existingUsage) {
      throw new Error('User has already used this coupon');
    }

    // Use coupon
    const [updatedCoupon] = await this.prisma.$transaction([
      // Update coupon usage count
      this.prisma.coupon.update({
        where: { code },
        data: {
          used_count: {
            increment: 1,
          },
        },
      }),
      // Create user coupon record
      this.prisma.userCoupon.create({
        data: {
          user_id: userId,
          coupon_id: validation.coupon!.id,
        },
      }),
    ]);

    return {
      id: updatedCoupon.id,
      code: updatedCoupon.code,
      plan_type: updatedCoupon.plan_type as PlanType,
      usage_limit: updatedCoupon.usage_limit ?? 0,
      used_count: updatedCoupon.used_count ?? 0,
      expires_at: updatedCoupon.expires_at?.toISOString(),
      created_at: updatedCoupon.created_at.toISOString(),
    };
  }

  /**
   * Get coupon usage statistics
   */
  async getCouponStats(couponId: string): Promise<{
    total_uses: number;
    unique_users: number;
    recent_uses: Array<{
      user_id: string;
      user_email: string;
      used_at: string;
    }>;
  }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        user_coupons: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: { used_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    return {
      total_uses: coupon.used_count ?? 0,
      unique_users: coupon.user_coupons.length,
      recent_uses: coupon.user_coupons.map(uc => ({
        user_id: uc.user.id,
        user_email: uc.user.email,
        used_at: uc.used_at.toISOString(),
      })),
    };
  }

  /**
   * Delete coupon
   */
  async deleteCoupon(couponId: string): Promise<void> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

      // Check if coupon has been used
      if ((coupon.used_count ?? 0) > 0) {
        throw new Error('Cannot delete coupon that has been used');
      }

    await this.prisma.coupon.delete({
      where: { id: couponId },
    });
  }

  /**
   * Update coupon
   */
  async updateCoupon(
    couponId: string,
    data: Partial<{
      code: string;
      plan_type: PlanType;
      usage_limit: number;
      expires_at: string | null;
    }>
  ): Promise<CouponResponse> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Check if new code already exists (if code is being updated)
    if (data.code && data.code !== coupon.code) {
      const existingCoupon = await this.prisma.coupon.findUnique({
        where: { code: data.code },
      });

      if (existingCoupon) {
        throw new Error('Coupon code already exists');
      }
    }

    // Update coupon
    const updatedCoupon = await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...data,
        expires_at: data.expires_at
          ? new Date(data.expires_at)
          : data.expires_at || null,
      },
    });

    return {
      id: updatedCoupon.id,
      code: updatedCoupon.code,
      plan_type: updatedCoupon.plan_type as PlanType,
      usage_limit: updatedCoupon.usage_limit ?? 0,
      used_count: updatedCoupon.used_count ?? 0,
      expires_at: updatedCoupon.expires_at?.toISOString(),
      created_at: updatedCoupon.created_at.toISOString(),
    };
  }

  /**
   * Generate random coupon code
   */
  generateCouponCode(prefix: string = '', length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Create testers coupon (for MVP)
   */
  async createTestersCoupon(
    planType: PlanType = PlanType.PRO,
    usageLimit: number = 30
  ): Promise<CouponResponse> {
    const code = this.generateCouponCode('TESTER', 6);

    return this.createCoupon({
      code,
      plan_type: planType,
      usage_limit: usageLimit,
      expires_at: undefined, // No expiration for testers
    });
  }

  /**
   * Get coupon analytics
   */
  async getCouponAnalytics(): Promise<{
    total_coupons: number;
    active_coupons: number;
    expired_coupons: number;
    total_uses: number;
    most_popular_plan: PlanType | null;
    recent_activity: Array<{
      coupon_code: string;
      plan_type: PlanType;
      used_count: number;
      created_at: string;
    }>;
  }> {
    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUses,
      recentCoupons,
    ] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.count({
        where: {
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
      }),
      this.prisma.coupon.count({
        where: {
          expires_at: { lt: new Date() },
        },
      }),
      this.prisma.coupon.aggregate({
        _sum: { used_count: true },
      }),
      this.prisma.coupon.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          code: true,
          plan_type: true,
          used_count: true,
          created_at: true,
        },
      }),
    ]);

    // Get most popular plan
    const planStats = await this.prisma.coupon.groupBy({
      by: ['plan_type'],
      _sum: { used_count: true },
      orderBy: { _sum: { used_count: 'desc' } },
      take: 1,
    });

    const mostPopularPlan = (planStats[0]?.plan_type as PlanType) || null;

    return {
      total_coupons: totalCoupons,
      active_coupons: activeCoupons,
      expired_coupons: expiredCoupons,
      total_uses: totalUses._sum.used_count || 0,
      most_popular_plan: mostPopularPlan,
      recent_activity: recentCoupons.map(coupon => ({
        coupon_code: coupon.code,
        plan_type: coupon.plan_type as PlanType,
        used_count: coupon.used_count ?? 0,
        created_at: coupon.created_at.toISOString(),
      })),
    };
  }
}
