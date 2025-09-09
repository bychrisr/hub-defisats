"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRoutes = metricsRoutes;
const metrics_service_1 = require("@/services/metrics.service");
async function metricsRoutes(fastify) {
    fastify.get('/metrics', {
        schema: {
            description: 'Prometheus metrics endpoint',
            tags: ['Metrics'],
            response: {
                200: {
                    type: 'string',
                    description: 'Prometheus metrics in text format',
                },
            },
        },
        handler: async (_request, reply) => {
            try {
                const metricsData = await metrics_service_1.metrics.getMetrics();
                reply.type('text/plain; version=0.0.4; charset=utf-8');
                return metricsData;
            }
            catch (error) {
                fastify.log.error('Error getting metrics:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get metrics',
                });
            }
        },
    });
    fastify.get('/metrics/json', {
        schema: {
            description: 'Metrics in JSON format for dashboards',
            tags: ['Metrics'],
            response: {
                200: {
                    type: 'object',
                    description: 'Metrics in JSON format',
                },
            },
        },
        handler: async (_request, reply) => {
            try {
                const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                return {
                    success: true,
                    data: metricsData,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                fastify.log.error('Error getting metrics JSON:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get metrics JSON',
                });
            }
        },
    });
    fastify.get('/metrics/health', {
        schema: {
            description: 'Health check for metrics service',
            tags: ['Metrics'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        metrics_count: { type: 'number' },
                    },
                },
            },
        },
        handler: async (_request, reply) => {
            try {
                const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                return {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    metrics_count: metricsData.length,
                };
            }
            catch (error) {
                fastify.log.error('Error checking metrics health:', error);
                return reply.status(500).send({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    error: error.message,
                });
            }
        },
    });
}
//# sourceMappingURL=metrics.routes.js.map