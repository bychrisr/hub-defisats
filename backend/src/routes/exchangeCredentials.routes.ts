import { FastifyInstance } from 'fastify';
import { ExchangeCredentialsController } from '../controllers/exchangeCredentials.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function exchangeCredentialsRoutes(fastify: FastifyInstance) {
  const exchangeCredentialsController = new ExchangeCredentialsController();

  // GET /api/exchanges - Listar todas as exchanges disponíveis
  fastify.get('/exchanges', async (request, reply) => {
    return exchangeCredentialsController.getExchanges(request, reply);
  });

  // GET /api/user/exchange-credentials - Buscar credenciais do usuário
  fastify.get('/user/exchange-credentials', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return exchangeCredentialsController.getUserCredentials(request, reply);
  });

  // GET /api/user/exchange-credentials/:exchangeId - Buscar credenciais para uma exchange específica
  fastify.get('/user/exchange-credentials/:exchangeId', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return exchangeCredentialsController.getUserCredentialsForExchange(request, reply);
  });

  // PUT /api/user/exchange-credentials - Atualizar credenciais do usuário
  fastify.put('/user/exchange-credentials', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return exchangeCredentialsController.updateUserCredentials(request, reply);
  });

  // POST /api/user/exchange-credentials/:exchangeId/test - Testar credenciais
  fastify.post('/user/exchange-credentials/:exchangeId/test', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return exchangeCredentialsController.testCredentials(request, reply);
  });

  // DELETE /api/user/exchange-credentials/:exchangeId - Deletar credenciais
  fastify.delete('/user/exchange-credentials/:exchangeId', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return exchangeCredentialsController.deleteCredentials(request, reply);
  });
}
