/**
 * LN Markets Market Controller (Refactored)
 * 
 * Updated controller that uses the new ExchangeServiceFactory and standardized interfaces
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { ExchangeBaseController } from './exchange-base.controller';

export class LNMarketsMarketRefactoredController extends ExchangeBaseController {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger);
  }

  /**
   * Get market data using the new standardized service
   */
  async getMarketData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getMarketData('BTCUSD');
      
      if (!result.success) {
        return this.sendError(reply, 'MARKET_DATA_FETCH_FAILED', result.error || 'Failed to fetch market data');
      }

      this.logger.info(`[MarketController] Market data retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'Market data retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get market data');
    }
  }

  /**
   * Get futures data using the new standardized service
   */
  async getFuturesData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getMarketData('BTCUSD');
      
      if (!result.success) {
        return this.sendError(reply, 'FUTURES_DATA_FETCH_FAILED', result.error || 'Failed to fetch futures data');
      }

      this.logger.info(`[MarketController] Futures data retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'Futures data retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get futures data');
    }
  }

  /**
   * Get options data using the new standardized service
   */
  async getOptionsData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getMarketData('BTCUSD');
      
      if (!result.success) {
        return this.sendError(reply, 'OPTIONS_DATA_FETCH_FAILED', result.error || 'Failed to fetch options data');
      }

      this.logger.info(`[MarketController] Options data retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'Options data retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get options data');
    }
  }

  /**
   * Get ticker data using the new standardized service
   */
  async getTicker(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getTicker('BTCUSD');
      
      if (!result.success) {
        return this.sendError(reply, 'TICKER_FETCH_FAILED', result.error || 'Failed to fetch ticker data');
      }

      this.logger.info(`[MarketController] Ticker data retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'Ticker data retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get ticker data');
    }
  }

  /**
   * Get market history using the new standardized service
   */
  async getMarketHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getMarketHistory('BTCUSD', { limit, offset });
      
      if (!result.success) {
        return this.sendError(reply, 'MARKET_HISTORY_FETCH_FAILED', result.error || 'Failed to fetch market history');
      }

      this.logger.info(`[MarketController] Market history retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'Market history retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get market history');
    }
  }

  /**
   * Test connection using the new standardized service
   */
  async testConnection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const isValid = await exchangeService.validateCredentials(await this.getUserCredentials(userId));
      
      this.logger.info(`[MarketController] Connection test for user ${userId}`, {
        userId,
        isValid
      });

      return this.sendSuccess(reply, {
        success: isValid,
        message: isValid ? 'Connection successful' : 'Connection failed'
      }, 'Connection test completed');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'test connection');
    }
  }

  /**
   * Get system status using the new standardized service
   */
  async getSystemStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getSystemStatus();
      
      if (!result.success) {
        return this.sendError(reply, 'SYSTEM_STATUS_FETCH_FAILED', result.error || 'Failed to fetch system status');
      }

      this.logger.info(`[MarketController] System status retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'System status retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get system status');
    }
  }

  /**
   * Get system health using the new standardized service
   */
  async getSystemHealth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getSystemHealth();
      
      if (!result.success) {
        return this.sendError(reply, 'SYSTEM_HEALTH_FETCH_FAILED', result.error || 'Failed to fetch system health');
      }

      this.logger.info(`[MarketController] System health retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'System health retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get system health');
    }
  }
}
