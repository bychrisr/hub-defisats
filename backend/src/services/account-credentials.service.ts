/**
 * Account Credentials Service - Multi-Account System
 * 
 * Serviço responsável por gerenciar credenciais de contas de exchange no sistema multi-account.
 * Implementa cache de credenciais por conta, validação antes da execução e integração
 * com UserExchangeAccountService para busca de credenciais da conta ativa.
 */

import { PrismaClient } from '@prisma/client';
import { UserExchangeAccountService } from './userExchangeAccount.service';
import { CredentialCacheService } from './credential-cache.service';
import { Redis } from 'ioredis';

// Create Redis connection for caching
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Create credential cache service
const credentialCache = new CredentialCacheService(redis);

// Interface for account credentials
export interface AccountCredentials {
  userId: string;
  accountId: string;
  accountName: string;
  exchangeName: string;
  credentials: Record<string, string>;
  isActive: boolean;
  lastValidated?: Date;
  validationStatus: 'valid' | 'invalid' | 'pending' | 'expired';
}

// Interface for credential validation result
export interface CredentialValidationResult {
  isValid: boolean;
  accountId: string;
  accountName: string;
  exchangeName: string;
  errors: string[];
  lastValidated: Date;
}

// Interface for cache statistics
export interface CredentialCacheStats {
  totalCached: number;
  activeAccounts: number;
  expiredCredentials: number;
  validationFailures: number;
  cacheHitRate: number;
}

