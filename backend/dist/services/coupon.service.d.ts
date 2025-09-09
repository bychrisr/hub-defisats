import { PrismaClient, PlanType } from '@prisma/client';
import { CreateCouponRequest, CouponResponse } from '@/types/api-contracts';
export declare class CouponService {
    private prisma;
    constructor(prisma: PrismaClient);
    createCoupon(data: CreateCouponRequest): Promise<CouponResponse>;
    getCoupons(): Promise<CouponResponse[]>;
    getCouponByCode(code: string): Promise<CouponResponse | null>;
    validateCoupon(code: string): Promise<{
        valid: boolean;
        coupon?: CouponResponse;
        error?: string;
    }>;
    useCoupon(code: string, userId: string): Promise<CouponResponse>;
    getCouponStats(couponId: string): Promise<{
        total_uses: number;
        unique_users: number;
        recent_uses: Array<{
            user_id: string;
            user_email: string;
            used_at: string;
        }>;
    }>;
    deleteCoupon(couponId: string): Promise<void>;
    updateCoupon(couponId: string, data: Partial<{
        code: string;
        plan_type: PlanType;
        usage_limit: number;
        expires_at: string | null;
    }>): Promise<CouponResponse>;
    generateCouponCode(prefix?: string, length?: number): string;
    createTestersCoupon(planType?: PlanType, usageLimit?: number): Promise<CouponResponse>;
    getCouponAnalytics(): Promise<{
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
    }>;
}
//# sourceMappingURL=coupon.service.d.ts.map