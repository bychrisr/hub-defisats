import { FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number;      // Maximum requests per window
  message?: string; // Custom message
  skipFailedRequests?: boolean; // Skip counting failed requests
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
}

export class RateLimiter {
  /**
   * Create rate limiter middleware
   */
  static create(config: RateLimitConfig) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const key = this.getKey(request);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      try {
        // Clean old entries and count current requests
        const multi = redis.multi();
        multi.zremrangebyscore(key, '-inf', windowStart);
        multi.zcard(key);
        const results = await multi.exec();

        const requestCount = results?.[1]?.[1] as number || 0;

        // Check if limit exceeded
        if (requestCount >= config.max) {
          const resetTime = await this.getResetTime(key);
          const remaining = Math.max(0, config.max - requestCount);

          reply.header('X-RateLimit-Limit', config.max.toString());
          reply.header('X-RateLimit-Remaining', remaining.toString());
          reply.header('X-RateLimit-Reset', resetTime.toString());
          reply.header('Retry-After', Math.ceil((resetTime - now) / 1000).toString());

          return reply.code(429).send({
            error: 'TOO_MANY_REQUESTS',
            message: config.message || 'Too many requests, please try again later',
            retry_after: Math.ceil((resetTime - now) / 1000),
          });
        }

        // Add current request to the set
        await redis.zadd(key, now, `${now}:${Math.random()}`);

        // Set expiry on the key
        await redis.expire(key, Math.ceil(config.windowMs / 1000));

        // Add headers
        const remaining = Math.max(0, config.max - requestCount - 1);
        const resetTime = await this.getResetTime(key);

        reply.header('X-RateLimit-Limit', config.max.toString());
        reply.header('X-RateLimit-Remaining', remaining.toString());
        reply.header('X-RateLimit-Reset', resetTime.toString());

      } catch (error) {
        console.error('Rate limiting error:', error);
        // Continue without rate limiting if Redis fails
      }
    };
  }

  /**
   * Get rate limit key for request
   */
  private static getKey(request: FastifyRequest): string {
    const ip = this.getClientIP(request);
    const userId = (request as any).user?.id;
    const endpoint = request.routerPath || request.url;

    // Use user ID if authenticated, otherwise IP
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;

    return `ratelimit:${identifier}:${endpoint}`;
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: FastifyRequest): string {
    // Try different headers for IP detection
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }

    const realIP = request.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    const cfIP = request.headers['cf-connecting-ip'];
    if (cfIP) {
      return Array.isArray(cfIP) ? cfIP[0] : cfIP;
    }

    // Fallback to connection remote address
    return request.ip || 'unknown';
  }

  /**
   * Get reset time for rate limit
   */
  private static async getResetTime(key: string): Promise<number> {
    try {
      const scores = await redis.zrange(key, 0, 0, 'WITHSCORES');
      if (scores && scores.length >= 2) {
        const oldestTimestamp = parseInt(scores[1]);
        return oldestTimestamp + 60000; // 1 minute window
      }
    } catch (error) {
      console.error('Error getting reset time:', error);
    }
    return Date.now() + 60000;
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Strict limits for auth endpoints
  auth: RateLimiter.create({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  }),

  // General API limits
  api: RateLimiter.create({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests. Please slow down.',
  }),

  // Trading endpoints (higher limits for active traders)
  trading: RateLimiter.create({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute
    message: 'Too many trading requests. Please slow down.',
  }),

  // Notification endpoints
  notifications: RateLimiter.create({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 notifications per minute
    message: 'Too many notification requests. Please slow down.',
  }),

  // Payment endpoints
  payments: RateLimiter.create({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 payment requests per minute
    message: 'Too many payment requests. Please slow down.',
  }),

  // Admin endpoints (strict limits)
  admin: RateLimiter.create({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 admin requests per minute
    message: 'Too many admin requests. Please slow down.',
  }),
};

// Global rate limiter (catch-all)
export const globalRateLimiter = RateLimiter.create({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute globally
  message: 'Service temporarily unavailable due to high traffic.',
});