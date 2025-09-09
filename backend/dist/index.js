"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const client_1 = require("@prisma/client");
const env_1 = require("@/config/env");
const auth_routes_1 = require("@/routes/auth.routes");
const automation_routes_1 = require("@/routes/automation.routes");
const metrics_routes_1 = require("@/routes/metrics.routes");
const alerts_routes_1 = require("@/routes/alerts.routes");
const dashboard_routes_1 = require("@/routes/dashboard.routes");
const cache_routes_1 = require("@/routes/cache.routes");
const auth_middleware_1 = require("@/middleware/auth.middleware");
const monitoring_service_1 = require("@/services/monitoring.service");
const metrics_service_1 = require("@/services/metrics.service");
const alerting_service_1 = require("@/services/alerting.service");
monitoring_service_1.monitoring.initialize();
metrics_service_1.metrics.initialize();
alerting_service_1.alerting.initialize();
const prisma = new client_1.PrismaClient({
    log: env_1.config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
});
const fastify = (0, fastify_1.default)({
    logger: {
        level: env_1.config.log.level,
        transport: env_1.config.log.format === 'simple' ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        } : undefined,
    },
    trustProxy: true,
});
async function registerPlugins() {
    console.log('🔌 Registering CORS plugin...');
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/cors'))), env_1.config.cors);
    console.log('✅ CORS plugin registered');
    console.log('🔌 Registering Helmet plugin...');
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/helmet'))), env_1.config.security.helmet);
    console.log('✅ Helmet plugin registered');
    console.log('🔌 Registering Rate Limit plugin...');
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/rate-limit'))), {
        max: env_1.config.rateLimit.max,
        timeWindow: env_1.config.rateLimit.timeWindow,
        skipOnError: env_1.config.rateLimit.skipOnError,
    });
    console.log('✅ Rate Limit plugin registered');
    console.log('🔌 Registering JWT plugin...');
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/jwt'))), {
        secret: env_1.config.jwt.secret,
    });
    console.log('✅ JWT plugin registered');
    console.log('🔌 Registering Swagger plugin...');
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/swagger'))), {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: 'Hub-defisats API',
                description: 'API for LN Markets automation platform',
                version: '0.0.2',
                contact: {
                    name: 'Hub-defisats',
                    email: 'support@hubdefisats.com',
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT',
                },
            },
            servers: [
                {
                    url: env_1.config.isDevelopment ? 'http://localhost:13010' : 'https://api.hubdefisats.com',
                    description: env_1.config.isDevelopment ? 'Development server' : 'Production server',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            tags: [
                { name: 'Authentication', description: 'User authentication and authorization' },
                { name: 'Users', description: 'User management' },
                { name: 'Automations', description: 'Trading automation management' },
                { name: 'Trades', description: 'Trade logs and history' },
                { name: 'Backtests', description: 'Backtesting functionality' },
                { name: 'Notifications', description: 'Notification management' },
                { name: 'Payments', description: 'Payment processing' },
                { name: 'Admin', description: 'Administrative functions' },
            ],
        },
    });
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/swagger-ui'))), {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
        },
        uiHooks: {
            onRequest: function (request, reply, next) {
                next();
            },
            preHandler: function (request, reply, next) {
                next();
            },
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
        transformSpecification: (swaggerObject, request, reply) => {
            return swaggerObject;
        },
        transformSpecificationClone: true,
    });
    console.log('✅ Swagger plugin registered');
}
fastify.decorate('authenticate', auth_middleware_1.authMiddleware);
async function registerRoutes() {
    console.log('🛣️ Registering health check route...');
    fastify.get('/health', {
        schema: {
            description: 'Health check endpoint',
            tags: ['System'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        uptime: { type: 'number' },
                        version: { type: 'string' },
                        environment: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '0.0.2',
            environment: env_1.config.env.NODE_ENV,
        };
    });
    console.log('✅ Health check route registered');
    fastify.addHook('onRequest', (request, reply, done) => {
        monitoring_service_1.monitoring.addBreadcrumb(`${request.method} ${request.url}`, 'http', 'info', {
            method: request.method,
            url: request.url,
            userAgent: request.headers['user-agent'],
        });
        done();
    });
    fastify.addHook('onResponse', (request, reply, done) => {
        monitoring_service_1.monitoring.captureMetric('http_requests_total', 1, 'count', {
            method: request.method,
            status_code: reply.statusCode.toString(),
            route: request.url,
        });
        monitoring_service_1.monitoring.captureMetric('http_request_duration_ms', reply.getResponseTime(), 'millisecond', {
            method: request.method,
            route: request.url,
        });
        metrics_service_1.metrics.httpRequestsTotal.inc({
            method: request.method,
            route: request.url,
            status_code: reply.statusCode.toString(),
        });
        metrics_service_1.metrics.httpRequestDuration.observe({
            method: request.method,
            route: request.url,
            status_code: reply.statusCode.toString(),
        }, reply.getResponseTime() / 1000);
        done();
    });
    console.log('🛣️ Registering API routes...');
    await fastify.register(auth_routes_1.authRoutes, { prefix: '/api/auth' });
    console.log('✅ Auth routes registered');
    await fastify.register(metrics_routes_1.metricsRoutes, { prefix: '/api/metrics' });
    console.log('✅ Metrics routes registered');
    await fastify.register(alerts_routes_1.alertsRoutes, { prefix: '/api' });
    console.log('✅ Alerts routes registered');
    await fastify.register(dashboard_routes_1.dashboardRoutes, { prefix: '/api' });
    console.log('✅ Dashboard routes registered');
    await fastify.register(cache_routes_1.cacheRoutes, { prefix: '/api' });
    console.log('✅ Cache routes registered');
    await fastify.register(automation_routes_1.automationRoutes, { prefix: '/api' });
    console.log('✅ Automation routes registered');
    console.log('🛣️ Registering 404 handler...');
    fastify.setNotFoundHandler({
        preHandler: fastify.authenticate,
    }, function (request, reply) {
        reply.status(404).send({
            error: 'NOT_FOUND',
            message: 'Route not found',
            path: request.url,
        });
    });
    console.log('✅ 404 handler registered');
}
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    monitoring_service_1.monitoring.captureError(error, {
        request: {
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body,
        },
        user: request.user ? {
            id: request.user.id,
            email: request.user.email,
        } : undefined,
    });
    if (error.code === 'P2002') {
        return reply.status(409).send({
            error: 'CONFLICT',
            message: 'Resource already exists',
            details: error.meta,
        });
    }
    if (error.code === 'P2025') {
        return reply.status(404).send({
            error: 'NOT_FOUND',
            message: 'Resource not found',
        });
    }
    if (error.validation) {
        return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.validation,
        });
    }
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
        return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'Authorization header is required',
        });
    }
    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'Invalid authorization token',
        });
    }
    if (error.statusCode === 429) {
        return reply.status(429).send({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
        });
    }
    const statusCode = error.statusCode || 500;
    const message = env_1.config.isDevelopment ? error.message : 'Internal server error';
    reply.status(statusCode).send({
        error: 'INTERNAL_SERVER_ERROR',
        message,
        ...(env_1.config.isDevelopment && { stack: error.stack }),
    });
});
async function gracefulShutdown(signal) {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`);
    try {
        await fastify.close();
        await prisma.$disconnect();
        fastify.log.info('Server closed successfully');
        process.exit(0);
    }
    catch (error) {
        fastify.log.error('Error during shutdown:', error);
        process.exit(1);
    }
}
async function start() {
    try {
        console.log('🔧 Step 1: Registering plugins...');
        await registerPlugins();
        console.log('✅ Plugins registered successfully');
        console.log('🔧 Step 2: Registering routes...');
        await registerRoutes();
        console.log('✅ Routes registered successfully');
        console.log('🔧 Step 3: Testing database connection...');
        await prisma.$connect();
        fastify.log.info('Database connected successfully');
        console.log('✅ Database connected successfully');
        console.log('🔧 Step 4: Starting server on port', env_1.config.env.PORT);
        const address = await fastify.listen({
            port: env_1.config.env.PORT,
            host: '0.0.0.0',
        });
        fastify.log.info(`Server listening at ${address}`);
        fastify.log.info(`API documentation available at ${address}/docs`);
        fastify.log.info(`Environment: ${env_1.config.env.NODE_ENV}`);
        console.log('🎉 Server started successfully!');
        console.log(`📍 Server listening at ${address}`);
        console.log(`📚 API documentation available at ${address}/docs`);
        console.log(`🌍 Environment: ${env_1.config.env.NODE_ENV}`);
    }
    catch (error) {
        fastify.log.error('Error starting server:', error);
        console.error('❌ Full error details:', error);
        console.error('❌ Error stack:', error.stack);
        process.exit(1);
    }
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    fastify.log.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    fastify.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
console.log('🚀 Starting hub-defisats backend server...');
console.log('📋 Environment variables loaded:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? 'SET' : 'NOT SET'
});
start();
//# sourceMappingURL=index.js.map