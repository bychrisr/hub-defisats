import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '@/services/auth.service';
import { PrismaClient } from '@prisma/client';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshTokenRequestSchema,
  AuthResponseSchema,
  RefreshTokenResponseSchema,
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '@/types/api-contracts';
import { z } from 'zod';

export class AuthController {
  private authService: AuthService;

  constructor(prisma: PrismaClient) {
    this.authService = new AuthService(prisma);
  }

  /**
   * Register a new user
   */
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validate request body
      const body = RegisterRequestSchema.parse(request.body);

      // Register user
      const result = await this.authService.register(body);

      // Return response
      const response = AuthResponseSchema.parse(result);
      return reply.status(201).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationResponse = ValidationErrorResponseSchema.parse({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          validation_errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.input,
          })),
        });
        return reply.status(400).send(validationResponse);
      }

      const errorResponse = ErrorResponseSchema.parse({
        error: 'REGISTRATION_FAILED',
        message: error instanceof Error ? error.message : 'Registration failed',
      });

      return reply.status(400).send(errorResponse);
    }
  }

  /**
   * Login user
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validate request body
      const body = LoginRequestSchema.parse(request.body);

      // Login user
      const result = await this.authService.login(body);

      // Return response
      const response = AuthResponseSchema.parse(result);
      return reply.status(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationResponse = ValidationErrorResponseSchema.parse({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          validation_errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.input,
          })),
        });
        return reply.status(400).send(validationResponse);
      }

      const errorResponse = ErrorResponseSchema.parse({
        error: 'LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Login failed',
      });

      return reply.status(401).send(errorResponse);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Get refresh token from cookie
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        const errorResponse = ErrorResponseSchema.parse({
          error: 'REFRESH_TOKEN_MISSING',
          message: 'Refresh token is required',
        });
        return reply.status(401).send(errorResponse);
      }

      // Refresh token
      const result = await this.authService.refreshToken(refreshToken);

      // Return response
      const response = RefreshTokenResponseSchema.parse(result);
      return reply.status(200).send(response);
    } catch (error) {
      const errorResponse = ErrorResponseSchema.parse({
        error: 'REFRESH_TOKEN_FAILED',
        message: error instanceof Error ? error.message : 'Token refresh failed',
      });

      return reply.status(401).send(errorResponse);
    }
  }

  /**
   * Logout user
   */
  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Get user from request (set by auth middleware)
      const user = (request as any).user;

      if (!user) {
        const errorResponse = ErrorResponseSchema.parse({
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
        return reply.status(401).send(errorResponse);
      }

      // Logout user
      await this.authService.logout(user.id);

      // Clear refresh token cookie
      reply.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return reply.status(200).send({
        message: 'Logged out successfully',
      });
    } catch (error) {
      const errorResponse = ErrorResponseSchema.parse({
        error: 'LOGOUT_FAILED',
        message: error instanceof Error ? error.message : 'Logout failed',
      });

      return reply.status(500).send(errorResponse);
    }
  }

  /**
   * Get current user info
   */
  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Get user from request (set by auth middleware)
      const user = (request as any).user;

      if (!user) {
        const errorResponse = ErrorResponseSchema.parse({
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
        return reply.status(401).send(errorResponse);
      }

      // Return user info
      return reply.status(200).send({
        id: user.id,
        email: user.email,
        plan_type: user.plan_type,
        created_at: user.created_at,
        last_activity_at: user.last_activity_at,
      });
    } catch (error) {
      const errorResponse = ErrorResponseSchema.parse({
        error: 'USER_INFO_FAILED',
        message: error instanceof Error ? error.message : 'Failed to get user info',
      });

      return reply.status(500).send(errorResponse);
    }
  }

  /**
   * Social login callback (Google)
   */
  async googleCallback(request: FastifyRequest, reply: FastifyReply) {
    try {
      // This would be implemented with Passport.js
      // For now, return a placeholder response
      const errorResponse = ErrorResponseSchema.parse({
        error: 'NOT_IMPLEMENTED',
        message: 'Google OAuth not yet implemented',
      });

      return reply.status(501).send(errorResponse);
    } catch (error) {
      const errorResponse = ErrorResponseSchema.parse({
        error: 'SOCIAL_LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Social login failed',
      });

      return reply.status(500).send(errorResponse);
    }
  }

  /**
   * Social login callback (GitHub)
   */
  async githubCallback(request: FastifyRequest, reply: FastifyReply) {
    try {
      // This would be implemented with Passport.js
      // For now, return a placeholder response
      const errorResponse = ErrorResponseSchema.parse({
        error: 'NOT_IMPLEMENTED',
        message: 'GitHub OAuth not yet implemented',
      });

      return reply.status(501).send(errorResponse);
    } catch (error) {
      const errorResponse = ErrorResponseSchema.parse({
        error: 'SOCIAL_LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Social login failed',
      });

      return reply.status(500).send(errorResponse);
    }
  }
}
