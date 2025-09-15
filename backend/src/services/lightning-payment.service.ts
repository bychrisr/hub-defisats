import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';

const prisma = new PrismaClient();

export interface LightningInvoice {
  bolt11: string;
  payment_hash: string;
  amount_sats: number;
  description: string;
  expires_at: Date;
}

export interface PaymentProvider {
  name: string;
  createInvoice(amount: number, description: string): Promise<LightningInvoice>;
  checkPayment(paymentHash: string): Promise<boolean>;
}

export class LNMarketsPaymentProvider implements PaymentProvider {
  name = 'LN Markets';
  private client: AxiosInstance;

  constructor(private credentials: { apiKey: string; apiSecret: string; passphrase: string }) {
    this.client = axios.create({
      baseURL: 'https://api.lnmarkets.com/v2',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add authentication interceptor
    this.client.interceptors.request.use(config => {
      const authHeaders = this.generateAuthHeaders(
        config.method?.toUpperCase() || 'GET',
        config.url || '',
        config.params,
        config.data
      );
      config.headers = { ...config.headers, ...authHeaders };
      return config;
    });
  }

  private generateAuthHeaders(method: string, path: string, params: any, data: any) {
    const timestamp = Date.now().toString();
    const body = data ? JSON.stringify(data) : '';
    const message = `${timestamp}${method}${path}${body}`;

    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(message)
      .digest('base64');

    return {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
    };
  }

  async createInvoice(amount: number, description: string): Promise<LightningInvoice> {
    try {
      const response = await this.client.post('/transfer/new', {
        amount,
        description,
        type: 'invoice',
      });

      return {
        bolt11: response.data.invoice,
        payment_hash: response.data.payment_hash,
        amount_sats: amount,
        description,
        expires_at: new Date(Date.now() + 3600000), // 1 hour expiry
      };
    } catch (error: any) {
      console.error('LN Markets invoice creation error:', error.response?.data);
      throw new Error(`Failed to create LN Markets invoice: ${error.message}`);
    }
  }

  async checkPayment(paymentHash: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/transfer/status/${paymentHash}`);
      return response.data.status === 'paid';
    } catch (error: any) {
      console.error('LN Markets payment check error:', error.response?.data);
      return false;
    }
  }
}

export class LNDPaymentProvider implements PaymentProvider {
  name = 'LND';
  private client: AxiosInstance;

  constructor(private lndUrl: string, private macaroon: string) {
    this.client = axios.create({
      baseURL: lndUrl,
      headers: {
        'Grpc-Metadata-macaroon': macaroon,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async createInvoice(amount: number, description: string): Promise<LightningInvoice> {
    try {
      const response = await this.client.post('/v1/invoices', {
        value: amount.toString(),
        memo: description,
        expiry: '3600', // 1 hour
      });

      return {
        bolt11: response.data.payment_request,
        payment_hash: response.data.r_hash,
        amount_sats: amount,
        description,
        expires_at: new Date(Date.now() + 3600000),
      };
    } catch (error: any) {
      console.error('LND invoice creation error:', error.response?.data);
      throw new Error(`Failed to create LND invoice: ${error.message}`);
    }
  }

  async checkPayment(paymentHash: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/v1/invoice/${paymentHash}`);
      return response.data.state === 'SETTLED';
    } catch (error: any) {
      console.error('LND payment check error:', error.response?.data);
      return false;
    }
  }
}

export class LNbitsPaymentProvider implements PaymentProvider {
  name = 'LNbits';
  private client: AxiosInstance;

