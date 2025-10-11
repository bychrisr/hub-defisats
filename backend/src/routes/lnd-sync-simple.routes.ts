/**
 * LND Sync Monitor Simple Routes
 * 
 * Simplified API routes for monitoring LND synchronization progress.
 */

import { FastifyInstance } from 'fastify';

export async function lndSyncSimpleRoutes(fastify: FastifyInstance) {
  // Get LND sync progress
  fastify.get('/sync-progress', async (request, reply) => {
    try {
      // Get current testnet block height from external API
      const currentBlockHeight = await getCurrentTestnetBlockHeight();
      
      // For now, return mock data with real current block
      const progress = {
        currentBlock: 3808000, // From our curl test
        currentTestnetBlock: currentBlockHeight,
        percentage: Math.min(100, Math.max(0, (3808000 / currentBlockHeight) * 100)),
        syncedToChain: false,
        syncedToGraph: false,
        numPeers: 0,
        version: "0.17.0-beta",
        alias: "Axisor-Testnet-Node",
        color: "#ff6b35",
        timestamp: new Date().toISOString()
      };

      return reply.status(200).send({
        success: true,
        data: progress
      });

    } catch (error: any) {
      console.error('❌ Failed to get LND sync progress:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get sync progress'
      });
    }
  });
}

/**
 * Get current testnet block height from external API
 */
async function getCurrentTestnetBlockHeight(): Promise<number> {
  try {
    const https = require('https');
    const util = require('util');
    
    const options = {
      hostname: 'blockstream.info',
      port: 443,
      path: '/testnet/api/blocks/tip/height',
      method: 'GET'
    };

    const getAsync = util.promisify((options: any, callback: any) => {
      const req = https.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => data += chunk);
        res.on('end', () => callback(null, parseInt(data.trim())));
      });
      req.on('error', callback);
      req.end();
    });

    return await getAsync(options);
  } catch (error) {
    console.error('Failed to get current block height:', error);
    // Fallback to estimated current block height
    return 2800000; // Approximate current testnet block height
  }
}
