import { PrismaClient } from '@prisma/client';
import { AccountCredentialsService } from './account-credentials.service';
import { UserExchangeAccountService } from './userExchangeAccount.service';
import { CredentialTestService } from './credential-test.service';

export interface AutomationCredentialValidationResult {
  isValid: boolean;
  accountId: string;
  accountName: string;
  exchangeName: string;
  userId: string;
  validationType: 'pre_execution' | 'periodic' | 'manual';
  errors: string[];
  warnings: string[];
  lastValidated: Date;
  nextValidation?: Date;
  permissions?: {
    canTrade: boolean;
    canWithdraw: boolean;
    canRead: boolean;
    permissions: string[];
  };
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    currentUsage: number;
  };
}

export interface AutomationValidationConfig {
  validateBeforeExecution: boolean;
  periodicValidation: boolean;
  validationInterval: number; // em minutos
  maxRetries: number;
  retryDelay: number; // em milissegundos
  strictMode: boolean;
}

export interface AutomationValidationStats {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  lastValidation: Date;
  averageValidationTime: number;
  accountsValidated: string[];
}

export class AutomationCredentialValidatorService {
  private prisma: PrismaClient;
  private accountCredentialsService: AccountCredentialsService;
  private userExchangeAccountService: UserExchangeAccountService;
  private credentialTestService: CredentialTestService;
  private validationCache: Map<string, AutomationCredentialValidationResult> = new Map();
  private validationStats: Map<string, AutomationValidationStats> = new Map();
  private validationConfig: AutomationValidationConfig;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.accountCredentialsService = new AccountCredentialsService(prisma);
    this.userExchangeAccountService = new UserExchangeAccountService(prisma);
    this.credentialTestService = new CredentialTestService(prisma);
    
    this.validationConfig = {
      validateBeforeExecution: true,
      periodicValidation: true,
      validationInterval: 30, // 30 minutos
      maxRetries: 3,
      retryDelay: 5000, // 5 segundos
      strictMode: true
    };

