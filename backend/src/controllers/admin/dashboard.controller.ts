import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardMetrics = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    console.log('🔍 DASHBOARD METRICS - Starting...');
    
    // Buscar métricas básicas do banco de dados
    const totalUsers = await prisma.user.count();
    console.log('✅ DASHBOARD METRICS - Total users:', totalUsers);
    
    const activeUsers = await prisma.user.count({ 
      where: { 
        last_activity_at: { 
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        } 
      } 
    });
    console.log('✅ DASHBOARD METRICS - Active users:', activeUsers);
    
    // Tentar buscar métricas de pagamento (pode falhar se a tabela não existir)
    let monthlyRevenue = 0;
    try {
      const paymentData = await prisma.payment.aggregate({ 
        where: { 
          status: 'completed', 
          created_at: { 
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          } 
        }, 
        _sum: { amount_sats: true } 
      });
      monthlyRevenue = paymentData._sum.amount_sats || 0;
      console.log('✅ DASHBOARD METRICS - Monthly revenue:', monthlyRevenue);
    } catch (error) {
      console.log('⚠️ DASHBOARD METRICS - Payment metrics not available:', error);
    }
    
    const totalTrades = await prisma.tradeLog.count();
    console.log('✅ DASHBOARD METRICS - Total trades:', totalTrades);
    
    const systemUptime = getSystemUptime();
    console.log('✅ DASHBOARD METRICS - System uptime:', systemUptime);

    const result = {
      totalUsers,
      activeUsers,
      monthlyRevenue,
      totalTrades,
      systemUptime,
      uptimePercentage: (systemUptime / (30 * 24 * 60 * 60)) * 100
    };
    
    console.log('✅ DASHBOARD METRICS - Result:', result);
    return result;
  } catch (error) {
    console.error('❌ DASHBOARD METRICS - Error:', error);
    reply.status(500).send({ error: 'Failed to fetch dashboard metrics' });
  }
};

const getSystemUptime = (): number => {
  // Simular uptime do sistema (em segundos)
  return 30 * 24 * 60 * 60; // 30 dias
};

