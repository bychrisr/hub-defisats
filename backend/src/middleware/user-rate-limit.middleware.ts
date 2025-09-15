import { FastifyRequest, FastifyReply } from 'fastify';
import { rateLimiters } from './rate-limit.middleware';

/**
 * Middleware para rate limiting de API calls por usuário
 */
export async function apiRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimiters.api(request, reply);
}

/**
 * Middleware para rate limiting de automações por usuário
 */
export async function automationRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimiters.api(request, reply);
}

/**
 * Middleware para rate limiting de trade operations por usuário
 */
export async function tradeRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimiters.trading(request, reply);
}

/**
 * Middleware para rate limiting de login por usuário
 */
export async function loginRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimiters.auth(request, reply);
}

/**
 * Middleware para rate limiting de registro por usuário
 */
export async function registrationRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimiters.auth(request, reply);
}

/**
 * Middleware para rate limiting de password reset por usuário
 */
export async function passwordResetRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await rateLimiters.auth(request, reply);
}
