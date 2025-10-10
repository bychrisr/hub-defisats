/**
 * LND On-Chain Endpoints
 * 
 * Handles Bitcoin on-chain operations including address generation,
 * transaction sending, and UTXO management.
 */

import { LNDClient } from '../LNDClient';
import { 
  LNDAddress, 
  LNDTransaction, 
  LNDUTXO,
  LNDFeeEstimate,
  LNDChannelPoint
} from '../types/wallet.types';

export class LNDOnchainEndpoints {
  constructor(private client: LNDClient) {}

  /**
   * Generate a new Bitcoin address
   */
  async generateAddress(params?: {
    type?: 'WITNESS_PUBKEY_HASH' | 'NESTED_PUBKEY_HASH' | 'UNUSED_WITNESS_PUBKEY_HASH' | 'UNUSED_NESTED_PUBKEY_HASH';
    account?: string;
  }): Promise<LNDAddress> {
    try {
      const response = await this.client.post('/v2/wallet/address/next', params || {});
      return response;
    } catch (error) {
      console.error('❌ Failed to generate address:', error);
      throw error;
    }
  }

  /**
   * List all addresses
   */
  async listAddresses(): Promise<{
    addresses: LNDAddress[];
  }> {
    try {
      const response = await this.client.get('/v2/wallet/addresses');
      return response;
    } catch (error) {
      console.error('❌ Failed to list addresses:', error);
      throw error;
    }
  }

