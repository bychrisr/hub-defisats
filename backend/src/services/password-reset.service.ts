import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from '@/config/env';
import { EmailService } from './email.service';
import { HIBPService } from './hibp.service';
import { PasswordSchema } from '@/utils/password.validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class PasswordResetService {
  private prisma: PrismaClient;
  private redis: Redis;
  private emailService: EmailService;
  private hibpService: HIBPService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.redis = new Redis(config.redis.url);
    this.emailService = new EmailService();
    this.hibpService = new HIBPService();
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string, ipAddress?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Check if user exists (but don't reveal this)
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      // Always return success message for security
      const message = 'If the email exists, we have sent a password reset link.';

      if (!user) {
        // Log the attempt for security monitoring
        await this.logPasswordResetAttempt(email, ipAddress, false);
        return { success: true, message };
      }

      // Check rate limiting
      const rateLimitKey = `password_reset:${ipAddress || 'unknown'}`;
      const attempts = await this.redis.get(rateLimitKey);
      
      if (attempts && parseInt(attempts) >= 3) {
        await this.logPasswordResetAttempt(email, ipAddress, false, 'Rate limit exceeded');
        return { success: true, message };
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store token in Redis
      await this.redis.setex(
        `password_reset:${token}`,
        900, // 15 minutes in seconds
        JSON.stringify({
          userId: user.id,
          email: user.email,
          createdAt: new Date().toISOString(),
          ipAddress,
        })
      );

      // Send email
      await this.emailService.sendPasswordReset(user.email, token);

      // Update rate limiting
      await this.redis.incr(rateLimitKey);
      await this.redis.expire(rateLimitKey, 3600); // 1 hour

      // Log successful attempt
      await this.logPasswordResetAttempt(email, ipAddress, true);

      return { success: true, message };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: true, message: 'If the email exists, we have sent a password reset link.' };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string, ipAddress?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Get token data from Redis
      const tokenData = await this.redis.get(`password_reset:${token}`);
      
      if (!tokenData) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      const resetData = JSON.parse(tokenData);
      
      // Validate new password
      const passwordValidation = PasswordSchema.safeParse(newPassword);
      if (!passwordValidation.success) {
        return {
          success: false,
          message: 'Password does not meet requirements',
        };
      }

      // Check if password is compromised
      const isCompromised = await this.hibpService.isPasswordCompromised(newPassword);
      if (isCompromised) {
        return {
          success: false,
          message: 'This password has been found in data breaches. Please choose a different password.',
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await this.prisma.user.update({
        where: { id: resetData.userId },
        data: {
          password_hash: hashedPassword,
          session_expires_at: null, // Invalidate all sessions
        },
      });

      // Delete token (one-time use)
      await this.redis.del(`password_reset:${token}`);

      // Log password reset
      await this.logPasswordReset(resetData.userId, ipAddress, true);

      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'An error occurred while resetting your password',
      };
    }
  }

  /**
   * Validate reset token
   */
  async validateResetToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    message?: string;
  }> {
    try {
      const tokenData = await this.redis.get(`password_reset:${token}`);
      
      if (!tokenData) {
        return {
          valid: false,
          message: 'Invalid or expired reset token',
        };
      }

      const resetData = JSON.parse(tokenData);
      
      return {
        valid: true,
        email: resetData.email,
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        valid: false,
        message: 'Invalid token',
      };
    }
  }

  /**
   * Log password reset attempt
   */
  private async logPasswordResetAttempt(
    email: string,
    ipAddress?: string,
    success: boolean = false,
    reason?: string
  ): Promise<void> {
    try {
      const logData = {
        email,
        ipAddress,
        success,
        reason,
        timestamp: new Date().toISOString(),
      };

      // Store in Redis for monitoring
      await this.redis.lpush('password_reset_logs', JSON.stringify(logData));
      await this.redis.ltrim('password_reset_logs', 0, 999); // Keep last 1000 logs

      // Also log to database if needed
      console.log('Password reset attempt:', logData);
    } catch (error) {
      console.error('Log password reset attempt error:', error);
    }
  }

  /**
   * Log password reset completion
   */
  private async logPasswordReset(
    userId: string,
    ipAddress?: string,
    success: boolean = true
  ): Promise<void> {
    try {
      const logData = {
        userId,
        ipAddress,
        success,
        timestamp: new Date().toISOString(),
      };

      // Store in Redis for monitoring
      await this.redis.lpush('password_reset_completions', JSON.stringify(logData));
      await this.redis.ltrim('password_reset_completions', 0, 999); // Keep last 1000 logs

      console.log('Password reset completion:', logData);
    } catch (error) {
      console.error('Log password reset completion error:', error);
    }
  }

  /**
   * Get password reset logs (for monitoring)
   */
  async getPasswordResetLogs(limit: number = 100): Promise<any[]> {
    try {
      const logs = await this.redis.lrange('password_reset_logs', 0, limit - 1);
      return logs.map(log => JSON.parse(log));
    } catch (error) {
      console.error('Get password reset logs error:', error);
      return [];
    }
  }
}
