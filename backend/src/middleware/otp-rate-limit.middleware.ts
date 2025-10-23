import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

/**
 * Rate limiting para tentativas de OTP
 * Máximo 5 tentativas em 15 minutos por IP+email
 */
export const otpRateLimit = rateLimit({
  max: 5,
  timeWindow: '15 minutes',
  keyGenerator: (request) => {
    const { email } = request.body as { email: string };
    return `${request.ip}-${email}`;
  },
  errorResponseBuilder: (request, context) => {
    return {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Muitas tentativas de OTP. Tente novamente em 15 minutos.',
      retryAfter: Math.round(context.ttl / 1000)
    };
  }
});

/**
 * Rate limiting para reenvio de emails
 * Máximo 3 reenvios por hora por IP+email
 */
export const resendRateLimit = rateLimit({
  max: 3,
  timeWindow: '1 hour',
  keyGenerator: (request) => {
    const { email } = request.body as { email: string };
    return `resend-${request.ip}-${email}`;
  },
  errorResponseBuilder: (request, context) => {
    return {
      success: false,
      error: 'RESEND_RATE_LIMIT_EXCEEDED',
      message: 'Muitos reenvios de email. Tente novamente em 1 hora.',
      retryAfter: Math.round(context.ttl / 1000)
    };
  }
});

/**
 * Registra os middlewares de rate limiting no Fastify
 */
export function registerRateLimitMiddlewares(fastify: FastifyInstance) {
  fastify.register(otpRateLimit);
  fastify.register(resendRateLimit);
}
