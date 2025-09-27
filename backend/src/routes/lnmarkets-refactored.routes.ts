/**
 * LN Markets Routes (Refactored)
 * 
 * Updated routes that use the new ExchangeServiceFactory and standardized interfaces
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { LNMarketsMarketRefactoredController } from '../controllers/lnmarkets-market-refactored.controller';
import { LNMarketsUserRefactoredController } from '../controllers/lnmarkets-user-refactored.controller';
import { LNMarketsTradingRefactoredController } from '../controllers/lnmarkets-trading-refactored.controller';

export async function lnmarketsRefactoredRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma as PrismaClient;
  const logger = fastify.log as Logger;

  // Initialize controllers
  const marketController = new LNMarketsMarketRefactoredController(prisma, logger);
  const userController = new LNMarketsUserRefactoredController(prisma, logger);
  const tradingController = new LNMarketsTradingRefactoredController(prisma, logger);

  // Market routes
  fastify.get('/market/data', {
    preHandler: [fastify.authenticate],
    handler: marketController.getMarketData.bind(marketController)
  });

  fastify.get('/market/futures', {
    preHandler: [fastify.authenticate],
    handler: marketController.getFuturesData.bind(marketController)
  });

  fastify.get('/market/options', {
    preHandler: [fastify.authenticate],
    handler: marketController.getOptionsData.bind(marketController)
  });

  fastify.get('/market/ticker', {
    preHandler: [fastify.authenticate],
    handler: marketController.getTicker.bind(marketController)
  });

  fastify.get('/market/history', {
    preHandler: [fastify.authenticate],
    handler: marketController.getMarketHistory.bind(marketController)
  });

  fastify.get('/market/status', {
    preHandler: [fastify.authenticate],
    handler: marketController.getSystemStatus.bind(marketController)
  });

  fastify.get('/market/health', {
    preHandler: [fastify.authenticate],
    handler: marketController.getSystemHealth.bind(marketController)
  });

  // User routes
  fastify.get('/user/profile', {
    preHandler: [fastify.authenticate],
    handler: userController.getUserProfile.bind(userController)
  });

  fastify.get('/user/balance', {
    preHandler: [fastify.authenticate],
    handler: userController.getUserBalance.bind(userController)
  });

  fastify.get('/user/history', {
    preHandler: [fastify.authenticate],
    handler: userController.getUserHistory.bind(userController)
  });

  fastify.get('/user/orders', {
    preHandler: [fastify.authenticate],
    handler: userController.getUserOrders.bind(userController)
  });

  fastify.get('/user/deposits', {
    preHandler: [fastify.authenticate],
    handler: userController.getUserDeposits.bind(userController)
  });

  fastify.get('/user/withdrawals', {
    preHandler: [fastify.authenticate],
    handler: userController.getUserWithdrawals.bind(userController)
  });

  // Trading routes
  fastify.get('/trading/positions', {
    preHandler: [fastify.authenticate],
    handler: tradingController.getPositions.bind(tradingController)
  });

  fastify.post('/trading/order', {
    preHandler: [fastify.authenticate],
    handler: tradingController.placeOrder.bind(tradingController)
  });

  fastify.post('/trading/position/:tradeId/close', {
    preHandler: [fastify.authenticate],
    handler: tradingController.closePosition.bind(tradingController)
  });

  fastify.post('/trading/position/:tradeId/margin', {
    preHandler: [fastify.authenticate],
    handler: tradingController.addMargin.bind(tradingController)
  });

  fastify.post('/trading/position/:tradeId/reduce', {
    preHandler: [fastify.authenticate],
    handler: tradingController.reducePosition.bind(tradingController)
  });

  fastify.put('/trading/position/:tradeId/take-profit', {
    preHandler: [fastify.authenticate],
    handler: tradingController.updateTakeProfit.bind(tradingController)
  });

  fastify.put('/trading/position/:tradeId/stop-loss', {
    preHandler: [fastify.authenticate],
    handler: tradingController.updateStopLoss.bind(tradingController)
  });

  fastify.post('/trading/cancel-all', {
    preHandler: [fastify.authenticate],
    handler: tradingController.cancelAllTrades.bind(tradingController)
  });

  fastify.post('/trading/close-all', {
    preHandler: [fastify.authenticate],
    handler: tradingController.closeAllTrades.bind(tradingController)
  });

  // Test connection routes
  fastify.get('/test-connection', {
    preHandler: [fastify.authenticate],
    handler: marketController.testConnection.bind(marketController)
  });

  fastify.get('/user/test-connection', {
    preHandler: [fastify.authenticate],
    handler: userController.testConnection.bind(userController)
  });
}
