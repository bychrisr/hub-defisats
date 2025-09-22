import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TradingAnalyticsQuery {
  timeRange?: string;
  planType?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getTradingAnalytics = async (
  req: FastifyRequest<{ Querystring: TradingAnalyticsQuery }>, 
  reply: FastifyReply
) => {
  try {
    const { 
      timeRange = '30d', 
      planType, 
      userId, 
      sortBy = 'totalTrades', 
      sortOrder = 'desc', 
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Calcular período
    const timeRangeMap: Record<string, number> = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = timeRangeMap[timeRange] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Construir filtros
    const whereClause: any = {
      created_at: { gte: startDate }
    };
    
    if (planType) whereClause.user = { plan_type: planType };
    if (userId) whereClause.user_id = userId;
    
    // Buscar dados de trading
    const [trades, users] = await Promise.all([
      prisma.trade.findMany({
        where: whereClause,
        include: { 
          user: { 
            select: { id: true, email: true, plan_type: true } 
          } 
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.findMany({
        where: planType ? { plan_type: planType } : {},
        select: { id: true, email: true, plan_type: true, created_at: true }
      })
    ]);
    
    // Calcular métricas por usuário
    const userMetrics = users.map(user => {
      const userTrades = trades.filter(trade => trade.user_id === user.id);
      const totalTrades = userTrades.length;
      const winningTrades = userTrades.filter(trade => trade.pnl > 0).length;
      const totalPnL = userTrades.reduce((sum, trade) => sum + trade.pnl, 0);
      const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      return {
        userId: user.id,
        email: user.email,
        planType: user.plan_type,
        totalTrades,
        winningTrades,
        losingTrades: totalTrades - winningTrades,
        totalPnL,
        avgPnL,
        winRate,
        lastTrade: userTrades[0]?.created_at || null
      };
    });
    
    // Ordenar resultados
    userMetrics.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] as number;
      const bValue = b[sortBy as keyof typeof b] as number;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = userMetrics.slice(startIndex, endIndex);
    
    // Calcular métricas gerais
    const totalTrades = trades.length;
    const totalWinningTrades = trades.filter(trade => trade.pnl > 0).length;
    const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const avgWinRate = totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0;
    
    return {
      metrics: {
        totalTrades,
        totalWinningTrades,
        totalLosingTrades: totalTrades - totalWinningTrades,
        totalPnL,
        avgWinRate,
        avgPnL: totalTrades > 0 ? totalPnL / totalTrades : 0
      },
      users: paginatedResults,
      pagination: {
        page,
        limit,
        total: userMetrics.length,
        totalPages: Math.ceil(userMetrics.length / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch trading analytics' });
  }
};

