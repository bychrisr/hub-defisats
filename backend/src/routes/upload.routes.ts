import { FastifyInstance } from 'fastify';
import { UploadController } from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function uploadRoutes(fastify: FastifyInstance) {
  // Middleware de autenticação para todas as rotas
  fastify.addHook('preHandler', authMiddleware);

  // Upload de avatar
  fastify.post('/api/upload/avatar', {
    handler: UploadController.uploadAvatar
  });

  // Obter avatar
  fastify.get('/api/upload/avatar/:filename', {
    handler: UploadController.getAvatar,
    schema: {
      description: 'Obter avatar por filename',
      tags: ['upload'],
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string' }
        },
        required: ['filename']
      },
      response: {
        200: {
          type: 'string',
          format: 'binary'
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  });

  // Deletar avatar
  fastify.delete('/api/upload/avatar/:filename', {
    handler: UploadController.deleteAvatar,
    schema: {
      description: 'Deletar avatar do usuário',
      tags: ['upload'],
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string' }
        },
        required: ['filename']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  });
}
