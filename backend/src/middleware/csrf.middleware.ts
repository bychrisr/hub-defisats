import { FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';
import { config } from '../config/env';
import crypto from 'crypto';

export class CSRFMiddleware {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(config.redis.url);
  }

  /**
   * Generate CSRF token
   */
  async generateCSRFToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const key = `csrf:${userId}:${token}`;

    // Store token in Redis with 1 hour expiration
    await this.redis.setex(key, 3600, '1');

    return token;
  }

  /**
   * Validate CSRF token
   */
  async validateCSRFToken(userId: string, token: string): Promise<boolean> {
    if (!token) {
      return false;
    }

    const key = `csrf:${userId}:${token}`;
    const exists = await this.redis.get(key);

    return exists === '1';
  }

  /**
   * CSRF middleware for state-changing operations
   */
  async csrfProtection(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return;
    }

    // Skip CSRF for API endpoints that use JWT (already protected)
    if (request.url.startsWith('/api/') && request.headers.authorization) {
      return;
    }

    const user = (request as any).user;
    if (!user) {
      return; // Let auth middleware handle this
    }

    // Get CSRF token from header or body
    const csrfToken =
      (request.headers['x-csrf-token'] as string) ||
      (request.body as { csrf_token?: string })?.csrf_token;

    if (!csrfToken) {
      return reply.status(403).send({
        error: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is required',
      });
    }

    const isValid = await this.validateCSRFToken(user.id, csrfToken);
    if (!isValid) {
      return reply.status(403).send({
        error: 'CSRF_TOKEN_INVALID',
        message: 'Invalid CSRF token',
      });
    }

    // Consume the token (one-time use)
    const key = `csrf:${user.id}:${csrfToken}`;
    await this.redis.del(key);
  }

  /**
   * Generate and return CSRF token for forms
   */
  async getCSRFToken(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<string> {
    const user = (request as any).user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await this.generateCSRFToken(user.id);
    return token;
  }
}
