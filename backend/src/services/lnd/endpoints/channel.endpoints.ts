/**
 * LND Channel Endpoints
 * 
 * Handles Lightning Network channel operations including listing,
 * opening, closing, and updating channel policies.
 */

import { LNDClient } from '../LNDClient';
import { 
  LNDChannel, 
  LNDChannelBalance, 
  LNDChannelCloseSummary, 
  LNDChannelPoint,
  LNDPendingChannel,
  LNDChannelPolicy,
  LNDChannelBackup,
  LNDChannelRestoreRequest
} from '../types/wallet.types';

export class LNDChannelEndpoints {
  constructor(private client: LNDClient) {}

  /**
   * List all open channels
   */
  async listChannels(): Promise<LNDChannel[]> {
    try {
      const response = await this.client.get('/v1/channels');
      return response.channels || [];
    } catch (error) {
      console.error('❌ Failed to list channels:', error);
      throw error;
    }
  }

  /**
   * List pending channels
   */
  async listPendingChannels(): Promise<{
    pending_open_channels: LNDPendingChannel[];
    pending_closing_channels: LNDChannelCloseSummary[];
    pending_force_closing_channels: LNDChannelCloseSummary[];
    waiting_close_channels: LNDChannelCloseSummary[];
  }> {
    try {
      const response = await this.client.get('/v1/channels/pending');
      return {
        pending_open_channels: response.pending_open_channels || [],
        pending_closing_channels: response.pending_closing_channels || [],
        pending_force_closing_channels: response.pending_force_closing_channels || [],
        waiting_close_channels: response.waiting_close_channels || []
      };
    } catch (error) {
      console.error('❌ Failed to list pending channels:', error);
      throw error;
    }
  }

  /**
   * List closed channels
   */
  async listClosedChannels(): Promise<LNDChannelCloseSummary[]> {
    try {
      const response = await this.client.get('/v1/channels/closed');
      return response.channels || [];
    } catch (error) {
      console.error('❌ Failed to list closed channels:', error);
      throw error;
    }
  }

