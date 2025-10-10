/**
 * LN Markets Market Data Endpoints
 * 
 * Endpoints organizados para dados de mercado
 * - GET /futures/btc_usd/ticker - Ticker atual
 * - GET /futures/btc_usd/index - Histórico índice
 * - GET /futures/btc_usd/price - Histórico preço
 * - GET /options/btc_usd/volatility-index - Índice volatilidade
 * - GET /leaderboard - Ranking traders
 * - GET /options/market - Detalhes mercado opções
 */

import { LNMarketsClient } from '../LNMarketsClient';
import {
  LNMarketsTicker,
  LNMarketsIndexPoint,
  LNMarketsPricePoint,
  LNMarketsVolatilityIndex,
  LNMarketsLeaderboard,
  LNMarketsOptionsMarketInfo,
  LNMarketsHistoricalParams
} from '../types/market.types';

export class LNMarketsMarketEndpoints {
  constructor(private client: LNMarketsClient) {}

  /**
   * GET /futures/ticker - Obter ticker atual
   * @returns Dados do ticker
   */
  async getTicker(): Promise<LNMarketsTicker> {
    return this.client.request<LNMarketsTicker>({
      method: 'GET',
      url: '/futures/ticker'
    });
  }

  /**
   * GET /futures/btc_usd/index - Histórico do índice
   * @param params Parâmetros de período
   * @returns Lista de pontos do índice
   */
  async getIndexHistory(params: LNMarketsHistoricalParams): Promise<LNMarketsIndexPoint[]> {
    const queryParams: Record<string, any> = {
      from: params.from,
      to: params.to
    };
    
    if (params.limit) queryParams.limit = params.limit;

    return this.client.request<LNMarketsIndexPoint[]>({
      method: 'GET',
      url: '/futures/btc_usd/index',
      params: queryParams
    });
  }

  /**
   * GET /futures/btc_usd/price - Histórico de preços
   * @param params Parâmetros de período
   * @returns Lista de pontos de preço
   */
  async getPriceHistory(params: LNMarketsHistoricalParams): Promise<LNMarketsPricePoint[]> {
    const queryParams: Record<string, any> = {
      from: params.from,
      to: params.to
    };
    
    if (params.limit) queryParams.limit = params.limit;

    return this.client.request<LNMarketsPricePoint[]>({
      method: 'GET',
      url: '/futures/btc_usd/price',
      params: queryParams
    });
  }

  /**
   * GET /options/btc_usd/volatility-index - Índice de volatilidade
   * @param params Parâmetros de período
   * @returns Lista de pontos de volatilidade
   */
  async getVolatilityIndex(params: LNMarketsHistoricalParams): Promise<LNMarketsVolatilityIndex[]> {
    const queryParams: Record<string, any> = {
      from: params.from,
      to: params.to
    };
    
    if (params.limit) queryParams.limit = params.limit;

    return this.client.request<LNMarketsVolatilityIndex[]>({
      method: 'GET',
      url: '/options/btc_usd/volatility-index',
      params: queryParams
    });
  }

  /**
   * GET /leaderboard - Ranking de traders
   * @returns Leaderboard com rankings
   */
  async getLeaderboard(): Promise<LNMarketsLeaderboard> {
    return this.client.request<LNMarketsLeaderboard>({
      method: 'GET',
      url: '/leaderboard'
    });
  }

  /**
   * GET /options/market - Detalhes do mercado de opções
   * @returns Informações do mercado de opções
   */
  async getOptionsMarketInfo(): Promise<LNMarketsOptionsMarketInfo> {
    return this.client.request<LNMarketsOptionsMarketInfo>({
      method: 'GET',
      url: '/options/market'
    });
  }
}
