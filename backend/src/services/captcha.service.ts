import axios, { AxiosInstance } from 'axios';

export interface CaptchaVerification {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export class CaptchaService {
  private hcaptchaClient: AxiosInstance;
  private recaptchaClient: AxiosInstance;

  constructor() {
    // hCaptcha client
    this.hcaptchaClient = axios.create({
      baseURL: 'https://hcaptcha.com',
      timeout: 10000,
    });

    // reCAPTCHA client
    this.recaptchaClient = axios.create({
      baseURL: 'https://www.google.com',
      timeout: 10000,
    });
  }

  /**
   * Verify hCaptcha token
   */
  async verifyHCaptcha(token: string, remoteip?: string): Promise<CaptchaVerification> {
    const secret = process.env.HCAPTCHA_SECRET_KEY;
    if (!secret) {
      console.warn('hCaptcha secret key not configured');
      return { success: true }; // Allow in development
    }

    try {
      const params = new URLSearchParams({
        secret,
        response: token,
      });

      if (remoteip) {
        params.append('remoteip', remoteip);
      }

      const response = await this.hcaptchaClient.post('/siteverify', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('hCaptcha verification error:', error.response?.data || error.message);
      return {
        success: false,
        'error-codes': ['verification-failed'],
      };
    }
  }

  /**
   * Verify reCAPTCHA v2 token
   */
  async verifyReCaptcha(token: string, remoteip?: string): Promise<CaptchaVerification> {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      console.warn('reCAPTCHA secret key not configured');
      return { success: true }; // Allow in development
    }

    try {
      const params = new URLSearchParams({
        secret,
        response: token,
      });

      if (remoteip) {
        params.append('remoteip', remoteip);
      }

      const response = await this.recaptchaClient.post('/recaptcha/api/siteverify', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('reCAPTCHA verification error:', error.response?.data || error.message);
      return {
        success: false,
        'error-codes': ['verification-failed'],
      };
    }
  }

  /**
   * Verify reCAPTCHA v3 token
   */
  async verifyReCaptchaV3(token: string, remoteip?: string): Promise<CaptchaVerification & { score?: number }> {
    const secret = process.env.RECAPTCHA_V3_SECRET_KEY;
    if (!secret) {
      console.warn('reCAPTCHA v3 secret key not configured');
      return { success: true, score: 1.0 }; // Allow in development
    }

    try {
      const params = new URLSearchParams({
        secret,
        response: token,
      });

      if (remoteip) {
        params.append('remoteip', remoteip);
      }

      const response = await this.recaptchaClient.post('/recaptcha/api/siteverify', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('reCAPTCHA v3 verification error:', error.response?.data || error.message);
      return {
        success: false,
        'error-codes': ['verification-failed'],
      };
    }
  }

  /**
   * Verify CAPTCHA with fallback
   */
  async verifyCaptcha(token: string, type: 'hcaptcha' | 'recaptcha' | 'recaptcha-v3' = 'hcaptcha', remoteip?: string): Promise<CaptchaVerification> {
    switch (type) {
      case 'hcaptcha':
        return await this.verifyHCaptcha(token, remoteip);
      case 'recaptcha':
        return await this.verifyReCaptcha(token, remoteip);
      case 'recaptcha-v3':
        return await this.verifyReCaptchaV3(token, remoteip);
      default:
        throw new Error(`Unsupported CAPTCHA type: ${type}`);
    }
  }

  /**
   * Check if CAPTCHA verification is required based on risk factors
   */
  shouldRequireCaptcha(request: any): boolean {
    // Always require for registration and login
    if (request.url.includes('/auth/register') || request.url.includes('/auth/login')) {
      return true;
    }

    // Check user agent for suspicious patterns
    const userAgent = request.headers['user-agent'] || '';
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return true;
    }

    // Could add more sophisticated checks here:
    // - Rate limiting violations
    // - Geographic location
    // - Recent failed attempts
    // - Account age

    return false;
  }

  /**
   * Get CAPTCHA configuration for frontend
   */
  getCaptchaConfig() {
    return {
      hcaptcha_site_key: process.env.HCAPTCHA_SITE_KEY,
      recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY,
      recaptcha_v3_site_key: process.env.RECAPTCHA_V3_SITE_KEY,
      enabled_types: this.getEnabledTypes(),
    };
  }

  /**
   * Get enabled CAPTCHA types
   */
  private getEnabledTypes(): string[] {
    const types: string[] = [];

    if (process.env.HCAPTCHA_SITE_KEY && process.env.HCAPTCHA_SECRET_KEY) {
      types.push('hcaptcha');
    }

    if (process.env.RECAPTCHA_SITE_KEY && process.env.RECAPTCHA_SECRET_KEY) {
      types.push('recaptcha');
    }

    if (process.env.RECAPTCHA_V3_SITE_KEY && process.env.RECAPTCHA_V3_SECRET_KEY) {
      types.push('recaptcha-v3');
    }

    return types;
  }
}

// Export singleton instance
export const captchaService = new CaptchaService();