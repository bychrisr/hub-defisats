import { FastifyInstance } from 'fastify';
import { ExchangeService } from '../services/exchange.service';

export async function registrationExchangesRoutes(fastify: FastifyInstance) {
  const exchangeService = new ExchangeService(fastify.prisma);

  // Get available exchanges for registration (public)
  fastify.get('/api/registration/exchanges', {
    schema: {
      tags: ['Registration'],
      summary: 'Get available exchanges for registration',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  website: { type: 'string' },
                  logo_url: { type: 'string' },
                  is_active: { type: 'boolean' },
                  api_version: { type: 'string' },
                  credential_types: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        field_name: { type: 'string' },
                        field_type: { type: 'string' },
                        is_required: { type: 'boolean' },
                        description: { type: 'string' },
                        order: { type: 'number' },
                      },
                    },
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
      const exchanges = await exchangeService.getAvailableExchanges();
      
      return reply.send({
        success: true,
        data: exchanges,
      });
    } catch (error: any) {
      fastify.log.error('Error fetching exchanges:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch exchanges',
      });
    }
  });
}

