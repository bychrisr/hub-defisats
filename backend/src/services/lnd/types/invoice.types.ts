/**
 * LND Invoice Types
 * 
 * TypeScript interfaces for LND invoice operations including creation,
 * payment, settlement, and subscription management.
 */

import { LNDAmount, LNDTimestamp } from './lnd.types';

// ============================================================================
// INVOICE TYPES
// ============================================================================

export interface LNDInvoice {
  memo?: string;
  r_preimage: string;
  r_hash: string;
  value: string;
  value_msat: string;
  settled: boolean;
  creation_date: string;
  settle_date?: string;
  payment_request: string;
  description_hash?: string;
  expiry?: string;
  fallback_addr?: string;
  cltv_expiry?: string;
  route_hints?: LNDRouteHint[];
  private?: boolean;
  add_index?: string;
  settle_index?: string;
  amt_paid?: string;
  amt_paid_sat?: string;
  amt_paid_msat?: string;
  state?: 'OPEN' | 'SETTLED' | 'CANCELED' | 'ACCEPTED';
  htlcs?: LNDHTLC[];
  features?: Record<string, LNDFeature>;
  is_keysend?: boolean;
  payment_addr?: string;
  is_amp?: boolean;
  amp_invoice_state?: Record<string, LNDAMPInvoiceState>;
}

export interface LNDRouteHint {
  hop_hints: LNDHopHint[];
}

export interface LNDHopHint {
  node_id: string;
  chan_id: string;
  fee_base_msat: number;
  fee_proportional_millionths: number;
  cltv_expiry_delta: number;
}

export interface LNDFeature {
  name: string;
  is_required: boolean;
  is_known: boolean;
}

export interface LNDAMPInvoiceState {
  state: 'STATE_OPEN' | 'STATE_SETTLED' | 'STATE_CANCELED';
  settle_index?: string;
  settle_time?: string;
  amt_paid_msat?: string;
  circular_payment?: string;
  mpp_total_amt_msat?: string;
}

export interface LNDHTLC {
  chan_id: string;
  htlc_index: string;
  amt_msat: string;
  accept_height: number;
  accept_time: string;
  resolve_time: string;
  expiry_height: number;
  state: 'ACCEPTED' | 'SETTLED' | 'CANCELED';
  custom_records?: Record<string, string>;
  mpp_total_amt_msat?: string;
  amp?: LNDAMP;
}

export interface LNDAMP {
  root_share: string;
  set_id: string;
  child_index: number;
  hash: string;
  preimage: string;
}

// ============================================================================
// INVOICE CREATION TYPES
// ============================================================================

export interface LNDAddInvoiceRequest {
  memo?: string;
  value?: string;
  value_msat?: string;
  description_hash?: string;
  expiry?: string;
  fallback_addr?: string;
  cltv_expiry?: string;
  route_hints?: LNDRouteHint[];
  private?: boolean;
  is_amp?: boolean;
}

export interface LNDAddInvoiceResponse {
  r_hash: string;
  payment_request: string;
  add_index?: string;
  payment_addr?: string;
}

export interface LNDAddHoldInvoiceRequest {
  memo?: string;
  hash: string;
  value?: string;
  value_msat?: string;
  description_hash?: string;
  expiry?: string;
  fallback_addr?: string;
  cltv_expiry?: string;
  route_hints?: LNDRouteHint[];
  private?: boolean;
}

export interface LNDAddHoldInvoiceResponse {
  payment_request: string;
}

// ============================================================================
// INVOICE SETTLEMENT TYPES
// ============================================================================

export interface LNDSettleInvoiceRequest {
  preimage: string;
}

export interface LNDSettleInvoiceResponse {
  success: boolean;
}

export interface LNDCancelInvoiceRequest {
  payment_hash: string;
}

export interface LNDCancelInvoiceResponse {
  success: boolean;
}

// ============================================================================
// INVOICE LOOKUP TYPES
// ============================================================================

export interface LNDLookupInvoiceRequest {
  r_hash_str?: string;
  r_hash?: string;
  payment_addr?: string;
}

export interface LNDListInvoicesRequest {
  pending_only?: boolean;
  index_offset?: string;
  num_max_invoices?: string;
  reversed?: boolean;
}

export interface LNDListInvoicesResponse {
  invoices: LNDInvoice[];
  last_index_offset: string;
  first_index_offset: string;
}

// ============================================================================
// PAYMENT REQUEST TYPES
// ============================================================================

export interface LNDPayReq {
  destination: string;
  payment_hash: string;
  num_satoshis: string;
  timestamp: string;
  expiry: string;
  description: string;
  description_hash?: string;
  fallback_addr?: string;
  cltv_expiry?: string;
  route_hints?: LNDRouteHint[];
  payment_addr?: string;
  num_msat?: string;
  features?: Record<string, LNDFeature>;
}

export interface LNDDecodePayReqRequest {
  pay_req: string;
}

export interface LNDDecodePayReqResponse {
  destination: string;
  payment_hash: string;
  num_satoshis: string;
  timestamp: string;
  expiry: string;
  description: string;
  description_hash?: string;
  fallback_addr?: string;
  cltv_expiry?: string;
  route_hints?: LNDRouteHint[];
  payment_addr?: string;
  num_msat?: string;
  features?: Record<string, LNDFeature>;
}

// ============================================================================
// INVOICE SUBSCRIPTION TYPES
// ============================================================================

export interface LNDInvoiceSubscriptionRequest {
  add_index?: string;
  settle_index?: string;
}

export interface LNDInvoiceSubscriptionResponse {
  invoices: LNDInvoice[];
  last_index_offset: string;
  first_index_offset: string;
}

// ============================================================================
// INVOICE STATISTICS TYPES
// ============================================================================

export interface LNDInvoiceStats {
  total_invoices: number;
  pending_invoices: number;
  settled_invoices: number;
  canceled_invoices: number;
  total_amount_sat: number;
  total_amount_msat: number;
  average_invoice_amount: number;
  last_updated: Date;
}

// ============================================================================
// PAYMENT TYPES (related to invoices)
// ============================================================================

export interface LNDPayment {
  payment_hash: string;
  value: string;
  creation_date: string;
  fee: string;
  payment_preimage: string;
  value_sat: string;
  value_msat: string;
  payment_request?: string;
  status: 'UNKNOWN' | 'IN_FLIGHT' | 'SUCCEEDED' | 'FAILED';
  fee_sat: string;
  fee_msat: string;
  creation_time_ns: string;
  htlcs: LNDHTLC[];
  payment_index: string;
  failure_reason?: 'FAILURE_REASON_NONE' | 'FAILURE_REASON_TIMEOUT' | 'FAILURE_REASON_NO_ROUTE' | 'FAILURE_REASON_ERROR' | 'FAILURE_REASON_INCORRECT_PAYMENT_DETAILS' | 'FAILURE_REASON_INSUFFICIENT_BALANCE';
}

export interface LNDListPaymentsRequest {
  include_incomplete?: boolean;
  index_offset?: string;
  max_payments?: string;
  reversed?: boolean;
  count_total_payments?: boolean;
}

export interface LNDListPaymentsResponse {
  payments: LNDPayment[];
  first_index_offset: string;
  last_index_offset: string;
  total_num_payments?: string;
}
