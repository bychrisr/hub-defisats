import { api } from '@/lib/api';

export interface UserExchangeAccount {
  id: string;
  exchange_id: string;
  exchange: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  account_name: string;
  is_active: boolean;
  is_verified: boolean;
  last_test?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserExchangeAccountData {
  exchange_id: string;
  account_name: string;
  credentials: Record<string, string>;
}

export interface UpdateUserExchangeAccountData {
  account_name?: string;
  credentials?: Record<string, string>;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface CredentialTestResult {
  success: boolean;
  message: string;
}

export class UserExchangeAccountService {
  /**
   * Get all user exchange accounts
   */
  static async getUserExchangeAccounts(): Promise<UserExchangeAccount[]> {
    console.log('🔍 USER EXCHANGE ACCOUNT SERVICE - Fetching user accounts...');
    
    try {
      const response = await api.get('/user/exchange-accounts');
      
      if (response.data.success) {
        console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Accounts fetched:', {
          count: response.data.data.length,
          accounts: response.data.data.map((acc: UserExchangeAccount) => ({
            id: acc.id,
            exchangeName: acc.exchange.name,
            accountName: acc.account_name,
            isActive: acc.is_active
          }))
        });
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch accounts');
      }
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT SERVICE - Error fetching accounts:', error);
      throw error;
    }
  }

  /**
   * Get a specific user exchange account
   */
  static async getUserExchangeAccount(accountId: string): Promise<UserExchangeAccount> {
    console.log('🔍 USER EXCHANGE ACCOUNT SERVICE - Fetching account:', accountId);
    
    try {
      const response = await api.get(`/user/exchange-accounts/${accountId}`);
      
      if (response.data.success) {
        console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account fetched:', {
          id: response.data.data.id,
          exchangeName: response.data.data.exchange.name,
          accountName: response.data.data.account_name,
          isActive: response.data.data.is_active
        });
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch account');
      }
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT SERVICE - Error fetching account:', error);
      throw error;
    }
  }

  /**
   * Create a new user exchange account
   */
  static async createUserExchangeAccount(data: CreateUserExchangeAccountData): Promise<UserExchangeAccount> {
    console.log('🔄 USER EXCHANGE ACCOUNT SERVICE - Creating account:', {
      exchangeId: data.exchange_id,
      accountName: data.account_name
    });
    
    try {
      const response = await api.post('/user/exchange-accounts', data);
      
      if (response.data.success) {
        console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account created:', {
          id: response.data.data.id,
          exchangeName: response.data.data.exchange.name,
          accountName: response.data.data.account_name,
          isActive: response.data.data.is_active
        });
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT SERVICE - Error creating account:', error);
      throw error;
    }
  }

  /**
   * Update a user exchange account
   */
  static async updateUserExchangeAccount(
    accountId: string, 
    data: UpdateUserExchangeAccountData
  ): Promise<UserExchangeAccount> {
    console.log('🔄 USER EXCHANGE ACCOUNT SERVICE - Updating account:', {
      accountId,
      data
    });
    
    try {
      const response = await api.put(`/user/exchange-accounts/${accountId}`, data);
      
      if (response.data.success) {
        console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account updated:', {
          id: response.data.data.id,
          exchangeName: response.data.data.exchange.name,
          accountName: response.data.data.account_name,
          isActive: response.data.data.is_active
        });
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update account');
      }
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT SERVICE - Error updating account:', error);
      throw error;
    }
  }

  /**
   * Delete a user exchange account
   */
  static async deleteUserExchangeAccount(accountId: string): Promise<void> {
    console.log('🗑️ USER EXCHANGE ACCOUNT SERVICE - Deleting account:', accountId);
    
    try {
      const response = await api.delete(`/user/exchange-accounts/${accountId}`);
      
      if (response.data.success) {
        console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account deleted');
      } else {
        throw new Error(response.data.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT SERVICE - Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Set active account
   */
  static async setActiveAccount(accountId: string): Promise<UserExchangeAccount> {
    console.log('🔄 USER EXCHANGE ACCOUNT SERVICE - Setting active account:', accountId);
    
    try {
      const response = await api.post(`/user/exchange-accounts/${accountId}/set-active`);
      
      if (response.data.success) {
        console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Active account set:', {
          id: response.data.data.id,
          exchangeName: response.data.data.exchange.name,
          accountName: response.data.data.account_name
        });
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to set active account');
      }
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT SERVICE - Error setting active account:', error);
      throw error;
    }
  }

  /**
   * Test account credentials
   */
  static async testAccountCredentials(accountId: string): Promise<CredentialTestResult> {
    console.log('🧪 USER EXCHANGE ACCOUNT SERVICE - Testing credentials:', accountId);
    
    try {
      const response = await api.post(`/user/exchange-accounts/${accountId}/test`);
      
      if (response.data.success) {
        console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Credentials test result:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to test credentials');
      }
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT SERVICE - Error testing credentials:', error);
      throw error;
    }
  }
}
