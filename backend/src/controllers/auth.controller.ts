import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AuthService } from '@/services/auth.service';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { metrics } from '@/services/metrics.service';

// Interfaces
interface RegisterRequestBody {
  email?: string;
  username?: string;
  password?: string;
  ln_markets_api_key?: string;
  ln_markets_api_secret?: string;
  ln_markets_passphrase?: string;
  coupon_code?: string;
}

// Interface for authenticated requests - user is declared globally in auth.middleware.ts
// interface AuthenticatedRequest extends FastifyRequest {
//   // user property is declared globally in auth.middleware.ts
// }

// Zod schemas for validation
const RegisterRequestZodSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  ln_markets_api_key: z
    .string()
    .min(16, 'LN Markets API key must be at least 16 characters'),
  ln_markets_api_secret: z
    .string()
    .min(16, 'LN Markets API secret must be at least 16 characters'),
  ln_markets_passphrase: z
    .string()
    .min(8, 'LN Markets passphrase must be at least 8 characters'),
  coupon_code: z.string().optional(),
});

const LoginRequestZodSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const AuthResponseZodSchema = z.object({
  user_id: z.string().uuid(),
  token: z.string(),
  plan_type: z.enum(['free', 'basic', 'advanced', 'pro', 'lifetime']),
});

// const RefreshTokenResponseZodSchema = z.object({
//   token: z.string(),
// });

const ErrorResponseZodSchema = z.object({
  error: z.string(),
  message: z.string(),
});

const ValidationErrorResponseZodSchema = z.object({
  error: z.literal('VALIDATION_ERROR'),
  message: z.string(),
  validation_errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      value: z
        .union([z.string(), z.number(), z.boolean(), z.null()])
        .optional(),
    })
  ),
});

