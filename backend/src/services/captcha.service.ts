import axios from 'axios';
import { config } from '@/config/env';

export class CaptchaService {
  private readonly recaptchaSecretKey: string;
  private readonly recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';

  constructor() {
    this.recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY || '';
  }

  /**
   * Verify reCAPTCHA token
   */
  async verifyRecaptcha(token: string, remoteip?: string): Promise<{
    success: boolean;
    score?: number;
    error?: string;
  }> {
    if (!this.recaptchaSecretKey) {
      console.warn('RECAPTCHA_SECRET_KEY not configured, skipping verification');
      return { success: true }; // Allow in development
    }

    try {
      const response = await axios.post(this.recaptchaUrl, null, {
        params: {
          secret: this.recaptchaSecretKey,
          response: token,
          remoteip,
        },
        timeout: 10000,
      });

      const { success, score, 'error-codes': errorCodes } = response.data;

      if (!success) {
        return {
          success: false,
          error: errorCodes?.join(', ') || 'reCAPTCHA verification failed',
        };
      }

      // For reCAPTCHA v3, check score (0.0 to 1.0, higher is better)
      if (score !== undefined && score < 0.5) {
        return {
          success: false,
          score,
          error: 'reCAPTCHA score too low',
        };
      }

      return {
        success: true,
        score,
      };
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return {
        success: false,
        error: 'reCAPTCHA service unavailable',
      };
    }
  }

  /**
   * Verify hCaptcha token
   */
  async verifyHcaptcha(token: string, remoteip?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const hcaptchaSecretKey = process.env.HCAPTCHA_SECRET_KEY;
    
    if (!hcaptchaSecretKey) {
      console.warn('HCAPTCHA_SECRET_KEY not configured, skipping verification');
      return { success: true }; // Allow in development
    }

    try {
      const response = await axios.post('https://hcaptcha.com/siteverify', null, {
        params: {
          secret: hcaptchaSecretKey,
          response: token,
          remoteip,
        },
        timeout: 10000,
      });

      const { success, 'error-codes': errorCodes } = response.data;

      if (!success) {
        return {
          success: false,
          error: errorCodes?.join(', ') || 'hCaptcha verification failed',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('hCaptcha verification error:', error);
      return {
        success: false,
        error: 'hCaptcha service unavailable',
      };
    }
  }
}
