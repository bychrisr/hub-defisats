/**
 * LND Peer Endpoints
 * 
 * Handles Lightning Network peer operations including listing,
 * connecting, and disconnecting from peers.
 */

import { LNDClient } from '../LNDClient';
import { LNDPeer } from '../types/wallet.types';

export class LNDPeerEndpoints {
  constructor(private client: LNDClient) {}

  /**
   * List all peers
   */
  async listPeers(): Promise<LNDPeer[]> {
    try {
      const response = await this.client.get('/v1/peers');
      return response.peers || [];
    } catch (error) {
      console.error('❌ Failed to list peers:', error);
      throw error;
    }
  }

  /**
   * Connect to a peer
   */
  async connectPeer(params: {
    addr?: {
      pubkey: string;
      host: string;
    };
    perm?: boolean;
    timeout?: number;
  }): Promise<{
    peer_id: number;
  }> {
    try {
      const response = await this.client.post('/v1/peers', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to connect to peer:', error);
      throw error;
    }
  }

  /**
   * Disconnect from a peer
   */
  async disconnectPeer(params: {
    pub_key: string;
  }): Promise<{
    success: boolean;
  }> {
    try {
      const response = await this.client.delete(`/v1/peers/${params.pub_key}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to disconnect from peer:', error);
      throw error;
    }
  }

  /**
   * Get peer info
   */
  async getPeerInfo(params: {
    pub_key: string;
  }): Promise<LNDPeer> {
    try {
      const response = await this.client.get(`/v1/peers/${params.pub_key}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get peer info:', error);
      throw error;
    }
  }

  /**
   * Update peer alias
   */
  async updatePeerAlias(params: {
    pub_key: string;
    alias: string;
  }): Promise<{
    success: boolean;
  }> {
    try {
      const response = await this.client.post(`/v1/peers/${params.pub_key}/alias`, {
        alias: params.alias
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to update peer alias:', error);
      throw error;
    }
  }

  /**
   * Get peer statistics
   */
  async getPeerStats(): Promise<{
    num_peers: number;
    num_channels: number;
    total_capacity: string;
    avg_channel_size: number;
    min_channel_size: string;
    max_channel_size: string;
    median_channel_size_sat: string;
    num_zombie_chans: string;
  }> {
    try {
      const response = await this.client.get('/v1/graph/stats');
      return response;
    } catch (error) {
      console.error('❌ Failed to get peer stats:', error);
      throw error;
    }
  }

  /**
   * Get peer addresses
   */
  async getPeerAddresses(params: {
    pub_key: string;
  }): Promise<{
    addresses: Array<{
      network: string;
      addr: string;
    }>;
  }> {
    try {
      const response = await this.client.get(`/v1/graph/node/${params.pub_key}/addresses`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get peer addresses:', error);
      throw error;
    }
  }

  /**
   * Ping a peer
   */
  async pingPeer(params: {
    pub_key: string;
  }): Promise<{
    success: boolean;
    latency: number;
  }> {
    try {
      const response = await this.client.post(`/v1/peers/${params.pub_key}/ping`);
      return response;
    } catch (error) {
      console.error('❌ Failed to ping peer:', error);
      throw error;
    }
  }

  /**
   * Get peer features
   */
  async getPeerFeatures(params: {
    pub_key: string;
  }): Promise<{
    features: { [key: number]: any };
  }> {
    try {
      const response = await this.client.get(`/v1/graph/node/${params.pub_key}/features`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get peer features:', error);
      throw error;
    }
  }

  /**
   * Get peer channels
   */
  async getPeerChannels(params: {
    pub_key: string;
  }): Promise<{
    channels: Array<{
      channel_id: string;
      chan_point: string;
      last_update: number;
      node1_pub: string;
      node2_pub: string;
      capacity: string;
      node1_policy: any;
      node2_policy: any;
    }>;
  }> {
    try {
      const response = await this.client.get(`/v1/graph/node/${params.pub_key}/channels`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get peer channels:', error);
      throw error;
    }
  }

  /**
   * Ban a peer
   */
  async banPeer(params: {
    pub_key: string;
    reason?: string;
  }): Promise<{
    success: boolean;
  }> {
    try {
      const response = await this.client.post(`/v1/peers/${params.pub_key}/ban`, {
        reason: params.reason || 'Banned by user'
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to ban peer:', error);
      throw error;
    }
  }

  /**
   * Unban a peer
   */
  async unbanPeer(params: {
    pub_key: string;
  }): Promise<{
    success: boolean;
  }> {
    try {
      const response = await this.client.delete(`/v1/peers/${params.pub_key}/ban`);
      return response;
    } catch (error) {
      console.error('❌ Failed to unban peer:', error);
      throw error;
    }
  }

  /**
   * Get banned peers
   */
  async getBannedPeers(): Promise<{
    banned_peers: Array<{
      pub_key: string;
      banned_at: number;
      reason: string;
    }>;
  }> {
    try {
      const response = await this.client.get('/v1/peers/banned');
      return response;
    } catch (error) {
      console.error('❌ Failed to get banned peers:', error);
      throw error;
    }
  }
}
