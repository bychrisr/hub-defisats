/**
 * Testnet Faucet Routes
 * 
 * API routes for testnet Lightning faucet functionality.
 */

import { FastifyInstance } from 'fastify';
import { TestnetFaucetController } from '../controllers/testnet-faucet.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const testnetFaucetController = new TestnetFaucetController();

export async function testnetFaucetRoutes(fastify: FastifyInstance) {
  // Get faucet information (public)
  fastify.get('/api/testnet-faucet/info', async (request, reply) => {
    return testnetFaucetController.getFaucetInfo(request, reply);
  });

  // Request testnet sats (authenticated or anonymous)
  fastify.post('/api/testnet-faucet/request', {
    preHandler: [authMiddleware] // Optional auth - will work with or without user
  }, async (request, reply) => {
    return testnetFaucetController.requestSats(request, reply);
  });

  // Get request status (public)
  fastify.get('/api/testnet-faucet/request/:id', async (request, reply) => {
    return testnetFaucetController.getRequestStatus(request, reply);
  });

  // Get distribution history (authenticated)
  fastify.get('/api/testnet-faucet/history', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return testnetFaucetController.getHistory(request, reply);
  });

  // Get faucet statistics (public)
  fastify.get('/api/testnet-faucet/stats', async (request, reply) => {
    return testnetFaucetController.getStats(request, reply);
  });

  // Webhook for payment notifications (internal)
  fastify.post('/api/testnet-faucet/webhook', async (request, reply) => {
    return testnetFaucetController.webhook(request, reply);
  });

  // Cleanup expired distributions (admin only)
  fastify.post('/api/testnet-faucet/cleanup', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return testnetFaucetController.cleanup(request, reply);
  });
}
