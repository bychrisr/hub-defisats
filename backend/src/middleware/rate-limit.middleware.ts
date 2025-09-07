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
  async loginRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
  async registrationRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const ip = this.getClientIP(request);
    const key = `registration_attempts:${ip}`;
    
    try {
      const attempts = await this.redis.get(key);
      const count = attempts ? parseInt(attempts, 10) : 0;
      
      if (count >= 3) {
        return reply.status(429).send({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many registration attempts. Please try again in 1 hour.',
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
  async passwordResetRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const ip = this.getClientIP(request);
    const key = `password_reset_attempts:${ip}`;
    
    try {
      const attempts = await this.redis.get(key);
      const count = attempts ? parseInt(attempts, 10) : 0;
      
      if (count >= 3) {
        return reply.status(429).send({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many password reset attempts. Please try again in 1 hour.',
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
