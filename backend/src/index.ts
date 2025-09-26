import Fastify from 'fastify';
import { config } from './config/env';
import { getPrisma } from './lib/prisma';
import { authRoutes } from './routes/auth.routes';
import { automationRoutes } from './routes/automation.routes';
import { automationReportsRoutes } from './routes/automation-reports.routes';
import { tradeLogRoutes } from './routes/trade-log.routes';
import { profileRoutes } from './routes/profile.routes';
import { lnmarketsRoutes } from './routes/lnmarkets.routes';
import { lnmarketsFuturesRoutes } from './routes/lnmarkets-futures.routes';
import { lnmarketsOptionsRoutes } from './routes/lnmarkets-options.routes';
import { lnmarketsUserRoutes } from './routes/lnmarkets-user.routes';
import { lnmarketsMarketRoutes } from './routes/lnmarkets-market.routes';
import { marketDataRoutes } from './routes/market-data.routes';
import { couponAdminRoutes } from './routes/coupon-admin.routes';
import { metricsRoutes } from './routes/metrics.routes';
import { alertsRoutes } from './routes/alerts.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { cacheRoutes } from './routes/cache.routes';
import { validationRoutes } from './routes/validation.routes';
import { adminRoutes } from './routes/admin.routes';
import { menuAdminRoutes } from './routes/menu-admin.routes';
import { menuPublicRoutes } from './routes/menu-public.routes';
import { dynamicPagesConfigRoutes } from './routes/dynamic-pages-config.routes';
import { adminUpgradeRoutes } from './routes/admin-upgrade.routes';
import { websocketRoutes } from './routes/websocket.routes';
import { websocketTestRoutes } from './routes/websocket-test.routes';
import { websocketMarketRoutes } from './routes/websocket-market.routes';
import { simulationRoutes } from './routes/simulation.routes';
import { notificationRoutes } from './routes/notification.routes';
import { backtestRoutes } from './routes/backtest.routes';
import { paymentRoutes } from './routes/payment.routes';
import { rateLimitTestRoutes } from './routes/rate-limit-test.routes';
import { healthRoutes as adminHealthRoutes } from './routes/admin/health.routes';
import { lnMarketsDiagnosticRoutes } from './routes/admin/lnmarkets-diagnostic.routes';
import { marketDataFallbackRoutes } from './routes/admin/market-data-fallback.routes';
import { lnMarketsAnalysisRoutes } from './routes/admin/ln-markets-analysis.routes';
import { lnMarketsGuerrillaTestRoutes } from './routes/ln-markets-guerilla-test.routes';
import { lnMarketsDiscoveryRoutes } from './routes/admin/ln-markets-discovery.routes';
import { hardwareMonitorRoutes } from './routes/admin/hardware-monitor.routes';
import { securityRoutes } from './routes/security.routes';
import { securityConfigRoutes } from './routes/security-config.routes';
import { adminAdvancedRoutes } from './routes/admin-advanced.routes';
import { planRoutes } from './routes/plan.routes';
import { healthRoutes } from './routes/health.routes';
import { swCacheRoutes } from './routes/sw-cache.routes';
import { tooltipRoutes } from './routes/tooltip.routes';
import { uploadRoutes } from './routes/upload.routes';
import { versionRoutes } from './routes/version.routes';
import { docsRoutes } from './routes/docs.routes';
import { routeRedirectsRoutes } from './routes/route-redirects.routes';
import { routeRedirectRoutes } from './routes/route-redirect.routes';
import { rateLimitConfigRoutes } from './routes/admin/rate-limit-config.routes';
import { rateLimitTestRoutes } from './routes/rate-limit-test.routes';
import { cacheRoutes } from './routes/admin/cache.routes';
import { loadBalancerRoutes } from './routes/admin/load-balancer.routes';
import { monitoringRoutes } from './routes/monitoring.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { monitoring } from './services/monitoring.service';
import { metrics } from './utils/metrics';
import { alerting } from './services/alerting.service';
import { AdvancedHealthService } from './services/advanced-health.service';
import { AdvancedAlertingService } from './services/advanced-alerting.service';
import { Redis } from 'ioredis';
// import { cacheService } from './services/cache.service';

