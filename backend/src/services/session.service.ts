import { PrismaClient, User } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from '../config/env';
import crypto from 'crypto';

export class SessionService {
  private prisma: PrismaClient;
  private redis: Redis;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.redis = new Redis(config.redis.url);
  }

  /**
   * Create new session
   */
  async createSession(userId: string): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session in Redis
    await this.redis.setex(
      `session:${sessionId}`,
      7 * 24 * 60 * 60, // 7 days in seconds
      JSON.stringify({
        userId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      })
    );

    // Update user session in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { session_expires_at: expiresAt },
    });

    return sessionId;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<User | null> {
    try {
      const sessionData = await this.redis.get(`session:${sessionId}`);

      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      const user = await this.prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user || !user.is_active) {
        await this.destroySession(sessionId);
        return null;
      }

      // Update last activity
      await this.redis.setex(
        `session:${sessionId}`,
        7 * 24 * 60 * 60,
        JSON.stringify({
          ...session,
          lastActivity: new Date().toISOString(),
        })
      );

      return user;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId: string): Promise<void> {
    try {
      await this.redis.del(`session:${sessionId}`);
    } catch (error) {
      console.error('Session destruction error:', error);
    }
  }

  /**
   * Destroy all user sessions (prevent concurrent login)
   */
  async destroyAllUserSessions(userId: string): Promise<void> {
    try {
      // Get all sessions for user
      const keys = await this.redis.keys(`session:*`);

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.userId === userId) {
            await this.redis.del(key);
          }
        }
      }

      // Clear user session in database
      await this.prisma.user.update({
        where: { id: userId },
        data: { session_expires_at: null },
      });
    } catch (error) {
      console.error('Destroy all sessions error:', error);
    }
  }

  /**
   * Get active sessions for user
   */
  async getUserActiveSessions(userId: string): Promise<
    Array<{
      sessionId: string;
      createdAt: string;
      lastActivity: string;
      ipAddress?: string;
      userAgent?: string;
    }>
  > {
    try {
      const keys = await this.redis.keys(`session:*`);
      const sessions = [];

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.userId === userId) {
            const sessionId = key.replace('session:', '');
            sessions.push({
              sessionId,
              createdAt: session.createdAt,
              lastActivity: session.lastActivity,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            });
          }
        }
      }

      return sessions;
    } catch (error) {
      console.error('Get user sessions error:', error);
      return [];
    }
  }

  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions(): Promise<void> {
    try {
      const keys = await this.redis.keys(`session:*`);

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl <= 0) {
          await this.redis.del(key);
        }
      }
    } catch (error) {
      console.error('Clean expired sessions error:', error);
    }
  }

  /**
   * Check if user has active session (prevent concurrent login)
   */
  async hasActiveSession(userId: string): Promise<boolean> {
    try {
      const keys = await this.redis.keys(`session:*`);

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.userId === userId) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Check active session error:', error);
      return false;
    }
  }
}