  constructor(private lnbitsUrl: string, private apiKey: string) {
    this.client = axios.create({
      baseURL: lnbitsUrl,
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async createInvoice(amount: number, description: string): Promise<LightningInvoice> {
    try {
      const response = await this.client.post('/api/v1/payments', {
        amount,
        memo: description,
        expiry: 3600, // 1 hour
      });

      return {
        bolt11: response.data.payment_request,
        payment_hash: response.data.payment_hash,
        amount_sats: amount,
        description,
        expires_at: new Date(Date.now() + 3600000),
      };
    } catch (error: any) {
      console.error('LNbits invoice creation error:', error.response?.data);
      throw new Error(`Failed to create LNbits invoice: ${error.message}`);
    }
  }

  async checkPayment(paymentHash: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/api/v1/payments/${paymentHash}`);
      return response.data.paid;
    } catch (error: any) {
      console.error('LNbits payment check error:', error.response?.data);
      return false;
    }
  }
}

export class LightningPaymentService {
  private providers: PaymentProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize LN Markets provider if credentials are available
    if (process.env.LN_MARKETS_API_KEY && process.env.LN_MARKETS_API_SECRET) {
      this.providers.push(new LNMarketsPaymentProvider({
        apiKey: process.env.LN_MARKETS_API_KEY,
        apiSecret: process.env.LN_MARKETS_API_SECRET,
        passphrase: process.env.LN_MARKETS_PASSPHRASE || '',
      }));
    }

    // Initialize LND provider if configured
    if (process.env.LND_REST_URL && process.env.LND_MACAROON) {
      this.providers.push(new LNDPaymentProvider(
        process.env.LND_REST_URL,
        process.env.LND_MACAROON
      ));
    }

    // Initialize LNbits provider if configured
    if (process.env.LNBITS_URL && process.env.LNBITS_API_KEY) {
      this.providers.push(new LNbitsPaymentProvider(
        process.env.LNBITS_URL,
        process.env.LNBITS_API_KEY
      ));
    }

    console.log(`🟡 Initialized ${this.providers.length} Lightning payment providers`);
  }

  /**
   * Get pricing for different plans in sats
   */
  getPlanPricing(planType: string): { amount: number; description: string } {
    const pricing = {
      basic: { amount: 21000, description: 'Plano Basic - Recursos Essenciais' },
      advanced: { amount: 42000, description: 'Plano Advanced - Recursos Avançados' },
      pro: { amount: 84000, description: 'Plano Pro - Recursos Completos' },
      lifetime: { amount: 210000, description: 'Acesso Vitalício - Todos os Recursos' },
    };

    return pricing[planType as keyof typeof pricing] || pricing.basic;
  }

  /**
   * Create a Lightning invoice for payment
   */
  async createInvoice(userId: string, planType: string): Promise<any> {
    if (this.providers.length === 0) {
      throw new Error('No Lightning payment providers configured');
    }

    const pricing = this.getPlanPricing(planType);
    const description = `Hub DefiSats - ${pricing.description}`;

    // Try each provider in order until one succeeds
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        console.log(`🔄 Creating invoice with ${provider.name} provider`);

        const invoice = await provider.createInvoice(pricing.amount, description);

        // Save payment record to database
        const payment = await prisma.payment.create({
          data: {
            user_id: userId,
            plan_type: planType as any,
            amount_sats: pricing.amount,
            lightning_invoice: invoice.bolt11,
            payment_hash: invoice.payment_hash,
            description: pricing.description,
            expiry_seconds: 3600,
            expires_at: invoice.expires_at,
            status: 'pending',
          },
        });

        console.log(`✅ Invoice created successfully with ${provider.name}`);

        return {
          id: payment.id,
          bolt11: invoice.bolt11,
          amount_sats: pricing.amount,
          description: pricing.description,
          expires_at: invoice.expires_at,
          provider: provider.name,
        };

      } catch (error) {
        console.error(`❌ Failed to create invoice with ${provider.name}:`, error);
        lastError = error as Error;
      }
    }

    throw new Error(`Failed to create Lightning invoice: ${lastError?.message}`);
  }

  /**
   * Check payment status
   */
  async checkPayment(paymentId: string): Promise<boolean> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'paid') {
      return true;
    }

    if (payment.status === 'expired') {
      return false;
    }

    // Check if payment has expired
    if (payment.expires_at && payment.expires_at < new Date()) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'expired' },
      });
      return false;
    }

    // Try to verify payment with providers
    if (payment.payment_hash) {
      for (const provider of this.providers) {
        try {
          const isPaid = await provider.checkPayment(payment.payment_hash);

          if (isPaid) {
            // Update payment status
            await prisma.payment.update({
              where: { id: paymentId },
              data: {
                status: 'paid',
                paid_at: new Date(),
              },
            });

            // Update user plan
            await this.upgradeUserPlan(payment.user_id, payment.plan_type);

            console.log(`✅ Payment ${paymentId} confirmed and user plan upgraded`);
            return true;
          }
        } catch (error) {
          console.error(`Error checking payment with ${provider.name}:`, error);
        }
      }
    }

    return false;
  }

  /**
   * Upgrade user plan after successful payment
   */
  private async upgradeUserPlan(userId: string, planType: string) {
    try {
      // Update user plan
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan_type: planType as any,
          updated_at: new Date(),
        },
      });

      // Log the upgrade
      await prisma.userUpgradeHistory.create({
        data: {
          user_id: userId,
          old_plan: 'free', // Could be improved to get current plan
          new_plan: planType,
          reason: 'payment_upgrade',
          effective_date: new Date(),
          upgraded_by: userId, // Self-upgrade
        },
      });

      console.log(`🚀 User ${userId} upgraded to plan ${planType}`);
    } catch (error) {
      console.error('Error upgrading user plan:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        amount_sats: true,
        description: true,
        created_at: true,
        paid_at: true,
        expires_at: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(userId: string, limit: number = 10) {
    return await prisma.payment.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        plan_type: true,
        amount_sats: true,
        status: true,
        description: true,
        created_at: true,
        paid_at: true,
        expires_at: true,
      },
    });
  }

  /**
   * Retry expired payments (create new invoice)
   */
  async retryPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'paid') {
      throw new Error('Payment already completed');
    }

    // Create new invoice with same plan
    return await this.createInvoice(payment.user_id, payment.plan_type);
  }

  /**
   * Get available providers status
   */
  getProvidersStatus() {
    return {
      total_providers: this.providers.length,
      providers: this.providers.map(p => ({ name: p.name, available: true })),
    };
  }
}

// Export singleton instance
export const lightningPaymentService = new LightningPaymentService();

