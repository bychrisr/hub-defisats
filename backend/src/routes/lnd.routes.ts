/**
 * LND Routes
 * 
 * API routes for LND (Lightning Network Daemon) integration.
 */

import { FastifyInstance } from 'fastify';
import { LNDController } from '../controllers/lnd.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const lndController = new LNDController();

export async function lndRoutes(fastify: FastifyInstance) {
  // ============================================================================
  // INFO ROUTES
  // ============================================================================

  // Get node information
  fastify.get('/api/lnd/info', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getInfo(request, reply);
  });

  // Get network information
  fastify.get('/api/lnd/network-info', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getNetworkInfo(request, reply);
  });

  // Get node metrics
  fastify.get('/api/lnd/metrics', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getMetrics(request, reply);
  });

  // ============================================================================
  // WALLET ROUTES
  // ============================================================================

  // Get total balance (on-chain + channels)
  fastify.get('/api/lnd/wallet/balance', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getTotalBalance(request, reply);
  });

  // Get on-chain balance
  fastify.get('/api/lnd/wallet/balance/onchain', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getOnchainBalance(request, reply);
  });

  // Get channel balance
  fastify.get('/api/lnd/wallet/balance/channels', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getChannelBalance(request, reply);
  });

  // List UTXOs
  fastify.get('/api/lnd/wallet/utxos', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listUTXOs(request, reply);
  });

  // Estimate fee
  fastify.post('/api/lnd/wallet/estimate-fee', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.estimateFee(request, reply);
  });

  // ============================================================================
  // INVOICE ROUTES
  // ============================================================================

  // Create invoice
  fastify.post('/api/lnd/invoices', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.createInvoice(request, reply);
  });

  // Create HODL invoice
  fastify.post('/api/lnd/invoices/hold', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.createHoldInvoice(request, reply);
  });

  // Get invoice by payment hash
  fastify.get('/api/lnd/invoices/:paymentHash', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getInvoice(request, reply);
  });

  // List invoices
  fastify.get('/api/lnd/invoices', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listInvoices(request, reply);
  });

  // Settle invoice
  fastify.post('/api/lnd/invoices/:paymentHash/settle', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.settleInvoice(request, reply);
  });

  // Cancel invoice
  fastify.post('/api/lnd/invoices/:paymentHash/cancel', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.cancelInvoice(request, reply);
  });

  // Decode payment request
  fastify.post('/api/lnd/invoices/decode', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.decodePaymentRequest(request, reply);
  });

  // ============================================================================
  // PAYMENT ROUTES
  // ============================================================================

  // Send payment
  fastify.post('/api/lnd/payments', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.sendPayment(request, reply);
  });

  // Pay invoice
  fastify.post('/api/lnd/payments/invoice', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.payInvoice(request, reply);
  });

  // Get payment details
  fastify.get('/api/lnd/payments/:paymentHash', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getPayment(request, reply);
  });

  // List payments
  fastify.get('/api/lnd/payments', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listPayments(request, reply);
  });

  // Track payment
  fastify.post('/api/lnd/payments/:paymentHash/track', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.trackPayment(request, reply);
  });

  // Estimate route fee
  fastify.post('/api/lnd/payments/estimate-route', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.estimateRouteFee(request, reply);
  });

  // ============================================================================
  // CHANNEL ROUTES
  // ============================================================================

  // List active channels
  fastify.get('/api/lnd/channels', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listChannels(request, reply);
  });

  // List pending channels
  fastify.get('/api/lnd/channels/pending', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listPendingChannels(request, reply);
  });

  // List closed channels
  fastify.get('/api/lnd/channels/closed', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listClosedChannels(request, reply);
  });

  // Open channel
  fastify.post('/api/lnd/channels/open', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.openChannel(request, reply);
  });

  // Close channel
  fastify.post('/api/lnd/channels/:channelPoint/close', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.closeChannel(request, reply);
  });

  // Update channel policy
  fastify.post('/api/lnd/channels/:channelPoint/update-policy', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.updateChannelPolicy(request, reply);
  });

  // Export channel backup
  fastify.get('/api/lnd/channels/backup', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.exportChannelBackup(request, reply);
  });

  // Restore channel backup
  fastify.post('/api/lnd/channels/restore', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.restoreChannelBackup(request, reply);
  });

  // ============================================================================
  // PEER ROUTES
  // ============================================================================

  // List peers
  fastify.get('/api/lnd/peers', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listPeers(request, reply);
  });

  // Connect peer
  fastify.post('/api/lnd/peers/connect', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.connectPeer(request, reply);
  });

  // Disconnect peer
  fastify.post('/api/lnd/peers/:pubkey/disconnect', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.disconnectPeer(request, reply);
  });

  // ============================================================================
  // ON-CHAIN ROUTES
  // ============================================================================

  // Generate new address
  fastify.post('/api/lnd/onchain/address', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.generateAddress(request, reply);
  });

  // Send BTC on-chain
  fastify.post('/api/lnd/onchain/send', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.sendCoins(request, reply);
  });

  // Send BTC to multiple addresses
  fastify.post('/api/lnd/onchain/send-many', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.sendMany(request, reply);
  });

  // List on-chain transactions
  fastify.get('/api/lnd/onchain/transactions', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listTransactions(request, reply);
  });

  // Get specific transaction
  fastify.get('/api/lnd/onchain/transactions/:txid', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getTransaction(request, reply);
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  // Switch network (admin only)
  fastify.post('/api/lnd/network/switch', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.switchNetwork(request, reply);
  });

  // Get service status
  fastify.get('/api/lnd/status', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getStatus(request, reply);
  });

  // Health check
  fastify.get('/api/lnd/health', async (request, reply) => {
    return lndController.healthCheck(request, reply);
  });

  // GET /api/lnd/version - Get LND version
  fastify.get('/api/lnd/version', {
    schema: {
      description: 'Get LND version information',
      tags: ['LND'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                version: { type: 'string' },
                commit_hash: { type: 'string' },
                build_tags: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const info = await lndService.info!.getInfo();
      
      return reply.status(200).send({
        success: true,
        data: {
          version: info.version || 'unknown',
          commit_hash: info.commit_hash || 'unknown',
          build_tags: info.build_tags || []
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to get LND version:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get LND version'
      });
    }
  });
}
