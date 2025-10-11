/**
 * LND Sync Monitor Simple Routes
 * 
 * Simplified API routes for monitoring LND synchronization progress.
 */

import { FastifyInstance } from 'fastify';
import axios from 'axios';

export async function lndSyncSimpleRoutes(fastify: FastifyInstance) {
  // Get LND sync progress
  fastify.get('/sync-progress', async (request, reply) => {
    try {
      // Get real LND info via REST API
      // First get the macaroon from the container
      const { execSync } = require('child_process');
      const macaroonCmd = `docker exec axisor-lnd-testnet cat /root/.lnd/data/chain/bitcoin/testnet/admin.macaroon | xxd -p -c 1000`;
      const macaroonHex = execSync(macaroonCmd, { encoding: 'utf-8' }).trim();
      
      // Get LND info via REST API
      const lndResponse = await axios.get('https://localhost:18080/v1/getinfo', {
        httpsAgent: new (require('https')).Agent({
          rejectUnauthorized: false
        }),
        headers: {
          'Grpc-Metadata-macaroon': macaroonHex
        },
        timeout: 5000
      });
      
      const lndInfo = lndResponse.data;
      
      // Get current testnet block height from external API
      const currentBlockHeight = await getCurrentTestnetBlockHeight();
      
      const progress = {
        currentBlock: lndInfo.block_height,
        currentTestnetBlock: currentBlockHeight,
        percentage: Math.min(100, Math.max(0, (lndInfo.block_height / currentBlockHeight) * 100)),
        syncedToChain: lndInfo.synced_to_chain,
        syncedToGraph: lndInfo.synced_to_graph,
        numPeers: lndInfo.num_peers,
        version: lndInfo.version,
        alias: lndInfo.alias,
        color: lndInfo.color,
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
