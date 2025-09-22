import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationManagementQuery {
  search?: string;
  channel?: string;
  category?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getNotificationManagement = async (
  req: FastifyRequest<{ Querystring: NotificationManagementQuery }>, 
  reply: FastifyReply
) => {
  try {
    const { 
      search, 
      channel, 
      category, 
      isActive, 
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Construir filtros
    const whereClause: any = {};
    
    if (channel) whereClause.channel = channel;
    if (category) whereClause.category = category;
    if (isActive !== undefined) whereClause.is_active = isActive === 'true';
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Buscar templates
    const [templates, totalCount] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notificationTemplate.count({ where: whereClause })
    ]);
    
    // Buscar logs de notificação para métricas
    const notificationLogs = await prisma.notificationLog.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
        }
      }
    });
    
    // Calcular métricas
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.is_active).length;
    const totalNotifications = notificationLogs.length;
    const sentNotifications = notificationLogs.filter(n => n.status === 'sent').length;
    const failedNotifications = notificationLogs.filter(n => n.status === 'failed').length;
    const successRate = totalNotifications > 0 ? (sentNotifications / totalNotifications) * 100 : 0;
    
    return {
      metrics: {
        totalTemplates,
        activeTemplates,
        totalNotifications,
        sentNotifications,
        failedNotifications,
        successRate
      },
      templates,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch notification management' });
  }
};

