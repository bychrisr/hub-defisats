import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardMetrics = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    // Buscar métricas do banco de dados
    const [
      totalUsers,
      activeUsers,
      monthlyRevenue,
      totalTrades,
      systemUptime
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ 
        where: { 
          last_activity_at: { 
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
          } 
        } 
      }),
      prisma.payment.aggregate({ 
        where: { 
          status: 'completed', 
          created_at: { 
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          } 
        }, 
        _sum: { amount: true } 
      }),
      prisma.trade.count(),
      getSystemUptime()
    ]);

    return {
      totalUsers,
      activeUsers,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      totalTrades,
      systemUptime,
      uptimePercentage: (systemUptime / (30 * 24 * 60 * 60)) * 100
    };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch dashboard metrics' });
  }
};

const getSystemUptime = (): number => {
  // Simular uptime do sistema (em segundos)
  return 30 * 24 * 60 * 60; // 30 dias
};

