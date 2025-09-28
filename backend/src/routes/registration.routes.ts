import { FastifyInstance } from 'fastify';
import { RegistrationService } from '../services/registration.service';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const registrationService = new RegistrationService(prisma);

// Schemas for validation
const PersonalDataSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  couponCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const PlanSelectionSchema = z.object({
  planId: z.enum(['free', 'basic', 'advanced', 'pro', 'lifetime']),
  billingPeriod: z.enum(['monthly', 'quarterly', 'yearly']),
  sessionToken: z.string().optional(),
});

const PaymentDataSchema = z.object({
  paymentMethod: z.enum(['lightning', 'lnmarkets']),
  lightningAddress: z.string().optional(),
  sessionToken: z.string().optional(),
});

const CredentialsDataSchema = z.object({
  lnMarketsApiKey: z.string().min(1, 'API Key is required'),
  lnMarketsApiSecret: z.string().min(1, 'API Secret is required'),
  lnMarketsPassphrase: z.string().min(1, 'Passphrase is required'),
  sessionToken: z.string().optional(),
});

export async function registrationRoutes(fastify: FastifyInstance) {
  // Step 1: Save personal data
  fastify.post(
    '/personal-data',
    {
      schema: {
        description: 'Save personal data (Step 1 of registration)',
        tags: ['Registration'],
        body: {
          type: 'object',
          required: ['firstName', 'lastName', 'username', 'email', 'password', 'confirmPassword'],
          properties: {
            firstName: { type: 'string', minLength: 1 },
            lastName: { type: 'string', minLength: 1 },
            username: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            confirmPassword: { type: 'string', minLength: 8 },
            couponCode: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              userId: { type: 'string' },
              sessionToken: { type: 'string' },
              nextStep: { type: 'string' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = PersonalDataSchema.parse(request.body);
        const ipAddress = request.ip;

        console.log('📝 REGISTRATION - Personal data request received for:', body.email);

        const result = await registrationService.savePersonalData(body, ipAddress);

        console.log('✅ REGISTRATION - Personal data saved successfully');

        return reply.status(201).send(result);
      } catch (error) {
        console.error('❌ REGISTRATION - Personal data error:', error);

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            message: 'Validation failed',
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to save personal data',
        });
      }
    }
  );

  // Step 2: Select plan
  fastify.post(
    '/select-plan',
    {
      schema: {
        description: 'Select plan (Step 2 of registration)',
        tags: ['Registration'],
        body: {
          type: 'object',
          required: ['planId', 'billingPeriod'],
          properties: {
            planId: { type: 'string', enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'] },
            billingPeriod: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'] },
            sessionToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              nextStep: { type: 'string' },
              couponData: { type: 'object' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = PlanSelectionSchema.parse(request.body);
        const userId = (request as any).user?.id;

        console.log('📋 REGISTRATION - Plan selection request received:', body.planId);

        const result = await registrationService.selectPlan(body, userId, body.sessionToken);

        console.log('✅ REGISTRATION - Plan selected successfully');

        return reply.send(result);
      } catch (error) {
        console.error('❌ REGISTRATION - Plan selection error:', error);

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            message: 'Validation failed',
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to select plan',
        });
      }
    }
  );

  // Step 3: Process payment
  fastify.post(
    '/payment',
    {
      schema: {
        description: 'Process payment (Step 3 of registration)',
        tags: ['Registration'],
        body: {
          type: 'object',
          required: ['paymentMethod'],
          properties: {
            paymentMethod: { type: 'string', enum: ['lightning', 'lnmarkets'] },
            lightningAddress: { type: 'string' },
            sessionToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              nextStep: { type: 'string' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = PaymentDataSchema.parse(request.body);
        const userId = (request as any).user?.id;

        console.log('💳 REGISTRATION - Payment request received:', body.paymentMethod);

        const result = await registrationService.processPayment(body, userId, body.sessionToken);

        console.log('✅ REGISTRATION - Payment processed successfully');

        return reply.send(result);
      } catch (error) {
        console.error('❌ REGISTRATION - Payment error:', error);

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            message: 'Validation failed',
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to process payment',
        });
      }
    }
  );

  // Step 4: Save credentials
  fastify.post(
    '/credentials',
    {
      schema: {
        description: 'Save LN Markets credentials (Step 4 of registration)',
        tags: ['Registration'],
        body: {
          type: 'object',
          required: ['lnMarketsApiKey', 'lnMarketsApiSecret', 'lnMarketsPassphrase'],
          properties: {
            lnMarketsApiKey: { type: 'string', minLength: 1 },
            lnMarketsApiSecret: { type: 'string', minLength: 1 },
            lnMarketsPassphrase: { type: 'string', minLength: 1 },
            sessionToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = CredentialsDataSchema.parse(request.body);
        const userId = (request as any).user?.id;

        console.log('🔐 REGISTRATION - Credentials request received');

        const result = await registrationService.saveCredentials(body, userId, body.sessionToken);

        console.log('✅ REGISTRATION - Credentials saved, registration completed');

        return reply.send(result);
      } catch (error) {
        console.error('❌ REGISTRATION - Credentials error:', error);

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            message: 'Validation failed',
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to save credentials',
        });
      }
    }
  );

  // Get registration progress
  fastify.get(
    '/progress',
    {
      schema: {
        description: 'Get current registration progress',
        tags: ['Registration'],
        querystring: {
          type: 'object',
          properties: {
            sessionToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              progress: {
                type: 'object',
                properties: {
                  currentStep: { type: 'string' },
                  completedSteps: { type: 'array', items: { type: 'string' } },
                  personalData: { type: 'object' },
                  selectedPlan: { type: 'string' },
                  paymentData: { type: 'object' },
                  credentialsData: { type: 'object' },
                  couponCode: { type: 'string' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query as { sessionToken?: string };
        const userId = (request as any).user?.id;

        console.log('📊 REGISTRATION - Progress request received');

        const progress = await registrationService.getRegistrationProgress(userId, query.sessionToken);

        if (!progress) {
          return reply.status(404).send({
            success: false,
            message: 'Registration progress not found',
          });
        }

        console.log('✅ REGISTRATION - Progress retrieved successfully');

        return reply.send({
          success: true,
          progress,
        });
      } catch (error) {
        console.error('❌ REGISTRATION - Progress error:', error);

        return reply.status(500).send({
          success: false,
          message: 'Failed to get registration progress',
        });
      }
    }
  );

  // Cleanup expired progress (admin endpoint)
  fastify.post(
    '/cleanup',
    {
      schema: {
        description: 'Clean up expired registration progress (admin only)',
        tags: ['Admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              cleanedCount: { type: 'number' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // TODO: Add admin authentication middleware
        console.log('🧹 REGISTRATION - Cleanup request received');

        const cleanedCount = await registrationService.cleanupExpiredProgress();

        console.log('✅ REGISTRATION - Cleanup completed:', cleanedCount);

        return reply.send({
          success: true,
          cleanedCount,
          message: `Cleaned up ${cleanedCount} expired registration records`,
        });
      } catch (error) {
        console.error('❌ REGISTRATION - Cleanup error:', error);

        return reply.status(500).send({
          success: false,
          message: 'Failed to cleanup expired progress',
        });
      }
    }
  );
}