  /**
   * Send coins to an address
   */
  async sendCoins(params: {
    addr: string;
    amount: number;
    target_conf?: number;
    sat_per_vbyte?: number;
    send_all?: boolean;
    label?: string;
    min_confs?: number;
    spend_unconfirmed?: boolean;
  }): Promise<{
    txid: string;
  }> {
    try {
      const response = await this.client.post('/v2/wallet/send', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to send coins:', error);
      throw error;
    }
  }

  /**
   * Send many coins to multiple addresses
   */
  async sendMany(params: {
    addr_to_amount: { [key: string]: number };
    target_conf?: number;
    sat_per_vbyte?: number;
    label?: string;
    min_confs?: number;
    spend_unconfirmed?: boolean;
  }): Promise<{
    txid: string;
  }> {
    try {
      const response = await this.client.post('/v2/wallet/send/many', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to send many coins:', error);
      throw error;
    }
  }

  /**
   * List all transactions
   */
  async listTransactions(params?: {
    start_height?: number;
    end_height?: number;
    account?: string;
  }): Promise<{
    transactions: LNDTransaction[];
  }> {
    try {
      const response = await this.client.get('/v2/wallet/transactions', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to list transactions:', error);
      throw error;
    }
  }

  /**
   * Get a specific transaction
   */
  async getTransaction(params: {
    txid: string;
  }): Promise<LNDTransaction> {
    try {
      const response = await this.client.get(`/v2/wallet/transactions/${params.txid}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get transaction:', error);
      throw error;
    }
  }

  /**
   * List all UTXOs
   */
  async listUTXOs(params?: {
    min_confs?: number;
    max_confs?: number;
    account?: string;
    unconfirmed_only?: boolean;
  }): Promise<{
    utxos: LNDUTXO[];
  }> {
    try {
      const response = await this.client.get('/v2/wallet/utxos', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to list UTXOs:', error);
      throw error;
    }
  }

  /**
   * Estimate fee for a transaction
   */
  async estimateFee(params: {
    addr_to_amount: { [key: string]: number };
    target_conf?: number;
    min_confs?: number;
    spend_unconfirmed?: boolean;
    account?: string;
  }): Promise<LNDFeeEstimate> {
    try {
      const response = await this.client.post('/v2/wallet/estimatefee', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to estimate fee:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<{
    total_balance: string;
    confirmed_balance: string;
    unconfirmed_balance: string;
    locked_balance: string;
    reserved_balance_anchor_chan: string;
    account_balance: { [key: string]: {
      confirmed_balance: string;
      unconfirmed_balance: string;
    }};
  }> {
    try {
      const response = await this.client.get('/v2/wallet/balance');
      return response;
    } catch (error) {
      console.error('❌ Failed to get wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo(): Promise<{
    graph_diameter: number;
    avg_out_degree: number;
    max_out_degree: number;
    num_nodes: number;
    num_channels: number;
    total_network_capacity: string;
    avg_channel_size: number;
    min_channel_size: string;
    max_channel_size: string;
    median_channel_size_sat: string;
    num_zombie_chans: string;
  }> {
    try {
      const response = await this.client.get('/v1/graph/info');
      return response;
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      throw error;
    }
  }

  /**
   * Get blockchain info
   */
  async getBlockchainInfo(): Promise<{
    chain: string;
    network: string;
    best_block_hash: string;
    best_block_height: number;
    synced_to_chain: boolean;
    synced_to_graph: boolean;
    testnet: boolean;
    blocks_behind: number;
  }> {
    try {
      const response = await this.client.get('/v1/getinfo');
      return response;
    } catch (error) {
      console.error('❌ Failed to get blockchain info:', error);
      throw error;
    }
  }

  /**
   * Get blockchain balance
   */
  async getBlockchainBalance(): Promise<{
    total_balance: string;
    confirmed_balance: string;
    unconfirmed_balance: string;
  }> {
    try {
      const response = await this.client.get('/v1/balance/blockchain');
      return response;
    } catch (error) {
      console.error('❌ Failed to get blockchain balance:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(params?: {
    start_height?: number;
    end_height?: number;
    account?: string;
  }): Promise<{
    transactions: LNDTransaction[];
    total_count: number;
  }> {
    try {
      const response = await this.client.get('/v2/wallet/transactions/history', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to get transaction history:', error);
      throw error;
    }
  }

  /**
   * Get address balance
   */
  async getAddressBalance(params: {
    address: string;
  }): Promise<{
    balance: string;
  }> {
    try {
      const response = await this.client.get(`/v2/wallet/address/${params.address}/balance`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get address balance:', error);
      throw error;
    }
  }

  /**
   * Get address transactions
   */
  async getAddressTransactions(params: {
    address: string;
  }): Promise<{
    transactions: LNDTransaction[];
  }> {
    try {
      const response = await this.client.get(`/v2/wallet/address/${params.address}/transactions`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get address transactions:', error);
      throw error;
    }
  }

  /**
   * Get address UTXOs
   */
  async getAddressUTXOs(params: {
    address: string;
  }): Promise<{
    utxos: LNDUTXO[];
  }> {
    try {
      const response = await this.client.get(`/v2/wallet/address/${params.address}/utxos`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get address UTXOs:', error);
      throw error;
    }
  }

  /**
   * Get fee rate
   */
  async getFeeRate(params: {
    target_conf?: number;
  }): Promise<{
    fee_rate: number;
    fee_rate_unit: string;
  }> {
    try {
      const response = await this.client.get('/v2/wallet/feerate', params);
      return response;
    } catch (error) {
      console.error('❌ Failed to get fee rate:', error);
      throw error;
    }
  }

  /**
   * Get wallet info
   */
  async getWalletInfo(): Promise<{
    wallet_version: string;
    format: string;
    encrypted: boolean;
    unlocked: boolean;
    synced_to_chain: boolean;
    synced_to_graph: boolean;
    best_block_hash: string;
    best_block_height: number;
    testnet: boolean;
    alias: string;
    color: string;
    num_pending_channels: number;
    num_active_channels: number;
    num_inactive_channels: number;
    num_peers: number;
    block_height: number;
    block_hash: string;
    synced_to_chain: boolean;
    synced_to_graph: boolean;
    testnet: boolean;
    chains: Array<{
      chain: string;
      network: string;
    }>;
    uris: string[];
    features: { [key: number]: any };
  }> {
    try {
      const response = await this.client.get('/v1/getinfo');
      return response;
    } catch (error) {
      console.error('❌ Failed to get wallet info:', error);
      throw error;
    }
  }
}
