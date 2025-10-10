/**
 * LN Markets Futures Endpoints
 * 
 * Endpoints organizados para operações de futures
 * - GET /futures - Posições de futures
 * - POST /futures - Abrir posição
 * - GET /futures/{id} - Posição específica
 * - DELETE /futures/{id} - Fechar posição
 * - PUT /futures/{id}/stop-loss-take-profit - Atualizar SL/TP
 * - POST /futures/{id}/add-margin - Adicionar margem
 * - POST /futures/{id}/cash-in - Cash-in
 * - GET /futures/carry-fees - Taxas de carry
 * - GET /futures/market - Detalhes do mercado
 */

import { LNMarketsClient } from '../LNMarketsClient';
import {
  LNMarketsFuturesPosition,
  LNMarketsFuturesOrder,
  LNMarketsFuturesParams,
  LNMarketsStopLossTakeProfitUpdate,
  LNMarketsAddMarginRequest,
  LNMarketsCashInRequest,
  LNMarketsCarryFee,
  LNMarketsMarketInfo,
  LNMarketsHistoricalParams
} from '../types/futures.types';

export class LNMarketsFuturesEndpoints {
  constructor(private client: LNMarketsClient) {}

  /**
   * GET /futures - Obter posições de futures
   * @param params Parâmetros de filtro
   * @returns Lista de posições
   */
  async getPositions(params: LNMarketsFuturesParams = {}): Promise<LNMarketsFuturesPosition[]> {
    const queryParams: Record<string, any> = {};
    
    if (params.type) queryParams.type = params.type;
    if (params.from) queryParams.from = params.from;
    if (params.to) queryParams.to = params.to;
    if (params.limit) queryParams.limit = params.limit;

    return this.client.request<LNMarketsFuturesPosition[]>({
      method: 'GET',
      url: '/futures',
      params: queryParams
    });
  }

  /**
   * GET /futures?type=running - Obter posições em execução
   * @returns Lista de posições running
   */
  async getRunningPositions(): Promise<LNMarketsFuturesPosition[]> {
    return this.getPositions({ type: 'running' });
  }

  /**
   * GET /futures?type=closed - Obter posições fechadas
   * @returns Lista de posições fechadas
   */
  async getClosedPositions(): Promise<LNMarketsFuturesPosition[]> {
    return this.getPositions({ type: 'closed' });
  }

  /**
   * GET /futures/{id} - Obter posição específica
   * @param id ID da posição
   * @returns Detalhes da posição
   */
  async getPosition(id: string): Promise<LNMarketsFuturesPosition> {
    return this.client.request<LNMarketsFuturesPosition>({
      method: 'GET',
      url: `/futures/${id}`
    });
  }

  /**
   * POST /futures - Abrir nova posição
   * @param order Dados da ordem
   * @returns Posição criada
   */
  async openPosition(order: LNMarketsFuturesOrder): Promise<LNMarketsFuturesPosition> {
    return this.client.request<LNMarketsFuturesPosition>({
      method: 'POST',
      url: '/futures',
      data: order
    });
  }

  /**
   * DELETE /futures/{id} - Fechar posição
   * @param id ID da posição
   * @returns Posição fechada
   */
  async closePosition(id: string): Promise<LNMarketsFuturesPosition> {
    return this.client.request<LNMarketsFuturesPosition>({
      method: 'DELETE',
      url: `/futures/${id}`
    });
  }

  /**
   * PUT /futures/{id}/stop-loss-take-profit - Atualizar SL/TP
   * @param id ID da posição
   * @param updates Novos valores de SL/TP
   * @returns Posição atualizada
   */
  async updateStopLossTakeProfit(
    id: string, 
    updates: LNMarketsStopLossTakeProfitUpdate
  ): Promise<LNMarketsFuturesPosition> {
    return this.client.request<LNMarketsFuturesPosition>({
      method: 'PUT',
      url: `/futures/${id}/stop-loss-take-profit`,
      data: updates
    });
  }

  /**
   * POST /futures/{id}/add-margin - Adicionar margem
   * @param id ID da posição
   * @param amount Quantidade de margem em sats
   * @returns Posição atualizada
   */
  async addMargin(id: string, amount: number): Promise<LNMarketsFuturesPosition> {
    return this.client.request<LNMarketsFuturesPosition>({
      method: 'POST',
      url: `/futures/${id}/add-margin`,
      data: { amount }
    });
  }

  /**
   * POST /futures/{id}/cash-in - Cash-in (saque parcial)
   * @param id ID da posição
   * @param quantity Quantidade a sacar
   * @returns Posição após cash-in
   */
  async cashIn(id: string, quantity: number): Promise<LNMarketsFuturesPosition> {
    return this.client.request<LNMarketsFuturesPosition>({
      method: 'POST',
      url: `/futures/${id}/cash-in`,
      data: { quantity }
    });
  }

  /**
   * DELETE /futures/{id}/cancel - Cancelar ordem limit
   * @param id ID da ordem
   * @returns Ordem cancelada
   */
  async cancelOrder(id: string): Promise<LNMarketsFuturesPosition> {
    return this.client.request<LNMarketsFuturesPosition>({
      method: 'DELETE',
      url: `/futures/${id}/cancel`,
      data: { id }
    });
  }

  /**
   * GET /futures/carry-fees - Histórico de taxas de carry
   * @param params Parâmetros de período
   * @returns Lista de taxas de carry
   */
  async getCarryFees(params: LNMarketsHistoricalParams): Promise<LNMarketsCarryFee[]> {
    const queryParams: Record<string, any> = {
      from: params.from,
      to: params.to
    };
    
    if (params.limit) queryParams.limit = params.limit;

    return this.client.request<LNMarketsCarryFee[]>({
      method: 'GET',
      url: '/futures/carry-fees',
      params: queryParams
    });
  }

  /**
   * GET /futures/market - Detalhes do mercado de futures
   * @returns Informações do mercado
   */
  async getMarketInfo(): Promise<LNMarketsMarketInfo> {
    return this.client.request<LNMarketsMarketInfo>({
      method: 'GET',
      url: '/futures/market'
    });
  }
}
