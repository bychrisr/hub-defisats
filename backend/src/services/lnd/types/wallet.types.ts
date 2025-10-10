/**
 * LND Wallet Types
 * 
 * TypeScript interfaces for LND wallet operations including balances,
 * UTXOs, fee estimation, and PSBT operations.
 */

import { LNDAmount, LNDTimestamp } from './lnd.types';

// ============================================================================
// BALANCE TYPES
// ============================================================================

export interface LNDWalletBalance {
  total_balance: string;
  confirmed_balance: string;
  unconfirmed_balance: string;
  locked_balance?: string;
  reserved_balance_anchor_chan?: string;
}

export interface LNDChannelBalance {
  balance: string;
  pending_open_balance: string;
  local_balance?: LNDAmount;
  remote_balance?: LNDAmount;
  unsettled_local_balance?: LNDAmount;
  unsettled_remote_balance?: LNDAmount;
  pending_open_local_balance?: LNDAmount;
  pending_open_remote_balance?: LNDAmount;
}

export interface LNDTotalBalance {
  total_balance: string;
  confirmed_balance: string;
  unconfirmed_balance: string;
  locked_balance: string;
  reserved_balance_anchor_chan: string;
  channel_balance: LNDChannelBalance;
}

// ============================================================================
// UTXO TYPES
// ============================================================================

export interface LNDUTXO {
  address_type: 'UNKNOWN' | 'WITNESS_PUBKEY_HASH' | 'NESTED_WITNESS_PUBKEY_HASH' | 'PUBKEY_HASH' | 'MULTISIG' | 'TAPROOT_PUBKEY';
  address: string;
  amount_sat: number;
  pk_script: string;
  outpoint: LNDOutPoint;
  confirmations: number;
  raw_tx_hex?: string;
}

export interface LNDOutPoint {
  txid_bytes: string;
  txid_str: string;
  output_index: number;
}

export interface LNDUTXOResponse {
  utxos: LNDUTXO[];
  total_amount: string;
}

// ============================================================================
// FEE ESTIMATION TYPES
// ============================================================================

export interface LNDFeeEstimation {
  sat_per_kw: number;
  sat_per_byte?: number;
  target_conf: number;
}

export interface LNDFeeEstimationRequest {
  target_conf?: number;
  sat_per_vbyte?: number;
  spend_unconfirmed?: boolean;
}

// ============================================================================
// PSBT TYPES
// ============================================================================

export interface LNDFundPSBTRequest {
  psbt: string;
  fee_rate?: number;
  min_confs?: number;
  spend_unconfirmed?: boolean;
  change_address?: string;
}

export interface LNDFundPSBTResponse {
  funded_psbt: string;
  change_index: number;
  locked_utxos: LNDUTXO[];
}

export interface LNDFinalizePSBTRequest {
  signed_psbt: string;
}

export interface LNDFinalizePSBTResponse {
  raw_final_tx: string;
}

// ============================================================================
// TRANSACTION LABELING TYPES
// ============================================================================

export interface LNDLabelTransactionRequest {
  txid: string;
  label: string;
  overwrite?: boolean;
}

export interface LNDLabelTransactionResponse {
  success: boolean;
}

// ============================================================================
// WALLET OPERATIONS TYPES
// ============================================================================

export interface LNDWalletOperationResult {
  success: boolean;
  txid?: string;
  error?: string;
  details?: any;
}

export interface LNDWalletStats {
  total_balance: number;
  confirmed_balance: number;
  unconfirmed_balance: number;
  locked_balance: number;
  utxo_count: number;
  channel_count: number;
  last_updated: Date;
}
