import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MarginGuardPlanService, PlanType } from '../../services/margin-guard-plan.service';

export class MarginGuardPlansController {
  private marginGuardPlanService: MarginGuardPlanService;

  constructor(prisma: PrismaClient) {
    this.marginGuardPlanService = new MarginGuardPlanService(prisma);
  }

  /**
   * Get all plan configurations
   */
  async getPlanConfigurations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const configurations = Object.values(PlanType).map(planType => {
        const config = this.marginGuardPlanService.getPlanConfig(planType);
        const features = this.marginGuardPlanService.getPlanFeatures(planType);
        const limitations = this.marginGuardPlanService.getPlanLimitations(planType);
        const defaultConfig = this.marginGuardPlanService.createDefaultConfig(planType);

        return {
          planType,
          config,
          features,
          limitations,
          defaultConfig
        };
      });

      return reply.send({
        success: true,
        data: configurations,
      });
    } catch (error) {
      console.error('Get plan configurations error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get plan configurations',
      });
    }
  }

  /**
   * Get specific plan configuration
   */
  async getPlanConfiguration(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { planType } = request.params as { planType: string };
      
      if (!Object.values(PlanType).includes(planType as PlanType)) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_PLAN_TYPE',
          message: 'Invalid plan type provided',
        });
      }

      const config = this.marginGuardPlanService.getPlanConfig(planType as PlanType);
      const features = this.marginGuardPlanService.getPlanFeatures(planType as PlanType);
      const limitations = this.marginGuardPlanService.getPlanLimitations(planType as PlanType);
      const defaultConfig = this.marginGuardPlanService.createDefaultConfig(planType as PlanType);

      return reply.send({
        success: true,
        data: {
          planType,
          config,
          features,
          limitations,
          defaultConfig
        },
      });
    } catch (error) {
      console.error('Get plan configuration error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get plan configuration',
      });
    }
  }

  /**
   * Update plan configuration
   */
  async updatePlanConfiguration(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { planType } = request.params as { planType: string };
      const updateData = request.body as any;

      if (!Object.values(PlanType).includes(planType as PlanType)) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_PLAN_TYPE',
          message: 'Invalid plan type provided',
        });
      }

      // TODO: Implement actual plan configuration update in database
      // For now, we'll just validate the configuration
      const validation = this.marginGuardPlanService.validatePlanConfiguration(
        'admin_user', // Admin user ID
        updateData
      );

      if (!validation.valid) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `Plan configuration validation failed: ${validation.errors.join(', ')}`,
        });
      }

      // TODO: Save to database
      console.log(`🔍 ADMIN - Updating plan configuration for ${planType}:`, updateData);

      return reply.send({
        success: true,
        data: {
          planType,
          config: updateData,
          updatedAt: new Date().toISOString(),
        },
        message: `Plan configuration for ${planType} updated successfully`,
      });
    } catch (error) {
      console.error('Update plan configuration error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update plan configuration',
      });
    }
  }

  /**
   * Get plan statistics from real database data
   */
  async getPlanStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Get real user statistics from database
      const totalUsers = await this.marginGuardPlanService['prisma'].user.count();
      
      console.log('🔍 ADMIN - Total users in database:', totalUsers);
      
      // Get users by plan type
      const usersByPlan = await this.marginGuardPlanService['prisma'].user.groupBy({
        by: ['plan_type'],
        _count: {
          plan_type: true,
        },
      });

      // Convert to object format
      const usersByPlanObj = {
        free: 0,
        basic: 0,
        advanced: 0,
        pro: 0,
        lifetime: 0,
      };

      usersByPlan.forEach(group => {
        const planType = group.plan_type as keyof typeof usersByPlanObj;
        if (planType in usersByPlanObj) {
          usersByPlanObj[planType] = group._count.plan_type;
        }
      });

      // Get Margin Guard automation statistics
      const totalAutomations = await this.marginGuardPlanService['prisma'].automation.count({
        where: { type: 'margin_guard' }
      });

      const activeAutomations = await this.marginGuardPlanService['prisma'].automation.count({
        where: { 
          type: 'margin_guard',
          is_active: true 
        }
      });

      // Get executions today (from automation logs)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const executionsToday = await this.marginGuardPlanService['prisma'].automationLog.count({
        where: {
          created_at: {
            gte: today
          },
          automation: {
            type: 'margin_guard'
          }
        }
      });

      // Calculate success rate
      const totalExecutions = await this.marginGuardPlanService['prisma'].automationLog.count({
        where: {
          automation: {
            type: 'margin_guard'
          }
        }
      });

      const successfulExecutions = await this.marginGuardPlanService['prisma'].automationLog.count({
        where: {
          automation: {
            type: 'margin_guard'
          },
          status: 'success'
        }
      });

      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

      const statistics = {
        totalUsers,
        usersByPlan: usersByPlanObj,
        marginGuardUsage: {
          totalAutomations,
          activeAutomations,
          executionsToday,
          successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
        },
        planLimitations: {
          free: {
            maxPositions: 2,
            supportsIndividualConfig: false,
            supportsAdvancedNotifications: false,
          },
          basic: {
            maxPositions: -1,
            supportsIndividualConfig: false,
            supportsAdvancedNotifications: false,
          },
          advanced: {
            maxPositions: -1,
            supportsIndividualConfig: false,
            supportsAdvancedNotifications: false,
          },
          pro: {
            maxPositions: -1,
            supportsIndividualConfig: true,
            supportsAdvancedNotifications: true,
          },
          lifetime: {
            maxPositions: -1,
            supportsIndividualConfig: true,
            supportsAdvancedNotifications: true,
          },
        }
      };

      console.log('🔍 ADMIN - Real statistics from database:', statistics);

      return reply.send({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error('Get plan statistics error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get plan statistics',
      });
    }
  }

  /**
   * Reset plan to default configuration
   */
  async resetPlanConfiguration(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { planType } = request.params as { planType: string };
      
      if (!Object.values(PlanType).includes(planType as PlanType)) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_PLAN_TYPE',
          message: 'Invalid plan type provided',
        });
      }

      const defaultConfig = this.marginGuardPlanService.createDefaultConfig(planType as PlanType);

      // TODO: Save default configuration to database
      console.log(`🔍 ADMIN - Resetting plan configuration for ${planType} to default:`, defaultConfig);

      return reply.send({
        success: true,
        data: {
          planType,
          config: defaultConfig,
          resetAt: new Date().toISOString(),
        },
        message: `Plan configuration for ${planType} reset to default successfully`,
      });
    } catch (error) {
      console.error('Reset plan configuration error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to reset plan configuration',
      });
    }
  }
}
