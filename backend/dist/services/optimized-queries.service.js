"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedQueriesService = void 0;
const cache_service_1 = require("./cache.service");
class OptimizedQueriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserById(userId) {
        const cacheKey = `user:${userId}`;
        return cache_service_1.cacheService.getOrSet(cacheKey, async () => {
            return this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    plan_type: true,
                    created_at: true,
                    updated_at: true,
                },
            });
        }, { ttl: 300 });
    }
    async getUserAutomations(userId, page = 1, limit = 10) {
        const cacheKey = `user_automations:${userId}:${page}:${limit}`;
        return cache_service_1.cacheService.getOrSet(cacheKey, async () => {
            const skip = (page - 1) * limit;
            const [automations, total] = await Promise.all([
                this.prisma.automation.findMany({
                    where: { user_id: userId },
                    select: {
                        id: true,
                        type: true,
                        config: true,
                        is_active: true,
                        created_at: true,
                        updated_at: true,
                    },
                    skip,
                    take: limit,
                    orderBy: { created_at: 'desc' },
                }),
                this.prisma.automation.count({
                    where: { user_id: userId },
                }),
            ]);
            return {
                automations,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }, { ttl: 60 });
    }
    async getUserTradeLogs(userId, page = 1, limit = 20) {
        const cacheKey = `user_trade_logs:${userId}:${page}:${limit}`;
        return cache_service_1.cacheService.getOrSet(cacheKey, async () => {
            const skip = (page - 1) * limit;
            const [tradeLogs, total] = await Promise.all([
                this.prisma.tradeLog.findMany({
                    where: { user_id: userId },
                    select: {
                        id: true,
                        symbol: true,
                        side: true,
                        amount: true,
                        price: true,
                        status: true,
                        executed_at: true,
                        created_at: true,
                    },
                    skip,
                    take: limit,
                    orderBy: { executed_at: 'desc' },
                }),
                this.prisma.tradeLog.count({
                    where: { user_id: userId },
                }),
            ]);
            return {
                tradeLogs,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }, { ttl: 30 });
    }
    async getUserStats(userId) {
        const cacheKey = `user_stats:${userId}`;
        return cache_service_1.cacheService.getOrSet(cacheKey, async () => {
            const [totalAutomations, activeAutomations, totalTrades, successfulTrades, totalVolume,] = await Promise.all([
                this.prisma.automation.count({
                    where: { user_id: userId },
                }),
                this.prisma.automation.count({
                    where: { user_id: userId, is_active: true },
                }),
                this.prisma.tradeLog.count({
                    where: { user_id: userId },
                }),
                this.prisma.tradeLog.count({
                    where: { user_id: userId, status: 'executed' },
                }),
                this.prisma.tradeLog.aggregate({
                    where: { user_id: userId, status: 'executed' },
                    _sum: { amount: true },
                }),
            ]);
            return {
                totalAutomations,
                activeAutomations,
                totalTrades,
                successfulTrades,
                successRate: totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0,
                totalVolume: totalVolume._sum.amount || 0,
            };
        }, { ttl: 300 });
    }
    async checkUsernameAvailability(username) {
        const cacheKey = `username_available:${username}`;
        return cache_service_1.cacheService.getOrSet(cacheKey, async () => {
            const user = await this.prisma.user.findUnique({
                where: { username },
                select: { id: true },
            });
            return user === null;
        }, { ttl: 60 });
    }
    async getCouponByCode(code) {
        const cacheKey = `coupon:${code}`;
        return cache_service_1.cacheService.getOrSet(cacheKey, async () => {
            return this.prisma.coupon.findUnique({
                where: { code },
                select: {
                    id: true,
                    code: true,
                    discount_percentage: true,
                    discount_amount: true,
                    max_uses: true,
                    used_count: true,
                    is_active: true,
                    expires_at: true,
                    created_at: true,
                },
            });
        }, { ttl: 600 });
    }
    async getSystemStats() {
        const cacheKey = 'system_stats';
        return cache_service_1.cacheService.getOrSet(cacheKey, async () => {
            const [totalUsers, activeUsers, totalAutomations, activeAutomations, totalTrades, totalVolume,] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.user.count({
                    where: {
                        created_at: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                }),
                this.prisma.automation.count(),
                this.prisma.automation.count({
                    where: { is_active: true },
                }),
                this.prisma.tradeLog.count(),
                this.prisma.tradeLog.aggregate({
                    where: { status: 'executed' },
                    _sum: { amount: true },
                }),
            ]);
            return {
                totalUsers,
                activeUsers,
                totalAutomations,
                activeAutomations,
                totalTrades,
                totalVolume: totalVolume._sum.amount || 0,
                timestamp: new Date().toISOString(),
            };
        }, { ttl: 300 });
    }
    async invalidateUserCache(userId) {
        const patterns = [
            `user:${userId}`,
            `user_automations:${userId}:*`,
            `user_trade_logs:${userId}:*`,
            `user_stats:${userId}`,
        ];
        await Promise.all(patterns.map(pattern => cache_service_1.cacheService.invalidatePattern(pattern)));
    }
    async invalidateSystemCache() {
        await cache_service_1.cacheService.invalidatePattern('system_stats');
    }
    async invalidateCouponCache(code) {
        await cache_service_1.cacheService.del(`coupon:${code}`);
    }
    async invalidateUsernameCache(username) {
        await cache_service_1.cacheService.del(`username_available:${username}`);
    }
}
exports.OptimizedQueriesService = OptimizedQueriesService;
//# sourceMappingURL=optimized-queries.service.js.map