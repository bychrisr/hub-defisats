import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogsQuery {
  search?: string;
  action?: string;
  resource?: string;
  severity?: string;
  userId?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getAuditLogs = async (
  req: FastifyRequest<{ Querystring: AuditLogsQuery }>, 
  reply: FastifyReply
) => {
  try {
    const { 
      search, 
      action, 
      resource, 
      severity, 
      userId, 
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
    
    if (action) whereClause.action = action;
    if (resource) whereClause.resource = resource;
    if (severity) whereClause.severity = severity;
    if (userId) whereClause.user_id = userId;
    if (search) {
      whereClause.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Buscar logs
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
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
      prisma.auditLog.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalLogs = logs.length;
    const criticalLogs = logs.filter(l => l.severity === 'critical').length;
    const highLogs = logs.filter(l => l.severity === 'high').length;
    const mediumLogs = logs.filter(l => l.severity === 'medium').length;
    const lowLogs = logs.filter(l => l.severity === 'low').length;
    
    const uniqueUsers = new Set(logs.map(l => l.user_id).filter(Boolean)).size;
    
    return {
      metrics: {
        totalLogs,
        criticalLogs,
        highLogs,
        mediumLogs,
        lowLogs,
        uniqueUsers
      },
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch audit logs' });
  }
};

