/**
 * LN Markets User API Types
 * 
 * Interfaces TypeScript para respostas da API de usuário
 */

export interface LNMarketsUser {
  uid: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  synthetic_usd_balance: number;
  linking_public_key: string | null;
  show_leaderboard: boolean;
  account_type: string;
  auto_withdraw_enabled: boolean;
  auto_withdraw_lightning_address: string | null;
  totp_enabled: boolean;
  webauthn_enabled: boolean;
  fee_tier: number;
}

export interface LNMarketsUserUpdate {
  show_leaderboard?: boolean;
  auto_withdraw_enabled?: boolean;
  auto_withdraw_lightning_address?: string;
}

export interface LNMarketsDeposit {
  id: string;
  amount: number;
  tx_id: string | null;
  is_confirmed: boolean;
  ts: number;
  type: 'bitcoin' | 'lightning' | 'internal';
  address?: string;
  invoice?: string;
}

export interface LNMarketsWithdrawal {
  id: string;
  amount: number;
  fee: number;
  tx_id: string | null;
  is_confirmed: boolean;
  ts: number;
  type: 'bitcoin' | 'lightning' | 'internal';
  address?: string;
  invoice?: string;
  successTime?: number;
  paymentHash?: string;
}

export interface LNMarketsDepositRequest {
  format?: 'p2wpkh' | 'p2tr';
}

export interface LNMarketsDepositResponse {
  address: string;
  creation_ts: number;
}

export interface LNMarketsLightningDepositRequest {
  amount: number;
}

export interface LNMarketsLightningDepositResponse {
  depositId: string;
  paymentRequest: string;
  expiry: number;
}

export interface LNMarketsWithdrawalRequest {
  invoice: string;
}

export interface LNMarketsWithdrawalResponse {
  id: string;
  paymentHash: string;
  amount: number;
  fee: number;
  successTime: number;
}
