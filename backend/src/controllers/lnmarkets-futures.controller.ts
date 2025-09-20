import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIService } from '../services/lnmarkets-api.service';

interface FuturesTradeRequest {
  side: 'b' | 's';
  quantity: number;
  leverage: number;
  stoploss?: number;
  takeprofit?: number;
  margin_mode?: 'isolated' | 'cross';
}

interface FuturesUpdateRequest {
  stoploss?: number;
  takeprofit?: number;
  leverage?: number;
}

interface FuturesAddMarginRequest {
  id: string;
  amount: number;
}

export class LNMarketsFuturesController {
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

  async addMargin(
    request: FastifyRequest<{ Body: FuturesAddMarginRequest }>,
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

      const { id, amount } = request.body;
      const lnmarkets = await this.getLNMarketsService(userId);
      
      const result = await lnmarkets.addMargin(id, amount);
      
      console.log(`[FuturesController] Margin added successfully for trade ${id}`, {
        userId,
        tradeId: id,
        amount,
        result
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[FuturesController] Error adding margin:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add margin',
        details: error.message
      });
    }
  }

  async cancelAllTrades(request: FastifyRequest, reply: FastifyReply) {
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
      const result = await lnmarkets.cancelAllTrades();
      
      console.log(`[FuturesController] All trades cancelled for user ${userId}`, {
        userId,
        result
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[FuturesController] Error cancelling all trades:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to cancel all trades',
        details: error.message
      });
    }
  }

  async closeAllTrades(request: FastifyRequest, reply: FastifyReply) {
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
      const result = await lnmarkets.closeAllTrades();
      
      console.log(`[FuturesController] All trades closed for user ${userId}`, {
        userId,
        result
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[FuturesController] Error closing all trades:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to close all trades',
        details: error.message
      });
    }
  }

  async getTrades(
    request: FastifyRequest<{ Querystring: {
      limit?: string;
      offset?: string;
      status?: string;
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

      const { limit, offset, status, type } = request.query;
      const lnmarkets = await this.getLNMarketsService(userId);
      
      const params: any = {};
      if (limit) params.limit = parseInt(limit);
      if (offset) params.offset = parseInt(offset);
      if (status) params.status = status;
      if (type) params.type = type;

      const result = await lnmarkets.getTrades(params);
      
      console.log(`[FuturesController] Trades retrieved for user ${userId}`, {
        userId,
        params,
        count: Array.isArray(result) ? result.length : 'unknown'
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[FuturesController] Error getting trades:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get trades',
        details: error.message
      });
    }
  }

  async updateTrade(
    request: FastifyRequest<{ 
      Params: { id: string };
      Body: FuturesUpdateRequest;
    }>,
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

      const { id } = request.params;
      const updateData = request.body;
      const lnmarkets = await this.getLNMarketsService(userId);
      
      const result = await lnmarkets.updateTrade(id, updateData);
      
      console.log(`[FuturesController] Trade updated for user ${userId}`, {
        userId,
        tradeId: id,
        updateData,
        result
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[FuturesController] Error updating trade:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update trade',
        details: error.message
      });
    }
  }

  async createTrade(
    request: FastifyRequest<{ Body: FuturesTradeRequest }>,
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

      const tradeData = request.body;
      const lnmarkets = await this.getLNMarketsService(userId);
      
      const result = await lnmarkets.createTrade(tradeData);
      
      console.log(`[FuturesController] Trade created for user ${userId}`, {
        userId,
        tradeData,
        result
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[FuturesController] Error creating trade:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create trade',
        details: error.message
      });
    }
  }

  async getFuturesMarket(request: FastifyRequest, reply: FastifyReply) {
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
      const result = await lnmarkets.getFuturesMarket();
      
      console.log(`[FuturesController] Futures market data retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[FuturesController] Error getting futures market:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get futures market data',
        details: error.message
      });
    }
  }

  async getTrade(
    request: FastifyRequest<{ Params: { id: string } }>,
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

      const { id } = request.params;
      const lnmarkets = await this.getLNMarketsService(userId);
      
      const result = await lnmarkets.getTrade(id);
      
      console.log(`[FuturesController] Trade retrieved for user ${userId}`, {
        userId,
        tradeId: id
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[FuturesController] Error getting trade:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get trade',
        details: error.message
      });
    }
  }
}