export class AuthController {
  private authService: AuthService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, fastify: FastifyInstance) {
    this.prisma = prisma;
    this.authService = new AuthService(prisma, fastify);
  }

  /**
   * Register a new user
   */
  async register(request: FastifyRequest, reply: FastifyReply) {
    console.log('🔍 REGISTER CONTROLLER - Request received');
    console.log('📊 Request details:', {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      timestamp: new Date().toISOString()
    });
    
    const body = request.body as RegisterRequestBody;
    console.log('📋 Request body analysis:', {
      hasEmail: !!body?.email,
      hasUsername: !!body?.username,
      hasPassword: !!body?.password,
      hasApiKey: !!body?.ln_markets_api_key,
      hasApiSecret: !!body?.ln_markets_api_secret,
      hasPassphrase: !!body?.ln_markets_passphrase,
      hasCoupon: !!body?.coupon_code,
      email: body?.email,
      username: body?.username,
      apiKeyLength: body?.ln_markets_api_key?.length,
      apiSecretLength: body?.ln_markets_api_secret?.length,
      passphraseLength: body?.ln_markets_passphrase?.length,
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

      // Record successful registration
      metrics.recordAuthAttempt('register', 'success');

      console.log('📤 Preparing response...');
      // Return response
      const response = AuthResponseZodSchema.parse(result);
      console.log('✅ Response prepared successfully');

      console.log('📤 Sending success response...');
      return reply.status(201).send(response);
    } catch (error) {
      console.error('❌ Registration error occurred:', error);

      // Record failed registration
      metrics.recordAuthAttempt('register', 'failure', (error as Error).message);

      if (error instanceof z.ZodError) {
        console.log('❌ Validation error:', error.errors);
        const validationResponse = ValidationErrorResponseZodSchema.parse({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          validation_errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: (err as any).input,
          })),
        });
        console.log('📤 Sending validation error response');
        return reply.status(400).send(validationResponse);
      }

      console.log('❌ General registration error:', (error as Error).message);
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

      // Record successful login
      metrics.recordAuthAttempt('login', 'success');

      // Return response
      const response = AuthResponseZodSchema.parse(result);
      return reply.status(200).send(response);
    } catch (error) {
      // Record failed login
      metrics.recordAuthAttempt('login', 'failure', (error as Error).message);

      if (error instanceof z.ZodError) {
        const validationResponse = ValidationErrorResponseZodSchema.parse({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          validation_errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: (err as any).input,
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
   * Check username availability
   */
  async checkUsername(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const { username } = _request.query as { username: string };

      if (!username) {
        return reply.status(400).send({
          error: 'BAD_REQUEST',
          message: 'Username is required',
        });
      }

      const result = await this.authService.checkUsernameAvailability(username);
      return reply.status(200).send(result);
    } catch (error) {
      console.error('Check username error:', error);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check username availability',
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Get refresh token from body or cookie
      const body = request.body as any;
      const refreshToken = body?.refresh_token || (request as any).cookies?.refresh_token;

      if (!refreshToken) {
        const errorResponse = ErrorResponseZodSchema.parse({
          error: 'REFRESH_TOKEN_MISSING',
          message: 'Refresh token is required',
        });
        return reply.status(401).send(errorResponse);
      }

      // Refresh token
      const result = await this.authService.refreshToken(refreshToken);

      // Return response
      const response = AuthResponseZodSchema.parse(result);
      return reply.status(200).send(response);
    } catch (error) {
      const errorResponse = ErrorResponseZodSchema.parse({
        error: 'REFRESH_TOKEN_FAILED',
        message:
          error instanceof Error ? error.message : 'Token refresh failed',
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
        const errorResponse = ErrorResponseZodSchema.parse({
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
        return reply.status(401).send(errorResponse);
      }

      // Logout user
      await this.authService.logout(user.id);

      // Clear refresh token cookie
      (reply as any).clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return reply.status(200).send({
        message: 'Logged out successfully',
      });
    } catch (error) {
      const errorResponse = ErrorResponseZodSchema.parse({
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
        const errorResponse = ErrorResponseZodSchema.parse({
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
        return reply.status(401).send(errorResponse);
      }

      // Check if user is admin
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { user_id: user.id },
        select: { role: true }
      });
      
      const isAdmin = adminUser?.role === 'superadmin';

      // Return user info
      return reply.status(200).send({
        id: user.id,
        email: user.email,
        plan_type: user.plan_type,
        created_at: (user as any).created_at,
        last_activity_at: (user as any).last_activity_at,
        ln_markets_api_key: (user as any).ln_markets_api_key,
        ln_markets_api_secret: (user as any).ln_markets_api_secret,
        ln_markets_passphrase: (user as any).ln_markets_passphrase,
        is_admin: isAdmin,
      });
    } catch (error) {
      const errorResponse = ErrorResponseZodSchema.parse({
        error: 'USER_INFO_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to get user info',
      });

      return reply.status(500).send(errorResponse);
    }
  }

  /**
   * Social login callback (Google)
   */
  async googleCallback(_request: FastifyRequest, reply: FastifyReply) {
    try {
      // This would be implemented with Passport.js
      // For now, return a placeholder response
      const errorResponse = ErrorResponseZodSchema.parse({
        error: 'NOT_IMPLEMENTED',
        message: 'Google OAuth not yet implemented',
      });

      return reply.status(501).send(errorResponse);
    } catch (error) {
      const errorResponse = ErrorResponseZodSchema.parse({
        error: 'SOCIAL_LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Social login failed',
      });

      return reply.status(500).send(errorResponse);
    }
  }

  /**
   * Social login callback (GitHub)
   */
  async githubCallback(_request: FastifyRequest, reply: FastifyReply) {
    try {
      // This would be implemented with Passport.js
      // For now, return a placeholder response
      const errorResponse = ErrorResponseZodSchema.parse({
        error: 'NOT_IMPLEMENTED',
        message: 'GitHub OAuth not yet implemented',
      });

      return reply.status(501).send(errorResponse);
    } catch (error) {
      const errorResponse = ErrorResponseZodSchema.parse({
        error: 'SOCIAL_LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Social login failed',
      });

      return reply.status(500).send(errorResponse);
    }
  }
}
