import { FastifyInstance } from 'fastify';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function paymentRoutes(fastify: FastifyInstance) {
  // Apply authentication to protected routes
  fastify.addHook('preHandler', authenticate);

  // Create Lightning invoice
  fastify.post('/api/payments/lightning', {
    schema: {
      body: {
        type: 'object',
        required: ['plan_type'],
        properties: {
          plan_type: {
            type: 'string',
            enum: ['basic', 'advanced', 'pro', 'lifetime'],
          },
        },
      },
    },
  }, paymentController.createInvoice.bind(paymentController));

  // Check payment status
  fastify.get('/api/payments/:id/status', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, paymentController.checkPayment.bind(paymentController));

  // Get payment status (alternative endpoint)
  fastify.get('/api/payments/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, paymentController.getPaymentStatus.bind(paymentController));

  // Get user payment history
  fastify.get('/api/payments', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', default: '20' },
        },
      },
    },
  }, paymentController.getUserPayments.bind(paymentController));

  // Retry expired payment
  fastify.post('/api/payments/:id/retry', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, paymentController.retryPayment.bind(paymentController));

  // Get payment statistics
  fastify.get('/api/payments/stats', paymentController.getPaymentStats.bind(paymentController));

  // Get plan pricing information
  fastify.get('/api/payments/plans', paymentController.getPlanPricing.bind(paymentController));

  // Get Lightning network status
  fastify.get('/api/payments/lightning/status', paymentController.getLightningStatus.bind(paymentController));

  // Webhook endpoint (no authentication required)
  fastify.post('/api/webhooks/payments', {
    schema: {
      body: {
        type: 'object',
        properties: {
          payment_hash: { type: 'string' },
          preimage: { type: 'string' },
          amount: { type: 'number' },
        },
      },
    },
  }, paymentController.paymentWebhook.bind(paymentController));
}

