# LN Markets API v2 - Troubleshooting

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Erros de Autenticação](#erros-de-autenticação)
- [Erros de Conectividade](#erros-de-conectividade)
- [Erros de Dados](#erros-de-dados)
- [Erros de Performance](#erros-de-performance)
- [Debug Tools](#debug-tools)
- [Logs e Monitoramento](#logs-e-monitoramento)

## Visão Geral

Este guia apresenta soluções para os problemas mais comuns encontrados ao usar a LNMarketsAPIv2, com exemplos práticos e ferramentas de debug.

## Erros de Autenticação

### "Signature is not valid"

**Sintomas:**
- API retorna status 401
- Mensagem: "Signature is not valid"
- Logs mostram requisição sendo rejeitada

**Causas Possíveis:**

#### 1. Encoding Incorreto
```typescript
// ❌ ERRADO: Usando hex encoding
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(message, 'utf8')
  .digest('hex');

// ✅ CORRETO: Usando base64 encoding
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(message, 'utf8')
  .digest('base64');
```

#### 2. Path sem /v2
```typescript
// ❌ ERRADO: Path sem prefixo /v2
const path = '/user';
const message = timestamp + method + path + queryString + body;

// ✅ CORRETO: Path com prefixo /v2
const fullPath = path.startsWith('/v2') ? path : `/v2${path}`;
const message = timestamp + method + fullPath + queryString + body;
```

#### 3. Credenciais Incorretas
```typescript
// ❌ ERRADO: Acessando credenciais incorretamente
const credentials = {
  apiKey: credentials.api_key,        // Campo não existe
  apiSecret: credentials.api_secret,  // Campo não existe
  passphrase: credentials.passphrase  // Campo não existe
};

// ✅ CORRETO: Acessando credenciais corretamente
const credentials = {
  apiKey: credentials.credentials['API Key'],
  apiSecret: credentials.credentials['API Secret'],
  passphrase: credentials.credentials['Passphrase'],
  isTestnet: false
};
```

#### 4. Timestamp Desatualizado
```typescript
// ✅ CORRETO: Sempre usar timestamp atual
const timestamp = Math.floor(Date.now() / 1000).toString();

// ❌ ERRADO: Usar timestamp fixo ou muito antigo
const timestamp = '1640995200'; // Timestamp fixo
```

**Debug de Autenticação:**
```typescript
// Adicionar logs detalhados para debug
console.log('🔍 Authentication Debug:', {
  timestamp,
  method,
  path: fullPath,
  message,
  signature,
  apiKey: credentials.apiKey.substring(0, 10) + '...',
  secretLength: credentials.apiSecret.length
});
```

### "Invalid API Key"

**Sintomas:**
- API retorna status 401
- Mensagem: "Invalid API Key"

**Soluções:**

#### 1. Verificar API Key
```typescript
// Verificar se API Key está correta
console.log('API Key:', credentials.apiKey);
console.log('API Key length:', credentials.apiKey.length);

// Deve começar com letras/números e terminar com =
// Exemplo: 8N0ZtEaYiZQZNQopDDgoTr8FkuV0jJr6HMOd0MiHF9w=
```

#### 2. Verificar Testnet vs Mainnet
```typescript
// ✅ CORRETO: Usar baseURL correta
const baseURL = credentials.isTestnet 
  ? 'https://api.testnet.lnmarkets.com' 
  : 'https://api.lnmarkets.com';

console.log('Using baseURL:', baseURL);
console.log('isTestnet:', credentials.isTestnet);
```

### "Invalid Passphrase"

**Sintomas:**
- API retorna status 401
- Mensagem: "Invalid Passphrase"

**Soluções:**

#### 1. Verificar Passphrase
```typescript
// Verificar passphrase
console.log('Passphrase:', credentials.passphrase);
console.log('Passphrase length:', credentials.passphrase.length);

// Deve ser string não vazia
// Exemplo: "passcphasec1"
```

#### 2. Verificar Encoding
```typescript
// Verificar se não há caracteres especiais
const isValidPassphrase = /^[a-zA-Z0-9]+$/.test(credentials.passphrase);
console.log('Valid passphrase format:', isValidPassphrase);
```

## Erros de Conectividade

### "ECONNREFUSED"

**Sintomas:**
- Erro de conexão recusada
- Timeout nas requisições

**Soluções:**

#### 1. Verificar Conectividade
```bash
# Testar conectividade com a API
curl -I https://api.lnmarkets.com/v2/user
```

#### 2. Implementar Retry Logic
```typescript
async function requestWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Connection failed, retrying in ${delay}ms (attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### 3. Circuit Breaker
```typescript
class ConnectionCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open - API unavailable');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailureTime) < this.timeout;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}
```

### "ETIMEDOUT"

**Sintomas:**
- Requisições timeout
- Resposta lenta da API

**Soluções:**

#### 1. Ajustar Timeout
```typescript
const axiosConfig = {
  timeout: 30000, // 30 segundos
  headers: {
    'User-Agent': 'Axisor-Trading-Bot/1.0'
  }
};
```

#### 2. Implementar Timeout Progressivo
```typescript
async function requestWithProgressiveTimeout<T>(
  operation: () => Promise<T>,
  initialTimeout: number = 10000
): Promise<T> {
  let timeout = initialTimeout;
  
  while (timeout <= 60000) { // Max 60 segundos
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const result = await operation();
      clearTimeout(timeoutId);
      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        timeout *= 2; // Dobrar timeout
        console.log(`Timeout ${timeout/2}ms exceeded, retrying with ${timeout}ms`);
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Max timeout exceeded');
}
```

## Erros de Dados

### "Cannot read properties of undefined"

**Sintomas:**
- Erro ao acessar propriedades de objetos
- Dados retornados como null/undefined

**Soluções:**

#### 1. Validação de Response
```typescript
function validateUserResponse(user: any): LNMarketsUser {
  if (!user || typeof user !== 'object') {
    throw new Error('Invalid user response');
  }

  if (typeof user.balance !== 'number') {
    throw new Error('Invalid balance in user response');
  }

  return {
    uid: user.uid || '',
    username: user.username || '',
    balance: user.balance,
    synthetic_usd_balance: user.synthetic_usd_balance || 0,
    role: user.role || 'user'
  };
}
```

#### 2. Safe Property Access
```typescript
// ❌ ERRADO: Acesso direto sem verificação
const balance = user.balance;

// ✅ CORRETO: Acesso seguro com fallback
const balance = user?.balance ?? 0;
```

#### 3. Validação de Array
```typescript
function validatePositionsResponse(positions: any): LNMarketsPosition[] {
  if (!Array.isArray(positions)) {
    console.warn('Positions response is not an array, returning empty array');
    return [];
  }

  return positions.filter(position => 
    position && 
    typeof position.id === 'string' &&
    typeof position.quantity === 'number'
  );
}
```

### "Invalid response format"

**Sintomas:**
- API retorna dados em formato inesperado
- Parsing de JSON falha

**Soluções:**

#### 1. Response Validation
```typescript
function validateApiResponse(response: any, expectedType: string): any {
  if (!response) {
    throw new Error(`Empty response for ${expectedType}`);
  }

  if (typeof response !== 'object') {
    throw new Error(`Invalid response type for ${expectedType}: expected object, got ${typeof response}`);
  }

  return response;
}
```

#### 2. JSON Parsing Error Handling
```typescript
function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Raw response:', jsonString);
    return fallback;
  }
}
```

## Erros de Performance

### "Rate limit exceeded"

**Sintomas:**
- API retorna status 429
- Mensagem: "Too Many Requests"

**Soluções:**

#### 1. Rate Limiting
```typescript
class RateLimiter {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly window: number;

  constructor(limit: number = 100, window: number = 60000) {
    this.limit = limit;
    this.window = window;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove requests outside the window
    this.requests = this.requests.filter(time => now - time < this.window);
    
    if (this.requests.length >= this.limit) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.window - (now - oldestRequest) + 1000; // +1s buffer
      
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

#### 2. Request Queuing
```typescript
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly maxConcurrent: number;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent);
      await Promise.all(batch.map(operation => operation()));
      
      // Small delay between batches
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.processing = false;
  }
}
```

## Debug Tools

### 1. Request Logger
```typescript
class RequestLogger {
  static logRequest(config: AxiosRequestConfig, userId?: string): void {
    console.log('🚀 LN Markets API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  static logResponse(response: AxiosResponse, duration: number, userId?: string): void {
    console.log('✅ LN Markets API Response:', {
      status: response.status,
      url: response.config.url,
      duration: `${duration}ms`,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  static logError(error: any, userId?: string): void {
    console.error('❌ LN Markets API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      userId,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 2. Health Check
```typescript
class LNMarketsHealthCheck {
  static async checkHealth(service: LNMarketsAPIv2): Promise<{
    healthy: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await service.user.getUser();
      const latency = Date.now() - startTime;
      
      return {
        healthy: true,
        latency
      };
    } catch (error: any) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }
}
```

### 3. Credentials Validator
```typescript
class CredentialsValidator {
  static validate(credentials: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!credentials || typeof credentials !== 'object') {
      errors.push('Credentials must be an object');
      return { valid: false, errors };
    }

    if (!credentials.apiKey || typeof credentials.apiKey !== 'string') {
      errors.push('API Key is required and must be a string');
    }

    if (!credentials.apiSecret || typeof credentials.apiSecret !== 'string') {
      errors.push('API Secret is required and must be a string');
    }

    if (!credentials.passphrase || typeof credentials.passphrase !== 'string') {
      errors.push('Passphrase is required and must be a string');
    }

    if (typeof credentials.isTestnet !== 'boolean') {
      errors.push('isTestnet must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## Logs e Monitoramento

### 1. Structured Logging
```typescript
interface LogContext {
  userId?: string;
  endpoint?: string;
  duration?: number;
  error?: string;
  metadata?: any;
}

class StructuredLogger {
  static info(message: string, context: LogContext = {}): void {
    console.log(`ℹ️ ${message}`, {
      ...context,
      timestamp: new Date().toISOString(),
      level: 'info'
    });
  }

  static error(message: string, context: LogContext = {}): void {
    console.error(`❌ ${message}`, {
      ...context,
      timestamp: new Date().toISOString(),
      level: 'error'
    });
  }

  static warn(message: string, context: LogContext = {}): void {
    console.warn(`⚠️ ${message}`, {
      ...context,
      timestamp: new Date().toISOString(),
      level: 'warn'
    });
  }
}
```

### 2. Metrics Collection
```typescript
class MetricsCollector {
  private metrics: Map<string, any> = new Map();

  recordApiCall(endpoint: string, duration: number, success: boolean): void {
    const key = `api.${endpoint}`;
    const current = this.metrics.get(key) || { calls: 0, totalDuration: 0, errors: 0 };
    
    current.calls++;
    current.totalDuration += duration;
    if (!success) current.errors++;
    
    this.metrics.set(key, current);
  }

  getMetrics(): any {
    const result: any = {};
    
    for (const [key, value] of this.metrics.entries()) {
      result[key] = {
        ...value,
        averageDuration: value.totalDuration / value.calls,
        errorRate: value.errors / value.calls
      };
    }
    
    return result;
  }
}
```

## Referências

- [Best Practices](./02-best-practices.md)
- [Migration Guide](./03-migration-guide.md)
- [Exemplos Práticos](./05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
