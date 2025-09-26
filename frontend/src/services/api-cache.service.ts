/**
 * API Cache Service
 * 
 * Serviço centralizado para evitar múltiplas chamadas simultâneas para as mesmas rotas
 * Implementa cache inteligente e deduplicação de requisições
 * 
 * ⚠️ SEGURANÇA EM MERCADOS VOLÁTEIS:
 * - Cache máximo de 15 segundos para dados de mercado
 * - Validação rigorosa de timestamps
 * - Nenhum fallback com dados antigos
 * - Erro transparente quando dados indisponíveis
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

class APICacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 30 * 1000; // 30 segundos para dados não-críticos
  
  // TTLs específicos por rota - SEGURANÇA EM MERCADOS VOLÁTEIS
  private readonly ROUTE_TTL: Record<string, number> = {
    '/api/version': 5 * 60 * 1000, // 5 minutos - dados não-críticos
    '/api/market/index/public': 15 * 1000, // 15 segundos - MÁXIMO para dados de mercado
    '/api/admin/health/health': 30 * 1000, // 30 segundos - dados de sistema
    '/api/admin/hardware/metrics': 30 * 1000, // 30 segundos - dados de sistema
    '/api/admin/market-data/market-data': 15 * 1000, // 15 segundos - dados de mercado críticos
    '/api/admin/market-data/providers/status': 30 * 1000, // 30 segundos - status de sistema
    '/api/admin/lnmarkets/market-data': 15 * 1000, // 15 segundos - dados de mercado críticos
  };

  /**
   * Valida se os dados são recentes e seguros para uso
   */
  private validateMarketData(data: any, url: string): boolean {
    // Verificar se é uma rota de dados de mercado
    const isMarketDataRoute = url.includes('market') || url.includes('lnmarkets');
    
    if (!isMarketDataRoute) {
      return true; // Dados não-críticos não precisam de validação rigorosa
    }

    // Para dados de mercado, validar timestamp rigorosamente
    if (!data || !data.timestamp) {
      console.warn(`⚠️ API CACHE - Market data without timestamp for ${url}`);
      return false;
    }

    const dataAge = Date.now() - new Date(data.timestamp).getTime();
    const maxAge = 15 * 1000; // 15 segundos máximo para dados de mercado

    if (dataAge > maxAge) {
      console.warn(`⚠️ API CACHE - Market data too old (${dataAge}ms) for ${url}`);
      return false;
    }

    return true;
  }

  /**
   * Executa uma requisição com cache e deduplicação
   */
  async request(url: string, requestFn: () => Promise<any>, ttl?: number): Promise<any> {
    const now = Date.now();
    const cacheKey = url;
    const cacheTTL = ttl || this.ROUTE_TTL[url] || this.DEFAULT_TTL;
    
    // Verificar se já existe uma requisição em andamento para esta URL
    const existingEntry = this.cache.get(cacheKey);
    if (existingEntry?.promise) {
      console.log(`🔄 API CACHE - Deduplicating request for ${url}`);
      return existingEntry.promise;
    }
    
    // Verificar se há dados válidos no cache
    if (existingEntry?.data) {
      const dataAge = now - existingEntry.timestamp;
      
      // Validação adicional para dados de mercado
      if (dataAge < cacheTTL && this.validateMarketData(existingEntry.data, url)) {
        console.log(`✅ API CACHE - Using cached data for ${url} (age: ${dataAge}ms)`);
        return existingEntry.data;
      } else {
        // Dados expirados ou inválidos - remover do cache
        console.log(`🗑️ API CACHE - Removing expired/invalid data for ${url}`);
        this.cache.delete(cacheKey);
      }
    }
    
    // Executar a requisição
    console.log(`🌐 API CACHE - Making fresh request for ${url}`);
    const requestPromise = requestFn().catch(error => {
      // Remove a promise do cache em caso de erro
      this.cache.delete(cacheKey);
      throw error;
    });
    
    // Armazenar a promise no cache para deduplicação
    this.cache.set(cacheKey, {
      data: null,
      timestamp: now,
      promise: requestPromise
    });
    
    try {
      const result = await requestPromise;
      
      // Validação rigorosa dos dados recebidos
      if (!this.validateMarketData(result, url)) {
        console.error(`❌ API CACHE - Invalid market data received for ${url}`);
        this.cache.delete(cacheKey);
        throw new Error('Invalid market data - data too old or missing timestamp');
      }
      
      // Armazenar o resultado no cache apenas se válido
      this.cache.set(cacheKey, {
        data: result,
        timestamp: now,
        promise: undefined
      });
      
      console.log(`✅ API CACHE - Cached valid result for ${url}`);
      return result;
    } catch (error) {
      // Remove entrada do cache em caso de erro
      this.cache.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Limpa o cache para uma URL específica
   */
  invalidate(url: string): void {
    this.cache.delete(url);
    console.log(`🗑️ API CACHE - Invalidated cache for ${url}`);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ API CACHE - Cleared all cache');
  }

  /**
   * Remove entradas expiradas do cache
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      const ttl = this.ROUTE_TTL[key] || this.DEFAULT_TTL;
      if ((now - entry.timestamp) > ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 API CACHE - Cleaned up ${removedCount} expired entries`);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Instância singleton
export const apiCacheService = new APICacheService();

// Cleanup automático a cada 5 minutos
setInterval(() => {
  apiCacheService.cleanup();
}, 5 * 60 * 1000);
