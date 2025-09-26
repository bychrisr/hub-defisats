/**
 * Cached API Service
 * 
 * Wrapper para o serviço de API que implementa cache inteligente
 * 
 * ⚠️ SEGURANÇA EM MERCADOS VOLÁTEIS:
 * - Validação rigorosa de dados de mercado
 * - Erro transparente quando dados indisponíveis
 * - Nenhum fallback com dados antigos
 */

import { api } from '@/lib/api';
import { apiCacheService } from './api-cache.service';

class CachedAPIService {
  /**
   * Valida se a resposta contém dados de mercado válidos
   */
  private validateMarketResponse(response: any, url: string): boolean {
    // Verificar se é uma rota de dados de mercado
    const isMarketDataRoute = url.includes('market') || url.includes('lnmarkets');
    
    if (!isMarketDataRoute) {
      return true; // Dados não-críticos não precisam de validação rigorosa
    }

    // Para dados de mercado, validar estrutura e timestamp
    if (!response?.data?.success) {
      console.warn(`⚠️ CACHED API - Market data request failed for ${url}`);
      return false;
    }

    const marketData = response.data.data;
    if (!marketData || !marketData.timestamp) {
      console.warn(`⚠️ CACHED API - Market data missing timestamp for ${url}`);
      return false;
    }

    // Validar idade dos dados
    const dataAge = Date.now() - new Date(marketData.timestamp).getTime();
    const maxAge = 15 * 1000; // 15 segundos máximo

    if (dataAge > maxAge) {
      console.warn(`⚠️ CACHED API - Market data too old (${dataAge}ms) for ${url}`);
      return false;
    }

    return true;
  }

  /**
   * GET request com cache
   */
  async get(url: string, config?: any): Promise<any> {
    return apiCacheService.request(url, async () => {
      const response = await api.get(url, config);
      
      // Validação adicional para dados de mercado
      if (!this.validateMarketResponse(response, url)) {
        throw new Error(`Invalid market data for ${url} - data too old or missing timestamp`);
      }
      
      return response;
    });
  }

  /**
   * GET request sem cache (para operações que sempre precisam de dados frescos)
   */
  async getFresh(url: string, config?: any): Promise<any> {
    apiCacheService.invalidate(url);
    return api.get(url, config);
  }

  /**
   * POST request (nunca usa cache)
   */
  async post(url: string, data?: any, config?: any): Promise<any> {
    // Invalidar cache relacionado após POST
    this.invalidateRelatedCache(url);
    return api.post(url, data, config);
  }

  /**
   * PUT request (nunca usa cache)
   */
  async put(url: string, data?: any, config?: any): Promise<any> {
    // Invalidar cache relacionado após PUT
    this.invalidateRelatedCache(url);
    return api.put(url, data, config);
  }

  /**
   * DELETE request (nunca usa cache)
   */
  async delete(url: string, config?: any): Promise<any> {
    // Invalidar cache relacionado após DELETE
    this.invalidateRelatedCache(url);
    return api.delete(url, config);
  }

  /**
   * Invalidar cache relacionado a uma URL
   */
  private invalidateRelatedCache(url: string): void {
    // Mapear URLs relacionadas que devem ter cache invalidado
    const relatedUrls: Record<string, string[]> = {
      '/api/admin/market-data/providers/reset-circuit-breaker': [
        '/api/admin/market-data/providers/status',
        '/api/admin/market-data/market-data',
        '/api/admin/lnmarkets/market-data'
      ],
      '/api/profile': [
        '/api/admin/lnmarkets/market-data'
      ]
    };

    const related = relatedUrls[url] || [];
    related.forEach(relatedUrl => {
      apiCacheService.invalidate(relatedUrl);
    });
  }

  /**
   * Invalidar cache específico
   */
  invalidateCache(url: string): void {
    apiCacheService.invalidate(url);
  }

  /**
   * Limpar todo o cache
   */
  clearCache(): void {
    apiCacheService.clear();
  }

  /**
   * Obter estatísticas do cache
   */
  getCacheStats() {
    return apiCacheService.getStats();
  }
}

// Instância singleton
export const cachedApi = new CachedAPIService();
