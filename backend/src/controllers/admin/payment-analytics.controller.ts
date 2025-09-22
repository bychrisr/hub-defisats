import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PaymentAnalyticsQuery {
  search?: string;
  status?: string;
  paymentMethod?: string;
  planType?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getPaymentAnalytics = async (
  req: FastifyRequest<{ Querystring: PaymentAnalyticsQuery }>, 
  reply: FastifyReply
) => {
  try {
    const { 
      search, 
      status, 
      paymentMethod, 
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
    if (paymentMethod) whereClause.payment_method = paymentMethod;
    if (planType) whereClause.user = { plan_type: planType };
    if (search) {
      whereClause.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { payment_id: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Buscar pagamentos
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
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
      prisma.payment.count({ where: whereClause })
    ]);
    
    // Calcular métricas
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const conversionRate = payments.length > 0 
      ? (payments.filter(p => p.status === 'completed').length / payments.length) * 100 
      : 0;
    
    const avgTransactionValue = payments.length > 0 
      ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length 
      : 0;
    
    return {
      metrics: {
        totalPayments: payments.length,
        completedPayments: payments.filter(p => p.status === 'completed').length,
        failedPayments: payments.filter(p => p.status === 'failed').length,
        totalRevenue,
        conversionRate,
        avgTransactionValue
      },
      payments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch payment analytics' });
  }
};

