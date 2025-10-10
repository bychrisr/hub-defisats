/**
 * LND Controller
 * 
 * Controller for handling LND API requests including wallet operations,
 * invoice management, and Lightning Network functionality.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { getLNDService } from '../services/lnd/LNDService';

export class LNDController {
  private lndService = getLNDService(console);

  /**
   * GET /api/lnd/info - Get node information
   */
  async getInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const info = await this.lndService.info!.getInfo();
      
      return reply.status(200).send({
        success: true,
        data: info
      });
    } catch (error: any) {
      console.error('❌ Failed to get LND info:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get node info'
      });
    }
  }

  /**
   * GET /api/lnd/network-info - Get network information
   */
  async getNetworkInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const networkInfo = await this.lndService.info!.getNetworkInfo();
      
      return reply.status(200).send({
        success: true,
        data: networkInfo
      });
    } catch (error: any) {
      console.error('❌ Failed to get network info:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get network info'
      });
    }
  }

  /**
   * GET /api/lnd/metrics - Get node metrics
   */
  async getMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const status = await this.lndService.info!.getConnectivityStatus();
      
      return reply.status(200).send({
        success: true,
        data: status
      });
    } catch (error: any) {
      console.error('❌ Failed to get metrics:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get metrics'
      });
    }
  }

  /**
   * GET /api/lnd/wallet/balance - Get total balance
   */
  async getTotalBalance(request: FastifyRequest, reply: FastifyReply) {
    try {
      const balance = await this.lndService.wallet!.getTotalBalance();
      
      return reply.status(200).send({
        success: true,
        data: balance
      });
    } catch (error: any) {
      console.error('❌ Failed to get total balance:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get balance'
      });
    }
  }

  /**
   * GET /api/lnd/wallet/balance/onchain - Get on-chain balance
   */
  async getOnchainBalance(request: FastifyRequest, reply: FastifyReply) {
    try {
      const balance = await this.lndService.wallet!.getBalance();
      
      return reply.status(200).send({
        success: true,
        data: balance
      });
    } catch (error: any) {
      console.error('❌ Failed to get on-chain balance:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get on-chain balance'
      });
    }
  }

  /**
   * GET /api/lnd/wallet/balance/channels - Get channel balance
   */
  async getChannelBalance(request: FastifyRequest, reply: FastifyReply) {
    try {
      const balance = await this.lndService.wallet!.getChannelBalance();
      
      return reply.status(200).send({
        success: true,
        data: balance
      });
    } catch (error: any) {
      console.error('❌ Failed to get channel balance:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get channel balance'
      });
    }
  }

  /**
   * GET /api/lnd/wallet/utxos - List UTXOs
   */
  async listUTXOs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const utxos = await this.lndService.wallet!.listUnspent();
      
      return reply.status(200).send({
        success: true,
        data: utxos
      });
    } catch (error: any) {
      console.error('❌ Failed to list UTXOs:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list UTXOs'
      });
    }
  }

  /**
   * POST /api/lnd/wallet/estimate-fee - Estimate fee
   */
  async estimateFee(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const feeEstimation = await this.lndService.wallet!.estimateFee(body);
      
      return reply.status(200).send({
        success: true,
        data: feeEstimation
      });
    } catch (error: any) {
      console.error('❌ Failed to estimate fee:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to estimate fee'
      });
    }
  }

  /**
   * POST /api/lnd/invoices - Create invoice
   */
  async createInvoice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const invoice = await this.lndService.invoice!.createInvoice(body);
      
      return reply.status(201).send({
        success: true,
        data: invoice
      });
    } catch (error: any) {
      console.error('❌ Failed to create invoice:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create invoice'
      });
    }
  }

  /**
   * POST /api/lnd/invoices/hold - Create HODL invoice
   */
  async createHoldInvoice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const invoice = await this.lndService.invoice!.createHoldInvoice(body);
      
      return reply.status(201).send({
        success: true,
        data: invoice
      });
    } catch (error: any) {
      console.error('❌ Failed to create hold invoice:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create hold invoice'
      });
    }
  }

  /**
   * GET /api/lnd/invoices/:paymentHash - Get invoice
   */
  async getInvoice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { paymentHash } = request.params as { paymentHash: string };
      const invoice = await this.lndService.invoice!.lookupInvoice(paymentHash);
      
      return reply.status(200).send({
        success: true,
        data: invoice
      });
    } catch (error: any) {
      console.error('❌ Failed to get invoice:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get invoice'
      });
    }
  }

  /**
   * GET /api/lnd/invoices - List invoices
   */
  async listInvoices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const invoices = await this.lndService.invoice!.listInvoices(query);
      
      return reply.status(200).send({
        success: true,
        data: invoices
      });
    } catch (error: any) {
      console.error('❌ Failed to list invoices:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list invoices'
      });
    }
  }

  /**
   * POST /api/lnd/invoices/:paymentHash/settle - Settle invoice
   */
  async settleInvoice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { paymentHash } = request.params as { paymentHash: string };
      const body = request.body as any;
      const result = await this.lndService.invoice!.settleInvoice(paymentHash, body.preimage);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to settle invoice:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to settle invoice'
      });
    }
  }

  /**
   * POST /api/lnd/invoices/:paymentHash/cancel - Cancel invoice
   */
  async cancelInvoice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { paymentHash } = request.params as { paymentHash: string };
      const result = await this.lndService.invoice!.cancelInvoice(paymentHash);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to cancel invoice:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to cancel invoice'
      });
    }
  }

  /**
   * POST /api/lnd/invoices/decode - Decode payment request
   */
  async decodePaymentRequest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const decoded = await this.lndService.invoice!.decodePayReq(body);
      
      return reply.status(200).send({
        success: true,
        data: decoded
      });
    } catch (error: any) {
      console.error('❌ Failed to decode payment request:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to decode payment request'
      });
    }
  }

  /**
   * POST /api/lnd/payments - Send payment
   */
  async sendPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const payment = await this.lndService.invoice!.sendPayment(body);
      
      return reply.status(200).send({
        success: true,
        data: payment
      });
    } catch (error: any) {
      console.error('❌ Failed to send payment:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to send payment'
      });
    }
  }

  /**
   * POST /api/lnd/payments/invoice - Pay invoice
   */
  async payInvoice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const payment = await this.lndService.invoice!.payInvoice(
        body.payment_request,
        body.amount,
        body.fee_limit,
        body.timeout_seconds
      );
      
      return reply.status(200).send({
        success: true,
        data: payment
      });
    } catch (error: any) {
      console.error('❌ Failed to pay invoice:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to pay invoice'
      });
    }
  }

  /**
   * GET /api/lnd/payments/:paymentHash - Get payment
   */
  async getPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { paymentHash } = request.params as { paymentHash: string };
      const payment = await this.lndService.invoice!.getPayment(paymentHash);
      
      return reply.status(200).send({
        success: true,
        data: payment
      });
    } catch (error: any) {
      console.error('❌ Failed to get payment:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get payment'
      });
    }
  }

  /**
   * GET /api/lnd/payments - List payments
   */
  async listPayments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const payments = await this.lndService.invoice!.listPayments(query);
      
      return reply.status(200).send({
        success: true,
        data: payments
      });
    } catch (error: any) {
      console.error('❌ Failed to list payments:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list payments'
      });
    }
  }

  /**
   * POST /api/lnd/payments/:paymentHash/track - Track payment
   */
  async trackPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { paymentHash } = request.params as { paymentHash: string };
      const payment = await this.lndService.invoice!.trackPayment(paymentHash);
      
      return reply.status(200).send({
        success: true,
        data: payment
      });
    } catch (error: any) {
      console.error('❌ Failed to track payment:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to track payment'
      });
    }
  }

  /**
   * POST /api/lnd/payments/estimate-route - Estimate route fee
   */
  async estimateRouteFee(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const feeEstimation = await this.lndService.invoice!.estimateRouteFee(body);
      
      return reply.status(200).send({
        success: true,
        data: feeEstimation
      });
    } catch (error: any) {
      console.error('❌ Failed to estimate route fee:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to estimate route fee'
      });
    }
  }

  // ============================================================================
  // CHANNEL ROUTES
  // ============================================================================

  async listChannels(request: FastifyRequest, reply: FastifyReply) {
    try {
      const channels = await this.lndService.channel!.listChannels();
      
      return reply.status(200).send({
        success: true,
        data: channels
      });
    } catch (error: any) {
      console.error('❌ Failed to list channels:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list channels'
      });
    }
  }

  async listPendingChannels(request: FastifyRequest, reply: FastifyReply) {
    try {
      const pendingChannels = await this.lndService.channel!.listPendingChannels();
      
      return reply.status(200).send({
        success: true,
        data: pendingChannels
      });
    } catch (error: any) {
      console.error('❌ Failed to list pending channels:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list pending channels'
      });
    }
  }

  async listClosedChannels(request: FastifyRequest, reply: FastifyReply) {
    try {
      const closedChannels = await this.lndService.channel!.listClosedChannels();
      
      return reply.status(200).send({
        success: true,
        data: closedChannels
      });
    } catch (error: any) {
      console.error('❌ Failed to list closed channels:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list closed channels'
      });
    }
  }

  async openChannel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const result = await this.lndService.channel!.openChannel(body);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to open channel:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to open channel'
      });
    }
  }

  async closeChannel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const result = await this.lndService.channel!.closeChannel(body);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to close channel:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to close channel'
      });
    }
  }

  async updateChannelPolicy(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const result = await this.lndService.channel!.updateChannelPolicy(body);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to update channel policy:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to update channel policy'
      });
    }
  }

  async exportChannelBackup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const backup = await this.lndService.channel!.exportChannelBackup(query);
      
      return reply.status(200).send({
        success: true,
        data: backup
      });
    } catch (error: any) {
      console.error('❌ Failed to export channel backup:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to export channel backup'
      });
    }
  }

  async restoreChannelBackup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const result = await this.lndService.channel!.restoreChannelBackup(body);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to restore channel backup:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to restore channel backup'
      });
    }
  }

  // ============================================================================
  // PEER ROUTES
  // ============================================================================

  async listPeers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const peers = await this.lndService.peer!.listPeers();
      
      return reply.status(200).send({
        success: true,
        data: peers
      });
    } catch (error: any) {
      console.error('❌ Failed to list peers:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list peers'
      });
    }
  }

  async connectPeer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const result = await this.lndService.peer!.connectPeer(body);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to connect to peer:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to connect to peer'
      });
    }
  }

  async disconnectPeer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { pubkey } = request.params as { pubkey: string };
      const result = await this.lndService.peer!.disconnectPeer({ pub_key: pubkey });
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to disconnect from peer:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to disconnect from peer'
      });
    }
  }

  // ============================================================================
  // ON-CHAIN ROUTES
  // ============================================================================

  async generateAddress(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const address = await this.lndService.onchain!.generateAddress(query);
      
      return reply.status(200).send({
        success: true,
        data: address
      });
    } catch (error: any) {
      console.error('❌ Failed to generate address:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to generate address'
      });
    }
  }

  async sendCoins(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const result = await this.lndService.onchain!.sendCoins(body);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to send coins:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to send coins'
      });
    }
  }

  async sendMany(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const result = await this.lndService.onchain!.sendMany(body);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to send many coins:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to send many coins'
      });
    }
  }

  async listTransactions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const result = await this.lndService.onchain!.listTransactions(query);
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Failed to list transactions:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list transactions'
      });
    }
  }

  async getTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { txid } = request.params as { txid: string };
      const transaction = await this.lndService.onchain!.getTransaction({ txid });
      
      return reply.status(200).send({
        success: true,
        data: transaction
      });
    } catch (error: any) {
      console.error('❌ Failed to get transaction:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get transaction'
      });
    }
  }

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  /**
   * POST /api/lnd/network/switch - Switch network
   */
  async switchNetwork(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      
      // Only allow admins to switch networks
      if (!user || !user.is_admin) {
        return reply.status(403).send({
          success: false,
          error: 'Admin access required'
        });
      }

      const body = request.body as any;
      const network = body.network;
      
      if (!['testnet', 'mainnet'].includes(network)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid network. Use "testnet" or "mainnet"'
        });
      }

      this.lndService.switchNetwork(network);
      
      return reply.status(200).send({
        success: true,
        data: {
          network: this.lndService.getNetwork(),
          message: `Switched to ${network}`
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to switch network:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to switch network'
      });
    }
  }

  /**
   * GET /api/lnd/status - Get service status
   */
  async getStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = this.lndService.getStats();
      const health = await this.lndService.getHealthStatus();
      
      return reply.status(200).send({
        success: true,
        data: {
          stats,
          health
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to get status:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get status'
      });
    }
  }

  /**
   * GET /api/lnd/health - Health check
   */
  async healthCheck(request: FastifyRequest, reply: FastifyReply) {
    try {
      const isHealthy = await this.lndService.isHealthy();
      
      return reply.status(isHealthy ? 200 : 503).send({
        success: isHealthy,
        data: {
          healthy: isHealthy,
          network: this.lndService.getNetwork(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      return reply.status(503).send({
        success: false,
        error: error.message || 'Health check failed'
      });
    }
  }
}
