/**
 * LN Markets Robust Service
 * 
 * Sistema robusto e escalável que combina:
 * - Sistema antigo que funcionava (base64)
 * - Arquitetura escalável
 * - Uma única requisição otimizada
 * - Formato de assinatura configurável
 */

// 🎯 CONFIGURAÇÃO: Formato de assinatura (alterar aqui se a API mudar)
const SIGNATURE_FORMAT: 'base64' | 'hex' = 'base64'; // Sistema antigo que funcionava

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import { CircuitBreaker } from './circuit-breaker.service';
import { RetryService } from './retry.service';
import { Logger } from 'winston';
import { config } from '../config/env';
import { getLNMarketsEndpoint } from '../config/lnmarkets-endpoints';

export interface LNMarketsCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  isTestnet?: boolean;
}

export interface LNMarketsRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  data?: any;
  params?: any;
}

export interface LNMarketsUserData {
  user: any;
  balance: any;
  positions: any[];
  market: any;
  deposits: any[];
  withdrawals: any[];
  trades: any[];
  orders: any[];
}

export class LNMarketsRobustService {
  private client: AxiosInstance;
  private credentials: LNMarketsCredentials;
  private baseURL: string;
  private circuitBreaker: CircuitBreaker;
  private retryService: RetryService;
  private logger: Logger;
  private signatureFormat: 'base64' | 'hex';

  constructor(credentials: LNMarketsCredentials, logger: Logger) {
    console.log('🚀 LN MARKETS ROBUST SERVICE - Initializing...');
    
    this.credentials = credentials;
    
    // 🎯 ESTRATÉGIA HÍBRIDA: Usar configuração centralizada quando disponível
    this.baseURL = credentials.isTestnet 
      ? (config.lnMarkets?.testnetUrl || 'https://api.testnet4.lnmarkets.com/v2')
      : (config.lnMarkets?.baseUrl || 'https://api.lnmarkets.com/v2');
    
    console.log('🌐 BaseURL:', this.baseURL);
    
    // 🎯 CONFIGURAÇÃO: Usar formato configurável
    this.signatureFormat = SIGNATURE_FORMAT;
    console.log('🔐 Signature format configured:', this.signatureFormat);
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({ 
      failureThreshold: 5, 
      recoveryTimeout: 60000,
      monitoringPeriod: 60000
    });
    
    this.retryService = new RetryService(logger);
    this.logger = logger;

    // Add request interceptor for authentication
    this.client.interceptors.request.use(this.authenticateRequest.bind(this) as any);
    
    console.log('✅ LN MARKETS ROBUST SERVICE - Initialized successfully');
  }

  private authenticateRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    console.log('🔐 ROBUST AUTH - Starting authentication...');
    
    // 🎯 SISTEMA ORIGINAL: Usar timestamp em milliseconds (como funcionava antes)
    const timestamp = Date.now().toString();
    const method = (config.method || 'GET').toUpperCase();
    const path = config.url || '';
    
    console.log('🔐 ROBUST AUTH - Timestamp format:', timestamp, '(milliseconds - ORIGINAL)');
    
    // Limpar credenciais
    const apiKey = this.credentials.apiKey.trim();
    const apiSecret = this.credentials.apiSecret.trim();
    const passphrase = this.credentials.passphrase.trim();
    
    console.log('🔐 ROBUST AUTH - Credentials check:', {
      apiKeyLength: apiKey.length,
      apiSecretLength: apiSecret.length,
      passphraseLength: passphrase.length,
      apiKeyStart: apiKey.substring(0, 10) + '...',
      isTestCredentials: apiKey === 'test-api-key'
    });
    
    // Prepare data for signature (sistema antigo que funcionava)
    let params = '';
    
    if (method === 'GET' || method === 'DELETE') {
      if (config.params) {
        params = new URLSearchParams(config.params).toString();
      }
    } else if (config.data) {
      params = JSON.stringify(config.data);
    }
    
    // Create signature message (CORRIGIDO: LN Markets API v2 requer '/v2' na string de assinatura)
    const message = timestamp + method + '/v2' + path + params;
    console.log('🔐 ROBUST AUTH - Message components:', {
      timestamp,
      method,
      path,
      params,
      fullMessage: message
    });
    
    // 🎯 ESTRATÉGIA ADAPTATIVA: Gerar assinatura no formato atual
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(message, 'utf8')
      .digest(this.signatureFormat);

    console.log('🔐 ROBUST AUTH - Signature format:', this.signatureFormat);
    console.log('🔐 ROBUST AUTH - Signature:', signature);
    console.log('🔐 ROBUST AUTH - Full URL:', `${this.baseURL}${path}`);
    console.log('🔐 ROBUST AUTH - Method:', method);
    console.log('🔐 ROBUST AUTH - Params:', params);

    // Add headers
    config.headers = {
      ...config.headers,
      'LNM-ACCESS-KEY': apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
    };
    
    console.log('🔐 ROBUST AUTH - Headers:', JSON.stringify(config.headers, null, 2));

    // Set content type for POST/PUT requests
    if (method === 'POST' || method === 'PUT') {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  }

