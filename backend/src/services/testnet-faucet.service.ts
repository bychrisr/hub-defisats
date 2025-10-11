/**
 * Testnet Faucet Service
 * 
 * Serviço para gerenciar funding interno via LND testnet
 * - Geração de sats testnet via LND
 * - Integração com LN Markets para depósitos
 * - Controle de rate limiting e limites
 * - Histórico e estatísticas
 */

import { Logger } from 'winston';
import { LNDService } from './lnd/LNDService';
import { LNMarketsAPIv2 } from './lnmarkets/LNMarketsAPIv2.service';

export interface FaucetRequest {
  amount: number;
  lightningAddress?: string;
  memo?: string;
}

export interface FaucetInfo {
  isAvailable: boolean;
  maxAmount: number;
  minAmount: number;
  dailyLimit: number;
  currentBalance: number;
  lndStatus: 'connected' | 'disconnected' | 'syncing';
  lastUpdate: string;
}

export interface FundingResult {
  requestId: string;
  amount: number;
  lightningInvoice?: string;
  lnMarketsDeposit?: {
    txid: string;
    amount: number;
    status: string;
  };
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

export interface FundingHistoryItem {
  id: string;
  amount: number;
  status: string;
  timestamp: string;
  lightningInvoice?: string;
  lnMarketsDeposit?: any;
}

export interface FaucetStats {
  totalRequests: number;
  totalSatsDistributed: number;
  successfulRequests: number;
  failedRequests: number;
  averageAmount: number;
  last24Hours: {
    requests: number;
    satsDistributed: number;
  };
}

export class TestnetFaucetService {
  private lndService: LNDService;
  private lnMarketsService?: LNMarketsAPIv2;
  private logger: Logger;
  private fundingHistory: Map<string, FundingHistoryItem> = new Map();
  private dailyLimits: Map<string, number> = new Map();

  // Configurações do faucet
  private readonly MAX_AMOUNT = 100000; // 100,000 sats
  private readonly MIN_AMOUNT = 1000;   // 1,000 sats
  private readonly DAILY_LIMIT = 500000; // 500,000 sats por dia
  private readonly RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 horas

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeServices();
  }

  private async initializeServices() {
    try {
      // Inicializar LND Service para testnet
      this.lndService = new LNDService({
        testnet: {
          baseURL: process.env.LND_TESTNET_BASE_URL || 'https://localhost:18080',
          tlsCert: process.env.LND_TESTNET_TLS_CERT,
          macaroon: process.env.LND_TESTNET_MACAROON
        }
      }, this.logger);

      // Verificar se LND testnet está disponível
      const lndInfo = await this.lndService.getTestnetInfo();
      this.logger.info('✅ LND Testnet initialized for faucet', {
        alias: lndInfo.alias,
        balance: lndInfo.balance
      });

      // TODO: Inicializar LNMarketsService se necessário para depósitos diretos
      // this.lnMarketsService = new LNMarketsAPIv2({...});

    } catch (error) {
      this.logger.error('❌ Failed to initialize testnet faucet services:', error);
    }
  }

