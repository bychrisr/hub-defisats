import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimitMiddleware } from './rate-limit.middleware';

const rateLimitMiddleware = new RateLimitMiddleware();

/**
 * Middleware para rate limiting de API calls por usuário
 */
export async function apiRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimitMiddleware.apiRateLimit(request, reply);
}

/**
 * Middleware para rate limiting de automações por usuário
 */
export async function automationRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimitMiddleware.automationRateLimit(request, reply);
}

/**
 * Middleware para rate limiting de trade operations por usuário
 */
export async function tradeRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimitMiddleware.tradeRateLimit(request, reply);
}

/**
 * Middleware para rate limiting de login por usuário
 */
export async function loginRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimitMiddleware.userRateLimit(
    request,
    reply,
    'login_attempts',
    5,
    900000
  ); // 5 tentativas em 15 min
}

/**
 * Middleware para rate limiting de registro por usuário
 */
export async function registrationRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimitMiddleware.userRateLimit(
    request,
    reply,
    'registration_attempts',
    3,
    3600000
  ); // 3 tentativas em 1 hora
}

/**
 * Middleware para rate limiting de password reset por usuário
 */
export async function passwordResetRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimitMiddleware.userRateLimit(
    request,
    reply,
    'password_reset_attempts',
    3,
    3600000
  ); // 3 tentativas em 1 hora
}
