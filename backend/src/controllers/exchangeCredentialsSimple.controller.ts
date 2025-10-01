import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

export class ExchangeCredentialsSimpleController {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * GET /api/exchanges - Listar todas as exchanges disponíveis
   */
  async getExchanges(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🔍 EXCHANGE CREDENTIALS SIMPLE - Fetching exchanges...');

      const exchanges = await this.prisma.exchange.findMany({
        where: { is_active: true },
        include: {
          credential_types: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });

      console.log('✅ EXCHANGE CREDENTIALS SIMPLE - Exchanges fetched successfully:', exchanges.length);

      return reply.status(200).send({
        success: true,
        data: exchanges,
        message: 'Exchanges fetched successfully'
      });

    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS SIMPLE - Error fetching exchanges:', error);
      return reply.status(500).send({
        success: false,
        error: 'FETCH_EXCHANGES_FAILED',
        message: error.message || 'Failed to fetch exchanges'
      });
    }
  }
}

