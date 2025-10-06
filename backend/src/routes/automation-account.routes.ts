/**
 * Automation Account Routes
 * 
 * Rotas para gerenciar vinculação de automações com contas de exchange
 */

import { FastifyInstance } from 'fastify';
import { AutomationAccountController } from '../controllers/automation-account.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function automationAccountRoutes(fastify: FastifyInstance) {
  const automationAccountController = new AutomationAccountController(fastify.prisma);

  // 🔗 FASE 6.1.4.1: Vincular automação à conta ativa
  fastify.post('/automation-account/link', {
    preHandler: [authMiddleware],
    handler: automationAccountController.linkAutomationToActiveAccount.bind(automationAccountController)
  });

  // 🔗 FASE 6.1.4.2: Migrar automações existentes
  fastify.post('/automation-account/migrate', {
    preHandler: [authMiddleware],
    handler: automationAccountController.migrateExistingAutomations.bind(automationAccountController)
  });

  // 🔗 FASE 6.1.4.3: Validar limites da conta
  fastify.get('/automation-account/:accountId/validate-limits', {
    preHandler: [authMiddleware],
    handler: automationAccountController.validateAccountLimits.bind(automationAccountController)
  });

  // Obter automações de uma conta específica
  fastify.get('/automation-account/:accountId/automations', {
    preHandler: [authMiddleware],
    handler: automationAccountController.getAutomationsByAccount.bind(automationAccountController)
  });

  // Obter estatísticas de automações por conta
  fastify.get('/automation-account/:accountId/stats', {
    preHandler: [authMiddleware],
    handler: automationAccountController.getAccountAutomationStats.bind(automationAccountController)
  });

  // Migrar automações para nova conta ativa
  fastify.post('/automation-account/migrate-to-new', {
    preHandler: [authMiddleware],
    handler: automationAccountController.migrateToNewActiveAccount.bind(automationAccountController)
  });
}
