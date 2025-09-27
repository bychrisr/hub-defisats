/**
 * Exchange Base Controller
 * 
 * Base controller that provides common functionality for exchange operations
 * Uses the new ExchangeServiceFactory and standardized interfaces
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { ExchangeServiceFactory, SupportedExchange } from '../services/ExchangeServiceFactory';
import { ExchangeCredentials } from '../services/ExchangeApiService.interface';
import { LNMarketsCredentials } from '../services/LNMarketsApiService';

export abstract class ExchangeBaseController {
  protected factory: ExchangeServiceFactory;
  protected logger: Logger;

  constructor(protected prisma: PrismaClient, logger: Logger) {
    this.factory = ExchangeServiceFactory.getInstance(logger);
    this.logger = logger;
  }

  /**
   * Get user credentials from database
   */
  protected async getUserCredentials(userId: string): Promise<ExchangeCredentials> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        ln_markets_api_key: true, 
        ln_markets_api_secret: true, 
        ln_markets_passphrase: true 
      }
    });

    if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret || !user?.ln_markets_passphrase) {
      throw new Error('LN Markets credentials not configured');
    }

    // Decrypt credentials
    const { AuthService } = await import('../services/auth.service');
    const authService = new AuthService(this.prisma, {} as any);
    const apiKey = authService.decryptData(user.ln_markets_api_key);
    const apiSecret = authService.decryptData(user.ln_markets_api_secret);
    const passphrase = authService.decryptData(user.ln_markets_passphrase);

    return {
      apiKey,
      apiSecret,
      passphrase,
      sandbox: false // Force mainnet for now
    } as LNMarketsCredentials;
  }

  /**
   * Create exchange service instance
   */
  protected async createExchangeService(userId: string, exchange: SupportedExchange = 'lnmarkets') {
    const credentials = await this.getUserCredentials(userId);
    
    return this.factory.createServiceWithValidation({
      exchange,
      credentials,
      logger: this.logger
    });
  }

  /**
   * Handle exchange API errors
   */
  protected handleExchangeError(error: any, reply: FastifyReply, operation: string) {
    this.logger.error(`[ExchangeController] Error in ${operation}:`, {
      error: error.message,
      stack: error.stack,
      operation
    });

    // Check if it's an exchange API error
    if (error.response?.status) {
      return reply.status(error.response.status).send({
        success: false,
        error: 'EXCHANGE_API_ERROR',
        message: `Exchange API error: ${error.response.statusText}`,
        details: error.response.data
      });
    }

    // Generic error
    return reply.status(500).send({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: `Failed to ${operation}`,
      details: error.message
    });
  }

  /**
   * Validate user authentication
   */
  protected validateUser(request: FastifyRequest, reply: FastifyReply): string | null {
    const userId = (request as any).user?.id;
    if (!userId) {
      reply.status(401).send({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
      return null;
    }
    return userId;
  }

  /**
   * Send success response
   */
  protected sendSuccess(reply: FastifyReply, data: any, message?: string) {
    return reply.send({
      success: true,
      data,
      message
    });
  }

  /**
   * Send error response
   */
  protected sendError(reply: FastifyReply, error: string, message: string, statusCode: number = 500) {
    return reply.status(statusCode).send({
      success: false,
      error,
      message
    });
  }
}
