import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimiter } from './rate-limit.middleware';

/**
 * Rate limiting configurado para desenvolvimento
 * Muito mais permissivo que produção para facilitar desenvolvimento
 */
export class DevelopmentRateLimiter {
  /**
   * Rate limiter para desenvolvimento - muito mais permissivo
   */
  static createDevelopmentConfig() {
    const config = {
      // Auth endpoints - muito mais permissivo para desenvolvimento
      auth: {
        windowMs: 5 * 60 * 1000, // 5 minutos (vs 15 minutos em produção)
        max: 50, // 50 tentativas por 5 minutos (vs 5 tentativas por 15 minutos)
        message: 'Too many authentication attempts in development. Please wait 5 minutes.',
        skipSuccessfulRequests: true, // Não contar tentativas bem-sucedidas
      },

      // API geral - mais permissivo
      api: {
        windowMs: 60 * 1000, // 1 minuto
        max: 1000, // 1000 requests por minuto (vs 100 em produção)
        message: 'Too many requests in development. Please slow down.',
      },

      // Trading endpoints - muito mais permissivo
      trading: {
        windowMs: 60 * 1000, // 1 minuto
        max: 2000, // 2000 requests por minuto (vs 200 em produção)
        message: 'Too many trading requests in development. Please slow down.',
      },

      // Notification endpoints
      notifications: {
        windowMs: 60 * 1000, // 1 minuto
        max: 300, // 300 notifications por minuto (vs 30 em produção)
        message: 'Too many notification requests in development. Please slow down.',
      },

      // Payment endpoints - mais permissivo para testes
      payments: {
        windowMs: 60 * 1000, // 1 minuto
        max: 100, // 100 payment requests por minuto (vs 10 em produção)
        message: 'Too many payment requests in development. Please slow down.',
      },

      // Admin endpoints
      admin: {
        windowMs: 60 * 1000, // 1 minuto
        max: 500, // 500 admin requests por minuto (vs 50 em produção)
        message: 'Too many admin requests in development. Please slow down.',
      },

      // Global rate limiter para desenvolvimento
      global: {
        windowMs: 60 * 1000, // 1 minuto
        max: 2000, // 2000 requests por minuto (vs 1000 em produção)
        message: 'Global rate limit exceeded in development.',
      },
    };

    // Criar os rate limiters reais
    return {
      auth: RateLimiter.create(config.auth),
      api: RateLimiter.create(config.api),
      trading: RateLimiter.create(config.trading),
      notifications: RateLimiter.create(config.notifications),
      payments: RateLimiter.create(config.payments),
      admin: RateLimiter.create(config.admin),
      global: RateLimiter.create(config.global),
      // Manter as propriedades originais para testes
      ...config,
    };
  }

  /**
   * Rate limiter para staging - intermediário entre desenvolvimento e produção
   */
  static createStagingConfig() {
    const config = {
      // Auth endpoints - mais permissivo que produção, menos que desenvolvimento
      auth: {
        windowMs: 10 * 60 * 1000, // 10 minutos (vs 15 minutos em produção)
        max: 20, // 20 tentativas por 10 minutos (vs 5 em produção, 50 em desenvolvimento)
        message: 'Too many authentication attempts in staging. Please wait 10 minutes.',
        skipSuccessfulRequests: true,
      },

      // API geral
      api: {
        windowMs: 60 * 1000, // 1 minuto
        max: 500, // 500 requests por minuto (vs 100 em produção, 1000 em desenvolvimento)
        message: 'Too many requests in staging. Please slow down.',
      },

      // Trading endpoints
      trading: {
        windowMs: 60 * 1000, // 1 minuto
        max: 1000, // 1000 requests por minuto (vs 200 em produção, 2000 em desenvolvimento)
        message: 'Too many trading requests in staging. Please slow down.',
      },

      // Notification endpoints
      notifications: {
        windowMs: 60 * 1000, // 1 minuto
        max: 150, // 150 notifications por minuto (vs 30 em produção, 300 em desenvolvimento)
        message: 'Too many notification requests in staging. Please slow down.',
      },

      // Payment endpoints
      payments: {
        windowMs: 60 * 1000, // 1 minuto
        max: 50, // 50 payment requests por minuto (vs 10 em produção, 100 em desenvolvimento)
        message: 'Too many payment requests in staging. Please slow down.',
      },

      // Admin endpoints
      admin: {
        windowMs: 60 * 1000, // 1 minuto
        max: 250, // 250 admin requests por minuto (vs 50 em produção, 500 em desenvolvimento)
        message: 'Too many admin requests in staging. Please slow down.',
      },

      // Global rate limiter para staging
      global: {
        windowMs: 60 * 1000, // 1 minuto
        max: 1500, // 1500 requests por minuto (vs 1000 em produção, 2000 em desenvolvimento)
        message: 'Global rate limit exceeded in staging.',
      },
    };

    // Criar os rate limiters reais
    return {
      auth: RateLimiter.create(config.auth),
      api: RateLimiter.create(config.api),
      trading: RateLimiter.create(config.trading),
      notifications: RateLimiter.create(config.notifications),
      payments: RateLimiter.create(config.payments),
      admin: RateLimiter.create(config.admin),
      global: RateLimiter.create(config.global),
      // Manter as propriedades originais para testes
      ...config,
    };
  }

