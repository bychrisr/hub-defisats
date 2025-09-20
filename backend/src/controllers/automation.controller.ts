import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AutomationService } from '../services/automation.service';
import { PrismaClient } from '@prisma/client';
import { AutomationType } from '../types/api-contracts';

// Interface for authenticated requests - user is declared globally in auth.middleware.ts
// interface AuthenticatedRequest extends FastifyRequest {
//   // user property is declared globally in auth.middleware.ts
// }

// Validation schemas
const CreateAutomationSchema = z.object({
  type: z.enum(['margin_guard', 'tp_sl', 'auto_entry']),
  config: z.record(z.unknown()),
  is_active: z.boolean().optional(),
});

const UpdateAutomationSchema = z.object({
  config: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

const AutomationParamsSchema = z.object({
  id: z.string().uuid(),
});

export class AutomationController {
  private automationService: AutomationService;

  constructor(prisma: PrismaClient) {
    this.automationService = new AutomationService(prisma);
  }

  /**
   * Create new automation
   */
  async createAutomation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      console.log('🔍 AUTOMATION CONTROLLER - Create automation request body:', JSON.stringify(request.body, null, 2));
      console.log('🔍 AUTOMATION CONTROLLER - Raw config from request:', JSON.stringify(request.body.config, null, 2));
      const body = CreateAutomationSchema.parse(request.body);
      console.log('🔍 AUTOMATION CONTROLLER - Parsed body:', JSON.stringify(body, null, 2));
      console.log('🔍 AUTOMATION CONTROLLER - Parsed config:', JSON.stringify(body.config, null, 2));

      const automation = await this.automationService.createAutomation({
        userId: user?.id || '',
        type: body.type as AutomationType,
        config: body.config,
        isActive: body.is_active,
      });

      return reply.status(201).send({
        success: true,
        data: automation,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      console.error('Create automation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to create automation',
      });
    }
  }

  /**
   * Get user's automations
   */
  async getUserAutomations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { type, is_active } = request.query as { type?: string; is_active?: string };

      const automations = await this.automationService.getUserAutomations({
        userId: user?.id || '',
        type: type as any,
        isActive: is_active ? is_active === 'true' : undefined,
      } as any);

      console.log('🔍 AUTOMATION CONTROLLER - Raw automations from service:', JSON.stringify(automations, null, 2));
      
      // Fix: manually serialize config field to plain objects
      const processedAutomations = automations.map(automation => ({
        ...automation,
        config: automation.config ? JSON.parse(JSON.stringify(automation.config)) : {}
      }));
      
      console.log('🔍 AUTOMATION CONTROLLER - Processed automations:', JSON.stringify(processedAutomations, null, 2));
      
      // Return raw JSON string to ensure proper serialization
      const jsonString = JSON.stringify({
        success: true,
        data: processedAutomations,
      });
      
      console.log('🔍 AUTOMATION CONTROLLER - Final JSON string:', jsonString);
      
      reply.type('application/json');
      return reply.send(jsonString);
    } catch (error) {
      console.error('Get user automations error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get automations',
      });
    }
  }

  /**
   * Get specific automation
   */
  async getAutomation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const params = AutomationParamsSchema.parse(request.params);

      const automation = await this.automationService.getAutomation({
        automationId: params.id,
        userId: user?.id || '',
      });

      if (!automation) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Automation not found',
        });
      }

      return reply.send({
        success: true,
        data: automation,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid automation ID',
        });
      }

      console.error('Get automation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get automation',
      });
    }
  }

  /**
   * Update automation
   */
  async updateAutomation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const params = AutomationParamsSchema.parse(request.params);
      console.log('🔍 AUTOMATION CONTROLLER - Update automation request body:', JSON.stringify(request.body, null, 2));
      console.log('🔍 AUTOMATION CONTROLLER - Raw config from request:', JSON.stringify(request.body.config, null, 2));
      const body = UpdateAutomationSchema.parse(request.body);
      console.log('🔍 AUTOMATION CONTROLLER - Parsed body:', JSON.stringify(body, null, 2));
      console.log('🔍 AUTOMATION CONTROLLER - Parsed config:', JSON.stringify(body.config, null, 2));

      // Build updates object only with defined values
      const updates: { config?: any; is_active?: boolean } = {};
      if (body.is_active !== undefined) {
        updates.is_active = body.is_active;
      }
      if (body.config !== undefined) {
        updates.config = body.config;
      }

      const automation = await this.automationService.updateAutomation({
        automationId: params.id,
        userId: user?.id || '',
        updates,
      });

      if (!automation) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Automation not found',
        });
      }

      // Fix: manually serialize config field for update response
      const processedAutomation = {
        ...automation,
        config: automation.config ? JSON.parse(JSON.stringify(automation.config)) : {}
      };
      
      console.log('🔍 AUTOMATION CONTROLLER - Processed update automation:', JSON.stringify(processedAutomation, null, 2));
      
      // Return raw JSON string to ensure proper serialization
      const jsonString = JSON.stringify({
        success: true,
        data: processedAutomation,
      });
      
      reply.type('application/json');
      return reply.send(jsonString);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      console.error('Update automation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update automation',
      });
    }
  }

  /**
   * Delete automation
   */
  async deleteAutomation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const params = AutomationParamsSchema.parse(request.params);

      const deleted = await this.automationService.deleteAutomation({
        automationId: params.id,
        userId: user?.id || '',
      });

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Automation not found',
        });
      }

      return reply.send({
        success: true,
        message: 'Automation deleted successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid automation ID',
        });
      }

      console.error('Delete automation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete automation',
      });
    }
  }

  /**
   * Toggle automation status
   */
  async toggleAutomation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const params = AutomationParamsSchema.parse(request.params);

      const automation = await this.automationService.toggleAutomation({
        automationId: params.id,
        userId: user?.id || '',
      });

      if (!automation) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Automation not found',
        });
      }

      return reply.send({
        success: true,
        data: automation,
        message: `Automation ${automation.is_active ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid automation ID',
        });
      }

      console.error('Toggle automation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to toggle automation',
      });
    }
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;

      const stats = await this.automationService.getAutomationStats(user?.id || '');

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get automation stats error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get automation statistics',
      });
    }
  }
}
