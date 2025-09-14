import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateAdmin } from '../middleware/auth.middleware';

// Schema de validação para configuração de páginas dinâmicas
const DynamicPageConfigSchema = z.object({
  id: z.string().uuid().optional(),
  page_path: z.string().min(1).max(255),
  page_name: z.string().min(1).max(255),
  use_dynamic_title: z.boolean().default(true),
  use_dynamic_favicon: z.boolean().default(true),
  custom_title: z.string().max(255).optional(),
  custom_favicon_url: z.string().url().max(500).optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

const UpdateDynamicPageConfigSchema = DynamicPageConfigSchema.partial().omit({ id: true });

export async function dynamicPagesConfigRoutes(fastify: FastifyInstance) {
  // GET /api/admin/dynamic-pages-config - Listar todas as configurações
  fastify.get('/api/admin/dynamic-pages-config', {
    preHandler: [authenticateAdmin],
    schema: {
      description: 'Listar todas as configurações de páginas dinâmicas',
      tags: ['admin', 'dynamic-pages-config'],
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
                  id: { type: 'string' },
                  page_path: { type: 'string' },
                  page_name: { type: 'string' },
                  use_dynamic_title: { type: 'boolean' },
                  use_dynamic_favicon: { type: 'boolean' },
                  custom_title: { type: 'string' },
                  custom_favicon_url: { type: 'string' },
                  description: { type: 'string' },
                  is_active: { type: 'boolean' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await fastify.pg.query(`
        SELECT * FROM dynamic_pages_config 
        ORDER BY page_path ASC
      `);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      fastify.log.error('Error fetching dynamic pages config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dynamic pages configuration',
      });
    }
  });

  // GET /api/admin/dynamic-pages-config/:id - Obter configuração específica
  fastify.get('/api/admin/dynamic-pages-config/:id', {
    preHandler: [authenticateAdmin],
    schema: {
      description: 'Obter configuração específica de página dinâmica',
      tags: ['admin', 'dynamic-pages-config'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const result = await fastify.pg.query(
        'SELECT * FROM dynamic_pages_config WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Dynamic page configuration not found',
        });
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      fastify.log.error('Error fetching dynamic page config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dynamic page configuration',
      });
    }
  });

  // POST /api/admin/dynamic-pages-config - Criar nova configuração
  fastify.post('/api/admin/dynamic-pages-config', {
    preHandler: [authenticateAdmin],
    schema: {
      description: 'Criar nova configuração de página dinâmica',
      tags: ['admin', 'dynamic-pages-config'],
      body: {
        type: 'object',
        properties: {
          page_path: { type: 'string', minLength: 1, maxLength: 255 },
          page_name: { type: 'string', minLength: 1, maxLength: 255 },
          use_dynamic_title: { type: 'boolean', default: true },
          use_dynamic_favicon: { type: 'boolean', default: true },
          custom_title: { type: 'string', maxLength: 255 },
          custom_favicon_url: { type: 'string', format: 'uri', maxLength: 500 },
          description: { type: 'string' },
          is_active: { type: 'boolean', default: true },
        },
        required: ['page_path', 'page_name'],
      },
    },
  }, async (request, reply) => {
    try {
      const configData = DynamicPageConfigSchema.omit({ id: true }).parse(request.body);

      const result = await fastify.pg.query(`
        INSERT INTO dynamic_pages_config (
          page_path, page_name, use_dynamic_title, use_dynamic_favicon,
          custom_title, custom_favicon_url, description, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        configData.page_path,
        configData.page_name,
        configData.use_dynamic_title,
        configData.use_dynamic_favicon,
        configData.custom_title,
        configData.custom_favicon_url,
        configData.description,
        configData.is_active,
      ]);

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      if (error.code === '23505') { // Unique constraint violation
        return reply.status(409).send({
          success: false,
          error: 'CONFLICT',
          message: 'A configuration for this page path already exists',
        });
      }

      fastify.log.error('Error creating dynamic page config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create dynamic page configuration',
      });
    }
  });

  // PUT /api/admin/dynamic-pages-config/:id - Atualizar configuração
  fastify.put('/api/admin/dynamic-pages-config/:id', {
    preHandler: [authenticateAdmin],
    schema: {
      description: 'Atualizar configuração de página dinâmica',
      tags: ['admin', 'dynamic-pages-config'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          page_path: { type: 'string', minLength: 1, maxLength: 255 },
          page_name: { type: 'string', minLength: 1, maxLength: 255 },
          use_dynamic_title: { type: 'boolean' },
          use_dynamic_favicon: { type: 'boolean' },
          custom_title: { type: 'string', maxLength: 255 },
          custom_favicon_url: { type: 'string', format: 'uri', maxLength: 500 },
          description: { type: 'string' },
          is_active: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = UpdateDynamicPageConfigSchema.parse(request.body);

      // Construir query dinâmica baseada nos campos fornecidos
      const fields = Object.keys(updateData);
      if (fields.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'No fields to update',
        });
      }

      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...fields.map(field => updateData[field as keyof typeof updateData])];

      const result = await fastify.pg.query(`
        UPDATE dynamic_pages_config 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Dynamic page configuration not found',
        });
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      fastify.log.error('Error updating dynamic page config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update dynamic page configuration',
      });
    }
  });

  // DELETE /api/admin/dynamic-pages-config/:id - Excluir configuração
  fastify.delete('/api/admin/dynamic-pages-config/:id', {
    preHandler: [authenticateAdmin],
    schema: {
      description: 'Excluir configuração de página dinâmica',
      tags: ['admin', 'dynamic-pages-config'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const result = await fastify.pg.query(
        'DELETE FROM dynamic_pages_config WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'NOT_FOUND',
          message: 'Dynamic page configuration not found',
        });
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      fastify.log.error('Error deleting dynamic page config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete dynamic page configuration',
      });
    }
  });

  // GET /api/dynamic-pages-config/check/:path - Verificar configuração de uma página (público)
  fastify.get('/api/dynamic-pages-config/check/:path', {
    schema: {
      description: 'Verificar configuração de página dinâmica (público)',
      tags: ['dynamic-pages-config'],
      params: {
        type: 'object',
        properties: {
          path: { type: 'string' },
        },
        required: ['path'],
      },
    },
  }, async (request, reply) => {
    try {
      const { path } = request.params as { path: string };
      
      // Usar conexão direta do PostgreSQL
      const result = await fastify.pg.query(
        'SELECT * FROM dynamic_pages_config WHERE page_path = $1 AND is_active = true',
        [path]
      );

      if (result.rows.length === 0) {
        // Retornar configuração padrão se não encontrar
        return {
          success: true,
          data: {
            page_path: path,
            use_dynamic_title: false,
            use_dynamic_favicon: false,
            custom_title: null,
            custom_favicon_url: null,
          },
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      fastify.log.error('Error checking dynamic page config:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check dynamic page configuration',
      });
    }
  });
}
