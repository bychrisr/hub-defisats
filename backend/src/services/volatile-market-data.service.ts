import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

interface MarketData {
  index: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
  source: 'lnmarkets' | 'binance' | 'coingecko';
}

interface MarketDataCache {
  data: MarketData | null;
  timestamp: number;
  ttl: number;
}

interface MarketDataResponse {
  success: boolean;
  data?: MarketData;
  error?: string;
  message?: string;
  isStale?: boolean;
}

/**
 * Serviço para dados de mercado voláteis
 * 
 * ⚠️ PRINCÍPIOS CRÍTICOS DE SEGURANÇA:
 * - Cache máximo de 30 segundos
 * - NUNCA usar dados antigos em caso de erro
 * - NUNCA usar dados simulados ou fallbacks
 * - Validação rigorosa de timestamps
 * - Erro transparente quando dados indisponíveis
 */
export class VolatileMarketDataService {
  private prisma: PrismaClient;
  private logger: Logger;
  private marketDataCache: MarketDataCache = {
    data: null,
    timestamp: 0,
    ttl: 30000 // 30 segundos - MÁXIMO PERMITIDO
  };

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Obtém dados de mercado com segurança rigorosa
   * 
   * ⚠️ NUNCA retorna dados antigos ou simulados
   * ⚠️ Cache máximo de 30 segundos
   * ⚠️ Erro transparente quando dados indisponíveis
   */
  async getMarketData(): Promise<MarketDataResponse> {
    try {
      // Verificar se cache é válido (máximo 30 segundos)
      const now = Date.now();
      const cacheAge = now - this.marketDataCache.timestamp;
      
      if (this.marketDataCache.data && cacheAge < this.marketDataCache.ttl) {
        this.logger.debug('Market data cache hit', { 
          cacheAge,
          maxAge: this.marketDataCache.ttl 
        });
        
        return {
          success: true,
          data: this.marketDataCache.data
        };
      }

      // Cache expirado ou inexistente - buscar dados frescos
      this.logger.info('Fetching fresh market data', { 
        cacheAge: cacheAge > 0 ? cacheAge : 'no cache' 
      });

      const freshData = await this.fetchFreshMarketData();
      
      if (!freshData) {
        // ⚠️ CRÍTICO: NUNCA usar cache antigo em caso de erro
        this.logger.warn('Fresh market data unavailable - NOT using stale cache');
        
        return {
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Market data temporarily unavailable - for safety, we do not display outdated data in volatile markets'
        };
      }

      // Validar se dados são realmente recentes
      if (!this.isDataRecent(freshData)) {
        this.logger.warn('Market data too old - rejecting', { 
          dataAge: now - freshData.timestamp 
        });
        
        return {
          success: false,
          error: 'DATA_TOO_OLD',
          message: 'Market data is too old - for safety, we do not display outdated data in volatile markets'
        };
      }

      // Atualizar cache com dados frescos
      this.marketDataCache = {
        data: freshData,
        timestamp: now,
        ttl: 30000 // 30 segundos
      };

      this.logger.info('Fresh market data cached', { 
        source: freshData.source,
        index: freshData.index,
        timestamp: freshData.timestamp 
      });

      return {
        success: true,
        data: freshData
      };

    } catch (error) {
      this.logger.error('Market data fetch failed', { 
        error: (error as Error).message 
      });
      
      // ⚠️ CRÍTICO: NUNCA usar cache antigo em caso de erro
      return {
        success: false,
        error: 'FETCH_FAILED',
        message: 'Unable to fetch market data - for safety, we do not display outdated data in volatile markets'
      };
    }
  }

