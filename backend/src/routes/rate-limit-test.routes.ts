import { FastifyInstance } from 'fastify';
import { rateLimiters } from '../middleware/rate-limit.middleware';
import { dynamicRateLimiters } from '../middleware/dynamic-rate-limit.middleware';

export async function rateLimitTestRoutes(fastify: FastifyInstance) {
  // Teste simples sem rate limiting
  fastify.get(
    '/simple-test',
    {
      schema: {
        description: 'Simple test without rate limiting',
        tags: ['Rate Limiting Test'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Simple test is working',
        timestamp: new Date().toISOString()
      });
    }
  );

  // Teste com rate limiter estático
  fastify.get(
    '/static-test',
    {
      preHandler: [rateLimiters.api],
      schema: {
        description: 'Test static rate limiting',
        tags: ['Rate Limiting Test'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
              headers: { type: 'object' }
            }
          },
          429: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              retry_after: { type: 'number' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Static rate limiting is working',
        timestamp: new Date().toISOString(),
        headers: {
          'X-RateLimit-Limit': reply.getHeader('X-RateLimit-Limit'),
          'X-RateLimit-Remaining': reply.getHeader('X-RateLimit-Remaining'),
          'X-RateLimit-Reset': reply.getHeader('X-RateLimit-Reset')
        }
      });
    }
  );

  // Teste com rate limiter dinâmico
  fastify.get(
    '/dynamic-test',
    {
      preHandler: [dynamicRateLimiters.api],
      schema: {
        description: 'Test dynamic rate limiting',
        tags: ['Rate Limiting Test'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
              headers: { type: 'object' }
            }
          },
          429: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              retry_after: { type: 'number' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Dynamic rate limiting is working',
        timestamp: new Date().toISOString(),
        headers: {
          'X-RateLimit-Limit': reply.getHeader('X-RateLimit-Limit'),
          'X-RateLimit-Remaining': reply.getHeader('X-RateLimit-Remaining'),
          'X-RateLimit-Reset': reply.getHeader('X-RateLimit-Reset')
        }
      });
    }
  );

  // Teste de stress para verificar rate limiting
  fastify.get(
    '/stress-test',
    {
      preHandler: [rateLimiters.api],
      schema: {
        description: 'Stress test for rate limiting (will hit limit quickly)',
        tags: ['Rate Limiting Test'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              requestCount: { type: 'number' }
            }
          },
          429: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              retry_after: { type: 'number' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      return reply.send({
        success: true,
        message: 'Stress test request successful',
        requestCount: Math.floor(Math.random() * 1000) + 1
      });
    }
  );
}