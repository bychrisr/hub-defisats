import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

export class Sanitizer {
  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove control characters except newlines and tabs
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Limit length to prevent DoS
    sanitized = sanitized.substring(0, 10000);

    return sanitized;
  }

  /**
   * Sanitize email
   */
  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email);
    return validator.normalizeEmail(sanitized) || '';
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(html: string): string {
    if (typeof html !== 'string') {
      return '';
    }

    // Use DOMPurify to sanitize HTML
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJson(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeJson(item));
    }

    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeJson(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Validate and sanitize SQL input (for manual queries)
   */
  static sanitizeSql(input: string): string {
    const sanitized = this.sanitizeString(input);

    // Remove SQL injection patterns
    return sanitized
      .replace(
        /[';\\*|%+=<>\[\]{}()^$!@#&~`-]/g,
        ''
      )
      .replace(
        /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)/gi,
        ''
      );
  }

  /**
   * Escape HTML entities
   */
  static escapeHtml(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate URL
   */
  static sanitizeUrl(url: string): string {
    const sanitized = this.sanitizeString(url);

    if (
      !validator.isURL(sanitized, {
        protocols: ['http', 'https'],
        require_protocol: true,
      })
    ) {
      return '';
    }

    return sanitized;
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhone(phone: string): string {
    const sanitized = this.sanitizeString(phone);
    return validator.isMobilePhone(sanitized) ? sanitized : '';
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: string | number): number {
    if (typeof input === 'number') {
      return isNaN(input) ? 0 : input;
    }

    const sanitized = this.sanitizeString(input);
    const number = parseFloat(sanitized);

    return isNaN(number) ? 0 : number;
  }

  /**
   * Sanitize integer input
   */
  static sanitizeInteger(input: string | number): number {
    const number = this.sanitizeNumber(input);
    return Math.floor(number);
  }
}
