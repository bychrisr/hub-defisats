import { FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';
import { config } from '@/config/env';

export class RateLimitMiddleware {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(config.redis.url);
  }

  /**
   * Rate limiting for login attempts
   */
  async loginRateLimit(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const ip = this.getClientIP(request);
    const key = `login_attempts:${ip}`;

    try {
      const attempts = await this.redis.get(key);
      const count = attempts ? parseInt(attempts, 10) : 0;

      if (count >= 5) {
        return reply.status(429).send({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts. Please try again in 15 minutes.',
          retryAfter: 900, // 15 minutes
        });
      }

      // Increment counter
      await this.redis.incr(key);
      await this.redis.expire(key, 900); // 15 minutes

      // Set CAPTCHA required after 3 attempts
      if (count >= 2) {
        reply.header('X-Captcha-Required', 'true');
      }
    } catch (error) {
      console.error('Rate limit error:', error);
      // Continue if Redis is down
    }
  }

  /**
   * Rate limiting for registration
   */
  async registrationRateLimit(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const ip = this.getClientIP(request);
    const key = `registration_attempts:${ip}`;

    try {
      const attempts = await this.redis.get(key);
      const count = attempts ? parseInt(attempts, 10) : 0;

      if (count >= 3) {
        return reply.status(429).send({
          error: 'RATE_LIMIT_EXCEEDED',
          message:
            'Too many registration attempts. Please try again in 1 hour.',
          retryAfter: 3600, // 1 hour
        });
      }

      // Increment counter
      await this.redis.incr(key);
      await this.redis.expire(key, 3600); // 1 hour
    } catch (error) {
      console.error('Rate limit error:', error);
      // Continue if Redis is down
    }
  }

  /**
   * Rate limiting for password reset
   */
  async passwordResetRateLimit(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const ip = this.getClientIP(request);
    const key = `password_reset_attempts:${ip}`;

    try {
      const attempts = await this.redis.get(key);
      const count = attempts ? parseInt(attempts, 10) : 0;

      if (count >= 3) {
        return reply.status(429).send({
          error: 'RATE_LIMIT_EXCEEDED',
          message:
            'Too many password reset attempts. Please try again in 1 hour.',
          retryAfter: 3600, // 1 hour
        });
      }

      // Increment counter
      await this.redis.incr(key);
      await this.redis.expire(key, 3600); // 1 hour
    } catch (error) {
      console.error('Rate limit error:', error);
      // Continue if Redis is down
    }
  }

  /**
   * Rate limiting por usuário
   */
  async userRateLimit(
    request: FastifyRequest,
    reply: FastifyReply,
    action: string,
    maxAttempts: number = 10,
    windowMs: number = 3600000
  ): Promise<boolean> {
    const user = request.user;
    if (!user) {
      return true; // Se não há usuário, não aplicar rate limit por usuário
    }

    const key = `user_${action}:${user.id}`;

    try {
      const attempts = await this.redis.get(key);
      const count = attempts ? parseInt(attempts, 10) : 0;

      if (count >= maxAttempts) {
        return reply.status(429).send({
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many ${action} attempts. Please try again later.`,
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Increment counter
      await this.redis.incr(key);
      await this.redis.expire(key, Math.ceil(windowMs / 1000));

      return true;
    } catch (error) {
      console.error('User rate limit error:', error);
      // Continue if Redis is down
      return true;
    }
  }

  /**
   * Rate limiting para API calls por usuário
   */
  async apiRateLimit(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<boolean> {
    return this.userRateLimit(request, reply, 'api_calls', 100, 60000); // 100 calls per minute
  }

  /**
   * Rate limiting para automações por usuário
   */
  async automationRateLimit(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<boolean> {
    return this.userRateLimit(
      request,
      reply,
      'automation_actions',
      20,
      3600000
    ); // 20 actions per hour
  }

  /**
   * Rate limiting para trade operations por usuário
   */
  async tradeRateLimit(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<boolean> {
    return this.userRateLimit(request, reply, 'trade_operations', 50, 3600000); // 50 trades per hour
  }

  /**
   * Clear rate limit on successful login
   */
  async clearLoginRateLimit(request: FastifyRequest): Promise<void> {
    const ip = this.getClientIP(request);
    const key = `login_attempts:${ip}`;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Clear rate limit error:', error);
    }
  }

  /**
   * Clear user rate limit
   */
  async clearUserRateLimit(userId: string, action: string): Promise<void> {
    const key = `user_${action}:${userId}`;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Clear user rate limit error:', error);
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIP = request.headers['x-real-ip'];

    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }

    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    return request.ip || 'unknown';
  }
}
