import { FastifyInstance } from 'fastify';
import { getVersion } from '../controllers/version.controller';

export async function versionRoutes(fastify: FastifyInstance) {
  // Endpoint público para verificar versão da aplicação
  fastify.get('/version', {
    schema: {
      description: 'Get application version information',
      tags: ['system'],
      response: {
        200: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            buildTime: { type: 'string' },
            environment: { type: 'string' },
            features: { 
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  }, getVersion);
}
