/**
 * Automation Account Service
 * 
 * Gerencia a vinculação de automações com contas de exchange
 * Inclui lógica de vinculação automática, migração e validação de limites
 */

import { PrismaClient, Automation, UserExchangeAccounts } from '@prisma/client';
import { UserExchangeAccountService } from './userExchangeAccount.service';
import { AutomationService } from './automation.service';
import { AutomationLoggerService } from './automation-logger.service';

export interface AutomationAccountData {
  userId: string;
  automationId: string;
  accountId: string;
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
}

export interface AccountLimitsValidation {
  isValid: boolean;
  currentCount: number;
  maxLimit: number;
  limitType: string;
  message?: string;
}

export class AutomationAccountService {
  private prisma: PrismaClient;
  private userExchangeAccountService: UserExchangeAccountService;
  private automationService: AutomationService;
  private automationLogger: AutomationLoggerService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.userExchangeAccountService = new UserExchangeAccountService(prisma);
    this.automationService = new AutomationService(prisma, new AutomationLoggerService(prisma));
    this.automationLogger = new AutomationLoggerService(prisma);
  }

  /**
   * 🔗 FASE 6.1.4.1: Lógica de vinculação automática
   * Vincula automaticamente uma automação à conta ativa do usuário
   */
  async linkAutomationToActiveAccount(data: AutomationAccountData): Promise<Automation> {
    console.log('🔗 AUTOMATION ACCOUNT SERVICE - Linking automation to active account:', {
      userId: data.userId,
      automationId: data.automationId,
      accountId: data.accountId
    });

    // Verificar se a conta existe e pertence ao usuário
    const account = await this.userExchangeAccountService.getUserExchangeAccount(
      data.userId,
      data.accountId
    );

    if (!account) {
      throw new Error(`Account ${data.accountId} not found or does not belong to user ${data.userId}`);
    }

    // Verificar se a conta está ativa
    if (!account.is_active) {
      throw new Error(`Account ${account.account_name} is not active. Only active accounts can be linked to automations.`);
    }

    // Verificar se a conta tem credenciais válidas
    if (!account.credentials || Object.keys(account.credentials).length === 0) {
      throw new Error(`Account ${account.account_name} does not have valid credentials configured`);
    }

    const hasValidCredentials = Object.values(account.credentials).some(value => 
      value && value.trim() !== ''
    );

    if (!hasValidCredentials) {
      throw new Error(`Account ${account.account_name} has empty or invalid credentials`);
    }

    // Atualizar a automação com a conta ativa
    const updatedAutomation = await this.prisma.automation.update({
      where: {
        id: data.automationId,
        user_id: data.userId,
      },
      data: {
        user_exchange_account_id: data.accountId,
        updated_at: new Date(),
      },
    });

    console.log('✅ AUTOMATION ACCOUNT SERVICE - Automation linked to active account:', {
      automationId: updatedAutomation.id,
      accountId: data.accountId,
      accountName: account.account_name,
      exchangeName: account.exchange.name
    });

    // Log da vinculação
    await this.automationLogger.logStateChange({
      userId: data.userId,
      automationId: data.automationId,
      automationType: updatedAutomation.type,
      oldState: false,
      newState: true,
      changeType: 'account_linking',
      reason: `Automation linked to active account ${account.account_name}`
    });

    return updatedAutomation;
  }

  /**
   * 🔗 FASE 6.1.4.2: Migração de automações existentes
   * Migra automações existentes para a conta ativa do usuário
   */
  async migrateExistingAutomations(userId: string): Promise<MigrationResult> {
    console.log('🔄 AUTOMATION ACCOUNT SERVICE - Starting migration for user:', userId);

    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: []
    };

    try {
      // Buscar automações existentes sem conta vinculada
      const existingAutomations = await this.prisma.automation.findMany({
        where: {
          user_id: userId,
          user_exchange_account_id: null,
        },
      });

      if (existingAutomations.length === 0) {
        console.log('✅ AUTOMATION ACCOUNT SERVICE - No automations to migrate');
        return result;
      }

      // Buscar conta ativa do usuário
      const userAccounts = await this.userExchangeAccountService.getUserExchangeAccounts(userId);
      const activeAccount = userAccounts.find(account => account.is_active);

      if (!activeAccount) {
        const error = 'No active account found for migration';
        console.log('⚠️ AUTOMATION ACCOUNT SERVICE -', error);
        result.success = false;
        result.errors.push(error);
        return result;
      }

      console.log('🔍 AUTOMATION ACCOUNT SERVICE - Found active account for migration:', {
        accountId: activeAccount.id,
        accountName: activeAccount.account_name,
        exchangeName: activeAccount.exchange.name
      });

      // Migrar cada automação
      for (const automation of existingAutomations) {
        try {
          await this.prisma.automation.update({
            where: {
              id: automation.id,
            },
            data: {
              user_exchange_account_id: activeAccount.id,
              updated_at: new Date(),
            },
          });

          result.migratedCount++;

          console.log('✅ AUTOMATION ACCOUNT SERVICE - Migrated automation:', {
            automationId: automation.id,
            automationType: automation.type,
            accountId: activeAccount.id
          });

          // Log da migração
          await this.automationLogger.logStateChange({
            userId: userId,
            automationId: automation.id,
            automationType: automation.type,
            oldState: false,
            newState: true,
            changeType: 'migration',
            reason: `Automation migrated to active account ${activeAccount.account_name}`
          });

        } catch (error: any) {
          const errorMsg = `Failed to migrate automation ${automation.id}: ${error.message}`;
          console.error('❌ AUTOMATION ACCOUNT SERVICE -', errorMsg);
          result.errors.push(errorMsg);
        }
      }

      console.log('✅ AUTOMATION ACCOUNT SERVICE - Migration completed:', {
        migratedCount: result.migratedCount,
        errorsCount: result.errors.length
      });

    } catch (error: any) {
      const errorMsg = `Migration failed: ${error.message}`;
      console.error('❌ AUTOMATION ACCOUNT SERVICE -', errorMsg);
      result.success = false;
      result.errors.push(errorMsg);
    }

    return result;
  }

  /**
   * 🔗 FASE 6.1.4.3: Validação de limites por conta
   * Valida se o usuário pode criar mais automações para uma conta específica
   */
  async validateAccountLimits(userId: string, accountId: string, automationType: string): Promise<AccountLimitsValidation> {
    console.log('🔍 AUTOMATION ACCOUNT SERVICE - Validating account limits:', {
      userId,
      accountId,
      automationType
    });

    try {
      // Buscar conta do usuário
      const account = await this.userExchangeAccountService.getUserExchangeAccount(userId, accountId);
      
      if (!account) {
        return {
          isValid: false,
          currentCount: 0,
          maxLimit: 0,
          limitType: 'account_not_found',
          message: 'Account not found or does not belong to user'
        };
      }

      // Contar automações ativas para esta conta
      const currentCount = await this.prisma.automation.count({
        where: {
          user_id: userId,
          user_exchange_account_id: accountId,
          is_active: true,
        },
      });

      // Buscar limites do plano do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan_type: true }
      });

      if (!user) {
        return {
          isValid: false,
          currentCount,
          maxLimit: 0,
          limitType: 'user_not_found',
          message: 'User not found'
        };
      }

      // Buscar limites do plano
      const planLimits = await this.prisma.planLimits.findFirst({
        where: {
          plan: {
            slug: user.plan_type
          }
        }
      });

      if (!planLimits) {
        return {
          isValid: false,
          currentCount,
          maxLimit: 0,
          limitType: 'plan_limits_not_found',
          message: 'Plan limits not found'
        };
      }

      const maxLimit = planLimits.max_automations;
      const isValid = maxLimit === -1 || currentCount < maxLimit;

      console.log('🔍 AUTOMATION ACCOUNT SERVICE - Account limits validation:', {
        currentCount,
        maxLimit,
        isValid,
        limitType: 'automations_per_account'
      });

      return {
        isValid,
        currentCount,
        maxLimit,
        limitType: 'automations_per_account',
        message: isValid 
          ? `Account can have ${maxLimit === -1 ? 'unlimited' : maxLimit} automations (current: ${currentCount})`
          : `Account limit reached: ${currentCount}/${maxLimit} automations`
      };

    } catch (error: any) {
      console.error('❌ AUTOMATION ACCOUNT SERVICE - Error validating account limits:', error);
      return {
        isValid: false,
        currentCount: 0,
        maxLimit: 0,
        limitType: 'validation_error',
        message: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Obter automações de uma conta específica
   */
  async getAutomationsByAccount(userId: string, accountId: string): Promise<Automation[]> {
    console.log('🔍 AUTOMATION ACCOUNT SERVICE - Getting automations for account:', {
      userId,
      accountId
    });

    const automations = await this.prisma.automation.findMany({
      where: {
        user_id: userId,
        user_exchange_account_id: accountId,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user_exchange_account: {
          include: {
            exchange: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
    });

    console.log('✅ AUTOMATION ACCOUNT SERVICE - Found automations:', {
      count: automations.length,
      accountId
    });

    return automations;
  }

  /**
   * Obter estatísticas de automações por conta
   */
  async getAccountAutomationStats(userId: string, accountId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  }> {
    console.log('📊 AUTOMATION ACCOUNT SERVICE - Getting account automation stats:', {
      userId,
      accountId
    });

    // Contar total de automações
    const [total, active, inactive] = await Promise.all([
      this.prisma.automation.count({
        where: { user_id: userId, user_exchange_account_id: accountId },
      }),
      this.prisma.automation.count({
        where: { user_id: userId, user_exchange_account_id: accountId, is_active: true },
      }),
      this.prisma.automation.count({
        where: { user_id: userId, user_exchange_account_id: accountId, is_active: false },
      }),
    ]);

    // Contar por tipo
    const byType = await this.prisma.automation.groupBy({
      by: ['type'],
      where: { user_id: userId, user_exchange_account_id: accountId },
      _count: { type: true },
    });

    const byTypeMap: Record<string, number> = {
      margin_guard: 0,
      tp_sl: 0,
      auto_entry: 0,
    };

    byType.forEach(item => {
      byTypeMap[item.type] = item._count.type;
    });

    const stats = {
      total,
      active,
      inactive,
      byType: byTypeMap,
    };

    console.log('📊 AUTOMATION ACCOUNT SERVICE - Account automation stats:', stats);

    return stats;
  }

  /**
   * Migrar automações para nova conta ativa
   */
  async migrateToNewActiveAccount(userId: string, newAccountId: string): Promise<MigrationResult> {
    console.log('🔄 AUTOMATION ACCOUNT SERVICE - Migrating to new active account:', {
      userId,
      newAccountId
    });

    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: []
    };

    try {
      // Buscar todas as automações ativas do usuário
      const activeAutomations = await this.prisma.automation.findMany({
        where: {
          user_id: userId,
          is_active: true,
        },
      });

      if (activeAutomations.length === 0) {
        console.log('✅ AUTOMATION ACCOUNT SERVICE - No active automations to migrate');
        return result;
      }

      // Verificar se a nova conta existe e está ativa
      const newAccount = await this.userExchangeAccountService.getUserExchangeAccount(userId, newAccountId);
      
      if (!newAccount || !newAccount.is_active) {
        const error = 'New account not found or not active';
        console.log('⚠️ AUTOMATION ACCOUNT SERVICE -', error);
        result.success = false;
        result.errors.push(error);
        return result;
      }

      // Migrar cada automação ativa
      for (const automation of activeAutomations) {
        try {
          await this.prisma.automation.update({
            where: {
              id: automation.id,
            },
            data: {
              user_exchange_account_id: newAccountId,
              updated_at: new Date(),
            },
          });

          result.migratedCount++;

          console.log('✅ AUTOMATION ACCOUNT SERVICE - Migrated automation to new account:', {
            automationId: automation.id,
            automationType: automation.type,
            newAccountId
          });

          // Log da migração
          await this.automationLogger.logStateChange({
            userId: userId,
            automationId: automation.id,
            automationType: automation.type,
            oldState: false,
            newState: true,
            changeType: 'account_migration',
            reason: `Automation migrated to new active account ${newAccount.account_name}`
          });

        } catch (error: any) {
          const errorMsg = `Failed to migrate automation ${automation.id}: ${error.message}`;
          console.error('❌ AUTOMATION ACCOUNT SERVICE -', errorMsg);
          result.errors.push(errorMsg);
        }
      }

      console.log('✅ AUTOMATION ACCOUNT SERVICE - Migration to new account completed:', {
        migratedCount: result.migratedCount,
        errorsCount: result.errors.length
      });

    } catch (error: any) {
      const errorMsg = `Migration to new account failed: ${error.message}`;
      console.error('❌ AUTOMATION ACCOUNT SERVICE -', errorMsg);
      result.success = false;
      result.errors.push(errorMsg);
    }

    return result;
  }
}