  /**
   * Rate limiter para produção - mais restritivo
   */
  static createProductionConfig() {
    const config = {
      // Auth endpoints - restritivo para segurança
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 5, // 5 tentativas por 15 minutos
        message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
        skipSuccessfulRequests: true,
      },

      // API geral
      api: {
        windowMs: 60 * 1000, // 1 minuto
        max: 100, // 100 requests por minuto
        message: 'Too many requests. Please slow down.',
      },

      // Trading endpoints
      trading: {
        windowMs: 60 * 1000, // 1 minuto
        max: 200, // 200 requests por minuto
        message: 'Too many trading requests. Please slow down.',
      },

      // Notification endpoints
      notifications: {
        windowMs: 60 * 1000, // 1 minuto
        max: 30, // 30 notifications por minuto
        message: 'Too many notification requests. Please slow down.',
      },

      // Payment endpoints - muito restritivo para segurança
      payments: {
        windowMs: 60 * 1000, // 1 minuto
        max: 10, // 10 payment requests por minuto
        message: 'Too many payment requests. Please slow down.',
      },

      // Admin endpoints
      admin: {
        windowMs: 60 * 1000, // 1 minuto
        max: 50, // 50 admin requests por minuto
        message: 'Too many admin requests. Please slow down.',
      },

      // Global rate limiter para produção
      global: {
        windowMs: 60 * 1000, // 1 minuto
        max: 1000, // 1000 requests por minuto
        message: 'Global rate limit exceeded.',
      },
    };

