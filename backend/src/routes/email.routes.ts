import { FastifyInstance } from 'fastify';
import { EmailService } from '../services/email.service';
import { z } from 'zod';

const TestEmailSchema = z.object({
  to: z.string().email('Email inválido'),
});

/**
 * Rotas de Email (desenvolvimento e debug)
 */
export async function emailRoutes(fastify: FastifyInstance) {
  const emailService = new EmailService();

  /**
   * GET /api/email/test-connection
   * Testa a conexão SMTP
   */
  fastify.get('/api/email/test-connection', async (request, reply) => {
    try {
      const isConnected = await emailService.testConnection();
      
      return {
        success: isConnected,
        message: isConnected 
          ? 'Email service is working correctly' 
          : 'Email service connection failed',
        config: {
          host: process.env.SMTP_HOST || 'mailhog',
          port: process.env.SMTP_PORT || '1025',
          from: process.env.EMAIL_FROM || 'noreply@axisor.local',
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Error testing email connection',
        error: error.message,
      });
    }
  });

  /**
   * POST /api/email/test-send
   * Envia um email de teste
   */
  fastify.post('/api/email/test-send', async (request, reply) => {
    try {
      const { to } = TestEmailSchema.parse(request.body);
      
      await emailService.sendTestEmail(to);
      
      return {
        success: true,
        message: `Test email sent to ${to}`,
        mailhog: 'http://localhost:8025',
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Error sending test email',
        error: error.message,
      });
    }
  });

  /**
   * POST /api/email/test-verification
   * Envia um email de verificação de teste
   */
  fastify.post('/api/email/test-verification', async (request, reply) => {
    try {
      const { to } = TestEmailSchema.parse(request.body);
      const testToken = 'test-token-' + Date.now();
      
      await emailService.sendVerificationEmail(to, testToken);
      
      return {
        success: true,
        message: `Verification email sent to ${to}`,
        token: testToken,
        mailhog: 'http://localhost:8025',
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Error sending verification email',
        error: error.message,
      });
    }
  });

  /**
   * POST /api/email/test-code
   * Envia um email com código de verificação de teste
   */
  fastify.post('/api/email/test-code', async (request, reply) => {
    try {
      const { to } = TestEmailSchema.parse(request.body);
      const testCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      await emailService.sendVerificationCodeEmail(to, testCode);
      
      return {
        success: true,
        message: `Verification code email sent to ${to}`,
        code: testCode,
        mailhog: 'http://localhost:8025',
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Error sending verification code',
        error: error.message,
      });
    }
  });

  fastify.log.info('📧 Email routes registered (dev/debug endpoints)');
}