  /**
   * Obter informações do faucet
   */
  async getFaucetInfo(): Promise<FaucetInfo> {
    try {
      const lndInfo = await this.lndService.getTestnetInfo();
      
      return {
        isAvailable: lndInfo.synced && lndInfo.balance > this.MIN_AMOUNT,
        maxAmount: this.MAX_AMOUNT,
        minAmount: this.MIN_AMOUNT,
        dailyLimit: this.DAILY_LIMIT,
        currentBalance: lndInfo.balance || 0,
        lndStatus: lndInfo.synced ? 'connected' : 'syncing',
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('❌ Failed to get faucet info:', error);
      return {
        isAvailable: false,
        maxAmount: this.MAX_AMOUNT,
        minAmount: this.MIN_AMOUNT,
        dailyLimit: this.DAILY_LIMIT,
        currentBalance: 0,
        lndStatus: 'disconnected',
        lastUpdate: new Date().toISOString()
      };
    }
  }

  /**
   * Solicitar funding de sats testnet
   */
  async requestFunding(request: FaucetRequest): Promise<FundingResult> {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();

    try {
      // Validar request
      this.validateFundingRequest(request);

      // Verificar rate limiting
      await this.checkRateLimit();

      // Verificar se LND tem saldo suficiente
      const lndInfo = await this.lndService.getTestnetInfo();
      if (lndInfo.balance < request.amount) {
        throw new Error(`Insufficient LND balance. Available: ${lndInfo.balance} sats, Requested: ${request.amount} sats`);
      }

      // Criar invoice Lightning se necessário
      let lightningInvoice: string | undefined;
      if (request.lightningAddress) {
        lightningInvoice = await this.createLightningInvoice(request.amount, request.memo);
      }

      // Registrar no histórico
      const historyItem: FundingHistoryItem = {
        id: requestId,
        amount: request.amount,
        status: 'pending',
        timestamp,
        lightningInvoice
      };
      this.fundingHistory.set(requestId, historyItem);

      // TODO: Implementar depósito direto na LN Markets se solicitado
      // if (lnMarketsDeposit) {
      //   await this.processLNMarketsDeposit(requestId, request.amount);
      // }

      this.logger.info('✅ Funding request created', {
        requestId,
        amount: request.amount,
        lightningInvoice: lightningInvoice ? 'created' : 'none'
      });

      return {
        requestId,
        amount: request.amount,
        lightningInvoice,
        status: 'completed',
        timestamp
      };

    } catch (error: any) {
      this.logger.error('❌ Failed to process funding request:', error);
      
      // Registrar falha no histórico
      const historyItem: FundingHistoryItem = {
        id: requestId,
        amount: request.amount,
        status: 'failed',
        timestamp
      };
      this.fundingHistory.set(requestId, historyItem);

      throw error;
    }
  }

  /**
   * Obter histórico de funding
   */
  async getFundingHistory(options: { limit: number; offset: number }): Promise<{
    items: FundingHistoryItem[];
    total: number;
    hasMore: boolean;
  }> {
    const allItems = Array.from(this.fundingHistory.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const items = allItems.slice(options.offset, options.offset + options.limit);
    const hasMore = options.offset + options.limit < allItems.length;

    return {
      items,
      total: allItems.length,
      hasMore
    };
  }

  /**
   * Obter estatísticas do faucet
   */
  async getFaucetStats(): Promise<FaucetStats> {
    const allItems = Array.from(this.fundingHistory.values());
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const last24HoursItems = allItems.filter(item => 
      new Date(item.timestamp) > last24Hours
    );

    const successfulRequests = allItems.filter(item => item.status === 'completed').length;
    const failedRequests = allItems.filter(item => item.status === 'failed').length;
    const totalSatsDistributed = allItems
      .filter(item => item.status === 'completed')
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      totalRequests: allItems.length,
      totalSatsDistributed,
      successfulRequests,
      failedRequests,
      averageAmount: allItems.length > 0 ? totalSatsDistributed / successfulRequests : 0,
      last24Hours: {
        requests: last24HoursItems.length,
        satsDistributed: last24HoursItems
          .filter(item => item.status === 'completed')
          .reduce((sum, item) => sum + item.amount, 0)
      }
    };
  }

  /**
   * Validar request de funding
   */
  private validateFundingRequest(request: FaucetRequest): void {
    if (request.amount < this.MIN_AMOUNT) {
      throw new Error(`Amount too small. Minimum: ${this.MIN_AMOUNT} sats`);
    }
    if (request.amount > this.MAX_AMOUNT) {
      throw new Error(`Amount too large. Maximum: ${this.MAX_AMOUNT} sats`);
    }
  }

  /**
   * Verificar rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const today = new Date().toDateString();
    const todayUsage = this.dailyLimits.get(today) || 0;

    if (todayUsage >= this.DAILY_LIMIT) {
      throw new Error(`Daily limit exceeded. Limit: ${this.DAILY_LIMIT} sats`);
    }

    // TODO: Implementar rate limiting por IP/user
  }

  /**
   * Criar invoice Lightning
   */
  private async createLightningInvoice(amount: number, memo?: string): Promise<string> {
    try {
      const invoice = await this.lndService.createTestnetInvoice({
        amount,
        memo: memo || 'Testnet faucet funding',
        expiry: 3600 // 1 hora
      });

      return invoice.paymentRequest;
    } catch (error) {
      this.logger.error('❌ Failed to create Lightning invoice:', error);
      throw new Error('Failed to create Lightning invoice');
    }
  }

  /**
   * Gerar ID único para request
   */
  private generateRequestId(): string {
    return `faucet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}