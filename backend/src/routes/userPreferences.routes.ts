import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { userPreferencesService } from '../services/userPreferences.service';
import { authMiddleware } from '../middleware/auth.middleware';

export default async function userPreferencesRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  
  // Middleware de autenticação para todas as rotas
  fastify.addHook('preHandler', authMiddleware);

  /**
   * GET /api/user-preferences/indicators
   * Carrega as preferências de indicadores do usuário
   */
  fastify.get('/indicators', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'User not authenticated' });
      }

      console.log(`📦 API - Loading indicator preferences for user: ${userId}`);
      
      const preferences = await userPreferencesService.loadIndicatorPreferences(userId);
      
      if (!preferences) {
        return reply.send({ 
          success: true, 
          data: null, 
          message: 'No preferences found' 
        });
      }

      reply.send({ 
        success: true, 
        data: preferences,
        message: 'Preferences loaded successfully'
      });

    } catch (error) {
      console.error('❌ API - Error loading preferences:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Failed to load preferences' 
      });
    }
  });

  /**
   * POST /api/user-preferences/indicators
   * Salva as preferências de indicadores do usuário
   */
  fastify.post('/indicators', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('🔍 API ROUTE - POST /indicators - Request received');
      console.log('🔍 API ROUTE - Request headers:', request.headers);
      console.log('🔍 API ROUTE - Request body:', JSON.stringify(request.body, null, 2));
      
      const userId = (request as any).user?.id;
      console.log('🔍 API ROUTE - User ID from auth middleware:', userId);
      
      if (!userId) {
        console.log('❌ API ROUTE - No user ID found, user not authenticated');
        return reply.status(401).send({ success: false, error: 'User not authenticated' });
      }

      const { indicatorConfigs } = request.body as { indicatorConfigs: any };
      console.log('🔍 API ROUTE - Indicator configs from request:', JSON.stringify(indicatorConfigs, null, 2));
      
      if (!indicatorConfigs || typeof indicatorConfigs !== 'object') {
        console.log('❌ API ROUTE - Invalid indicator configs provided');
        return reply.status(400).send({ 
          success: false, 
          error: 'Invalid indicator configurations' 
        });
      }

      console.log(`💾 API ROUTE - Calling userPreferencesService.saveIndicatorPreferences for user: ${userId}`);
      const success = await userPreferencesService.saveIndicatorPreferences(userId, indicatorConfigs);
      console.log(`💾 API ROUTE - Service returned success: ${success}`);
      
      if (!success) {
        console.log('❌ API ROUTE - Service returned false, sending 500 error');
        return reply.status(500).send({ 
          success: false, 
          error: 'Failed to save preferences' 
        });
      }

      console.log('✅ API ROUTE - Sending success response');
      reply.send({ 
        success: true, 
        message: 'Preferences saved successfully' 
      });

    } catch (error) {
      console.error('❌ API ROUTE - Error saving preferences:', error);
      console.error('❌ API ROUTE - Error stack:', (error as Error).stack);
      reply.status(500).send({ 
        success: false, 
        error: 'Failed to save preferences' 
      });
    }
  });

  /**
   * DELETE /api/user-preferences/indicators
   * Remove as preferências de indicadores do usuário
   */
  fastify.delete('/indicators', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'User not authenticated' });
      }

      console.log(`🗑️ API - Clearing indicator preferences for user: ${userId}`);
      
      const success = await userPreferencesService.clearIndicatorPreferences(userId);
      
      if (!success) {
        return reply.status(500).send({ 
          success: false, 
          error: 'Failed to clear preferences' 
        });
      }

      reply.send({ 
        success: true, 
        message: 'Preferences cleared successfully' 
      });

    } catch (error) {
      console.error('❌ API - Error clearing preferences:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Failed to clear preferences' 
      });
    }
  });

  /**
   * GET /api/user-preferences/sync
   * Sincroniza preferências entre dispositivos
   */
  fastify.get('/sync', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      const { deviceId } = request.query as { deviceId: string };
      
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'User not authenticated' });
      }

      console.log(`🔄 API - Syncing preferences for user: ${userId}, device: ${deviceId || 'unknown'}`);
      
      const preferences = await userPreferencesService.syncPreferences(userId, deviceId || 'unknown');
      
      if (!preferences) {
        return reply.send({ 
          success: true, 
          data: null, 
          message: 'No preferences to sync' 
        });
      }

      reply.send({ 
        success: true, 
        data: preferences,
        message: 'Preferences synced successfully'
      });

    } catch (error) {
      console.error('❌ API - Error syncing preferences:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Failed to sync preferences' 
      });
    }
  });

  /**
   * GET /api/user-preferences/export
   * Exporta preferências para backup
   */
  fastify.get('/export', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'User not authenticated' });
      }

      console.log(`📤 API - Exporting preferences for user: ${userId}`);
      
      const jsonData = await userPreferencesService.exportPreferences(userId);
      
      if (!jsonData) {
        return reply.status(404).send({ 
          success: false, 
          error: 'No preferences found to export' 
        });
      }

      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="user-preferences-${userId}.json"`);
      reply.send(jsonData);

    } catch (error) {
      console.error('❌ API - Error exporting preferences:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Failed to export preferences' 
      });
    }
  });

  /**
   * POST /api/user-preferences/import
   * Importa preferências de backup
   */
  fastify.post('/import', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'User not authenticated' });
      }

      const { jsonData } = request.body as { jsonData: string };
      
      if (!jsonData || typeof jsonData !== 'string') {
        return reply.status(400).send({ 
          success: false, 
          error: 'Invalid JSON data' 
        });
      }

      console.log(`📥 API - Importing preferences for user: ${userId}`);
      
      const success = await userPreferencesService.importPreferences(userId, jsonData);
      
      if (!success) {
        return reply.status(500).send({ 
          success: false, 
          error: 'Failed to import preferences' 
        });
      }

      reply.send({ 
        success: true, 
        message: 'Preferences imported successfully' 
      });

    } catch (error) {
      console.error('❌ API - Error importing preferences:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Failed to import preferences' 
      });
    }
  });

  /**
   * GET /api/user-preferences/stats
   * Obtém estatísticas das preferências
   */
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'User not authenticated' });
      }

      console.log(`📊 API - Getting preferences stats for user: ${userId}`);
      
      const stats = await userPreferencesService.getPreferencesStats(userId);
      
      reply.send({ 
        success: true, 
        data: stats,
        message: 'Stats retrieved successfully'
      });

    } catch (error) {
      console.error('❌ API - Error getting stats:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Failed to get stats' 
      });
    }
  });
}