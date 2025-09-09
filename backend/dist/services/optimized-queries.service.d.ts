import { PrismaClient } from '@prisma/client';
export declare class OptimizedQueriesService {
    private prisma;
    constructor(prisma: PrismaClient);
    getUserById(userId: string): Promise<{
        email: string;
        username: string;
        plan_type: import(".prisma/client").$Enums.PlanType;
        id: string;
        created_at: Date;
        updated_at: Date;
    } | null>;
    getUserAutomations(userId: string, page?: number, limit?: number): Promise<{
        automations: {
            type: import(".prisma/client").$Enums.AutomationType;
            id: string;
            is_active: boolean;
            config: import("@prisma/client/runtime/library").JsonValue;
            created_at: Date;
            updated_at: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUserTradeLogs(userId: string, page?: number, limit?: number): Promise<{
        tradeLogs: {
            status: import(".prisma/client").$Enums.TradeStatus;
            user_id: string;
            id: string;
            created_at: Date;
            trade_id: string;
            automation_id: string | null;
            error_message: string | null;
            executed_at: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUserStats(userId: string): Promise<{
        totalAutomations: number;
        activeAutomations: number;
        totalTrades: number;
        successfulTrades: number;
        successRate: number;
        totalVolume: any;
    }>;
    checkUsernameAvailability(username: string): Promise<boolean>;
    getCouponByCode(code: string): Promise<{
        code: string;
        plan_type: import(".prisma/client").$Enums.PlanType;
        id: string;
        created_at: Date;
        expires_at: Date | null;
        usage_limit: number;
        used_count: number;
    } | null>;
    getSystemStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        totalAutomations: number;
        activeAutomations: number;
        totalTrades: number;
        totalVolume: any;
        timestamp: string;
    }>;
    invalidateUserCache(userId: string): Promise<void>;
    invalidateSystemCache(): Promise<void>;
    invalidateCouponCache(code: string): Promise<void>;
    invalidateUsernameCache(username: string): Promise<void>;
}
//# sourceMappingURL=optimized-queries.service.d.ts.map