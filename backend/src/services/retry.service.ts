import { Logger } from 'winston';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

export class RetryService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Executa uma função com retry e backoff exponencial
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      jitter = true
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.debug(`Retry attempt ${attempt}/${maxAttempts}`);
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          this.logger.error(`All retry attempts failed after ${maxAttempts} attempts`, {
            error: lastError.message,
            stack: lastError.stack
          });
          throw lastError;
        }

        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffMultiplier, jitter);
        this.logger.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message,
          nextAttempt: attempt + 1
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Executa uma operação de API com retry específico para APIs externas
   */
  async executeApiOperation<T>(
    operation: () => Promise<T>,
    apiName: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const defaultOptions: RetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true
    };

    const finalOptions = { ...defaultOptions, ...options };

    this.logger.info(`Executing API operation: ${apiName}`, {
      maxAttempts: finalOptions.maxAttempts,
      baseDelay: finalOptions.baseDelay
    });

    try {
      return await this.execute(operation, finalOptions);
    } catch (error) {
      this.logger.error(`API operation failed after all retries: ${apiName}`, {
        error: (error as Error).message,
        apiName
      });
      throw error;
    }
  }

  /**
   * Calcula o delay para o próximo retry
   */
  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number,
    jitter: boolean
  ): number {
    let delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
    
    // Aplicar jitter para evitar thundering herd
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.min(delay, maxDelay);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica se um erro é retryable
   */
  isRetryableError(error: any): boolean {
    if (!error) return false;

    // Erros de rede são retryable
    if (error.code === 'ECONNRESET' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT') {
      return true;
    }

    // Status codes específicos são retryable
    if (error.response?.status) {
      const status = error.response.status;
      return status >= 500 || status === 429; // Server errors e rate limiting
    }

    // Timeout errors são retryable
    if (error.message?.includes('timeout')) {
      return true;
    }

    return false;
  }
}