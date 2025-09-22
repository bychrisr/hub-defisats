import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TradeLogsQuery {
  search?: string;
  status?: string;
  action?: string;
  planType?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getTradeLogs = async (
  req: FastifyRequest<{ Querystring: TradeLogsQuery }>, 
  reply: FastifyReply
) => {
  try {
    const { 
      search, 
      status, 
      action, 
      planType, 
      dateRange = '30d',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Calcular período
    const timeRangeMap: Record<string, number> = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = timeRangeMap[dateRange] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Construir filtros
    const whereClause: any = {
      created_at: { gte: startDate }
    };
    
    if (status) whereClause.status = status;
    if (action) whereClause.action = action;
    if (planType) whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { trade_id: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Buscar logs
    const [logs, totalCount] = await Promise.all([
      prisma.tradeLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, email: true, plan_type: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tradeLog.count({ where: whereClause })
    ]);
    
    return {
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch trade logs' });
  }
};

