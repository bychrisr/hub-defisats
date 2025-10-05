import { FastifyRequest, FastifyReply } from 'fastify';
import { planLimitsService, CreatePlanLimitsRequest, UpdatePlanLimitsRequest } from '../services/plan-limits.service';

export class PlanLimitsController {
  /**
   * Criar limites para um plano
   */
  async createPlanLimits(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as CreatePlanLimitsRequest;
      
      // Validação básica
      if (!data.planId) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Plan ID is required'
        });
      }

      if (data.maxExchangeAccounts < 0 || data.maxAutomations < 0 || 
          data.maxIndicators < 0 || data.maxSimulations < 0 || data.maxBacktests < 0) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Limits cannot be negative'
        });
      }

      const planLimits = await planLimitsService.createPlanLimits(data);
      
      return reply.status(201).send({
        success: true,
        data: planLimits,
        message: 'Plan limits created successfully'
      });

    } catch (error: any) {
      console.error('❌ PlanLimitsController - Error creating plan limits:', error);
      
      if (error.message.includes('already exist')) {
        return reply.status(409).send({
          error: 'CONFLICT',
          message: error.message
        });
      }
      
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: error.message
        });
      }

      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Atualizar limites de um plano
   */
  async updatePlanLimits(request: FastifyRequest, reply: FastifyReply) {
    console.log('🔍 PlanLimitsController - updatePlanLimits - METHOD CALLED!');
    console.log('🔍 PlanLimitsController - updatePlanLimits - Request params:', request.params);
    console.log('🔍 PlanLimitsController - updatePlanLimits - Request body:', request.body);
    
    try {
      const { id } = request.params as { id: string };
      const data = request.body as UpdatePlanLimitsRequest;
      
      if (!id) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Plan limits ID is required'
        });
      }

      // Validação de limites não negativos
      const limitsToValidate = [
        data.maxExchangeAccounts,
        data.maxAutomations,
        data.maxIndicators,
        data.maxSimulations,
        data.maxBacktests
      ];

      for (const limit of limitsToValidate) {
        if (limit !== undefined && limit < 0) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Limits cannot be negative'
          });
        }
      }

      const planLimits = await planLimitsService.updatePlanLimits({ id, ...data });
      
      console.log('🔍 PlanLimitsController - updatePlanLimits - planLimits received:', planLimits);
      console.log('🔍 PlanLimitsController - updatePlanLimits - planLimits type:', typeof planLimits);
      console.log('🔍 PlanLimitsController - updatePlanLimits - planLimits keys:', Object.keys(planLimits || {}));
      console.log('🔍 PlanLimitsController - updatePlanLimits - planLimits stringified:', JSON.stringify(planLimits, null, 2));
      
      const response = {
        success: true,
        data: planLimits,
        message: 'Plan limits updated successfully'
      };
      
      console.log('🔍 PlanLimitsController - updatePlanLimits - Response object:', response);
      console.log('🔍 PlanLimitsController - updatePlanLimits - Response data:', response.data);
      console.log('🔍 PlanLimitsController - updatePlanLimits - Response stringified:', JSON.stringify(response, null, 2));
      
      return reply.status(200).send(response);

    } catch (error: any) {
      console.error('❌ PlanLimitsController - Error updating plan limits:', error);
      
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: error.message
        });
      }

      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Obter limites de um plano
   */
  async getPlanLimits(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { planId } = request.params as { planId: string };
      
      if (!planId) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Plan ID is required'
        });
      }

      const planLimits = await planLimitsService.getPlanLimits(planId);
      
      if (!planLimits) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'Plan limits not found'
        });
      }

      return reply.status(200).send({
        success: true,
        data: planLimits
      });

    } catch (error: any) {
      console.error('❌ PlanLimitsController - Error getting plan limits:', error);
      
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Listar todos os limites de planos
   */
  async getAllPlanLimits(request: FastifyRequest, reply: FastifyReply) {
    try {
      const planLimits = await planLimitsService.getAllPlanLimits();
      
      return reply.status(200).send({
        success: true,
        data: planLimits,
        count: planLimits.length
      });

    } catch (error: any) {
      console.error('❌ PlanLimitsController - Error getting all plan limits:', error);
      
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Obter limites de um usuário
   */
  async getUserLimits(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      
      if (!userId) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'User ID is required'
        });
      }

      const planLimits = await planLimitsService.getUserLimits(userId);
      
      if (!planLimits) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'No plan limits found for user'
        });
      }

      return reply.status(200).send({
        success: true,
        data: planLimits
      });

    } catch (error: any) {
      console.error('❌ PlanLimitsController - Error getting user limits:', error);
      
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Validar limite específico
   */
  async validateLimit(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      const { limitType } = request.query as { limitType: string };
      
      if (!userId) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'User ID is required'
        });
      }

      if (!limitType) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Limit type is required'
        });
      }

      const validLimitTypes = ['EXCHANGE_ACCOUNTS', 'AUTOMATIONS', 'INDICATORS', 'SIMULATIONS', 'BACKTESTS'];
      if (!validLimitTypes.includes(limitType)) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: `Invalid limit type. Must be one of: ${validLimitTypes.join(', ')}`
        });
      }

      const validation = await planLimitsService.validateLimit(
        userId, 
        limitType as 'EXCHANGE_ACCOUNTS' | 'AUTOMATIONS' | 'INDICATORS' | 'SIMULATIONS' | 'BACKTESTS'
      );

      return reply.status(200).send({
        success: true,
        data: validation
      });

    } catch (error: any) {
      console.error('❌ PlanLimitsController - Error validating limit:', error);
      
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Deletar limites de um plano
   */
  async deletePlanLimits(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      if (!id) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Plan limits ID is required'
        });
      }

      await planLimitsService.deletePlanLimits(id);
      
      return reply.status(200).send({
        success: true,
        message: 'Plan limits deleted successfully'
      });

    } catch (error: any) {
      console.error('❌ PlanLimitsController - Error deleting plan limits:', error);
      
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: error.message
        });
      }

      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Obter estatísticas de uso
   */
  async getUsageStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📊 PlanLimitsController - Getting usage statistics...');
      console.log('📊 PlanLimitsController - Request received:', request.url);
      
      const statistics = await planLimitsService.getUsageStatistics();
      console.log('📊 PlanLimitsController - Statistics received:', statistics);
      
      return reply.status(200).send({
        success: true,
        data: statistics
      });

    } catch (error: any) {
      console.error('❌ PlanLimitsController - Error getting usage statistics:', error);
      
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }
}

export const planLimitsController = new PlanLimitsController();
