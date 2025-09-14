import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '@/services/auth.service';

const prisma = new PrismaClient();

export async function adminRoutes(fastify: FastifyInstance) {
  // Middleware para verificar se é superadmin
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('🔍 ADMIN MIDDLEWARE - Starting authentication check');
      console.log('🔍 Request URL:', request.url);
      console.log('🔍 Headers:', request.headers.authorization);
      
      // Get token from Authorization header
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No valid authorization header');
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Authorization header with Bearer token is required',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('🔍 Token extracted:', token.substring(0, 20) + '...');
      
      // Initialize auth service
      const authService = new AuthService(prisma, request.server);
      
      // Validate token and get user
      console.log('🔍 Validating session...');
      const user = await authService.validateSession(token);
      console.log('🔍 User from validateSession:', user?.email, 'ID:', user?.id);
      
      if (!user) {
        console.log('❌ No user found from validateSession');
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Invalid token'
        });
      }
      
      // Verificar se o usuário é superadmin
      console.log('🔍 Checking admin user record...');
      const adminUser = await prisma.adminUser.findUnique({
        where: { user_id: user.id },
        include: { user: true }
      });
      
      console.log('🔍 Admin user found:', adminUser);

      if (!adminUser) {
        console.log('❌ No admin user record found for user:', user.id);
        return reply.status(403).send({
          error: 'FORBIDDEN',
          message: 'Admin user record not found'
        });
      }

      if (adminUser.role !== 'superadmin') {
        console.log('❌ Access denied - not superadmin, role:', adminUser.role);
        return reply.status(403).send({
          error: 'FORBIDDEN',
          message: 'Access denied. Superadmin role required.'
        });
      }
      
      console.log('✅ Admin access granted for:', user.email);
    } catch (error) {
      console.log('❌ Admin middleware error:', (error as Error).message);
      console.log('❌ Admin middleware (error as Error).stack:', (error as Error).stack);
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }
  });

  // Dashboard com KPIs em tempo real
  fastify.get('/dashboard', {
    schema: {
      description: 'Get admin dashboard KPIs',
      tags: ['Admin'],
      querystring: {
        type: 'object',
        properties: {
          period: { 
            type: 'string',
            enum: ['1h', '24h', '7d', '30d'],
            default: '24h'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            kpis: {
              type: 'object',
              properties: {
                total_users: { type: 'number' },
                active_users: { type: 'number' },
                trades_success: { type: 'number' },
                trades_error: { type: 'number' },
                success_rate: { type: 'number' },
                revenue_sats: { type: 'number' },
                coupons_used: { type: 'number' },
                workers_active: { type: 'number' },
                workers_failed: { type: 'number' }
              }
            },
            charts: {
              type: 'object',
              properties: {
                trades_over_time: { type: 'array' },
                users_over_time: { type: 'array' },
                revenue_over_time: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { period: string } }>, reply: FastifyReply) => {
    const { period } = request.query;
    
    // Calcular período
    const now = new Date();
    const periodMap = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
    const startDate = periodMap[period as keyof typeof periodMap];

    try {
      console.log('🔍 ADMIN DASHBOARD - Starting data fetch for period:', period);
      
      // KPIs principais
      const [
        totalUsers,
        activeUsers,
        tradesData,
        revenueData,
        couponsData
      ] = await Promise.all([
        // Total de usuários
        prisma.user.count(),
        
        // Usuários ativos no período
        prisma.user.count({
          where: {
            last_activity_at: {
              gte: startDate
            }
          }
        }),
        
        // Dados de trades
        prisma.tradeLog.groupBy({
          by: ['status'],
          where: {
            executed_at: {
              gte: startDate
            }
          },
          _count: {
            status: true
          }
        }),
        
        // Receita em sats (temporariamente desabilitado devido a problema de schema)
        Promise.resolve({ _sum: { amount_sats: 0 } }),
        
        // Cupons usados
        prisma.userCoupon.count({
          where: {
            used_at: {
              gte: startDate
            }
          }
        })
      ]);

      // Calcular taxa de sucesso
      const successTrades = tradesData.find(t => t.status === 'success')?._count.status || 0;
      const errorTrades = tradesData.filter(t => t.status !== 'success').reduce((sum, t) => sum + t._count.status, 0);
      const totalTrades = successTrades + errorTrades;
      const successRate = totalTrades > 0 ? (successTrades / totalTrades) * 100 : 0;

      // Dados para gráficos (últimas 24 horas por hora)
      const hourlyData = await prisma.tradeLog.groupBy({
        by: ['executed_at'],
        where: {
          executed_at: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          executed_at: true
        }
      });

      return {
        kpis: {
          total_users: totalUsers,
          active_users: activeUsers,
          trades_success: successTrades,
          trades_error: errorTrades,
          success_rate: Math.round(successRate * 100) / 100,
          revenue_sats: revenueData._sum.amount_sats || 0,
          coupons_used: couponsData,
          workers_active: 4, // TODO: implementar verificação real dos workers
          workers_failed: 0  // TODO: implementar verificação real dos workers
        },
        charts: {
          trades_over_time: hourlyData.map(d => ({
            time: d.executed_at,
            count: d._count.executed_at
          })),
          users_over_time: [], // TODO: implementar
          revenue_over_time: [] // TODO: implementar
        }
      };
    } catch (error) {
      console.log('❌ ADMIN DASHBOARD ERROR:', error);
      fastify.log.error('Error fetching dashboard data:', error as any);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dashboard data'
      });
    }
  });

  // Monitoramento de infraestrutura
  fastify.get('/monitoring', {
    schema: {
      description: 'Get infrastructure monitoring data',
      tags: ['Admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            api_latency: { type: 'number' },
            error_rate: { type: 'number' },
            queue_sizes: { type: 'object' },
            ln_markets_status: { type: 'string' },
            system_health: { type: 'object' }
          }
        }
      }
    }
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // TODO: Implementar métricas reais do Prometheus/Redis
      return {
        api_latency: 150, // ms
        error_rate: 2.5, // %
        queue_sizes: {
          'automation-execute': 0,
          'notification': 0,
          'payment-validator': 0
        },
        ln_markets_status: 'healthy',
        system_health: {
          database: 'healthy',
          redis: 'healthy',
          workers: 'healthy'
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching monitoring data:', error as any);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch monitoring data'
      });
    }
  });

  // Alertas do sistema
  fastify.get('/alerts', {
    schema: {
      description: 'Get system alerts',
      tags: ['Admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            alerts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  message: { type: 'string' },
                  severity: { type: 'string' },
                  created_at: { type: 'string' },
                  is_global: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const alerts = await prisma.systemAlert.findMany({
        orderBy: {
          created_at: 'desc'
        },
        take: 50
      });

      return { alerts };
    } catch (error) {
      fastify.log.error('Error fetching alerts:', error as any);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch alerts'
      });
    }
  });

  // Gerenciamento de usuários
  fastify.get('/users', {
    schema: {
      description: 'Get users list',
      tags: ['Admin'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '20' },
          plan_type: { 
            type: 'string',
            enum: ['free', 'basic', 'advanced', 'pro', 'lifetime']
          },
          is_active: { type: 'string' },
          search: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  username: { type: 'string' },
                  plan_type: { type: 'string' },
                  is_active: { type: 'boolean' },
                  created_at: { type: 'string' },
                  last_activity_at: { type: 'string' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                pages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; plan_type?: string; is_active?: string; search?: string } }>, reply: FastifyReply) => {
    console.log('🔍 ADMIN USERS ROUTE - Starting user fetch');
    const { page, limit, plan_type, is_active, search } = request.query;
    const pageNum = parseInt(page || '1') || 1;
    const limitNum = parseInt(limit || '20') || 20;
    const skip = (pageNum - 1) * limitNum;

    console.log('🔍 Query params:', { page, limit, plan_type, is_active, search });

    try {
      const where: any = {};
      
      if (plan_type) where.plan_type = plan_type;
      if (is_active !== undefined) where.is_active = is_active;
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } }
        ];
      }

      console.log('🔍 Where clause:', where);

      console.log('🔍 Fetching users from database...');
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            username: true,
            plan_type: true,
            is_active: true,
            created_at: true,
            last_activity_at: true
          },
          skip,
          take: limitNum,
          orderBy: {
            created_at: 'desc'
          }
        }),
        prisma.user.count({ where })
      ]);

      console.log('✅ Users fetched successfully:', { usersCount: users.length, total });

      return {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      console.log('❌ Error fetching users:', error);
      console.log('❌ Error stack:', (error as Error).stack);
      fastify.log.error('Error fetching users:', error as any);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch users',
        details: (error as Error).message
      });
    }
  });

  // Ativar/Desativar usuário
  fastify.patch('/users/:id/toggle', {
    schema: {
      description: 'Toggle user active status',
      tags: ['Admin'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    console.log('🔍 ADMIN TOGGLE ROUTE - Starting toggle for user:', id);

    try {
      console.log('🔍 ADMIN TOGGLE ROUTE - Finding user in database...');
      const user = await prisma.user.findUnique({
        where: { id },
        select: { is_active: true }
      });

      console.log('🔍 ADMIN TOGGLE ROUTE - User found:', user);

      if (!user) {
        console.log('❌ ADMIN TOGGLE ROUTE - User not found');
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      console.log('🔍 ADMIN TOGGLE ROUTE - Current status:', user.is_active, '-> New status:', !user.is_active);

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { 
          is_active: !user.is_active,
          // Invalidate all sessions when deactivating user
          session_expires_at: !user.is_active ? null : undefined
        },
        select: {
          id: true,
          email: true,
          is_active: true
        }
      });

      console.log('✅ ADMIN TOGGLE ROUTE - User updated successfully:', updatedUser);

      // Log da ação (temporariamente desabilitado devido a problemas de migração)
      console.log('🔍 ADMIN TOGGLE ROUTE - Skipping system alert creation for now');

      return updatedUser;
    } catch (error) {
      console.log('❌ ADMIN TOGGLE ROUTE - Error:', error);
      console.log('❌ ADMIN TOGGLE ROUTE - Error stack:', (error as Error).stack);
      fastify.log.error('Error toggling user status:', error as any);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to toggle user status',
        details: (error as Error).message
      });
    }
  });

  // Delete user
  fastify.delete('/users/:id', {
    schema: {
      description: 'Delete user permanently',
      tags: ['Admin'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    console.log('🗑️ ADMIN DELETE ROUTE - Starting delete for user:', id);

    try {
      console.log('🗑️ ADMIN DELETE ROUTE - Finding user in database...');
      const user = await prisma.user.findUnique({
        where: { id },
        select: { 
          id: true, 
          email: true, 
          username: true,
          is_active: true 
        }
      });

      console.log('🗑️ ADMIN DELETE ROUTE - User found:', user);

      if (!user) {
        console.log('❌ ADMIN DELETE ROUTE - User not found');
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      console.log('🗑️ ADMIN DELETE ROUTE - Deleting user:', user.email);

      // Delete user permanently
      await prisma.user.delete({
        where: { id }
      });

      console.log('✅ ADMIN DELETE ROUTE - User deleted successfully:', user.email);

      return reply.status(200).send({
        success: true,
        message: `User ${user.email} deleted successfully`
      });
    } catch (error) {
      console.log('❌ ADMIN DELETE ROUTE - Error:', error);
      console.log('❌ ADMIN DELETE ROUTE - Error stack:', (error as Error).stack);
      fastify.log.error('Error deleting user:', error as any);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete user',
        details: (error as Error).message
      });
    }
  });

  // Configurações globais
  fastify.get('/settings', {
    schema: {
      description: 'Get global settings',
      tags: ['Admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            rate_limiting: { type: 'object' },
            captcha: { type: 'object' },
            smtp: { type: 'object' },
            webhooks: { type: 'object' }
          }
        }
      }
    }
  }, async (_request: FastifyRequest, _reply: FastifyReply) => {
    // TODO: Implementar configurações reais
    return {
      rate_limiting: {
        max_attempts: 100,
        window_minutes: 60
      },
      captcha: {
        enabled: false,
        site_key: '',
        secret_key: ''
      },
      smtp: {
        host: '',
        port: 587,
        user: '',
        enabled: false
      },
      webhooks: {
        slack: {
          url: '',
          channel: '',
          enabled: false
        },
        telegram: {
          bot_token: '',
          chat_id: '',
          enabled: false
        }
      }
    };
  });

  // Atualizar configurações
  fastify.put('/settings', {
    schema: {
      description: 'Update global settings',
      tags: ['Admin'],
      body: {
        type: 'object',
        properties: {
          rate_limiting: { type: 'object' },
          captcha: { type: 'object' },
          smtp: { type: 'object' },
          webhooks: { type: 'object' }
        }
      }
    }
  }, async (_request: FastifyRequest<{ Body: any }>, _reply: FastifyReply) => {
    // const settings = request.body;

    try {
      // TODO: Implementar salvamento real das configurações
      // Por enquanto, apenas log da ação
      await prisma.systemAlert.create({
        data: {
          message: 'Global settings updated by admin',
          severity: 'info',
          is_global: true
        }
      });

      return { message: 'Settings updated successfully' };
    } catch (error) {
      fastify.log.error('Error updating settings:', error as any);
      return _reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update settings'
      });
    }
  });
}
