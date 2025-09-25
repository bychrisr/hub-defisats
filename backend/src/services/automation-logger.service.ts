import { PrismaClient } from '@prisma/client';

export interface AutomationStateChange {
  userId: string;
  automationId: string;
  automationType: string;
  oldState: boolean;
  newState: boolean;
  changeType: 'activation' | 'deactivation' | 'config_update';
  configChanges?: {
    old: any;
    new: any;
  };
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

export interface AutomationExecutionLog {
  userId: string;
  automationId: string;
  automationType: string;
  tradeId: string;
  action: string;
  status: 'success' | 'error';
  triggerData: {
    currentPrice: number;
    triggerPrice: number;
    distanceToLiquidation: number;
    marginThreshold: number;
    positionSide: 'b' | 's';
    entryPrice: number;
    liquidationPrice: number;
    currentMargin: number;
  };
  executionResult?: {
    marginAdded?: number;
    newLiquidationPrice?: number;
    newMarginAmount?: number;
    apiResponse?: any;
  };
  errorMessage?: string;
  executionTime: number; // milliseconds
  ipAddress?: string;
  userAgent?: string;
}

export class AutomationLoggerService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Log automation state changes (activation/deactivation)
   */
  async logStateChange(data: AutomationStateChange): Promise<void> {
    try {
      const action = data.changeType === 'activation' ? 'automation_activated' : 
                   data.changeType === 'deactivation' ? 'automation_deactivated' : 
                   'automation_config_updated';

      const oldValues = {
        is_active: data.oldState,
        ...(data.configChanges && { config: data.configChanges.old })
      };

      const newValues = {
        is_active: data.newState,
        ...(data.configChanges && { config: data.configChanges.new })
      };

      await this.prisma.auditLog.create({
        data: {
          user_id: data.userId,
          action,
          resource: 'automation',
          resource_id: data.automationId,
          old_values: oldValues,
          new_values: newValues,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          severity: 'info',
          details: {
            automation_type: data.automationType,
            change_type: data.changeType,
            reason: data.reason,
            timestamp: new Date().toISOString()
          }
        }
      });

      console.log(`📝 AUTOMATION LOGGER - State change logged:`, {
        userId: data.userId,
        automationId: data.automationId,
        action,
        oldState: data.oldState,
        newState: data.newState
      });

    } catch (error) {
      console.error('❌ AUTOMATION LOGGER - Failed to log state change:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Get automation state change history for a user
   */
  async getStateChangeHistory(userId: string, automationId?: string, limit: number = 50) {
    try {
      const whereClause: any = {
        user_id: userId,
        resource: 'automation',
        action: {
          in: ['automation_activated', 'automation_deactivated', 'automation_config_updated']
        }
      };

      if (automationId) {
        whereClause.resource_id = automationId;
      }

      const logs = await this.prisma.auditLog.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        select: {
          id: true,
          action: true,
          resource_id: true,
          old_values: true,
          new_values: true,
          details: true,
          created_at: true
        }
      });

      return logs.map(log => ({
        id: log.id,
        action: log.action,
        automation_id: log.resource_id,
        old_state: log.old_values?.is_active,
        new_state: log.new_values?.is_active,
        config_changes: {
          old: log.old_values?.config || {},
          new: log.new_values?.config || {}
        },
        automation_type: log.details?.automation_type,
        change_type: log.details?.change_type,
        reason: log.details?.reason,
        timestamp: log.created_at
      }));

    } catch (error) {
      console.error('❌ AUTOMATION LOGGER - Failed to get state change history:', error);
      return [];
    }
  }

  /**
   * Log automation execution (when automation is triggered)
   */
  async logExecution(data: AutomationExecutionLog): Promise<void> {
    try {
      const action = `automation_${data.status}`;
      
      await this.prisma.auditLog.create({
        data: {
          user_id: data.userId,
          action,
          resource: 'automation_execution',
          resource_id: data.automationId,
          old_values: {
            trade_id: data.tradeId,
            trigger_data: data.triggerData,
            execution_time: data.executionTime
          },
          new_values: {
            trade_id: data.tradeId,
            action: data.action,
            status: data.status,
            execution_result: data.executionResult,
            error_message: data.errorMessage
          },
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          severity: data.status === 'success' ? 'info' : 'error',
          details: {
            automation_type: data.automationType,
            trade_id: data.tradeId,
            action: data.action,
            trigger_data: data.triggerData,
            execution_result: data.executionResult,
            execution_time_ms: data.executionTime,
            timestamp: new Date().toISOString()
          }
        }
      });

      console.log(`📝 AUTOMATION LOGGER - Execution logged:`, {
        userId: data.userId,
        automationId: data.automationId,
        tradeId: data.tradeId,
        action: data.action,
        status: data.status
      });

    } catch (error) {
      console.error('❌ AUTOMATION LOGGER - Failed to log execution:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Get automation execution history
   */
  async getExecutionHistory(userId: string, automationId?: string, limit: number = 50) {
    try {
      const whereClause: any = {
        user_id: userId,
        resource: 'automation_execution',
        action: {
          in: ['automation_success', 'automation_error']
        }
      };

      if (automationId) {
        whereClause.resource_id = automationId;
      }

      const logs = await this.prisma.auditLog.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        select: {
          id: true,
          action: true,
          resource_id: true,
          old_values: true,
          new_values: true,
          details: true,
          created_at: true
        }
      });

      return logs.map(log => ({
        id: log.id,
        action: log.action,
        automation_id: log.resource_id,
        trade_id: log.old_values?.trade_id,
        status: log.new_values?.status,
        automation_action: log.new_values?.action,
        trigger_data: log.old_values?.trigger_data,
        execution_result: log.new_values?.execution_result,
        error_message: log.new_values?.error_message,
        execution_time_ms: log.old_values?.execution_time,
        automation_type: log.details?.automation_type,
        timestamp: log.created_at
      }));

    } catch (error) {
      console.error('❌ AUTOMATION LOGGER - Failed to get execution history:', error);
      return [];
    }
  }

  /**
   * Get automation execution statistics
   */
  async getExecutionStats(userId: string, automationId?: string) {
    try {
      const whereClause: any = {
        user_id: userId,
        resource: 'automation_execution',
        action: {
          in: ['automation_success', 'automation_error']
        }
      };

      if (automationId) {
        whereClause.resource_id = automationId;
      }

      const [totalExecutions, successCount, errorCount] = await Promise.all([
        this.prisma.auditLog.count({ where: whereClause }),
        this.prisma.auditLog.count({ 
          where: { ...whereClause, action: 'automation_success' }
        }),
        this.prisma.auditLog.count({ 
          where: { ...whereClause, action: 'automation_error' }
        })
      ]);

      return {
        total_executions: totalExecutions,
        successful_executions: successCount,
        failed_executions: errorCount,
        success_rate: totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0
      };

    } catch (error) {
      console.error('❌ AUTOMATION LOGGER - Failed to get execution stats:', error);
      return {
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        success_rate: 0
      };
    }
  }

  /**
   * Get automation state change statistics
   */
  async getStateChangeStats(userId: string, automationId?: string) {
    try {
      const whereClause: any = {
        user_id: userId,
        resource: 'automation',
        action: {
          in: ['automation_activated', 'automation_deactivated', 'automation_config_updated']
        }
      };

      if (automationId) {
        whereClause.resource_id = automationId;
      }

      const [totalChanges, activationCount, deactivationCount, configUpdateCount] = await Promise.all([
        this.prisma.auditLog.count({ where: whereClause }),
        this.prisma.auditLog.count({ 
          where: { ...whereClause, action: 'automation_activated' }
        }),
        this.prisma.auditLog.count({ 
          where: { ...whereClause, action: 'automation_deactivated' }
        }),
        this.prisma.auditLog.count({ 
          where: { ...whereClause, action: 'automation_config_updated' }
        })
      ]);

      return {
        total_changes: totalChanges,
        activations: activationCount,
        deactivations: deactivationCount,
        config_updates: configUpdateCount
      };

    } catch (error) {
      console.error('❌ AUTOMATION LOGGER - Failed to get state change stats:', error);
      return {
        total_changes: 0,
        activations: 0,
        deactivations: 0,
        config_updates: 0
      };
    }
  }
}
