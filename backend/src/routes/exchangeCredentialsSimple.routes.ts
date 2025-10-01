import { FastifyInstance } from 'fastify';
import { ExchangeCredentialsSimpleController } from '../controllers/exchangeCredentialsSimple.controller';

export async function exchangeCredentialsSimpleRoutes(fastify: FastifyInstance) {
  const exchangeCredentialsController = new ExchangeCredentialsSimpleController();

  // GET /api/exchanges - Listar todas as exchanges disponíveis
  fastify.get('/exchanges', async (request, reply) => {
    return exchangeCredentialsController.getExchanges(request, reply);
  });
}

