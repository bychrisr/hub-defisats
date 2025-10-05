import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { userPreferencesService } from '../services/userPreferences.service';

export default async function userPreferencesTestRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  
  /**
   * GET /api/user-preferences-test/health
   * Test endpoint without authentication
   */
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.send({ 
        success: true, 
        message: 'User preferences service is working',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ TEST - Error in health check:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Health check failed' 
      });
    }
  });

  /**
   * GET /api/user-preferences-test/sync
   * Test sync without authentication (using test user)
   */
  fastify.get('/sync', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deviceId } = request.query as { deviceId: string };
      const testUserId = 'test-user-123'; // User ID fixo para testes
      
      console.log(`🔄 TEST SYNC - Syncing preferences for test user: ${testUserId} from device ${deviceId}`);
      const preferences = await userPreferencesService.syncPreferences(testUserId, deviceId || 'test-device');
      
      reply.send({ 
        success: true, 
        data: preferences,
        message: 'Test sync completed'
      });
    } catch (error) {
      console.error('❌ TEST SYNC - Error in sync:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Sync test failed' 
      });
    }
  });

  /**
   * POST /api/user-preferences-test/save
   * Test save without authentication (using test user)
   */
  fastify.post('/save', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { indicatorConfigs } = request.body as { indicatorConfigs: any };
      const testUserId = 'test-user-123'; // User ID fixo para testes
      
      console.log(`💾 TEST SAVE - Saving preferences for test user: ${testUserId}`);
      const success = await userPreferencesService.saveIndicatorPreferences(testUserId, indicatorConfigs);
      
      reply.send({ 
        success,
        message: success ? 'Test save completed' : 'Test save failed'
      });
    } catch (error) {
      console.error('❌ TEST SAVE - Error in save:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Save test failed' 
      });
    }
  });

  /**
   * GET /api/user-preferences-test/stats
   * Test stats without authentication (using test user)
   */
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const testUserId = 'test-user-123'; // User ID fixo para testes
      
      console.log(`📊 TEST STATS - Getting stats for test user: ${testUserId}`);
      const stats = await userPreferencesService.getPreferencesStats(testUserId);
      
      reply.send({ 
        success: true, 
        data: stats,
        message: 'Test stats completed'
      });
    } catch (error) {
      console.error('❌ TEST STATS - Error in stats:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Stats test failed' 
      });
    }
  });
}