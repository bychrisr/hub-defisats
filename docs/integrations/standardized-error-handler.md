# Tratamento de Erros Padronizado

## Visão Geral

O `StandardizedErrorHandler` é um serviço centralizado para tratamento de erros em toda a plataforma Axisor. Ele fornece uma interface consistente para capturar, processar e responder a diferentes tipos de erros, garantindo uma experiência uniforme para os usuários e facilitando o debugging.

## Características Principais

### 🎯 **Tratamento Específico por Tipo de Erro**
- Erros de API externa
- Erros de autenticação
- Erros de autorização
- Erros de validação
- Erros de rate limiting
- Erros de banco de dados
- Erros de criptografia

### 📊 **Logging Estruturado**
- Logs detalhados com contexto
- Rastreamento de erros por serviço
- Métricas de erro

### 🔄 **Respostas Padronizadas**
- Formato consistente de erro
- Códigos de status HTTP apropriados
- Mensagens de erro amigáveis

## Uso Básico

```typescript
import { StandardizedErrorHandler, ErrorContext } from '../services/standardized-error-handler.service';
import { Logger } from 'winston';

// Inicialização
const logger = createLogger();
const errorHandler = new StandardizedErrorHandler(logger);

// Uso básico
try {
  // Operação que pode falhar
  const result = await someOperation();
  return result;
} catch (error) {
  const context = errorHandler.createContext('service-name', 'operation-name');
  const apiError = errorHandler.handleInternalError(error, context);
  return errorHandler.sendErrorResponse(reply, apiError);
}
```

## Tipos de Erro Suportados

### **1. Erros de API Externa**
```typescript
try {
  const response = await externalAPI.get('/data');
  return response.data;
} catch (error) {
  const context = errorHandler.createContext('external-api', 'fetch-data');
  const apiError = errorHandler.handleExternalAPIError(error, context);
  return errorHandler.sendErrorResponse(reply, apiError);
}
```

