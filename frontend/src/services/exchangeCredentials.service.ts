import { api } from '@/lib/api';

export interface ExchangeCredential {
  id: string;
  name: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  description?: string;
  order: number;
}

export interface Exchange {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  api_version?: string;
  credential_types: ExchangeCredential[];
}

export interface UserExchangeCredentials {
  id: string;
  user_id: string;
  exchange_id: string;
  credentials: Record<string, string>;
  is_active: boolean;
  is_verified: boolean;
  last_test?: string;
  created_at: string;
  updated_at: string;
  exchange: Exchange;
}

export interface ExchangeCredentialsResponse {
  success: boolean;
  data: UserExchangeCredentials[];
  message?: string;
}

export interface UpdateCredentialsRequest {
  exchange_id: string;
  credentials: Record<string, string>;
}

export interface UpdateCredentialsResponse {
  success: boolean;
  data?: UserExchangeCredentials;
  message?: string;
}

/**
 * ✅ EXCHANGE CREDENTIALS SERVICE
 * 
 * Serviço para gerenciar credenciais de exchanges usando a nova estrutura
 */
export class ExchangeCredentialsService {
  
  /**
   * Buscar todas as exchanges disponíveis
   */
  static async getExchanges(): Promise<Exchange[]> {
    try {
      const response = await api.get('/api/exchanges');
      return response.data.data || [];
    } catch (error) {
      console.error('❌ EXCHANGE CREDENTIALS - Error fetching exchanges:', error);
      throw error;
    }
  }

  /**
   * Buscar credenciais do usuário para todas as exchanges
   */
  static async getUserCredentials(): Promise<UserExchangeCredentials[]> {
    try {
      const response = await api.get('/api/user/exchange-credentials');
      return response.data.data || [];
    } catch (error) {
      console.error('❌ EXCHANGE CREDENTIALS - Error fetching user credentials:', error);
      throw error;
    }
  }

  /**
   * Buscar credenciais do usuário para uma exchange específica
   */
  static async getUserCredentialsForExchange(exchangeId: string): Promise<UserExchangeCredentials | null> {
    try {
      const response = await api.get(`/api/user/exchange-credentials/${exchangeId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('❌ EXCHANGE CREDENTIALS - Error fetching credentials for exchange:', error);
      return null;
    }
  }

  /**
   * Atualizar credenciais do usuário para uma exchange
   */
  static async updateUserCredentials(exchangeId: string, credentials: Record<string, string>): Promise<UserExchangeCredentials> {
    try {
      const response = await api.put('/api/user/exchange-credentials', {
        exchange_id: exchangeId,
        credentials
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ EXCHANGE CREDENTIALS - Error updating credentials:', error);
      throw error;
    }
  }

  /**
   * Testar credenciais de uma exchange
   */
  static async testCredentials(exchangeId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/api/user/exchange-credentials/${exchangeId}/test`);
      return response.data;
    } catch (error) {
      console.error('❌ EXCHANGE CREDENTIALS - Error testing credentials:', error);
      throw error;
    }
  }

  /**
   * Deletar credenciais de uma exchange
   */
  static async deleteCredentials(exchangeId: string): Promise<void> {
    try {
      await api.delete(`/api/user/exchange-credentials/${exchangeId}`);
    } catch (error) {
      console.error('❌ EXCHANGE CREDENTIALS - Error deleting credentials:', error);
      throw error;
    }
  }

  /**
   * Buscar credenciais LN Markets (método de compatibilidade)
   */
  static async getLNMarketsCredentials(): Promise<UserExchangeCredentials | null> {
    try {
      // Primeiro, buscar a exchange LN Markets
      const exchanges = await this.getExchanges();
      const lnMarketsExchange = exchanges.find(ex => ex.slug === 'ln-markets');
      
      if (!lnMarketsExchange) {
        console.warn('⚠️ EXCHANGE CREDENTIALS - LN Markets exchange not found');
        return null;
      }

      // Buscar credenciais do usuário para LN Markets
      return await this.getUserCredentialsForExchange(lnMarketsExchange.id);
    } catch (error) {
      console.error('❌ EXCHANGE CREDENTIALS - Error fetching LN Markets credentials:', error);
      return null;
    }
  }

  /**
   * Atualizar credenciais LN Markets (método de compatibilidade)
   */
  static async updateLNMarketsCredentials(credentials: {
    api_key: string;
    api_secret: string;
    passphrase: string;
  }): Promise<UserExchangeCredentials> {
    try {
      // Primeiro, buscar a exchange LN Markets
      const exchanges = await this.getExchanges();
      const lnMarketsExchange = exchanges.find(ex => ex.slug === 'ln-markets');
      
      if (!lnMarketsExchange) {
        throw new Error('LN Markets exchange not found');
      }

      // Atualizar credenciais
      return await this.updateUserCredentials(lnMarketsExchange.id, credentials);
    } catch (error) {
      console.error('❌ EXCHANGE CREDENTIALS - Error updating LN Markets credentials:', error);
      throw error;
    }
  }
}
