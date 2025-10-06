import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Plan types enum
export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  ADVANCED = 'advanced',
  PRO = 'pro',
  LIFETIME = 'lifetime',
}

// Margin Guard configuration by plan
export interface MarginGuardPlanConfig {
  planType: PlanType;
  maxPositions: number; // -1 for unlimited
  supportsIndividualConfig: boolean;
  supportsMultipleModes: boolean;
  supportsAdvancedNotifications: boolean;
  description: string;
}

// Plan configurations
export const PLAN_CONFIGURATIONS: Record<PlanType, MarginGuardPlanConfig> = {
  [PlanType.FREE]: {
    planType: PlanType.FREE,
    maxPositions: 2,
    supportsIndividualConfig: false,
    supportsMultipleModes: false,
    supportsAdvancedNotifications: false,
    description: 'Margin Guard Limitado (2 Posições) - Configuração global para 2 posições selecionadas'
  },
  [PlanType.BASIC]: {
    planType: PlanType.BASIC,
    maxPositions: -1, // Unlimited
    supportsIndividualConfig: false,
    supportsMultipleModes: false,
    supportsAdvancedNotifications: false,
    description: 'Margin Guard Simples (Todas as Posições) - Configuração global para todas as posições'
  },
  [PlanType.ADVANCED]: {
    planType: PlanType.ADVANCED,
    maxPositions: -1, // Unlimited
    supportsIndividualConfig: false,
    supportsMultipleModes: true, // Unitário + Total
    supportsAdvancedNotifications: false,
    description: 'Margin Guard Completo (Total + Unitário Global) - Duas modalidades de proteção'
  },
  [PlanType.PRO]: {
    planType: PlanType.PRO,
    maxPositions: -1, // Unlimited
    supportsIndividualConfig: true, // Individual position configs
    supportsMultipleModes: true, // Unitário + Total
    supportsAdvancedNotifications: true, // Multi-channel
    description: 'Margin Guard Personalizado (Unitário com Configurações Exclusivas) - Máxima flexibilidade'
  },
  [PlanType.LIFETIME]: {
    planType: PlanType.LIFETIME,
    maxPositions: -1, // Unlimited
    supportsIndividualConfig: true,
    supportsMultipleModes: true,
    supportsAdvancedNotifications: true,
    description: 'Margin Guard Personalizado e Completo (Máxima Flexibilidade) - Funcionalidade completa e ilimitada'
  }
};

// Schema for plan-specific validation
export const MarginGuardPlanSchema = z.object({
  plan_type: z.nativeEnum(PlanType),
  margin_threshold: z.number().min(0.1).max(100),
  action: z.enum(['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance']),
  reduce_percentage: z.number().min(1).max(100).optional(),
  add_margin_amount: z.number().min(0).optional(),
  new_liquidation_distance: z.number().min(0.1).max(100).optional(),
  enabled: z.boolean().default(true),
  
  // Plan-specific fields
  selected_positions: z.array(z.string()).optional(), // Free plan
  protection_mode: z.enum(['unitario', 'total', 'both']).optional(), // Advanced/Pro plans
  individual_configs: z.record(z.string(), z.object({
    margin_threshold: z.number().min(0.1).max(100),
    action: z.enum(['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance']),
    reduce_percentage: z.number().min(1).max(100).optional(),
    add_margin_amount: z.number().min(0).optional(),
    new_liquidation_distance: z.number().min(0.1).max(100).optional(),
  })).optional(), // Pro plan
  
  // Notification settings
  notifications: z.object({
    push: z.boolean().default(true),
    email: z.boolean().default(false),
    telegram: z.boolean().default(false),
    whatsapp: z.boolean().default(false),
    webhook: z.boolean().default(false),
  }).optional(),
});

export type MarginGuardPlanData = z.infer<typeof MarginGuardPlanSchema>;

