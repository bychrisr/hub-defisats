import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

export class LNMarketsMarketController {
  constructor(private prisma: PrismaClient) {}

  private async getLNMarketsService(userId: string): Promise<LNMarketsAPIv2> {
    // Get user credentials using the new exchange accounts system
    const { AccountCredentialsService } = await import('../services/account-credentials.service');
    const accountCredentialsService = new AccountCredentialsService(this.prisma);
    
    const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(userId);
    
    if (!activeCredentials) {
      throw new Error('No active exchange account found');
    }

    return new LNMarketsAPIv2({
      credentials: activeCredentials.credentials,
      logger: console as any
    });
  }

  async getMarketData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const lnmarkets = await this.getLNMarketsService(userId);
      const result = await lnmarkets.getMarketData();
      
      console.log(`[MarketController] Market data retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[MarketController] Error getting market data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get market data',
        details: error.message
      });
    }
  }

  async getFuturesData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const lnmarkets = await this.getLNMarketsService(userId);
      const result = await lnmarkets.getFuturesData();
      
      console.log(`[MarketController] Futures data retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[MarketController] Error getting futures data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get futures data',
        details: error.message
      });
    }
  }

  async getOptionsData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const lnmarkets = await this.getLNMarketsService(userId);
      const result = await lnmarkets.getOptionsData();
      
      console.log(`[MarketController] Options data retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[MarketController] Error getting options data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get options data',
        details: error.message
      });
    }
  }

  async testConnection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const lnmarkets = await this.getLNMarketsService(userId);
      const result = await lnmarkets.testConnection();
      
      console.log(`[MarketController] Connection test for user ${userId}`, {
        userId,
        result
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[MarketController] Error testing connection:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to test connection',
        details: error.message
      });
    }
  }
}
