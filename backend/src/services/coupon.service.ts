import { PrismaClient, /* Coupon, */ PlanType } from '@prisma/client';
import { CreateCouponRequest, CouponResponse } from '@/types/api-contracts';

export class CouponService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new coupon
   */
  async createCoupon(data: CreateCouponRequest): Promise<CouponResponse> {
    const { code, plan_type, usage_limit, expires_at } = data;

    // Check if coupon code already exists
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    // Create coupon
    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        plan_type,
        usage_limit,
        expires_at: expires_at ? new Date(expires_at) : null,
      },
    });

    return {
      id: coupon.id,
      code: coupon.code,
      plan_type: coupon.plan_type,
      usage_limit: coupon.usage_limit,
      used_count: coupon.used_count,
      expires_at: coupon.expires_at?.toISOString(),
      created_at: coupon.created_at.toISOString(),
    };
  }

  /**
   * Get all coupons
   */
  async getCoupons(): Promise<CouponResponse[]> {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { created_at: 'desc' },
    });

    return coupons.map(coupon => ({
      id: coupon.id,
      code: coupon.code,
      plan_type: coupon.plan_type,
      usage_limit: coupon.usage_limit,
      used_count: coupon.used_count,
      expires_at: coupon.expires_at?.toISOString(),
      created_at: coupon.created_at.toISOString(),
    }));
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

    return {
      id: coupon.id,
      code: coupon.code,
      plan_type: coupon.plan_type,
      usage_limit: coupon.usage_limit,
      used_count: coupon.used_count,
      expires_at: coupon.expires_at?.toISOString(),
      created_at: coupon.created_at.toISOString(),
    };
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
      if (coupon.used_count >= coupon.usage_limit) {
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
      plan_type: updatedCoupon.plan_type,
      usage_limit: updatedCoupon.usage_limit,
      used_count: updatedCoupon.used_count,
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
      total_uses: coupon.used_count,
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
    if (coupon.used_count > 0) {
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
          : data.expires_at,
      },
    });

    return {
      id: updatedCoupon.id,
      code: updatedCoupon.code,
      plan_type: updatedCoupon.plan_type,
      usage_limit: updatedCoupon.usage_limit,
      used_count: updatedCoupon.used_count,
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
    planType: PlanType = 'pro',
    usageLimit: number = 30
  ): Promise<CouponResponse> {
    const code = this.generateCouponCode('TESTER', 6);

    return this.createCoupon({
      code,
      plan_type: planType,
      usage_limit: usageLimit,
      expires_at: null, // No expiration for testers
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

    const mostPopularPlan = planStats[0]?.plan_type || null;

    return {
      total_coupons: totalCoupons,
      active_coupons: activeCoupons,
      expired_coupons: expiredCoupons,
      total_uses: totalUses._sum.used_count || 0,
      most_popular_plan: mostPopularPlan,
      recent_activity: recentCoupons.map(coupon => ({
        coupon_code: coupon.code,
        plan_type: coupon.plan_type,
        used_count: coupon.used_count,
        created_at: coupon.created_at.toISOString(),
      })),
    };
  }
}
