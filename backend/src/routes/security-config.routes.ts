import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { SecurityConfigController } from '../controllers/security-config.controller';
import { adminAuthMiddleware } from '../middleware/auth.middleware';

export async function securityConfigRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const securityConfigController = new SecurityConfigController(prisma);

  // Get all security configurations (admin only)
  fastify.get('/api/admin/security/configs', {
    preHandler: [adminAuthMiddleware],
    handler: securityConfigController.getConfigs.bind(securityConfigController)
  });

  // Update security configuration (admin only)
  fastify.put('/api/admin/security/configs/:key', {
    preHandler: [adminAuthMiddleware],
    handler: securityConfigController.updateConfig.bind(securityConfigController)
  });

  // Get security audit logs (admin only)
  fastify.get('/api/admin/security/audit-logs', {
    preHandler: [adminAuthMiddleware],
    handler: securityConfigController.getAuditLogs.bind(securityConfigController)
  });

  // Revoke all tokens for a user (admin only)
  fastify.post('/api/admin/security/revoke-tokens/:userId', {
    preHandler: [adminAuthMiddleware],
    handler: securityConfigController.revokeAllTokens.bind(securityConfigController)
  });

  // Clean up expired tokens (admin only)
  fastify.post('/api/admin/security/cleanup-tokens', {
    preHandler: [adminAuthMiddleware],
    handler: securityConfigController.cleanupTokens.bind(securityConfigController)
  });

  // Get security dashboard (admin only)
  fastify.get('/api/admin/security/dashboard', {
    preHandler: [adminAuthMiddleware],
    handler: securityConfigController.getDashboard.bind(securityConfigController)
  });
}
