import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AutomationManagementQuery {
  search?: string;
  type?: string;
  status?: string;
  riskLevel?: string;
  planType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getAutomationManagement = async (
  req: FastifyRequest<{ Querystring: AutomationManagementQuery }>, 
  reply: FastifyReply
) => {
  try {
    const { 
      search, 
      type, 
      status, 
      riskLevel, 
      planType, 
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Construir filtros
    const whereClause: any = {};
    
    if (status && status !== 'all') whereClause.status = status;
    if (type && type !== 'all') whereClause.type = type;
    if (riskLevel && riskLevel !== 'all') whereClause.risk_level = riskLevel;
    if (planType && planType !== 'all') whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Buscar automações
    const [automations, totalCount] = await Promise.all([
      prisma.automation.findMany({
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
      prisma.automation.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalAutomations = automations.length;
    const activeAutomations = automations.filter(a => a.status === 'active').length;
    const pausedAutomations = automations.filter(a => a.status === 'paused').length;
    const stoppedAutomations = automations.filter(a => a.status === 'stopped').length;
    const errorAutomations = automations.filter(a => a.status === 'error').length;
    
    return {
      metrics: {
        totalAutomations,
        activeAutomations,
        pausedAutomations,
        stoppedAutomations,
        errorAutomations
      },
      automations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch automation management' });
  }
};

