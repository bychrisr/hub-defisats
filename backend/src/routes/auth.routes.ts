import { FastifyInstance } from 'fastify';
import { AuthController } from '@/controllers/auth.controller';
import { PrismaClient } from '@prisma/client';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  AuthResponseSchema,
  RefreshTokenResponseSchema,
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '@/types/api-contracts';

export async function authRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const authController = new AuthController(prisma);

  // Register route
  fastify.post(
    '/register',
    {
      schema: {
        description: 'Register a new user',
        tags: ['Authentication'],
        body: RegisterRequestSchema,
        response: {
          201: AuthResponseSchema,
          400: ValidationErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    authController.register.bind(authController)
  );

  // Login route
  fastify.post(
    '/login',
    {
      schema: {
        description: 'Login user with email and password',
        tags: ['Authentication'],
        body: LoginRequestSchema,
        response: {
          200: AuthResponseSchema,
          400: ValidationErrorResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    authController.login.bind(authController)
  );

  // Refresh token route
  fastify.post(
    '/refresh',
    {
      schema: {
        description: 'Refresh access token using refresh token',
        tags: ['Authentication'],
        response: {
          200: RefreshTokenResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    authController.refreshToken.bind(authController)
  );

  // Logout route
  fastify.post(
    '/logout',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Logout user and invalidate session',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          401: ErrorResponseSchema,
        },
      },
    },
    authController.logout.bind(authController)
  );

  // Get current user route
  fastify.get(
    '/me',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get current user information',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              plan_type: { type: 'string', enum: ['free', 'basic', 'advanced', 'pro'] },
              created_at: { type: 'string', format: 'date-time' },
              last_activity_at: { type: 'string', format: 'date-time' },
            },
          },
          401: ErrorResponseSchema,
        },
      },
    },
    authController.me.bind(authController)
  );

  // Social login routes (placeholders)
  fastify.get(
    '/google',
    {
      schema: {
        description: 'Initiate Google OAuth login',
        tags: ['Authentication'],
        response: {
          302: {
            description: 'Redirect to Google OAuth',
          },
          501: ErrorResponseSchema,
        },
      },
    },
    authController.googleCallback.bind(authController)
  );

  fastify.get(
    '/google/callback',
    {
      schema: {
        description: 'Google OAuth callback',
        tags: ['Authentication'],
        response: {
          200: AuthResponseSchema,
          401: ErrorResponseSchema,
          501: ErrorResponseSchema,
        },
      },
    },
    authController.googleCallback.bind(authController)
  );

  fastify.get(
    '/github',
    {
      schema: {
        description: 'Initiate GitHub OAuth login',
        tags: ['Authentication'],
        response: {
          302: {
            description: 'Redirect to GitHub OAuth',
          },
          501: ErrorResponseSchema,
        },
      },
    },
    authController.githubCallback.bind(authController)
  );

  fastify.get(
    '/github/callback',
    {
      schema: {
        description: 'GitHub OAuth callback',
        tags: ['Authentication'],
        response: {
          200: AuthResponseSchema,
          401: ErrorResponseSchema,
          501: ErrorResponseSchema,
        },
      },
    },
    authController.githubCallback.bind(authController)
  );
}
