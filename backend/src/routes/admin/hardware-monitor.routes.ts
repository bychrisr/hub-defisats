/**
 * Hardware Monitor Routes
 * 
 * Admin routes for hardware monitoring
 */

import { FastifyInstance } from 'fastify';
import { simpleHardwareMonitorService } from '../../services/simple-hardware-monitor.service';
import { adminAuthMiddleware } from '../../middleware/auth.middleware';

export async function hardwareMonitorRoutes(fastify: FastifyInstance) {
  // Apply admin middleware to all routes
  fastify.addHook('preHandler', adminAuthMiddleware);

  /**
   * Get hardware metrics
   */
  fastify.get('/metrics', async (request, reply) => {
    try {
      const metrics = simpleHardwareMonitorService.getFormattedMetrics();
      
      if (!metrics) {
        return reply.status(503).send({
          success: false,
          error: 'Hardware metrics not available',
          message: 'Hardware monitoring service is not running'
        });
      }

      reply.send({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: 'Failed to get hardware metrics',
        message: error.message
      });
    }
  });

  /**
   * Get hardware alerts
   */
  fastify.get('/alerts', async (request, reply) => {
    try {
      const alerts = simpleHardwareMonitorService.getAlerts();
      
      reply.send({
        success: true,
        data: {
          alerts,
          total: alerts.length,
          critical: alerts.filter(a => a.severity === 'critical').length,
          warning: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: 'Failed to get hardware alerts',
        message: error.message
      });
    }
  });

  /**
   * Get hardware health status
   */
  fastify.get('/health', async (request, reply) => {
    try {
      const status = hardwareMonitorService.getHealthStatus();
      const metrics = hardwareMonitorService.getMetrics();
      const alerts = simpleHardwareMonitorService.getAlerts();
      
      const criticalAlerts = alerts.filter(alert => 
        alert.severity === 'critical' && 
        alert.timestamp > Date.now() - (5 * 60 * 1000) // Last 5 minutes
      );

      reply.send({
        success: true,
        data: {
          status,
          lastUpdate: metrics ? new Date().toISOString() : null,
          criticalAlerts: criticalAlerts.length,
          totalAlerts: alerts.length,
          components: {
            cpu: metrics?.cpu ? {
              usage: `${metrics.cpu.usage}%`,
              cores: metrics.cpu.cores,
              temperature: metrics.cpu.temperature ? `${metrics.cpu.temperature}°C` : 'N/A'
            } : null,
            memory: metrics?.memory ? {
              usage: `${metrics.memory.usagePercent}%`,
              total: `${(metrics.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB`,
              used: `${(metrics.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB`
            } : null,
            disk: metrics?.disk ? {
              usage: `${metrics.disk.usagePercent}%`,
              total: `${(metrics.disk.total / 1024 / 1024 / 1024).toFixed(2)}GB`,
              free: `${(metrics.disk.free / 1024 / 1024 / 1024).toFixed(2)}GB`
            } : null
          }
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: 'Failed to get hardware health',
        message: error.message
      });
    }
  });

  /**
   * Get detailed CPU metrics
   */
  fastify.get('/cpu', async (request, reply) => {
    try {
      const metrics = hardwareMonitorService.getMetrics();
      
      if (!metrics) {
        return reply.status(503).send({
          success: false,
          error: 'Hardware metrics not available'
        });
      }

      reply.send({
        success: true,
        data: {
          usage: `${metrics.cpu.usage}%`,
          cores: metrics.cpu.cores,
          temperature: metrics.cpu.temperature ? `${metrics.cpu.temperature}°C` : 'N/A',
          loadAverage: metrics.cpu.loadAverage,
          status: metrics.cpu.usage > 90 ? 'critical' : 
                  metrics.cpu.usage > 70 ? 'warning' : 'healthy'
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: 'Failed to get CPU metrics',
        message: error.message
      });
    }
  });

  /**
   * Get detailed memory metrics
   */
  fastify.get('/memory', async (request, reply) => {
    try {
      const metrics = hardwareMonitorService.getMetrics();
      
      if (!metrics) {
        return reply.status(503).send({
          success: false,
          error: 'Hardware metrics not available'
        });
      }

      reply.send({
        success: true,
        data: {
          total: `${(metrics.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB`,
          used: `${(metrics.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB`,
          free: `${(metrics.memory.free / 1024 / 1024 / 1024).toFixed(2)}GB`,
          usagePercent: `${metrics.memory.usagePercent}%`,
          swap: {
            total: `${(metrics.memory.swapTotal / 1024 / 1024 / 1024).toFixed(2)}GB`,
            used: `${(metrics.memory.swapUsed / 1024 / 1024 / 1024).toFixed(2)}GB`,
            free: `${(metrics.memory.swapFree / 1024 / 1024 / 1024).toFixed(2)}GB`
          },
          status: metrics.memory.usagePercent > 95 ? 'critical' : 
                  metrics.memory.usagePercent > 80 ? 'warning' : 'healthy'
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: 'Failed to get memory metrics',
        message: error.message
      });
    }
  });

  /**
   * Get detailed disk metrics
   */
  fastify.get('/disk', async (request, reply) => {
    try {
      const metrics = hardwareMonitorService.getMetrics();
      
      if (!metrics) {
        return reply.status(503).send({
          success: false,
          error: 'Hardware metrics not available'
        });
      }

      reply.send({
        success: true,
        data: {
          total: `${(metrics.disk.total / 1024 / 1024 / 1024).toFixed(2)}GB`,
          used: `${(metrics.disk.used / 1024 / 1024 / 1024).toFixed(2)}GB`,
          free: `${(metrics.disk.free / 1024 / 1024 / 1024).toFixed(2)}GB`,
          usagePercent: `${metrics.disk.usagePercent}%`,
          readSpeed: `${metrics.disk.readSpeed} IO/s`,
          writeSpeed: `${metrics.disk.writeSpeed} IO/s`,
          status: metrics.disk.usagePercent > 95 ? 'critical' : 
                  metrics.disk.usagePercent > 85 ? 'warning' : 'healthy'
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: 'Failed to get disk metrics',
        message: error.message
      });
    }
  });

  /**
   * Get system information
   */
  fastify.get('/system', async (request, reply) => {
    try {
      const metrics = hardwareMonitorService.getMetrics();
      
      if (!metrics) {
        return reply.status(503).send({
          success: false,
          error: 'Hardware metrics not available'
        });
      }

      reply.send({
        success: true,
        data: {
          uptime: `${Math.floor(metrics.system.uptime / 86400)}d ${Math.floor((metrics.system.uptime % 86400) / 3600)}h`,
          platform: metrics.system.platform,
          arch: metrics.system.arch,
          hostname: metrics.system.hostname,
          loadAverage: metrics.system.loadAverage,
          nodeVersion: process.version,
          processUptime: `${Math.floor(process.uptime() / 3600)}h`
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: 'Failed to get system information',
        message: error.message
      });
    }
  });

  /**
   * Get network metrics
   */
  fastify.get('/network', async (request, reply) => {
    try {
      const metrics = hardwareMonitorService.getMetrics();
      
      if (!metrics) {
        return reply.status(503).send({
          success: false,
          error: 'Hardware metrics not available'
        });
      }

      reply.send({
        success: true,
        data: {
          interfaces: metrics.network.interfaces.map(iface => ({
            name: iface.name,
            bytesReceived: `${(iface.bytesReceived / 1024 / 1024).toFixed(2)}MB`,
            bytesSent: `${(iface.bytesSent / 1024 / 1024).toFixed(2)}MB`,
            packetsReceived: `${iface.packetsReceived}/s`,
            packetsSent: `${iface.packetsSent}/s`
          }))
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: 'Failed to get network metrics',
        message: error.message
      });
    }
  });
}
