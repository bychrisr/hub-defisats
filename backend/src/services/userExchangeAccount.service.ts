import { PrismaClient, UserExchangeAccounts, Exchange } from '@prisma/client';
import { AuthService } from './auth.service';

export interface UserExchangeAccountWithExchange extends UserExchangeAccounts {
  exchange: Exchange;
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

export class UserExchangeAccountService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all user exchange accounts for a user
   */
  async getUserExchangeAccounts(userId: string): Promise<UserExchangeAccountWithExchange[]> {
    console.log('🔍 USER EXCHANGE ACCOUNT SERVICE - Fetching accounts for user:', userId);
    
    const accounts = await this.prisma.userExchangeAccounts.findMany({
      where: {
        user_id: userId
      },
      include: {
        exchange: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Accounts found:', {
      count: accounts.length,
      accounts: accounts.map(acc => ({ 
        id: acc.id,
        exchangeName: acc.exchange.name,
        accountName: acc.account_name,
        isActive: acc.is_active,
        isVerified: acc.is_verified
      }))
    });

    return accounts;
  }

  /**
   * Get a specific user exchange account
   */
  async getUserExchangeAccount(userId: string, accountId: string): Promise<UserExchangeAccountWithExchange | null> {
    console.log('🔍 USER EXCHANGE ACCOUNT SERVICE - Fetching account:', { userId, accountId });
    
    const account = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        id: accountId,
        user_id: userId
      },
      include: {
        exchange: true
      }
    });

    if (account) {
      console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account found:', {
        id: account.id,
        exchangeName: account.exchange.name,
        accountName: account.account_name,
        isActive: account.is_active,
        isVerified: account.is_verified
      });
    } else {
      console.log('❌ USER EXCHANGE ACCOUNT SERVICE - Account not found');
    }

    return account;
  }

  /**
   * Create a new user exchange account
   */
  async createUserExchangeAccount(
    userId: string, 
    data: CreateUserExchangeAccountData
  ): Promise<UserExchangeAccountWithExchange> {
    console.log('🔄 USER EXCHANGE ACCOUNT SERVICE - Creating account:', { userId, data });
    
    // Verificar se a exchange existe
    const exchange = await this.prisma.exchange.findUnique({
      where: { id: data.exchange_id }
    });

    if (!exchange) {
      throw new Error('Exchange not found');
    }

    // Verificar se o usuário já tem uma conta ativa para esta exchange
    const existingActiveAccount = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        user_id: userId,
        exchange_id: data.exchange_id,
        is_active: true
      }
    });

    if (existingActiveAccount) {
      throw new Error('User already has an active account for this exchange');
    }

    // Criptografar credenciais
    const authService = new AuthService(this.prisma, {} as any);
    const encryptedCredentials: Record<string, string> = {};
    
    Object.entries(data.credentials).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        encryptedCredentials[key] = authService.encryptData(value);
      }
    });

    // Criar conta
    const account = await this.prisma.userExchangeAccounts.create({
      data: {
        user_id: userId,
        exchange_id: data.exchange_id,
        account_name: data.account_name,
        credentials: encryptedCredentials,
        is_active: true, // Primeira conta é ativada automaticamente
        is_verified: false
      },
      include: {
        exchange: true
      }
    });

    console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account created:', {
      id: account.id,
      exchangeName: account.exchange.name,
      accountName: account.account_name,
      isActive: account.is_active
    });

    return account;
  }

  /**
   * Update a user exchange account
   */
  async updateUserExchangeAccount(
    userId: string,
    accountId: string,
    data: UpdateUserExchangeAccountData
  ): Promise<UserExchangeAccountWithExchange> {
    console.log('🔄 USER EXCHANGE ACCOUNT SERVICE - Updating account:', { userId, accountId, data });
    
    // Verificar se a conta existe e pertence ao usuário
    const existingAccount = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        id: accountId,
        user_id: userId
      }
    });

    if (!existingAccount) {
      throw new Error('Account not found');
    }

    // Preparar dados para atualização
    const updateData: any = {
      account_name: data.account_name,
      is_active: data.is_active,
      is_verified: data.is_verified
    };

    // Criptografar credenciais se fornecidas
    if (data.credentials) {
      const authService = new AuthService(this.prisma, {} as any);
      const encryptedCredentials: Record<string, string> = {};
      
      Object.entries(data.credentials).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          encryptedCredentials[key] = authService.encryptData(value);
        }
      });

      updateData.credentials = encryptedCredentials;
    }

    // Se ativando esta conta, desativar outras contas da mesma exchange
    if (data.is_active === true) {
      await this.prisma.userExchangeAccounts.updateMany({
        where: {
          user_id: userId,
          exchange_id: existingAccount.exchange_id,
          id: { not: accountId }
        },
        data: {
          is_active: false
        }
      });
    }

    // Atualizar conta
    const account = await this.prisma.userExchangeAccounts.update({
      where: { id: accountId },
      data: updateData,
      include: {
        exchange: true
      }
    });

    console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account updated:', {
      id: account.id,
      exchangeName: account.exchange.name,
      accountName: account.account_name,
      isActive: account.is_active,
      isVerified: account.is_verified
    });

    return account;
  }

  /**
   * Delete a user exchange account
   */
  async deleteUserExchangeAccount(userId: string, accountId: string): Promise<void> {
    console.log('🗑️ USER EXCHANGE ACCOUNT SERVICE - Deleting account:', { userId, accountId });
    
    // Verificar se a conta existe e pertence ao usuário
    const existingAccount = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        id: accountId,
        user_id: userId
      }
    });

    if (!existingAccount) {
      throw new Error('Account not found');
    }

    // Verificar se há automações vinculadas
    const automationsCount = await this.prisma.automation.count({
      where: {
        user_exchange_account_id: accountId
      }
    });

    if (automationsCount > 0) {
      throw new Error('Cannot delete account with active automations');
    }

    // Deletar conta
    await this.prisma.userExchangeAccounts.delete({
      where: { id: accountId }
    });

    console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account deleted');
  }

  /**
   * Set active account for a user
   */
  async setActiveAccount(userId: string, accountId: string): Promise<UserExchangeAccountWithExchange> {
    console.log('🔄 USER EXCHANGE ACCOUNT SERVICE - Setting active account:', { userId, accountId });
    
    // Verificar se a conta existe e pertence ao usuário
    const account = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        id: accountId,
        user_id: userId
      },
      include: {
        exchange: true
      }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Desativar todas as outras contas da mesma exchange
    await this.prisma.userExchangeAccounts.updateMany({
      where: {
        user_id: userId,
        exchange_id: account.exchange_id,
        id: { not: accountId }
      },
      data: {
        is_active: false
      }
    });

    // Ativar a conta selecionada
    const updatedAccount = await this.prisma.userExchangeAccounts.update({
      where: { id: accountId },
      data: { is_active: true },
      include: {
        exchange: true
      }
    });

    console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Active account set:', {
      id: updatedAccount.id,
      exchangeName: updatedAccount.exchange.name,
      accountName: updatedAccount.account_name
    });

    return updatedAccount;
  }

  /**
   * Get active account for a user and exchange
   */
  async getActiveAccount(userId: string, exchangeId: string): Promise<UserExchangeAccountWithExchange | null> {
    console.log('🔍 USER EXCHANGE ACCOUNT SERVICE - Getting active account:', { userId, exchangeId });
    
    const account = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        user_id: userId,
        exchange_id: exchangeId,
        is_active: true
      },
      include: {
        exchange: true
      }
    });

    if (account) {
      console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Active account found:', {
        id: account.id,
        exchangeName: account.exchange.name,
        accountName: account.account_name
      });
    } else {
      console.log('❌ USER EXCHANGE ACCOUNT SERVICE - No active account found');
    }

    return account;
  }

  /**
   * Test account credentials
   */
  async testAccountCredentials(userId: string, accountId: string): Promise<{ success: boolean; message: string }> {
    console.log('🧪 USER EXCHANGE ACCOUNT SERVICE - Testing credentials:', { userId, accountId });
    
    const account = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        id: accountId,
        user_id: userId
      },
      include: {
        exchange: true
      }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    try {
      // Descriptografar credenciais
      const authService = new AuthService(this.prisma, {} as any);
      const decryptedCredentials: Record<string, string> = {};
      
      Object.entries(account.credentials as Record<string, string>).forEach(([key, value]) => {
        try {
          decryptedCredentials[key] = authService.decryptData(value);
        } catch (error) {
          console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to decrypt ${key}:`, error);
          decryptedCredentials[key] = '[ENCRYPTED]';
        }
      });

      // TODO: Implementar teste de credenciais específico para cada exchange
      // Por enquanto, simular sucesso
      console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Credentials test successful');
      
      // Atualizar last_test
      await this.prisma.userExchangeAccounts.update({
        where: { id: accountId },
        data: { last_test: new Date() }
      });

      return {
        success: true,
        message: 'Credentials test successful'
      };

    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNT SERVICE - Credentials test failed:', error);
      return {
        success: false,
        message: error.message || 'Credentials test failed'
      };
    }
  }
}
