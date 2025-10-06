import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AutomationLogsService, AutomationLogQuery } from '../../services/automation-logs.service';
import { logger } from '../../utils/logger';

export class AutomationLogsController {
  private prisma: PrismaClient;
  private automationLogsService: AutomationLogsService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.automationLogsService = new AutomationLogsService(prisma);
  }

  /**
   * GET /api/admin/automation-logs
   * 
   * Obter logs de automações com filtros
   */
  async getAutomationLogs(req: FastifyRequest<{ Querystring: AutomationLogQuery }>, reply: FastifyReply) {
    try {
      const query = req.query;
      
      logger.info('Automation logs requested', { query });

      const result = await this.automationLogsService.getAutomationLogs(query);

      return reply.send({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Failed to get automation logs', { error: (error as Error).message });
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch automation logs'
      });
    }
  }

  /**
   * GET /api/admin/automation-logs/stats
   * 
   * Obter estatísticas de logs de automações
   */
  async getAutomationLogsStats(req: FastifyRequest<{ 
    Querystring: { 
      userId?: string; 
      accountId?: string; 
      startDate?: string; 
      endDate?: string; 
    } 
  }>, reply: FastifyReply) {
    try {
      const { userId, accountId, startDate, endDate } = req.query;
      
      logger.info('Automation logs stats requested', { userId, accountId, startDate, endDate });

      const stats = await this.automationLogsService.getAutomationStats(
        userId,
        accountId,
        startDate && endDate ? { start: startDate, end: endDate } : undefined
      );

      return reply.send({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Failed to get automation logs stats', { error: (error as Error).message });
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch automation logs stats'
      });
    }
  }

  /**
   * POST /api/admin/automation-logs/clear
   * 
   * Limpar logs de automações
   */
  async clearAutomationLogs(req: FastifyRequest<{ 
    Body: { 
      userId?: string; 
      accountId?: string; 
    } 
  }>, reply: FastifyReply) {
    try {
      const { userId, accountId } = req.body;
      
      logger.info('Clearing automation logs', { userId, accountId });

      await this.automationLogsService.clearLogs(userId, accountId);

      return reply.send({
        success: true,
        message: 'Automation logs cleared successfully'
      });

    } catch (error) {
      logger.error('Failed to clear automation logs', { error: (error as Error).message });
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to clear automation logs'
      });
    }
  }

  /**
   * GET /api/admin/automation-logs/export
   * 
   * Exportar logs de automações
   */
  async exportAutomationLogs(req: FastifyRequest<{ 
    Querystring: AutomationLogQuery & { 
      format?: 'csv' | 'json' | 'xlsx'; 
    } 
  }>, reply: FastifyReply) {
    try {
      const { format = 'json', ...query } = req.query;
      
      logger.info('Exporting automation logs', { format, query });

      const result = await this.automationLogsService.getAutomationLogs(query);

      // Configurar headers para download
      const filename = `automation-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (format === 'csv') {
        reply.header('Content-Type', 'text/csv');
        return reply.send(this.convertToCSV(result.logs));
      } else if (format === 'xlsx') {
        reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // TODO: Implementar conversão para XLSX
        return reply.send(JSON.stringify(result.logs, null, 2));
      } else {
        reply.header('Content-Type', 'application/json');
        return reply.send(JSON.stringify(result, null, 2));
      }

    } catch (error) {
      logger.error('Failed to export automation logs', { error: (error as Error).message });
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to export automation logs'
      });
    }
  }

  /**
   * GET /api/admin/automation-logs/health
   * 
   * Verificar saúde do serviço de logs
   */
  async getLogsHealth(req: FastifyRequest, reply: FastifyReply) {
    try {
      const logsCount = this.automationLogsService.getLogsCount();
      const statsCount = this.automationLogsService.getStatsCount();

      return reply.send({
        success: true,
        data: {
          status: 'healthy',
          logsCount,
          statsCount,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Failed to get logs health', { error: (error as Error).message });
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get logs health'
      });
    }
  }

  /**
   * POST /api/admin/automation-logs/log
   * 
   * Registrar um novo log de automação
   */
  async logAutomationEvent(req: FastifyRequest<{
    Body: {
      userId: string;
      accountId: string;
      automationId: string;
      action: string;
      details?: Record<string, any>;
      errorMessage?: string;
      performance?: {
        cpuUsage?: number;
        memoryUsage?: number;
        networkRequests?: number;
      };
    }
  }>, reply: FastifyReply) {
    try {
      const { userId, accountId, automationId, action, details, errorMessage, performance } = req.body;
      
      logger.info('Logging automation event', { userId, accountId, automationId, action });

      const log = await this.automationLogsService.logAutomationEvent(
        userId,
        accountId,
        automationId,
        action as any,
        details,
        errorMessage,
        performance
      );

      return reply.send({
        success: true,
        data: log
      });

    } catch (error) {
      logger.error('Failed to log automation event', { error: (error as Error).message });
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to log automation event'
      });
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) return '';

    const headers = Object.keys(logs[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = logs.map(log => 
      headers.map(header => {
        const value = log[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }
}
