import { FastifyInstance } from 'fastify';
import { PlanLimitsController } from '../controllers/planLimits.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

export async function planLimitsRoutes(fastify: FastifyInstance) {
  const planLimitsController = new PlanLimitsController();

  // GET /plan-limits/:planType - Get plan limits by plan type (public)
  fastify.get('/plan-limits/:planType', {
    handler: planLimitsController.getPlanLimitsByType.bind(planLimitsController)
  });

  // GET /plan-limits - Get all plan limits (authenticated)
  fastify.get('/plan-limits', {
    preHandler: [authMiddleware],
    handler: planLimitsController.getAllPlanLimits.bind(planLimitsController)
  });

  // PUT /plan-limits/:planId - Update plan limits (admin only)
  fastify.put('/plan-limits/:planId', {
    preHandler: [adminMiddleware],
    handler: planLimitsController.updatePlanLimits.bind(planLimitsController)
  });
}
