import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MarginGuardPlanService } from '../services/margin-guard-plan.service';

export class MarginGuardUserController {
  private prisma: PrismaClient;
  private marginGuardPlanService: MarginGuardPlanService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.marginGuardPlanService = new MarginGuardPlanService(prisma);
  }

  /**
   * Get user's plan features and limitations
   */
  async getPlanFeatures(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Get user's plan from database
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          email: true,
          plan_type: true,
          created_at: true
        }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      console.log('🔍 MARGIN GUARD USER - User plan data:', {
        userId: user.id,
        email: user.email,
        planType: user.plan_type,
        createdAt: user.created_at
      });

      const planType = user.plan_type || 'basic';
      
      const features = this.marginGuardPlanService.getPlanFeatures(planType as any);
      const limitations = this.marginGuardPlanService.getPlanLimitations(planType as any);
      const defaultConfig = this.marginGuardPlanService.createDefaultConfig(planType as any);

      return reply.send({
        success: true,
        data: {
          planType,
          features,
          limitations,
          defaultConfig,
          user: {
            id: user.id,
            email: user.email,
            planType: user.plan_type
          }
        },
      });
    } catch (error) {
      console.error('Error getting user plan features:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get plan features',
      });
    }
  }

  /**
   * Get user's current positions
   */
  async getUserPositions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // TODO: Implement actual LN Markets API call to get positions
      // For now, return mock data for testing
      const mockPositions = [
        {
          id: 'pos_1',
          symbol: 'BTCUSD',
          side: 'long',
          size: 1000,
          margin: 100,
          liquidation_price: 107456,
          current_price: 112778,
          pnl: 500,
          distance_to_liquidation: 4.7,
          created_at: new Date()
        },
        {
          id: 'pos_2',
          symbol: 'ETCUSD',
          side: 'long',
          size: 500,
          margin: 50,
          liquidation_price: 2500,
          current_price: 3000,
          pnl: 250,
          distance_to_liquidation: 16.7,
          created_at: new Date()
        }
      ];

      console.log('🔍 MARGIN GUARD USER - Retrieved positions:', mockPositions.length);

      return reply.send({
        success: true,
        data: {
          positions: mockPositions,
          total: mockPositions.length,
          closestToLiquidation: mockPositions.reduce((closest, pos) => 
            pos.distance_to_liquidation < closest.distance_to_liquidation ? pos : closest
          )
        },
      });
    } catch (error) {
      console.error('Error getting user positions:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get user positions',
      });
    }
  }

  /**
   * Get current market price
   */
  async getCurrentPrice(request: FastifyRequest, reply: FastifyReply) {
    try {
      // TODO: Implement actual market data API call
      // For now, return mock price
      const mockPrice = 112778;

      console.log('🔍 MARGIN GUARD USER - Retrieved current price:', mockPrice);

      return reply.send({
        success: true,
        data: {
          price: mockPrice,
          symbol: 'BTCUSD',
          timestamp: new Date().toISOString()
        },
      });
    } catch (error) {
      console.error('Error getting current price:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get current price',
      });
    }
  }

  /**
   * Create or update user's Margin Guard configuration
   */
  async createOrUpdateConfiguration(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      const configData = request.body as any;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Validate configuration against user's plan
      const validation = await this.marginGuardPlanService.validatePlanConfiguration(
        userId,
        configData
      );

      if (!validation.valid) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `Configuration validation failed: ${validation.errors.join(', ')}`,
          warnings: validation.warnings
        });
      }

      // TODO: Save configuration to database
      console.log('🔍 MARGIN GUARD USER - Saving configuration:', {
        userId,
        config: configData,
        validation
      });

      return reply.send({
        success: true,
        data: {
          configuration: configData,
          validation,
          savedAt: new Date().toISOString()
        },
        message: 'Margin Guard configuration saved successfully',
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to save configuration',
      });
    }
  }

  /**
   * Get user's current Margin Guard configuration
   */
  async getCurrentConfiguration(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // TODO: Get actual configuration from database
      // For now, return default configuration
      const defaultConfig = {
        enabled: false,
        margin_threshold: 75,
        action: 'reduce_position',
        reduce_percentage: 50,
        notifications: {
          push: true,
          email: false,
          telegram: false,
          whatsapp: false,
          webhook: false,
        }
      };

      console.log('🔍 MARGIN GUARD USER - Retrieved configuration:', defaultConfig);

      return reply.send({
        success: true,
        data: {
          configuration: defaultConfig,
          lastUpdated: new Date().toISOString()
        },
      });
    } catch (error) {
      console.error('Error getting configuration:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get configuration',
      });
    }
  }
}

