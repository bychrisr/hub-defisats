import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';

export class TwoFactorService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate 2FA secret for user
   */
  async generateSecret(userId: string, email: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Hub-defisats (${email})`,
      issuer: 'Hub-defisats',
      length: 32,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret and backup codes in database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        two_factor_secret: secret.base32,
        two_factor_backup_codes: backupCodes,
        two_factor_enabled: false, // Will be enabled after verification
      },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify 2FA token
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { two_factor_secret: true },
    });

    if (!user?.two_factor_secret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 time step tolerance
    });

    return verified;
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { two_factor_backup_codes: true },
    });

    if (!user?.two_factor_backup_codes) {
      return false;
    }

    const backupCodes = user.two_factor_backup_codes as string[];
    const index = backupCodes.indexOf(code);

    if (index === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(index, 1);
    await this.prisma.user.update({
      where: { id: userId },
      data: { two_factor_backup_codes: backupCodes },
    });

    return true;
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verifyToken(userId, token);
    
    if (!isValid) {
      return false;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { two_factor_enabled: true },
    });

    return true;
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verifyToken(userId, token);
    
    if (!isValid) {
      return false;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
      },
    });

    return true;
  }

  /**
   * Check if 2FA is enabled for user
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { two_factor_enabled: true },
    });

    return user?.two_factor_enabled || false;
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { two_factor_backup_codes: backupCodes },
    });

    return backupCodes;
  }

  /**
   * Get remaining backup codes count
   */
  async getBackupCodesCount(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { two_factor_backup_codes: true },
    });

    if (!user?.two_factor_backup_codes) {
      return 0;
    }

    return (user.two_factor_backup_codes as string[]).length;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Validate 2FA for admin actions
   */
  async validate2FAForAdmin(userId: string, token: string): Promise<boolean> {
    // Check if user is admin
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { user_id: userId },
    });

    if (!adminUser) {
      return false;
    }

    // Check if 2FA is enabled
    const isEnabled = await this.is2FAEnabled(userId);
    if (!isEnabled) {
      return false;
    }

    // Verify token
    return await this.verifyToken(userId, token);
  }
}
