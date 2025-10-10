/**
 * Testnet Faucet Controller
 * 
 * Controller for handling testnet faucet API requests including
 * distribution creation, status checking, and statistics.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { TestnetFaucetService, FaucetRequest } from '../services/testnet-faucet.service';
import { getLNDService } from '../services/lnd/LNDService';

export class TestnetFaucetController {
  private prisma: PrismaClient;
  private faucetService: TestnetFaucetService;

  constructor() {
    this.prisma = new PrismaClient();
    this.faucetService = new TestnetFaucetService(this.prisma, undefined, console);
  }

  /**
   * GET /api/testnet-faucet/info - Get faucet information
   */
  async getFaucetInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const availability = await this.faucetService.isFaucetAvailable();
      const config = this.faucetService.getConfig();
      
      return reply.status(200).send({
        success: true,
        data: {
          available: availability.available,
          reason: availability.reason,
          config: {
            maxAmount: config.maxAmount,
            minAmount: config.minAmount,
            rateLimitHours: config.rateLimitHours,
            userRateLimit: config.userRateLimit,
            ipRateLimit: config.ipRateLimit
          }
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to get faucet info:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get faucet info'
      });
    }
  }

  /**
   * POST /api/testnet-faucet/request - Request testnet sats
   */
  async requestSats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const user = (request as any).user;
      
      // Validate request body
      if (!body.amount || typeof body.amount !== 'number') {
        return reply.status(400).send({
          success: false,
          error: 'Amount is required and must be a number'
        });
      }

      // Get IP address from request
      const ipAddress = request.ip || 
                       (request.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                       'unknown';

      // Create faucet request
      const faucetRequest: FaucetRequest = {
        amount: body.amount,
        ipAddress,
        userId: user?.id,
        memo: body.memo || `Testnet faucet request - ${body.amount} sats`
      };

      // Create distribution
      const distribution = await this.faucetService.createDistribution(faucetRequest);

      return reply.status(201).send({
        success: true,
        data: {
          id: distribution.id,
          amount: distribution.amount_sats,
          invoice: distribution.invoice_bolt11,
          paymentHash: distribution.payment_hash,
          status: distribution.status,
          expiresAt: distribution.expires_at,
          createdAt: distribution.created_at
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to request testnet sats:', error);
      
      // Handle specific error types
      if (error.message.includes('rate limit')) {
        return reply.status(429).send({
          success: false,
          error: error.message
        });
      }
      
      if (error.message.includes('Amount too')) {
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }

      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to request testnet sats'
      });
    }
  }

  /**
   * GET /api/testnet-faucet/request/:id - Get request status
   */
  async getRequestStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      if (!id) {
        return reply.status(400).send({
          success: false,
          error: 'Request ID is required'
        });
      }

      const distribution = await this.faucetService.getDistribution(id);
      
      if (!distribution) {
        return reply.status(404).send({
          success: false,
          error: 'Distribution not found'
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          id: distribution.id,
          amount: distribution.amount_sats,
          invoice: distribution.invoice_bolt11,
          paymentHash: distribution.payment_hash,
          status: distribution.status,
          expiresAt: distribution.expires_at,
          paidAt: distribution.paid_at,
          createdAt: distribution.created_at,
          updatedAt: distribution.updated_at
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to get request status:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get request status'
      });
    }
  }

  /**
   * GET /api/testnet-faucet/history - Get distribution history
   */
  async getHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const query = request.query as any;
      
      const limit = parseInt(query.limit) || 50;
      const offset = parseInt(query.offset) || 0;
      
      // Get IP address for filtering
      const ipAddress = request.ip || 
                       (request.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                       'unknown';

      const distributions = await this.faucetService.getDistributionHistory(
        limit,
        offset,
        ipAddress,
        user?.id
      );

      return reply.status(200).send({
        success: true,
        data: {
          distributions: distributions.map(dist => ({
            id: dist.id,
            amount: dist.amount_sats,
            status: dist.status,
            expiresAt: dist.expires_at,
            paidAt: dist.paid_at,
            createdAt: dist.created_at
          })),
          pagination: {
            limit,
            offset,
            total: distributions.length
          }
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to get distribution history:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get distribution history'
      });
    }
  }

  /**
   * GET /api/testnet-faucet/stats - Get faucet statistics
   */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.faucetService.getFaucetStats();
      
      return reply.status(200).send({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('❌ Failed to get faucet stats:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get faucet stats'
      });
    }
  }

  /**
   * POST /api/testnet-faucet/webhook - Webhook for payment notifications
   */
  async webhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      
      // This would be called by LND when a payment is received
      // For now, we'll implement a simple polling mechanism
      // In a real implementation, you'd set up webhooks or use LND's streaming API
      
      console.log('🔔 Faucet webhook received:', body);
      
      return reply.status(200).send({
        success: true,
        message: 'Webhook received'
      });
    } catch (error: any) {
      console.error('❌ Failed to process webhook:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to process webhook'
      });
    }
  }

  /**
   * POST /api/testnet-faucet/cleanup - Cleanup expired distributions
   */
  async cleanup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      
      // Only allow admins to trigger cleanup
      if (!user || !user.is_admin) {
        return reply.status(403).send({
          success: false,
          error: 'Admin access required'
        });
      }

      const cleanedCount = await this.faucetService.cleanupExpiredDistributions();
      
      return reply.status(200).send({
        success: true,
        data: {
          cleanedCount,
          message: `Cleaned up ${cleanedCount} expired distributions`
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to cleanup distributions:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to cleanup distributions'
      });
    }
  }
}
