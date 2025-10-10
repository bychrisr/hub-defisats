/**
 * LND Base Types
 * 
 * Core interfaces and types for LND (Lightning Network Daemon) integration.
 * This file contains the base types used across all LND services.
 */

// ============================================================================
// BASE CONFIGURATION TYPES
// ============================================================================

export interface LNDCredentials {
  macaroon: string;
  tlsCert?: string;
}

export interface LNDConfig {
  network: 'testnet' | 'mainnet';
  baseURL: string;
  credentials: LNDCredentials;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface LNDRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  params?: Record<string, any>;
  timeout?: number;
}

export interface LNDResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface LNDError {
  code: string;
  message: string;
  details?: any;
}

export class LNDServiceError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'LNDServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================================
// NETWORK TYPES
// ============================================================================

export type LNDNetwork = 'testnet' | 'mainnet';

export interface LNDNetworkInfo {
  network: LNDNetwork;
  baseURL: string;
  chain: string;
  isTestnet: boolean;
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface LNDMacaroon {
  path: string;
  content: string;
  permissions: string[];
}

export interface LNDTLSCert {
  path: string;
  content: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface LNDPaginationParams {
  index_offset?: number;
  max_payments?: number;
  reversed?: boolean;
}

export interface LNDPaginationResponse {
  first_index_offset?: number;
  last_index_offset?: number;
  total_num_payments?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface LNDTimestamp {
  seconds: number;
  nanos: number;
}

export interface LNDAmount {
  sat: number;
  msat: number;
}

export interface LNDFeeRate {
  base_fee: number;
  fee_rate: number;
  time_lock_delta: number;
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

export interface LNDHealthStatus {
  isHealthy: boolean;
  network: LNDNetwork;
  lastChecked: Date;
  error?: string;
}

export interface LNDConnectionStatus {
  isConnected: boolean;
  endpoint: string;
  latency?: number;
  lastChecked: Date;
}

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface LNDServiceInterface {
  getNetwork(): LNDNetwork;
  isHealthy(): Promise<boolean>;
  getInfo(): Promise<any>;
  switchNetwork(network: LNDNetwork): void;
}