    console.log('🚀 AUTOMATION CREDENTIAL VALIDATOR - Service initialized');
  }

  // ===== CONFIGURAÇÃO =====

  public updateValidationConfig(config: Partial<AutomationValidationConfig>): void {
    this.validationConfig = { ...this.validationConfig, ...config };
    console.log('✅ AUTOMATION CREDENTIAL VALIDATOR - Updated validation config:', this.validationConfig);
  }

  public getValidationConfig(): AutomationValidationConfig {
    return { ...this.validationConfig };
  }

  // ===== VALIDAÇÃO PRINCIPAL =====

  public async validateCredentialsForAutomation(
    userId: string, 
    accountId: string, 
    validationType: 'pre_execution' | 'periodic' | 'manual' = 'pre_execution'
  ): Promise<AutomationCredentialValidationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 AUTOMATION CREDENTIAL VALIDATOR - Validating credentials for automation`, {
        userId,
        accountId,
        validationType
      });

      // Verificar cache primeiro
      const cacheKey = `${userId}-${accountId}-${validationType}`;
      const cachedResult = this.validationCache.get(cacheKey);
      
      if (cachedResult && this.isValidationCacheValid(cachedResult.lastValidated)) {
        console.log(`✅ AUTOMATION CREDENTIAL VALIDATOR - Validation found in cache for account ${accountId}`);
        return cachedResult;
      }

      // Obter informações da conta
      const account = await this.userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      if (!account) {
        const result: AutomationCredentialValidationResult = {
          isValid: false,
          accountId,
          accountName: 'Unknown',
          exchangeName: 'Unknown',
          userId,
          validationType,
          errors: ['Account not found or access denied'],
          warnings: [],
          lastValidated: new Date()
        };
        
        this.validationCache.set(cacheKey, result);
        return result;
      }

      // Validar credenciais básicas
      const basicValidation = await this.validateBasicCredentials(userId, accountId);
      if (!basicValidation.isValid) {
        const result: AutomationCredentialValidationResult = {
          isValid: false,
          accountId,
          accountName: account.account_name,
          exchangeName: account.exchange.name,
          userId,
          validationType,
          errors: basicValidation.errors,
          warnings: basicValidation.warnings,
          lastValidated: new Date()
        };
        
        this.validationCache.set(cacheKey, result);
        this.updateValidationStats(userId, accountId, false, Date.now() - startTime);
        return result;
      }

      // Validar credenciais com teste de conexão
      const connectionTest = await this.validateConnectionTest(userId, accountId);
      if (!connectionTest.success) {
        const result: AutomationCredentialValidationResult = {
          isValid: false,
          accountId,
          accountName: account.account_name,
          exchangeName: account.exchange.name,
          userId,
          validationType,
          errors: [`Connection test failed: ${connectionTest.message}`],
          warnings: basicValidation.warnings,
          lastValidated: new Date()
        };
        
        this.validationCache.set(cacheKey, result);
        this.updateValidationStats(userId, accountId, false, Date.now() - startTime);
        return result;
      }

      // Validar permissões
      const permissions = await this.validatePermissions(userId, accountId);
      
      // Validar rate limits
      const rateLimits = await this.validateRateLimits(userId, accountId);

      const result: AutomationCredentialValidationResult = {
        isValid: true,
        accountId,
        accountName: account.account_name,
        exchangeName: account.exchange.name,
        userId,
        validationType,
        errors: [],
        warnings: [...basicValidation.warnings, ...connectionTest.warnings || []],
        lastValidated: new Date(),
        nextValidation: new Date(Date.now() + this.validationConfig.validationInterval * 60 * 1000),
        permissions,
        rateLimits
      };

      this.validationCache.set(cacheKey, result);
      this.updateValidationStats(userId, accountId, true, Date.now() - startTime);
      
      console.log(`✅ AUTOMATION CREDENTIAL VALIDATOR - Validation successful for account ${accountId}`);
      return result;

    } catch (error) {
      console.error('❌ AUTOMATION CREDENTIAL VALIDATOR - Error during validation:', error);
      
      const result: AutomationCredentialValidationResult = {
        isValid: false,
        accountId,
        accountName: 'Unknown',
        exchangeName: 'Unknown',
        userId,
        validationType,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        lastValidated: new Date()
      };
      
      this.updateValidationStats(userId, accountId, false, Date.now() - startTime);
      return result;
    }
  }

  // ===== VALIDAÇÕES ESPECÍFICAS =====

  private async validateBasicCredentials(
    userId: string, 
    accountId: string
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Obter credenciais da conta
      const credentials = await this.accountCredentialsService.getAccountCredentials(userId, accountId);
      
      if (!credentials) {
        errors.push('No credentials found for account');
        return { isValid: false, errors, warnings };
      }

      // Verificar se a conta está ativa
      if (!credentials.isActive) {
        errors.push('Account is not active');
      }

      // Verificar se as credenciais não estão vazias
      if (!credentials.credentials || Object.keys(credentials.credentials).length === 0) {
        errors.push('No credentials configured');
      } else {
        const hasValidCredentials = Object.values(credentials.credentials).some(value =>
          value && typeof value === 'string' && value.trim() !== ''
        );
        
        if (!hasValidCredentials) {
          errors.push('Credentials are empty or invalid');
        }
      }

      // Verificar se a conta não está expirada
      if (credentials.expiresAt && credentials.expiresAt < new Date()) {
        warnings.push('Account credentials may be expired');
      }

      return { isValid: errors.length === 0, errors, warnings };

    } catch (error) {
      errors.push(`Error validating basic credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  private async validateConnectionTest(
    userId: string, 
    accountId: string
  ): Promise<{ success: boolean; message: string; warnings?: string[] }> {
    try {
      // Obter informações da conta
      const account = await this.userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      if (!account) {
        return { success: false, message: 'Account not found' };
      }

      // Testar conexão com a exchange
      const testResult = await this.credentialTestService.testUserCredentials(userId, account.exchange.id);
      
      if (!testResult.success) {
        return { 
          success: false, 
          message: testResult.message,
          warnings: testResult.error ? [`Test error: ${testResult.error}`] : []
        };
      }

      return { 
        success: true, 
        message: testResult.message,
        warnings: []
      };

    } catch (error) {
      return { 
        success: false, 
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: []
      };
    }
  }

  private async validatePermissions(
    userId: string, 
    accountId: string
  ): Promise<{ canTrade: boolean; canWithdraw: boolean; canRead: boolean; permissions: string[] }> {
    try {
      // Obter informações da conta
      const account = await this.userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      if (!account) {
        return { canTrade: false, canWithdraw: false, canRead: false, permissions: [] };
      }

      // Verificar permissões básicas baseadas no tipo de conta
      const permissions: string[] = [];
      let canTrade = false;
      let canWithdraw = false;
      let canRead = true; // Sempre pode ler

      // Verificar se a conta tem credenciais válidas
      if (account.credentials && Object.keys(account.credentials).length > 0) {
        permissions.push('read');
        canRead = true;
      }

      // Verificar se a conta está ativa para trading
      if (account.is_active) {
        permissions.push('trade');
        canTrade = true;
      }

      // Verificar se a conta tem permissões de saque (baseado no exchange)
      if (account.exchange.slug === 'lnmarkets' || account.exchange.slug === 'binance') {
        permissions.push('withdraw');
        canWithdraw = true;
      }

      return { canTrade, canWithdraw, canRead, permissions };

    } catch (error) {
      console.error('❌ AUTOMATION CREDENTIAL VALIDATOR - Error validating permissions:', error);
      return { canTrade: false, canWithdraw: false, canRead: false, permissions: [] };
    }
  }

  private async validateRateLimits(
    userId: string, 
    accountId: string
  ): Promise<{ requestsPerMinute: number; requestsPerHour: number; requestsPerDay: number; currentUsage: number }> {
    try {
      // Obter informações da conta
      const account = await this.userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      if (!account) {
        return { requestsPerMinute: 0, requestsPerHour: 0, requestsPerDay: 0, currentUsage: 0 };
      }

      // Rate limits baseados no exchange
      let requestsPerMinute = 60;
      let requestsPerHour = 1000;
      let requestsPerDay = 10000;

      switch (account.exchange.slug) {
        case 'lnmarkets':
          requestsPerMinute = 30;
          requestsPerHour = 500;
          requestsPerDay = 5000;
          break;
        case 'binance':
          requestsPerMinute = 1200;
          requestsPerHour = 10000;
          requestsPerDay = 100000;
          break;
        default:
          requestsPerMinute = 60;
          requestsPerHour = 1000;
          requestsPerDay = 10000;
      }

      // TODO: Implementar tracking de uso real
      const currentUsage = 0;

      return { requestsPerMinute, requestsPerHour, requestsPerDay, currentUsage };

    } catch (error) {
      console.error('❌ AUTOMATION CREDENTIAL VALIDATOR - Error validating rate limits:', error);
      return { requestsPerMinute: 0, requestsPerHour: 0, requestsPerDay: 0, currentUsage: 0 };
    }
  }

  // ===== CACHE E ESTATÍSTICAS =====

  private isValidationCacheValid(lastValidated: Date): boolean {
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastValidated.getTime()) / (1000 * 60);
    return diffInMinutes < this.validationConfig.validationInterval;
  }

  private updateValidationStats(
    userId: string, 
    accountId: string, 
    success: boolean, 
    validationTime: number
  ): void {
    const statsKey = `${userId}-${accountId}`;
    const currentStats = this.validationStats.get(statsKey) || {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      lastValidation: new Date(),
      averageValidationTime: 0,
      accountsValidated: []
    };

    currentStats.totalValidations++;
    if (success) {
      currentStats.successfulValidations++;
    } else {
      currentStats.failedValidations++;
    }
    currentStats.lastValidation = new Date();
    currentStats.averageValidationTime = (currentStats.averageValidationTime + validationTime) / 2;
    
    if (!currentStats.accountsValidated.includes(accountId)) {
      currentStats.accountsValidated.push(accountId);
    }

    this.validationStats.set(statsKey, currentStats);
  }

  public getValidationStats(userId: string, accountId?: string): AutomationValidationStats | Map<string, AutomationValidationStats> {
    if (accountId) {
      const statsKey = `${userId}-${accountId}`;
      return this.validationStats.get(statsKey) || {
        totalValidations: 0,
        successfulValidations: 0,
        failedValidations: 0,
        lastValidation: new Date(),
        averageValidationTime: 0,
        accountsValidated: []
      };
    }
    return this.validationStats;
  }

  public clearValidationCache(userId?: string, accountId?: string): void {
    if (userId && accountId) {
      const cacheKey = `${userId}-${accountId}`;
      this.validationCache.delete(cacheKey);
      console.log(`🧹 AUTOMATION CREDENTIAL VALIDATOR - Cleared cache for ${cacheKey}`);
    } else if (userId) {
      const keysToDelete = Array.from(this.validationCache.keys()).filter(key => key.startsWith(`${userId}-`));
      keysToDelete.forEach(key => this.validationCache.delete(key));
      console.log(`🧹 AUTOMATION CREDENTIAL VALIDATOR - Cleared cache for user ${userId}`);
    } else {
      this.validationCache.clear();
      console.log(`🧹 AUTOMATION CREDENTIAL VALIDATOR - Cleared all cache`);
    }
  }

  // ===== VALIDAÇÃO EM LOTE =====

  public async validateAllUserAccounts(userId: string): Promise<AutomationCredentialValidationResult[]> {
    try {
      console.log(`🔍 AUTOMATION CREDENTIAL VALIDATOR - Validating all accounts for user ${userId}`);
      
      const userAccounts = await this.userExchangeAccountService.getUserExchangeAccounts(userId);
      const validationPromises = userAccounts.map(account => 
        this.validateCredentialsForAutomation(userId, account.id, 'periodic')
      );
      
      const results = await Promise.all(validationPromises);
      
      console.log(`✅ AUTOMATION CREDENTIAL VALIDATOR - Validated ${results.length} accounts for user ${userId}`);
      return results;

    } catch (error) {
      console.error('❌ AUTOMATION CREDENTIAL VALIDATOR - Error validating all accounts:', error);
      return [];
    }
  }

  // ===== VALIDAÇÃO PERIÓDICA =====

  public async startPeriodicValidation(): Promise<void> {
    if (!this.validationConfig.periodicValidation) {
      console.log('⚠️ AUTOMATION CREDENTIAL VALIDATOR - Periodic validation disabled');
      return;
    }

    console.log(`🔄 AUTOMATION CREDENTIAL VALIDATOR - Starting periodic validation every ${this.validationConfig.validationInterval} minutes`);
    
    setInterval(async () => {
      try {
        console.log('🔄 AUTOMATION CREDENTIAL VALIDATOR - Running periodic validation');
        
        // Obter todos os usuários com contas ativas
        const activeUsers = await this.prisma.user.findMany({
          where: {
            userExchangeAccounts: {
              some: {
                is_active: true
              }
            }
          },
          select: {
            id: true,
            userExchangeAccounts: {
              where: {
                is_active: true
              },
              select: {
                id: true
              }
            }
          }
        });

        // Validar contas de todos os usuários
        for (const user of activeUsers) {
          for (const account of user.userExchangeAccounts) {
            await this.validateCredentialsForAutomation(user.id, account.id, 'periodic');
          }
        }

        console.log(`✅ AUTOMATION CREDENTIAL VALIDATOR - Periodic validation completed for ${activeUsers.length} users`);
      } catch (error) {
        console.error('❌ AUTOMATION CREDENTIAL VALIDATOR - Error in periodic validation:', error);
      }
    }, this.validationConfig.validationInterval * 60 * 1000);
  }
}
