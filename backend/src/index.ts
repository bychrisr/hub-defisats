import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config/env';
import { authRoutes } from '@/routes/auth.routes';
import { automationRoutes } from '@/routes/automation.routes';
import { tradeLogRoutes } from '@/routes/trade-log.routes';
import { profileRoutes } from '@/routes/profile.routes';
import { lnmarketsRoutes } from '@/routes/lnmarkets.routes';
import { lnmarketsFuturesRoutes } from '@/routes/lnmarkets-futures.routes';
import { lnmarketsOptionsRoutes } from '@/routes/lnmarkets-options.routes';
import { lnmarketsUserRoutes } from '@/routes/lnmarkets-user.routes';
import { lnmarketsMarketRoutes } from '@/routes/lnmarkets-market.routes';
import { metricsRoutes } from '@/routes/metrics.routes';
import { alertsRoutes } from '@/routes/alerts.routes';
import { dashboardRoutes } from '@/routes/dashboard.routes';
import { cacheRoutes } from '@/routes/cache.routes';
import { validationRoutes } from '@/routes/validation.routes';
import { adminRoutes } from '@/routes/admin.routes';
import { websocketRoutes } from '@/routes/websocket.routes';
import { authMiddleware } from '@/middleware/auth.middleware';
import { monitoring } from '@/services/monitoring.service';
import { metrics } from '@/services/metrics.service';
import { alerting } from '@/services/alerting.service';
// import { cacheService } from '@/services/cache.service';

// Import plugins statically
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// Initialize monitoring
monitoring.initialize();

// Initialize metrics
metrics.initialize();

// Initialize alerting
alerting.initialize();

// Initialize Prisma
const prisma = new PrismaClient({
  log: config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Create Fastify instance
const fastify = Fastify({
  logger: config.isDevelopment ? {
    level: config.log.level,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : {
    level: config.log.level,
  },
  trustProxy: true,
});

// Register cookie plugin
fastify.register(require('@fastify/cookie'), {
  secret: config.env.JWT_SECRET,
  parseOptions: {}
});

// Register plugins
async function registerPlugins() {
  console.log('🔌 Registering CORS plugin...');
  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });
  console.log('✅ CORS plugin registered');

  console.log('🔌 Registering Helmet plugin...');
  // Helmet for security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: config.isDevelopment ? false : {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: config.isDevelopment ? false : {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "same-origin" }
  });
  console.log('✅ Helmet plugin registered');

  console.log('🔌 Registering Rate Limit plugin...');
  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    skipOnError: config.rateLimit.skipOnError,
  });
  console.log('✅ Rate Limit plugin registered');

  console.log('🔌 Registering JWT plugin...');
  // JWT
  await fastify.register(jwt, {
    secret: config.jwt.secret,
  });
  console.log('✅ JWT plugin registered');

  console.log('🔌 Registering Swagger plugin...');
  // Swagger documentation
  await fastify.register(swagger, {
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
          url: config.isDevelopment ? 'http://localhost:13010' : 'https://api.hubdefisats.com',
          description: config.isDevelopment ? 'Development server' : 'Production server',
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

  // Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (_request, _reply, next) {
        next();
      },
      preHandler: function (_request, _reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, _request, _reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });
  console.log('✅ Swagger plugin registered');
}

// Register authentication decorator
fastify.decorate('authenticate', authMiddleware);

