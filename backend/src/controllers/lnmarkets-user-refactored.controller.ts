/**
 * LN Markets User Controller (Refactored)
 * 
 * Updated controller that uses the new ExchangeServiceFactory and standardized interfaces
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { ExchangeBaseController } from './exchange-base.controller';

export class LNMarketsUserRefactoredController extends ExchangeBaseController {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger);
  }

  /**
   * Get user profile using the new standardized service
   */
  async getUserProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getUserProfile();
      
      if (!result.success) {
        return this.sendError(reply, 'USER_PROFILE_FETCH_FAILED', result.error || 'Failed to fetch user profile');
      }

      this.logger.info(`[UserController] User profile retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'User profile retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get user profile');
    }
  }

  /**
   * Get user balance using the new standardized service
   */
  async getUserBalance(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getUserBalance();
      
      if (!result.success) {
        return this.sendError(reply, 'USER_BALANCE_FETCH_FAILED', result.error || 'Failed to fetch user balance');
      }

      this.logger.info(`[UserController] User balance retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'User balance retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get user balance');
    }
  }

  /**
   * Get user history using the new standardized service
   */
  async getUserHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getUserHistory({ limit, offset });
      
      if (!result.success) {
        return this.sendError(reply, 'USER_HISTORY_FETCH_FAILED', result.error || 'Failed to fetch user history');
      }

      this.logger.info(`[UserController] User history retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'User history retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get user history');
    }
  }

  /**
   * Get user orders using the new standardized service
   */
  async getUserOrders(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getUserOrders({ limit, offset });
      
      if (!result.success) {
        return this.sendError(reply, 'USER_ORDERS_FETCH_FAILED', result.error || 'Failed to fetch user orders');
      }

      this.logger.info(`[UserController] User orders retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'User orders retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get user orders');
    }
  }

  /**
   * Get user deposits using the new standardized service
   */
  async getUserDeposits(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getUserDeposits({ limit, offset });
      
      if (!result.success) {
        return this.sendError(reply, 'USER_DEPOSITS_FETCH_FAILED', result.error || 'Failed to fetch user deposits');
      }

      this.logger.info(`[UserController] User deposits retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'User deposits retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get user deposits');
    }
  }

  /**
   * Get user withdrawals using the new standardized service
   */
  async getUserWithdrawals(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = this.validateUser(request, reply);
      if (!userId) return;

      const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };

      const exchangeService = await this.createExchangeService(userId);
      const result = await exchangeService.getUserWithdrawals({ limit, offset });
      
      if (!result.success) {
        return this.sendError(reply, 'USER_WITHDRAWALS_FETCH_FAILED', result.error || 'Failed to fetch user withdrawals');
      }

      this.logger.info(`[UserController] User withdrawals retrieved for user ${userId}`);
      return this.sendSuccess(reply, result.data, 'User withdrawals retrieved successfully');
    } catch (error: any) {
      return this.handleExchangeError(error, reply, 'get user withdrawals');
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
      
      this.logger.info(`[UserController] Connection test for user ${userId}`, {
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
}