export class MarginGuardPlanService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get plan configuration for a specific plan type
   */
  getPlanConfig(planType: PlanType): MarginGuardPlanConfig {
    return PLAN_CONFIGURATIONS[planType];
  }

  /**
   * Validate Margin Guard configuration based on user's plan
   */
  async validatePlanConfiguration(userId: string, config: MarginGuardPlanData): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get user's plan from database
      const userPlan = await this.getUserPlan(userId);
      const planConfig = this.getPlanConfig(userPlan);

      // Validate plan-specific rules
      if (planConfig.planType === PlanType.FREE) {
        // Free plan: max 2 positions
        if (config.selected_positions && config.selected_positions.length > 2) {
          errors.push('Free plan allows maximum 2 selected positions');
        }
        
        // Free plan: no individual configs
        if (config.individual_configs && Object.keys(config.individual_configs).length > 0) {
          errors.push('Free plan does not support individual position configurations');
        }
      }

      if (planConfig.planType === PlanType.BASIC) {
        // Basic plan: no individual configs
        if (config.individual_configs && Object.keys(config.individual_configs).length > 0) {
          errors.push('Basic plan does not support individual position configurations');
        }
        
        // Basic plan: no multiple modes
        if (config.protection_mode && config.protection_mode !== 'total') {
          errors.push('Basic plan only supports total protection mode');
        }
      }

      if (planConfig.planType === PlanType.ADVANCED) {
        // Advanced plan: supports multiple modes but no individual configs
        if (config.individual_configs && Object.keys(config.individual_configs).length > 0) {
          errors.push('Advanced plan does not support individual position configurations');
        }
      }

      if (planConfig.planType === PlanType.PRO || planConfig.planType === PlanType.LIFETIME) {
        // Pro/Lifetime: supports everything
        // No additional restrictions
      }

      // Validate notification settings based on plan
      if (config.notifications) {
        const hasAdvancedNotifications = 
          config.notifications.email || 
          config.notifications.telegram || 
          config.notifications.whatsapp || 
          config.notifications.webhook;

        if (hasAdvancedNotifications && !planConfig.supportsAdvancedNotifications) {
          errors.push(`${planConfig.planType} plan does not support advanced notifications (email, telegram, whatsapp, webhook)`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Get user's plan type from database
   */
  private async getUserPlan(userId: string): Promise<PlanType> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan_type: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Map database plan_type to PlanType enum
      switch (user.plan_type) {
        case 'free': return PlanType.FREE;
        case 'basic': return PlanType.BASIC;
        case 'advanced': return PlanType.ADVANCED;
        case 'pro': return PlanType.PRO;
        case 'lifetime': return PlanType.LIFETIME;
        default: return PlanType.BASIC; // Default fallback
      }
    } catch (error) {
      console.error('Error getting user plan:', error);
      return PlanType.BASIC; // Default fallback
    }
  }

  /**
   * Get available features for a plan
   */
  getPlanFeatures(planType: PlanType): {
    maxPositions: number;
    supportsIndividualConfig: boolean;
    supportsMultipleModes: boolean;
    supportsAdvancedNotifications: boolean;
    availableActions: string[];
    availableModes: string[];
    availableNotifications: string[];
  } {
    const config = this.getPlanConfig(planType);
    
    return {
      maxPositions: config.maxPositions,
      supportsIndividualConfig: config.supportsIndividualConfig,
      supportsMultipleModes: config.supportsMultipleModes,
      supportsAdvancedNotifications: config.supportsAdvancedNotifications,
      availableActions: ['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance'],
      availableModes: config.supportsMultipleModes ? ['unitario', 'total', 'both'] : ['total'],
      availableNotifications: config.supportsAdvancedNotifications 
        ? ['push', 'email', 'telegram', 'whatsapp', 'webhook']
        : ['push']
    };
  }

  /**
   * Create default configuration for a plan
   */
  createDefaultConfig(planType: PlanType): MarginGuardPlanData {
    const baseConfig: MarginGuardPlanData = {
      plan_type: planType,
      margin_threshold: 85, // 85% - moderate setting
      action: 'reduce_position',
      reduce_percentage: 50, // 50% reduction
      enabled: true,
      notifications: {
        push: true,
        email: false,
        telegram: false,
        whatsapp: false,
        webhook: false,
      }
    };

    const config = this.getPlanConfig(planType);

    // Add plan-specific defaults
    if (config.supportsMultipleModes) {
      baseConfig.protection_mode = 'both';
    }

    if (config.supportsAdvancedNotifications) {
      baseConfig.notifications = {
        push: true,
        email: true,
        telegram: false,
        whatsapp: false,
        webhook: false,
      };
    }

    return baseConfig;
  }

  /**
   * Get plan limitations for UI display
   */
  getPlanLimitations(planType: PlanType): {
    positionLimit: string;
    configurationType: string;
    notificationChannels: string;
    description: string;
  } {
    const config = this.getPlanConfig(planType);
    
    return {
      positionLimit: config.maxPositions === -1 ? 'Ilimitado' : `${config.maxPositions} posições`,
      configurationType: config.supportsIndividualConfig ? 'Individual + Global' : 'Global',
      notificationChannels: config.supportsAdvancedNotifications ? 'Multi-canal' : 'Push apenas',
      description: config.description
    };
  }
}
