import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MarginGuardIntegrationService } from '../services/margin-guard-integration.service';

export class MarginGuardIntegrationController {
  private marginGuardIntegration: MarginGuardIntegrationService;

  constructor(prisma: PrismaClient, redisConnection: any) {
    this.marginGuardIntegration = new MarginGuardIntegrationService({
      redisConnection,
      enableWorkers: true,
      enableScheduler: true,
      enableNotifications: true
    });
  }

  /**
   * Initialize Margin Guard system
   */
  async initialize(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🚀 MARGIN GUARD INTEGRATION CONTROLLER - Initializing system...');
      
      await this.marginGuardIntegration.initialize();

      return reply.send({
        success: true,
        message: 'Margin Guard system initialized successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION CONTROLLER - Initialization failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'INITIALIZATION_FAILED',
        message: 'Failed to initialize Margin Guard system',
        details: error.message
      });
    }
  }

  /**
   * Execute Margin Guard for a specific user
   */
  async executeForUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      
      console.log(`🛡️ MARGIN GUARD INTEGRATION CONTROLLER - Executing for user ${userId}`);
      
      const result = await this.marginGuardIntegration.executeMarginGuardForUser(userId);

      if (result.success) {
        return reply.send({
          success: true,
          data: result,
          message: 'Margin Guard execution completed successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        return reply.status(400).send({
          success: false,
          error: 'EXECUTION_FAILED',
          message: 'Margin Guard execution failed',
          details: result.error
        });
      }
    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION CONTROLLER - Execution failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'EXECUTION_ERROR',
        message: 'Failed to execute Margin Guard',
        details: error.message
      });
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📊 MARGIN GUARD INTEGRATION CONTROLLER - Getting system status...');
      
      const status = await this.marginGuardIntegration.getSystemStatus();

      return reply.send({
        success: true,
        data: status,
        message: 'System status retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION CONTROLLER - Failed to get status:', error);
      return reply.status(500).send({
        success: false,
        error: 'STATUS_ERROR',
        message: 'Failed to get system status',
        details: error.message
      });
    }
  }

  /**
   * Execute Margin Guard for all active users
   */
  async executeForAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🛡️ MARGIN GUARD INTEGRATION CONTROLLER - Executing for all users...');
      
      // Get all users with active Margin Guard automations
      const prisma = new PrismaClient();
      const usersWithAutomations = await prisma.user.findMany({
        where: {
          automations: {
            some: {
              type: 'margin_guard',
              is_active: true
            }
          }
        },
        select: { id: true, email: true }
      });

      console.log(`🔍 MARGIN GUARD INTEGRATION CONTROLLER - Found ${usersWithAutomations.length} users with active automations`);

      const results = [];

      for (const user of usersWithAutomations) {
        try {
          const result = await this.marginGuardIntegration.executeMarginGuardForUser(user.id);
          results.push({
            userId: user.id,
            email: user.email,
            success: result.success,
            message: result.message || 'Execution completed'
          });
        } catch (error) {
          console.error(`❌ MARGIN GUARD INTEGRATION CONTROLLER - Failed for user ${user.id}:`, error);
          results.push({
            userId: user.id,
            email: user.email,
            success: false,
            error: error.message
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`✅ MARGIN GUARD INTEGRATION CONTROLLER - Execution completed:`, {
        total: results.length,
        successful,
        failed
      });

      return reply.send({
        success: true,
        data: {
          total: results.length,
          successful,
          failed,
          results
        },
        message: `Margin Guard execution completed for ${results.length} users`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION CONTROLLER - Failed to execute for all users:', error);
      return reply.status(500).send({
        success: false,
        error: 'BULK_EXECUTION_ERROR',
        message: 'Failed to execute Margin Guard for all users',
        details: error.message
      });
    }
  }

  /**
   * Test Margin Guard system
   */
  async testSystem(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🧪 MARGIN GUARD INTEGRATION CONTROLLER - Testing system...');
      
      // Test with brainoschris@gmail.com user
      const testUserId = 'fec9073b-244d-407b-a7d1-6d7a7f616c20';
      
      const result = await this.marginGuardIntegration.executeMarginGuardForUser(testUserId);

      return reply.send({
        success: true,
        data: {
          testUserId,
          result,
          systemStatus: await this.marginGuardIntegration.getSystemStatus()
        },
        message: 'Margin Guard system test completed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION CONTROLLER - System test failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'TEST_ERROR',
        message: 'Margin Guard system test failed',
        details: error.message
      });
    }
  }

  /**
   * Shutdown Margin Guard system
   */
  async shutdown(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🛑 MARGIN GUARD INTEGRATION CONTROLLER - Shutting down system...');
      
      await this.marginGuardIntegration.shutdown();

      return reply.send({
        success: true,
        message: 'Margin Guard system shutdown successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION CONTROLLER - Shutdown failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'SHUTDOWN_ERROR',
        message: 'Failed to shutdown Margin Guard system',
        details: error.message
      });
    }
  }
}
