import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PlanLimitsService } from '../services/planLimits.service';

export class PlanLimitsController {
  private prisma: PrismaClient;
  private planLimitsService: PlanLimitsService;

  constructor() {
    this.prisma = new PrismaClient();
    this.planLimitsService = new PlanLimitsService(this.prisma);
  }

  /**
   * GET /api/plan-limits/:planType - Get plan limits by plan type
   */
  async getPlanLimitsByType(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { planType } = request.params as { planType: string };
      
      console.log('🔍 PLAN LIMITS CONTROLLER - Getting limits for plan type:', planType);

      const planLimits = await this.planLimitsService.getPlanLimitsByType(planType);

      if (!planLimits) {
        // Return default limits if not found in database
        const defaultLimits = this.planLimitsService.getDefaultLimits(planType);
        
        return reply.status(200).send({
          success: true,
          data: {
            plan_type: planType,
            max_exchange_accounts: defaultLimits.max_exchange_accounts,
            is_unlimited: defaultLimits.is_unlimited,
            is_default: true
          }
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          plan_type: planLimits.plan.slug,
          max_exchange_accounts: planLimits.max_exchange_accounts,
          max_automations: planLimits.max_automations,
          max_indicators: planLimits.max_indicators,
          max_simulations: planLimits.max_simulations,
          max_backtests: planLimits.max_backtests,
          is_unlimited: planLimits.max_exchange_accounts === 0,
          is_default: false
        }
      });

    } catch (error: any) {
      console.error('❌ PLAN LIMITS CONTROLLER - Error getting plan limits:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to get plan limits'
      });
    }
  }

  /**
   * GET /api/plan-limits - Get all plan limits
   */
  async getAllPlanLimits(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🔍 PLAN LIMITS CONTROLLER - Getting all plan limits');

      const planLimits = await this.planLimitsService.getAllPlanLimits();

      return reply.status(200).send({
        success: true,
        data: planLimits.map(pl => ({
          plan_id: pl.plan.id,
          plan_type: pl.plan.slug,
          plan_name: pl.plan.name,
          max_exchange_accounts: pl.max_exchange_accounts,
          max_automations: pl.max_automations,
          max_indicators: pl.max_indicators,
          max_simulations: pl.max_simulations,
          max_backtests: pl.max_backtests,
          is_unlimited: pl.max_exchange_accounts === 0
        }))
      });

    } catch (error: any) {
      console.error('❌ PLAN LIMITS CONTROLLER - Error getting all plan limits:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to get plan limits'
      });
    }
  }

  /**
   * PUT /api/plan-limits/:planId - Update plan limits (Admin only)
   */
  async updatePlanLimits(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { planId } = request.params as { planId: string };
      const updateData = request.body as {
        max_exchange_accounts?: number;
        max_automations?: number;
        max_indicators?: number;
        max_simulations?: number;
        max_backtests?: number;
      };

      console.log('🔄 PLAN LIMITS CONTROLLER - Updating plan limits:', { planId, updateData });

      const updatedLimits = await this.planLimitsService.updatePlanLimits(planId, updateData);

      return reply.status(200).send({
        success: true,
        data: {
          plan_id: updatedLimits.plan.id,
          plan_type: updatedLimits.plan.slug,
          plan_name: updatedLimits.plan.name,
          max_exchange_accounts: updatedLimits.max_exchange_accounts,
          max_automations: updatedLimits.max_automations,
          max_indicators: updatedLimits.max_indicators,
          max_simulations: updatedLimits.max_simulations,
          max_backtests: updatedLimits.max_backtests,
          is_unlimited: updatedLimits.max_exchange_accounts === 0
        }
      });

    } catch (error: any) {
      console.error('❌ PLAN LIMITS CONTROLLER - Error updating plan limits:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to update plan limits'
      });
    }
  }
}
