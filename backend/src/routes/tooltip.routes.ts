import { FastifyInstance } from 'fastify';
import { TooltipController } from '../controllers/tooltip.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function tooltipRoutes(fastify: FastifyInstance) {
  // Tooltip Config routes
  fastify.post('/tooltips', {
    preHandler: [authMiddleware],
    handler: TooltipController.createTooltipConfig,
  });

  fastify.get('/tooltips/:cardKey', {
    preHandler: [authMiddleware],
    handler: TooltipController.getTooltipConfig,
  });

  fastify.get('/tooltips', {
    preHandler: [authMiddleware],
    handler: TooltipController.getAllTooltipConfigs,
  });

  fastify.put('/tooltips/:cardKey', {
    preHandler: [authMiddleware],
    handler: TooltipController.updateTooltipConfig,
  });

  fastify.delete('/tooltips/:cardKey', {
    preHandler: [authMiddleware],
    handler: TooltipController.deleteTooltipConfig,
  });

  // Dashboard Card routes
  fastify.post('/dashboard-cards', {
    preHandler: [authMiddleware],
    handler: TooltipController.createDashboardCard,
  });

  fastify.get('/dashboard-cards/:key', {
    preHandler: [authMiddleware],
    handler: TooltipController.getDashboardCard,
  });

  fastify.get('/dashboard-cards', {
    preHandler: [authMiddleware],
    handler: TooltipController.getAllDashboardCards,
  });

  fastify.put('/dashboard-cards/:key', {
    preHandler: [authMiddleware],
    handler: TooltipController.updateDashboardCard,
  });

  fastify.delete('/dashboard-cards/:key', {
    preHandler: [authMiddleware],
    handler: TooltipController.deleteDashboardCard,
  });

  fastify.put('/dashboard-cards/reorder', {
    preHandler: [authMiddleware],
    handler: TooltipController.reorderDashboardCards,
  });

  // Combined routes - Public route for users to get cards with tooltips
  fastify.get('/cards-with-tooltips', TooltipController.getCardsWithTooltips);

  // Initialize defaults
  fastify.post('/initialize-defaults', {
    preHandler: [authMiddleware],
    handler: TooltipController.initializeDefaults,
  });
}
