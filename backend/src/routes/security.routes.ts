import { FastifyInstance } from 'fastify';
import { securityController } from '../controllers/security.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function securityRoutes(fastify: FastifyInstance) {
  // Apply authentication to protected routes
  fastify.addHook('preHandler', authenticate);

  // 2FA endpoints
  fastify.post('/api/security/2fa/setup', securityController.setup2FA.bind(securityController));
  fastify.post('/api/security/2fa/verify-setup', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 6, maxLength: 6 },
        },
      },
    },
  }, securityController.verify2FASetup.bind(securityController));
  fastify.post('/api/security/2fa/disable', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 6, maxLength: 6 },
        },
      },
    },
  }, securityController.disable2FA.bind(securityController));
  fastify.post('/api/security/2fa/regenerate-backup-codes', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 6, maxLength: 6 },
        },
      },
    },
  }, securityController.regenerateBackupCodes.bind(securityController));
  fastify.get('/api/security/2fa/status', securityController.get2FAStatus.bind(securityController));

  // CAPTCHA endpoints
  fastify.post('/api/security/captcha/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
          type: { type: 'string', enum: ['hcaptcha', 'recaptcha', 'recaptcha-v3'] },
        },
      },
    },
  }, securityController.verifyCaptcha.bind(securityController));
  fastify.get('/api/security/captcha/config', securityController.getCaptchaConfig.bind(securityController));

  // Security settings
  fastify.get('/api/security/settings', securityController.getSecuritySettings.bind(securityController));
  fastify.put('/api/security/preferences', securityController.updateSecurityPreferences.bind(securityController));

  // Security audit
  fastify.get('/api/security/audit-log', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '20' },
        },
      },
    },
  }, securityController.getSecurityAuditLog.bind(securityController));

  // Report suspicious activity
  fastify.post('/api/security/report-activity', {
    schema: {
      body: {
        type: 'object',
        required: ['activity', 'details'],
        properties: {
          activity: { type: 'string', minLength: 1, maxLength: 100 },
          details: { type: 'string', minLength: 1, maxLength: 500 },
        },
      },
    },
  }, securityController.reportSuspiciousActivity.bind(securityController));
}

