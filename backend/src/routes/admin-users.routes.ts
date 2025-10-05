import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AdminUsersController } from '../controllers/admin-users.controller';
import { adminAuthMiddleware } from '../middleware/auth.middleware';

export async function adminUsersRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const adminUsersController = new AdminUsersController(prisma);

  // Get all users with pagination and filtering
  fastify.get('/api/admin/users', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Get all users with pagination and filtering',
      tags: ['Admin - Users'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '20' },
          search: { type: 'string', default: '' },
          plan_type: { 
            type: 'string', 
            enum: ['all', 'free', 'basic', 'advanced', 'pro', 'lifetime'],
            default: 'all' 
          },
          is_active: { 
            type: 'string', 
            enum: ['all', 'true', 'false'],
            default: 'all' 
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                users: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      username: { type: 'string' },
                      plan_type: { type: 'string' },
                      is_active: { type: 'boolean' },
                      created_at: { type: 'string' },
                      last_activity_at: { type: 'string' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    total: { type: 'number' },
                    pages: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, adminUsersController.getUsers.bind(adminUsersController));

  // Toggle user active status
  fastify.patch('/api/admin/users/:userId/toggle', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Toggle user active status',
      tags: ['Admin - Users'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                is_active: { type: 'boolean' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, adminUsersController.toggleUserStatus.bind(adminUsersController));

  // Delete user
  fastify.delete('/api/admin/users/:userId', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Delete user',
      tags: ['Admin - Users'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, adminUsersController.deleteUser.bind(adminUsersController));
}
