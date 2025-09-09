import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AuthService } from '@/services/auth.service';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Zod schemas for validation
const RegisterRequestZodSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  ln_markets_api_key: z.string().min(16, 'LN Markets API key must be at least 16 characters'),
  ln_markets_api_secret: z.string().min(16, 'LN Markets API secret must be at least 16 characters'),
  ln_markets_passphrase: z.string().min(8, 'LN Markets passphrase must be at least 8 characters'),
  coupon_code: z.string().optional(),
});

const LoginRequestZodSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const AuthResponseZodSchema = z.object({
  user_id: z.string().uuid(),
  token: z.string(),
  plan_type: z.enum(['free', 'basic', 'advanced', 'pro']),
});

const RefreshTokenResponseZodSchema = z.object({
  token: z.string(),
});

const ErrorResponseZodSchema = z.object({
  error: z.string(),
  message: z.string(),
});

const ValidationErrorResponseZodSchema = z.object({
  error: z.literal('VALIDATION_ERROR'),
  message: z.string(),
  validation_errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  })),
});

export class AuthController {
  private authService: AuthService;

  constructor(prisma: PrismaClient, fastify: FastifyInstance) {
    this.authService = new AuthService(prisma, fastify);
  }

  /**
   * Register a new user
   */
  async register(request: FastifyRequest, reply: FastifyReply) {
    console.log('📥 Registration request received');
    console.log('📋 Request body:', {
      hasEmail: !!(request.body as any)?.email,
      hasUsername: !!(request.body as any)?.username,
      hasPassword: !!(request.body as any)?.password,
      hasApiKey: !!(request.body as any)?.ln_markets_api_key,
      hasApiSecret: !!(request.body as any)?.ln_markets_api_secret,
      hasPassphrase: !!(request.body as any)?.ln_markets_passphrase,
      hasCoupon: !!(request.body as any)?.coupon_code
    });

    try {
      console.log('🔍 Validating request body...');
      // Validate request body
      const body = RegisterRequestZodSchema.parse(request.body);
      console.log('✅ Request body validated successfully');

      console.log('🔐 Calling auth service register method...');
      // Register user
      const result = await this.authService.register(body);
      console.log('✅ User registration completed in service');

      console.log('📤 Preparing response...');
      // Return response
      const response = AuthResponseZodSchema.parse(result);
      console.log('✅ Response prepared successfully');
      
      console.log('📤 Sending success response...');
      return reply.status(201).send(response);
    } catch (error) {
      console.error('❌ Registration error occurred:', error);
      if (error instanceof z.ZodError) {
        console.log('❌ Validation error:', error.errors);
        const validationResponse = ValidationErrorResponseZodSchema.parse({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          validation_errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.input,
          })),
        });
        console.log('📤 Sending validation error response');
        return reply.status(400).send(validationResponse);
      }

      console.log('❌ General registration error:', error.message);
      const errorResponse = ErrorResponseZodSchema.parse({
        error: 'REGISTRATION_FAILED',
        message: error instanceof Error ? error.message : 'Registration failed',
      });

      console.log('📤 Sending error response');
      return reply.status(400).send(errorResponse);
    }
  }

  /**
   * Login user
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validate request body
      const body = LoginRequestZodSchema.parse(request.body);

      // Login user
      const result = await this.authService.login(body);

      // Return response
      const response = AuthResponseZodSchema.parse(result);
      return reply.status(200).send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationResponse = ValidationErrorResponseZodSchema.parse({
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

      const errorResponse = ErrorResponseZodSchema.parse({
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
