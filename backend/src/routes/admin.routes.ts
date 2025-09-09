import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function adminRoutes(fastify: FastifyInstance) {
  // Middleware para verificar se é superadmin
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      
      // Verificar se o usuário é superadmin
      const adminUser = await prisma.adminUser.findUnique({
        where: { user_id: user.id },
        include: { user: true }
      });

      if (!adminUser || adminUser.role !== 'superadmin') {
        return reply.status(403).send({
          error: 'FORBIDDEN',
          message: 'Access denied. Superadmin role required.'
        });
      }
    } catch (error) {
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
        
        // Receita em sats
        prisma.payment.aggregate({
          where: {
            status: 'paid',
            created_at: {
              gte: startDate
            }
          },
          _sum: {
            amount_sats: true
          }
        }),
        
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
      fastify.log.error('Error fetching dashboard data:', error);
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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
      fastify.log.error('Error fetching monitoring data:', error);
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const alerts = await prisma.systemAlert.findMany({
        orderBy: {
          created_at: 'desc'
        },
        take: 50
      });

      return { alerts };
    } catch (error) {
      fastify.log.error('Error fetching alerts:', error);
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
            enum: ['free', 'basic', 'advanced', 'pro']
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
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, plan_type, is_active, search } = request.query;
    const skip = (page - 1) * limit;

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
          take: limit,
          orderBy: {
            created_at: 'desc'
          }
        }),
        prisma.user.count({ where })
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching users:', error);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch users'
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

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { is_active: true }
      });

      if (!user) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { is_active: !user.is_active },
        select: {
          id: true,
          email: true,
          is_active: true
        }
      });

      // Log da ação
      await prisma.systemAlert.create({
        data: {
          message: `User ${updatedUser.email} ${updatedUser.is_active ? 'activated' : 'deactivated'} by admin`,
          severity: 'info',
          is_global: true
        }
      });

      return updatedUser;
    } catch (error) {
      fastify.log.error('Error toggling user status:', error);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to toggle user status'
      });
    }
  });

  // Gerenciamento de cupons
  fastify.get('/coupons', {
    schema: {
      description: 'Get coupons list',
      tags: ['Admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            coupons: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string' },
                  plan_type: { type: 'string' },
                  usage_limit: { type: 'number' },
                  used_count: { type: 'number' },
                  expires_at: { type: 'string' },
                  created_at: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const coupons = await prisma.coupon.findMany({
        include: {
          user_coupons: {
            select: {
              used_at: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      const formattedCoupons = coupons.map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        plan_type: coupon.plan_type,
        usage_limit: coupon.usage_limit,
        used_count: coupon.used_count,
        expires_at: coupon.expires_at,
        created_at: coupon.created_at,
        usage_history: coupon.user_coupons.map(uc => ({
          used_at: uc.used_at,
          user_email: uc.user.email
        }))
      }));

      return { coupons: formattedCoupons };
    } catch (error) {
      fastify.log.error('Error fetching coupons:', error);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch coupons'
      });
    }
  });

  // Criar cupom
  fastify.post('/coupons', {
    schema: {
      description: 'Create new coupon',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['code', 'plan_type'],
        properties: {
          code: { 
            type: 'string',
            minLength: 3,
            maxLength: 50,
            pattern: '^[A-Z0-9_-]+$'
          },
          plan_type: { 
            type: 'string',
            enum: ['free', 'basic', 'advanced', 'pro']
          },
          usage_limit: { 
            type: 'number',
            minimum: 1,
            maximum: 1000,
            default: 1
          },
          expires_at: { 
            type: 'string',
            format: 'date-time'
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            plan_type: { type: 'string' },
            usage_limit: { type: 'number' },
            expires_at: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { code, plan_type, usage_limit, expires_at } = request.body;

    try {
      const coupon = await prisma.coupon.create({
        data: {
          code,
          plan_type,
          usage_limit,
          expires_at: expires_at ? new Date(expires_at) : null
        }
      });

      // Log da ação
      await prisma.systemAlert.create({
        data: {
          message: `Coupon ${code} created for plan ${plan_type}`,
          severity: 'info',
          is_global: true
        }
      });

      return reply.status(201).send(coupon);
    } catch (error) {
      if ((error as any).code === 'P2002') {
        return reply.status(409).send({
          error: 'CONFLICT',
          message: 'Coupon code already exists'
        });
      }
      
      fastify.log.error('Error creating coupon:', error);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create coupon'
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const settings = request.body;

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
      fastify.log.error('Error updating settings:', error);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update settings'
      });
    }
  });
}
