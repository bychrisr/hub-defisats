import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Logger } from 'winston';

export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  remainingAttempts: number;
  isBackupCode: boolean;
}

export class TwoFactorAuthService {
  private logger: Logger;
  private maxAttempts = 5;
  private window = 2; // Time window for TOTP validation
  private backupCodeLength = 8;
  private backupCodeCount = 10;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Generate 2FA secret for a user
   */
  async generateSecret(userId: string, userEmail: string): Promise<TwoFactorSecret> {
    try {
      const secret = speakeasy.generateSecret({
        name: `Axisor (${userEmail})`,
        issuer: 'Axisor',
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      this.logger.info('2FA secret generated', {
        userId,
        hasSecret: !!secret.base32,
        backupCodesCount: backupCodes.length
      });

      return {
        secret: secret.base32!,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      this.logger.error('Failed to generate 2FA secret', {
        userId,
        error: (error as Error).message
      });
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Verify TOTP token
   */
  verifyToken(secret: string, token: string): TwoFactorVerification {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.window
      });

      this.logger.debug('TOTP token verification', {
        verified,
        token: token.substring(0, 2) + '****'
      });

      return {
        isValid: verified,
        remainingAttempts: this.maxAttempts,
        isBackupCode: false
      };
    } catch (error) {
      this.logger.error('TOTP verification failed', {
        error: (error as Error).message
      });
      return {
        isValid: false,
        remainingAttempts: 0,
        isBackupCode: false
      };
    }
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(backupCodes: string[], usedCodes: string[], code: string): TwoFactorVerification {
    try {
      // Check if code is valid
      if (!backupCodes.includes(code)) {
        return {
          isValid: false,
          remainingAttempts: 0,
          isBackupCode: true
        };
      }

      // Check if code was already used
      if (usedCodes.includes(code)) {
        return {
          isValid: false,
          remainingAttempts: 0,
          isBackupCode: true
        };
      }

      this.logger.info('Backup code verified', {
        code: code.substring(0, 2) + '****'
      });

      return {
        isValid: true,
        remainingAttempts: this.maxAttempts,
        isBackupCode: true
      };
    } catch (error) {
      this.logger.error('Backup code verification failed', {
        error: (error as Error).message
      });
      return {
        isValid: false,
        remainingAttempts: 0,
        isBackupCode: true
      };
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.backupCodeCount; i++) {
      const code = this.generateRandomCode(this.backupCodeLength);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Generate random backup code
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Generate new backup codes
   */
  generateNewBackupCodes(): string[] {
    return this.generateBackupCodes();
  }

  /**
   * Validate backup code format
   */
  validateBackupCodeFormat(code: string): boolean {
    const regex = new RegExp(`^[A-Z0-9]{${this.backupCodeLength}}$`);
    return regex.test(code);
  }

  /**
   * Get TOTP time remaining
   */
  getTimeRemaining(): number {
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const timeStep = 30;
    const timeRemaining = timeStep - (epoch % timeStep);
    return timeRemaining;
  }

  /**
   * Get current TOTP token
   */
  getCurrentToken(secret: string): string {
    try {
      return speakeasy.totp({
        secret,
        encoding: 'base32',
        window: 0
      });
    } catch (error) {
      this.logger.error('Failed to generate current TOTP token', {
        error: (error as Error).message
      });
      return '';
    }
  }

  /**
   * Check if 2FA is properly configured
   */
  isConfigured(secret: string): boolean {
    try {
      // Try to generate a token to validate the secret
      speakeasy.totp({
        secret,
        encoding: 'base32',
        window: 0
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get 2FA configuration info
   */
  getConfigurationInfo(secret: string): {
    algorithm: string;
    digits: number;
    period: number;
    issuer: string;
    accountName: string;
  } {
    try {
      const config = speakeasy.generateSecret({
        secret,
        encoding: 'base32'
      });

      return {
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        issuer: 'Axisor',
        accountName: 'User Account'
      };
    } catch (error) {
      this.logger.error('Failed to get 2FA configuration info', {
        error: (error as Error).message
      });
      throw new Error('Invalid 2FA secret');
    }
  }

  /**
   * Disable 2FA for user
   */
  disable2FA(userId: string): void {
    this.logger.info('2FA disabled for user', { userId });
  }

  /**
   * Enable 2FA for user
   */
  enable2FA(userId: string, secret: string): void {
    this.logger.info('2FA enabled for user', { 
      userId,
      hasSecret: !!secret
    });
  }

  /**
   * Get 2FA status
   */
  getStatus(secret?: string, backupCodes?: string[]): {
    enabled: boolean;
    hasBackupCodes: boolean;
    backupCodesCount: number;
    timeRemaining: number;
  } {
    return {
      enabled: !!secret && this.isConfigured(secret),
      hasBackupCodes: !!backupCodes && backupCodes.length > 0,
      backupCodesCount: backupCodes?.length || 0,
      timeRemaining: this.getTimeRemaining()
    };
  }

  /**
   * Validate 2FA setup
   */
  validateSetup(secret: string, token: string): boolean {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.window
      });

      this.logger.info('2FA setup validation', {
        verified,
        token: token.substring(0, 2) + '****'
      });

      return verified;
    } catch (error) {
      this.logger.error('2FA setup validation failed', {
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Get recovery options
   */
  getRecoveryOptions(backupCodes: string[], usedCodes: string[]): {
    remainingBackupCodes: number;
    canUseBackupCodes: boolean;
    totalBackupCodes: number;
  } {
    const remainingCodes = backupCodes.filter(code => !usedCodes.includes(code));
    
    return {
      remainingBackupCodes: remainingCodes.length,
      canUseBackupCodes: remainingCodes.length > 0,
      totalBackupCodes: backupCodes.length
    };
  }

  /**
   * Mark backup code as used
   */
  markBackupCodeAsUsed(usedCodes: string[], code: string): string[] {
    if (!usedCodes.includes(code)) {
      return [...usedCodes, code];
    }
    return usedCodes;
  }

  /**
   * Get 2FA service statistics
   */
  getStats(): {
    maxAttempts: number;
    window: number;
    backupCodeLength: number;
    backupCodeCount: number;
    algorithm: string;
    digits: number;
    period: number;
  } {
    return {
      maxAttempts: this.maxAttempts,
      window: this.window,
      backupCodeLength: this.backupCodeLength,
      backupCodeCount: this.backupCodeCount,
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    };
  }
}