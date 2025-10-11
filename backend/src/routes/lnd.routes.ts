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
  fastify.get('/info', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getInfo(request, reply);
  });

  // Get network information
  fastify.get('/network-info', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getNetworkInfo(request, reply);
  });

  // Get node metrics
  fastify.get('/metrics', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getMetrics(request, reply);
  });

  // ============================================================================
  // WALLET ROUTES
  // ============================================================================

  // Get total balance (on-chain + channels)
  fastify.get('/wallet/balance', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getTotalBalance(request, reply);
  });

  // Get on-chain balance
  fastify.get('/wallet/balance/onchain', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getOnchainBalance(request, reply);
  });

  // Get channel balance
  fastify.get('/wallet/balance/channels', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getChannelBalance(request, reply);
  });

  // List UTXOs
  fastify.get('/wallet/utxos', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listUTXOs(request, reply);
  });

  // Estimate fee
  fastify.post('/wallet/estimate-fee', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.estimateFee(request, reply);
  });

  // ============================================================================
  // INVOICE ROUTES
  // ============================================================================

  // Create invoice
  fastify.post('/invoices', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.createInvoice(request, reply);
  });

  // Create HODL invoice
  fastify.post('/invoices/hold', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.createHoldInvoice(request, reply);
  });

  // Get invoice by payment hash
  fastify.get('/invoices/:paymentHash', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getInvoice(request, reply);
  });

  // List invoices
  fastify.get('/invoices', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listInvoices(request, reply);
  });

  // Settle invoice
  fastify.post('/invoices/:paymentHash/settle', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.settleInvoice(request, reply);
  });

  // Cancel invoice
  fastify.post('/invoices/:paymentHash/cancel', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.cancelInvoice(request, reply);
  });

  // Decode payment request
  fastify.post('/invoices/decode', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.decodePaymentRequest(request, reply);
  });

  // ============================================================================
  // PAYMENT ROUTES
  // ============================================================================

  // Send payment
  fastify.post('/payments', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.sendPayment(request, reply);
  });

  // Pay invoice
  fastify.post('/payments/invoice', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.payInvoice(request, reply);
  });

  // Get payment details
  fastify.get('/payments/:paymentHash', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getPayment(request, reply);
  });

  // List payments
  fastify.get('/payments', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listPayments(request, reply);
  });

  // Track payment
  fastify.post('/payments/:paymentHash/track', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.trackPayment(request, reply);
  });

  // Estimate route fee
  fastify.post('/payments/estimate-route', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.estimateRouteFee(request, reply);
  });

  // ============================================================================
  // CHANNEL ROUTES
  // ============================================================================

  // List active channels
  fastify.get('/channels', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listChannels(request, reply);
  });

  // List pending channels
  fastify.get('/channels/pending', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listPendingChannels(request, reply);
  });

  // List closed channels
  fastify.get('/channels/closed', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listClosedChannels(request, reply);
  });

  // Open channel
  fastify.post('/channels/open', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.openChannel(request, reply);
  });

  // Close channel
  fastify.post('/channels/:channelPoint/close', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.closeChannel(request, reply);
  });

  // Update channel policy
  fastify.post('/channels/:channelPoint/update-policy', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.updateChannelPolicy(request, reply);
  });

  // Export channel backup
  fastify.get('/channels/backup', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.exportChannelBackup(request, reply);
  });

  // Restore channel backup
  fastify.post('/channels/restore', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.restoreChannelBackup(request, reply);
  });

  // ============================================================================
  // PEER ROUTES
  // ============================================================================

  // List peers
  fastify.get('/peers', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listPeers(request, reply);
  });

  // Connect peer
  fastify.post('/peers/connect', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.connectPeer(request, reply);
  });

  // Disconnect peer
  fastify.post('/peers/:pubkey/disconnect', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.disconnectPeer(request, reply);
  });

  // ============================================================================
  // ON-CHAIN ROUTES
  // ============================================================================

  // Generate new address
  fastify.post('/onchain/address', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.generateAddress(request, reply);
  });

  // Send BTC on-chain
  fastify.post('/onchain/send', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.sendCoins(request, reply);
  });

  // Send BTC to multiple addresses
  fastify.post('/onchain/send-many', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.sendMany(request, reply);
  });

  // List on-chain transactions
  fastify.get('/onchain/transactions', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.listTransactions(request, reply);
  });

  // Get specific transaction
  fastify.get('/onchain/transactions/:txid', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getTransaction(request, reply);
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  // Switch network (admin only)
  fastify.post('/network/switch', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.switchNetwork(request, reply);
  });

  // Get service status
  fastify.get('/status', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return lndController.getStatus(request, reply);
  });

  // Health check
  fastify.get('/health', async (request, reply) => {
    return lndController.healthCheck(request, reply);
  });

  // GET /version - Get LND version
  fastify.get('/version', {
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
      return lndController.getVersion(request, reply);
    } catch (error: any) {
      console.error('❌ Failed to get LND version:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get LND version'
      });
    }
  });
}
