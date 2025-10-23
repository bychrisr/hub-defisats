import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { PrismaClient } from '@prisma/client';
// import { testSandboxCredentials } from '../services/lnmarkets.service'; // Removed
// import {
//   RegisterRequestSchema,
//   LoginRequestSchema,
//   AuthResponseSchema,
//   RefreshTokenResponseSchema,
//   ErrorResponseSchema,
//   ValidationErrorResponseSchema,
// } from '@/schemas/auth.schemas';
import {
  validateRegisterInput,
  validateLoginInput,
} from '../middleware/validation.middleware';
import {
  dynamicRateLimiters,
} from '../middleware/dynamic-rate-limit.middleware';
import {
  getRateLimitInfo,
} from '../middleware/development-rate-limit.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

// Interfaces for testing
interface MockRequest {
  body: Record<string, unknown>;
}

interface MockReply {
  status: (code: number) => {
    send: (data: Record<string, unknown>) => Record<string, unknown>;
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const authController = new AuthController(prisma, fastify);

  // Test sandbox credentials
  fastify.get(
    '/test-sandbox',
    {
      schema: {
        description: 'Test LN Markets sandbox credentials',
        tags: ['Testing'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        console.log(
          '🧪 Testing LN Markets sandbox credentials via HTTP endpoint...'
        );

        // Capture console logs
        const logs: string[] = [];
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;

        console.log = (...args) => {
          logs.push(`LOG: ${args.join(' ')}`);
          originalConsoleLog(...args);
        };

        console.error = (...args) => {
          logs.push(`ERROR: ${args.join(' ')}`);
          originalConsoleError(...args);
        };

        // await testSandboxCredentials(); // Removed - service no longer exists

        // Restore console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;

        return reply.status(200).send({
          success: true,
          message: 'Sandbox credentials test completed',
          details: {
            logs,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          message: 'Sandbox credentials test failed',
          details: {
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );

  // Test complete registration with sandbox credentials
  fastify.post(
    '/test-registration',
    {
      schema: {
        description: 'Test complete registration with sandbox credentials',
        tags: ['Testing'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              validation_errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                    value: {
                      oneOf: [
                        { type: 'string' },
                        { type: 'number' },
                        { type: 'boolean' },
                        { type: 'null' },
                      ],
                    },
                  },
                },
              },
            },
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        console.log(
          '🧪 Testing complete registration with sandbox credentials...'
        );

        // Generate unique email for testing
        const testEmail = `test-${Date.now()}@axisor.com`;

        const registrationData = {
          email: testEmail,
          password: 'TestPassword123!',
          coupon_code: 'ALPHATESTER',
        };

        console.log('📋 Test registration data:');
        console.log(`   Email: ${registrationData.email}`);
        console.log(`   API Key: ${'*'.repeat(20)}...`);
        console.log(`   API Secret: ${'*'.repeat(20)}...`);
        console.log(`   Passphrase: ${'*'.repeat(8)}...`);
        console.log(`   Coupon: ${registrationData.coupon_code}`);

        // Call the actual registration handler
        const mockRequest: MockRequest = {
          body: registrationData,
        };

        const mockReply: MockReply = {
          status: (code: number) => ({
            send: (data: Record<string, unknown>) => {
              console.log(`📊 Registration response status: ${code}`);
              console.log(
                '📋 Registration response data:',
                JSON.stringify(data, null, 2)
              );
              return data;
            },
          }),
        } as any;

        // Execute registration
        console.log('🚀 Executing registration...');
        const result = await authController.register(mockRequest as any, mockReply as any);

        console.log('✅ Registration test completed successfully!');
        return reply.status(200).send({
          success: true,
          message: 'Registration test completed successfully',
          details: {
            email: testEmail,
            result,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error: unknown) {
        console.log('❌ Registration test failed!');
        console.log('📊 Error details:', {
          message: error instanceof Error ? (error as Error).message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          response: (error as any)?.response?.data,
        });

        // Handle validation errors
        if (
          error instanceof Error &&
          (error as Error).message &&
          (error as Error).message.includes('Invalid LN Markets API credentials')
        ) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'LN Markets credentials validation failed',
            details: {
              error: (error as Error).message,
              timestamp: new Date().toISOString(),
            },
          });
        }

        return reply.status(500).send({
          success: false,
          message: 'Registration test failed',
          details: {
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  );

  // Register route
  fastify.post(
    '/register',
    {
      preHandler: [validateRegisterInput], // 🚨 STEVE'S FIX: Only custom middleware validation
      // schema: { ... } ← REMOVED: Let custom middleware handle all validation
      schema: {
        description: 'Register a new user',
        tags: ['Authentication'],
        // No body validation - handled by custom middleware
        response: {
          201: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              token: { type: 'string' },
              plan_type: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              validation_errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                    value: {
                      oneOf: [
                        { type: 'string' },
                        { type: 'number' },
                        { type: 'boolean' },
                        { type: 'null' },
                      ],
                    },
                  },
                },
              },
            },
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    authController.register.bind(authController)
  );

  // Login route
  fastify.post(
    '/login',
    {
      preHandler: [dynamicRateLimiters.auth, validateLoginInput],
      schema: {
        description: 'Login user with email or username and password',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['emailOrUsername', 'password'],
          properties: {
            emailOrUsername: { type: 'string', minLength: 1 },
            password: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              token: { type: 'string' },
              plan_type: { type: 'string' },
              is_admin: { type: 'boolean' },
              user_balance: { type: 'object' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              validation_errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                    value: {
                      oneOf: [
                        { type: 'string' },
                        { type: 'number' },
                        { type: 'boolean' },
                        { type: 'null' },
                      ],
                    },
                  },
                },
              },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    authController.login.bind(authController)
  );

  // Check username availability route
  fastify.get(
    '/check-username',
    {
      schema: {
        description: 'Check if username is available',
        tags: ['Authentication'],
        querystring: {
          type: 'object',
          required: ['username'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 20 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              available: { type: 'boolean' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    authController.checkUsername.bind(authController)
  );

  // Check email availability route
  console.log('🔧 Registering check-email endpoint');
  fastify.post(
    '/check-email',
    {
      schema: {
        description: 'Check if email is available',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              available: { type: 'boolean' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email } = request.body as { email: string };
        console.log(`🔍 Checking email availability for: ${email}`);

        // Check if email exists
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        console.log(`📧 Existing user found:`, existingUser ? 'YES' : 'NO');
        console.log(`📧 User data:`, existingUser);

        const available = !existingUser;
        console.log(`✅ Email ${email} is ${available ? 'available' : 'not available'}`);

        return reply.send({ available });
      } catch (error) {
        console.error('Email check error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to check email availability',
        });
      }
    }
  );

  // Refresh token route
  fastify.post(
    '/refresh',
    {
      preHandler: [dynamicRateLimiters.auth],
      schema: {
        description: 'Refresh access token using refresh token',
        tags: ['Authentication'],
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    authController.refreshToken.bind(authController)
  );

  // Logout route
  fastify.post(
    '/logout',
    {
      preHandler: [(fastify as any).authenticate],
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
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    authController.logout.bind(authController)
  );

  // Get current user route
  fastify.get(
    '/me',
    {
      preHandler: [authMiddleware],
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
              plan_type: {
                type: 'string',
                enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'],
              },
              created_at: { type: 'string', format: 'date-time' },
              last_activity_at: { type: 'string', format: 'date-time' },
              exchange_accounts: { 
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    account_name: { type: 'string' },
                    exchange_name: { type: 'string' },
                    is_active: { type: 'boolean' },
                    is_verified: { type: 'boolean' },
                    created_at: { type: 'string', format: 'date-time' }
                  }
                }
              },
              is_admin: { type: 'boolean' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
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
            type: 'object',
            description: 'Redirect to Google OAuth',
          },
          501: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
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
          200: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              token: { type: 'string' },
              plan_type: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          501: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
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
            type: 'object',
            description: 'Redirect to GitHub OAuth',
          },
          501: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
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
          200: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              token: { type: 'string' },
              plan_type: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          501: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    authController.githubCallback.bind(authController)
  );

  // Rate limit info endpoint (for development)
  fastify.get('/rate-limit-info', async (request, reply) => {
    const rateLimitInfo = getRateLimitInfo();
    return reply.send({
      success: true,
      data: rateLimitInfo,
    });
  });

  /**
   * POST /api/auth/verify-email
   * Verifica email usando token enviado por email
   */
  fastify.post('/verify-email', async (request, reply) => {
    try {
      const { token } = request.body as { token: string };
      
      if (!token) {
        return reply.status(400).send({
          success: false,
          message: 'Token is required',
        });
      }

      const result = await authController.authService.verifyEmailToken(token);
      
      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid or expired verification token',
        });
      }

      return {
        success: true,
        message: 'Email verified successfully',
        email: result.email,
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Error verifying email',
      });
    }
  });

  /**
   * GET /api/auth/test-route
   * Rota de teste para verificar se o roteamento está funcionando
   */
  fastify.get('/test-route', async (request, reply) => {
    console.log('🚀 TEST ROUTE - test-route called!');
    return reply.send({ success: true, message: 'Test route working' });
  });

  /**
   * GET /verify-email/:token
   * Link direto de verificação (quando usuário clica no email)
   */
  fastify.get('/verify-email/:token', async (request, reply) => {
    console.log('🚀 AUTH ROUTE - verify-email route called!');
    console.log('🚀 AUTH ROUTE - Request URL:', request.url);
    
    try {
      const { token } = request.params as { token: string };
      
      console.log('🔍 AUTH ROUTE - Token received, length:', token.length);
      
      // 1. Validar token
      const result = await authController.authService.verifyEmailToken(token);
      
      if (!result.success) {
        console.log('❌ AUTH ROUTE - Token validation failed');
        return reply.redirect(`${process.env.FRONTEND_URL}/verify-email?status=error&message=invalid_token`);
      }
      
      // 2. Buscar usuário e marcar como verificado
      const user = await prisma.user.update({
        where: { email: result.email },
        data: {
          email_verified: true,
          account_status: 'active',
          email_verification_token: null // Invalidar token
        }
      });
      
      // 3. Criar entitlement FREE
      await authController.authService.ensureFreeEntitlement(user.id);
      
      // 4. Gerar JWT
      const jwt = await fastify.jwt.sign({
        sub: user.id,
        email: user.email,
        email_verified: true
      });
      
      // 5. Set cookie HttpOnly + Secure
      reply.setCookie('access_token', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 dias
      });
      
      // 6. Redirect para login com mensagem de sucesso
      console.log('✅ AUTH ROUTE - Email verified, redirecting to login');
      return reply.redirect(`${process.env.FRONTEND_URL}/login?verified=true&message=account_created&email=${encodeURIComponent(user.email)}`);
    } catch (error: any) {
      console.error('❌ AUTH ROUTE - Error:', error);
      return reply.redirect(`${process.env.FRONTEND_URL}/verify-email?status=error&message=server_error`);
    }
  });

  /**
   * POST /api/auth/resend-verification
   * Reenvia email de verificação
   */
  fastify.post('/resend-verification', {
    preHandler: [fastify.rateLimit({ max: 3, timeWindow: '1 hour' })],
  }, async (request, reply) => {
    try {
      const { email } = request.body as { email: string };
      
      if (!email) {
        return reply.status(400).send({
          success: false,
          message: 'Email is required',
        });
      }

      const result = await authController.authService.resendVerificationEmail(email);
      
      if (!result.success) {
        return reply.status(400).send(result);
      }

      // Se sucesso, enviar email
      if (result.success) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && user.email_verification_token) {
          const { EmailService } = await import('../services/email.service');
          const emailService = new EmailService();
          await emailService.sendVerificationEmail(email, user.email_verification_token);
        }
      }

      return result;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Error resending verification email',
      });
    }
  });

  /**
   * POST /api/auth/verification-status
   * Verifica status de verificação de email (público)
   */
  fastify.post('/verification-status', {
    schema: {
      description: 'Check email verification status',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            email_verified: { type: 'boolean' },
            account_status: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email } = request.body as { email: string };
      
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { 
          email_verified: true, 
          account_status: true 
        }
      });
      
      if (!user) {
        return reply.send({ 
          email_verified: false, 
          account_status: 'not_found' 
        });
      }
      
      return reply.send({
        email_verified: user.email_verified,
        account_status: user.account_status
      });
    } catch (error: any) {
      fastify.log.error('Verification status error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to check verification status'
      });
    }
  });

  /**
   * POST /api/auth/change-email
   * Altera o email do usuário durante o processo de verificação
   */
  fastify.post('/change-email', {
    preHandler: [fastify.rateLimit({ max: 3, timeWindow: '1 hour' })],
    schema: {
      description: 'Change user email during verification process',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['currentEmail', 'newEmail'],
        properties: {
          currentEmail: { type: 'string', format: 'email' },
          newEmail: { type: 'string', format: 'email' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { currentEmail, newEmail } = request.body as { currentEmail: string; newEmail: string };
      
      console.log('📧 CHANGE EMAIL - Request received');
      console.log('📧 CHANGE EMAIL - Current email:', currentEmail);
      console.log('📧 CHANGE EMAIL - New email:', newEmail);
      
      // Validar se o email atual existe
      const currentUser = await prisma.user.findUnique({
        where: { email: currentEmail.toLowerCase() },
        select: { id: true, email_verified: true, account_status: true }
      });
      
      if (!currentUser) {
        console.log('❌ CHANGE EMAIL - Current user not found');
        return reply.status(400).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Current email not found'
        });
      }
      
      // Verificar se o novo email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail.toLowerCase() }
      });
      
      if (existingUser) {
        console.log('❌ CHANGE EMAIL - New email already exists');
        return reply.status(409).send({
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: 'This email is already registered'
        });
      }
      
      // Atualizar o email do usuário
      const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          email: newEmail.toLowerCase(),
          email_verified: false, // Reset verification status
          account_status: 'pending_verification', // Reset account status
          email_verification_token: null, // Clear old tokens
          email_verification_expires: null,
          password_reset_token: null, // Clear OTP tokens
          password_reset_expires: null
        }
      });
      
