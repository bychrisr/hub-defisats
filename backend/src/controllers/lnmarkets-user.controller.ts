import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIService } from '@/services/lnmarkets-api.service';

export class LNMarketsUserController {
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

  async getUser(request: FastifyRequest, reply: FastifyReply) {
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
      const result = await lnmarkets.getUser();
      
      console.log(`[UserController] User data retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user data',
        details: error.message
      });
    }
  }

  async getUserBalance(request: FastifyRequest, reply: FastifyReply) {
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
      const result = await lnmarkets.getUserBalance();
      
      console.log(`[UserController] User balance retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user balance:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user balance',
        details: error.message
      });
    }
  }

  async getUserHistory(
    request: FastifyRequest<{ Querystring: {
      limit?: string;
      offset?: string;
      type?: string;
    } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const { limit, offset, type } = request.query;
      const lnmarkets = await this.getLNMarketsService(userId);
      
      const params: any = {};
      if (limit) params.limit = parseInt(limit);
      if (offset) params.offset = parseInt(offset);
      if (type) params.type = type;

      const result = await lnmarkets.getUserHistory(params);
      
      console.log(`[UserController] User history retrieved for user ${userId}`, {
        userId,
        params,
        count: Array.isArray(result) ? result.length : 'unknown'
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user history:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user history',
        details: error.message
      });
    }
  }

  async getUserTrades(
    request: FastifyRequest<{ Querystring: {
      limit?: string;
      offset?: string;
      status?: string;
    } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const { limit, offset, status } = request.query;
      const lnmarkets = await this.getLNMarketsService(userId);
      
      const params: any = {};
      if (limit) params.limit = parseInt(limit);
      if (offset) params.offset = parseInt(offset);
      if (status) params.status = status;

      const result = await lnmarkets.getUserTrades(params);
      
      console.log(`[UserController] User trades retrieved for user ${userId}`, {
        userId,
        params,
        count: Array.isArray(result) ? result.length : 'unknown'
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user trades:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user trades',
        details: error.message
      });
    }
  }

  async getUserPositions(request: FastifyRequest, reply: FastifyReply) {
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
      const result = await lnmarkets.getUserPositions();
      
      console.log(`[UserController] User positions retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user positions:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user positions',
        details: error.message
      });
    }
  }

  async getUserOrders(request: FastifyRequest, reply: FastifyReply) {
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
      const result = await lnmarkets.getUserOrders();
      
      console.log(`[UserController] User orders retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user orders:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user orders',
        details: error.message
      });
    }
  }
}
