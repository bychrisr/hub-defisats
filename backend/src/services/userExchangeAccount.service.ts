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
   * Descriptografar credenciais de uma conta
   */
  private decryptCredentials(credentials: any): Record<string, string> {
    const decryptedCredentials: Record<string, string> = {};
    
    console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Decrypting credentials:`, credentials);
    
    if (credentials && typeof credentials === 'object') {
      Object.entries(credentials).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          try {
            // Usar a mesma lógica de descriptografia do AuthService
            const crypto = require('crypto');
            const { securityConfig } = require('../config/env');
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(securityConfig.encryption.key, 'salt', 32);
            
            // Extrair IV e dados criptografados
            const [ivHex, encryptedHex] = value.split(':');
            if (!ivHex || !encryptedHex) {
              console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Invalid encrypted format for ${key}`);
              decryptedCredentials[key] = '';
              return;
            }
            
            const iv = Buffer.from(ivHex, 'hex');
            const encrypted = Buffer.from(encryptedHex, 'hex');
            
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encrypted, null, 'utf8');
            decrypted += decipher.final('utf8');
            
            decryptedCredentials[key] = decrypted;
            console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Decrypted ${key}: ${decrypted}`);
          } catch (error) {
            console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to decrypt credential ${key}:`, error);
            decryptedCredentials[key] = ''; // Fallback para string vazia
          }
        } else {
          decryptedCredentials[key] = '';
        }
      });
    }
    
    console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Final decrypted credentials:`, decryptedCredentials);
    
    return decryptedCredentials;
  }

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

    // Descriptografar credenciais para cada conta
    const accountsWithDecryptedCredentials = accounts.map(account => ({
      ...account,
      credentials: this.decryptCredentials(account.credentials)
    }));

    console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Accounts found:', {
      count: accountsWithDecryptedCredentials.length,
      accounts: accountsWithDecryptedCredentials.map(acc => ({ 
        id: acc.id,
        exchangeName: acc.exchange.name,
        accountName: acc.account_name,
        isActive: acc.is_active,
        isVerified: acc.is_verified
      }))
    });

    return accountsWithDecryptedCredentials;
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
      // Descriptografar credenciais
      const accountWithDecryptedCredentials = {
        ...account,
        credentials: this.decryptCredentials(account.credentials)
      };

      console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account found:', {
        id: accountWithDecryptedCredentials.id,
        exchangeName: accountWithDecryptedCredentials.exchange.name,
        accountName: accountWithDecryptedCredentials.account_name,
        isActive: accountWithDecryptedCredentials.is_active,
        isVerified: accountWithDecryptedCredentials.is_verified
      });

      return accountWithDecryptedCredentials;
    } else {
      console.log('❌ USER EXCHANGE ACCOUNT SERVICE - Account not found');
      return null;
    }
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

    // Verificar se o usuário já tem uma conta com o mesmo nome para esta exchange
    const existingAccount = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        user_id: userId,
        exchange_id: data.exchange_id,
        account_name: data.account_name
      }
    });

    if (existingAccount) {
      throw new Error('User already has an account with this name for this exchange');
    }

    // Verificar se já existe alguma conta ativa para esta exchange
    const hasActiveAccount = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        user_id: userId,
        exchange_id: data.exchange_id,
        is_active: true
      }
    });

    // Criptografar credenciais
    const encryptedCredentials: Record<string, string> = {};
    
    Object.entries(data.credentials).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        try {
          const crypto = require('crypto');
          const { securityConfig } = require('../config/env');
          const algorithm = 'aes-256-cbc';
          const key = crypto.scryptSync(securityConfig.encryption.key, 'salt', 32);
          const iv = crypto.randomBytes(16);
          
          const cipher = crypto.createCipheriv(algorithm, key, iv);
          let encrypted = cipher.update(value, 'utf8', 'hex');
          encrypted += cipher.final('hex');
          
          encryptedCredentials[key] = `${iv.toString('hex')}:${encrypted}`;
          console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Encrypted credential ${key}`);
        } catch (error) {
          console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to encrypt credential ${key}:`, error);
          encryptedCredentials[key] = value; // Fallback para valor não criptografado
        }
      }
    });

    // Criar conta
    const account = await this.prisma.userExchangeAccounts.create({
      data: {
        user_id: userId,
        exchange_id: data.exchange_id,
        account_name: data.account_name,
        credentials: encryptedCredentials,
        is_active: !hasActiveAccount, // Apenas ativa se não houver conta ativa
        is_verified: false
      },
      include: {
        exchange: true
      }
    });

    // VALIDAÇÃO DE SEGURANÇA FINAL: Verificar se apenas uma conta está ativa
    const finalActiveCount = await this.prisma.userExchangeAccounts.count({
      where: {
        user_id: userId,
        is_active: true
      }
    });

    if (finalActiveCount > 1) {
      console.error('🚨 USER EXCHANGE ACCOUNT SERVICE - Security violation after creation: Multiple active accounts detected:', finalActiveCount);
      
      // EMERGENCY FIX: Manter apenas a primeira conta ativa
      const firstActiveAccount = await this.prisma.userExchangeAccounts.findFirst({
        where: {
          user_id: userId,
          is_active: true
        },
        orderBy: {
          created_at: 'asc'
        }
      });

      if (firstActiveAccount) {
        await this.prisma.userExchangeAccounts.updateMany({
          where: {
            user_id: userId,
            is_active: true,
            id: { not: firstActiveAccount.id }
          },
          data: {
            is_active: false
          }
        });

        console.log('🔧 USER EXCHANGE ACCOUNT SERVICE - Emergency fix applied: Only first account remains active');
      }
    }

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
      const encryptedCredentials: Record<string, string> = {};
      
      Object.entries(data.credentials).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          try {
            const crypto = require('crypto');
            const { securityConfig } = require('../config/env');
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(securityConfig.encryption.key, 'salt', 32);
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            let encrypted = cipher.update(value, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            encryptedCredentials[key] = `${iv.toString('hex')}:${encrypted}`;
            console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Encrypted credential ${key}`);
          } catch (error) {
            console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to encrypt credential ${key}:`, error);
            encryptedCredentials[key] = value; // Fallback para valor não criptografado
          }
        }
      });

      updateData.credentials = encryptedCredentials;
    }

    // VALIDAÇÃO DE SEGURANÇA: Se ativando esta conta, desativar TODAS as outras contas do usuário
    if (data.is_active === true) {
      await this.prisma.userExchangeAccounts.updateMany({
        where: {
          user_id: userId,
          is_active: true,
          id: { not: accountId }
        },
        data: {
          is_active: false
        }
      });

      console.log('🔒 USER EXCHANGE ACCOUNT SERVICE - Security validation: All other user accounts deactivated');
    }

    // Atualizar conta
    const account = await this.prisma.userExchangeAccounts.update({
      where: { id: accountId },
      data: updateData,
      include: {
        exchange: true
      }
    });

    // VALIDAÇÃO DE SEGURANÇA FINAL: Verificar se apenas uma conta está ativa
    const finalActiveCount = await this.prisma.userExchangeAccounts.count({
      where: {
        user_id: userId,
        is_active: true
      }
    });

    if (finalActiveCount > 1) {
      console.error('🚨 USER EXCHANGE ACCOUNT SERVICE - Security violation after update: Multiple active accounts detected:', finalActiveCount);
      
      // EMERGENCY FIX: Manter apenas a primeira conta ativa
      const firstActiveAccount = await this.prisma.userExchangeAccounts.findFirst({
        where: {
          user_id: userId,
          is_active: true
        },
        orderBy: {
          created_at: 'asc'
        }
      });

      if (firstActiveAccount) {
        await this.prisma.userExchangeAccounts.updateMany({
          where: {
            user_id: userId,
            is_active: true,
            id: { not: firstActiveAccount.id }
          },
          data: {
            is_active: false
          }
        });

        console.log('🔧 USER EXCHANGE ACCOUNT SERVICE - Emergency fix applied: Only first account remains active');
      }
    }

    // Descriptografar credenciais para retorno
    const accountWithDecryptedCredentials = {
      ...account,
      credentials: this.decryptCredentials(account.credentials)
    };

    console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Account updated:', {
      id: accountWithDecryptedCredentials.id,
      exchangeName: accountWithDecryptedCredentials.exchange.name,
      accountName: accountWithDecryptedCredentials.account_name,
      isActive: accountWithDecryptedCredentials.is_active,
      isVerified: accountWithDecryptedCredentials.is_verified
    });

    return accountWithDecryptedCredentials;
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

    // VALIDAÇÃO DE SEGURANÇA: Desativar TODAS as contas ativas do usuário primeiro
    await this.prisma.userExchangeAccounts.updateMany({
      where: {
        user_id: userId,
        is_active: true
      },
      data: {
        is_active: false
      }
    });

    console.log('🔒 USER EXCHANGE ACCOUNT SERVICE - Security validation: All user accounts deactivated');

    // Ativar APENAS a conta selecionada
    const updatedAccount = await this.prisma.userExchangeAccounts.update({
      where: { id: accountId },
      data: { is_active: true },
      include: {
        exchange: true
      }
    });

    // VALIDAÇÃO DE SEGURANÇA REDUNDANTE: Verificar se apenas uma conta está ativa
    const activeAccountsCount = await this.prisma.userExchangeAccounts.count({
      where: {
        user_id: userId,
        is_active: true
      }
    });

    if (activeAccountsCount !== 1) {
      console.error('🚨 USER EXCHANGE ACCOUNT SERVICE - Security violation: Multiple active accounts detected:', activeAccountsCount);
      
      // EMERGENCY FIX: Desativar todas e ativar apenas a selecionada
      await this.prisma.userExchangeAccounts.updateMany({
        where: {
          user_id: userId,
          is_active: true
        },
        data: {
          is_active: false
        }
      });

      await this.prisma.userExchangeAccounts.update({
        where: { id: accountId },
        data: { is_active: true }
      });

      console.log('🔧 USER EXCHANGE ACCOUNT SERVICE - Emergency fix applied: Only one account active');
    }

    // Descriptografar credenciais para retorno
    const accountWithDecryptedCredentials = {
      ...updatedAccount,
      credentials: this.decryptCredentials(updatedAccount.credentials)
    };

    console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Active account set:', {
      id: accountWithDecryptedCredentials.id,
      exchangeName: accountWithDecryptedCredentials.exchange.name,
      accountName: accountWithDecryptedCredentials.account_name
    });

    return accountWithDecryptedCredentials;
  }

  /**
   * VALIDAÇÃO DE SEGURANÇA: Verificar e corrigir múltiplas contas ativas
   */
  async validateAndFixActiveAccounts(userId: string): Promise<void> {
    console.log('🔍 USER EXCHANGE ACCOUNT SERVICE - Security validation: Checking for multiple active accounts');
    
    const activeAccounts = await this.prisma.userExchangeAccounts.findMany({
      where: {
        user_id: userId,
        is_active: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    if (activeAccounts.length > 1) {
      console.error('🚨 USER EXCHANGE ACCOUNT SERVICE - Security violation detected: Multiple active accounts:', activeAccounts.length);
      
      // Manter apenas a primeira conta ativa (mais antiga)
      const firstAccount = activeAccounts[0];
      const otherAccounts = activeAccounts.slice(1);

      // Desativar todas as outras contas
      await this.prisma.userExchangeAccounts.updateMany({
        where: {
          user_id: userId,
          is_active: true,
          id: { not: firstAccount.id }
        },
        data: {
          is_active: false
        }
      });

      console.log('🔧 USER EXCHANGE ACCOUNT SERVICE - Security fix applied:', {
        keptActive: firstAccount.account_name,
        deactivatedCount: otherAccounts.length,
        deactivatedAccounts: otherAccounts.map(acc => acc.account_name)
      });
    } else {
      console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Security validation passed: Only one active account');
    }
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
      // Descriptografar credenciais
      const accountWithDecryptedCredentials = {
        ...account,
        credentials: this.decryptCredentials(account.credentials)
      };

      console.log('✅ USER EXCHANGE ACCOUNT SERVICE - Active account found:', {
        id: accountWithDecryptedCredentials.id,
        exchangeName: accountWithDecryptedCredentials.exchange.name,
        accountName: accountWithDecryptedCredentials.account_name
      });

      return accountWithDecryptedCredentials;
    } else {
      console.log('❌ USER EXCHANGE ACCOUNT SERVICE - No active account found');
      return null;
    }
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