  private async makeRequest<T = any>(request: LNMarketsRequest): Promise<T> {
    console.log('🚀 ROBUST REQUEST - Starting:', {
      method: request.method,
      path: request.path,
      baseURL: this.baseURL,
      signatureFormat: this.signatureFormat
    });
    
    try {
      const result = await this.circuitBreaker.execute(async () => {
        return await this.retryService.executeApiOperation(async () => {
          const response = await this.client.request({
            method: request.method,
            url: request.path,
            data: request.data,
            params: request.params,
          });

          console.log('✅ ROBUST REQUEST - Success:', {
            status: response.status,
            dataKeys: response.data ? Object.keys(response.data) : 'no data'
          });

          return response.data;
        }, `LNMarketsRobust-${request.method}-${request.path}`, {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          jitter: true
        });
      });

      return result;
    } catch (error: any) {
      console.log('❌ ROBUST REQUEST - Error:', {
        message: error.message,
        status: error.response?.status,
        signatureFormat: this.signatureFormat
      });

      // 🎯 SISTEMA SIMPLES: Usar apenas o formato configurado
      // Se necessário mudar formato, alterar a variável SIGNATURE_FORMAT

      throw error;
    }
  }

  /**
   * 🎯 MÉTODO PRINCIPAL: Buscar TODOS os dados em uma única requisição otimizada
   */
  async getAllUserData(): Promise<LNMarketsUserData> {
    console.log('🚀 ROBUST SERVICE - Fetching all user data in parallel requests...');
    
    try {
      // 🔧 CORREÇÃO: Buscar dados específicos em paralelo para garantir que posições running sejam retornadas
      const [userData, balanceData, positionsData, marketData] = await Promise.allSettled([
        this.makeRequest({
          method: 'GET',
          path: getLNMarketsEndpoint('user')
        }),
        this.makeRequest({
          method: 'GET',
          path: getLNMarketsEndpoint('userBalance')
        }),
        this.makeRequest({
          method: 'GET',
          path: '/futures',
          params: { type: 'running' }
        }),
        this.makeRequest({
          method: 'GET',
          path: getLNMarketsEndpoint('futuresTicker')
        })
      ]);

      console.log('✅ ROBUST SERVICE - Data received:', {
        userData: userData.status,
        balanceData: balanceData.status,
        positionsData: positionsData.status,
        marketData: marketData.status
      });

      // Debug específico para posições
      if (positionsData.status === 'fulfilled') {
        console.log('🔍 ROBUST SERVICE - Positions data:', {
          type: typeof positionsData.value,
          isArray: Array.isArray(positionsData.value),
          length: Array.isArray(positionsData.value) ? positionsData.value.length : 'not array',
          firstItem: Array.isArray(positionsData.value) && positionsData.value.length > 0 ? positionsData.value[0] : 'no items'
        });
      } else {
        console.log('❌ ROBUST SERVICE - Positions error:', positionsData.reason);
      }

      // Estruturar dados de forma escalável
      const structuredData: LNMarketsUserData = {
        user: userData.status === 'fulfilled' ? userData.value : null,
        balance: balanceData.status === 'fulfilled' ? balanceData.value : null,
        positions: positionsData.status === 'fulfilled' ? positionsData.value : [],
        market: marketData.status === 'fulfilled' ? marketData.value : null,
        deposits: [],
        withdrawals: [],
        trades: [],
        orders: []
      };

      console.log('📊 ROBUST SERVICE - Data structured successfully:', {
        user: !!structuredData.user,
        balance: !!structuredData.balance,
        positionsCount: structuredData.positions.length,
        market: !!structuredData.market
      });
      
      return structuredData;

    } catch (error: any) {
      console.log('❌ ROBUST SERVICE - Error fetching user data:', error.message);
      
      // Retornar estrutura vazia em caso de erro
      return {
        user: null,
        balance: null,
        positions: [],
        market: null,
        deposits: [],
        withdrawals: [],
        trades: [],
        orders: []
      };
    }
  }

  /**
   * 🎯 MÉTODO DE FALLBACK: Buscar dados específicos se necessário
   */
  async getUser(): Promise<any> {
    return this.makeRequest({
      method: 'GET',
      path: getLNMarketsEndpoint('user')
    });
  }

  async getUserBalance(): Promise<any> {
    return this.makeRequest({
      method: 'GET',
      path: getLNMarketsEndpoint('userBalance')
    });
  }

  async getPositions(): Promise<any[]> {
    return this.makeRequest({
      method: 'GET',
      path: getLNMarketsEndpoint('futuresPositions')
    });
  }

  async getMarketData(): Promise<any> {
    return this.makeRequest({
      method: 'GET',
      path: getLNMarketsEndpoint('futuresTicker')
    });
  }

  /**
   * 🎯 MÉTODO DE TESTE: Verificar conectividade
   * 
   * Para mudar o formato de assinatura:
   * 1. Alterar a constante SIGNATURE_FORMAT no topo do arquivo
   * 2. Reiniciar o backend
   */
  async testConnection(): Promise<{ success: boolean; message: string; signatureFormat: string }> {
    try {
      await this.getUser();
      return { 
        success: true, 
        message: 'Connection successful',
        signatureFormat: this.signatureFormat
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message,
        signatureFormat: this.signatureFormat
      };
    }
  }
}
