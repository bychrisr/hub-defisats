import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { PrismaClient } from '@prisma/client';
import { testSandboxCredentials } from '../services/lnmarkets.service';
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

        await testSandboxCredentials();

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
          ln_markets_api_key: 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
          ln_markets_api_secret:
            'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
          ln_markets_passphrase: 'a6c1bh56jc33',
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
              ln_markets_api_key: { type: 'string' },
              ln_markets_api_secret: { type: 'string' },
              ln_markets_passphrase: { type: 'string' },
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
}
