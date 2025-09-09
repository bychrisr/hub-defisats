"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponService = void 0;
class CouponService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCoupon(data) {
        const { code, plan_type, usage_limit, expires_at } = data;
        const existingCoupon = await this.prisma.coupon.findUnique({
            where: { code },
        });
        if (existingCoupon) {
            throw new Error('Coupon code already exists');
        }
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
    async getCoupons() {
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
    async getCouponByCode(code) {
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
    async validateCoupon(code) {
        try {
            const coupon = await this.getCouponByCode(code);
            if (!coupon) {
                return {
                    valid: false,
                    error: 'Coupon code not found',
                };
            }
            if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
                return {
                    valid: false,
                    error: 'Coupon has expired',
                };
            }
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
        }
        catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async useCoupon(code, userId) {
        const validation = await this.validateCoupon(code);
        if (!validation.valid) {
            throw new Error(validation.error || 'Invalid coupon');
        }
        const existingUsage = await this.prisma.userCoupon.findUnique({
            where: {
                user_id_coupon_id: {
                    user_id: userId,
                    coupon_id: validation.coupon.id,
                },
            },
        });
        if (existingUsage) {
            throw new Error('User has already used this coupon');
        }
        const [updatedCoupon] = await this.prisma.$transaction([
            this.prisma.coupon.update({
                where: { code },
                data: {
                    used_count: {
                        increment: 1,
                    },
                },
            }),
            this.prisma.userCoupon.create({
                data: {
                    user_id: userId,
                    coupon_id: validation.coupon.id,
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
    async getCouponStats(couponId) {
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
    async deleteCoupon(couponId) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id: couponId },
        });
        if (!coupon) {
            throw new Error('Coupon not found');
        }
        if (coupon.used_count > 0) {
            throw new Error('Cannot delete coupon that has been used');
        }
        await this.prisma.coupon.delete({
            where: { id: couponId },
        });
    }
    async updateCoupon(couponId, data) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id: couponId },
        });
        if (!coupon) {
            throw new Error('Coupon not found');
        }
        if (data.code && data.code !== coupon.code) {
            const existingCoupon = await this.prisma.coupon.findUnique({
                where: { code: data.code },
            });
            if (existingCoupon) {
                throw new Error('Coupon code already exists');
            }
        }
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
    generateCouponCode(prefix = '', length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = prefix;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    async createTestersCoupon(planType = 'pro', usageLimit = 30) {
        const code = this.generateCouponCode('TESTER', 6);
        return this.createCoupon({
            code,
            plan_type: planType,
            usage_limit: usageLimit,
            expires_at: null,
        });
    }
    async getCouponAnalytics() {
        const [totalCoupons, activeCoupons, expiredCoupons, totalUses, recentCoupons,] = await Promise.all([
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
exports.CouponService = CouponService;
//# sourceMappingURL=coupon.service.js.map