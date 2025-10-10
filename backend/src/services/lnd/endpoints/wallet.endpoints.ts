/**
 * LND Wallet Endpoints
 * 
 * Endpoints for LND wallet operations including balance queries, UTXOs,
 * fee estimation, and PSBT operations.
 */

import { LNDClient } from '../LNDClient';
import {
  LNDWalletBalance,
  LNDChannelBalance,
  LNDUTXOResponse,
  LNDFeeEstimation,
  LNDFeeEstimationRequest,
  LNDFundPSBTRequest,
  LNDFundPSBTResponse,
  LNDFinalizePSBTRequest,
  LNDFinalizePSBTResponse,
  LNDLabelTransactionRequest,
  LNDLabelTransactionResponse,
  LNDWalletStats
} from '../types/wallet.types';

export class LNDWalletEndpoints {
  constructor(private client: LNDClient) {}

  /**
   * GET /v1/balance/blockchain - Get on-chain balance
   */
  async getBalance(): Promise<LNDWalletBalance> {
    const response = await this.client.get('/v1/balance/blockchain');
    
    if (!response.success) {
      throw new Error(`Failed to get wallet balance: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/balance/channels - Get channel balance
   */
  async getChannelBalance(): Promise<LNDChannelBalance> {
    const response = await this.client.get('/v1/balance/channels');
    
    if (!response.success) {
      throw new Error(`Failed to get channel balance: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/utxos - List unspent transaction outputs
   */
  async listUnspent(): Promise<LNDUTXOResponse> {
    const response = await this.client.get('/v1/utxos');
    
    if (!response.success) {
      throw new Error(`Failed to list unspent outputs: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/estimatefee - Estimate fee for on-chain transaction
   */
  async estimateFee(request: LNDFeeEstimationRequest): Promise<LNDFeeEstimation> {
    const response = await this.client.post('/v1/estimatefee', request);
    
    if (!response.success) {
      throw new Error(`Failed to estimate fee: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/wallet/fundpsbt - Fund a PSBT
   */
  async fundPsbt(request: LNDFundPSBTRequest): Promise<LNDFundPSBTResponse> {
    const response = await this.client.post('/v1/wallet/fundpsbt', request);
    
    if (!response.success) {
      throw new Error(`Failed to fund PSBT: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/wallet/finalizepsbt - Finalize a PSBT
   */
  async finalizePsbt(request: LNDFinalizePSBTRequest): Promise<LNDFinalizePSBTResponse> {
    const response = await this.client.post('/v1/wallet/finalizepsbt', request);
    
    if (!response.success) {
      throw new Error(`Failed to finalize PSBT: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/wallet/labeltransaction - Add label to transaction
   */
  async labelTransaction(request: LNDLabelTransactionRequest): Promise<LNDLabelTransactionResponse> {
    const response = await this.client.post('/v1/wallet/labeltransaction', request);
    
    if (!response.success) {
      throw new Error(`Failed to label transaction: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/transactions - List on-chain transactions
   */
  async listTransactions(params?: {
    start_height?: number;
    end_height?: number;
    account?: string;
  }): Promise<any> {
    const response = await this.client.get('/v1/transactions', params);
    
    if (!response.success) {
      throw new Error(`Failed to list transactions: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/transaction/:txid - Get specific transaction
   */
  async getTransaction(txid: string): Promise<any> {
    const response = await this.client.get(`/v1/transaction/${txid}`);
    
    if (!response.success) {
      throw new Error(`Failed to get transaction: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/wallet/sendcoins - Send coins on-chain
   */
  async sendCoins(request: {
    addr: string;
    amount: string;
    target_conf?: number;
    sat_per_vbyte?: number;
    send_all?: boolean;
    label?: string;
    min_confs?: number;
    spend_unconfirmed?: boolean;
  }): Promise<{ txid: string }> {
    const response = await this.client.post('/v1/wallet/sendcoins', request);
    
    if (!response.success) {
      throw new Error(`Failed to send coins: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/wallet/sendmany - Send coins to multiple addresses
   */
  async sendMany(request: {
    AddrToAmount: Record<string, string>;
    target_conf?: number;
    sat_per_vbyte?: number;
    label?: string;
    min_confs?: number;
    spend_unconfirmed?: boolean;
  }): Promise<{ txid: string }> {
    const response = await this.client.post('/v1/wallet/sendmany', request);
    
    if (!response.success) {
      throw new Error(`Failed to send many: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/wallet/addresses - List wallet addresses
   */
  async listAddresses(): Promise<any> {
    const response = await this.client.get('/v1/wallet/addresses');
    
    if (!response.success) {
      throw new Error(`Failed to list addresses: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/wallet/addresses - Generate new address
   */
  async newAddress(request: {
    type?: 'WITNESS_PUBKEY_HASH' | 'NESTED_WITNESS_PUBKEY_HASH' | 'PUBKEY_HASH' | 'TAPROOT_PUBKEY';
    account?: string;
  }): Promise<{ address: string }> {
    const response = await this.client.post('/v1/wallet/addresses', request);
    
    if (!response.success) {
      throw new Error(`Failed to generate new address: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * Get comprehensive wallet statistics
   */
  async getWalletStats(): Promise<LNDWalletStats> {
    try {
      const [walletBalance, channelBalance, utxos, channels] = await Promise.all([
        this.getBalance(),
        this.getChannelBalance(),
        this.listUnspent(),
        this.client.get('/v1/channels').then(r => r.data?.channels || [])
      ]);

      const totalBalance = parseInt(walletBalance.total_balance || '0');
      const confirmedBalance = parseInt(walletBalance.confirmed_balance || '0');
      const unconfirmedBalance = parseInt(walletBalance.unconfirmed_balance || '0');
      const lockedBalance = parseInt(walletBalance.locked_balance || '0');

      return {
        total_balance: totalBalance,
        confirmed_balance: confirmedBalance,
        unconfirmed_balance: unconfirmedBalance,
        locked_balance: lockedBalance,
        utxo_count: utxos.utxos?.length || 0,
        channel_count: channels.length,
        last_updated: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get wallet stats: ${error}`);
    }
  }

  /**
   * Get total balance (on-chain + channels)
   */
  async getTotalBalance(): Promise<{
    total_sat: number;
    total_msat: number;
    onchain_sat: number;
    channel_sat: number;
    pending_open_sat: number;
  }> {
    try {
      const [walletBalance, channelBalance] = await Promise.all([
        this.getBalance(),
        this.getChannelBalance()
      ]);

      const onchainSat = parseInt(walletBalance.total_balance || '0');
      const channelSat = parseInt(channelBalance.balance || '0');
      const pendingOpenSat = parseInt(channelBalance.pending_open_balance || '0');
      const totalSat = onchainSat + channelSat;

      return {
        total_sat: totalSat,
        total_msat: totalSat * 1000,
        onchain_sat: onchainSat,
        channel_sat: channelSat,
        pending_open_sat: pendingOpenSat
      };
    } catch (error) {
      throw new Error(`Failed to get total balance: ${error}`);
    }
  }
}
