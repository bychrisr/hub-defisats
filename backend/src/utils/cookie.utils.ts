import { FastifyReply } from 'fastify';
import { config } from '../config/env';

export class CookieUtils {
  /**
   * Set secure refresh token cookie
   */
  static setRefreshTokenCookie(reply: FastifyReply, token: string): void {
    (reply as any).setCookie('refresh_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: config.isProduction ? '.hubdefisats.com' : undefined,
    });
  }

  /**
   * Clear refresh token cookie
   */
  static clearRefreshTokenCookie(reply: FastifyReply): void {
    (reply as any).clearCookie('refresh_token', {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      path: '/',
      domain: config.isProduction ? '.hubdefisats.com' : undefined,
    });
  }

  /**
   * Set secure session cookie
   */
  static setSessionCookie(reply: FastifyReply, sessionId: string): void {
    (reply as any).setCookie('session_id', sessionId, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 60 * 1000, // 30 minutes
      domain: config.isProduction ? '.hubdefisats.com' : undefined,
    });
  }

  /**
   * Clear session cookie
   */
  static clearSessionCookie(reply: FastifyReply): void {
    (reply as any).clearCookie('session_id', {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      path: '/',
      domain: config.isProduction ? '.hubdefisats.com' : undefined,
    });
  }

  /**
   * Set CSRF token cookie
   */
  static setCSRFTokenCookie(reply: FastifyReply, token: string): void {
    (reply as any).setCookie('csrf_token', token, {
      httpOnly: false, // Needs to be accessible by JavaScript
      secure: config.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hour
      domain: config.isProduction ? '.hubdefisats.com' : undefined,
    });
  }

  /**
   * Clear CSRF token cookie
   */
  static clearCSRFTokenCookie(reply: FastifyReply): void {
    (reply as any).clearCookie('csrf_token', {
      httpOnly: false,
      secure: config.isProduction,
      sameSite: 'strict',
      path: '/',
      domain: config.isProduction ? '.hubdefisats.com' : undefined,
    });
  }
}
