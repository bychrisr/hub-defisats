import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SimulationAnalyticsQuery {
  search?: string;
  simulationType?: string;
  status?: string;
  planType?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getSimulationAnalytics = async (
  req: FastifyRequest<{ Querystring: SimulationAnalyticsQuery }>, 
  reply: FastifyReply
) => {
  try {
    const { 
      search, 
      simulationType, 
      status, 
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
    if (simulationType && simulationType !== 'all') whereClause.simulation_type = simulationType;
    if (planType && planType !== 'all') whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Buscar simulações
    const [simulations, totalCount] = await Promise.all([
      prisma.simulation.findMany({
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
      prisma.simulation.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalSimulations = simulations.length;
    const completedSimulations = simulations.filter(s => s.status === 'completed').length;
    const runningSimulations = simulations.filter(s => s.status === 'running').length;
    const failedSimulations = simulations.filter(s => s.status === 'failed').length;
    
    const avgProgress = simulations.length > 0 
      ? simulations.reduce((sum, s) => sum + s.progress, 0) / simulations.length 
      : 0;
    
    return {
      metrics: {
        totalSimulations,
        completedSimulations,
        runningSimulations,
        failedSimulations,
        avgProgress
      },
      simulations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch simulation analytics' });
  }
};

