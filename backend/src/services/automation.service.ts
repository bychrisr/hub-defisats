import { PrismaClient, Automation } from '@prisma/client';
import { z } from 'zod';
import { AutomationType } from '@/types/api-contracts';

// Configuration schemas for each automation type
const MarginGuardConfigSchema = z.object({
  margin_threshold: z.number().min(0.1).max(100), // Percentage
  action: z.enum(['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance']),
  reduce_percentage: z.number().min(1).max(100).optional(), // For reduce_position
  add_margin_amount: z.number().min(0).optional(), // For add_margin
  new_liquidation_distance: z.number().min(0.1).max(100).optional(), // For increase_liquidation_distance
  enabled: z.boolean().optional().default(true),
});

const TPSLConfigSchema = z.object({
  take_profit_percentage: z.number().min(0.1).max(1000),
  stop_loss_percentage: z.number().min(0.1).max(100),
  trailing_stop: z.boolean().default(false),
  trailing_percentage: z.number().min(0.1).max(10).optional(),
  enabled: z.boolean().optional().default(true),
});

const AutoEntryConfigSchema = z.object({
  entry_condition: z.enum([
    'price_above',
    'price_below',
    'rsi_oversold',
    'rsi_overbought',
  ]),
  entry_price: z.number().min(0).optional(),
  rsi_period: z.number().min(5).max(50).optional(),
  rsi_threshold: z.number().min(10).max(90).optional(),
  position_size: z.number().min(0.001).max(1), // Percentage of available balance
  enabled: z.boolean().optional().default(true),
});

// Union schema for all automation configs
const AutomationConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('margin_guard'),
    config: MarginGuardConfigSchema,
  }),
  z.object({ type: z.literal('tp_sl'), config: TPSLConfigSchema }),
  z.object({ type: z.literal('auto_entry'), config: AutoEntryConfigSchema }),
]);

export interface CreateAutomationData {
  userId: string;
  type: AutomationType;
  config: any;
  isActive?: boolean | undefined;
}

export interface UpdateAutomationData {
  automationId: string;
  userId: string;
  updates: {
    config?: any;
    is_active?: boolean;
  };
}

export interface GetAutomationData {
  automationId: string;
  userId: string;
}

export interface GetUserAutomationsData {
  userId: string;
  type?: AutomationType;
  isActive?: boolean;
}

export interface ToggleAutomationData {
  automationId: string;
  userId: string;
}

