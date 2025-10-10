/**
 * LND Invoice Endpoints
 * 
 * Endpoints for LND invoice operations including creation, payment, settlement,
 * and subscription management.
 */

import { LNDClient } from '../LNDClient';
import {
  LNDAddInvoiceRequest,
  LNDAddInvoiceResponse,
  LNDAddHoldInvoiceRequest,
  LNDAddHoldInvoiceResponse,
  LNDSettleInvoiceRequest,
  LNDSettleInvoiceResponse,
  LNDCancelInvoiceRequest,
  LNDCancelInvoiceResponse,
  LNDLookupInvoiceRequest,
  LNDListInvoicesRequest,
  LNDListInvoicesResponse,
  LNDDecodePayReqRequest,
  LNDDecodePayReqResponse,
  LNDInvoice,
  LNDPayment,
  LNDListPaymentsRequest,
  LNDListPaymentsResponse
} from '../types/invoice.types';

export class LNDInvoiceEndpoints {
  constructor(private client: LNDClient) {}

  /**
   * POST /v1/invoices - Create new invoice
   */
  async createInvoice(request: LNDAddInvoiceRequest): Promise<LNDAddInvoiceResponse> {
    const response = await this.client.post('/v1/invoices', request);
    
    if (!response.success) {
      throw new Error(`Failed to create invoice: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/invoices/hold - Create HODL invoice
   */
  async createHoldInvoice(request: LNDAddHoldInvoiceRequest): Promise<LNDAddHoldInvoiceResponse> {
    const response = await this.client.post('/v1/invoices/hold', request);
    
    if (!response.success) {
      throw new Error(`Failed to create hold invoice: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/invoices/:payment_hash - Lookup invoice
   */
  async lookupInvoice(paymentHash: string): Promise<LNDInvoice> {
    const response = await this.client.get(`/v1/invoices/${paymentHash}`);
    
    if (!response.success) {
      throw new Error(`Failed to lookup invoice: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/invoices - List invoices
   */
  async listInvoices(request?: LNDListInvoicesRequest): Promise<LNDListInvoicesResponse> {
    const response = await this.client.get('/v1/invoices', request);
    
    if (!response.success) {
      throw new Error(`Failed to list invoices: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/invoices/:payment_hash/settle - Settle invoice
   */
  async settleInvoice(paymentHash: string, preimage: string): Promise<LNDSettleInvoiceResponse> {
    const response = await this.client.post(`/v1/invoices/${paymentHash}/settle`, {
      preimage
    });
    
    if (!response.success) {
      throw new Error(`Failed to settle invoice: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/invoices/:payment_hash/cancel - Cancel invoice
   */
  async cancelInvoice(paymentHash: string): Promise<LNDCancelInvoiceResponse> {
    const response = await this.client.post(`/v1/invoices/${paymentHash}/cancel`);
    
    if (!response.success) {
      throw new Error(`Failed to cancel invoice: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/invoices/decode - Decode payment request
   */
  async decodePayReq(request: LNDDecodePayReqRequest): Promise<LNDDecodePayReqResponse> {
    const response = await this.client.post('/v1/invoices/decode', request);
    
    if (!response.success) {
      throw new Error(`Failed to decode payment request: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/channels/transactions - Send payment
   */
  async sendPayment(request: {
    payment_request: string;
    amt?: string;
    fee_limit?: any;
    timeout_seconds?: number;
    allow_self_payment?: boolean;
    dest_custom_records?: Record<string, string>;
  }): Promise<{ payment_hash: string; payment_preimage: string; payment_route: any }> {
    const response = await this.client.post('/v1/channels/transactions', request);
    
    if (!response.success) {
      throw new Error(`Failed to send payment: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/channels/transactions/send - Send payment synchronously
   */
  async sendPaymentSync(request: {
    payment_request: string;
    amt?: string;
    fee_limit?: any;
    timeout_seconds?: number;
    allow_self_payment?: boolean;
    dest_custom_records?: Record<string, string>;
  }): Promise<{ payment_hash: string; payment_preimage: string; payment_route: any }> {
    const response = await this.client.post('/v1/channels/transactions/send', request);
    
    if (!response.success) {
      throw new Error(`Failed to send payment synchronously: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/payments - List payments
   */
  async listPayments(request?: LNDListPaymentsRequest): Promise<LNDListPaymentsResponse> {
    const response = await this.client.get('/v1/payments', request);
    
    if (!response.success) {
      throw new Error(`Failed to list payments: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * GET /v1/payments/:payment_hash - Get payment details
   */
  async getPayment(paymentHash: string): Promise<LNDPayment> {
    const response = await this.client.get(`/v1/payments/${paymentHash}`);
    
    if (!response.success) {
      throw new Error(`Failed to get payment: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/payments/:payment_hash/track - Track payment
   */
  async trackPayment(paymentHash: string): Promise<LNDPayment> {
    const response = await this.client.post(`/v1/payments/${paymentHash}/track`);
    
    if (!response.success) {
      throw new Error(`Failed to track payment: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * DELETE /v1/payments - Delete all payments
   */
  async deleteAllPayments(): Promise<{ success: boolean }> {
    const response = await this.client.delete('/v1/payments');
    
    if (!response.success) {
      throw new Error(`Failed to delete all payments: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/router/queryroutes - Query routes for payment
   */
  async queryRoutes(request: {
    pub_key: string;
    amt: string;
    final_cltv_delta?: number;
    fee_limit?: any;
    use_mission_control?: boolean;
    ignored_pairs?: any[];
    ignored_nodes?: string[];
    source_pub_key?: string;
    outgoing_chan_id?: string;
    last_hop_pubkey?: string;
    cltv_limit?: number;
    dest_custom_records?: Record<string, string>;
    dest_features?: number[];
  }): Promise<{ routes: any[] }> {
    const response = await this.client.post('/v1/router/queryroutes', request);
    
    if (!response.success) {
      throw new Error(`Failed to query routes: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * POST /v1/router/estimateroutefee - Estimate route fee
   */
  async estimateRouteFee(request: {
    dest: string;
    amt_sat: string;
  }): Promise<{ routing_fee_msat: string; time_lock_delay: number }> {
    const response = await this.client.post('/v1/router/estimateroutefee', request);
    
    if (!response.success) {
      throw new Error(`Failed to estimate route fee: ${response.error}`);
    }
    
    return response.data;
  }

  /**
   * Create invoice with amount in sats
   */
  async createInvoiceForAmount(
    amountSats: number,
    memo?: string,
    expiry?: string
  ): Promise<LNDAddInvoiceResponse> {
    const request: LNDAddInvoiceRequest = {
      value: amountSats.toString(),
      memo: memo || `Payment for ${amountSats} sats`,
      expiry: expiry || '3600' // 1 hour default
    };

    return this.createInvoice(request);
  }

  /**
   * Create invoice with amount in msats
   */
  async createInvoiceForAmountMsat(
    amountMsats: number,
    memo?: string,
    expiry?: string
  ): Promise<LNDAddInvoiceResponse> {
    const request: LNDAddInvoiceRequest = {
      value_msat: amountMsats.toString(),
      memo: memo || `Payment for ${amountMsats} msats`,
      expiry: expiry || '3600' // 1 hour default
    };

    return this.createInvoice(request);
  }

  /**
   * Pay invoice BOLT11
   */
  async payInvoice(
    paymentRequest: string,
    amountSats?: number,
    feeLimit?: number,
    timeoutSeconds?: number
  ): Promise<{ payment_hash: string; payment_preimage: string; payment_route: any }> {
    const request: any = {
      payment_request: paymentRequest,
      timeout_seconds: timeoutSeconds || 60,
      allow_self_payment: false
    };

    if (amountSats) {
      request.amt = amountSats.toString();
    }

    if (feeLimit) {
      request.fee_limit = {
        fixed: feeLimit.toString()
      };
    }

    return this.sendPaymentSync(request);
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(): Promise<{
    total_invoices: number;
    pending_invoices: number;
    settled_invoices: number;
    canceled_invoices: number;
    total_amount_sat: number;
    total_amount_msat: number;
    average_invoice_amount: number;
  }> {
    try {
      const invoicesResponse = await this.listInvoices({});
      const invoices = invoicesResponse.invoices || [];

      const stats = {
        total_invoices: invoices.length,
        pending_invoices: 0,
        settled_invoices: 0,
        canceled_invoices: 0,
        total_amount_sat: 0,
        total_amount_msat: 0,
        average_invoice_amount: 0
      };

      let totalAmountSat = 0;
      let settledCount = 0;

      invoices.forEach(invoice => {
        const amount = parseInt(invoice.value || '0');
        const amountMsat = parseInt(invoice.value_msat || '0');

        totalAmountSat += amount;
        stats.total_amount_msat += amountMsat;

        if (invoice.settled) {
          stats.settled_invoices++;
          settledCount++;
        } else if (invoice.state === 'CANCELED') {
          stats.canceled_invoices++;
        } else {
          stats.pending_invoices++;
        }
      });

      stats.total_amount_sat = totalAmountSat;
      stats.average_invoice_amount = settledCount > 0 ? totalAmountSat / settledCount : 0;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get invoice stats: ${error}`);
    }
  }
}
