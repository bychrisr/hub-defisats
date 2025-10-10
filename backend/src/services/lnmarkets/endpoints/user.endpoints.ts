/**
 * LN Markets User Endpoints
 * 
 * Endpoints organizados para operações de usuário
 * - GET /user - Dados do usuário + balance
 * - PUT /user - Atualizar configurações
 * - GET /user/deposits - Histórico depósitos
 * - GET /user/withdrawals - Histórico saques
 * - POST /user/deposits/bitcoin - Criar endereço Bitcoin
 * - POST /user/deposits/lightning - Criar invoice Lightning
 * - POST /user/withdrawals - Criar saque
 */

import { LNMarketsClient } from '../LNMarketsClient';
import {
  LNMarketsUser,
  LNMarketsUserUpdate,
  LNMarketsDeposit,
  LNMarketsWithdrawal,
  LNMarketsDepositRequest,
  LNMarketsDepositResponse,
  LNMarketsLightningDepositRequest,
  LNMarketsLightningDepositResponse,
  LNMarketsWithdrawalRequest,
  LNMarketsWithdrawalResponse
} from '../types/user.types';

export class LNMarketsUserEndpoints {
  constructor(private client: LNMarketsClient) {}

  /**
   * GET /user - Obter informações do usuário
   * @returns Dados do usuário incluindo saldo
   */
  async getUser(): Promise<LNMarketsUser> {
    return this.client.request<LNMarketsUser>({
      method: 'GET',
      url: '/user'
    });
  }

  /**
   * PUT /user - Atualizar informações do usuário
   * @param updates Configurações para atualizar
   * @returns Usuário atualizado
   */
  async updateUser(updates: LNMarketsUserUpdate): Promise<LNMarketsUser> {
    return this.client.request<LNMarketsUser>({
      method: 'PUT',
      url: '/user',
      data: updates
    });
  }

  /**
   * GET /user/deposits - Obter histórico de depósitos
   * @param types Tipos de depósito (bitcoin, lightning, internal)
   * @returns Lista de depósitos
   */
  async getDeposits(types?: string[]): Promise<LNMarketsDeposit[]> {
    const params = types ? { types: types.join(',') } : undefined;
    
    return this.client.request<LNMarketsDeposit[]>({
      method: 'GET',
      url: '/user/deposits',
      params
    });
  }

  /**
   * GET /user/withdrawals - Obter histórico de saques
   * @param types Tipos de saque (bitcoin, lightning, internal)
   * @returns Lista de saques
   */
  async getWithdrawals(types?: string[]): Promise<LNMarketsWithdrawal[]> {
    const params = types ? { types: types.join(',') } : undefined;
    
    return this.client.request<LNMarketsWithdrawal[]>({
      method: 'GET',
      url: '/user/withdrawals',
      params
    });
  }

  /**
   * GET /user/deposits/{id} - Obter depósito específico
   * @param id ID do depósito
   * @returns Detalhes do depósito
   */
  async getDeposit(id: string): Promise<LNMarketsDeposit> {
    return this.client.request<LNMarketsDeposit>({
      method: 'GET',
      url: `/user/deposits/${id}`
    });
  }

  /**
   * GET /user/withdrawals/{id} - Obter saque específico
   * @param id ID do saque
   * @returns Detalhes do saque
   */
  async getWithdrawal(id: string): Promise<LNMarketsWithdrawal> {
    return this.client.request<LNMarketsWithdrawal>({
      method: 'GET',
      url: `/user/withdrawals/${id}`
    });
  }

  /**
   * POST /user/deposits/bitcoin - Criar endereço de depósito Bitcoin
   * @param format Formato do endereço (p2wpkh ou p2tr)
   * @returns Endereço Bitcoin gerado
   */
  async createBitcoinDeposit(format: 'p2wpkh' | 'p2tr' = 'p2wpkh'): Promise<LNMarketsDepositResponse> {
    return this.client.request<LNMarketsDepositResponse>({
      method: 'POST',
      url: '/user/deposits/bitcoin',
      data: { format }
    });
  }

  /**
   * POST /user/deposits/lightning - Criar invoice Lightning para depósito
   * @param amount Valor em sats
   * @returns Invoice Lightning
   */
  async createLightningDeposit(amount: number): Promise<LNMarketsLightningDepositResponse> {
    return this.client.request<LNMarketsLightningDepositResponse>({
      method: 'POST',
      url: '/user/deposits/lightning',
      data: { amount }
    });
  }

  /**
   * POST /user/withdrawals - Criar saque via Lightning
   * @param invoice Invoice Lightning para saque
   * @returns Detalhes do saque criado
   */
  async createWithdrawal(invoice: string): Promise<LNMarketsWithdrawalResponse> {
    return this.client.request<LNMarketsWithdrawalResponse>({
      method: 'POST',
      url: '/user/withdrawals',
      data: { invoice }
    });
  }
}
