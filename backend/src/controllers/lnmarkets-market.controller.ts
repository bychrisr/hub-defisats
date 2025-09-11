import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIService } from '@/services/lnmarkets-api.service';

export class LNMarketsMarketController {
  constructor(private prisma: PrismaClient) {}

  private async getLNMarketsService(userId: string): Promise<LNMarketsAPIService> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ln_markets_api_key: true, ln_markets_api_secret: true, ln_markets_passphrase: true }
    });

    if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret || !user?.ln_markets_passphrase) {
      throw new Error('LN Markets credentials not configured');
    }

    return new LNMarketsAPIService({
      apiKey: user.ln_markets_api_key,
      apiSecret: user.ln_markets_api_secret,
      passphrase: user.ln_markets_passphrase,
      isTestnet: false // Force mainnet for now
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
