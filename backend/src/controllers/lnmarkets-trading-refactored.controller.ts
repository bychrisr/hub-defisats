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
   * Based on the original working implementation
   */
  async getPositions(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Get user ID from request.user (populated by middleware)
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Get active exchange account credentials
      console.log('🔍 TRADING CONTROLLER - Fetching active exchange account');
      const activeAccount = await this.prisma.userExchangeAccount.findFirst({
        where: {
          user_id: userId,
          is_active: true,
          exchange: {
            slug: 'ln-markets'
          }
        },
        include: {
          exchange: true
        }
      });

      console.log('🔍 TRADING CONTROLLER - Active account:', {
        hasAccount: !!activeAccount,
        accountName: activeAccount?.account_name,
        hasCredentials: !!activeAccount?.credentials,
        credentialsKeys: activeAccount?.credentials ? Object.keys(activeAccount.credentials) : []
      });

      if (!activeAccount || !activeAccount.credentials) {
        console.log('❌ TRADING CONTROLLER - Missing active account or credentials, returning 400');
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured',
        });
      }

      const credentials = activeAccount.credentials as any;
      if (!credentials.api_key || !credentials.api_secret || !credentials.passphrase) {
        console.log('❌ TRADING CONTROLLER - Incomplete credentials, returning 400');
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials incomplete',
        });
      }

      // Use credentials directly (they should already be decrypted)
      console.log('🔍 TRADING CONTROLLER - Using credentials...');
      
      const apiKey = credentials.api_key;
      const apiSecret = credentials.api_secret;
      const passphrase = credentials.passphrase;

      console.log('✅ TRADING CONTROLLER - Credentials decrypted successfully');

      // Detect testnet mode
      const isTestnet = credentials.isTestnet === 'true' || credentials.testnet === 'true' || 
                       (credentials.api_key && credentials.api_key.startsWith('test_'));

      // Initialize LN Markets service v2
      console.log('🔍 TRADING CONTROLLER - Initializing LNMarketsAPIv2 service', {
        isTestnet,
        accountName: activeAccount.account_name
      });
      const { LNMarketsAPIv2 } = await import('../services/lnmarkets/LNMarketsAPIv2.service');
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: {
          apiKey,
          apiSecret,
          passphrase,
          isTestnet
        },
        logger: this.logger
      });

      console.log('✅ TRADING CONTROLLER - Service v2 initialized, calling getRunningPositions');
      // Get positions using the service v2
      const positions = await lnMarketsService.futures.getRunningPositions();

      console.log('✅ TRADING CONTROLLER - Positions retrieved successfully:', {
        positionsCount: Array.isArray(positions) ? positions.length : 'not array',
        positions: positions
      });
      
      // Log detailed info about positions
      if (Array.isArray(positions) && positions.length > 0) {
        console.log('🔍 TRADING CONTROLLER - First position details:', {
          id: positions[0].id,
          side: positions[0].side,
          quantity: positions[0].quantity,
          price: positions[0].price,
          liquidation: positions[0].liquidation,
          margin: positions[0].margin,
          pl: positions[0].pl,
          leverage: positions[0].leverage,
          allKeys: Object.keys(positions[0])
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          positions: positions || [],
        },
      });
    } catch (error: any) {
      console.error('❌ TRADING CONTROLLER - Error getting positions:', {
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        fullError: error
      });
      
      // Handle specific error types (based on original implementation)
      if (error.message?.includes('LN Markets credentials not configured')) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured. Please update your profile with API credentials.',
        });
      }
      
      if (error.message?.includes('Invalid API credentials')) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid LN Markets API credentials. Please check your API key, secret, and passphrase.',
        });
      }
      
      if (error.message?.includes('Insufficient permissions')) {
        return reply.status(400).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'LN Markets API credentials do not have sufficient permissions.',
        });
      }
      
      // Handle HTTP status codes
      if (error.response?.status === 401) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid LN Markets API credentials. Please check your API key, secret, and passphrase.',
        });
      }
      
      if (error.response?.status === 403) {
        return reply.status(400).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'LN Markets API credentials do not have sufficient permissions.',
        });
      }
      
      if (error.response?.status === 429) {
        return reply.status(429).send({
          success: false,
          error: 'RATE_LIMIT',
          message: 'Rate limit exceeded. Please try again later.',
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get LN Markets positions. Please try again later.',
      });
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
