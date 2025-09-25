import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BacktestReportsQuery {
  search?: string;
  status?: string;
  strategy?: string;
  planType?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getBacktestReports = async (
  req: FastifyRequest<{ Querystring: BacktestReportsQuery }>, 
  reply: FastifyReply
) => {
  try {
    const { 
      search, 
      status, 
      strategy, 
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
    
    if (status && status !== 'all') whereClause.status = status;
    if (strategy && strategy !== 'all') whereClause.strategy_name = { contains: strategy, mode: 'insensitive' };
    if (planType && planType !== 'all') whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { strategy_name: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Buscar relatórios
    const [reports, totalCount] = await Promise.all([
      prisma.backtestReport.findMany({
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
      prisma.backtestReport.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalReports = reports.length;
    const completedReports = reports.filter(r => r.status === 'completed').length;
    const runningReports = reports.filter(r => r.status === 'running').length;
    const failedReports = reports.filter(r => r.status === 'failed').length;
    
    const avgExecutionTime = reports
      .filter(r => r.execution_time)
      .reduce((sum, r) => sum + (r.execution_time || 0), 0) / 
      reports.filter(r => r.execution_time).length || 0;
    
    return {
      metrics: {
        totalReports,
        completedReports,
        runningReports,
        failedReports,
        avgExecutionTime
      },
      reports,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch backtest reports' });
  }
};