export class AutomationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Validate automation configuration based on type
   */
  private validateAutomationConfig(type: AutomationType, config: any): any {
    try {
      const validation = AutomationConfigSchema.parse({ type, config });
      return validation.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid configuration for ${type}: ${error.errors.map(e => e.message).join(', ')}`
        );
      }
      throw error;
    }
  }

  /**
   * Create new automation
   */
  async createAutomation(data: CreateAutomationData): Promise<Automation> {
    console.log('🔍 AUTOMATION SERVICE - createAutomation called with:', data);
    
    // Restore validation
    const validatedConfig = this.validateAutomationConfig(
      data.type,
      data.config
    );
    console.log('🔍 AUTOMATION SERVICE - validated config:', validatedConfig);

    // Check if user already has an automation of this type
    const existingAutomation = await this.prisma.automation.findFirst({
      where: {
        user_id: data.userId,
        type: data.type,
        is_active: true,
      },
    });

    if (existingAutomation) {
      throw new Error(`User already has an active ${data.type} automation`);
    }

    // Create automation
    const automation = await this.prisma.automation.create({
      data: {
        user_id: data.userId,
        type: data.type,
        config: validatedConfig,
        is_active: data.isActive ?? true,
      },
    });

    return automation;
  }

  /**
   * Get user's automations
   */
  async getUserAutomations(
    data: GetUserAutomationsData
  ): Promise<Automation[]> {
    const where: any = {
      user_id: data.userId,
    };

    if (data.type) {
      where.type = data.type;
    }

    if (data.isActive !== undefined) {
      where.is_active = data.isActive;
    }

    const automations = await this.prisma.automation.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
    });

    console.log('🔍 AUTOMATION SERVICE - Raw automations from Prisma:', JSON.stringify(automations, null, 2));
    
    // Test: manually check config field
    if (automations.length > 0) {
      console.log('🔍 AUTOMATION SERVICE - First automation config type:', typeof automations[0].config);
      console.log('🔍 AUTOMATION SERVICE - First automation config value:', automations[0].config);
      console.log('🔍 AUTOMATION SERVICE - First automation config JSON.stringify:', JSON.stringify(automations[0].config));
      
      // Test: manually convert config to plain object
      const testConfig = automations[0].config;
      const convertedConfig = Object.assign({}, testConfig);
      console.log('🔍 AUTOMATION SERVICE - Converted config:', JSON.stringify(convertedConfig, null, 2));
    }
    
    return automations;
  }

  /**
   * Get specific automation
   */
  async getAutomation(data: GetAutomationData): Promise<Automation | null> {
    const automation = await this.prisma.automation.findFirst({
      where: {
        id: data.automationId,
        user_id: data.userId,
      },
    });

    return automation;
  }

  /**
   * Update automation
   */
  async updateAutomation(
    data: UpdateAutomationData
  ): Promise<Automation | null> {
    console.log('🔍 AUTOMATION SERVICE - updateAutomation called with:', data);
    // Check if automation exists and belongs to user
    const existingAutomation = await this.prisma.automation.findFirst({
      where: {
        id: data.automationId,
        user_id: data.userId,
      },
    });

    if (!existingAutomation) {
      return null;
    }

    // Validate configuration if provided
    let validatedConfig = data.updates.config;
    console.log('🔍 AUTOMATION SERVICE - Raw config from data.updates.config:', JSON.stringify(data.updates.config, null, 2));
    if (data.updates.config) {
      // Restore validation
      validatedConfig = this.validateAutomationConfig(
        existingAutomation.type as AutomationType,
        data.updates.config
      );
    }
    console.log('🔍 AUTOMATION SERVICE - Final validatedConfig:', JSON.stringify(validatedConfig, null, 2));

    // Update automation
    const automation = await this.prisma.automation.update({
      where: {
        id: data.automationId,
      },
      data: {
        config: validatedConfig || existingAutomation.config,
        is_active:
          data.updates.is_active !== undefined
            ? data.updates.is_active
            : existingAutomation.is_active,
        updated_at: new Date(),
      },
    });

    return automation;
  }

  /**
   * Delete automation
   */
  async deleteAutomation(data: GetAutomationData): Promise<boolean> {
    const result = await this.prisma.automation.deleteMany({
      where: {
        id: data.automationId,
        user_id: data.userId,
      },
    });

    return result.count > 0;
  }

  /**
   * Toggle automation status
   */
  async toggleAutomation(
    data: ToggleAutomationData
  ): Promise<Automation | null> {
    // Check if automation exists and belongs to user
    const existingAutomation = await this.prisma.automation.findFirst({
      where: {
        id: data.automationId,
        user_id: data.userId,
      },
    });

    if (!existingAutomation) {
      return null;
    }

    // Toggle status
    const automation = await this.prisma.automation.update({
      where: {
        id: data.automationId,
      },
      data: {
        is_active: !existingAutomation.is_active,
        updated_at: new Date(),
      },
    });

    return automation;
  }

  /**
   * Get automation statistics for user
   */
  async getAutomationStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<AutomationType, number>;
    recentActivity: any[];
  }> {
    // Get total counts
    const [total, active, inactive] = await Promise.all([
      this.prisma.automation.count({
        where: { user_id: userId },
      }),
      this.prisma.automation.count({
        where: { user_id: userId, is_active: true },
      }),
      this.prisma.automation.count({
        where: { user_id: userId, is_active: false },
      }),
    ]);

    // Get counts by type
    const byType = await this.prisma.automation.groupBy({
      by: ['type'],
      where: { user_id: userId },
      _count: {
        type: true,
      },
    });

    const byTypeMap: Record<string, number> = {
      margin_guard: 0,
      tp_sl: 0,
      auto_entry: 0,
    };

    byType.forEach(item => {
      byTypeMap[item.type] = item._count.type;
    });

    // Get recent activity (last 10 automations)
    const recentActivity = await this.prisma.automation.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        is_active: true,
        updated_at: true,
      },
    });

    return {
      total,
      active,
      inactive,
      byType: byTypeMap,
      recentActivity,
    };
  }

  /**
   * Get active automations for a user (used by workers)
   */
  async getActiveAutomations(userId: string): Promise<Automation[]> {
    const automations = await this.prisma.automation.findMany({
      where: {
        user_id: userId,
        is_active: true,
      },
    });

    return automations;
  }

  /**
   * Get all active automations (used by workers)
   */
  async getAllActiveAutomations(): Promise<Automation[]> {
    const automations = await this.prisma.automation.findMany({
      where: {
        is_active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            ln_markets_api_key: true,
            ln_markets_api_secret: true,
          },
        },
      },
    });

    return automations;
  }

  /**
   * Validate automation configuration without creating
   */
  async validateConfig(
    type: AutomationType,
    config: any
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      this.validateAutomationConfig(type, config);
      return { valid: true };
    } catch (error) {
      if (error instanceof Error) {
        return { valid: false, errors: [error.message] };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }
}
