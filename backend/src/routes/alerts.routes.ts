import { FastifyInstance } from 'fastify';
import { alerting } from '@/services/alerting.service';
import { authMiddleware } from '@/middleware/auth.middleware';

export async function alertsRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  fastify.addHook('preHandler', authMiddleware);

  // Obter alertas ativos
  fastify.get('/alerts/active', {
    schema: {
      description: 'Get active alerts',
      tags: ['Alerts'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  ruleId: { type: 'string' },
                  severity: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' },
                  resolved: { type: 'boolean' },
                },
              },
            },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const activeAlerts = alerting.getActiveAlerts();
        return {
          success: true,
          data: activeAlerts,
        };
      } catch (error) {
        fastify.log.error('Error getting active alerts:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get active alerts',
        });
      }
    },
  });

  // Obter todos os alertas
  fastify.get('/alerts', {
    schema: {
      description: 'Get all alerts',
      tags: ['Alerts'],
      querystring: {
        type: 'object',
        properties: {
          severity: { type: 'string' },
          limit: { type: 'number' },
          offset: { type: 'number' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  ruleId: { type: 'string' },
                  severity: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' },
                  resolved: { type: 'boolean' },
                  resolvedAt: { type: 'string' },
                },
              },
            },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const query = _request.query as any;
        let alerts = alerting.getAllAlerts();

        // Filtrar por severidade se especificado
        if (query.severity) {
          alerts = alerting.getAlertsBySeverity(query.severity);
        }

        // Aplicar paginação
        const limit = query.limit || 50;
        const offset = query.offset || 0;
        const paginatedAlerts = alerts.slice(offset, offset + limit);

        return {
          success: true,
          data: paginatedAlerts,
        };
      } catch (error) {
        fastify.log.error('Error getting alerts:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get alerts',
        });
      }
    },
  });

  // Resolver alerta
  fastify.post('/alerts/:alertId/resolve', {
    schema: {
      description: 'Resolve an alert',
      tags: ['Alerts'],
      params: {
        type: 'object',
        properties: {
          alertId: { type: 'string' },
        },
        required: ['alertId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const { alertId } = _request.params as { alertId: string };

        const alert = alerting.getAllAlerts().find(a => a.id === alertId);
        if (!alert) {
          return reply.status(404).send({
            success: false,
            error: 'Alert not found',
          });
        }

        alerting.resolveAlert(alertId);

        return {
          success: true,
          message: 'Alert resolved successfully',
        };
      } catch (error) {
        fastify.log.error('Error resolving alert:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resolve alert',
        });
      }
    },
  });

  // Obter estatísticas de alertas
  fastify.get('/alerts/stats', {
    schema: {
      description: 'Get alert statistics',
      tags: ['Alerts'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                active: { type: 'number' },
                resolved: { type: 'number' },
                bySeverity: {
                  type: 'object',
                  properties: {
                    low: { type: 'number' },
                    medium: { type: 'number' },
                    high: { type: 'number' },
                    critical: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const allAlerts = alerting.getAllAlerts();
        const activeAlerts = alerting.getActiveAlerts();

        const stats = {
          total: allAlerts.length,
          active: activeAlerts.length,
          resolved: allAlerts.length - activeAlerts.length,
          bySeverity: {
            low: allAlerts.filter(a => a.severity === 'low').length,
            medium: allAlerts.filter(a => a.severity === 'medium').length,
            high: allAlerts.filter(a => a.severity === 'high').length,
            critical: allAlerts.filter(a => a.severity === 'critical').length,
          },
        };

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        fastify.log.error('Error getting alert stats:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get alert statistics',
        });
      }
    },
  });

  // Limpar alertas antigos
  fastify.post('/alerts/cleanup', {
    schema: {
      description: 'Clean up old alerts',
      tags: ['Alerts'],
      querystring: {
        type: 'object',
        properties: {
          maxAge: { type: 'number', description: 'Maximum age in hours' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            cleaned: { type: 'number' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const query = _request.query as any;
        const maxAgeHours = query.maxAge || 24;
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

        const beforeCount = alerting.getAllAlerts().length;
        alerting.cleanupOldAlerts(maxAgeMs);
        const afterCount = alerting.getAllAlerts().length;
        const cleaned = beforeCount - afterCount;

        return {
          success: true,
          message: `Cleaned up ${cleaned} old alerts`,
          cleaned,
        };
      } catch (error) {
        fastify.log.error('Error cleaning up alerts:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to clean up alerts',
        });
      }
    },
  });
}
