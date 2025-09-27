/**
 * LN Markets Routes (Refactored)
 * 
 * Updated routes that use the new ExchangeServiceFactory and standardized interfaces
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { LNMarketsMarketRefactoredController } from '../controllers/lnmarkets-market-refactored.controller';
import { LNMarketsUserRefactoredController } from '../controllers/lnmarkets-user-refactored.controller';
import { LNMarketsTradingRefactoredController } from '../controllers/lnmarkets-trading-refactored.controller';

export async function lnmarketsRefactoredRoutes(fastify: FastifyInstance) {
  const prisma = (fastify as any).prisma as PrismaClient;
  const logger = fastify.log as any;

  // Initialize controllers
  const marketController = new LNMarketsMarketRefactoredController(prisma, logger);
  const userController = new LNMarketsUserRefactoredController(prisma, logger);
  const tradingController = new LNMarketsTradingRefactoredController(prisma, logger);

  // Market routes
  fastify.get('/market/data', {
    preHandler: [(fastify as any).authenticate],
    handler: marketController.getMarketData.bind(marketController)
  });

  fastify.get('/market/futures', {
    preHandler: [(fastify as any).authenticate],
    handler: marketController.getFuturesData.bind(marketController)
  });

  fastify.get('/market/options', {
    preHandler: [(fastify as any).authenticate],
    handler: marketController.getOptionsData.bind(marketController)
  });

  fastify.get('/market/ticker', {
    preHandler: [(fastify as any).authenticate],
    handler: marketController.getTicker.bind(marketController)
  });

  fastify.get('/market/history', {
    preHandler: [(fastify as any).authenticate],
    handler: marketController.getMarketHistory.bind(marketController)
  });

  fastify.get('/market/status', {
    preHandler: [(fastify as any).authenticate],
    handler: marketController.getSystemStatus.bind(marketController)
  });

  fastify.get('/market/health', {
    preHandler: [(fastify as any).authenticate],
    handler: marketController.getSystemHealth.bind(marketController)
  });

  // User routes
  fastify.get('/user/profile', {
    preHandler: [(fastify as any).authenticate],
    handler: userController.getUserProfile.bind(userController)
  });

  fastify.get('/user/balance', {
    preHandler: [(fastify as any).authenticate],
    handler: userController.getUserBalance.bind(userController)
  });

  fastify.get('/user/history', {
    preHandler: [(fastify as any).authenticate],
    handler: userController.getUserHistory.bind(userController)
  });

  fastify.get('/user/orders', {
    preHandler: [(fastify as any).authenticate],
    handler: userController.getUserOrders.bind(userController)
  });

  fastify.get('/user/deposits', {
    preHandler: [(fastify as any).authenticate],
    handler: userController.getUserDeposits.bind(userController)
  });

  fastify.get('/user/withdrawals', {
    preHandler: [(fastify as any).authenticate],
    handler: userController.getUserWithdrawals.bind(userController)
  });

  // Trading routes
  fastify.get('/trading/positions', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: any, reply: any) => {
      return reply.send({
        success: true,
        message: 'Positions route working',
        user: request.user
      });
    }
  });

  fastify.post('/trading/order', {
    preHandler: [(fastify as any).authenticate],
    handler: tradingController.placeOrder.bind(tradingController)
  });

  fastify.post('/trading/position/:tradeId/close', {
    preHandler: [(fastify as any).authenticate],
    handler: tradingController.closePosition.bind(tradingController)
  });

  fastify.post('/trading/position/:tradeId/margin', {
    preHandler: [(fastify as any).authenticate],
    handler: tradingController.addMargin.bind(tradingController)
  });

  fastify.post('/trading/position/:tradeId/reduce', {
    preHandler: [(fastify as any).authenticate],
    handler: tradingController.reducePosition.bind(tradingController)
  });

  fastify.put('/trading/position/:tradeId/take-profit', {
    preHandler: [(fastify as any).authenticate],
    handler: tradingController.updateTakeProfit.bind(tradingController)
  });

  fastify.put('/trading/position/:tradeId/stop-loss', {
    preHandler: [(fastify as any).authenticate],
    handler: tradingController.updateStopLoss.bind(tradingController)
  });

  fastify.post('/trading/cancel-all', {
    preHandler: [(fastify as any).authenticate],
    handler: tradingController.cancelAllTrades.bind(tradingController)
  });

  fastify.post('/trading/close-all', {
    preHandler: [(fastify as any).authenticate],
    handler: tradingController.closeAllTrades.bind(tradingController)
  });

  // Test connection routes (removed to avoid conflicts with existing routes)
  
  // Simple test route
  fastify.get('/test', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🔍 TEST ROUTE - Request received');
    console.log('🔍 TEST ROUTE - request.user:', (request as any).user);
    return reply.send({
      success: true,
      message: 'Test route working',
      user: (request as any).user
    });
  });
}
