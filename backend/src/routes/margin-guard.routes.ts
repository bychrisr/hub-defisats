import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MarginGuardController } from '../controllers/margin-guard.controller';

export async function marginGuardRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const marginGuardController = new MarginGuardController(prisma);

  // Middleware de autenticação para todas as rotas
  await fastify.register(async function(fastify) {
    fastify.addHook('preHandler', fastify.authenticate);

    /**
     * @route POST /api/user/margin-guard
     * @desc Criar ou atualizar configuração do Margin Guard
     * @access Private
     */
    fastify.post('/', marginGuardController.createOrUpdateConfig.bind(marginGuardController));

    /**
     * @route GET /api/user/margin-guard
     * @desc Buscar configuração atual do Margin Guard
     * @access Private
     */
    fastify.get('/', marginGuardController.getConfig.bind(marginGuardController));

    /**
     * @route GET /api/user/margin-guard/plan-features
     * @desc Buscar features do plano atual
     * @access Private
     */
    fastify.get('/plan-features', marginGuardController.getPlanFeatures.bind(marginGuardController));

    /**
     * @route GET /api/user/margin-guard/positions
     * @desc Buscar posições running do usuário
     * @access Private
     */
    fastify.get('/positions', marginGuardController.getRunningPositions.bind(marginGuardController));

    /**
     * @route POST /api/user/margin-guard/preview
     * @desc Preview de cálculo do Margin Guard
     * @access Private
     */
    fastify.post('/preview', marginGuardController.previewCalculation.bind(marginGuardController));

    /**
     * @route GET /api/user/margin-guard/executions
     * @desc Buscar execuções do Margin Guard
     * @access Private
     */
    fastify.get('/executions', marginGuardController.getExecutions.bind(marginGuardController));

    /**
     * @route GET /api/user/margin-guard/executions/:id
     * @desc Buscar detalhes de uma execução específica
     * @access Private
     */
    fastify.get('/executions/:id', async (request, reply) => {
      // TODO: Implementar endpoint de detalhes de execução
      reply.status(501).send({ error: 'Endpoint em desenvolvimento' });
    });

    /**
     * @route GET /api/user/margin-guard/statistics
     * @desc Buscar estatísticas do Margin Guard
     * @access Private
     */
    fastify.get('/statistics', marginGuardController.getStatistics.bind(marginGuardController));

    /**
     * @route GET /api/user/margin-guard/monitored
     * @desc Buscar posições sendo monitoradas
     * @access Private
     */
    fastify.get('/monitored', marginGuardController.getMonitoredPositions.bind(marginGuardController));

    /**
     * @route GET /api/user/margin-guard/available-upgrades
     * @desc Buscar planos de upgrade disponíveis
     * @access Private
     */
    fastify.get('/available-upgrades', marginGuardController.getAvailableUpgrades.bind(marginGuardController));

    /**
     * @route POST /api/user/margin-guard/test-notification
     * @desc Enviar notificação de teste do Margin Guard
     * @access Private
     */
    fastify.post('/test-notification', marginGuardController.testNotification.bind(marginGuardController));
  });
}
