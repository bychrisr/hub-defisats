/**
 * User Protection Service
 * 
 * Protege usuários de perdas financeiras por falhas de API
 * Implementa princípios de VOLATILE_MARKET_SAFETY.md
 */

import { getPrisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { marketDataFallbackService } from './market-data-fallback.service';

interface ProtectionRule {
  id: string;
  name: string;
  condition: (context: ProtectionContext) => boolean;
  action: 'block' | 'warn' | 'allow';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ProtectionContext {
  userId: string;
  automationId?: string;
  marketDataAge: number;
  providerStatus: string;
  lastSuccessfulData: number;
  consecutiveFailures: number;
  userRiskLevel: 'low' | 'medium' | 'high';
}

interface ProtectionResult {
  allowed: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction?: string;
  retryAfter?: number;
}

export class UserProtectionService {
  private rules: ProtectionRule[] = [];
  private userRiskLevels: Map<string, 'low' | 'medium' | 'high'> = new Map();

  constructor() {
    this.initializeProtectionRules();
  }

  private initializeProtectionRules() {
    // 1. Dados muito antigos (> 30 segundos)
    this.rules.push({
      id: 'data_too_old',
      name: 'Dados de Mercado Muito Antigos',
      condition: (context) => context.marketDataAge > 30000,
      action: 'block',
      message: 'Dados de mercado muito antigos (>30s). Automação bloqueada por segurança.',
      severity: 'critical'
    });

    // 2. Provedor primário falhando
    this.rules.push({
      id: 'primary_provider_down',
      name: 'Provedor Primário Indisponível',
      condition: (context) => context.providerStatus === 'lnMarkets_unhealthy',
      action: 'warn',
      message: 'LN Markets indisponível. Usando provedor alternativo.',
      severity: 'high'
    });

    // 3. Muitas falhas consecutivas
    this.rules.push({
      id: 'consecutive_failures',
      name: 'Muitas Falhas Consecutivas',
      condition: (context) => context.consecutiveFailures >= 5,
      action: 'block',
      message: 'Muitas falhas consecutivas detectadas. Automação suspensa temporariamente.',
      severity: 'critical'
    });

    // 4. Usuário de alto risco sem dados recentes
    this.rules.push({
      id: 'high_risk_no_data',
      name: 'Usuário de Alto Risco Sem Dados Recentes',
      condition: (context) => 
        context.userRiskLevel === 'high' && 
        context.marketDataAge > 15000,
      action: 'block',
      message: 'Usuário de alto risco sem dados recentes. Automação bloqueada.',
      severity: 'critical'
    });

    // 5. Dados de emergência para usuários de baixo risco
    this.rules.push({
      id: 'emergency_data_low_risk',
      name: 'Dados de Emergência para Usuário de Baixo Risco',
      condition: (context) => 
        context.userRiskLevel === 'low' && 
        context.providerStatus === 'emergency',
      action: 'warn',
      message: 'Usando dados de emergência. Considere pausar automação.',
      severity: 'medium'
    });
  }

  /**
   * Verificar se automação pode ser executada
   */
  async canExecuteAutomation(
    userId: string,
    automationId?: string
  ): Promise<ProtectionResult> {
    try {
      // Obter dados de mercado atuais
      const marketDataResult = await marketDataFallbackService.getMarketData();
      
      // Obter contexto de proteção
      const context = await this.buildProtectionContext(
        userId,
        automationId,
        marketDataResult
      );

      // Aplicar regras de proteção
      for (const rule of this.rules) {
        if (rule.condition(context)) {
          const result: ProtectionResult = {
            allowed: rule.action !== 'block',
            reason: rule.message,
            severity: rule.severity
          };

          if (rule.action === 'block') {
            result.suggestedAction = 'Pause automation until data is available';
            result.retryAfter = this.calculateRetryDelay(context);
          }

          // Log da decisão
          logger.warn('Protection rule triggered', {
            userId,
            automationId,
            rule: rule.name,
            action: rule.action,
            severity: rule.severity,
            context
          });

          return result;
        }
      }

      // Todas as verificações passaram
      return {
        allowed: true,
        severity: 'low'
      };

    } catch (error: any) {
      logger.error('Error in protection check', {
        userId,
        automationId,
        error: error.message
      });

      // Em caso de erro, bloquear por segurança
      return {
        allowed: false,
        reason: 'Erro interno no sistema de proteção. Automação bloqueada por segurança.',
        severity: 'critical',
        suggestedAction: 'Contact support',
        retryAfter: 300000 // 5 minutos
      };
    }
  }

  /**
   * Construir contexto de proteção
   */
  private async buildProtectionContext(
    userId: string,
    automationId: string | undefined,
    marketDataResult: any
  ): Promise<ProtectionContext> {
    const prisma = await getPrisma();

    // Obter dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plan_type: true,
        created_at: true
      }
    });

    // Calcular nível de risco do usuário
    const userRiskLevel = this.calculateUserRiskLevel(user);

    // Obter status dos provedores
    const providerStatus = this.getProviderStatus(marketDataResult);

    // Calcular idade dos dados
    const marketDataAge = marketDataResult.success && marketDataResult.data
      ? Date.now() - marketDataResult.data.timestamp
      : Infinity;

    // Obter falhas consecutivas
    const consecutiveFailures = await this.getConsecutiveFailures(userId);

    // Última vez que dados foram obtidos com sucesso
    const lastSuccessfulData = marketDataResult.success && marketDataResult.data
      ? marketDataResult.data.timestamp
      : 0;

    return {
      userId,
      automationId,
      marketDataAge,
      providerStatus,
      lastSuccessfulData,
      consecutiveFailures,
      userRiskLevel
    };
  }

  /**
   * Calcular nível de risco do usuário
   */
  private calculateUserRiskLevel(user: any): 'low' | 'medium' | 'high' {
    if (!user) return 'high';

    const accountAge = Date.now() - new Date(user.created_at).getTime();
    const accountAgeDays = accountAge / (1000 * 60 * 60 * 24);

    // Usuários novos são considerados de alto risco
    if (accountAgeDays < 7) return 'high';

    // Usuários com planos premium têm menor risco
    if (user.plan_type === 'premium' || user.plan_type === 'enterprise') {
      return 'low';
    }

    // Usuários com planos básicos têm risco médio
    if (user.plan_type === 'basic') {
      return 'medium';
    }

    // Usuários gratuitos têm alto risco
    return 'high';
  }

  /**
   * Obter status do provedor
   */
  private getProviderStatus(marketDataResult: any): string {
    if (!marketDataResult.success) {
      return 'all_providers_failed';
    }

    if (marketDataResult.source === 'primary') {
      return 'lnMarkets_healthy';
    } else if (marketDataResult.source === 'fallback') {
      return 'lnMarkets_unhealthy_fallback_active';
    } else if (marketDataResult.source === 'emergency') {
      return 'emergency';
    }

    return 'unknown';
  }

  /**
   * Obter falhas consecutivas do usuário
   */
  private async getConsecutiveFailures(userId: string): Promise<number> {
    // Implementar lógica para contar falhas consecutivas
    // Por enquanto, retornar 0
    return 0;
  }

  /**
   * Calcular delay para retry
   */
  private calculateRetryDelay(context: ProtectionContext): number {
    // Delay baseado na severidade e contexto
    if (context.consecutiveFailures >= 10) {
      return 600000; // 10 minutos
    } else if (context.consecutiveFailures >= 5) {
      return 300000; // 5 minutos
    } else {
      return 60000; // 1 minuto
    }
  }

  /**
   * Registrar tentativa de automação
   */
  async logAutomationAttempt(
    userId: string,
    automationId: string,
    result: ProtectionResult,
    marketData: any
  ): Promise<void> {
    // Log apenas no console por enquanto
    logger.info('Automation attempt logged', {
      userId,
      automationId,
      action: result.allowed ? 'executed' : 'blocked',
      reason: result.reason || 'No restrictions',
      severity: result.severity,
      marketDataAge: marketData?.timestamp ? Date.now() - marketData.timestamp : null,
      provider: marketData?.provider || 'unknown'
    });
  }

  /**
   * Obter estatísticas de proteção
   */
  async getProtectionStats(): Promise<{
    totalChecks: number;
    blockedAutomations: number;
    warningsIssued: number;
    averageDataAge: number;
    providerReliability: Record<string, number>;
  }> {
    const prisma = await getPrisma();

    // Implementar estatísticas detalhadas
    return {
      totalChecks: 0,
      blockedAutomations: 0,
      warningsIssued: 0,
      averageDataAge: 0,
      providerReliability: {}
    };
  }

  /**
   * Atualizar nível de risco do usuário
   */
  async updateUserRiskLevel(
    userId: string,
    riskLevel: 'low' | 'medium' | 'high'
  ): Promise<void> {
    this.userRiskLevels.set(userId, riskLevel);
    
    logger.info('User risk level updated', {
      userId,
      riskLevel
    });
  }
}

export const userProtectionService = new UserProtectionService();