  /**
   * Open a new channel
   */
  async openChannel(params: {
    node_pubkey: string;
    local_funding_amount: number;
    push_sat?: number;
    target_conf?: number;
    sat_per_vbyte?: number;
    private?: boolean;
    min_htlc_msat?: number;
    remote_csv_delay?: number;
    min_confs?: number;
    spend_unconfirmed?: boolean;
    close_address?: string;
    funding_shim?: any;
    remote_max_value_in_flight_msat?: number;
    remote_max_htlcs?: number;
    max_local_csv?: number;
    commitment_type?: string;
    zero_conf?: boolean;
    scid_alias?: boolean;
    base_fee?: number;
    fee_rate?: number;
    use_base_fee?: boolean;
    use_fee_rate?: boolean;
  }): Promise<{
    funding_txid_bytes: string;
    output_index: number;
  }> {
    try {
      const response = await this.client.post('/v1/channels', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to open channel:', error);
      throw error;
    }
  }

  /**
   * Close a channel
   */
  async closeChannel(params: {
    channel_point?: LNDChannelPoint;
    force?: boolean;
    target_conf?: number;
    sat_per_vbyte?: number;
    delivery_address?: string;
    sat_per_byte?: number;
  }): Promise<{
    close_pending: boolean;
    closing_txid: string;
    success: boolean;
  }> {
    try {
      const response = await this.client.post('/v1/channels/close', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to close channel:', error);
      throw error;
    }
  }

  /**
   * Update channel policy
   */
  async updateChannelPolicy(params: {
    base_fee_msat?: number;
    fee_rate?: number;
    time_lock_delta?: number;
    max_htlc_msat?: number;
    min_htlc_msat?: number;
    min_htlc_msat_specified?: boolean;
  }): Promise<{
    failed_updates: any[];
  }> {
    try {
      const response = await this.client.post('/v1/chanpolicy', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to update channel policy:', error);
      throw error;
    }
  }

  /**
   * Export channel backup
   */
  async exportChannelBackup(params: {
    chan_point?: LNDChannelPoint;
  }): Promise<LNDChannelBackup> {
    try {
      const response = await this.client.get('/v1/channels/backup', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to export channel backup:', error);
      throw error;
    }
  }

  /**
   * Export all channels backup
   */
  async exportAllChannelsBackup(): Promise<{
    multi_chan_backup: {
      chan_points: LNDChannelPoint[];
      multi_chan_backup: string;
    };
    single_chan_backups: LNDChannelBackup[];
  }> {
    try {
      const response = await this.client.get('/v1/channels/backup/export');
      return response;
    } catch (error) {
      console.error('❌ Failed to export all channels backup:', error);
      throw error;
    }
  }

  /**
   * Restore channel backup
   */
  async restoreChannelBackup(params: LNDChannelRestoreRequest): Promise<{
    success: boolean;
  }> {
    try {
      const response = await this.client.post('/v1/channels/backup/restore', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to restore channel backup:', error);
      throw error;
    }
  }

  /**
   * Verify channel backup
   */
  async verifyChannelBackup(params: {
    single_chan_backups?: LNDChannelBackup[];
    multi_chan_backup?: {
      chan_points: LNDChannelPoint[];
      multi_chan_backup: string;
    };
  }): Promise<{
    valid: boolean;
    error: string;
  }> {
    try {
      const response = await this.client.post('/v1/channels/backup/verify', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to verify channel backup:', error);
      throw error;
    }
  }

  /**
   * Get channel info
   */
  async getChannelInfo(params: {
    channel_id?: string;
    chan_point?: LNDChannelPoint;
  }): Promise<LNDChannel> {
    try {
      const response = await this.client.get('/v1/channels/info', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to get channel info:', error);
      throw error;
    }
  }

  /**
   * Get channel balance
   */
  async getChannelBalance(): Promise<LNDChannelBalance> {
    try {
      const response = await this.client.get('/v1/balance/channels');
      return response;
    } catch (error) {
      console.error('❌ Failed to get channel balance:', error);
      throw error;
    }
  }

  /**
   * Get channel fee report
   */
  async getChannelFeeReport(): Promise<{
    channel_fees: Array<{
      chan_id: string;
      channel_point: string;
      base_fee_msat: string;
      fee_per_mil: string;
      fee_rate: number;
    }>;
    day_fee_sum: string;
    week_fee_sum: string;
    month_fee_sum: string;
  }> {
    try {
      const response = await this.client.get('/v1/fees');
      return response;
    } catch (error) {
      console.error('❌ Failed to get channel fee report:', error);
      throw error;
    }
  }

  /**
   * Update channel fee
   */
  async updateChannelFee(params: {
    chan_point: LNDChannelPoint;
    base_fee_msat: number;
    fee_rate: number;
    time_lock_delta?: number;
    max_htlc_msat?: number;
  }): Promise<{
    failed_updates: any[];
  }> {
    try {
      const response = await this.client.post('/v1/chanpolicy', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to update channel fee:', error);
      throw error;
    }
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(): Promise<{
    num_channels: number;
    num_nodes: number;
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
      console.error('❌ Failed to get channel stats:', error);
      throw error;
    }
  }

  /**
   * Get channel graph
   */
  async getChannelGraph(): Promise<{
    nodes: Array<{
      last_update: number;
      pub_key: string;
      alias: string;
      addresses: Array<{
        network: string;
        addr: string;
      }>;
      color: string;
      features: { [key: number]: any };
    }>;
    edges: Array<{
      channel_id: string;
      chan_point: string;
      last_update: number;
      node1_pub: string;
      node2_pub: string;
      capacity: string;
      node1_policy: LNDChannelPolicy;
      node2_policy: LNDChannelPolicy;
    }>;
  }> {
    try {
      const response = await this.client.get('/v1/graph');
      return response;
    } catch (error) {
      console.error('❌ Failed to get channel graph:', error);
      throw error;
    }
  }

  /**
   * Get node info
   */
  async getNodeInfo(params: {
    pub_key: string;
    include_channels?: boolean;
  }): Promise<{
    node: {
      last_update: number;
      pub_key: string;
      alias: string;
      addresses: Array<{
        network: string;
        addr: string;
      }>;
      color: string;
      features: { [key: number]: any };
    };
    num_channels: number;
    total_capacity: string;
    channels: LNDChannel[];
  }> {
    try {
      const response = await this.client.get('/v1/graph/node', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to get node info:', error);
      throw error;
    }
  }
}
