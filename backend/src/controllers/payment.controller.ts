import { FastifyRequest, FastifyReply } from 'fastify';
import { lightningPaymentService } from '../services/lightning-payment.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentController {
  /**
   * Create a Lightning invoice for payment
   */
  async createInvoice(request: FastifyRequest<{ Body: { plan_type: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { plan_type } = request.body;

      // Validate plan type
      const validPlans = ['basic', 'advanced', 'pro', 'lifetime'];
      if (!validPlans.includes(plan_type)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid plan type. Must be: basic, advanced, pro, or lifetime',
        });
      }

      console.log(`💰 Creating invoice for user ${userId}, plan: ${plan_type}`);

      const invoice = await lightningPaymentService.createInvoice(userId, plan_type);

      reply.send({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      reply.code(500).send({
        success: false,
        error: error.message || 'Failed to create Lightning invoice',
      });
    }
  }

  /**
   * Check payment status
   */
  async checkPayment(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params;

      // Verify payment belongs to user
      const payment = await prisma.payment.findFirst({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!payment) {
        return reply.code(404).send({
          success: false,
          error: 'Payment not found',
        });
      }

      const isPaid = await lightningPaymentService.checkPayment(id);

      reply.send({
        success: true,
        data: {
          id,
          paid: isPaid,
          status: isPaid ? 'paid' : payment.status,
          amount_sats: payment.amount_sats,
          description: payment.description,
          created_at: payment.created_at,
          paid_at: payment.paid_at,
          expires_at: payment.expires_at,
        },
      });
    } catch (error: any) {
      console.error('Error checking payment:', error);
      reply.code(500).send({
        success: false,
        error: error.message || 'Failed to check payment status',
      });
    }
  }

  /**
   * Get payment status (alternative endpoint)
   */
  async getPaymentStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params;

      // Verify payment belongs to user
      const payment = await prisma.payment.findFirst({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!payment) {
        return reply.code(404).send({
          success: false,
          error: 'Payment not found',
        });
      }

      const status = await lightningPaymentService.getPaymentStatus(id);

      reply.send({
        success: true,
        data: status,
      });
    } catch (error: any) {
      console.error('Error getting payment status:', error);
      reply.code(error.message === 'Payment not found' ? 404 : 500).send({
        success: false,
        error: error.message || 'Failed to get payment status',
      });
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const limit = parseInt(request.query.limit || '20');

      const payments = await lightningPaymentService.getUserPayments(userId, limit);

      reply.send({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      console.error('Error fetching user payments:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch payment history',
      });
    }
  }

  /**
   * Retry expired payment
   */
  async retryPayment(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params;

      // Verify payment belongs to user
      const payment = await prisma.payment.findFirst({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!payment) {
        return reply.code(404).send({
          success: false,
          error: 'Payment not found',
        });
      }

      if (payment.status === 'paid') {
        return reply.code(400).send({
          success: false,
          error: 'Payment already completed',
        });
      }

      console.log(`🔄 Retrying payment ${id} for user ${userId}`);

      const newInvoice = await lightningPaymentService.retryPayment(id);

      reply.send({
        success: true,
        data: newInvoice,
        message: 'New invoice created successfully',
      });
    } catch (error: any) {
      console.error('Error retrying payment:', error);
      reply.code(500).send({
        success: false,
        error: error.message || 'Failed to retry payment',
      });
    }
  }

  /**
   * Get payment statistics for user
   */
  async getPaymentStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const payments = await prisma.payment.findMany({
        where: { user_id: userId },
      });

      const stats = {
        total_payments: payments.length,
        total_amount_paid: payments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount_sats, 0),
        successful_payments: payments.filter(p => p.status === 'paid').length,
        pending_payments: payments.filter(p => p.status === 'pending').length,
        failed_payments: payments.filter(p => p.status === 'failed').length,
        expired_payments: payments.filter(p => p.status === 'expired').length,
        success_rate: payments.length > 0
          ? (payments.filter(p => p.status === 'paid').length / payments.length) * 100
          : 0,
        last_payment: payments.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] || null,
      };

      reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching payment stats:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch payment statistics',
      });
    }
  }

  /**
   * Get available plan pricing
   */
  async getPlanPricing(request: FastifyRequest, reply: FastifyReply) {
    const pricing = {
      basic: {
        name: 'Basic',
        amount_sats: 21000,
        features: [
          'Margin Guard básico',
          'Até 3 automações simultâneas',
          'Notificações por Telegram',
          'Relatórios básicos',
        ],
      },
      advanced: {
        name: 'Advanced',
        amount_sats: 42000,
        features: [
          'Tudo do Basic',
          'Auto Entry + TP/SL',
          'Até 10 automações simultâneas',
          'Notificações WhatsApp + Email',
          'Backtests avançados',
          'Relatórios detalhados',
        ],
      },
      pro: {
        name: 'Pro',
        amount_sats: 84000,
        features: [
          'Tudo do Advanced',
          'Automação ilimitada',
          'Simulações customizadas',
          'API privada',
          'Suporte prioritário',
          'Relatórios em tempo real',
        ],
      },
      lifetime: {
        name: 'Lifetime',
        amount_sats: 210000,
        features: [
          'Tudo do Pro',
          'Acesso vitalício',
          'Atualizações gratuitas',
          'Suporte dedicado',
          'Recursos beta antecipados',
        ],
      },
    };

    reply.send({
      success: true,
      data: pricing,
    });
  }

  /**
   * Get Lightning network status
   */
  async getLightningStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const status = lightningPaymentService.getProvidersStatus();

      reply.send({
        success: true,
        data: {
          ...status,
          network_status: 'operational', // Could be enhanced with real network checks
          estimated_fee: 1, // sats
          average_confirmation_time: 10, // seconds
        },
      });
    } catch (error: any) {
      console.error('Error getting Lightning status:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get Lightning network status',
      });
    }
  }

  /**
   * Webhook endpoint for payment confirmations (for external providers)
   */
  async paymentWebhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { payment_hash, preimage } = request.body as any;

      console.log(`🔗 Payment webhook received for hash: ${payment_hash}`);

      // Find payment by hash
      const payment = await prisma.payment.findFirst({
        where: { payment_hash },
      });

      if (!payment) {
        console.warn(`Payment not found for hash: ${payment_hash}`);
        return reply.code(404).send({ error: 'Payment not found' });
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          paid_at: new Date(),
          preimage,
          updated_at: new Date(),
        },
      });

      // Upgrade user plan
      await prisma.user.update({
        where: { id: payment.user_id },
        data: {
          plan_type: payment.plan_type,
          updated_at: new Date(),
        },
      });

      // Log upgrade
      await prisma.userUpgradeHistory.create({
        data: {
          user_id: payment.user_id,
          old_plan: 'free',
          new_plan: payment.plan_type,
          reason: 'webhook_payment',
          effective_date: new Date(),
          upgraded_by: 'system',
        },
      });

      console.log(`✅ Payment ${payment.id} confirmed via webhook`);

      reply.send({
        success: true,
        message: 'Payment confirmed',
      });
    } catch (error: any) {
      console.error('Error processing payment webhook:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to process payment webhook',
      });
    }
  }
}

// Export singleton instance
export const paymentController = new PaymentController();

