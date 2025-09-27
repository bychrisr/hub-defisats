/**
 * LN Markets Trading Controller (Refactored)
 * 
 * Updated controller that uses the new ExchangeServiceFactory and standardized interfaces
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { ExchangeBaseController } from './exchange-base.controller';

export class LNMarketsTradingRefactoredController extends ExchangeBaseController {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger);
  }

  /**
   * Get positions using the new standardized service
   */
  async getPositions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getPositions();
      
      if (!result.success) {
        return this.sendError(reply, 'POSITIONS_FETCH_FAILED', result.error || 'Failed to fetch positions');
      }

      this.logger.info(`[TradingController] Positions retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'Positions retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get positions');
    }
  }

  /**
   * Place order using the new standardized service
   */
  async placeOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const orderData = request.body as any;
      if (!orderData) {
        return this.sendError(reply, 'INVALID_ORDER_DATA', 'Order data is required');
      }

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.placeOrder(orderData);
      
      if (!result.success) {
        return this.sendError(reply, 'ORDER_PLACEMENT_FAILED', result.error || 'Failed to place order');
      }

      this.logger.info(`[TradingController] Order placed for user ${userId}`, {
        userId,
        orderId: result.data?.id
      });

      return this.sendSuccess(reply, result.data, 'Order placed successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'place order');
    }
  }

  /**
   * Close position using the new standardized service
   */
  async closePosition(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { tradeId } = request.params as { tradeId: string };
      if (!tradeId) {
        return this.sendError(reply, 'MISSING_TRADE_ID', 'Trade ID is required');
      }

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.closePosition({ positionId: tradeId });
      
      if (!result.success) {
        return this.sendError(reply, 'POSITION_CLOSE_FAILED', result.error || 'Failed to close position');
      }

      this.logger.info(`[TradingController] Position closed for user ${userId}`, {
        userId,
        tradeId
      });

      return this.sendSuccess(reply, result.data, 'Position closed successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'close position');
    }
  }

  /**
   * Add margin using the new standardized service
   */
  async addMargin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { tradeId } = request.params as { tradeId: string };
      const { amount } = request.body as { amount: number };

      if (!tradeId) {
        return this.sendError(reply, 'MISSING_TRADE_ID', 'Trade ID is required');
      }

      if (!amount || amount <= 0) {
        return this.sendError(reply, 'INVALID_AMOUNT', 'Valid amount is required');
      }

      // TODO: addMargin not implemented in generic interface
      return this.sendError(reply, 'NOT_IMPLEMENTED', 'Add margin not implemented in generic interface');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'add margin');
    }
  }

  /**
   * Reduce position using the new standardized service
   */
  async reducePosition(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { tradeId } = request.params as { tradeId: string };
      const { quantity } = request.body as { quantity: number };

      if (!tradeId) {
        return this.sendError(reply, 'MISSING_TRADE_ID', 'Trade ID is required');
      }

      if (!quantity || quantity <= 0) {
        return this.sendError(reply, 'INVALID_QUANTITY', 'Valid quantity is required');
      }

      // TODO: reducePosition not implemented in generic interface
      return this.sendError(reply, 'NOT_IMPLEMENTED', 'Reduce position not implemented in generic interface');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'reduce position');
    }
  }

  /**
   * Update take profit using the new standardized service
   */
  async updateTakeProfit(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { tradeId } = request.params as { tradeId: string };
      const { takeProfit } = request.body as { takeProfit: number };

      if (!tradeId) {
        return this.sendError(reply, 'MISSING_TRADE_ID', 'Trade ID is required');
      }

      if (takeProfit === undefined || takeProfit < 0) {
        return this.sendError(reply, 'INVALID_TAKE_PROFIT', 'Valid take profit value is required');
      }

      // TODO: updateTakeProfit not implemented in generic interface
      return this.sendError(reply, 'NOT_IMPLEMENTED', 'Update take profit not implemented in generic interface');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'update take profit');
    }
  }

  /**
   * Update stop loss using the new standardized service
   */
  async updateStopLoss(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { tradeId } = request.params as { tradeId: string };
      const { stopLoss } = request.body as { stopLoss: number };

      if (!tradeId) {
        return this.sendError(reply, 'MISSING_TRADE_ID', 'Trade ID is required');
      }

      if (stopLoss === undefined || stopLoss < 0) {
        return this.sendError(reply, 'INVALID_STOP_LOSS', 'Valid stop loss value is required');
      }

      // TODO: updateStopLoss not implemented in generic interface
      return this.sendError(reply, 'NOT_IMPLEMENTED', 'Update stop loss not implemented in generic interface');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'update stop loss');
    }
  }

  /**
   * Cancel all trades using the new standardized service
   */
  async cancelAllTrades(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      // TODO: cancelAllTrades not implemented in generic interface
      return this.sendError(reply, 'NOT_IMPLEMENTED', 'Cancel all trades not implemented in generic interface');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'cancel all trades');
    }
  }

  /**
   * Close all trades using the new standardized service
   */
  async closeAllTrades(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      // TODO: closeAllTrades not implemented in generic interface
      return this.sendError(reply, 'NOT_IMPLEMENTED', 'Close all trades not implemented in generic interface');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'close all trades');
    }
  }
}
