import { PrismaClient } from '@prisma/client';
import { AutomationCredentialValidatorService } from './automation-credential-validator.service';
import { AutomationRateLimiterService } from './automation-rate-limiter.service';
import { UserExchangeAccountService } from './userExchangeAccount.service';

export interface AutomationAccountValidationResult {
  isValid: boolean;
  accountId: string;
  accountName: string;
  exchangeName: string;
  userId: string;
  validationChecks: {
    credentials: boolean;
    permissions: boolean;
    rateLimit: boolean;
    accountStatus: boolean;
    exchangeStatus: boolean;
  };
  errors: string[];
  warnings: string[];
  recommendations: string[];
  lastValidated: Date;
  nextValidation?: Date;
  securityScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AutomationAccountSecurityReport {
  accountId: string;
  userId: string;
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: string[];
  recommendations: string[];
  lastReport: Date;
  complianceStatus: {
    gdpr: boolean;
    security: boolean;
    audit: boolean;
  };
}

export interface AutomationAccountValidatorConfig {
  enableCredentialValidation: boolean;
  enableRateLimitValidation: boolean;
  enableSecurityValidation: boolean;
  enableComplianceValidation: boolean;
  validationInterval: number; // em minutos
  securityThreshold: number; // 0-100
  riskThreshold: number; // 0-100
  autoBlockOnHighRisk: boolean;
  enableAuditLogging: boolean;
}

export class AutomationAccountValidatorService {
  private prisma: PrismaClient;
  private credentialValidator: AutomationCredentialValidatorService;
  private rateLimiter: AutomationRateLimiterService;
  private userExchangeAccountService: UserExchangeAccountService;
  private validatorConfig: AutomationAccountValidatorConfig;
  private securityReports: Map<string, AutomationAccountSecurityReport> = new Map();
  private auditLogs: Array<{
    timestamp: Date;
    userId: string;
    accountId: string;
    action: string;
    result: string;
    details: any;
  }> = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.credentialValidator = new AutomationCredentialValidatorService(prisma);
    this.rateLimiter = new AutomationRateLimiterService(prisma);
    this.userExchangeAccountService = new UserExchangeAccountService(prisma);
    
    this.validatorConfig = {
      enableCredentialValidation: true,
      enableRateLimitValidation: true,
      enableSecurityValidation: true,
      enableComplianceValidation: true,
      validationInterval: 30, // 30 minutos
      securityThreshold: 70, // 70%
      riskThreshold: 80, // 80%
      autoBlockOnHighRisk: true,
      enableAuditLogging: true
    };

    console.log('🚀 AUTOMATION ACCOUNT VALIDATOR - Service initialized');
  }

  // ===== CONFIGURAÇÃO =====

  public updateValidatorConfig(config: Partial<AutomationAccountValidatorConfig>): void {
    this.validatorConfig = { ...this.validatorConfig, ...config };
    console.log('✅ AUTOMATION ACCOUNT VALIDATOR - Updated validator config:', this.validatorConfig);
  }

  public getValidatorConfig(): AutomationAccountValidatorConfig {
    return { ...this.validatorConfig };
  }

  // ===== VALIDAÇÃO PRINCIPAL =====