  /**
   * Busca dados frescos de mercado
   * Tenta múltiplas fontes em ordem de prioridade
   */
  private async fetchFreshMarketData(): Promise<MarketData | null> {
    const sources = [
      { name: 'lnmarkets', priority: 1 },
      { name: 'binance', priority: 2 }
      // { name: 'coingecko', priority: 3 } // Temporariamente desativado
    ];

    for (const source of sources) {
      try {
        const data = await this.fetchFromSource(source.name);
        if (data && this.isDataValid(data)) {
          this.logger.info(`Market data fetched from ${source.name}`, {
            source: source.name,
            index: data.index,
            timestamp: data.timestamp
          });
          return data;
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch from ${source.name}`, {
          source: source.name,
          error: (error as Error).message
        });
        continue;
      }
    }

    return null;
  }

  /**
   * Busca dados de uma fonte específica
   */
  private async fetchFromSource(source: string): Promise<MarketData | null> {
    switch (source) {
      case 'lnmarkets':
        return this.fetchFromLnMarkets();
      case 'binance':
        return this.fetchFromBinance();
      case 'coingecko':
        return this.fetchFromCoinGecko();
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  }

  /**
   * Busca dados do LN Markets
   */
  private async fetchFromLnMarkets(): Promise<MarketData | null> {
    // Implementação real da API do LN Markets
    // Por enquanto, retorna null para forçar busca de outras fontes
    throw new Error('LN Markets API not implemented yet');
  }

  /**
   * Busca dados do Binance
   */
  private async fetchFromBinance(): Promise<MarketData | null> {
    // Implementação real da API do Binance
    // Por enquanto, retorna null para forçar busca de outras fontes
    throw new Error('Binance API not implemented yet');
  }

  /**
   * Busca dados do CoinGecko
   */
  private async fetchFromCoinGecko(): Promise<MarketData | null> {
    // Implementação real da API do CoinGecko
    // Por enquanto, retorna null para forçar busca de outras fontes
    throw new Error('CoinGecko API not implemented yet');
  }

  /**
   * Valida se dados são recentes (máximo 30 segundos)
   */
  private isDataRecent(data: MarketData): boolean {
    const now = Date.now();
    const dataAge = now - data.timestamp;
    const maxAge = 30000; // 30 segundos

    if (dataAge > maxAge) {
      this.logger.warn('Market data too old', {
        dataAge,
        maxAge,
        timestamp: data.timestamp,
        now
      });
      return false;
    }

    return true;
  }

  /**
   * Valida se dados são válidos
   */
  private isDataValid(data: MarketData): boolean {
    if (!data || typeof data.index !== 'number' || data.index <= 0) {
      this.logger.warn('Invalid market data - missing or invalid index', { data });
      return false;
    }

    if (!data.timestamp || typeof data.timestamp !== 'number') {
      this.logger.warn('Invalid market data - missing timestamp', { data });
      return false;
    }

    if (!data.source || !['lnmarkets', 'binance', 'coingecko'].includes(data.source)) {
      this.logger.warn('Invalid market data - unknown source', { data });
      return false;
    }

    return true;
  }

  /**
   * Força atualização dos dados (ignora cache)
   */
  async forceRefresh(): Promise<MarketDataResponse> {
    this.logger.info('Forcing market data refresh');
    
    // Limpar cache
    this.marketDataCache = {
      data: null,
      timestamp: 0,
      ttl: 30000
    };

    return this.getMarketData();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): {
    hasData: boolean;
    cacheAge: number;
    isStale: boolean;
    ttl: number;
  } {
    const now = Date.now();
    const cacheAge = now - this.marketDataCache.timestamp;
    const isStale = cacheAge >= this.marketDataCache.ttl;

    return {
      hasData: this.marketDataCache.data !== null,
      cacheAge,
      isStale,
      ttl: this.marketDataCache.ttl
    };
  }

  /**
   * Limpa cache (força próxima busca a ser fresca)
   */
  clearCache(): void {
    this.logger.info('Market data cache cleared');
    this.marketDataCache = {
      data: null,
      timestamp: 0,
      ttl: 30000
    };
  }

  /**
   * Valida dados de mercado recebidos de APIs externas
   */
  validateExternalMarketData(data: any): MarketData | null {
    try {
      // Validar estrutura básica
      if (!data || typeof data !== 'object') {
        this.logger.warn('Invalid external market data - not an object', { data });
        return null;
      }

      // Validar campos obrigatórios
      const requiredFields = ['index', 'timestamp'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          this.logger.warn(`Invalid external market data - missing ${field}`, { data });
          return null;
        }
      }

      // Validar tipos
      if (typeof data.index !== 'number' || data.index <= 0) {
        this.logger.warn('Invalid external market data - invalid index', { data });
        return null;
      }

      if (typeof data.timestamp !== 'number' || data.timestamp <= 0) {
        this.logger.warn('Invalid external market data - invalid timestamp', { data });
        return null;
      }

      // Construir objeto MarketData
      const marketData: MarketData = {
        index: data.index,
        change24h: data.change24h || 0,
        volume24h: data.volume24h || 0,
        high24h: data.high24h || data.index,
        low24h: data.low24h || data.index,
        timestamp: data.timestamp,
        source: data.source || 'unknown'
      };

      return marketData;

    } catch (error) {
      this.logger.error('Error validating external market data', {
        error: (error as Error).message,
        data
      });
      return null;
    }
  }

  /**
   * Obtém dados de mercado com fallback seguro
   * 
   * ⚠️ IMPORTANTE: Este método NUNCA usa dados antigos
   * ⚠️ Se dados não estão disponíveis, retorna erro transparente
   */
  async getMarketDataWithFallback(): Promise<MarketDataResponse> {
    const result = await this.getMarketData();
    
    if (result.success) {
      return result;
    }

    // ⚠️ CRÍTICO: NUNCA usar dados antigos como fallback
    this.logger.warn('Market data unavailable - NOT using stale data as fallback');
    
    return {
      success: false,
      error: 'MARKET_DATA_UNAVAILABLE',
      message: 'Market data is currently unavailable. For your safety, we do not display outdated data in volatile markets as it could lead to incorrect trading decisions and financial losses.',
      isStale: false
    };
  }
}
