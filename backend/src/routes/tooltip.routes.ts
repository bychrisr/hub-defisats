import { FastifyInstance } from 'fastify';
import { TooltipController } from '../controllers/tooltip.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

export async function tooltipRoutes(fastify: FastifyInstance) {
  // Tooltip Config routes
  fastify.post('/tooltips', {
    preHandler: [authenticateToken, requireAdmin],
    handler: TooltipController.createTooltipConfig,
  });

  fastify.get('/tooltips/:cardKey', {
    preHandler: [authenticateToken],
    handler: TooltipController.getTooltipConfig,
  });

  fastify.get('/tooltips', {
    preHandler: [authenticateToken, requireAdmin],
    handler: TooltipController.getAllTooltipConfigs,
  });

  fastify.put('/tooltips/:cardKey', {
    preHandler: [authenticateToken, requireAdmin],
    handler: TooltipController.updateTooltipConfig,
  });

  fastify.delete('/tooltips/:cardKey', {
    preHandler: [authenticateToken, requireAdmin],
    handler: TooltipController.deleteTooltipConfig,
  });

  // Dashboard Card routes
  fastify.post('/dashboard-cards', {
    preHandler: [authenticateToken, requireAdmin],
    handler: TooltipController.createDashboardCard,
  });

  fastify.get('/dashboard-cards/:key', {
    preHandler: [authenticateToken],
    handler: TooltipController.getDashboardCard,
  });

  fastify.get('/dashboard-cards', {
    preHandler: [authenticateToken],
    handler: TooltipController.getAllDashboardCards,
  });

  fastify.put('/dashboard-cards/:key', {
    preHandler: [authenticateToken, requireAdmin],
    handler: TooltipController.updateDashboardCard,
  });

  fastify.delete('/dashboard-cards/:key', {
    preHandler: [authenticateToken, requireAdmin],
    handler: TooltipController.deleteDashboardCard,
  });

  fastify.put('/dashboard-cards/reorder', {
    preHandler: [authenticateToken, requireAdmin],
    handler: TooltipController.reorderDashboardCards,
  });

  // Combined routes
  fastify.get('/cards-with-tooltips', {
    preHandler: [authenticateToken],
    handler: TooltipController.getCardsWithTooltips,
  });

  // Initialize defaults
  fastify.post('/initialize-defaults', {
    preHandler: [authenticateToken, requireAdmin],
    handler: TooltipController.initializeDefaults,
  });
}
