import { PrismaClient } from '@prisma/client';
import { cacheService } from './cache.service';

export class OptimizedQueriesService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get user with cached data
   */
  async getUserById(userId: string) {
    const cacheKey = `user:${userId}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
            plan_type: true,
            created_at: true,
            updated_at: true,
            // Don't select sensitive fields
          },
        });
      },
      { ttl: 300 } // 5 minutes
    );
  }

  /**
   * Get user automations with pagination and caching
   */
  async getUserAutomations(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const cacheKey = `user_automations:${userId}:${page}:${limit}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      { ttl: 60 } // 1 minute
    );
  }

  /**
   * Get user trade logs with pagination and caching
   */
  async getUserTradeLogs(userId: string, page: number = 1, limit: number = 20) {
    const cacheKey = `user_trade_logs:${userId}:${page}:${limit}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      { ttl: 30 } // 30 seconds
    );
  }

  /**
   * Get user statistics with caching
   */
  async getUserStats(userId: string) {
    const cacheKey = `user_stats:${userId}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const [
          totalAutomations,
          activeAutomations,
          totalTrades,
          successfulTrades,
          totalVolume,
        ] = await Promise.all([
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
          successRate:
            totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0,
          totalVolume: totalVolume._sum.amount || 0,
        };
      },
      { ttl: 300 } // 5 minutes
    );
  }

  /**
   * Check username availability with caching
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    const cacheKey = `username_available:${username}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });
        return user === null;
      },
      { ttl: 60 } // 1 minute
    );
  }

  /**
   * Get coupon by code with caching
   */
  async getCouponByCode(code: string) {
    const cacheKey = `coupon:${code}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      { ttl: 600 } // 10 minutes
    );
  }

  /**
   * Get system statistics with caching
   */
  async getSystemStats() {
    const cacheKey = 'system_stats';

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const [
          totalUsers,
          activeUsers,
          totalAutomations,
          activeAutomations,
          totalTrades,
          totalVolume,
        ] = await Promise.all([
          this.prisma.user.count(),
          this.prisma.user.count({
            where: {
              created_at: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
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
      },
      { ttl: 300 } // 5 minutes
    );
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}`,
      `user_automations:${userId}:*`,
      `user_trade_logs:${userId}:*`,
      `user_stats:${userId}`,
    ];

    await Promise.all(
      patterns.map(pattern => cacheService.invalidatePattern(pattern))
    );
  }

  /**
   * Invalidate system cache
   */
  async invalidateSystemCache(): Promise<void> {
    await cacheService.invalidatePattern('system_stats');
  }

  /**
   * Invalidate coupon cache
   */
  async invalidateCouponCache(code: string): Promise<void> {
    await cacheService.del(`coupon:${code}`);
  }

  /**
   * Invalidate username cache
   */
  async invalidateUsernameCache(username: string): Promise<void> {
    await cacheService.del(`username_available:${username}`);
  }
}
