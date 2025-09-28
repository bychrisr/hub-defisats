import { FastifyInstance } from 'fastify';
import { PasswordResetService } from '../services/password-reset.service';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const passwordResetService = new PasswordResetService(prisma);

// Schemas for validation
const RequestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const ValidateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function passwordResetRoutes(fastify: FastifyInstance) {
  // Request password reset
  fastify.post(
    '/request-reset',
    {
      schema: {
        description: 'Request password reset email',
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
              success: { type: 'boolean' },
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
        const body = RequestPasswordResetSchema.parse(request.body);
        const ipAddress = request.ip;

        console.log('🔐 PASSWORD RESET - Request received for email:', body.email);

        const result = await passwordResetService.requestPasswordReset(
          body.email,
          ipAddress
        );

        console.log('✅ PASSWORD RESET - Request processed:', result.success);

        return reply.send(result);
      } catch (error) {
        console.error('❌ PASSWORD RESET - Request error:', error);

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

        return reply.status(500).send({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  );

  // Validate reset token
  fastify.post(
    '/validate-token',
    {
      schema: {
        description: 'Validate password reset token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              email: { type: 'string' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = ValidateTokenSchema.parse(request.body);

        console.log('🔐 PASSWORD RESET - Token validation requested');

        const result = await passwordResetService.validateResetToken(body.token);

        console.log('✅ PASSWORD RESET - Token validation result:', result.valid);

        return reply.send(result);
      } catch (error) {
        console.error('❌ PASSWORD RESET - Token validation error:', error);

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            valid: false,
            message: 'Invalid token format',
          });
        }

        return reply.status(500).send({
          valid: false,
          message: 'Internal server error',
        });
      }
    }
  );

  // Reset password
  fastify.post(
    '/reset',
    {
      schema: {
        description: 'Reset password with token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
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
        const body = ResetPasswordSchema.parse(request.body);
        const ipAddress = request.ip;

        console.log('🔐 PASSWORD RESET - Password reset requested');

        const result = await passwordResetService.resetPassword(
          body.token,
          body.newPassword,
          ipAddress
        );

        console.log('✅ PASSWORD RESET - Password reset result:', result.success);

        return reply.send(result);
      } catch (error) {
        console.error('❌ PASSWORD RESET - Password reset error:', error);

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

        return reply.status(500).send({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  );

  // Get password reset logs (admin only)
  fastify.get(
    '/logs',
    {
      schema: {
        description: 'Get password reset logs (admin only)',
        tags: ['Admin'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 100 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              logs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    ipAddress: { type: 'string' },
                    success: { type: 'boolean' },
                    reason: { type: 'string' },
                    timestamp: { type: 'string' },
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
        // TODO: Add admin authentication middleware
        const query = request.query as { limit?: number };
        const limit = query.limit || 100;

        console.log('🔐 PASSWORD RESET - Logs requested, limit:', limit);

        const logs = await passwordResetService.getPasswordResetLogs(limit);

        console.log('✅ PASSWORD RESET - Logs retrieved:', logs.length);

        return reply.send({
          success: true,
          logs,
        });
      } catch (error) {
        console.error('❌ PASSWORD RESET - Logs error:', error);

        return reply.status(500).send({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  );
}
