/**
 * Automation Account Controller
 * 
 * Controller para gerenciar vinculação de automações com contas de exchange
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AutomationAccountService } from '../services/automation-account.service';
import { PrismaClient } from '@prisma/client';

// Validation schemas
const LinkAutomationSchema = z.object({
  automationId: z.string().uuid(),
  accountId: z.string().uuid(),
});

const MigrateAutomationsSchema = z.object({
  newAccountId: z.string().uuid().optional(),
});

const AccountParamsSchema = z.object({
  accountId: z.string().uuid(),
});

export class AutomationAccountController {
  private automationAccountService: AutomationAccountService;

  constructor(prisma: PrismaClient) {
    this.automationAccountService = new AutomationAccountService(prisma);
  }

  /**
   * 🔗 FASE 6.1.4.1: Vincular automação à conta ativa
   */
  async linkAutomationToActiveAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const body = LinkAutomationSchema.parse(request.body);

      console.log('🔗 AUTOMATION ACCOUNT CONTROLLER - Link automation to active account:', {
        userId: user?.id,
        automationId: body.automationId,
        accountId: body.accountId
      });

      const automation = await this.automationAccountService.linkAutomationToActiveAccount({
        userId: user?.id || '',
        automationId: body.automationId,
        accountId: body.accountId,
      });

      return reply.status(200).send({
        success: true,
        data: automation,
        message: 'Automation linked to active account successfully'
      });

    } catch (error: any) {
      console.error('❌ AUTOMATION ACCOUNT CONTROLLER - Error linking automation:', error);
      
      if (error.message.includes('not found') || error.message.includes('does not belong')) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: error.message
        });
      }

      if (error.message.includes('not active') || error.message.includes('invalid credentials')) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_ACCOUNT',
          message: error.message
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * 🔗 FASE 6.1.4.2: Migrar automações existentes
   */
  async migrateExistingAutomations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;

      console.log('🔄 AUTOMATION ACCOUNT CONTROLLER - Migrate existing automations for user:', user?.id);

      const result = await this.automationAccountService.migrateExistingAutomations(user?.id || '');

      return reply.status(200).send({
        success: result.success,
        data: result,
        message: result.success 
          ? `Migration completed: ${result.migratedCount} automations migrated`
          : `Migration failed: ${result.errors.join(', ')}`
      });

    } catch (error: any) {
      console.error('❌ AUTOMATION ACCOUNT CONTROLLER - Error migrating automations:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * 🔗 FASE 6.1.4.3: Validar limites da conta
   */
  async validateAccountLimits(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { accountId } = AccountParamsSchema.parse(request.params);
      const { automationType } = request.query as { automationType?: string };

      console.log('🔍 AUTOMATION ACCOUNT CONTROLLER - Validate account limits:', {
        userId: user?.id,
        accountId,
        automationType
      });

      const validation = await this.automationAccountService.validateAccountLimits(
        user?.id || '',
        accountId,
        automationType || 'margin_guard'
      );

      return reply.status(200).send({
        success: true,
        data: validation,
        message: validation.isValid 
          ? 'Account limits validation passed'
          : 'Account limits validation failed'
      });

    } catch (error: any) {
      console.error('❌ AUTOMATION ACCOUNT CONTROLLER - Error validating account limits:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Obter automações de uma conta específica
   */
  async getAutomationsByAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { accountId } = AccountParamsSchema.parse(request.params);

      console.log('🔍 AUTOMATION ACCOUNT CONTROLLER - Get automations for account:', {
        userId: user?.id,
        accountId
      });

      const automations = await this.automationAccountService.getAutomationsByAccount(
        user?.id || '',
        accountId
      );

      return reply.status(200).send({
        success: true,
        data: automations,
        count: automations.length
      });

    } catch (error: any) {
      console.error('❌ AUTOMATION ACCOUNT CONTROLLER - Error getting automations by account:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Obter estatísticas de automações por conta
   */
  async getAccountAutomationStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { accountId } = AccountParamsSchema.parse(request.params);

      console.log('📊 AUTOMATION ACCOUNT CONTROLLER - Get account automation stats:', {
        userId: user?.id,
        accountId
      });

      const stats = await this.automationAccountService.getAccountAutomationStats(
        user?.id || '',
        accountId
      );

      return reply.status(200).send({
        success: true,
        data: stats
      });

    } catch (error: any) {
      console.error('❌ AUTOMATION ACCOUNT CONTROLLER - Error getting account automation stats:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Migrar automações para nova conta ativa
   */
  async migrateToNewActiveAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const body = MigrateAutomationsSchema.parse(request.body);

      console.log('🔄 AUTOMATION ACCOUNT CONTROLLER - Migrate to new active account:', {
        userId: user?.id,
        newAccountId: body.newAccountId
      });

      if (!body.newAccountId) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'newAccountId is required'
        });
      }

      const result = await this.automationAccountService.migrateToNewActiveAccount(
        user?.id || '',
        body.newAccountId
      );

      return reply.status(200).send({
        success: result.success,
        data: result,
        message: result.success 
          ? `Migration completed: ${result.migratedCount} automations migrated to new account`
          : `Migration failed: ${result.errors.join(', ')}`
      });

    } catch (error: any) {
      console.error('❌ AUTOMATION ACCOUNT CONTROLLER - Error migrating to new active account:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }
}
