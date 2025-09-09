import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config/env';
import { authRoutes } from '@/routes/auth.routes';
import { automationRoutes } from '@/routes/automation.routes';
import { authMiddleware } from '@/middleware/auth.middleware';

// Initialize Prisma
const prisma = new PrismaClient({
  log: config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: config.log.level,
    transport: config.log.format === 'simple' ? {
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

// Register plugins
async function registerPlugins() {
  console.log('🔌 Registering CORS plugin...');
  // CORS
  await fastify.register(import('@fastify/cors'), config.cors);
  console.log('✅ CORS plugin registered');

  console.log('🔌 Registering Helmet plugin...');
  // Helmet for security headers
  await fastify.register(import('@fastify/helmet'), config.security.helmet);
  console.log('✅ Helmet plugin registered');

  console.log('🔌 Registering Rate Limit plugin...');
  // Rate limiting
  await fastify.register(import('@fastify/rate-limit'), {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    skipOnError: config.rateLimit.skipOnError,
  });
  console.log('✅ Rate Limit plugin registered');

  console.log('🔌 Registering JWT plugin...');
  // JWT
  await fastify.register(import('@fastify/jwt'), {
    secret: config.jwt.secret,
  });
  console.log('✅ JWT plugin registered');

  console.log('🔌 Registering Swagger plugin...');
  // Swagger documentation
  await fastify.register(import('@fastify/swagger'), {
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
          url: config.isDevelopment ? 'http://localhost:3010' : 'https://api.hubdefisats.com',
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
  await fastify.register(import('@fastify/swagger-ui'), {
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
  }, async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.0.2',
      environment: config.env.NODE_ENV,
    };
  });
  console.log('✅ Health check route registered');

  console.log('🛣️ Registering API routes...');
  // API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  console.log('✅ Auth routes registered');
  
  await fastify.register(automationRoutes, { prefix: '/api' });
  console.log('✅ Automation routes registered');

  console.log('🛣️ Registering 404 handler...');
  // 404 handler
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

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  // Prisma errors
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

  // Validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.validation,
    });
  }

  // JWT errors
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

  // Rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = config.isDevelopment ? error.message : 'Internal server error';

  reply.status(statusCode).send({
    error: 'INTERNAL_SERVER_ERROR',
    message,
    ...(config.isDevelopment && { stack: error.stack }),
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
    fastify.log.error('Error during shutdown:', error);
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
    fastify.log.error('Error starting server:', error);
    console.error('❌ Full error details:', error);
    console.error('❌ Error stack:', error.stack);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  fastify.log.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
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