      console.log('✅ CHANGE EMAIL - Email updated successfully');
      console.log('✅ CHANGE EMAIL - User ID:', updatedUser.id);
      
      // Gerar novos tokens de verificação
      const { AuthService } = await import('../services/auth.service');
      const authService = new AuthService(prisma, fastify);
      
      // Gerar novo token de verificação (Magic Link)
      const verificationToken = await authService.generateVerificationToken(updatedUser.id);
      
      // Gerar novo OTP
      const otp = await authService.generateOTP(updatedUser.id);
      
      // Enviar email de verificação para o novo endereço
      const { EmailService } = await import('../services/email.service');
      const emailService = new EmailService();
      await emailService.sendVerificationEmail(newEmail, verificationToken, otp);
      
      console.log('📧 CHANGE EMAIL - Verification email sent to new address');
      
      return reply.send({
        success: true,
        message: 'Email changed successfully. Please check your new email for verification.'
      });
      
    } catch (error: any) {
      console.error('❌ CHANGE EMAIL - Error:', error);
      fastify.log.error('Change email error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error changing email'
      });
    }
  });

  /**
   * POST /api/auth/verify-email/otp
   * Valida OTP de verificação de email
   */
  fastify.post('/verify-email/otp', {
    preHandler: [fastify.rateLimit({ max: 5, timeWindow: '15 minutes' })],
    schema: {
      description: 'Verify email with OTP code',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string', minLength: 6, maxLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            jwt: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      console.log('🔍 OTP ROUTE - Request received:', {
        method: request.method,
        url: request.url,
        body: request.body,
        timestamp: new Date().toISOString()
      });
      
      const { email, code } = request.body as { email: string; code: string };
      
      console.log('🔍 OTP ROUTE - Extracted data:', {
        email,
        code,
        codeLength: code?.length,
        timestamp: new Date().toISOString()
      });
      
      const result = await authController.authService.validateOTP(email, code);
      
      if (!result.success) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_CODE'
        });
      }
      
      return reply.send({
        success: true,
        jwt: result.jwt
      });
    } catch (error: any) {
      fastify.log.error('OTP verification error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/email/test-send
   * Endpoint para testar envio de email (desenvolvimento)
   */
  fastify.post('/api/email/test-send', {
    schema: {
      description: 'Test email sending functionality',
      tags: ['Testing'],
      body: {
        type: 'object',
        required: ['to'],
        properties: {
          to: { type: 'string', format: 'email' },
          subject: { type: 'string' },
          message: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            messageId: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { to, subject = '🧪 Test Email - Axisor', message = 'This is a test email' } = request.body as any;
      
      const { EmailService } = await import('../services/email.service');
      const emailService = new EmailService();
      
      // Enviar email de teste
      await emailService.sendTestEmail(to, subject, message);
      
      return reply.send({
        success: true,
        message: 'Test email sent successfully',
        messageId: 'test-' + Date.now()
      });
    } catch (error: any) {
      fastify.log.error('Email test error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
}
