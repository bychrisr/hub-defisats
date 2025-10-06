import { FastifyInstance } from 'fastify';
import { PlanLimitsController } from '../controllers/planLimits.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminAuthMiddleware } from '../middleware/admin.middleware';

export async function planLimitsRoutes(fastify: FastifyInstance) {
  const planLimitsController = new PlanLimitsController();

  // GET /api/plan-limits/:planType - Get plan limits by plan type (public)
  fastify.get('/api/plan-limits/:planType', {
    handler: planLimitsController.getPlanLimitsByType.bind(planLimitsController)
  });

  // GET /api/plan-limits - Get all plan limits (authenticated)
  fastify.get('/api/plan-limits', {
    preHandler: [authMiddleware],
    handler: planLimitsController.getAllPlanLimits.bind(planLimitsController)
  });

  // PUT /api/plan-limits/:planId - Update plan limits (admin only)
  fastify.put('/api/plan-limits/:planId', {
    preHandler: [adminAuthMiddleware],
    handler: planLimitsController.updatePlanLimits.bind(planLimitsController)
  });
}
