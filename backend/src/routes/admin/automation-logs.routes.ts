import { FastifyInstance } from 'fastify';
import { AutomationLogsController } from '../../controllers/admin/automation-logs.controller';
import { adminAuthMiddleware } from '../../middleware/auth.middleware';

export async function automationLogsRoutes(fastify: FastifyInstance) {
  const controller = new AutomationLogsController(fastify.prisma);

  // Aplicar middleware de autenticação admin
  fastify.addHook('preHandler', adminAuthMiddleware);

  /**
   * GET /api/admin/automation-logs
   * 
   * Obter logs de automações com filtros
   */
  fastify.get('/automation-logs', {
    schema: {
      description: 'Get automation logs with filters',
      tags: ['Admin', 'Automation Logs'],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          accountId: { type: 'string' },
          automationId: { type: 'string' },
          action: { 
            type: 'string',
            enum: ['started', 'completed', 'failed', 'paused', 'resumed', 'stopped', 'error']
          },
          status: { 
            type: 'string',
            enum: ['SUCCESS', 'FAILED', 'PENDING', 'RUNNING']
          },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '50' },
          sortBy: { type: 'string', default: 'timestamp' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string' }
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
                logs: { type: 'array' },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                stats: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, controller.getAutomationLogs.bind(controller));

  /**
   * GET /api/admin/automation-logs/stats
   * 
   * Obter estatísticas de logs de automações
   */
  fastify.get('/automation-logs/stats', {
    schema: {
      description: 'Get automation logs statistics',
      tags: ['Admin', 'Automation Logs'],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          accountId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, controller.getAutomationLogsStats.bind(controller));

  /**
   * POST /api/admin/automation-logs/clear
   * 
   * Limpar logs de automações
   */
  fastify.post('/automation-logs/clear', {
    schema: {
      description: 'Clear automation logs',
      tags: ['Admin', 'Automation Logs'],
      body: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          accountId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, controller.clearAutomationLogs.bind(controller));

  /**
   * GET /api/admin/automation-logs/export
   * 
   * Exportar logs de automações
   */
  fastify.get('/automation-logs/export', {
    schema: {
      description: 'Export automation logs',
      tags: ['Admin', 'Automation Logs'],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          accountId: { type: 'string' },
          automationId: { type: 'string' },
          action: { type: 'string' },
          status: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          format: { 
            type: 'string',
            enum: ['csv', 'json', 'xlsx'],
            default: 'json'
          }
        }
      }
    }
  }, controller.exportAutomationLogs.bind(controller));

  /**
   * GET /api/admin/automation-logs/health
   * 
   * Verificar saúde do serviço de logs
   */
  fastify.get('/automation-logs/health', {
    schema: {
      description: 'Get automation logs service health',
      tags: ['Admin', 'Automation Logs'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                logsCount: { type: 'number' },
                statsCount: { type: 'number' },
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, controller.getLogsHealth.bind(controller));

  /**
   * POST /api/admin/automation-logs/log
   * 
   * Registrar um novo log de automação
   */
  fastify.post('/automation-logs/log', {
    schema: {
      description: 'Log automation event',
      tags: ['Admin', 'Automation Logs'],
      body: {
        type: 'object',
        required: ['userId', 'accountId', 'automationId', 'action'],
        properties: {
          userId: { type: 'string' },
          accountId: { type: 'string' },
          automationId: { type: 'string' },
          action: { 
            type: 'string',
            enum: ['started', 'completed', 'failed', 'paused', 'resumed', 'stopped', 'error']
          },
          details: { type: 'object' },
          errorMessage: { type: 'string' },
          performance: {
            type: 'object',
            properties: {
              cpuUsage: { type: 'number' },
              memoryUsage: { type: 'number' },
              networkRequests: { type: 'number' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, controller.logAutomationEvent.bind(controller));
}
