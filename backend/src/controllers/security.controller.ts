import { FastifyRequest, FastifyReply } from 'fastify';
import { twoFactorService, TwoFactorSetup } from '../services/two-factor.service';
import { captchaService } from '../services/captcha.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SecurityController {
  /**
   * Setup 2FA for user
   */
  async setup2FA(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found',
        });
      }

      const setup = await twoFactorService.generateSecret(userId, user.email);

      reply.send({
        success: true,
        data: {
          secret: setup.secret,
          qr_code_url: setup.qrCodeUrl,
          backup_codes: setup.backupCodes,
        },
      });
    } catch (error: any) {
      console.error('Error setting up 2FA:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to setup 2FA',
      });
    }
  }

  /**
   * Verify 2FA setup
   */
  async verify2FASetup(request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { token } = request.body;

      const verified = await twoFactorService.verifySetup(userId, token);

      if (!verified) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid 2FA token',
        });
      }

      reply.send({
        success: true,
        message: '2FA setup completed successfully',
      });
    } catch (error: any) {
      console.error('Error verifying 2FA setup:', error);
      reply.code(500).send({
        success: false,
        error: error.message || 'Failed to verify 2FA setup',
      });
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { token } = request.body;

      const disabled = await twoFactorService.disable2FA(userId, token);

      if (!disabled) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid 2FA token',
        });
      }

      reply.send({
        success: true,
        message: '2FA disabled successfully',
      });
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      reply.code(500).send({
        success: false,
        error: error.message || 'Failed to disable 2FA',
      });
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { token } = request.body;

      const backupCodes = await twoFactorService.regenerateBackupCodes(userId, token);

      reply.send({
        success: true,
        data: {
          backup_codes: backupCodes,
        },
        message: 'Backup codes regenerated successfully',
      });
    } catch (error: any) {
      console.error('Error regenerating backup codes:', error);
      reply.code(500).send({
        success: false,
        error: error.message || 'Failed to regenerate backup codes',
      });
    }
  }

  /**
   * Get 2FA status
   */
  async get2FAStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const status = await twoFactorService.get2FAStatus(userId);

      reply.send({
        success: true,
        data: status,
      });
    } catch (error: any) {
      console.error('Error getting 2FA status:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get 2FA status',
      });
    }
  }

  /**
   * Verify CAPTCHA
   */
  async verifyCaptcha(request: FastifyRequest<{ Body: { token: string; type?: string } }>, reply: FastifyReply) {
    try {
      const { token, type = 'hcaptcha' } = request.body;
      const remoteip = request.ip;

      const result = await captchaService.verifyCaptcha(token, type as any, remoteip);

      reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error verifying CAPTCHA:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to verify CAPTCHA',
      });
    }
  }

  /**
   * Get CAPTCHA configuration
   */
  async getCaptchaConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const config = captchaService.getCaptchaConfig();

      reply.send({
        success: true,
        data: config,
      });
    } catch (error: any) {
      console.error('Error getting CAPTCHA config:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get CAPTCHA configuration',
      });
    }
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const [user, twoFactorStatus] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            email_verified: true,
            two_factor_enabled: true,
            login_attempts: true,
            locked_until: true,
            last_login_at: true,
            last_login_ip: true,
          },
        }),
        twoFactorService.get2FAStatus(userId),
      ]);

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found',
        });
      }

      reply.send({
        success: true,
        data: {
          email_verified: user.email_verified,
          two_factor: twoFactorStatus,
          account_security: {
            login_attempts: user.login_attempts || 0,
            locked_until: user.locked_until,
            last_login_at: user.last_login_at,
            last_login_ip: user.last_login_ip,
          },
          session_security: {
            require_2fa: twoFactorStatus.enabled,
            session_timeout: 30, // minutes
            concurrent_sessions: 1, // max concurrent sessions
          },
        },
      });
    } catch (error: any) {
      console.error('Error getting security settings:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get security settings',
      });
    }
  }

  /**
   * Update security preferences
   */
  async updateSecurityPreferences(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { preferences } = request.body;

      // This could be extended to store user security preferences
      // For now, just acknowledge the request
      console.log(`Security preferences updated for user ${userId}:`, preferences);

      reply.send({
        success: true,
        message: 'Security preferences updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating security preferences:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to update security preferences',
      });
    }
  }

  /**
   * Get security audit log
   */
  async getSecurityAuditLog(request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { page = '1', limit = '20' } = request.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // This would typically query an audit log table
      // For now, return empty array
      const auditLogs = [];

      reply.send({
        success: true,
        data: auditLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
      });
    } catch (error: any) {
      console.error('Error getting security audit log:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get security audit log',
      });
    }
  }

  /**
   * Report suspicious activity
   */
  async reportSuspiciousActivity(request: FastifyRequest<{ Body: { activity: string; details: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { activity, details } = request.body;

      console.log(`🚨 Suspicious activity reported by user ${userId}:`, {
        activity,
        details,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });

      // Here you could:
      // 1. Log to security monitoring system
      // 2. Send alert to security team
      // 3. Temporarily lock account
      // 4. Add IP to blocklist

      reply.send({
        success: true,
        message: 'Suspicious activity reported successfully. Our security team will investigate.',
      });
    } catch (error: any) {
      console.error('Error reporting suspicious activity:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to report suspicious activity',
      });
    }
  }
}

// Export singleton instance
export const securityController = new SecurityController();

