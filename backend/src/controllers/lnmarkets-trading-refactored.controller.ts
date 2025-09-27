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

      // Get user credentials from database (based on original implementation)
      console.log('🔍 TRADING CONTROLLER - Fetching user credentials from database');
      const userProfile = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });

      console.log('🔍 TRADING CONTROLLER - User profile from DB:', {
        hasApiKey: !!userProfile?.ln_markets_api_key,
        hasApiSecret: !!userProfile?.ln_markets_api_secret,
        hasPassphrase: !!userProfile?.ln_markets_passphrase,
        apiKeyPreview: userProfile?.ln_markets_api_key ? `${userProfile.ln_markets_api_key.substring(0, 10)}...` : 'MISSING',
        apiSecretPreview: userProfile?.ln_markets_api_secret ? `${userProfile.ln_markets_api_secret.substring(0, 10)}...` : 'MISSING',
        passphrasePreview: userProfile?.ln_markets_passphrase ? `${userProfile.ln_markets_passphrase.substring(0, 5)}...` : 'MISSING'
      });

      if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
        console.log('❌ TRADING CONTROLLER - Missing credentials, returning 400');
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured',
        });
      }

      // Decrypt credentials (based on original implementation)
      console.log('🔍 TRADING CONTROLLER - Decrypting credentials...');
      
      // Import AuthService and create instance
      const { AuthService } = await import('../services/auth.service');
      const authService = new AuthService(this.prisma, request.server);
      
      const apiKey = authService.decryptData(userProfile.ln_markets_api_key);
      const apiSecret = authService.decryptData(userProfile.ln_markets_api_secret);
      const passphrase = authService.decryptData(userProfile.ln_markets_passphrase);

      console.log('✅ TRADING CONTROLLER - Credentials decrypted successfully');

      // Initialize LN Markets service directly (based on original implementation)
      console.log('🔍 TRADING CONTROLLER - Initializing LN Markets service');
      const { LNMarketsAPIService } = await import('../services/lnmarkets-api.service');
      const lnMarketsService = new LNMarketsAPIService({
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false, // Force mainnet for now
      }, this.logger);

      console.log('✅ TRADING CONTROLLER - Service initialized, calling getUserPositions');
      // Get positions using the service (based on original implementation)
      const positions = await lnMarketsService.getUserPositions();

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
