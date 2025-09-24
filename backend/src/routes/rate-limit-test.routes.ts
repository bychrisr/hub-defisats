import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rateLimiters } from '../middleware/rate-limit.middleware';

interface RateLimitTestRequest extends FastifyRequest {
  body: {
    type: 'api' | 'auth' | 'trading' | 'admin' | 'general';
  };
}

export async function rateLimitTestRoutes(fastify: FastifyInstance) {
  // Endpoint para testar rate limiting
  fastify.post('/api/test-rate-limit', {
    schema: {
      body: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['api', 'auth', 'trading', 'admin', 'general']
          }
        }
      }
    },
    preHandler: [
      async (request: RateLimitTestRequest, reply: FastifyReply) => {
        const { type } = request.body;
        
        // Aplicar rate limiter baseado no tipo
        switch (type) {
          case 'auth':
            await rateLimiters.auth(request, reply);
            break;
          case 'trading':
            await rateLimiters.trading(request, reply);
            break;
          case 'admin':
            await rateLimiters.admin(request, reply);
            break;
          case 'api':
            await rateLimiters.api(request, reply);
            break;
          default:
            await rateLimiters.api(request, reply);
        }
      }
    ]
  }, async (request: RateLimitTestRequest, reply: FastifyReply) => {
    const { type } = request.body;
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return reply.send({
      success: true,
      message: `Rate limit test for ${type} completed successfully`,
      type,
      timestamp: new Date().toISOString()
    });
  });

  // Endpoint para simular rate limit excedido (para desenvolvimento)
  fastify.post('/api/simulate-rate-limit', {
    schema: {
      body: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['api', 'auth', 'trading', 'admin', 'general']
          }
        }
      }
    }
  }, async (request: RateLimitTestRequest, reply: FastifyReply) => {
    const { type } = request.body;
    
    // Simular diferentes tipos de rate limit
    const rateLimitConfigs = {
      auth: {
        retry_after: 900, // 15 minutes
        limit: 5,
        remaining: 0,
        reset_time: Date.now() + 900000,
        window_ms: 900000,
        type: 'auth',
        message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
      },
      trading: {
        retry_after: 60, // 1 minute
        limit: 200,
        remaining: 0,
        reset_time: Date.now() + 60000,
        window_ms: 60000,
        type: 'trading',
        message: 'Too many trading requests. Please slow down.'
      },
      admin: {
        retry_after: 60, // 1 minute
        limit: 50,
        remaining: 0,
        reset_time: Date.now() + 60000,
        window_ms: 60000,
        type: 'admin',
        message: 'Too many admin requests. Please slow down.'
      },
      api: {
        retry_after: 60, // 1 minute
        limit: 100,
        remaining: 0,
        reset_time: Date.now() + 60000,
        window_ms: 60000,
        type: 'api',
        message: 'Too many requests. Please slow down.'
      },
      general: {
        retry_after: 30, // 30 seconds
        limit: 1000,
        remaining: 0,
        reset_time: Date.now() + 30000,
        window_ms: 60000,
        type: 'general',
        message: 'Service temporarily unavailable due to high traffic.'
      }
    };

    const config = rateLimitConfigs[type] || rateLimitConfigs.general;

    return reply.status(429).send({
      error: 'RATE_LIMIT_EXCEEDED',
      ...config
    });
  });

  // Endpoint para obter informações sobre rate limits
  fastify.get('/api/rate-limit-info', async (request, reply) => {
    return reply.send({
      rate_limits: {
        auth: {
          window_ms: 15 * 60 * 1000, // 15 minutes
          max: 5,
          description: 'Authentication attempts'
        },
        trading: {
          window_ms: 60 * 1000, // 1 minute
          max: 200,
          description: 'Trading operations'
        },
        admin: {
          window_ms: 60 * 1000, // 1 minute
          max: 50,
          description: 'Administrative operations'
        },
        api: {
          window_ms: 60 * 1000, // 1 minute
          max: 100,
          description: 'General API requests'
        },
        notifications: {
          window_ms: 60 * 1000, // 1 minute
          max: 30,
          description: 'Notification requests'
        },
        payments: {
          window_ms: 60 * 1000, // 1 minute
          max: 10,
          description: 'Payment requests'
        }
      },
      headers: {
        'X-RateLimit-Limit': 'Total requests allowed in window',
        'X-RateLimit-Remaining': 'Requests remaining in current window',
        'X-RateLimit-Reset': 'Timestamp when the rate limit resets',
        'Retry-After': 'Seconds to wait before retrying'
      }
    });
  });
}
