import { FastifyInstance } from 'fastify';
import { checkRedirect, getAllActiveRedirects } from '../controllers/route-redirect.controller';

export async function routeRedirectRoutes(fastify: FastifyInstance) {
  // Check redirect for specific path
  fastify.get('/check', {
    schema: {
      description: 'Check if a path has a redirect rule',
      tags: ['redirects'],
      querystring: {
        type: 'object',
        properties: {
          path: { type: 'string' }
        },
        required: ['path']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            from_path: { type: 'string' },
            to_path: { type: 'string' },
            redirect_type: { type: 'string' },
            status_code: { type: 'number' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, checkRedirect);

  // Get all active redirects (for frontend middleware)
  fastify.get('/active', {
    schema: {
      description: 'Get all active redirect rules',
      tags: ['redirects'],
      response: {
        200: {
          type: 'object',
          properties: {
            redirects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from_path: { type: 'string' },
                  to_path: { type: 'string' },
                  redirect_type: { type: 'string' }
                }
              }
            },
            count: { type: 'number' }
          }
        }
      }
    }
  }, getAllActiveRedirects);
}
