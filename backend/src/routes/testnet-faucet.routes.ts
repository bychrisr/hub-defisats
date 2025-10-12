/**
 * Testnet Faucet Routes
 * 
 * Endpoints para sistema de funding interno via LND testnet
 * - POST /api/testnet-faucet/request - Solicitar funding
 * - GET /api/testnet-faucet/info - Informações do faucet
 * - GET /api/testnet-faucet/history - Histórico de requests
 * - GET /api/testnet-faucet/stats - Estatísticas do faucet
 */

import { FastifyInstance } from 'fastify';
import { TestnetFaucetService } from '../services/testnet-faucet.service';

export async function testnetFaucetRoutes(fastify: FastifyInstance) {
  const testnetFaucetService = new TestnetFaucetService(fastify.log);

  /**
   * GET /api/testnet-faucet/info
   * Informações sobre o faucet testnet
   */
  fastify.get('/info', async (request, reply) => {
    try {
      const info = await testnetFaucetService.getFaucetInfo();
      
      return reply.status(200).send({
        success: true,
        data: info
      });
    } catch (error: any) {
      fastify.log.error('❌ Failed to get faucet info:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get faucet info'
      });
    }
  });

  /**
   * POST /api/testnet-faucet/request
   * Solicitar funding de sats testnet
   */
  fastify.post('/request', async (request, reply) => {
    try {
      const { amount, lightningAddress, memo } = request.body as {
        amount?: number;
        lightningAddress?: string;
        memo?: string;
      };

      const result = await testnetFaucetService.requestFunding({
        amount: amount || 10000, // Default 10,000 sats
        lightningAddress,
        memo: memo || 'Testnet faucet funding'
      });

      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      fastify.log.error('❌ Failed to request funding:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to request funding'
      });
    }
  });

  /**
   * GET /api/testnet-faucet/history
   * Histórico de requests de funding
   */
  fastify.get('/history', async (request, reply) => {
    try {
      const { limit = 50, offset = 0 } = request.query as {
        limit?: number;
        offset?: number;
      };

      const history = await testnetFaucetService.getFundingHistory({
        limit,
        offset
      });

      return reply.status(200).send({
        success: true,
        data: history
      });
    } catch (error: any) {
      fastify.log.error('❌ Failed to get funding history:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get funding history'
      });
    }
  });

  /**
   * GET /api/testnet-faucet/stats
   * Estatísticas do faucet
   */
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = await testnetFaucetService.getFaucetStats();

      return reply.status(200).send({
        success: true,
        data: stats
      });
    } catch (error: any) {
      fastify.log.error('❌ Failed to get faucet stats:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get faucet stats'
      });
    }
  });
}