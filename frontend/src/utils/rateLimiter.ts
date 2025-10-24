/**
 * Rate Limiter para LN Markets API
 * Implementa estratégia inteligente baseada nos headers da API
 */

interface RateLimitInfo {
  remaining: number;
  reset: number;
  retryAfter?: number;
}

interface RateLimitState {
  requests: number[];
  lastRequest: number;
  isLimited: boolean;
  retryAfter?: number;
}

class LNMarketsRateLimiter {
  private state: RateLimitState = {
    requests: [],
    lastRequest: 0,
    isLimited: false,
    retryAfter: undefined
  };

  private readonly MAX_REQUESTS_PER_SECOND = 1;
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private readonly BACKOFF_MULTIPLIER = 2;
  private readonly MAX_BACKOFF = 300000; // 5 minutos

  /**
   * Verifica se pode fazer requisição baseado no rate limit
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Se está limitado, verificar se já passou o tempo de retry
    if (this.state.isLimited && this.state.retryAfter) {
      if (now < this.state.retryAfter) {
        return false;
      }
      // Reset limit state
      this.state.isLimited = false;
      this.state.retryAfter = undefined;
    }

    // Limpar requisições antigas (mais de 1 minuto)
    this.state.requests = this.state.requests.filter(
      timestamp => now - timestamp < 60000
    );

    // Verificar limite de 1 requisição por segundo
    const oneSecondAgo = now - 1000;
    const recentRequests = this.state.requests.filter(
      timestamp => timestamp > oneSecondAgo
    );

    if (recentRequests.length >= this.MAX_REQUESTS_PER_SECOND) {
      return false;
    }

    // Verificar limite de 60 requisições por minuto
    if (this.state.requests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    return true;
  }

  /**
   * Registra uma requisição feita
   */
  recordRequest(): void {
    const now = Date.now();
    this.state.requests.push(now);
    this.state.lastRequest = now;
  }

  /**
   * Processa headers de rate limit da resposta
   */
  processRateLimitHeaders(headers: Headers): void {
    const remaining = headers.get('X-Ratelimit-Remaining');
    const reset = headers.get('X-Ratelimit-Reset');
    const retryAfter = headers.get('Retry-After');

    if (remaining !== null) {
      const remainingCount = parseInt(remaining, 10);
      
      if (remainingCount === 0) {
        this.state.isLimited = true;
        
        if (retryAfter) {
          this.state.retryAfter = Date.now() + (parseInt(retryAfter, 10) * 1000);
        } else if (reset) {
          this.state.retryAfter = parseInt(reset, 10);
        }
        
        console.log('🚫 RATE LIMIT - Hit rate limit, backing off', {
          retryAfter: this.state.retryAfter,
          reset: reset
        });
      }
    }
  }

  /**
   * Calcula delay para próxima requisição
   */
  getNextRequestDelay(): number {
    if (this.state.isLimited && this.state.retryAfter) {
      const delay = this.state.retryAfter - Date.now();
      return Math.max(0, delay);
    }

    // Delay mínimo de 1 segundo entre requisições
    const timeSinceLastRequest = Date.now() - this.state.lastRequest;
    const minDelay = 1000;
    
    return Math.max(0, minDelay - timeSinceLastRequest);
  }

  /**
   * Implementa backoff exponencial para erros
   */
  handleError(error: any): void {
    console.log('⚠️ RATE LIMITER - Handling error', error);
    
    // Se for erro 429 (Too Many Requests), ativar rate limiting
    if (error.status === 429) {
      this.state.isLimited = true;
      this.state.retryAfter = Date.now() + 60000; // 1 minuto
    }
    
    // Se for erro 4XX/5XX, implementar backoff
    if (error.status >= 400) {
      const backoffTime = Math.min(
        1000 * Math.pow(this.BACKOFF_MULTIPLIER, this.state.requests.length),
        this.MAX_BACKOFF
      );
      
      this.state.isLimited = true;
      this.state.retryAfter = Date.now() + backoffTime;
      
      console.log('🔄 RATE LIMITER - Backoff applied', {
        backoffTime,
        errorStatus: error.status
      });
    }
  }

  /**
   * Reseta o rate limiter
   */
  reset(): void {
    this.state = {
      requests: [],
      lastRequest: 0,
      isLimited: false,
      retryAfter: undefined
    };
  }

  /**
   * Obtém status atual do rate limiter
   */
  getStatus(): RateLimitState {
    return { ...this.state };
  }
}

// Instância singleton
export const lnMarketsRateLimiter = new LNMarketsRateLimiter();

// Hook para usar o rate limiter
export const useRateLimiter = () => {
  return {
    canMakeRequest: () => lnMarketsRateLimiter.canMakeRequest(),
    recordRequest: () => lnMarketsRateLimiter.recordRequest(),
    processHeaders: (headers: Headers) => lnMarketsRateLimiter.processRateLimitHeaders(headers),
    handleError: (error: any) => lnMarketsRateLimiter.handleError(error),
    getDelay: () => lnMarketsRateLimiter.getNextRequestDelay(),
    getStatus: () => lnMarketsRateLimiter.getStatus(),
    reset: () => lnMarketsRateLimiter.reset()
  };
};
