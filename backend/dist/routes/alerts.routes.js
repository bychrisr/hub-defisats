"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsRoutes = alertsRoutes;
const alerting_service_1 = require("@/services/alerting.service");
const auth_middleware_1 = require("@/middleware/auth.middleware");
async function alertsRoutes(fastify) {
    fastify.addHook('preHandler', auth_middleware_1.authMiddleware);
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
            },
        },
        handler: async (_request, reply) => {
            try {
                const activeAlerts = alerting_service_1.alerting.getActiveAlerts();
                return {
                    success: true,
                    data: activeAlerts,
                };
            }
            catch (error) {
                fastify.log.error('Error getting active alerts:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get active alerts',
                });
            }
        },
    });
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
            },
        },
        handler: async (_request, reply) => {
            try {
                const query = _request.query;
                let alerts = alerting_service_1.alerting.getAllAlerts();
                if (query.severity) {
                    alerts = alerting_service_1.alerting.getAlertsBySeverity(query.severity);
                }
                const limit = query.limit || 50;
                const offset = query.offset || 0;
                const paginatedAlerts = alerts.slice(offset, offset + limit);
                return {
                    success: true,
                    data: paginatedAlerts,
                };
            }
            catch (error) {
                fastify.log.error('Error getting alerts:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get alerts',
                });
            }
        },
    });
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
            },
        },
        handler: async (_request, reply) => {
            try {
                const { alertId } = _request.params;
                const alert = alerting_service_1.alerting.getAllAlerts().find(a => a.id === alertId);
                if (!alert) {
                    return reply.status(404).send({
                        success: false,
                        error: 'Alert not found',
                    });
                }
                alerting_service_1.alerting.resolveAlert(alertId);
                return {
                    success: true,
                    message: 'Alert resolved successfully',
                };
            }
            catch (error) {
                fastify.log.error('Error resolving alert:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to resolve alert',
                });
            }
        },
    });
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
            },
        },
        handler: async (_request, reply) => {
            try {
                const allAlerts = alerting_service_1.alerting.getAllAlerts();
                const activeAlerts = alerting_service_1.alerting.getActiveAlerts();
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
            }
            catch (error) {
                fastify.log.error('Error getting alert stats:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get alert statistics',
                });
            }
        },
    });
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
            },
        },
        handler: async (_request, reply) => {
            try {
                const query = _request.query;
                const maxAgeHours = query.maxAge || 24;
                const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
                const beforeCount = alerting_service_1.alerting.getAllAlerts().length;
                alerting_service_1.alerting.cleanupOldAlerts(maxAgeMs);
                const afterCount = alerting_service_1.alerting.getAllAlerts().length;
                const cleaned = beforeCount - afterCount;
                return {
                    success: true,
                    message: `Cleaned up ${cleaned} old alerts`,
                    cleaned,
                };
            }
            catch (error) {
                fastify.log.error('Error cleaning up alerts:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to clean up alerts',
                });
            }
        },
    });
}
//# sourceMappingURL=alerts.routes.js.map