/**
 * LND Info Endpoints
 * 
 * Endpoints for retrieving LND node information, metrics, and network status.
 */

import { LNDClient } from '../LNDClient';

export class LNDInfoEndpoints {
  constructor(private client: LNDClient) {}

  /**
   * GET /v1/getinfo - Get node information
   */
  async getInfo(): Promise<any> {
    const response = await this.client.get('/v1/getinfo');
    
    if (!response.success) {
      throw new Error(`Failed to get node info: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/getnetworkinfo - Get network information
   */
  async getNetworkInfo(): Promise<any> {
    const response = await this.client.get('/v1/getnetworkinfo');
    
    if (!response.success) {
      throw new Error(`Failed to get network info: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/listpermissions - Get macaroon permissions
   */
  async listPermissions(): Promise<any> {
    const response = await this.client.get('/v1/listpermissions');
    
    if (!response.success) {
      throw new Error(`Failed to list permissions: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/feereport - Get fee report
   */
  async getFeeReport(): Promise<any> {
    const response = await this.client.get('/v1/feereport');
    
    if (!response.success) {
      throw new Error(`Failed to get fee report: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/chanbackup/export - Export channel backup
   */
  async exportChannelBackup(): Promise<any> {
    const response = await this.client.get('/v1/chanbackup/export');
    
    if (!response.success) {
      throw new Error(`Failed to export channel backup: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/channels/transactions - Get channel transactions
   */
  async getChannelTransactions(): Promise<any> {
    const response = await this.client.get('/v1/channels/transactions');
    
    if (!response.success) {
      throw new Error(`Failed to get channel transactions: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/peers - Get peer information
   */
  async getPeers(): Promise<any> {
    const response = await this.client.get('/v1/peers');
    
    if (!response.success) {
      throw new Error(`Failed to get peers: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/channels - Get channel information
   */
  async getChannels(): Promise<any> {
    const response = await this.client.get('/v1/channels');
    
    if (!response.success) {
      throw new Error(`Failed to get channels: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/balance/channels - Get channel balance
   */
  async getChannelBalance(): Promise<any> {
    const response = await this.client.get('/v1/balance/channels');
    
    if (!response.success) {
      throw new Error(`Failed to get channel balance: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/balance/blockchain - Get on-chain balance
   */
  async getBlockchainBalance(): Promise<any> {
    const response = await this.client.get('/v1/balance/blockchain');
    
    if (!response.success) {
      throw new Error(`Failed to get blockchain balance: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/version - Get LND version
   */
  async getVersion(): Promise<any> {
    const response = await this.client.get('/v1/version');
    
    if (!response.success) {
      throw new Error(`Failed to get version: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * Get comprehensive node status
   */
  async getNodeStatus(): Promise<{
    info: any;
    networkInfo: any;
    channelBalance: any;
    blockchainBalance: any;
    peers: any;
    channels: any;
    version: any;
  }> {
    try {
      const [
        info,
        networkInfo,
        channelBalance,
        blockchainBalance,
        peers,
        channels,
        version
      ] = await Promise.all([
        this.getInfo(),
        this.getNetworkInfo(),
        this.getChannelBalance(),
        this.getBlockchainBalance(),
        this.getPeers(),
        this.getChannels(),
        this.getVersion()
      ]);

      return {
        info,
        networkInfo,
        channelBalance,
        blockchainBalance,
        peers,
        channels,
        version
      };
    } catch (error) {
      throw new Error(`Failed to get node status: ${error}`);
    }
  }

  /**
   * Check if node is synced
   */
  async isNodeSynced(): Promise<boolean> {
    try {
      const info = await this.getInfo();
      return info.synced_to_chain === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get node connectivity status
   */
  async getConnectivityStatus(): Promise<{
    isConnected: boolean;
    isSynced: boolean;
    blockHeight: number;
    peerCount: number;
    channelCount: number;
  }> {
    try {
      const [info, peers, channels] = await Promise.all([
        this.getInfo(),
        this.getPeers(),
        this.getChannels()
      ]);

      return {
        isConnected: true,
        isSynced: info.synced_to_chain === true,
        blockHeight: info.block_height || 0,
        peerCount: peers.peers?.length || 0,
        channelCount: channels.channels?.length || 0
      };
    } catch (error) {
      return {
        isConnected: false,
        isSynced: false,
        blockHeight: 0,
        peerCount: 0,
        channelCount: 0
      };
    }
  }
}
