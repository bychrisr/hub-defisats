import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

export interface SecurityConfigValue {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  updated_by?: string;
}

export class SecurityConfigService {
  private prisma: PrismaClient;
  private fastify: FastifyInstance;

  constructor(prisma: PrismaClient, fastify: FastifyInstance) {
    this.prisma = prisma;
    this.fastify = fastify;
  }

  /**
   * Get security configuration value
   */
  async getConfig(key: string): Promise<string | null> {
    const config = await this.prisma.securityConfig.findUnique({
      where: { key, is_active: true },
      select: { value: true }
    });
    return config?.value || null;
  }

  /**
   * Get all security configurations
   */
  async getAllConfigs(): Promise<SecurityConfigValue[]> {
    return await this.prisma.securityConfig.findMany({
      orderBy: { category: 'asc' }
    });
  }

  /**
   * Update security configuration
   */
  async updateConfig(
    key: string, 
    value: string, 
    updatedBy?: string
  ): Promise<SecurityConfigValue> {
    const config = await this.prisma.securityConfig.upsert({
      where: { key },
      update: { 
        value, 
        updated_at: new Date(),
        updated_by: updatedBy
      },
      create: {
        key,
        value,
        category: 'authentication',
        is_active: true,
        updated_by: updatedBy
      }
    });

    // Log security configuration change
    await this.logSecurityAction(
      updatedBy || 'system',
      'CONFIG_UPDATED',
      `Security config updated: ${key}`,
      { key, value }
    );

    return config;
  }

  /**
   * Get JWT expiration time from config
   */
  async getJWTExpiration(): Promise<string> {
    return await this.getConfig('jwt_expires_in') || '2h';
  }

  /**
   * Get refresh token expiration time from config
   */
  async getRefreshTokenExpiration(): Promise<string> {
    return await this.getConfig('refresh_token_expires_in') || '7d';
  }

  /**
   * Get max login attempts from config
   */
  async getMaxLoginAttempts(): Promise<number> {
    const value = await this.getConfig('max_login_attempts');
    return value ? parseInt(value) : 5;
  }

  /**
   * Get lockout duration from config
   */
  async getLockoutDuration(): Promise<string> {
    return await this.getConfig('lockout_duration') || '15m';
  }

  /**
   * Get session timeout from config
   */
  async getSessionTimeout(): Promise<string> {
    return await this.getConfig('session_timeout') || '30m';
  }

  /**
   * Check if 2FA is required
   */
  async is2FARequired(): Promise<boolean> {
    const value = await this.getConfig('require_2fa');
    return value === 'true';
  }

  /**
   * Check if token rotation is enabled
   */
  async isTokenRotationEnabled(): Promise<boolean> {
    const value = await this.getConfig('token_rotation_enabled');
    return value === 'true';
  }

  /**
   * Get max concurrent sessions
   */
  async getMaxConcurrentSessions(): Promise<number> {
    const value = await this.getConfig('max_concurrent_sessions');
    return value ? parseInt(value) : 3;
  }

  /**
   * Log security action
   */
  async logSecurityAction(
    userId: string,
    action: string,
    resource: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    try {
      await this.prisma.securityAuditLog.create({
        data: {
          user_id: userId,
          action,
          resource,
          ip_address: ipAddress,
          user_agent: userAgent,
          success,
          details
        }
      });
    } catch (error) {
      console.error('Failed to log security action:', error);
    }
  }

  /**
   * Get security audit logs
   */
  async getAuditLogs(
    userId?: string,
    action?: string,
    limit: number = 100,
    offset: number = 0
  ) {
    return await this.prisma.securityAuditLog.findMany({
      where: {
        ...(userId && { user_id: userId }),
        ...(action && { action })
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      }
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string, revokedBy?: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, is_revoked: false },
      data: { is_revoked: true }
    });

    await this.logSecurityAction(
      revokedBy || userId,
      'TOKENS_REVOKED',
      `All refresh tokens revoked for user ${userId}`,
      { userId }
    );
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: new Date() } },
          { is_revoked: true }
        ]
      }
    });

    return result.count;
  }
}
