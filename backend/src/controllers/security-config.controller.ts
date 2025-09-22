import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { SecurityConfigService } from '../services/security-config.service';

export class SecurityConfigController {
  private prisma: PrismaClient;
  private securityConfig: SecurityConfigService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.securityConfig = new SecurityConfigService(prisma, {} as any);
  }

  /**
   * Get all security configurations
   */
  async getConfigs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const configs = await this.securityConfig.getAllConfigs();
      
      return reply.status(200).send({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('❌ Error fetching security configs:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch security configurations'
      });
    }
  }

  /**
   * Update security configuration
   */
  async updateConfig(
    request: FastifyRequest<{ 
      Params: { key: string };
      Body: { value: string; description?: string };
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { key } = request.params;
      const { value, description } = request.body;
      const userId = (request as any).user?.id;

      // Validate key
      const allowedKeys = [
        'jwt_expires_in',
        'refresh_token_expires_in',
        'max_login_attempts',
        'lockout_duration',
        'session_timeout',
        'require_2fa',
        'token_rotation_enabled',
        'max_concurrent_sessions'
      ];

      if (!allowedKeys.includes(key)) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_KEY',
          message: 'Invalid configuration key'
        });
      }

      // Validate value based on key
      if (key === 'max_login_attempts' || key === 'max_concurrent_sessions') {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_VALUE',
            message: 'Value must be a positive integer'
          });
        }
      }

      if (key === 'require_2fa' || key === 'token_rotation_enabled') {
        if (!['true', 'false'].includes(value)) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_VALUE',
            message: 'Value must be true or false'
          });
        }
      }

      const config = await this.securityConfig.updateConfig(key, value, userId);

      return reply.status(200).send({
        success: true,
        data: config,
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      console.error('❌ Error updating security config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update security configuration'
      });
    }
  }

  /**
   * Get security audit logs
   */
  async getAuditLogs(
    request: FastifyRequest<{ 
      Querystring: { 
        userId?: string; 
        action?: string; 
        limit?: string; 
        offset?: string; 
      };
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { userId, action, limit = '100', offset = '0' } = request.query;
      
      const logs = await this.securityConfig.getAuditLogs(
        userId,
        action,
        parseInt(limit),
        parseInt(offset)
      );

      return reply.status(200).send({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch audit logs'
      });
    }
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllTokens(
    request: FastifyRequest<{ 
      Params: { userId: string };
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;
      const adminUserId = (request as any).user?.id;

      await this.securityConfig.revokeAllUserTokens(userId, adminUserId);

      return reply.status(200).send({
        success: true,
        message: 'All tokens revoked successfully'
      });
    } catch (error) {
      console.error('❌ Error revoking tokens:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to revoke tokens'
      });
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupTokens(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cleanedCount = await this.securityConfig.cleanupExpiredTokens();

      return reply.status(200).send({
        success: true,
        data: { cleaned_count: cleanedCount },
        message: `${cleanedCount} expired tokens cleaned up`
      });
    } catch (error) {
      console.error('❌ Error cleaning up tokens:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to clean up tokens'
      });
    }
  }

  /**
   * Get security dashboard data
   */
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const [
        totalUsers,
        activeSessions,
        recentLogins,
        securityAlerts
      ] = await Promise.all([
        this.prisma.user.count({ where: { is_active: true } }),
        this.prisma.refreshToken.count({ 
          where: { 
            is_revoked: false, 
            expires_at: { gt: new Date() } 
          } 
        }),
        this.securityConfig.getAuditLogs(undefined, 'LOGIN', 10, 0),
        this.securityConfig.getAuditLogs(undefined, undefined, 20, 0)
      ]);

      return reply.status(200).send({
        success: true,
        data: {
          total_users: totalUsers,
          active_sessions: activeSessions,
          recent_logins: recentLogins,
          security_alerts: securityAlerts
        }
      });
    } catch (error) {
      console.error('❌ Error fetching security dashboard:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch security dashboard'
      });
    }
  }
}
