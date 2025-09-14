import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware, authenticateAdmin } from '@/middleware/auth.middleware';

// Schema para validação de upgrade
const upgradeUserPlanSchema = z.object({
  newPlan: z.enum(['free', 'basic', 'advanced', 'pro', 'lifetime'], {
    errorMap: () => ({ message: 'Plano deve ser: free, basic, advanced, pro ou lifetime' })
  }),
  reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres').max(500, 'Motivo deve ter no máximo 500 caracteres'),
  effectiveDate: z.string().datetime().optional().default(() => new Date().toISOString())
});

const getUpgradeHistorySchema = z.object({
  userId: z.string().uuid().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10')
});

export async function adminUpgradeRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  // Aplicar middleware de autenticação e admin
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', authenticateAdmin);

  // Upgrade de plano de usuário
  fastify.put(
    '/admin/users/:userId/upgrade',
    {
      schema: {
        description: 'Upgrade de plano de usuário',
        tags: ['Admin - Upgrade'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' }
          },
          required: ['userId']
        },
        body: {
          type: 'object',
          properties: {
            newPlan: { 
              type: 'string', 
              enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'] 
            },
            reason: { type: 'string', minLength: 10, maxLength: 500 },
            effectiveDate: { type: 'string', format: 'date-time' }
          },
          required: ['newPlan', 'reason']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  oldPlan: { type: 'string' },
                  newPlan: { type: 'string' },
                  effectiveDate: { type: 'string' },
                  upgradedBy: { type: 'string' },
                  reason: { type: 'string' }
                }
              }
            }
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const adminId = (request as any).user?.id;
        const body = upgradeUserPlanSchema.parse(request.body);

        console.log('🔄 ADMIN UPGRADE - Iniciando upgrade de plano:', {
          userId,
          newPlan: body.newPlan,
          reason: body.reason,
          adminId
        });

        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
            plan_type: true,
            is_active: true
          }
        });

        if (!user) {
          return reply.status(404).send({
            success: false,
            error: 'USER_NOT_FOUND',
            message: 'Usuário não encontrado'
          });
        }

        // Verificar se o usuário está ativo
        if (!user.is_active) {
          return reply.status(400).send({
            success: false,
            error: 'USER_INACTIVE',
            message: 'Não é possível fazer upgrade de usuário inativo'
          });
        }

        // Verificar se já está no plano solicitado
        if (user.plan_type === body.newPlan) {
          return reply.status(400).send({
            success: false,
            error: 'ALREADY_ON_PLAN',
            message: `Usuário já está no plano ${body.newPlan}`
          });
        }

        const oldPlan = user.plan_type;

        // Atualizar plano do usuário
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            plan_type: body.newPlan,
            updated_at: new Date()
          },
          select: {
            id: true,
            email: true,
            username: true,
            plan_type: true
          }
        });

        // Registrar histórico de upgrade
        await prisma.userUpgradeHistory.create({
          data: {
            user_id: userId,
            old_plan: oldPlan,
            new_plan: body.newPlan,
            reason: body.reason,
            effective_date: new Date(body.effectiveDate),
            upgraded_by: adminId,
            created_at: new Date()
          }
        });

        console.log('✅ ADMIN UPGRADE - Upgrade realizado com sucesso:', {
          userId,
          oldPlan,
          newPlan: body.newPlan,
          adminId
        });

        return reply.send({
          success: true,
          message: `Plano do usuário ${user.email} atualizado de ${oldPlan} para ${body.newPlan}`,
          data: {
            userId: updatedUser.id,
            oldPlan,
            newPlan: updatedUser.plan_type,
            effectiveDate: body.effectiveDate,
            upgradedBy: adminId,
            reason: body.reason
          }
        });

      } catch (error: any) {
        console.error('❌ ADMIN UPGRADE - Erro no upgrade:', error);

        if (error.name === 'ZodError') {
          return reply.status(400).send({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Dados inválidos',
            details: error.errors
          });
        }

        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor',
          details: error.message
        });
      }
    }
  );

  // Obter histórico de upgrades
  fastify.get(
    '/admin/upgrades/history',
    {
      schema: {
        description: 'Obter histórico de upgrades',
        tags: ['Admin - Upgrade'],
        querystring: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            page: { type: 'string', default: '1' },
            limit: { type: 'string', default: '10' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  upgrades: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        userId: { type: 'string' },
                        userEmail: { type: 'string' },
                        oldPlan: { type: 'string' },
                        newPlan: { type: 'string' },
                        reason: { type: 'string' },
                        effectiveDate: { type: 'string' },
                        upgradedBy: { type: 'string' },
                        adminEmail: { type: 'string' },
                        createdAt: { type: 'string' }
                      }
                    }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'number' },
                      limit: { type: 'number' },
                      total: { type: 'number' },
                      totalPages: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const query = getUpgradeHistorySchema.parse(request.query);
        const { userId, page, limit } = query;
        const offset = (page - 1) * limit;

        console.log('📊 ADMIN UPGRADE - Buscando histórico:', { userId, page, limit });

        // Construir filtros
        const where: any = {};
        if (userId) {
          where.user_id = userId;
        }

        // Buscar upgrades com informações do usuário e admin
        const [upgrades, total] = await Promise.all([
          prisma.userUpgradeHistory.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true
                }
              },
              admin: {
                select: {
                  id: true,
                  email: true,
                  username: true
                }
              }
            },
            orderBy: {
              created_at: 'desc'
            },
            skip: offset,
            take: limit
          }),
          prisma.userUpgradeHistory.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);

        // Formatar dados de resposta
        const formattedUpgrades = upgrades.map(upgrade => ({
          id: upgrade.id,
          userId: upgrade.user_id,
          userEmail: upgrade.user.email,
          oldPlan: upgrade.old_plan,
          newPlan: upgrade.new_plan,
          reason: upgrade.reason,
          effectiveDate: upgrade.effective_date.toISOString(),
          upgradedBy: upgrade.upgraded_by,
          adminEmail: upgrade.admin?.email || 'Sistema',
          createdAt: upgrade.created_at.toISOString()
        }));

        console.log('✅ ADMIN UPGRADE - Histórico encontrado:', {
          count: formattedUpgrades.length,
          total,
          page,
          totalPages
        });

        return reply.send({
          success: true,
          data: {
            upgrades: formattedUpgrades,
            pagination: {
              page,
              limit,
              total,
              totalPages
            }
          }
        });

      } catch (error: any) {
        console.error('❌ ADMIN UPGRADE - Erro ao buscar histórico:', error);

        if (error.name === 'ZodError') {
          return reply.status(400).send({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Parâmetros inválidos',
            details: error.errors
          });
        }

        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor',
          details: error.message
        });
      }
    }
  );

  // Obter estatísticas de upgrades
  fastify.get(
    '/admin/upgrades/stats',
    {
      schema: {
        description: 'Obter estatísticas de upgrades',
        tags: ['Admin - Upgrade'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  totalUpgrades: { type: 'number' },
                  upgradesByPlan: { type: 'object' },
                  upgradesByMonth: { type: 'array' },
                  recentUpgrades: { type: 'array' }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        console.log('📊 ADMIN UPGRADE - Buscando estatísticas');

        // Estatísticas gerais
        const totalUpgrades = await prisma.userUpgradeHistory.count();

        // Upgrades por plano
        const upgradesByPlan = await prisma.userUpgradeHistory.groupBy({
          by: ['new_plan'],
          _count: {
            new_plan: true
          }
        });

        // Upgrades dos últimos 6 meses
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const upgradesByMonth = await prisma.userUpgradeHistory.groupBy({
          by: ['created_at'],
          where: {
            created_at: {
              gte: sixMonthsAgo
            }
          },
          _count: {
            id: true
          },
          orderBy: {
            created_at: 'asc'
          }
        });

        // Upgrades recentes (últimos 10)
        const recentUpgrades = await prisma.userUpgradeHistory.findMany({
          include: {
            user: {
              select: {
                email: true,
                username: true
              }
            },
            admin: {
              select: {
                email: true,
                username: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 10
        });

        const stats = {
          totalUpgrades,
          upgradesByPlan: upgradesByPlan.reduce((acc, item) => {
            acc[item.new_plan] = item._count.new_plan;
            return acc;
          }, {} as Record<string, number>),
          upgradesByMonth: upgradesByMonth.map(item => ({
            month: item.created_at.toISOString().substring(0, 7),
            count: item._count.id
          })),
          recentUpgrades: recentUpgrades.map(upgrade => ({
            id: upgrade.id,
            userEmail: upgrade.user.email,
            oldPlan: upgrade.old_plan,
            newPlan: upgrade.new_plan,
            adminEmail: upgrade.admin?.email || 'Sistema',
            createdAt: upgrade.created_at.toISOString()
          }))
        };

        console.log('✅ ADMIN UPGRADE - Estatísticas obtidas:', stats);

        return reply.send({
          success: true,
          data: stats
        });

      } catch (error: any) {
        console.error('❌ ADMIN UPGRADE - Erro ao buscar estatísticas:', error);
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor',
          details: error.message
        });
      }
    }
  );
}
