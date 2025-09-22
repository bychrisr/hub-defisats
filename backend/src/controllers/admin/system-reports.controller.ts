import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SystemReportsQuery {
  search?: string;
  type?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getSystemReports = async (
  req: FastifyRequest<{ Querystring: SystemReportsQuery }>, 
  reply: FastifyReply
) => {
  try {
    const { 
      search, 
      type, 
      status, 
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Construir filtros
    const whereClause: any = {};
    
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Buscar relatórios
    const [reports, totalCount] = await Promise.all([
      prisma.systemReport.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.systemReport.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalReports = reports.length;
    const completedReports = reports.filter(r => r.status === 'completed').length;
    const generatingReports = reports.filter(r => r.status === 'generating').length;
    const failedReports = reports.filter(r => r.status === 'failed').length;
    const scheduledReports = reports.filter(r => r.status === 'scheduled').length;
    
    const totalFileSize = reports
      .filter(r => r.file_size)
      .reduce((sum, r) => sum + (r.file_size || 0), 0);
    
    return {
      metrics: {
        totalReports,
        completedReports,
        generatingReports,
        failedReports,
        scheduledReports,
        totalFileSize
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
    reply.status(500).send({ error: 'Failed to fetch system reports' });
  }
};