// Import plugins statically
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';

// Initialize monitoring
// monitoring.initialize();

// Initialize metrics
// metrics.initialize();

// Initialize alerting
// alerting.initialize();

// Prisma client is now imported as singleton from lib/prisma.ts

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Initialize advanced services (will be updated after Prisma connection)
let advancedHealth: AdvancedHealthService;

const advancedAlerting = new AdvancedAlertingService({
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
} as any);

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

  console.log('🔌 Registering rate limiting plugin...');
  // Rate limiting - ABSURDAMENTE permissive for development
  await fastify.register(rateLimit, {
    max: config.isDevelopment ? 1000000 : 1000, // 1000000 requests per minute in dev (absurdo), 1000 in prod
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
      code: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: Math.round(Number(context.after) / 1000)
    })
  });
  console.log('✅ Rate limiting plugin registered');

  console.log('🔌 Registering JWT plugin...');
  // JWT
  await fastify.register(jwt, {
    secret: config.jwt.secret,
  });
  console.log('✅ JWT plugin registered');

  console.log('🔌 Registering multipart plugin...');
  // Multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    }
  });
  console.log('✅ Multipart plugin registered');

  console.log('🔌 Registering WebSocket plugin...');
  // WebSocket
  await fastify.register(websocket);
  console.log('✅ WebSocket plugin registered');

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
  console.log('🛣️ Health check route will be registered via healthRoutes...');

  // Version endpoint is now handled by versionRoutes

  console.log('✅ Advanced health check route will be registered via healthRoutes...');

  // Prometheus metrics endpoint
  fastify.get('/metrics', {
    schema: {
      description: 'Prometheus metrics endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'string',
          description: 'Prometheus metrics in text format'
        }
      }
    }
  }, async (_request, _reply) => {
    try {
      const metricsData = metrics.getMetricsAsPrometheus();
      _reply.type('text/plain; version=0.0.4; charset=utf-8');
      return metricsData;
    } catch (error) {
      _reply.code(500);
      return `# Error generating metrics: ${(error as Error).message}`;
    }
  });
  console.log('✅ Prometheus metrics route registered');

  // Test endpoint to check if authentication is required
  fastify.get('/test', {
    schema: {
      description: 'Test endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (_request, _reply) => {
    return { message: 'Test endpoint working' };
  });
  console.log('✅ Test endpoint registered');

  // Alerts endpoint (moved to alerts routes plugin)
  // fastify.get('/api/alerts', { ... });
  // console.log('✅ Alerts route registered');


  // Register public market prices endpoint
  fastify.get('/api/market/prices/latest', {
    schema: {
      description: 'Get latest market prices for cryptocurrencies (public endpoint)',
      tags: ['Market Data'],
      querystring: {
        type: 'object',
        properties: {
          symbols: { type: 'string', description: 'Comma-separated list of symbols (e.g., BTC,ETH)', default: 'BTC' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  usd: { type: 'number' },
                  usd_24h_change: { type: 'number' },
                  last_updated_at: { type: 'number' }
                }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { symbols = 'BTC' } = request.query as any;
      const symbolList = symbols.split(',').map((s: string) => s.toLowerCase());

      console.log('🔍 PUBLIC MARKET PRICES - Getting latest prices for:', symbolList);

      // Try CoinGecko API first
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbolList.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`);

        if (response.ok) {
          const data = await response.json();

          // Transform CoinGecko response to our format
          const transformedData: any = {};
          for (const [symbol, priceData] of Object.entries(data)) {
            const priceInfo = priceData as any;
            transformedData[symbol.toLowerCase()] = {
              usd: priceInfo.usd || 0,
              usd_24h_change: priceInfo.usd_24h_change || 0,
              last_updated_at: Math.floor(Date.now() / 1000)
            };
          }

          console.log('✅ PUBLIC MARKET PRICES - CoinGecko data retrieved successfully');
          return reply.send({
            success: true,
            data: transformedData
          });
        }
      } catch (coingeckoError) {
        console.log('⚠️ PUBLIC MARKET PRICES - CoinGecko API failed, using fallback');
      }

      // Fallback to simulated data
      console.log('🔄 PUBLIC MARKET PRICES - Using simulated data as fallback');
      const fallbackData: any = {};
      const basePrices: Record<string, number> = {
        bitcoin: 65000,
        ethereum: 3500,
        usd: 1
      };

      for (const symbol of symbolList) {
        const basePrice = basePrices[symbol] || basePrices.bitcoin;
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        const change = (Math.random() - 0.5) * 10; // Random change

        fallbackData[symbol] = {
          usd: basePrice * (1 + variation),
          usd_24h_change: change,
          last_updated_at: Math.floor(Date.now() / 1000)
        };
      }

      console.log('✅ PUBLIC MARKET PRICES - Fallback data generated');
      return reply.send({
        success: true,
        data: fallbackData
      });
    } catch (error: any) {
      console.error('❌ PUBLIC MARKET PRICES - Error getting latest prices:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch market prices'
      });
    }
  });

  console.log('✅ Public market prices endpoint registered');

  // Add monitoring hooks
  fastify.addHook('onRequest', (_request, _reply, done) => {
    // Set start time for response time calculation
    (_request as any).startTime = Date.now();
    
    // Add breadcrumb for request
    try {
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
    } catch (error) {
      // Ignore monitoring errors
      console.warn('Monitoring breadcrumb failed:', error);
    }
    done();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    // Capture metrics
    try {
      monitoring.captureMetric('http_requests_total', 1, 'count', {
        method: request.method,
        status_code: reply.statusCode.toString(),
        route: request.url,
      });
    } catch (error) {
      // Ignore monitoring errors
      console.warn('Monitoring capture failed:', error);
    }

    // Prometheus metrics
    try {
      metrics.recordHttpRequest(
        request.method,
        request.url,
        reply.statusCode,
        Date.now() - (request as any).startTime
      );
    } catch (error) {
      // Ignore metrics errors
      console.warn('Metrics recording failed:', error);
    }

    done();
  });

  console.log('🛣️ Registering API routes...');
  // API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  console.log('✅ Auth routes registered');

  // Tooltip routes moved to the end to avoid hook leakage

  // Metrics routes (commented out - using public /metrics endpoint instead)
  // await fastify.register(metricsRoutes, { prefix: '/api/metrics' });
  // console.log('✅ Metrics routes registered');

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

  // Automation Reports routes
  await fastify.register(automationReportsRoutes, { prefix: '/api' });
  console.log('✅ Automation Reports routes registered');

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

  // Market Data routes
  await fastify.register(marketDataRoutes, { prefix: '/api' });
  console.log('✅ Market Data routes registered');

  // Coupon Admin routes
  await fastify.register(couponAdminRoutes, { prefix: '/api/admin/coupons' });
  console.log('✅ Coupon Admin routes registered');

  // Admin routes
  await fastify.register(adminRoutes, { prefix: '/api/admin' });
  console.log('✅ Admin routes registered');

  // Menu admin routes
  await fastify.register(menuAdminRoutes, { prefix: '/api/admin/menu' });
  console.log('✅ Menu admin routes registered');

  // Admin upgrade routes
  await fastify.register(adminUpgradeRoutes, { prefix: '/api' });
  console.log('✅ Admin upgrade routes registered');

  // Menu public routes
  await fastify.register(menuPublicRoutes, { prefix: '/api/menu' });
  console.log('✅ Menu public routes registered');

  // Dynamic pages config routes
  await fastify.register(dynamicPagesConfigRoutes);
  console.log('✅ Dynamic pages config routes registered');

  // WebSocket routes
  await fastify.register(websocketRoutes, { prefix: '/api' });
  console.log('✅ WebSocket routes registered');

  // WebSocket test routes (without authentication)
  await fastify.register(websocketTestRoutes, { prefix: '/test' });
  console.log('✅ WebSocket test routes registered');

  // WebSocket market routes (without authentication)
  await fastify.register(websocketMarketRoutes, { prefix: '/api' });
  console.log('✅ WebSocket market routes registered');

  // Simulation routes
  await fastify.register(simulationRoutes, { prefix: '/api' });
  console.log('✅ Simulation routes registered');

  // Notification routes
  await fastify.register(notificationRoutes);
  console.log('✅ Notification routes registered');

  // Backtest routes
  await fastify.register(backtestRoutes);
  console.log('✅ Backtest routes registered');

  // Payment routes
  await fastify.register(paymentRoutes);
  console.log('✅ Payment routes registered');

  // Security routes
  await fastify.register(securityRoutes);
  console.log('✅ Security routes registered');

  await fastify.register(securityConfigRoutes);
  console.log('✅ Security config routes registered');

  // Advanced admin routes
  await fastify.register(adminAdvancedRoutes);
  await fastify.register(planRoutes);
  console.log('✅ Advanced admin routes registered');

  // Validation routes (with /api prefix but without authentication)
  await fastify.register(validationRoutes, { prefix: '/api' });
  console.log('✅ Validation routes registered');

  // Simple health check route for compatibility - TEMPORARILY DISABLED
  // fastify.get('/api/health', {
  //   schema: {
  //     description: 'Simple health check endpoint',
  //     tags: ['System'],
  //     response: {
  //       200: {
  //         type: 'object',
  //         properties: {
  //           status: { type: 'string' },
  //           timestamp: { type: 'string' },
  //           uptime: { type: 'number' },
  //         },
  //       },
  //     },
  //   },
  // }, async (_request, _reply) => {
  //   return {
  //     status: 'healthy',
  //     timestamp: new Date().toISOString(),
  //     uptime: process.uptime(),
  //   };
  // });

  // Health routes
  await fastify.register(healthRoutes, { prefix: '/api' });
  console.log('✅ Health routes registered');

  // Service Worker cache routes
  await fastify.register(swCacheRoutes);
  console.log('✅ Service Worker cache routes registered');

  // Tooltip and Dashboard Card management (public routes - register last to avoid hook leakage)
  await fastify.register(tooltipRoutes, { prefix: '/api' });
  console.log('✅ Tooltip routes registered');
  
  await fastify.register(uploadRoutes);
  console.log('✅ Upload routes registered');

  // Version routes (public)
  await fastify.register(versionRoutes, { prefix: '/api' });
  console.log('✅ Version routes registered');

  // Documentation routes (admin only)
  await fastify.register(docsRoutes, { prefix: '/api' });
  console.log('✅ Documentation routes registered');

  // Route redirects admin routes
  await fastify.register(routeRedirectsRoutes, { prefix: '/api/admin/route-redirects' });
  console.log('✅ Route redirects admin routes registered');

  // Route redirects public routes
  await fastify.register(routeRedirectRoutes, { prefix: '/api/redirects' });
  console.log('✅ Route redirects public routes registered');

  // Rate limit config admin routes
  await fastify.register(rateLimitConfigRoutes, { prefix: '/api/admin/rate-limit-config' });
  await fastify.register(adminHealthRoutes, { prefix: '/api/admin/health' });
  await fastify.register(lnMarketsDiagnosticRoutes, { prefix: '/api/admin/lnmarkets' });
  await fastify.register(marketDataFallbackRoutes, { prefix: '/api/admin/market-data' });
  await fastify.register(lnMarketsAnalysisRoutes, { prefix: '/api/admin/lnmarkets-analysis' });
  await fastify.register(lnMarketsGuerrillaTestRoutes, { prefix: '/api/ln-markets-test' });
  await fastify.register(lnMarketsDiscoveryRoutes, { prefix: '/api/admin/lnmarkets-discovery' });
  // await fastify.register(lnMarketsFallbackTestRoutes, { prefix: '/api/lnmarkets-fallback' });
  await fastify.register(hardwareMonitorRoutes, { prefix: '/api/admin/hardware' });
  await fastify.register(cacheRoutes, { prefix: '/api/admin/cache' });
  await fastify.register(loadBalancerRoutes, { prefix: '/api/admin/load-balancer' });
  console.log('✅ Admin routes registered');

  // Rate limit test routes (development only)
  if (config.isDevelopment) {
    await fastify.register(rateLimitTestRoutes, { prefix: '/api/rate-limit-test' });
    console.log('✅ Rate limit test routes registered');
  }

  // Monitoring routes (admin only)
  await fastify.register(monitoringRoutes, { prefix: '/api/admin' });
  console.log('✅ Monitoring routes registered');

  console.log('🛣️ Registering 404 handler...');
  // 404 handler
  fastify.setNotFoundHandler(function (request, reply) {
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
  try {
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
  } catch (monitoringError) {
    // Ignore monitoring errors
    console.warn('Monitoring error capture failed:', monitoringError);
  }

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
    const rateLimitData = (error as any).data || {};
    return reply.status(429).send({
      error: 'RATE_LIMIT_EXCEEDED',
      message: rateLimitData.message || 'Too many requests, please try again later',
      retry_after: rateLimitData.retry_after || 60,
      limit: rateLimitData.limit || 100,
      remaining: rateLimitData.remaining || 0,
      reset_time: rateLimitData.reset_time,
      window_ms: rateLimitData.window_ms,
      type: rateLimitData.type || 'general',
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
    const prisma = await getPrisma();
    await prisma.$disconnect();
    fastify.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during shutdown:', error as Error);
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

    console.log('🔧 Step 2: Connecting to database...');
    // Connect to database using lazy loading
    const prisma = await getPrisma();
    
    // Verify database schema is accessible
    console.log('🔍 Verifying database schema...');
    try {
      await prisma.automation.count();
      await prisma.rateLimitConfig.count();
      console.log('✅ Database schema verified - all tables accessible');
    } catch (error) {
      console.error('❌ Database schema verification failed:', error);
      throw error;
    }
    
    fastify.log.info('Database connected successfully');
    console.log('✅ Database connected successfully');

    // Initialize advanced services with connected Prisma
    advancedHealth = new AdvancedHealthService(prisma, redis, {
      info: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
    } as any);

    console.log('🔧 Step 3: Registering routes...');
    // Register routes
    await registerRoutes();
    console.log('✅ Routes registered successfully');

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

    // Start advanced monitoring services
    console.log('🔧 Step 5: Starting advanced monitoring services...');
    
    // Start alert evaluation loop
    advancedAlerting.startEvaluationLoop(30000); // Every 30 seconds
    console.log('✅ Alert evaluation loop started');
    
    // Start Margin Guard monitoring
    console.log('🛡️ Starting Margin Guard monitoring...');
    
    // Workers will use the already connected Prisma instance
    console.log('🚀 Iniciando workers...');
    const { startPeriodicMonitoring } = await import('./workers/margin-monitor');
    startPeriodicMonitoring(prisma); // Passa a instância conectada do Prisma
    console.log('✅ Margin Guard monitoring started');
    
    // Start Health Checker service
    console.log('🏥 Starting Health Checker service...');
    const { healthCheckerService } = await import('./services/health-checker.service');
    healthCheckerService.start();
    console.log('✅ Health Checker service started');
    
    console.log('✅ Advanced monitoring services started');
  } catch (error) {
    fastify.log.error('Error starting server:', error as Error);
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
