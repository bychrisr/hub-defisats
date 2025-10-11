/**
 * LND Sync Monitor Routes
 * 
 * API routes for monitoring LND synchronization progress in real-time.
 */

import { FastifyInstance } from 'fastify';
import { LNDService } from '../services/lnd/LNDService';

export async function lndSyncMonitorRoutes(fastify: FastifyInstance) {
  // Get LND sync progress
  fastify.get('/sync-progress', async (request, reply) => {
    try {
      // Direct REST API call to LND
      const lndInfo = await getLNDInfoDirect();
      if (!lndInfo) {
        return reply.status(500).send({
          success: false,
          error: 'Could not connect to LND'
        });
      }

      // Get current testnet block height from external API
      const currentBlockHeight = await getCurrentTestnetBlockHeight();
      
      // Calculate progress
      const progress = {
        currentBlock: lndInfo.block_height || 0,
        currentTestnetBlock: currentBlockHeight,
        percentage: Math.min(100, Math.max(0, ((lndInfo.block_height || 0) / currentBlockHeight) * 100)),
        syncedToChain: lndInfo.synced_to_chain || false,
        syncedToGraph: lndInfo.synced_to_graph || false,
        numPeers: lndInfo.num_peers || 0,
        version: lndInfo.version || 'Unknown',
        alias: lndInfo.alias || 'Unknown',
        color: lndInfo.color || '#000000',
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
 * Get LND info directly via REST API
 */
async function getLNDInfoDirect(): Promise<any> {
  try {
    const https = require('https');
    const util = require('util');
    const { exec } = require('child_process');
    
    // Get macaroon as hex using Docker exec
    let macaroonHex;
    try {
      const execAsync = util.promisify(exec);
      const { stdout } = await execAsync(
        'docker exec axisor-lnd-testnet xxd -p -c 1000 /root/.lnd/data/chain/bitcoin/testnet/admin.macaroon'
      );
      macaroonHex = stdout.trim();
    } catch (error) {
      console.error('Could not get macaroon via Docker:', error);
      return null;
    }
    
    const options = {
      hostname: 'localhost', // Use localhost since we're calling from backend
      port: 18080, // LND REST API port
      path: '/v1/getinfo',
      method: 'GET',
      headers: {
        'Grpc-Metadata-macaroon': macaroonHex
      },
      rejectUnauthorized: false
    };

    const getAsync = util.promisify((options: any, callback: any) => {
      const req = https.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => data += chunk);
        res.on('end', () => {
          try {
            callback(null, JSON.parse(data));
          } catch (parseError) {
            callback(parseError, null);
          }
        });
      });
      req.on('error', callback);
      req.setTimeout(10000, () => {
        req.destroy();
        callback(new Error('Request timeout'), null);
      });
      req.end();
    });

    return await getAsync(options);
  } catch (error) {
    console.error('Failed to get LND info:', error);
    return null;
  }
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
