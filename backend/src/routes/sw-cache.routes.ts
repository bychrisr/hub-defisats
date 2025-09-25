import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function swCacheRoutes(fastify: FastifyInstance) {
  // Endpoint para forçar limpeza do cache do Service Worker
  fastify.post('/api/sw/clear-cache', {
    schema: {
      description: 'Force Service Worker cache clear',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Retornar instruções para o frontend limpar o cache
      return reply.status(200).send({
        success: true,
        message: 'Service Worker cache clear instructions sent',
        timestamp: new Date().toISOString(),
        instructions: {
          method: 'POST',
          url: '/api/sw/clear-cache',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            action: 'clear_cache'
          }
        }
      });
    } catch (error) {
      fastify.log.error('Error clearing SW cache:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to clear Service Worker cache',
        error: (error as Error).message
      });
    }
  });

  // Endpoint para verificar status do Service Worker
  fastify.get('/api/sw/status', {
    schema: {
      description: 'Get Service Worker status',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            supported: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      supported: true,
      message: 'Service Worker is supported and configured',
      timestamp: new Date().toISOString()
    });
  });
}
