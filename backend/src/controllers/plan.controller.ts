import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PlanFeatures {
  automations: string[];
  notifications: string[];
  backtests: string[];
  advanced: string[];
  support: string[];
}

interface CreatePlanBody {
  name: string;
  slug: 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime';
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  price_lifetime?: number;
  currency?: string;
  max_automations: number;
  max_backtests: number;
  max_notifications: number;
  has_priority: boolean;
  has_advanced: boolean;
  has_api_access: boolean;
  features: PlanFeatures;
  stripe_price_id?: string;
  order?: number;
}

interface UpdatePlanBody extends Partial<CreatePlanBody> {
  is_active?: boolean;
}

export class PlanController {
  /**
   * Get all plans
   */
  async getAllPlans(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { include_inactive = 'false', limit = '50', offset = '0' } = request.query as any;

      const plans = await prisma.plan.findMany({
        where: include_inactive === 'true' ? {} : { is_active: true },
        orderBy: { order: 'asc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          users: {
            select: {
              id: true,
              email: true,
              created_at: true,
            },
            take: 5, // Limit to 5 users for performance
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      const total = await prisma.plan.count({
        where: include_inactive === 'true' ? {} : { is_active: true },
      });

      reply.send({
        success: true,
        data: {
          plans,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasNext: parseInt(offset) + parseInt(limit) < total,
            hasPrev: parseInt(offset) > 0,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch plans',
      });
    }
  }

  /**
   * Get plan by ID
   */
  async getPlanById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const plan = await prisma.plan.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              created_at: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!plan) {
        return reply.code(404).send({
          success: false,
          error: 'Plan not found',
        });
      }

      reply.send({
        success: true,
        data: plan,
      });
    } catch (error: any) {
      console.error('Error fetching plan:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch plan',
      });
    }
  }

  /**
   * Get plan by slug
   */
  async getPlanBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    try {
      const { slug } = request.params;

      const plan = await prisma.plan.findUnique({
        where: { slug: slug as any },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              created_at: true,
            },
            take: 10,
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!plan) {
        return reply.code(404).send({
          success: false,
          error: 'Plan not found',
        });
      }

      reply.send({
        success: true,
        data: plan,
      });
    } catch (error: any) {
      console.error('Error fetching plan:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch plan',
      });
    }
  }

  /**
   * Create new plan
   */
  async createPlan(request: FastifyRequest<{ Body: CreatePlanBody }>, reply: FastifyReply) {
    try {
      const planData = request.body;

      // Validate slug uniqueness
      const existingPlan = await prisma.plan.findUnique({
        where: { slug: planData.slug },
      });

      if (existingPlan) {
        return reply.code(400).send({
          success: false,
          error: 'Plan slug already exists',
        });
      }

      const plan = await prisma.plan.create({
        data: {
          name: planData.name,
          slug: planData.slug,
          description: planData.description,
          price_monthly: planData.price_monthly,
          price_yearly: planData.price_yearly,
          price_lifetime: planData.price_lifetime,
          currency: planData.currency || 'BRL',
          max_automations: planData.max_automations,
          max_backtests: planData.max_backtests,
          max_notifications: planData.max_notifications,
          has_priority: planData.has_priority,
          has_advanced: planData.has_advanced,
          has_api_access: planData.has_api_access,
          features: planData.features,
          stripe_price_id: planData.stripe_price_id,
          order: planData.order || 0,
        },
      });

      reply.code(201).send({
        success: true,
        data: plan,
        message: 'Plan created successfully',
      });
    } catch (error: any) {
      console.error('Error creating plan:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to create plan',
      });
    }
  }

  /**
   * Update plan
   */
  async updatePlan(request: FastifyRequest<{ Params: { id: string }, Body: UpdatePlanBody }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      // Check if plan exists
      const existingPlan = await prisma.plan.findUnique({
        where: { id },
      });

      if (!existingPlan) {
        return reply.code(404).send({
          success: false,
          error: 'Plan not found',
        });
      }

      // Check slug uniqueness if being updated
      if (updateData.slug && updateData.slug !== existingPlan.slug) {
        const slugExists = await prisma.plan.findUnique({
          where: { slug: updateData.slug },
        });

        if (slugExists) {
          return reply.code(400).send({
            success: false,
            error: 'Plan slug already exists',
          });
        }
      }

      const updatedPlan = await prisma.plan.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.slug && { slug: updateData.slug }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.price_monthly !== undefined && { price_monthly: updateData.price_monthly }),
          ...(updateData.price_yearly !== undefined && { price_yearly: updateData.price_yearly }),
          ...(updateData.price_lifetime !== undefined && { price_lifetime: updateData.price_lifetime }),
          ...(updateData.currency && { currency: updateData.currency }),
          ...(updateData.max_automations !== undefined && { max_automations: updateData.max_automations }),
          ...(updateData.max_backtests !== undefined && { max_backtests: updateData.max_backtests }),
          ...(updateData.max_notifications !== undefined && { max_notifications: updateData.max_notifications }),
          ...(updateData.has_priority !== undefined && { has_priority: updateData.has_priority }),
          ...(updateData.has_advanced !== undefined && { has_advanced: updateData.has_advanced }),
          ...(updateData.has_api_access !== undefined && { has_api_access: updateData.has_api_access }),
          ...(updateData.features && { features: updateData.features }),
          ...(updateData.stripe_price_id !== undefined && { stripe_price_id: updateData.stripe_price_id }),
          ...(updateData.order !== undefined && { order: updateData.order }),
          ...(updateData.is_active !== undefined && { is_active: updateData.is_active }),
        },
      });

      reply.send({
        success: true,
        data: updatedPlan,
        message: 'Plan updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating plan:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to update plan',
      });
    }
  }

  /**
   * Delete plan
   */
  async deletePlan(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      // Check if plan exists
      const plan = await prisma.plan.findUnique({
        where: { id },
        include: {
          users: {
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!plan) {
        return reply.code(404).send({
          success: false,
          error: 'Plan not found',
        });
      }

      // Check if plan has users
      if (plan.users.length > 0) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot delete plan with active users. Please migrate users first.',
        });
      }

      await prisma.plan.delete({
        where: { id },
      });

      reply.send({
        success: true,
        message: 'Plan deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to delete plan',
      });
    }
  }

  /**
   * Get plan statistics
   */
  async getPlanStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await prisma.plan.aggregate({
        _count: {
          id: true,
        },
        where: {
          is_active: true,
        },
      });

      const planDistribution = await prisma.plan.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });

      const revenueStats = await prisma.plan.findMany({
        select: {
          name: true,
          price_monthly: true,
          price_yearly: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        where: {
          price_monthly: {
            not: null,
          },
        },
      });

      const monthlyRevenue = revenueStats.reduce((sum, plan) => {
        return sum + (plan.price_monthly || 0) * plan._count.users;
      }, 0);

      reply.send({
        success: true,
        data: {
          totalPlans: stats._count.id,
          planDistribution: planDistribution.map(plan => ({
            name: plan.name,
            slug: plan.slug,
            userCount: plan._count.users,
          })),
          monthlyRevenue,
          revenueByPlan: revenueStats.map(plan => ({
            name: plan.name,
            monthlyRevenue: (plan.price_monthly || 0) * plan._count.users,
            yearlyRevenue: (plan.price_yearly || 0) * plan._count.users,
            userCount: plan._count.users,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error fetching plan stats:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch plan statistics',
      });
    }
  }

  /**
   * Toggle plan active status
   */
  async togglePlanStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const plan = await prisma.plan.findUnique({
        where: { id },
      });

      if (!plan) {
        return reply.code(404).send({
          success: false,
          error: 'Plan not found',
        });
      }

      const updatedPlan = await prisma.plan.update({
        where: { id },
        data: {
          is_active: !plan.is_active,
        },
      });

      reply.send({
        success: true,
        data: updatedPlan,
        message: `Plan ${updatedPlan.is_active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error toggling plan status:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to toggle plan status',
      });
    }
  }

  /**
   * Reorder plans
   */
  async reorderPlans(request: FastifyRequest<{ Body: { plans: Array<{ id: string; order: number }> } }>, reply: FastifyReply) {
    try {
      const { plans } = request.body;

      // Update all plans in a transaction
      await prisma.$transaction(
        plans.map(plan =>
          prisma.plan.update({
            where: { id: plan.id },
            data: { order: plan.order },
          })
        )
      );

      reply.send({
        success: true,
        message: 'Plans reordered successfully',
      });
    } catch (error: any) {
      console.error('Error reordering plans:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to reorder plans',
      });
    }
  }
}

// Export singleton instance
export const planController = new PlanController();
