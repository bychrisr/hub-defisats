import { FastifyInstance } from 'fastify';

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get('/settings', async (request, reply) => {
    return {
      success: true,
      data: {
        lnMarkets: {
          apiKey: 'test',
          apiSecret: 'test',
          passphrase: 'test',
          testnet: false
        }
      }
    };
  });

  fastify.put('/lnmarkets', async (request, reply) => {
    return {
      success: true,
      message: 'Settings updated'
    };
  });
}