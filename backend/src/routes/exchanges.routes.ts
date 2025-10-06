import { FastifyInstance } from 'fastify';
import { adminAuthMiddleware } from '../middleware/auth.middleware';
import { exchangesController } from '../controllers/exchanges.controller';
import { z } from 'zod';

const CreateExchangeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  website: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  api_version: z.string().optional(),
  is_active: z.boolean().default(true),
  credential_types: z.array(z.object({
    name: z.string().min(1, 'Credential type name is required'),
    field_name: z.string().min(1, 'Field name is required'),
    field_type: z.enum(['text', 'password', 'email', 'url']),
    is_required: z.boolean().default(true),
    description: z.string().optional(),
    order: z.number().int().min(0).default(0)
  })).optional().default([])
});

const UpdateExchangeSchema = CreateExchangeSchema.partial();

const ExchangeIdParamSchema = z.object({
  id: z.string().uuid(),
});

export async function exchangesRoutes(fastify: FastifyInstance) {
  // Get all exchanges
  fastify.get('/api/admin/exchanges', {
    preHandler: [adminAuthMiddleware],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  website: { type: 'string', nullable: true },
                  logo_url: { type: 'string', nullable: true },
                  api_version: { type: 'string', nullable: true },
                  is_active: { type: 'boolean' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  credential_types: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        exchange_id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        field_name: { type: 'string' },
                        field_type: { type: 'string', enum: ['text', 'password', 'email', 'url'] },
                        is_required: { type: 'boolean' },
                        description: { type: 'string', nullable: true },
                        order: { type: 'number' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  },
                  _count: {
                    type: 'object',
                    properties: {
                      user_accounts: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, exchangesController.getAllExchanges.bind(exchangesController));

  // Get exchange by ID
  fastify.get('/api/admin/exchanges/:id', {
    preHandler: [adminAuthMiddleware],
    schema: {
      params: ExchangeIdParamSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                slug: { type: 'string' },
                description: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                logo_url: { type: 'string', nullable: true },
                api_version: { type: 'string', nullable: true },
                is_active: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                credential_types: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      exchange_id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      field_name: { type: 'string' },
                      field_type: { type: 'string', enum: ['text', 'password', 'email', 'url'] },
                      is_required: { type: 'boolean' },
                      description: { type: 'string', nullable: true },
                      order: { type: 'number' },
                      created_at: { type: 'string', format: 'date-time' },
                      updated_at: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                _count: {
                  type: 'object',
                  properties: {
                    user_accounts: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, exchangesController.getExchangeById.bind(exchangesController));

  // Create exchange
  fastify.post('/api/admin/exchanges', {
    preHandler: [adminAuthMiddleware],
    schema: {
      body: CreateExchangeSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                slug: { type: 'string' },
                description: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                logo_url: { type: 'string', nullable: true },
                api_version: { type: 'string', nullable: true },
                is_active: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                credential_types: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      exchange_id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      field_name: { type: 'string' },
                      field_type: { type: 'string', enum: ['text', 'password', 'email', 'url'] },
                      is_required: { type: 'boolean' },
                      description: { type: 'string', nullable: true },
                      order: { type: 'number' },
                      created_at: { type: 'string', format: 'date-time' },
                      updated_at: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, exchangesController.createExchange.bind(exchangesController));

  // Update exchange
  fastify.put('/api/admin/exchanges/:id', {
    preHandler: [adminAuthMiddleware],
    schema: {
      params: ExchangeIdParamSchema,
      body: UpdateExchangeSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                slug: { type: 'string' },
                description: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                logo_url: { type: 'string', nullable: true },
                api_version: { type: 'string', nullable: true },
                is_active: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                credential_types: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      exchange_id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      field_name: { type: 'string' },
                      field_type: { type: 'string', enum: ['text', 'password', 'email', 'url'] },
                      is_required: { type: 'boolean' },
                      description: { type: 'string', nullable: true },
                      order: { type: 'number' },
                      created_at: { type: 'string', format: 'date-time' },
                      updated_at: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, exchangesController.updateExchange.bind(exchangesController));

  // Delete exchange
  fastify.delete('/api/admin/exchanges/:id', {
    preHandler: [adminAuthMiddleware],
    schema: {
      params: ExchangeIdParamSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, exchangesController.deleteExchange.bind(exchangesController));

  // Toggle exchange status
  fastify.patch('/api/admin/exchanges/:id/toggle', {
    preHandler: [adminAuthMiddleware],
    schema: {
      params: ExchangeIdParamSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                slug: { type: 'string' },
                description: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                logo_url: { type: 'string', nullable: true },
                api_version: { type: 'string', nullable: true },
                is_active: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                credential_types: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      exchange_id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      field_name: { type: 'string' },
                      field_type: { type: 'string', enum: ['text', 'password', 'email', 'url'] },
                      is_required: { type: 'boolean' },
                      description: { type: 'string', nullable: true },
                      order: { type: 'number' },
                      created_at: { type: 'string', format: 'date-time' },
                      updated_at: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, exchangesController.toggleExchangeStatus.bind(exchangesController));
}