    // Criar os rate limiters reais
    return {
      auth: RateLimiter.create(config.auth),
      api: RateLimiter.create(config.api),
      trading: RateLimiter.create(config.trading),
      notifications: RateLimiter.create(config.notifications),
      payments: RateLimiter.create(config.payments),
      admin: RateLimiter.create(config.admin),
      global: RateLimiter.create(config.global),
      // Manter as propriedades originais para testes
      ...config,
    };
  }

  /**
   * Detecta o ambiente atual de forma mais robusta
   */
  static detectEnvironment(): 'development' | 'staging' | 'production' {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    const environment = process.env.ENVIRONMENT?.toLowerCase();
    const port = process.env.PORT;
    const corsOrigin = process.env.CORS_ORIGIN;
    
    // Debug: mostrar valores atuais
    console.log('🔍 RATE LIMIT - Environment detection:', {
      NODE_ENV: nodeEnv,
      ENVIRONMENT: environment,
      PORT: port,
      CORS_ORIGIN: corsOrigin,
    });
    
    // Detecção por ENVIRONMENT (prioridade mais alta)
    if (environment === 'development' || environment === 'dev') {
      return 'development';
    }
    
    if (environment === 'staging') {
      return 'staging';
    }
    
    if (environment === 'production') {
      return 'production';
    }
    
    // Detecção por NODE_ENV
    if (nodeEnv === 'development' || nodeEnv === 'dev' || nodeEnv === 'test') {
      return 'development';
    }
    
    if (nodeEnv === 'staging') {
      return 'staging';
    }
    
    if (nodeEnv === 'production') {
      return 'production';
    }
    
    // Detecção por características do ambiente
    if (port === '3000' || port === '13010' || corsOrigin?.includes('localhost')) {
      return 'development';
    }
    
    if (corsOrigin?.includes('staging') || corsOrigin?.includes('test') || corsOrigin?.includes('staging.')) {
      return 'staging';
    }
    
    if (corsOrigin?.includes('https://') && !corsOrigin?.includes('localhost') && !corsOrigin?.includes('staging')) {
      return 'production';
    }
    
    // Fallback: se não conseguir detectar, assume desenvolvimento
    console.log('⚠️ RATE LIMIT - Could not detect environment, defaulting to development');
    return 'development';
  }

  /**
   * Obtém configuração baseada no ambiente detectado
   */
  static getConfig() {
    const environment = this.detectEnvironment();
    
    console.log(`🔧 RATE LIMIT - Detected environment: ${environment.toUpperCase()}`);
    console.log(`🔧 RATE LIMIT - NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`🔧 RATE LIMIT - ENVIRONMENT: ${process.env.ENVIRONMENT || 'undefined'}`);
    console.log(`🔧 RATE LIMIT - PORT: ${process.env.PORT || 'undefined'}`);
    console.log(`🔧 RATE LIMIT - CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'undefined'}`);

    switch (environment) {
      case 'development':
        return this.createDevelopmentConfig();
      case 'staging':
        return this.createStagingConfig();
      case 'production':
        return this.createProductionConfig();
      default:
        console.log('⚠️ RATE LIMIT - Unknown environment, using development config');
        return this.createDevelopmentConfig();
    }
  }
}

/**
 * Rate limiters dinâmicos baseados no ambiente
 */
export const dynamicRateLimiters = {
  auth: async (request: FastifyRequest, reply: FastifyReply) => {
    const config = DevelopmentRateLimiter.getConfig();
    await (config as any).auth(request, reply);
  },
  api: async (request: FastifyRequest, reply: FastifyReply) => {
    const config = DevelopmentRateLimiter.getConfig();
    await (config as any).api(request, reply);
  },
  trading: async (request: FastifyRequest, reply: FastifyReply) => {
    const config = DevelopmentRateLimiter.getConfig();
    await (config as any).trading(request, reply);
  },
  notifications: async (request: FastifyRequest, reply: FastifyReply) => {
    const config = DevelopmentRateLimiter.getConfig();
    await (config as any).notifications(request, reply);
  },
  payments: async (request: FastifyRequest, reply: FastifyReply) => {
    const config = DevelopmentRateLimiter.getConfig();
    await (config as any).payments(request, reply);
  },
  admin: async (request: FastifyRequest, reply: FastifyReply) => {
    const config = DevelopmentRateLimiter.getConfig();
    await (config as any).admin(request, reply);
  },
  global: async (request: FastifyRequest, reply: FastifyReply) => {
    const config = DevelopmentRateLimiter.getConfig();
    await (config as any).global(request, reply);
  },
};

/**
 * Middleware para rate limiting de login com configuração dinâmica
 */
export async function dynamicLoginRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await dynamicRateLimiters.auth(request, reply);
}

/**
 * Middleware para rate limiting de API com configuração dinâmica
 */
export async function dynamicApiRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await dynamicRateLimiters.api(request, reply);
}

/**
 * Middleware para rate limiting de trading com configuração dinâmica
 */
export async function dynamicTradingRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await dynamicRateLimiters.trading(request, reply);
}

/**
 * Middleware para rate limiting de notifications com configuração dinâmica
 */
export async function dynamicNotificationRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await dynamicRateLimiters.notifications(request, reply);
}

/**
 * Middleware para rate limiting de payments com configuração dinâmica
 */
export async function dynamicPaymentRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await dynamicRateLimiters.payments(request, reply);
}

/**
 * Middleware para rate limiting de admin com configuração dinâmica
 */
export async function dynamicAdminRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await dynamicRateLimiters.admin(request, reply);
}

/**
 * Middleware para rate limiting global com configuração dinâmica
 */
export async function dynamicGlobalRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await dynamicRateLimiters.global(request, reply);
}

/**
 * Utilitário para verificar configuração atual de rate limiting
 */
export function getRateLimitInfo() {
  const environment = DevelopmentRateLimiter.detectEnvironment();
  const config = DevelopmentRateLimiter.getConfig();

  return {
    environment,
    detection: {
      nodeEnv: process.env.NODE_ENV || 'undefined',
      environment: process.env.ENVIRONMENT || 'undefined',
      port: process.env.PORT || 'undefined',
      corsOrigin: process.env.CORS_ORIGIN || 'undefined',
    },
    configs: {
      auth: {
        windowMs: config.auth['windowMs'],
        max: config.auth['max'],
        windowMinutes: Math.round(config.auth['windowMs'] / 60000),
        description: 'Authentication endpoints (login, register, password reset)',
      },
      api: {
        windowMs: config.api['windowMs'],
        max: config.api['max'],
        windowMinutes: Math.round(config.api['windowMs'] / 60000),
        description: 'General API endpoints',
      },
      trading: {
        windowMs: config.trading['windowMs'],
        max: config.trading['max'],
        windowMinutes: Math.round(config.trading['windowMs'] / 60000),
        description: 'Trading endpoints (orders, positions, portfolio)',
      },
      notifications: {
        windowMs: config.notifications['windowMs'],
        max: config.notifications['max'],
        windowMinutes: Math.round(config.notifications['windowMs'] / 60000),
        description: 'Notification endpoints',
      },
      payments: {
        windowMs: config.payments['windowMs'],
        max: config.payments['max'],
        windowMinutes: Math.round(config.payments['windowMs'] / 60000),
        description: 'Payment endpoints',
      },
      admin: {
        windowMs: config.admin['windowMs'],
        max: config.admin['max'],
        windowMinutes: Math.round(config.admin['windowMs'] / 60000),
        description: 'Admin endpoints',
      },
      global: {
        windowMs: config.global['windowMs'],
        max: config.global['max'],
        windowMinutes: Math.round(config.global['windowMs'] / 60000),
        description: 'Global rate limiter (catch-all)',
      },
    },
    comparison: {
      development: {
        auth: '50 attempts per 5 minutes',
        api: '1000 requests per minute',
        trading: '2000 requests per minute',
      },
      staging: {
        auth: '20 attempts per 10 minutes',
        api: '500 requests per minute',
        trading: '1000 requests per minute',
      },
      production: {
        auth: '5 attempts per 15 minutes',
        api: '100 requests per minute',
        trading: '200 requests per minute',
      },
    },
  };
}