**Resposta de exemplo:**
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Resource not found",
  "details": {
    "response": { "error": "Not Found" },
    "headers": {},
    "url": "/data",
    "method": "GET"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req-123"
}
```

### **2. Erros de Autenticação**
```typescript
try {
  const user = await authenticateUser(token);
  return user;
} catch (error) {
  const context = errorHandler.createContext('auth', 'authenticate', userId);
  const apiError = errorHandler.handleAuthenticationError(error, context);
  return errorHandler.sendErrorResponse(reply, apiError);
}
```

**Resposta de exemplo:**
```json
{
  "success": false,
  "error": "AUTHENTICATION_FAILED",
  "message": "Authentication failed",
  "details": {
    "reason": "Invalid token",
    "service": "auth"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req-123"
}
```

### **3. Erros de Autorização**
```typescript
try {
  const result = await performAuthorizedOperation();
  return result;
} catch (error) {
  const context = errorHandler.createContext('service', 'operation', userId);
  const apiError = errorHandler.handleAuthorizationError(error, context);
  return errorHandler.sendErrorResponse(reply, apiError);
}
```

### **4. Erros de Validação**
```typescript
try {
  const validatedData = await validateInput(data);
  return validatedData;
} catch (error) {
  const context = errorHandler.createContext('validation', 'validate-input');
  const apiError = errorHandler.handleValidationError(error, context);
  return errorHandler.sendErrorResponse(reply, apiError);
}
```

### **5. Erros de Rate Limiting**
```typescript
try {
  const response = await rateLimitedAPI.get('/data');
  return response.data;
} catch (error) {
  const context = errorHandler.createContext('api', 'fetch-data');
  const apiError = errorHandler.handleRateLimitError(error, context);
  return errorHandler.sendErrorResponse(reply, apiError);
}
```

### **6. Erros de Banco de Dados**
```typescript
try {
  const result = await database.query('SELECT * FROM users');
  return result;
} catch (error) {
  const context = errorHandler.createContext('database', 'query-users');
  const apiError = errorHandler.handleDatabaseError(error, context);
  return errorHandler.sendErrorResponse(reply, apiError);
}
```

### **7. Erros de Criptografia**
```typescript
try {
  const decrypted = await decryptData(encryptedData);
  return decrypted;
} catch (error) {
  const context = errorHandler.createContext('crypto', 'decrypt-data');
  const apiError = errorHandler.handleEncryptionError(error, context);
  return errorHandler.sendErrorResponse(reply, apiError);
}
```

## Contexto de Erro

### **Criação de Contexto**
```typescript
const context = errorHandler.createContext(
  'service-name',      // Nome do serviço
  'operation-name',    // Nome da operação
  'user-id',          // ID do usuário (opcional)
  'request-id'        // ID da requisição (opcional)
);
```

### **Contexto Automático**
```typescript
const context = errorHandler.createContext('trading-service', 'execute-trade', userId, requestId);
```

## Logging de Erros

### **Log de Erro**
```typescript
const error = new Error('Something went wrong');
const context = errorHandler.createContext('service', 'operation');

errorHandler.logError(error, context, 'error');
```

### **Log de Aviso**
```typescript
const warning = new Error('Non-critical issue');
const context = errorHandler.createContext('service', 'operation');

errorHandler.logError(warning, context, 'warn');
```

### **Log de Informação**
```typescript
const info = new Error('Information message');
const context = errorHandler.createContext('service', 'operation');

errorHandler.logError(info, context, 'info');
```

## Respostas de Erro Padronizadas

### **Estrutura da Resposta**
```typescript
interface APIError {
  code: string;           // Código do erro
  message: string;        // Mensagem amigável
  statusCode: number;     // Código HTTP
  details?: any;          // Detalhes adicionais
  timestamp: string;      // Timestamp do erro
  requestId?: string;     // ID da requisição
}
```

### **Códigos de Erro Comuns**
- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `UNPROCESSABLE_ENTITY` (422)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_SERVER_ERROR` (500)
- `BAD_GATEWAY` (502)
- `SERVICE_UNAVAILABLE` (503)
- `GATEWAY_TIMEOUT` (504)

## Integração com Fastify

### **Middleware de Erro Global**
```typescript
import { StandardizedErrorHandler } from './services/standardized-error-handler.service';

const errorHandler = new StandardizedErrorHandler(logger);

fastify.setErrorHandler(async (error, request, reply) => {
  const context = errorHandler.createContext(
    'fastify',
    request.routerPath,
    request.user?.id,
    request.id
  );

  let apiError;
  
  if (error.statusCode) {
    // Erro HTTP conhecido
    apiError = errorHandler.handleExternalAPIError(error, context);
  } else {
    // Erro interno
    apiError = errorHandler.handleInternalError(error, context);
  }

  return errorHandler.sendErrorResponse(reply, apiError);
});
```

### **Tratamento de Erro em Rotas**
```typescript
fastify.get('/api/data', async (request, reply) => {
  try {
    const data = await fetchData();
    return { success: true, data };
  } catch (error) {
    const context = errorHandler.createContext('data-service', 'fetch-data');
    const apiError = errorHandler.handleInternalError(error, context);
    return errorHandler.sendErrorResponse(reply, apiError);
  }
});
```

## Integração com Outros Serviços

### **Com CentralizedHTTPClient**
```typescript
import { CentralizedHTTPClient } from './centralized-http-client.service';

const httpClient = new CentralizedHTTPClient(config, logger);

try {
  const response = await httpClient.get('/external-api/data');
  return response.data;
} catch (error) {
  const context = errorHandler.createContext('http-client', 'external-api-call');
  const apiError = errorHandler.handleExternalAPIError(error, context);
  throw apiError;
}
```

### **Com IntelligentCacheStrategy**
```typescript
import { IntelligentCacheStrategy } from './intelligent-cache-strategy.service';

const cacheStrategy = new IntelligentCacheStrategy(redis, logger);

try {
  const data = await cacheStrategy.get('key', 'type');
  return data;
} catch (error) {
  const context = errorHandler.createContext('cache', 'get-data');
  const apiError = errorHandler.handleDatabaseError(error, context);
  throw apiError;
}
```

## Configuração Avançada

### **Personalização de Mensagens**
```typescript
// O errorHandler automaticamente mapeia códigos de status para mensagens
// Mas você pode personalizar as mensagens no contexto específico

const customError = {
  ...error,
  message: 'Custom error message for this specific case'
};

const apiError = errorHandler.handleExternalAPIError(customError, context);
```

### **Adição de Metadados**
```typescript
const context = errorHandler.createContext('service', 'operation', userId, requestId);
context.metadata = {
  customField: 'value',
  additionalInfo: 'context-specific data'
};

const apiError = errorHandler.handleInternalError(error, context);
```

## Monitoramento e Métricas

### **Logs Estruturados**
```typescript
// O errorHandler automaticamente gera logs estruturados
logger.error('Error occurred', {
  service: 'trading-service',
  operation: 'execute-trade',
  userId: 'user-123',
  requestId: 'req-456',
  error: 'Trade execution failed',
  stack: error.stack,
  metadata: { tradeId: 'trade-789' }
});
```

### **Métricas de Erro**
```typescript
// Você pode implementar métricas personalizadas
const errorMetrics = {
  service: context.service,
  operation: context.operation,
  errorType: apiError.code,
  timestamp: apiError.timestamp,
  userId: context.userId
};

// Enviar para sistema de métricas
metricsService.recordError(errorMetrics);
```

## Boas Práticas

### **1. Sempre Use Contexto**
```typescript
// ✅ Bom
const context = errorHandler.createContext('service', 'operation', userId);
const apiError = errorHandler.handleInternalError(error, context);

// ❌ Evitar
const apiError = errorHandler.handleInternalError(error, {});
```

### **2. Tratamento Específico por Tipo**
```typescript
// ✅ Bom - Tratamento específico
if (error.response?.status === 401) {
  const apiError = errorHandler.handleAuthenticationError(error, context);
} else if (error.response?.status === 429) {
  const apiError = errorHandler.handleRateLimitError(error, context);
} else {
  const apiError = errorHandler.handleExternalAPIError(error, context);
}
```

### **3. Logging Apropriado**
```typescript
// ✅ Bom - Log com nível apropriado
errorHandler.logError(error, context, 'error');   // Para erros críticos
errorHandler.logError(error, context, 'warn');    // Para avisos
errorHandler.logError(error, context, 'info');    // Para informações
```

### **4. Resposta Consistente**
```typescript
// ✅ Bom - Sempre use sendErrorResponse
return errorHandler.sendErrorResponse(reply, apiError);

// ❌ Evitar - Resposta manual
return reply.status(500).send({ error: 'Something went wrong' });
```

## Troubleshooting

### **Erro Não Capturado**
```typescript
// Verificar se o contexto está correto
const context = errorHandler.createContext('service', 'operation');
console.log('Context:', context);

// Verificar se o tipo de erro está correto
if (error.response) {
  // Erro de API externa
  const apiError = errorHandler.handleExternalAPIError(error, context);
} else {
  // Erro interno
  const apiError = errorHandler.handleInternalError(error, context);
}
```

### **Logs Não Aparecendo**
```typescript
// Verificar configuração do logger
const logger = createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});
```

### **Resposta de Erro Incorreta**
```typescript
// Verificar se está usando sendErrorResponse
const apiError = errorHandler.handleInternalError(error, context);
return errorHandler.sendErrorResponse(reply, apiError);
```

## Conclusão

O `StandardizedErrorHandler` é uma peça fundamental da arquitetura de erro da plataforma Axisor. Ele garante que todos os erros sejam tratados de forma consistente, fornecendo logs estruturados e respostas padronizadas para os usuários.

Para mais informações sobre integração com outros serviços, consulte:
- [CentralizedHTTPClient](./centralized-http-client.md)
- [IntelligentCacheStrategy](./intelligent-cache-strategy.md)
- [WebSocketManagerOptimized](./websocket-manager-optimized.md)
