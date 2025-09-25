import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AutomationService } from '../services/automation.service';
import { AutomationLoggerService } from '../services/automation-logger.service';
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
  private automationLogger: AutomationLoggerService;

  constructor(prisma: PrismaClient) {
    this.automationLogger = new AutomationLoggerService(prisma);
    this.automationService = new AutomationService(prisma, this.automationLogger);
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

      // Get current automation state for logging
      const currentAutomation = await this.automationService.getAutomation({
        automationId: params.id,
        userId: user?.id || '',
      });

      if (!currentAutomation) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Automation not found',
        });
      }

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

      // Log state changes
      try {
        const hasStateChange = body.is_active !== undefined && body.is_active !== currentAutomation.is_active;
        const hasConfigChange = body.config !== undefined && JSON.stringify(body.config) !== JSON.stringify(currentAutomation.config);

        if (hasStateChange) {
          await this.automationLogger.logStateChange({
            userId: user?.id || '',
            automationId: params.id,
            automationType: currentAutomation.type,
            oldState: currentAutomation.is_active,
            newState: body.is_active!,
            changeType: body.is_active ? 'activation' : 'deactivation',
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            reason: 'User toggled automation state'
          });
        }

        if (hasConfigChange) {
          await this.automationLogger.logStateChange({
            userId: user?.id || '',
            automationId: params.id,
            automationType: currentAutomation.type,
            oldState: currentAutomation.is_active,
            newState: automation.is_active,
            changeType: 'config_update',
            configChanges: {
              old: currentAutomation.config,
              new: body.config
            },
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            reason: 'User updated automation configuration'
          });
        }
      } catch (logError) {
        console.error('❌ AUTOMATION CONTROLLER - Failed to log state change:', logError);
        // Don't fail the request if logging fails
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
   * Get automation state change history
   */
  async getAutomationStateHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { automationId, limit = '50' } = request.query as {
        automationId?: string;
        limit?: string;
      };

      // Temporarily use mock data to test frontend functionality
      const history = [
        {
          id: 'mock-1',
          action: 'automation_config_updated',
          automation_id: 'dd4df374-3b85-4e9b-b973-cbacd0ac787d',
          old_state: true,
          new_state: true,
          config_changes: {
            old: { margin_threshold: 80, new_liquidation_distance: 15 },
            new: { margin_threshold: 75, new_liquidation_distance: 10 }
          },
          automation_type: 'margin_guard',
          change_type: 'config_update',
          reason: 'User updated automation configuration',
          timestamp: new Date().toISOString()
        },
        {
          id: 'mock-2',
          action: 'automation_activated',
          automation_id: 'mock-tpsl',
          old_state: false,
          new_state: true,
          config_changes: {
            old: {},
            new: {}
          },
          automation_type: 'tp_sl',
          change_type: 'activation',
          reason: 'User activated automation',
          timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          id: 'mock-3',
          action: 'automation_config_updated',
          automation_id: 'mock-tpsl',
          old_state: true,
          new_state: true,
          config_changes: {
            old: { take_profit_percentage: 5, stop_loss_percentage: 3 },
            new: { take_profit_percentage: 7, stop_loss_percentage: 4 }
          },
          automation_type: 'tp_sl',
          change_type: 'config_update',
          reason: 'User updated automation configuration',
          timestamp: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
        }
      ];

      const stats = await this.automationLogger.getStateChangeStats(
        user?.id || '',
        automationId
      );

      // Debug: Log the first item to see what's being returned
      if (history.length > 0) {
        console.log('🔍 DEBUG - First history item:', JSON.stringify(history[0], null, 2));
        console.log('🔍 DEBUG - Config changes:', JSON.stringify(history[0].config_changes, null, 2));
        console.log('🔍 DEBUG - Old config:', JSON.stringify(history[0].config_changes?.old, null, 2));
        console.log('🔍 DEBUG - New config:', JSON.stringify(history[0].config_changes?.new, null, 2));
      }

      // Force proper serialization
      const serializedHistory = JSON.parse(JSON.stringify(history));

      return reply.send({
        success: true,
        data: {
          history: serializedHistory,
          statistics: stats
        }
      });

    } catch (error) {
      console.error('Get automation state history error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get automation state history',
      });
    }
  }

  /**
   * Get automation execution history
   */
  async getAutomationExecutionHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { automationId, limit = '50' } = request.query as {
        automationId?: string;
        limit?: string;
      };

      const history = await this.automationLogger.getExecutionHistory(
        user?.id || '',
        automationId,
        parseInt(limit, 10)
      );

      const stats = await this.automationLogger.getExecutionStats(
        user?.id || '',
        automationId
      );

      return reply.send({
        success: true,
        data: {
          history,
          statistics: stats
        }
      });

    } catch (error) {
      console.error('Get automation execution history error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get automation execution history',
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
