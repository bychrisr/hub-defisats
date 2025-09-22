import { FastifyInstance } from 'fastify';
import {
  getRouteRedirects,
  createRouteRedirect,
  updateRouteRedirect,
  deleteRouteRedirect,
  getRouteRedirectById,
  toggleRouteRedirect
} from '../controllers/admin/route-redirects.controller';
import { adminMiddleware } from '../middleware/admin.middleware';

export async function routeRedirectsRoutes(fastify: FastifyInstance) {
  // Get all route redirects with filtering and pagination
  fastify.get('/', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get all route redirects with filtering and pagination',
      tags: ['admin', 'route-redirects'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          search: { type: 'string' },
          is_active: { type: 'string', enum: ['true', 'false'] },
          redirect_type: { type: 'string', enum: ['temporary', 'permanent'] },
          sort_by: { type: 'string', default: 'created_at' },
          sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            redirects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  from_path: { type: 'string' },
                  to_path: { type: 'string' },
                  redirect_type: { type: 'string' },
                  is_active: { type: 'boolean' },
                  description: { type: 'string' },
                  created_by: { type: 'string' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                  expires_at: { type: 'string' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                pages: { type: 'number' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                active: { type: 'number' },
                inactive: { type: 'number' },
                temporary: { type: 'number' },
                permanent: { type: 'number' },
                expired: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getRouteRedirects);

  // Create new route redirect
  fastify.post('/', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Create a new route redirect',
      tags: ['admin', 'route-redirects'],
      body: {
        type: 'object',
        required: ['from_path', 'to_path'],
        properties: {
          from_path: { type: 'string', minLength: 1, maxLength: 500 },
          to_path: { type: 'string', minLength: 1, maxLength: 500 },
          redirect_type: { type: 'string', enum: ['temporary', 'permanent'], default: 'temporary' },
          description: { type: 'string', maxLength: 1000 },
          expires_at: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            from_path: { type: 'string' },
            to_path: { type: 'string' },
            redirect_type: { type: 'string' },
            is_active: { type: 'boolean' },
            description: { type: 'string' },
            created_by: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
            expires_at: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, createRouteRedirect);

  // Get route redirect by ID
  fastify.get('/:id', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Get route redirect by ID',
      tags: ['admin', 'route-redirects'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            from_path: { type: 'string' },
            to_path: { type: 'string' },
            redirect_type: { type: 'string' },
            is_active: { type: 'boolean' },
            description: { type: 'string' },
            created_by: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
            expires_at: { type: 'string' }
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
  }, getRouteRedirectById);

  // Update route redirect
  fastify.put('/:id', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Update route redirect',
      tags: ['admin', 'route-redirects'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          to_path: { type: 'string', minLength: 1, maxLength: 500 },
          redirect_type: { type: 'string', enum: ['temporary', 'permanent'] },
          is_active: { type: 'boolean' },
          description: { type: 'string', maxLength: 1000 },
          expires_at: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            from_path: { type: 'string' },
            to_path: { type: 'string' },
            redirect_type: { type: 'string' },
            is_active: { type: 'boolean' },
            description: { type: 'string' },
            created_by: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
            expires_at: { type: 'string' }
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
  }, updateRouteRedirect);

  // Toggle route redirect active status
  fastify.patch('/:id/toggle', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Toggle route redirect active status',
      tags: ['admin', 'route-redirects'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            from_path: { type: 'string' },
            to_path: { type: 'string' },
            redirect_type: { type: 'string' },
            is_active: { type: 'boolean' },
            description: { type: 'string' },
            created_by: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
            expires_at: { type: 'string' }
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
  }, toggleRouteRedirect);

  // Delete route redirect
  fastify.delete('/:id', {
    preHandler: [adminMiddleware],
    schema: {
      description: 'Delete route redirect',
      tags: ['admin', 'route-redirects'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        204: { type: 'null' },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, deleteRouteRedirect);
}
