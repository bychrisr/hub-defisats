// backend/src/routes/automation.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AutomationService, MarginGuardConfig } from '../services/AutomationService';
import { authMiddleware } from '../middleware/auth.middleware';

export async function automationRoutes(fastify: FastifyInstance) {
  const automationService = new AutomationService();

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // GET /api/automation/config - Buscar configuração do usuário
  fastify.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      if (!user?.id) {
        return reply.status(401).send({ 
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Usuário não autenticado' 
        });
      }

      const config = await automationService.getConfig(user.id);
      
      return reply.send({ 
        success: true,
        config 
      });
    } catch (error: any) {
      console.error('❌ AUTOMATION ROUTES - Erro ao buscar configuração:', error);
      return reply.status(500).send({ 
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao buscar configurações' 
      });
    }
  });

  // POST /api/automation/config - Salvar configuração do usuário
  fastify.post('/config', {
    schema: {
      body: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          threshold: { type: 'number', minimum: 0.1, maximum: 100 },
          action: { 
            type: 'string', 
            enum: ['add_margin', 'close_position', 'reduce_position'] 
          },
          add_margin_amount: { 
            type: 'number', 
            minimum: 0, 
            maximum: 100, 
            nullable: true 
          },
          reduce_percentage: { 
            type: 'number', 
            minimum: 0, 
            maximum: 100, 
            nullable: true 
          },
        },
        required: ['enabled', 'threshold', 'action'],
      },
    },
  }, async (request: FastifyRequest<{ Body: MarginGuardConfig }>, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      if (!user?.id) {
        return reply.status(401).send({ 
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Usuário não autenticado' 
        });
      }

      const config = request.body;
      await automationService.saveConfig(user.id, config);
      
      return reply.status(201).send({ 
        success: true,
        message: 'Configurações salvas com sucesso' 
      });
    } catch (error: any) {
      console.error('❌ AUTOMATION ROUTES - Erro ao salvar configuração:', error);
      return reply.status(500).send({ 
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao salvar configurações' 
      });
    }
  });
}
