import { FastifyRequest, FastifyReply } from 'fastify';
import { getPrisma } from '../lib/prisma';

export class PlansController {
  /**
   * Listar todos os planos
   */
  async getAllPlans(request: FastifyRequest, reply: FastifyReply) {
    console.log('🚀 PLANS CONTROLLER CALLED!');
    try {
      const prisma = await getPrisma();
      
      console.log('🔍 PlansController - Fetching plans from database...');
      const plans = await prisma.plan.findMany();

      console.log('✅ PlansController - Retrieved all plans:', plans.length);
      console.log('🔍 PlansController - First plan:', plans[0]);
      
      return reply.send({
        success: true,
        data: plans,
        count: plans.length
      });
    } catch (error: any) {
      console.error('❌ PlansController - Error getting all plans:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Obter estatísticas de usuários por plano
   */
  async getPlanUserStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const prisma = await getPrisma();
      
      // Buscar contagem de usuários por plano
      const userStats = await prisma.user.groupBy({
        by: ['plan_type'],
        _count: {
          plan_type: true
        }
      });

      // Converter para objeto com plan_type como chave
      const stats: Record<string, number> = {};
      userStats.forEach(stat => {
        if (stat.plan_type) {
          stats[stat.plan_type] = stat._count.plan_type;
        }
      });

      console.log('✅ PlansController - Retrieved plan user stats:', stats);
      
      return reply.send({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('❌ PlansController - Error getting plan user stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Obter plano por ID
   */
  async getPlanById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const prisma = await getPrisma();
      
      const plan = await prisma.plan.findUnique({
        where: { id }
      });

      if (!plan) {
        return reply.status(404).send({
          success: false,
          error: 'Plan not found',
          message: `Plan with ID ${id} not found`
        });
      }

      console.log('✅ PlansController - Retrieved plan by ID:', plan.name);
      
      return reply.send({
        success: true,
        data: plan
      });
    } catch (error: any) {
      console.error('❌ PlansController - Error getting plan by ID:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Criar novo plano
   */
  async createPlan(request: FastifyRequest, reply: FastifyReply) {
    try {
      const planData = request.body as any;
      const prisma = await getPrisma();
      
      const plan = await prisma.plan.create({
        data: {
          name: planData.name,
          slug: planData.slug,
          description: planData.description,
          price_sats: planData.price_sats || 0,
          price_monthly: planData.price_monthly,
          price_yearly: planData.price_yearly,
          features: planData.features || [],
          is_active: planData.is_active !== false,
          has_api_access: planData.has_api_access || false,
          has_advanced: planData.has_advanced || false,
          has_priority: planData.has_priority || false,
          max_notifications: planData.max_notifications || 0,
          sort_order: planData.sort_order || 0
        }
      });

      console.log('✅ PlansController - Created plan:', plan.name);
      
      return reply.status(201).send({
        success: true,
        data: plan,
        message: 'Plan created successfully'
      });
    } catch (error: any) {
      console.error('❌ PlansController - Error creating plan:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Atualizar plano
   */
  async updatePlan(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const planData = request.body as any;
      const prisma = await getPrisma();
      
      const plan = await prisma.plan.update({
        where: { id },
        data: {
          ...planData,
          updated_at: new Date()
        }
      });

      console.log('✅ PlansController - Updated plan:', plan.name);
      
      return reply.send({
        success: true,
        data: plan,
        message: 'Plan updated successfully'
      });
    } catch (error: any) {
      console.error('❌ PlansController - Error updating plan:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Deletar plano
   */
  async deletePlan(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const prisma = await getPrisma();
      
      await prisma.plan.delete({
        where: { id }
      });

      console.log('✅ PlansController - Deleted plan with ID:', id);
      
      return reply.send({
        success: true,
        message: 'Plan deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ PlansController - Error deleting plan:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
}
