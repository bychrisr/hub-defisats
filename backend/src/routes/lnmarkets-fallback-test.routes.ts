import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.middleware';
import { LNMarketsFallbackService, CoinGeckoProvider, BinanceProvider } from '../services/lnmarkets-fallback.service';
import { getPrisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export async function lnMarketsFallbackTestRoutes(fastify: FastifyInstance) {
  /**
   * Test individual fallback providers (public endpoint)
   */
  fastify.get('/test-providers', async (request, reply) => {
    try {
      const providers = [
        new CoinGeckoProvider(),
        new BinanceProvider()
      ];

      const results = [];

      for (const provider of providers) {
        try {
          const isHealthy = await provider.isHealthy();
          const marketData = isHealthy ? await provider.getMarketData() : null;
          
          results.push({
            name: provider.name,
            healthy: isHealthy,
            marketData: marketData ? {
              symbol: marketData.symbol,
              price: marketData.price,
              source: marketData.source
            } : null
          });
        } catch (error: any) {
          results.push({
            name: provider.name,
            healthy: false,
            error: error.message
          });
        }
      }

      reply.send({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          providers: results
        }
      });

    } catch (error: any) {
      logger.error('Provider test failed', { error: error.message });
      reply.status(500).send({
        success: false,
        error: 'PROVIDER_TEST_FAILED',
        message: error.message
      });
    }
  });

  // Apply authentication middleware for protected routes
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for test-providers endpoint
    if (request.url.includes('/test-providers')) {
      return;
    }
    await authMiddleware(request, reply);
  });

  /**
   * Test LN Markets with fallback providers
   */
  fastify.get('/test-fallback', async (request, reply) => {
    try {
      const user = request.user;
      
      // Get user's LN Markets credentials
      const prisma = await getPrisma();
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true
        }
      });

      if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured'
        });
      }

      // Create fallback providers
      const fallbackProviders = [
        new CoinGeckoProvider(),
        new BinanceProvider()
      ];

      // Create fallback service
      const fallbackService = new LNMarketsFallbackService(
        {
          apiKey: userProfile.ln_markets_api_key,
          apiSecret: userProfile.ln_markets_api_secret,
          passphrase: userProfile.ln_markets_passphrase
        },
        fallbackProviders,
        logger
      );

      // Test all methods
      const results = {
        marketData: null as any,
        positions: null as any,
        marginInfo: null as any,
        healthStatus: null as any,
        circuitBreakerStatus: null as any
      };

      try {
        results.marketData = await fallbackService.getMarketData();
      } catch (error: any) {
        results.marketData = { error: error.message };
      }

      try {
        results.positions = await fallbackService.getPositions();
      } catch (error: any) {
        results.positions = { error: error.message };
      }

      try {
        results.marginInfo = await fallbackService.getMarginInfo();
      } catch (error: any) {
        results.marginInfo = { error: error.message };
      }

      try {
        results.healthStatus = await fallbackService.getHealthStatus();
      } catch (error: any) {
        results.healthStatus = { error: error.message };
      }

      results.circuitBreakerStatus = fallbackService.getCircuitBreakerStatus();

      reply.send({
        success: true,
        data: {
          userId: user.id,
          timestamp: new Date().toISOString(),
          results,
          fallbackProviders: fallbackProviders.map(p => p.name)
        }
      });

    } catch (error: any) {
      logger.error('Fallback test failed', { error: error.message });
      reply.status(500).send({
        success: false,
        error: 'TEST_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Get LN Markets health status with fallback info
   */
  fastify.get('/health-status', async (request, reply) => {
    try {
      const user = request.user;
      
      // Get user's LN Markets credentials
      const prisma = await getPrisma();
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true
        }
      });

      if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured'
        });
      }

      // Create fallback providers
      const fallbackProviders = [
        new CoinGeckoProvider(),
        new BinanceProvider()
      ];

      // Create fallback service
      const fallbackService = new LNMarketsFallbackService(
        {
          apiKey: userProfile.ln_markets_api_key,
          apiSecret: userProfile.ln_markets_api_secret,
          passphrase: userProfile.ln_markets_passphrase
        },
        fallbackProviders,
        logger
      );

      const healthStatus = await fallbackService.getHealthStatus();
      const circuitBreakerStatus = fallbackService.getCircuitBreakerStatus();

      reply.send({
        success: true,
        data: {
          userId: user.id,
          timestamp: new Date().toISOString(),
          healthStatus,
          circuitBreakerStatus,
          fallbackProviders: fallbackProviders.map(p => p.name)
        }
      });

    } catch (error: any) {
      logger.error('Health status check failed', { error: error.message });
      reply.status(500).send({
        success: false,
        error: 'HEALTH_CHECK_FAILED',
        message: error.message
      });
    }
  });

}
