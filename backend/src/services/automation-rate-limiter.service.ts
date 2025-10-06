import { PrismaClient } from '@prisma/client';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  windowSize: number; // em milissegundos
  retryAfter: number; // em segundos
}

export interface RateLimitStatus {
  isAllowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  currentUsage: number;
  limit: number;
  window: string;
}

export interface RateLimitStats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  averageResponseTime: number;
  peakUsage: number;
  lastReset: Date;
}

export interface AutomationRateLimit {
  userId: string;
  accountId: string;
  exchangeSlug: string;
  config: RateLimitConfig;
  currentUsage: {
    minute: number;
    hour: number;
    day: number;
  };
  lastRequest: Date;
  isThrottled: boolean;
  throttleUntil?: Date;
}

export class AutomationRateLimiterService {
  private prisma: PrismaClient;
  private rateLimitStore: Map<string, AutomationRateLimit> = new Map();
  private statsStore: Map<string, RateLimitStats> = new Map();
  private defaultConfigs: Map<string, RateLimitConfig> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeDefaultConfigs();
    this.startCleanupInterval();
    
    console.log('🚀 AUTOMATION RATE LIMITER - Service initialized');
  }

  // ===== INICIALIZAÇÃO =====

  private initializeDefaultConfigs(): void {
    // Configurações por exchange
    this.defaultConfigs.set('lnmarkets', {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000,
      burstLimit: 10,
      windowSize: 60000, // 1 minuto
      retryAfter: 60
    });

    this.defaultConfigs.set('binance', {
      requestsPerMinute: 1200,
      requestsPerHour: 10000,
      requestsPerDay: 100000,
      burstLimit: 100,
      windowSize: 60000, // 1 minuto
      retryAfter: 1
    });

    this.defaultConfigs.set('default', {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 20,
      windowSize: 60000, // 1 minuto
      retryAfter: 30
    });

    console.log('✅ AUTOMATION RATE LIMITER - Default configurations loaded');
  }

  private startCleanupInterval(): void {
    // Limpar dados antigos a cada 5 minutos
    setInterval(() => {
      this.cleanupExpiredData();
    }, 5 * 60 * 1000);
  }

  // ===== RATE LIMITING PRINCIPAL =====

  public async checkRateLimit(
    userId: string, 
    accountId: string, 
    exchangeSlug: string,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitStatus> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 AUTOMATION RATE LIMITER - Checking rate limit for ${userId}-${accountId} on ${exchangeSlug}`);
      
      const key = `${userId}-${accountId}`;
      const now = new Date();
      
      // Obter configuração
      const config = this.getRateLimitConfig(exchangeSlug, customConfig);
      
      // Obter ou criar rate limit
      let rateLimit = this.rateLimitStore.get(key);
      if (!rateLimit) {
        rateLimit = await this.createRateLimit(userId, accountId, exchangeSlug, config);
      }

      // Verificar se está em throttle
      if (rateLimit.isThrottled && rateLimit.throttleUntil && rateLimit.throttleUntil > now) {
        const retryAfter = Math.ceil((rateLimit.throttleUntil.getTime() - now.getTime()) / 1000);
        
        console.log(`⏳ AUTOMATION RATE LIMITER - Account ${accountId} is throttled, retry after ${retryAfter}s`);
        
        return {
          isAllowed: false,
          remaining: 0,
          resetTime: rateLimit.throttleUntil,
          retryAfter,
          currentUsage: rateLimit.currentUsage.minute,
          limit: config.requestsPerMinute,
          window: 'minute'
        };
      }

      // Verificar limites
      const limits = this.checkLimits(rateLimit, config, now);
      
      if (!limits.isAllowed) {
        // Aplicar throttle se necessário
        if (limits.shouldThrottle) {
          rateLimit.isThrottled = true;
          rateLimit.throttleUntil = new Date(now.getTime() + config.retryAfter * 1000);
        }
        
        this.rateLimitStore.set(key, rateLimit);
        this.updateStats(key, false, Date.now() - startTime);
        
        console.log(`❌ AUTOMATION RATE LIMITER - Rate limit exceeded for ${accountId}`);
        
        return {
          isAllowed: false,
          remaining: limits.remaining,
          resetTime: limits.resetTime,
          retryAfter: config.retryAfter,
          currentUsage: rateLimit.currentUsage.minute,
          limit: config.requestsPerMinute,
          window: limits.window
        };
      }

      // Atualizar uso
      this.updateUsage(rateLimit, now);
      this.rateLimitStore.set(key, rateLimit);
      this.updateStats(key, true, Date.now() - startTime);
      
      console.log(`✅ AUTOMATION RATE LIMITER - Rate limit OK for ${accountId}`);
      
      return {
        isAllowed: true,
        remaining: limits.remaining,
        resetTime: limits.resetTime,
        currentUsage: rateLimit.currentUsage.minute,
        limit: config.requestsPerMinute,
        window: 'minute'
      };

    } catch (error) {
      console.error('❌ AUTOMATION RATE LIMITER - Error checking rate limit:', error);
      
      // Em caso de erro, permitir a requisição mas logar
      return {
        isAllowed: true,
        remaining: 0,
        resetTime: new Date(Date.now() + 60000),
        currentUsage: 0,
        limit: 0,
        window: 'minute'
      };
    }
  }

  // ===== CONFIGURAÇÃO =====

  private getRateLimitConfig(exchangeSlug: string, customConfig?: Partial<RateLimitConfig>): RateLimitConfig {
    const defaultConfig = this.defaultConfigs.get(exchangeSlug) || this.defaultConfigs.get('default')!;
    
    if (customConfig) {
      return { ...defaultConfig, ...customConfig };
    }
    
    return defaultConfig;
  }

  private async createRateLimit(
    userId: string, 
    accountId: string, 
    exchangeSlug: string, 
    config: RateLimitConfig
  ): Promise<AutomationRateLimit> {
    const now = new Date();
    
    const rateLimit: AutomationRateLimit = {
      userId,
      accountId,
      exchangeSlug,
      config,
      currentUsage: {
        minute: 0,
        hour: 0,
        day: 0
      },
      lastRequest: now,
      isThrottled: false
    };

    console.log(`✅ AUTOMATION RATE LIMITER - Created rate limit for ${userId}-${accountId}`);
    return rateLimit;
  }

  // ===== VERIFICAÇÃO DE LIMITES =====

  private checkLimits(
    rateLimit: AutomationRateLimit, 
    config: RateLimitConfig, 
    now: Date
  ): { isAllowed: boolean; remaining: number; resetTime: Date; window: string; shouldThrottle: boolean } {
    const timeSinceLastRequest = now.getTime() - rateLimit.lastRequest.getTime();
    
    // Reset contadores se necessário
    if (timeSinceLastRequest >= 60000) { // 1 minuto
      rateLimit.currentUsage.minute = 0;
    }
    if (timeSinceLastRequest >= 3600000) { // 1 hora
      rateLimit.currentUsage.hour = 0;
    }
    if (timeSinceLastRequest >= 86400000) { // 1 dia
      rateLimit.currentUsage.day = 0;
    }

    // Verificar limite por minuto
    if (rateLimit.currentUsage.minute >= config.requestsPerMinute) {
      return {
        isAllowed: false,
        remaining: 0,
        resetTime: new Date(now.getTime() + 60000),
        window: 'minute',
        shouldThrottle: true
      };
    }

    // Verificar limite por hora
    if (rateLimit.currentUsage.hour >= config.requestsPerHour) {
      return {
        isAllowed: false,
        remaining: 0,
        resetTime: new Date(now.getTime() + 3600000),
        window: 'hour',
        shouldThrottle: true
      };
    }

    // Verificar limite por dia
    if (rateLimit.currentUsage.day >= config.requestsPerDay) {
      return {
        isAllowed: false,
        remaining: 0,
        resetTime: new Date(now.getTime() + 86400000),
        window: 'day',
        shouldThrottle: true
      };
    }

    // Verificar burst limit
    if (rateLimit.currentUsage.minute >= config.burstLimit) {
      return {
        isAllowed: false,
        remaining: config.requestsPerMinute - rateLimit.currentUsage.minute,
        resetTime: new Date(now.getTime() + 60000),
        window: 'minute',
        shouldThrottle: false
      };
    }

    return {
      isAllowed: true,
      remaining: config.requestsPerMinute - rateLimit.currentUsage.minute,
      resetTime: new Date(now.getTime() + 60000),
      window: 'minute',
      shouldThrottle: false
    };
  }

  private updateUsage(rateLimit: AutomationRateLimit, now: Date): void {
    rateLimit.currentUsage.minute++;
    rateLimit.currentUsage.hour++;
    rateLimit.currentUsage.day++;
    rateLimit.lastRequest = now;
    
    // Reset throttle se não estiver mais em throttle
    if (rateLimit.isThrottled && rateLimit.throttleUntil && rateLimit.throttleUntil <= now) {
      rateLimit.isThrottled = false;
      rateLimit.throttleUntil = undefined;
    }
  }

  // ===== ESTATÍSTICAS =====

  private updateStats(key: string, allowed: boolean, responseTime: number): void {
    const stats = this.statsStore.get(key) || {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      averageResponseTime: 0,
      peakUsage: 0,
      lastReset: new Date()
    };

    stats.totalRequests++;
    if (allowed) {
      stats.allowedRequests++;
    } else {
      stats.blockedRequests++;
    }
    
    stats.averageResponseTime = (stats.averageResponseTime + responseTime) / 2;
    stats.peakUsage = Math.max(stats.peakUsage, stats.totalRequests);
    stats.lastReset = new Date();

    this.statsStore.set(key, stats);
  }

  public getRateLimitStats(userId: string, accountId?: string): RateLimitStats | Map<string, RateLimitStats> {
    if (accountId) {
      const key = `${userId}-${accountId}`;
      return this.statsStore.get(key) || {
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0,
        averageResponseTime: 0,
        peakUsage: 0,
        lastReset: new Date()
      };
    }
    return this.statsStore;
  }

  // ===== THROTTLING =====

  public async throttleAccount(userId: string, accountId: string, duration: number): Promise<void> {
    const key = `${userId}-${accountId}`;
    const rateLimit = this.rateLimitStore.get(key);
    
    if (rateLimit) {
      rateLimit.isThrottled = true;
      rateLimit.throttleUntil = new Date(Date.now() + duration * 1000);
      this.rateLimitStore.set(key, rateLimit);
      
      console.log(`⏳ AUTOMATION RATE LIMITER - Throttled account ${accountId} for ${duration}s`);
    }
  }

  public async unthrottleAccount(userId: string, accountId: string): Promise<void> {
    const key = `${userId}-${accountId}`;
    const rateLimit = this.rateLimitStore.get(key);
    
    if (rateLimit) {
      rateLimit.isThrottled = false;
      rateLimit.throttleUntil = undefined;
      this.rateLimitStore.set(key, rateLimit);
      
      console.log(`✅ AUTOMATION RATE LIMITER - Unthrottled account ${accountId}`);
    }
  }

  // ===== LIMPEZA =====

  private cleanupExpiredData(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, rateLimit] of this.rateLimitStore.entries()) {
      const timeSinceLastRequest = now.getTime() - rateLimit.lastRequest.getTime();
      
      // Limpar dados antigos (mais de 1 dia)
      if (timeSinceLastRequest >= 86400000) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.rateLimitStore.delete(key);
      this.statsStore.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 AUTOMATION RATE LIMITER - Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  // ===== MÉTODOS PÚBLICOS =====

  public async resetRateLimit(userId: string, accountId: string): Promise<void> {
    const key = `${userId}-${accountId}`;
    this.rateLimitStore.delete(key);
    this.statsStore.delete(key);
    
    console.log(`🔄 AUTOMATION RATE LIMITER - Reset rate limit for ${userId}-${accountId}`);
  }

  public async updateRateLimitConfig(
    userId: string, 
    accountId: string, 
    config: Partial<RateLimitConfig>
  ): Promise<void> {
    const key = `${userId}-${accountId}`;
    const rateLimit = this.rateLimitStore.get(key);
    
    if (rateLimit) {
      rateLimit.config = { ...rateLimit.config, ...config };
      this.rateLimitStore.set(key, rateLimit);
      
      console.log(`✅ AUTOMATION RATE LIMITER - Updated config for ${userId}-${accountId}`);
    }
  }

  public getCurrentUsage(userId: string, accountId: string): AutomationRateLimit | null {
    const key = `${userId}-${accountId}`;
    return this.rateLimitStore.get(key) || null;
  }

  public getAllRateLimits(): Map<string, AutomationRateLimit> {
    return new Map(this.rateLimitStore);
  }

  // ===== MÉTODOS DE MONITORAMENTO =====

  public async getRateLimitHealth(): Promise<{
    totalAccounts: number;
    throttledAccounts: number;
    averageUsage: number;
    peakUsage: number;
  }> {
    const totalAccounts = this.rateLimitStore.size;
    let throttledAccounts = 0;
    let totalUsage = 0;
    let peakUsage = 0;
    
    for (const rateLimit of this.rateLimitStore.values()) {
      if (rateLimit.isThrottled) {
        throttledAccounts++;
      }
      
      totalUsage += rateLimit.currentUsage.minute;
      peakUsage = Math.max(peakUsage, rateLimit.currentUsage.minute);
    }
    
    return {
      totalAccounts,
      throttledAccounts,
      averageUsage: totalAccounts > 0 ? totalUsage / totalAccounts : 0,
      peakUsage
    };
  }
}
