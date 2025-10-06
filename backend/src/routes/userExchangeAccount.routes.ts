import { FastifyInstance } from 'fastify';
import { UserExchangeAccountController } from '../controllers/userExchangeAccount.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function userExchangeAccountRoutes(fastify: FastifyInstance) {
  const userExchangeAccountController = new UserExchangeAccountController();

  // GET /api/user/exchange-accounts - Listar contas de exchange do usuário
  fastify.get('/user/exchange-accounts', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return userExchangeAccountController.getUserExchangeAccounts(request, reply);
  });

  // GET /api/user/exchange-accounts/:id - Obter conta específica
  fastify.get('/user/exchange-accounts/:id', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return userExchangeAccountController.getUserExchangeAccount(request, reply);
  });

  // POST /api/user/exchange-accounts - Criar nova conta de exchange
  fastify.post('/user/exchange-accounts', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return userExchangeAccountController.createUserExchangeAccount(request, reply);
  });

  // PUT /api/user/exchange-accounts/:id - Atualizar conta de exchange
  fastify.put('/user/exchange-accounts/:id', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return userExchangeAccountController.updateUserExchangeAccount(request, reply);
  });

  // DELETE /api/user/exchange-accounts/:id - Deletar conta de exchange
  fastify.delete('/user/exchange-accounts/:id', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return userExchangeAccountController.deleteUserExchangeAccount(request, reply);
  });

  // POST /api/user/exchange-accounts/:id/set-active - Definir conta ativa
  fastify.post('/user/exchange-accounts/:id/set-active', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return userExchangeAccountController.setActiveAccount(request, reply);
  });

  // POST /api/user/exchange-accounts/:id/test - Testar credenciais da conta
  fastify.post('/user/exchange-accounts/:id/test', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return userExchangeAccountController.testAccountCredentials(request, reply);
  });
}