// Register routes
async function registerRoutes() {
  console.log('🛣️ Registering health check route...');
  // Health check
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
  }, async (_request, _reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.0.2',
      environment: config.env.NODE_ENV,
    };
  });
  console.log('✅ Health check route registered');

  // Add monitoring hooks
  fastify.addHook('onRequest', (_request, _reply, done) => {
    // Add breadcrumb for request
    monitoring.addBreadcrumb(
      `${_request.method} ${_request.url}`,
      'http',
      'info',
      {
        method: _request.method,
        url: _request.url,
        userAgent: _request.headers['user-agent'],
      }
    );
    done();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    // Capture metrics
    monitoring.captureMetric('http_requests_total', 1, 'count', {
      method: request.method,
      status_code: reply.statusCode.toString(),
      route: request.url,
    });

    monitoring.captureMetric('http_request_duration_ms', reply.getResponseTime(), 'millisecond', {
      method: request.method,
      route: request.url,
    });

    // Prometheus metrics
    metrics.httpRequestsTotal.inc({
      method: request.method,
      route: request.url,
      status_code: reply.statusCode.toString(),
    });

    metrics.httpRequestDuration.observe({
      method: request.method,
      route: request.url,
      status_code: reply.statusCode.toString(),
    }, reply.getResponseTime() / 1000);

    done();
  });

  console.log('🛣️ Registering API routes...');
  // API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  console.log('✅ Auth routes registered');

  // Metrics routes
  await fastify.register(metricsRoutes, { prefix: '/api/metrics' });
  console.log('✅ Metrics routes registered');

  // Alerts routes
  await fastify.register(alertsRoutes, { prefix: '/api' });
  console.log('✅ Alerts routes registered');

  // Dashboard routes
  await fastify.register(dashboardRoutes, { prefix: '/api' });
  console.log('✅ Dashboard routes registered');

  // Cache routes
  await fastify.register(cacheRoutes, { prefix: '/api' });
  console.log('✅ Cache routes registered');
  
  await fastify.register(automationRoutes, { prefix: '/api' });
  console.log('✅ Automation routes registered');

  // Trade log routes
  await fastify.register(tradeLogRoutes, { prefix: '/api' });
  console.log('✅ Trade log routes registered');

  // Profile routes
  await fastify.register(profileRoutes, { prefix: '/api' });
  console.log('✅ Profile routes registered');

  // LN Markets routes
  await fastify.register(lnmarketsRoutes, { prefix: '/api/lnmarkets' });
  console.log('✅ LN Markets routes registered');

  // LN Markets Futures routes
  await fastify.register(lnmarketsFuturesRoutes, { prefix: '/api' });
  console.log('✅ LN Markets Futures routes registered');

  // LN Markets Options routes
  await fastify.register(lnmarketsOptionsRoutes, { prefix: '/api' });
  console.log('✅ LN Markets Options routes registered');

  // LN Markets User routes
  await fastify.register(lnmarketsUserRoutes, { prefix: '/api' });
  console.log('✅ LN Markets User routes registered');

  // LN Markets Market Data routes
  await fastify.register(lnmarketsMarketRoutes, { prefix: '/api' });
  console.log('✅ LN Markets Market Data routes registered');

  // Admin routes
  await fastify.register(adminRoutes, { prefix: '/api/admin' });
  console.log('✅ Admin routes registered');

  // WebSocket routes
  await fastify.register(websocketRoutes, { prefix: '/api' });
  console.log('✅ WebSocket routes registered');

  // Validation routes (without /api prefix to avoid authentication)
  await fastify.register(validationRoutes);
  console.log('✅ Validation routes registered');

  console.log('🛣️ Registering 404 handler...');
  // 404 handler
  fastify.setNotFoundHandler({
    preHandler: (fastify as any).authenticate,
  }, function (request, reply) {
    reply.status(404).send({
      error: 'NOT_FOUND',
      message: 'Route not found',
      path: request.url,
    });
  });
  console.log('✅ 404 handler registered');
}

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  // Continue with error handling

  // Capture error in Sentry
  monitoring.captureError(error, {
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
    },
    user: (request as any).user ? {
      id: (request as any).user.id,
      email: (request as any).user.email,
    } : undefined,
  });

  // Prisma errors
  if ((error as any).code === 'P2002') {
    return reply.status(409).send({
      error: 'CONFLICT',
      message: 'Resource already exists',
      details: (error as any).meta,
    });
  }

  if ((error as any).code === 'P2025') {
    return reply.status(404).send({
      error: 'NOT_FOUND',
      message: 'Resource not found',
    });
  }

  // Validation errors
  if ((error as any).validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: (error as any).validation,
    });
  }

  // JWT errors
  if ((error as any).code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Authorization header is required',
    });
  }

  if ((error as any).code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Invalid authorization token',
    });
  }

  // Rate limit errors
  if ((error as any).statusCode === 429) {
    return reply.status(429).send({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    });
  }

  // Default error
  const statusCode = (error as any).statusCode || 500;
  const message = config.isDevelopment ? (error as any).message : 'Internal server error';

  return reply.status(statusCode).send({
    error: 'INTERNAL_SERVER_ERROR',
    message,
    ...(config.isDevelopment && { stack: (error as any).stack }),
  });
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await fastify.close();
    await prisma.$disconnect();
    fastify.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during shutdown:', error as any);
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    console.log('🔧 Step 1: Registering plugins...');
    // Register plugins
    await registerPlugins();
    console.log('✅ Plugins registered successfully');

    console.log('🔧 Step 2: Registering routes...');
    // Register routes
    await registerRoutes();
    console.log('✅ Routes registered successfully');

    console.log('🔧 Step 3: Testing database connection...');
    // Test database connection
    await prisma.$connect();
    fastify.log.info('Database connected successfully');
    console.log('✅ Database connected successfully');

    console.log('🔧 Step 4: Starting server on port', config.env.PORT);
    // Start server
    const address = await fastify.listen({
      port: config.env.PORT,
      host: '0.0.0.0',
    });

    fastify.log.info(`Server listening at ${address}`);
    fastify.log.info(`API documentation available at ${address}/docs`);
    fastify.log.info(`Environment: ${config.env.NODE_ENV}`);
    
    console.log('🎉 Server started successfully!');
    console.log(`📍 Server listening at ${address}`);
    console.log(`📚 API documentation available at ${address}/docs`);
    console.log(`🌍 Environment: ${config.env.NODE_ENV}`);
  } catch (error) {
    fastify.log.error('Error starting server:', error as any);
    console.error('❌ Full error details:', error);
    console.error('❌ Error stack:', (error as Error).stack);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack trace:', reason);
  process.exit(1);
});

// Start the server
console.log('🚀 Starting hub-defisats backend server...');
console.log('📋 Environment variables loaded:', {
  NODE_ENV: process.env['NODE_ENV'],
  PORT: process.env['PORT'],
  DATABASE_URL: process.env['DATABASE_URL'] ? 'SET' : 'NOT SET',
  REDIS_URL: process.env['REDIS_URL'] ? 'SET' : 'NOT SET',
  JWT_SECRET: process.env['JWT_SECRET'] ? 'SET' : 'NOT SET',
  ENCRYPTION_KEY: process.env['ENCRYPTION_KEY'] ? 'SET' : 'NOT SET'
});

start();
