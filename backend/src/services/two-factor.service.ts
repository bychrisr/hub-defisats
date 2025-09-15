import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  verified: boolean;
  backupCodeUsed?: boolean;
}

export class TwoFactorService {
  /**
   * Generate secret and QR code for 2FA setup
   */
  async generateSecret(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Hub DefiSats (${userEmail})`,
      issuer: 'Hub DefiSats',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Save to database (but don't enable yet)
    await prisma.user.update({
      where: { id: userId },
      data: {
        two_factor_secret: secret.base32,
        two_factor_enabled: false,
        two_factor_backup_codes: backupCodes,
        updated_at: new Date(),
      },
    });

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP token during setup
   */
  async verifySetup(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        two_factor_secret: true,
        two_factor_enabled: true,
      },
    });

    if (!user?.two_factor_secret) {
      throw new Error('2FA not initialized');
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time windows (30 seconds each)
    });

    if (verified) {
      // Enable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          two_factor_enabled: true,
          updated_at: new Date(),
        },
      });
    }

    return verified;
  }

  /**
   * Verify TOTP token for authentication
   */
  async verifyToken(userId: string, token: string): Promise<TwoFactorVerification> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        two_factor_secret: true,
        two_factor_enabled: true,
        two_factor_backup_codes: true,
      },
    });

    if (!user?.two_factor_enabled || !user.two_factor_secret) {
      throw new Error('2FA not enabled');
    }

    // First try TOTP
    const totpVerified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (totpVerified) {
      return { verified: true, backupCodeUsed: false };
    }

    // Try backup codes
    if (user.two_factor_backup_codes) {
      const backupCodes = user.two_factor_backup_codes as string[];
      const codeIndex = backupCodes.indexOf(token);

      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: userId },
          data: {
            two_factor_backup_codes: backupCodes,
            updated_at: new Date(),
          },
        });

        return { verified: true, backupCodeUsed: true };
      }
    }

    return { verified: false };
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string, token: string): Promise<boolean> {
    const verification = await this.verifyToken(userId, token);

    if (!verification.verified) {
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
        updated_at: new Date(),
      },
    });

    return true;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    const verification = await this.verifyToken(userId, token);

    if (!verification.verified) {
      throw new Error('Invalid 2FA token');
    }

    const backupCodes = this.generateBackupCodes();

    await prisma.user.update({
      where: { id: userId },
      data: {
        two_factor_backup_codes: backupCodes,
        updated_at: new Date(),
      },
    });

    return backupCodes;
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { two_factor_enabled: true },
    });

    return user?.two_factor_enabled || false;
  }

  /**
   * Get 2FA status for user
   */
  async get2FAStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        two_factor_enabled: true,
        two_factor_backup_codes: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const backupCodesCount = user.two_factor_backup_codes
      ? (user.two_factor_backup_codes as string[]).length
      : 0;

    return {
      enabled: user.two_factor_enabled || false,
      backup_codes_count: backupCodesCount,
    };
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateRandomCode());
    }
    return codes;
  }

  /**
   * Generate random backup code
   */
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

// Export singleton instance
export const twoFactorService = new TwoFactorService();