  public async validateAccountForAutomation(
    userId: string, 
    accountId: string
  ): Promise<AutomationAccountValidationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 AUTOMATION ACCOUNT VALIDATOR - Validating account ${accountId} for user ${userId}`);
      
      // Obter informações da conta
      const account = await this.userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      if (!account) {
        return this.createValidationResult(
          false, accountId, 'Unknown', 'Unknown', userId,
          { credentials: false, permissions: false, rateLimit: false, accountStatus: false, exchangeStatus: false },
          ['Account not found or access denied'],
          [],
          [],
          'critical'
        );
      }

      const validationChecks = {
        credentials: false,
        permissions: false,
        rateLimit: false,
        accountStatus: false,
        exchangeStatus: false
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // 1. Validar credenciais
      if (this.validatorConfig.enableCredentialValidation) {
        const credentialValidation = await this.credentialValidator.validateCredentialsForAutomation(
          userId, accountId, 'pre_execution'
        );
        
        validationChecks.credentials = credentialValidation.isValid;
        if (!credentialValidation.isValid) {
          errors.push(...credentialValidation.errors);
        }
        warnings.push(...credentialValidation.warnings);
      } else {
        validationChecks.credentials = true;
      }

      // 2. Validar rate limit
      if (this.validatorConfig.enableRateLimitValidation) {
        const rateLimitStatus = await this.rateLimiter.checkRateLimit(
          userId, accountId, account.exchange.slug
        );
        
        validationChecks.rateLimit = rateLimitStatus.isAllowed;
        if (!rateLimitStatus.isAllowed) {
          errors.push(`Rate limit exceeded: ${rateLimitStatus.retryAfter ? `retry after ${rateLimitStatus.retryAfter}s` : 'limit reached'}`);
        }
      } else {
        validationChecks.rateLimit = true;
      }

      // 3. Validar status da conta
      validationChecks.accountStatus = account.is_active;
      if (!account.is_active) {
        errors.push('Account is not active');
      }

      // 4. Validar status da exchange
      validationChecks.exchangeStatus = account.exchange.is_active;
      if (!account.exchange.is_active) {
        errors.push('Exchange is not active');
      }

      // 5. Validar permissões
      if (this.validatorConfig.enableSecurityValidation) {
        const permissions = await this.validateAccountPermissions(userId, accountId);
        validationChecks.permissions = permissions.isValid;
        if (!permissions.isValid) {
          errors.push(...permissions.errors);
        }
        warnings.push(...permissions.warnings);
        recommendations.push(...permissions.recommendations);
      } else {
        validationChecks.permissions = true;
      }

      // 6. Validar segurança
      if (this.validatorConfig.enableSecurityValidation) {
        const securityValidation = await this.validateAccountSecurity(userId, accountId);
        if (!securityValidation.isValid) {
          errors.push(...securityValidation.errors);
        }
        warnings.push(...securityValidation.warnings);
        recommendations.push(...securityValidation.recommendations);
      }

      // 7. Validar compliance
      if (this.validatorConfig.enableComplianceValidation) {
        const complianceValidation = await this.validateAccountCompliance(userId, accountId);
        if (!complianceValidation.isValid) {
          errors.push(...complianceValidation.errors);
        }
        warnings.push(...complianceValidation.warnings);
        recommendations.push(...complianceValidation.recommendations);
      }

      // Calcular score de segurança
      const securityScore = this.calculateSecurityScore(validationChecks, errors, warnings);
      const riskLevel = this.calculateRiskLevel(securityScore, errors, warnings);

      // Verificar se deve bloquear automaticamente
      if (this.validatorConfig.autoBlockOnHighRisk && riskLevel === 'critical') {
        await this.blockAccount(userId, accountId, 'High risk detected');
        errors.push('Account automatically blocked due to high risk');
      }

      const isValid = Object.values(validationChecks).every(check => check) && errors.length === 0;

      const result: AutomationAccountValidationResult = {
        isValid,
        accountId,
        accountName: account.account_name,
        exchangeName: account.exchange.name,
        userId,
        validationChecks,
        errors,
        warnings,
        recommendations,
        lastValidated: new Date(),
        nextValidation: new Date(Date.now() + this.validatorConfig.validationInterval * 60 * 1000),
        securityScore,
        riskLevel
      };

      // Log de auditoria
      if (this.validatorConfig.enableAuditLogging) {
        this.logAuditEvent(userId, accountId, 'validate_account', isValid ? 'success' : 'failed', {
          securityScore,
          riskLevel,
          validationChecks,
          errors,
          warnings
        });
      }

      // Atualizar relatório de segurança
      await this.updateSecurityReport(userId, accountId, result);

      console.log(`✅ AUTOMATION ACCOUNT VALIDATOR - Validation completed for account ${accountId}`, {
        isValid,
        securityScore,
        riskLevel,
        duration: Date.now() - startTime
      });

      return result;

    } catch (error) {
      console.error('❌ AUTOMATION ACCOUNT VALIDATOR - Error during validation:', error);
      
      const result = this.createValidationResult(
        false, accountId, 'Unknown', 'Unknown', userId,
        { credentials: false, permissions: false, rateLimit: false, accountStatus: false, exchangeStatus: false },
        [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        [],
        [],
        'critical'
      );

      if (this.validatorConfig.enableAuditLogging) {
        this.logAuditEvent(userId, accountId, 'validate_account', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
      }

      return result;
    }
  }

  // ===== VALIDAÇÕES ESPECÍFICAS =====

  private async validateAccountPermissions(
    userId: string, 
    accountId: string
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; recommendations: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Verificar se o usuário tem permissão para usar esta conta
      const account = await this.userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      if (!account) {
        errors.push('Account not found or access denied');
        return { isValid: false, errors, warnings, recommendations };
      }

      // Verificar se a conta pertence ao usuário
      if (account.user_id !== userId) {
        errors.push('Account does not belong to user');
        return { isValid: false, errors, warnings, recommendations };
      }

      // Verificar se a conta não está bloqueada
      if (account.is_blocked) {
        errors.push('Account is blocked');
        return { isValid: false, errors, warnings, recommendations };
      }

      // Verificar se a conta não está suspensa
      if (account.is_suspended) {
        errors.push('Account is suspended');
        return { isValid: false, errors, warnings, recommendations };
      }

      // Verificar se a conta não está expirada
      if (account.expires_at && account.expires_at < new Date()) {
        errors.push('Account has expired');
        return { isValid: false, errors, warnings, recommendations };
      }

      // Verificar se a conta tem credenciais válidas
      if (!account.credentials || Object.keys(account.credentials).length === 0) {
        errors.push('Account has no credentials');
        return { isValid: false, errors, warnings, recommendations };
      }

      // Verificar se as credenciais não estão vazias
      const hasValidCredentials = Object.values(account.credentials).some(value =>
        value && typeof value === 'string' && value.trim() !== ''
      );
      
      if (!hasValidCredentials) {
        errors.push('Account credentials are empty or invalid');
        return { isValid: false, errors, warnings, recommendations };
      }

      return { isValid: true, errors, warnings, recommendations };

    } catch (error) {
      errors.push(`Error validating permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings, recommendations };
    }
  }

  private async validateAccountSecurity(
    userId: string, 
    accountId: string
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; recommendations: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Verificar se a conta não foi comprometida
      const account = await this.userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      if (!account) {
        errors.push('Account not found');
        return { isValid: false, errors, warnings, recommendations };
      }

      // Verificar se a conta não tem atividades suspeitas
      const suspiciousActivities = await this.checkSuspiciousActivities(userId, accountId);
      if (suspiciousActivities.length > 0) {
        warnings.push(...suspiciousActivities);
        recommendations.push('Review account activities for suspicious behavior');
      }

      // Verificar se a conta não tem tentativas de acesso suspeitas
      const suspiciousAccess = await this.checkSuspiciousAccess(userId, accountId);
      if (suspiciousAccess.length > 0) {
        warnings.push(...suspiciousAccess);
        recommendations.push('Review account access patterns');
      }

      // Verificar se a conta não tem configurações inseguras
      const insecureConfigs = await this.checkInsecureConfigurations(userId, accountId);
      if (insecureConfigs.length > 0) {
        warnings.push(...insecureConfigs);
        recommendations.push('Review account security configurations');
      }

      return { isValid: true, errors, warnings, recommendations };

    } catch (error) {
      errors.push(`Error validating security: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings, recommendations };
    }
  }

  private async validateAccountCompliance(
    userId: string, 
    accountId: string
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; recommendations: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Verificar se a conta está em conformidade com GDPR
      const gdprCompliance = await this.checkGDPRCompliance(userId, accountId);
      if (!gdprCompliance.isValid) {
        errors.push(...gdprCompliance.errors);
        recommendations.push(...gdprCompliance.recommendations);
      }

      // Verificar se a conta está em conformidade com regulamentações financeiras
      const financialCompliance = await this.checkFinancialCompliance(userId, accountId);
      if (!financialCompliance.isValid) {
        errors.push(...financialCompliance.errors);
        recommendations.push(...financialCompliance.recommendations);
      }

      // Verificar se a conta está em conformidade com políticas de segurança
      const securityCompliance = await this.checkSecurityCompliance(userId, accountId);
      if (!securityCompliance.isValid) {
        errors.push(...securityCompliance.errors);
        recommendations.push(...securityCompliance.recommendations);
      }

      return { isValid: true, errors, warnings, recommendations };

    } catch (error) {
      errors.push(`Error validating compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings, recommendations };
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private createValidationResult(
    isValid: boolean,
    accountId: string,
    accountName: string,
    exchangeName: string,
    userId: string,
    validationChecks: any,
    errors: string[],
    warnings: string[],
    recommendations: string[],
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): AutomationAccountValidationResult {
    return {
      isValid,
      accountId,
      accountName,
      exchangeName,
      userId,
      validationChecks,
      errors,
      warnings,
      recommendations,
      lastValidated: new Date(),
      nextValidation: new Date(Date.now() + this.validatorConfig.validationInterval * 60 * 1000),
      securityScore: this.calculateSecurityScore(validationChecks, errors, warnings),
      riskLevel
    };
  }

  private calculateSecurityScore(
    validationChecks: any,
    errors: string[],
    warnings: string[]
  ): number {
    let score = 100;
    
    // Penalizar por erros
    score -= errors.length * 20;
    
    // Penalizar por warnings
    score -= warnings.length * 5;
    
    // Penalizar por checks falhados
    const failedChecks = Object.values(validationChecks).filter(check => !check).length;
    score -= failedChecks * 15;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateRiskLevel(securityScore: number, errors: string[], warnings: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (securityScore >= 90 && errors.length === 0) return 'low';
    if (securityScore >= 70 && errors.length === 0) return 'medium';
    if (securityScore >= 50 || errors.length > 0) return 'high';
    return 'critical';
  }

  private async blockAccount(userId: string, accountId: string, reason: string): Promise<void> {
    try {
      await this.userExchangeAccountService.blockAccount(accountId, userId, reason);
      console.log(`🚫 AUTOMATION ACCOUNT VALIDATOR - Blocked account ${accountId} for user ${userId}: ${reason}`);
      
      if (this.validatorConfig.enableAuditLogging) {
        this.logAuditEvent(userId, accountId, 'block_account', 'success', { reason });
      }
    } catch (error) {
      console.error('❌ AUTOMATION ACCOUNT VALIDATOR - Error blocking account:', error);
    }
  }

  private async updateSecurityReport(
    userId: string, 
    accountId: string, 
    validationResult: AutomationAccountValidationResult
  ): Promise<void> {
    const report: AutomationAccountSecurityReport = {
      accountId,
      userId,
      securityScore: validationResult.securityScore,
      riskLevel: validationResult.riskLevel,
      vulnerabilities: validationResult.errors,
      recommendations: validationResult.recommendations,
      lastReport: new Date(),
      complianceStatus: {
        gdpr: true, // TODO: Implementar verificação real
        security: validationResult.securityScore >= this.validatorConfig.securityThreshold,
        audit: this.validatorConfig.enableAuditLogging
      }
    };

    this.securityReports.set(`${userId}-${accountId}`, report);
  }

  private logAuditEvent(
    userId: string, 
    accountId: string, 
    action: string, 
    result: string, 
    details: any
  ): void {
    this.auditLogs.push({
      timestamp: new Date(),
      userId,
      accountId,
      action,
      result,
      details
    });
  }

  // ===== MÉTODOS DE VERIFICAÇÃO =====

  private async checkSuspiciousActivities(userId: string, accountId: string): Promise<string[]> {
    // TODO: Implementar verificação de atividades suspeitas
    return [];
  }

  private async checkSuspiciousAccess(userId: string, accountId: string): Promise<string[]> {
    // TODO: Implementar verificação de acessos suspeitos
    return [];
  }

  private async checkInsecureConfigurations(userId: string, accountId: string): Promise<string[]> {
    // TODO: Implementar verificação de configurações inseguras
    return [];
  }

  private async checkGDPRCompliance(userId: string, accountId: string): Promise<{ isValid: boolean; errors: string[]; recommendations: string[] }> {
    // TODO: Implementar verificação de conformidade GDPR
    return { isValid: true, errors: [], recommendations: [] };
  }

  private async checkFinancialCompliance(userId: string, accountId: string): Promise<{ isValid: boolean; errors: string[]; recommendations: string[] }> {
    // TODO: Implementar verificação de conformidade financeira
    return { isValid: true, errors: [], recommendations: [] };
  }

  private async checkSecurityCompliance(userId: string, accountId: string): Promise<{ isValid: boolean; errors: string[]; recommendations: string[] }> {
    // TODO: Implementar verificação de conformidade de segurança
    return { isValid: true, errors: [], recommendations: [] };
  }

  // ===== MÉTODOS PÚBLICOS =====

  public getSecurityReport(userId: string, accountId: string): AutomationAccountSecurityReport | null {
    const key = `${userId}-${accountId}`;
    return this.securityReports.get(key) || null;
  }

  public getAuditLogs(userId?: string, accountId?: string): any[] {
    if (userId && accountId) {
      return this.auditLogs.filter(log => log.userId === userId && log.accountId === accountId);
    } else if (userId) {
      return this.auditLogs.filter(log => log.userId === userId);
    }
    return this.auditLogs;
  }

  public async validateAllUserAccounts(userId: string): Promise<AutomationAccountValidationResult[]> {
    try {
      const userAccounts = await this.userExchangeAccountService.getUserExchangeAccounts(userId);
      const validationPromises = userAccounts.map(account => 
        this.validateAccountForAutomation(userId, account.id)
      );
      
      return await Promise.all(validationPromises);
    } catch (error) {
      console.error('❌ AUTOMATION ACCOUNT VALIDATOR - Error validating all accounts:', error);
      return [];
    }
  }
}
