import { PrismaClient } from '@prisma/client';
import { MarginGuardPlanService, PlanType } from './margin-guard-plan.service';
import { UserExchangeAccountService } from './userExchangeAccount.service';
import { AutomationLoggerService } from './automation-logger.service';

export interface MarginGuardExecutionData {
  userId: string;
  automationId: string;
  userExchangeAccountId: string;
  config: any;
  planType: string;
  positions: any[];
  currentPrices: Record<string, number>;
}

export interface MarginGuardExecutionResult {
  success: boolean;
  actions: Array<{
    positionId: string;
    action: string;
    amount?: number;
    percentage?: number;
    newLiquidationDistance?: number;
  }>;
  notifications: Array<{
    type: string;
    message: string;
    sent: boolean;
  }>;
  errors: string[];
}

export class MarginGuardExecutorService {
  private prisma: PrismaClient;
  private marginGuardPlanService: MarginGuardPlanService;
  private userExchangeAccountService: UserExchangeAccountService;
  private automationLogger: AutomationLoggerService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.marginGuardPlanService = new MarginGuardPlanService(prisma);
    this.userExchangeAccountService = new UserExchangeAccountService(prisma);
    this.automationLogger = new AutomationLoggerService(prisma);
  }

  /**
   * Execute Margin Guard automation based on user's plan
   */
  async executeMarginGuard(data: MarginGuardExecutionData): Promise<MarginGuardExecutionResult> {
    console.log('🛡️ MARGIN GUARD EXECUTOR - Starting execution:', {
      userId: data.userId,
      automationId: data.automationId,
      planType: data.planType,
      positionsCount: data.positions.length
    });

    const result: MarginGuardExecutionResult = {
      success: false,
      actions: [],
      notifications: [],
      errors: []
    };

    try {
      // Get user's plan features and limitations
      const planFeatures = this.marginGuardPlanService.getPlanFeatures(data.planType as PlanType);
      const planLimitations = this.marginGuardPlanService.getPlanLimitations(data.planType as PlanType);

      console.log('🔍 MARGIN GUARD EXECUTOR - Plan features:', planFeatures);
      console.log('🔍 MARGIN GUARD EXECUTOR - Plan limitations:', planLimitations);

      // Validate positions based on plan
      const validPositions = await this.validatePositionsForPlan(
        data.positions,
        data.config,
        planFeatures,
        planLimitations
      );

      if (validPositions.length === 0) {
        result.errors.push('No valid positions found for current plan');
        return result;
      }

      console.log('✅ MARGIN GUARD EXECUTOR - Valid positions:', validPositions.length);

      // Execute actions based on plan type
      switch (data.planType) {
        case 'free':
          await this.executeFreePlan(data, validPositions, result);
          break;
        case 'basic':
          await this.executeBasicPlan(data, validPositions, result);
          break;
        case 'advanced':
          await this.executeAdvancedPlan(data, validPositions, result);
          break;
        case 'pro':
          await this.executeProPlan(data, validPositions, result);
          break;
        case 'lifetime':
          await this.executeLifetimePlan(data, validPositions, result);
          break;
        default:
          result.errors.push(`Unsupported plan type: ${data.planType}`);
          return result;
      }

      // Send notifications based on plan
      await this.sendNotifications(data, result, planFeatures);

      result.success = result.errors.length === 0;

      // Log execution
      await this.automationLogger.logExecution(
        data.automationId,
        'margin_guard_execution',
        result.success ? 'success' : 'error',
        `Margin Guard executed for ${validPositions.length} positions`,
        result
      );

      console.log('✅ MARGIN GUARD EXECUTOR - Execution completed:', {
        success: result.success,
        actions: result.actions.length,
        notifications: result.notifications.length,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      console.error('❌ MARGIN GUARD EXECUTOR - Execution failed:', error);
      result.errors.push(`Execution failed: ${error.message}`);
      
      await this.automationLogger.logExecution(
        data.automationId,
        'margin_guard_execution',
        'error',
        `Margin Guard execution failed: ${error.message}`,
        { error: error.message }
      );

      return result;
    }
  }

  /**
   * Validate positions based on user's plan limitations
   */
  private async validatePositionsForPlan(
    positions: any[],
    config: any,
    planFeatures: any,
    planLimitations: any
  ): Promise<any[]> {
    let validPositions = [...positions];

    // Filter by plan limitations
    if (planLimitations.max_positions && planLimitations.max_positions !== -1) {
      if (config.selected_positions && config.selected_positions.length > 0) {
        // Free plan: only selected positions
        validPositions = positions.filter(pos => 
          config.selected_positions.includes(pos.id)
        );
      } else if (planLimitations.max_positions !== -1) {
        // Limit total positions
        validPositions = positions.slice(0, planLimitations.max_positions);
      }
    }

    // Filter by protection mode for Advanced/Pro/Lifetime
    if (config.protection_mode) {
      switch (config.protection_mode) {
        case 'unitario':
          // Only selected positions for unitario mode
          if (config.selected_positions && config.selected_positions.length > 0) {
            validPositions = positions.filter(pos => 
              config.selected_positions.includes(pos.id)
            );
          }
          break;
        case 'total':
          // All positions for total mode
          break;
        case 'both':
          // Both modes - use all positions
          break;
      }
    }

    return validPositions;
  }

  /**
   * Execute Margin Guard for Free plan (max 2 positions)
   */
  private async executeFreePlan(
    data: MarginGuardExecutionData,
    positions: any[],
    result: MarginGuardExecutionResult
  ): Promise<void> {
    console.log('🆓 MARGIN GUARD EXECUTOR - Executing Free plan logic');

    // Free plan: only process selected positions (max 2)
    const selectedPositions = positions.filter(pos => 
      data.config.selected_positions?.includes(pos.id)
    ).slice(0, 2);

    for (const position of selectedPositions) {
      await this.executePositionAction(position, data.config, result);
    }
  }

  /**
   * Execute Margin Guard for Basic plan (all positions, global config)
   */
  private async executeBasicPlan(
    data: MarginGuardExecutionData,
    positions: any[],
    result: MarginGuardExecutionResult
  ): Promise<void> {
    console.log('🔵 MARGIN GUARD EXECUTOR - Executing Basic plan logic');

    // Basic plan: all positions with global config
    for (const position of positions) {
      await this.executePositionAction(position, data.config, result);
    }
  }

  /**
   * Execute Margin Guard for Advanced plan (unitario + total modes)
   */
  private async executeAdvancedPlan(
    data: MarginGuardExecutionData,
    positions: any[],
    result: MarginGuardExecutionResult
  ): Promise<void> {
    console.log('🟣 MARGIN GUARD EXECUTOR - Executing Advanced plan logic');

    if (data.config.protection_mode === 'unitario') {
      // Unitario mode: selected positions only
      const selectedPositions = positions.filter(pos => 
        data.config.selected_positions?.includes(pos.id)
      );
      for (const position of selectedPositions) {
        await this.executePositionAction(position, data.config, result);
      }
    } else if (data.config.protection_mode === 'total') {
      // Total mode: all positions
      for (const position of positions) {
        await this.executePositionAction(position, data.config, result);
      }
    } else if (data.config.protection_mode === 'both') {
      // Both modes: process all positions
      for (const position of positions) {
        await this.executePositionAction(position, data.config, result);
      }
    }
  }

  /**
   * Execute Margin Guard for Pro plan (individual configs allowed)
   */
  private async executeProPlan(
    data: MarginGuardExecutionData,
    positions: any[],
    result: MarginGuardExecutionResult
  ): Promise<void> {
    console.log('🟠 MARGIN GUARD EXECUTOR - Executing Pro plan logic');

    for (const position of positions) {
      // Check if individual config exists for this position
      const individualConfig = data.config.individual_configs?.[position.id];
      
      if (individualConfig) {
        // Use individual configuration
        await this.executePositionAction(position, individualConfig, result);
      } else {
        // Use global configuration
        await this.executePositionAction(position, data.config, result);
      }
    }
  }

  /**
   * Execute Margin Guard for Lifetime plan (unlimited features)
   */
  private async executeLifetimePlan(
    data: MarginGuardExecutionData,
    positions: any[],
    result: MarginGuardExecutionResult
  ): Promise<void> {
    console.log('🟢 MARGIN GUARD EXECUTOR - Executing Lifetime plan logic');

    // Lifetime plan: same as Pro but with unlimited features
    await this.executeProPlan(data, positions, result);
  }

  /**
   * Execute action for a specific position
   */
  private async executePositionAction(
    position: any,
    config: any,
    result: MarginGuardExecutionResult
  ): Promise<void> {
    try {
      console.log('🔍 MARGIN GUARD EXECUTOR - Processing position:', {
        positionId: position.id,
        action: config.action,
        marginThreshold: config.margin_threshold
      });

      // Check if position needs protection
      const needsProtection = this.checkPositionNeedsProtection(position, config);
      
      if (!needsProtection) {
        console.log('⏭️ MARGIN GUARD EXECUTOR - Position does not need protection');
        return;
      }

      // Execute the configured action
      const actionResult = await this.executeAction(position, config);
      
      if (actionResult.success) {
        result.actions.push({
          positionId: position.id,
          action: config.action,
          amount: actionResult.amount,
          percentage: actionResult.percentage,
          newLiquidationDistance: actionResult.newLiquidationDistance
        });
      } else {
        result.errors.push(`Failed to execute action for position ${position.id}: ${actionResult.error}`);
      }

    } catch (error) {
      console.error('❌ MARGIN GUARD EXECUTOR - Position action failed:', error);
      result.errors.push(`Position ${position.id} action failed: ${error.message}`);
    }
  }

  /**
   * Check if position needs protection based on margin threshold
   */
  private checkPositionNeedsProtection(position: any, config: any): boolean {
    // Calculate current margin percentage
    const currentMargin = this.calculateMarginPercentage(position);
    const threshold = config.margin_threshold;

    console.log('🔍 MARGIN GUARD EXECUTOR - Margin check:', {
      positionId: position.id,
      currentMargin,
      threshold,
      needsProtection: currentMargin <= threshold
    });

    return currentMargin <= threshold;
  }

  /**
   * Calculate margin percentage for a position
   */
  private calculateMarginPercentage(position: any): number {
    // This is a simplified calculation - in production, this would use real LN Markets API
    // For now, we'll use a mock calculation based on position data
    const liquidationPrice = position.liquidation_price || 0;
    const currentPrice = position.current_price || 0;
    const margin = position.margin || 0;

    if (liquidationPrice === 0 || currentPrice === 0) {
      return 100; // Safe if no data
    }

    // Calculate how close we are to liquidation
    const distanceToLiquidation = Math.abs(currentPrice - liquidationPrice) / liquidationPrice;
    const marginPercentage = (1 - distanceToLiquidation) * 100;

    return Math.max(0, Math.min(100, marginPercentage));
  }

  /**
   * Execute the configured action for a position
   */
  private async executeAction(position: any, config: any): Promise<{
    success: boolean;
    amount?: number;
    percentage?: number;
    newLiquidationDistance?: number;
    error?: string;
  }> {
    try {
      switch (config.action) {
        case 'close_position':
          return await this.closePosition(position);
        case 'reduce_position':
          return await this.reducePosition(position, config.reduce_percentage);
        case 'add_margin':
          return await this.addMargin(position, config.add_margin_amount);
        case 'increase_liquidation_distance':
          return await this.increaseLiquidationDistance(position, config.new_liquidation_distance);
        default:
          return { success: false, error: `Unknown action: ${config.action}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Close position completely
   */
  private async closePosition(position: any): Promise<any> {
    console.log('🔴 MARGIN GUARD EXECUTOR - Closing position:', position.id);
    
    // TODO: Implement actual LN Markets API call to close position
    // For now, return success
    return { success: true };
  }

  /**
   * Reduce position by percentage
   */
  private async reducePosition(position: any, percentage: number): Promise<any> {
    console.log('🟡 MARGIN GUARD EXECUTOR - Reducing position:', {
      positionId: position.id,
      percentage
    });
    
    // TODO: Implement actual LN Markets API call to reduce position
    // For now, return success
    return { success: true, percentage };
  }

  /**
   * Add margin to position
   */
  private async addMargin(position: any, amount: number): Promise<any> {
    console.log('🟢 MARGIN GUARD EXECUTOR - Adding margin:', {
      positionId: position.id,
      amount
    });
    
    // TODO: Implement actual LN Markets API call to add margin
    // For now, return success
    return { success: true, amount };
  }

  /**
   * Increase liquidation distance
   */
  private async increaseLiquidationDistance(position: any, newDistance: number): Promise<any> {
    console.log('🔵 MARGIN GUARD EXECUTOR - Increasing liquidation distance:', {
      positionId: position.id,
      newDistance
    });
    
    // TODO: Implement actual LN Markets API call to increase liquidation distance
    // For now, return success
    return { success: true, newLiquidationDistance: newDistance };
  }

  /**
   * Send notifications based on plan features
   */
  private async sendNotifications(
    data: MarginGuardExecutionData,
    result: MarginGuardExecutionResult,
    planFeatures: any
  ): Promise<void> {
    const notifications = planFeatures.notifications || {};
    
    for (const [type, enabled] of Object.entries(notifications)) {
      if (enabled && result.actions.length > 0) {
        const notification = await this.sendNotification(type, data, result);
        result.notifications.push(notification);
      }
    }
  }

  /**
   * Send a specific notification
   */
  private async sendNotification(
    type: string,
    data: MarginGuardExecutionData,
    result: MarginGuardExecutionResult
  ): Promise<{ type: string; message: string; sent: boolean }> {
    const message = `Margin Guard executed ${result.actions.length} actions for ${data.positions.length} positions`;
    
    try {
      // TODO: Implement actual notification sending
      console.log(`📱 MARGIN GUARD EXECUTOR - Sending ${type} notification:`, message);
      
      return {
        type,
        message,
        sent: true
      };
    } catch (error) {
      console.error(`❌ MARGIN GUARD EXECUTOR - Failed to send ${type} notification:`, error);
      return {
        type,
        message,
        sent: false
      };
    }
  }
}
