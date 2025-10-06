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
    preHandler: [adminAuthMiddleware]
  }, exchangesController.getAllExchanges.bind(exchangesController));

  // Get exchange by ID
  fastify.get('/api/admin/exchanges/:id', {
    preHandler: [adminAuthMiddleware]
  }, exchangesController.getExchangeById.bind(exchangesController));

  // Create exchange
  fastify.post('/api/admin/exchanges', {
    preHandler: [adminAuthMiddleware]
  }, exchangesController.createExchange.bind(exchangesController));

  // Update exchange
  fastify.put('/api/admin/exchanges/:id', {
    preHandler: [adminAuthMiddleware]
  }, exchangesController.updateExchange.bind(exchangesController));

  // Delete exchange
  fastify.delete('/api/admin/exchanges/:id', {
    preHandler: [adminAuthMiddleware]
  }, exchangesController.deleteExchange.bind(exchangesController));

  // Toggle exchange status
  fastify.patch('/api/admin/exchanges/:id/toggle', {
    preHandler: [adminAuthMiddleware]
  }, exchangesController.toggleExchangeStatus.bind(exchangesController));
}