export class AccountCredentialsService {
  private prisma: PrismaClient;
  private userExchangeAccountService: UserExchangeAccountService;
  private credentialCache: CredentialCacheService;
  private validationCache: Map<string, CredentialValidationResult> = new Map();
  private readonly VALIDATION_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.userExchangeAccountService = new UserExchangeAccountService(prisma);
    this.credentialCache = credentialCache;
  }

  /**
   * Get credentials for user's active account
   */
  async getActiveAccountCredentials(userId: string): Promise<AccountCredentials | null> {
    try {
      console.log(`🔍 ACCOUNT CREDENTIALS - Getting active account credentials for user ${userId}`);
      
      // Get user's accounts
      const userAccounts = await this.userExchangeAccountService.getUserExchangeAccounts(userId);
      const activeAccount = userAccounts.find(account => account.is_active);
      
      if (!activeAccount) {
        console.warn(`❌ ACCOUNT CREDENTIALS - No active account found for user ${userId}`);
        return null;
      }
      
      console.log(`✅ ACCOUNT CREDENTIALS - Found active account: ${activeAccount.account_name} (${activeAccount.exchange.name})`);
      
      // Check cache first
      const cacheKey = `credentials-${userId}-${activeAccount.id}`;
      const cachedCredentials = await this.credentialCache.get(cacheKey);
      
      if (cachedCredentials) {
        console.log(`✅ ACCOUNT CREDENTIALS - Credentials found in cache for account ${activeAccount.account_name}`);
        return {
          userId,
          accountId: activeAccount.id,
          accountName: activeAccount.account_name,
          exchangeName: activeAccount.exchange.name,
          credentials: cachedCredentials,
          isActive: activeAccount.is_active,
          lastValidated: new Date(),
          validationStatus: 'valid'
        };
      }
      
      // Get credentials from database (already decrypted by UserExchangeAccountService)
      const credentials = activeAccount.credentials;
      
      if (!credentials || Object.keys(credentials).length === 0) {
        console.warn(`❌ ACCOUNT CREDENTIALS - Account ${activeAccount.account_name} has no credentials`);
        return null;
      }
      
      // Validate credentials are not empty
      const hasValidCredentials = Object.values(credentials).some(value =>
        value && typeof value === 'string' && value.trim() !== ''
      );
      
      if (!hasValidCredentials) {
        console.warn(`❌ ACCOUNT CREDENTIALS - Account ${activeAccount.account_name} has empty credentials`);
        return null;
      }
      
      // Cache the credentials
      await this.credentialCache.set(cacheKey, credentials, this.CACHE_TTL);
      console.log(`✅ ACCOUNT CREDENTIALS - Credentials cached for account ${activeAccount.account_name}`);
      
      return {
        userId,
        accountId: activeAccount.id,
        accountName: activeAccount.account_name,
        exchangeName: activeAccount.exchange.name,
        credentials,
        isActive: activeAccount.is_active,
        lastValidated: new Date(),
        validationStatus: 'valid'
      };
      
    } catch (error) {
      console.error(`❌ ACCOUNT CREDENTIALS - Failed to get active account credentials for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get credentials for specific account
   */
  async getAccountCredentials(userId: string, accountId: string): Promise<AccountCredentials | null> {
    try {
      console.log(`🔍 ACCOUNT CREDENTIALS - Getting credentials for account ${accountId} of user ${userId}`);
      
      // Get specific account
      const account = await this.userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      
      if (!account) {
        console.warn(`❌ ACCOUNT CREDENTIALS - Account ${accountId} not found for user ${userId}`);
        return null;
      }
      
      console.log(`✅ ACCOUNT CREDENTIALS - Found account: ${account.account_name} (${account.exchange.name})`);
      
      // Check cache first
      const cacheKey = `credentials-${userId}-${accountId}`;
      const cachedCredentials = await this.credentialCache.get(cacheKey);
      
      if (cachedCredentials) {
        console.log(`✅ ACCOUNT CREDENTIALS - Credentials found in cache for account ${account.account_name}`);
        return {
          userId,
          accountId: account.id,
          accountName: account.account_name,
          exchangeName: account.exchange.name,
          credentials: cachedCredentials,
          isActive: account.is_active,
          lastValidated: new Date(),
          validationStatus: 'valid'
        };
      }
      
      // Get credentials from database (already decrypted by UserExchangeAccountService)
      const credentials = account.credentials;
      
      if (!credentials || Object.keys(credentials).length === 0) {
        console.warn(`❌ ACCOUNT CREDENTIALS - Account ${account.account_name} has no credentials`);
        return null;
      }
      
      // Validate credentials are not empty
      const hasValidCredentials = Object.values(credentials).some(value =>
        value && typeof value === 'string' && value.trim() !== ''
      );
      
      if (!hasValidCredentials) {
        console.warn(`❌ ACCOUNT CREDENTIALS - Account ${account.account_name} has empty credentials`);
        return null;
      }
      
      // Cache the credentials
      await this.credentialCache.set(cacheKey, credentials, this.CACHE_TTL);
      console.log(`✅ ACCOUNT CREDENTIALS - Credentials cached for account ${account.account_name}`);
      
      return {
        userId,
        accountId: account.id,
        accountName: account.account_name,
        exchangeName: account.exchange.name,
        credentials,
        isActive: account.is_active,
        lastValidated: new Date(),
        validationStatus: 'valid'
      };
      
    } catch (error) {
      console.error(`❌ ACCOUNT CREDENTIALS - Failed to get credentials for account ${accountId}:`, error);
      return null;
    }
  }

  /**
   * Validate credentials before execution
   */
  async validateCredentials(userId: string, accountId: string): Promise<CredentialValidationResult> {
    try {
      console.log(`🔍 ACCOUNT CREDENTIALS - Validating credentials for account ${accountId} of user ${userId}`);
      
      // Check validation cache first
      const validationKey = `validation-${userId}-${accountId}`;
      const cachedValidation = this.validationCache.get(validationKey);
      
      if (cachedValidation && this.isValidationCacheValid(cachedValidation.lastValidated)) {
        console.log(`✅ ACCOUNT CREDENTIALS - Validation found in cache for account ${accountId}`);
        return cachedValidation;
      }
      
      // Get account credentials
      const accountCredentials = await this.getAccountCredentials(userId, accountId);
      
      if (!accountCredentials) {
        const result: CredentialValidationResult = {
          isValid: false,
          accountId,
          accountName: 'Unknown',
          exchangeName: 'Unknown',
          errors: ['Account not found or no credentials'],
          lastValidated: new Date()
        };
        
        this.validationCache.set(validationKey, result);
        return result;
      }
      
      // Validate credentials structure
      const errors: string[] = [];
      
      // Check if credentials exist
      if (!accountCredentials.credentials || Object.keys(accountCredentials.credentials).length === 0) {
        errors.push('No credentials found');
      }
      
      // Check if credentials are not empty
      const hasValidCredentials = Object.values(accountCredentials.credentials).some(value =>
        value && typeof value === 'string' && value.trim() !== ''
      );
      
      if (!hasValidCredentials) {
        errors.push('Credentials are empty or invalid');
      }
      
      // Check if account is active
      if (!accountCredentials.isActive) {
        errors.push('Account is not active');
      }
      
      const result: CredentialValidationResult = {
        isValid: errors.length === 0,
        accountId: accountCredentials.accountId,
        accountName: accountCredentials.accountName,
        exchangeName: accountCredentials.exchangeName,
        errors,
        lastValidated: new Date()
      };
      
      // Cache the validation result
      this.validationCache.set(validationKey, result);
      
      if (result.isValid) {
        console.log(`✅ ACCOUNT CREDENTIALS - Credentials validated successfully for account ${accountCredentials.accountName}`);
      } else {
        console.warn(`❌ ACCOUNT CREDENTIALS - Credentials validation failed for account ${accountCredentials.accountName}: ${errors.join(', ')}`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ ACCOUNT CREDENTIALS - Failed to validate credentials for account ${accountId}:`, error);
      
      const result: CredentialValidationResult = {
        isValid: false,
        accountId,
        accountName: 'Unknown',
        exchangeName: 'Unknown',
        errors: [error.message || 'Validation failed'],
        lastValidated: new Date()
      };
      
      return result;
    }
  }

  /**
   * Clear credentials cache for specific account
   */
  async clearAccountCredentialsCache(userId: string, accountId: string): Promise<void> {
    try {
      console.log(`🧹 ACCOUNT CREDENTIALS - Clearing credentials cache for account ${accountId} of user ${userId}`);
      
      const cacheKey = `credentials-${userId}-${accountId}`;
      await this.credentialCache.delete(cacheKey);
      
      const validationKey = `validation-${userId}-${accountId}`;
      this.validationCache.delete(validationKey);
      
      console.log(`✅ ACCOUNT CREDENTIALS - Cache cleared for account ${accountId}`);
      
    } catch (error) {
      console.error(`❌ ACCOUNT CREDENTIALS - Failed to clear cache for account ${accountId}:`, error);
    }
  }

  /**
   * Clear all credentials cache for user
   */
  async clearUserCredentialsCache(userId: string): Promise<void> {
    try {
      console.log(`🧹 ACCOUNT CREDENTIALS - Clearing all credentials cache for user ${userId}`);
      
      // Get user's accounts
      const userAccounts = await this.userExchangeAccountService.getUserExchangeAccounts(userId);
      
      for (const account of userAccounts) {
        await this.clearAccountCredentialsCache(userId, account.id);
      }
      
      console.log(`✅ ACCOUNT CREDENTIALS - All cache cleared for user ${userId}`);
      
    } catch (error) {
      console.error(`❌ ACCOUNT CREDENTIALS - Failed to clear all cache for user ${userId}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CredentialCacheStats> {
    try {
      console.log(`📊 ACCOUNT CREDENTIALS - Getting cache statistics`);
      
      // Get total cached credentials
      const totalCached = this.validationCache.size;
      
      // Get active accounts count
      const activeAccounts = Array.from(this.validationCache.values()).filter(
        validation => validation.isValid
      ).length;
      
      // Get expired credentials count
      const expiredCredentials = Array.from(this.validationCache.values()).filter(
        validation => !this.isValidationCacheValid(validation.lastValidated)
      ).length;
      
      // Get validation failures count
      const validationFailures = Array.from(this.validationCache.values()).filter(
        validation => !validation.isValid
      ).length;
      
      // Calculate cache hit rate (simplified)
      const cacheHitRate = totalCached > 0 ? (activeAccounts / totalCached) * 100 : 0;
      
      const stats: CredentialCacheStats = {
        totalCached,
        activeAccounts,
        expiredCredentials,
        validationFailures,
        cacheHitRate
      };
      
      console.log(`📊 ACCOUNT CREDENTIALS - Cache stats: ${JSON.stringify(stats)}`);
      
      return stats;
      
    } catch (error) {
      console.error(`❌ ACCOUNT CREDENTIALS - Failed to get cache stats:`, error);
      
      return {
        totalCached: 0,
        activeAccounts: 0,
        expiredCredentials: 0,
        validationFailures: 0,
        cacheHitRate: 0
      };
    }
  }

  /**
   * Check if validation cache is still valid
   */
  private isValidationCacheValid(lastValidated: Date): boolean {
    const now = new Date();
    const diff = now.getTime() - lastValidated.getTime();
    return diff < this.VALIDATION_TTL;
  }

  /**
   * Cleanup expired validations
   */
  async cleanupExpiredValidations(): Promise<void> {
    try {
      console.log(`🧹 ACCOUNT CREDENTIALS - Cleaning up expired validations`);
      
      const now = new Date();
      let cleanedCount = 0;
      
      for (const [key, validation] of this.validationCache) {
        if (!this.isValidationCacheValid(validation.lastValidated)) {
          this.validationCache.delete(key);
          cleanedCount++;
        }
      }
      
      console.log(`✅ ACCOUNT CREDENTIALS - Cleaned up ${cleanedCount} expired validations`);
      
    } catch (error) {
      console.error(`❌ ACCOUNT CREDENTIALS - Failed to cleanup expired validations:`, error);
    }
  }

  /**
   * Get all user accounts with credentials status
   */
  async getUserAccountsWithCredentialsStatus(userId: string): Promise<{
    accounts: AccountCredentials[];
    activeAccount: AccountCredentials | null;
    totalAccounts: number;
    validAccounts: number;
  }> {
    try {
      console.log(`🔍 ACCOUNT CREDENTIALS - Getting all accounts with credentials status for user ${userId}`);
      
      // Get user's accounts
      const userAccounts = await this.userExchangeAccountService.getUserExchangeAccounts(userId);
      
      const accounts: AccountCredentials[] = [];
      let activeAccount: AccountCredentials | null = null;
      let validAccounts = 0;
      
      for (const account of userAccounts) {
        const accountCredentials = await this.getAccountCredentials(userId, account.id);
        
        if (accountCredentials) {
          accounts.push(accountCredentials);
          validAccounts++;
          
          if (account.is_active) {
            activeAccount = accountCredentials;
          }
        }
      }
      
      const result = {
        accounts,
        activeAccount,
        totalAccounts: userAccounts.length,
        validAccounts
      };
      
      console.log(`✅ ACCOUNT CREDENTIALS - Found ${accounts.length} accounts with credentials for user ${userId}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ ACCOUNT CREDENTIALS - Failed to get accounts with credentials status for user ${userId}:`, error);
      
      return {
        accounts: [],
        activeAccount: null,
        totalAccounts: 0,
        validAccounts: 0
      };
    }
  }
}

// Cleanup function for expired validations
setInterval(async () => {
  try {
    const service = new AccountCredentialsService(prisma);
    await service.cleanupExpiredValidations();
  } catch (error) {
    console.error(`❌ ACCOUNT CREDENTIALS - Error during cleanup:`, error);
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

console.log('🚀 ACCOUNT CREDENTIALS - Multi-account credentials service started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 ACCOUNT CREDENTIALS - Shutting down credentials service...');
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 ACCOUNT CREDENTIALS - Shutting down credentials service...');
  await redis.disconnect();
  process.exit(0);
});

export { AccountCredentialsService };
