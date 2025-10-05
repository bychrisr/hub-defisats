import { api } from '@/lib/api';

export interface Exchange {
  id: string;
  name: string;
  slug: string;
  description: string;
  website: string;
  logo_url: string;
  is_active: boolean;
  api_version: string;
  created_at: string;
  updated_at: string;
  credential_types: ExchangeCredentialType[];
}

export interface ExchangeCredentialType {
  id: string;
  exchange_id: string;
  name: string;
  field_name: string;
  field_type: 'text' | 'password' | 'email' | 'url';
  is_required: boolean;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface UserExchangeCredentials {
  id: string;
  user_id: string;
  exchange_id: string;
  credentials: Record<string, string>;
  is_active: boolean;
  is_verified: boolean;
  last_test: string | null;
  created_at: string;
  updated_at: string;
  exchange: Exchange;
}

export interface CredentialTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class ExchangeService {
  /**
   * Get all available exchanges
   */
  static async getExchanges(): Promise<Exchange[]> {
    console.log('🔍 EXCHANGE SERVICE - Fetching exchanges...');
    
    try {
      const response = await api.get('/api/exchanges');
      const exchanges = response.data.data;
      
      console.log('✅ EXCHANGE SERVICE - Exchanges fetched:', {
        count: exchanges.length,
        exchanges: exchanges.map((ex: Exchange) => ({ id: ex.id, name: ex.name, slug: ex.slug }))
      });
      
      return exchanges;
    } catch (error: any) {
      console.error('❌ EXCHANGE SERVICE - Error fetching exchanges:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch exchanges');
    }
  }

  /**
   * Get exchange by ID
   */
  static async getExchangeById(exchangeId: string): Promise<Exchange> {
    console.log('🔍 EXCHANGE SERVICE - Fetching exchange by ID:', exchangeId);
    
    try {
      const exchanges = await this.getExchanges();
      const exchange = exchanges.find(ex => ex.id === exchangeId);
      
      if (!exchange) {
        throw new Error('Exchange not found');
      }
      
      console.log('✅ EXCHANGE SERVICE - Exchange found:', { id: exchange.id, name: exchange.name });
      return exchange;
    } catch (error: any) {
      console.error('❌ EXCHANGE SERVICE - Error fetching exchange:', error);
      throw error;
    }
  }

  /**
   * Get exchange by slug
   */
  static async getExchangeBySlug(slug: string): Promise<Exchange> {
    console.log('🔍 EXCHANGE SERVICE - Fetching exchange by slug:', slug);
    
    try {
      const exchanges = await this.getExchanges();
      const exchange = exchanges.find(ex => ex.slug === slug);
      
      if (!exchange) {
        throw new Error('Exchange not found');
      }
      
      console.log('✅ EXCHANGE SERVICE - Exchange found by slug:', { id: exchange.id, name: exchange.name });
      return exchange;
    } catch (error: any) {
      console.error('❌ EXCHANGE SERVICE - Error fetching exchange by slug:', error);
      throw error;
    }
  }

  /**
   * Get user's credentials for all exchanges
   */
  static async getUserCredentials(): Promise<UserExchangeCredentials[]> {
    console.log('🔍 EXCHANGE SERVICE - Fetching user credentials...');
    
    try {
      const response = await api.get('/api/user/exchange-credentials');
      const credentials = response.data.data;
      
      console.log('✅ EXCHANGE SERVICE - User credentials fetched:', {
        count: credentials.length,
        exchanges: credentials.map((cred: UserExchangeCredentials) => ({
          exchangeId: cred.exchange_id,
          exchangeName: cred.exchange.name,
          isActive: cred.is_active,
          isVerified: cred.is_verified
        }))
      });
      
      return credentials;
    } catch (error: any) {
      console.error('❌ EXCHANGE SERVICE - Error fetching user credentials:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user credentials');
    }
  }

  /**
   * Get user's credentials for a specific exchange
   */
  static async getUserCredentialsForExchange(exchangeId: string): Promise<UserExchangeCredentials | null> {
    console.log('🔍 EXCHANGE SERVICE - Fetching user credentials for exchange:', exchangeId);
    
    try {
      const response = await api.get(`/api/user/exchange-credentials/${exchangeId}`);
      const credentials = response.data.data;
      
      console.log('✅ EXCHANGE SERVICE - Exchange credentials fetched:', {
        exchangeName: credentials.exchange.name,
        isActive: credentials.is_active,
        isVerified: credentials.is_verified
      });
      
      return credentials;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('ℹ️ EXCHANGE SERVICE - No credentials found for exchange:', exchangeId);
        return null;
      }
      console.error('❌ EXCHANGE SERVICE - Error fetching exchange credentials:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch exchange credentials');
    }
  }

  /**
   * Update user credentials for an exchange
   */
  static async updateUserCredentials(
    exchangeId: string, 
    credentials: Record<string, string>
  ): Promise<UserExchangeCredentials> {
    console.log('🔄 EXCHANGE SERVICE - Updating user credentials for exchange:', exchangeId);
    
    try {
      const response = await api.put('/api/user/exchange-credentials', {
        exchange_id: exchangeId,
        credentials: credentials
      });
      
      const result = response.data.data;
      
      console.log('✅ EXCHANGE SERVICE - Credentials updated successfully:', {
        exchangeName: result.exchange.name,
        isActive: result.is_active
      });
      
      return result;
    } catch (error: any) {
      console.error('❌ EXCHANGE SERVICE - Error updating credentials:', error);
      throw new Error(error.response?.data?.message || 'Failed to update credentials');
    }
  }

  /**
   * Delete user credentials for an exchange
   */
  static async deleteCredentials(exchangeId: string): Promise<void> {
    console.log('🗑️ EXCHANGE SERVICE - Deleting user credentials for exchange:', exchangeId);
    
    try {
      await api.delete(`/api/user/exchange-credentials/${exchangeId}`);
      
      console.log('✅ EXCHANGE SERVICE - Credentials deleted successfully');
    } catch (error: any) {
      console.error('❌ EXCHANGE SERVICE - Error deleting credentials:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete credentials');
    }
  }

  /**
   * Test user credentials for an exchange
   */
  static async testCredentials(exchangeId: string): Promise<CredentialTestResult> {
    console.log('🧪 EXCHANGE SERVICE - Testing credentials for exchange:', exchangeId);
    
    try {
      const response = await api.post(`/api/user/exchange-credentials/${exchangeId}/test`);
      const result = response.data;
      
      console.log('✅ EXCHANGE SERVICE - Credentials test completed:', result);
      return result;
    } catch (error: any) {
      console.error('❌ EXCHANGE SERVICE - Error testing credentials:', error);
      const errorResult = error.response?.data || {
        success: false,
        message: 'Failed to test credentials',
        error: error.message
      };
      return errorResult;
    }
  }

  /**
   * Get exchange statistics (admin only)
   */
  static async getExchangeStats(): Promise<{
    totalExchanges: number;
    activeExchanges: number;
    totalUsersWithCredentials: number;
    exchangesWithUsers: Array<{
      exchangeId: string;
      exchangeName: string;
      userCount: number;
    }>;
  }> {
    console.log('📊 EXCHANGE SERVICE - Fetching exchange statistics...');
    
    try {
      const response = await api.get('/api/admin/exchange-stats');
      const stats = response.data.data;
      
      console.log('✅ EXCHANGE SERVICE - Statistics fetched:', stats);
      return stats;
    } catch (error: any) {
      console.error('❌ EXCHANGE SERVICE - Error fetching statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch exchange statistics');
    }
  }
}
