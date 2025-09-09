import { FastifyInstance } from 'fastify';
import { AuthController } from '@/controllers/auth.controller';
import { PrismaClient } from '@prisma/client';
import { testSandboxCredentials } from '@/services/lnmarkets.service';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  AuthResponseSchema,
  RefreshTokenResponseSchema,
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '@/schemas/auth.schemas';

export async function authRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const authController = new AuthController(prisma, fastify);

  // Test sandbox credentials
  fastify.get('/test-sandbox', {
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
      },
    },
  }, async (request, reply) => {
    try {
      console.log('🧪 Testing LN Markets sandbox credentials via HTTP endpoint...');

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
  });

  // Test complete registration with sandbox credentials
  fastify.post('/test-registration', {
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
                      { type: 'null' }
                    ]
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      console.log('🧪 Testing complete registration with sandbox credentials...');

      // Generate unique email for testing
      const testEmail = `test-${Date.now()}@hubdefisats.com`;

      const registrationData = {
        email: testEmail,
        password: 'TestPassword123!',
        ln_markets_api_key: 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
        ln_markets_api_secret: 'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
        ln_markets_passphrase: 'a6c1bh56jc33',
        coupon_code: 'ALPHATESTER'
      };

      console.log('📋 Test registration data:');
      console.log(`   Email: ${registrationData.email}`);
      console.log(`   API Key: ${registrationData.ln_markets_api_key.substring(0, 20)}...`);
      console.log(`   API Secret: ${registrationData.ln_markets_api_secret.substring(0, 20)}...`);
      console.log(`   Passphrase: ${registrationData.ln_markets_passphrase}`);
      console.log(`   Coupon: ${registrationData.coupon_code}`);

      // Call the actual registration handler
      const mockRequest = {
        body: registrationData
      } as any;

      const mockReply = {
        status: (code: number) => ({
          send: (data: any) => {
            console.log(`📊 Registration response status: ${code}`);
            console.log('📋 Registration response data:', JSON.stringify(data, null, 2));
            return data;
          }
        })
      } as any;

      // Execute registration
      console.log('🚀 Executing registration...');
      const result = await authController.register(mockRequest, mockReply);

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

    } catch (error: any) {
      console.log('❌ Registration test failed!');
      console.log('📊 Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });

      // Handle validation errors
      if (error.message && error.message.includes('Invalid LN Markets API credentials')) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'LN Markets credentials validation failed',
          details: {
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Registration test failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  // Register route
  fastify.post(
    '/register',
    {
      schema: {
        description: 'Register a new user',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'username', 'password', 'ln_markets_api_key', 'ln_markets_api_secret', 'ln_markets_passphrase'],
          properties: {
            email: { type: 'string', format: 'email' },
            username: { type: 'string', minLength: 3, maxLength: 20 },
            password: { type: 'string', minLength: 8 },
            ln_markets_api_key: { type: 'string', minLength: 16 },
            ln_markets_api_secret: { type: 'string', minLength: 16 },
            ln_markets_passphrase: { type: 'string', minLength: 8 },
            coupon_code: { type: 'string' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              token: { type: 'string' },
              plan_type: { type: 'string' }
            }
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
                        { type: 'null' }
                      ]
                    }
                  }
                }
              }
            }
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
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
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              token: { type: 'string' },
              plan_type: { type: 'string' }
            }
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
                        { type: 'null' }
                      ]
                    }
                  }
                }
              }
            }
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
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
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
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
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
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
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
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
            description: 'Redirect to Google OAuth'
          },
          501: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
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
              plan_type: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          501: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
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
            description: 'Redirect to GitHub OAuth'
          },
          501: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
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
              plan_type: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          501: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
        },
      },
    },
    authController.githubCallback.bind(authController)
  );
}
