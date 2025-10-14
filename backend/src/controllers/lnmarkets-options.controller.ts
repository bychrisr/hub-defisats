import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

interface OptionsTradeRequest {
  side: 'b' | 's';
  quantity: number;
  instrument: string;
  stoploss?: number;
  takeprofit?: number;
}

interface OptionsUpdateRequest {
  stoploss?: number;
  takeprofit?: number;
}

export class LNMarketsOptionsController {
  constructor(private prisma: PrismaClient) {}

  private async getLNMarketsService(userId: string): Promise<LNMarketsAPIService> {
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
      const result = await lnmarkets.closeAllOptionsTrades();
      
      console.log(`[OptionsController] All options trades closed for user ${userId}`, {
        userId,
        result
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[OptionsController] Error closing all options trades:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to close all options trades',
        details: error.message
      });
    }
  }

  async getTrades(
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

      const result = await lnmarkets.getOptionsTrades(params);
      
      console.log(`[OptionsController] Options trades retrieved for user ${userId}`, {
        userId,
        params,
        count: Array.isArray(result) ? result.length : 'unknown'
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[OptionsController] Error getting options trades:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get options trades',
        details: error.message
      });
    }
  }

  async updateTrade(
    request: FastifyRequest<{ 
      Params: { id: string };
      Body: OptionsUpdateRequest;
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
      
      const result = await lnmarkets.updateOptionsTrade(id, updateData);
      
      console.log(`[OptionsController] Options trade updated for user ${userId}`, {
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
      console.error('[OptionsController] Error updating options trade:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update options trade',
        details: error.message
      });
    }
  }

  async createTrade(
    request: FastifyRequest<{ Body: OptionsTradeRequest }>,
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
      
      const result = await lnmarkets.createOptionsTrade(tradeData);
      
      console.log(`[OptionsController] Options trade created for user ${userId}`, {
        userId,
        tradeData,
        result
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[OptionsController] Error creating options trade:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create options trade',
        details: error.message
      });
    }
  }

  async getOptionsMarket(request: FastifyRequest, reply: FastifyReply) {
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
      const result = await lnmarkets.getOptionsMarket();
      
      console.log(`[OptionsController] Options market data retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[OptionsController] Error getting options market:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get options market data',
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
      
      const result = await lnmarkets.getOptionsTrade(id);
      
      console.log(`[OptionsController] Options trade retrieved for user ${userId}`, {
        userId,
        tradeId: id
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[OptionsController] Error getting options trade:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get options trade',
        details: error.message
      });
    }
  }
}
