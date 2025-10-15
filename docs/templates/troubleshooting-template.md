---
title: "{Feature Name} - Troubleshooting"
version: "1.0.0"
created: "{YYYY-MM-DD}"
updated: "{YYYY-MM-DD}"
author: "Documentation Agent"
status: "active"
tags: ["troubleshooting", "{feature-tag}", "debug"]
---

# {Feature Name} - Troubleshooting

> **Status**: Active  
> **Última Atualização**: {YYYY-MM-DD}  
> **Versão**: 1.0.0  
> **Responsável**: {Feature Name} System  

## Índice

- [Visão Geral](#visão-geral)
- [Erros de Autenticação](#erros-de-autenticação)
- [Erros de Conectividade](#erros-de-conectividade)
- [Erros de Performance](#erros-de-performance)
- [Erros de Validação](#erros-de-validação)
- [Debug Tools](#debug-tools)
- [Logs e Monitoramento](#logs-e-monitoramento)
- [Códigos de Erro](#códigos-de-erro)
- [Procedimentos de Resolução](#procedimentos-de-resolução)
- [Referências](#referências)

## Visão Geral

Este documento contém guias para resolução de problemas comuns relacionados ao {Feature Name}. Organize os problemas por categoria e forneça soluções práticas.

## Erros de Autenticação

### Problema: Token de autenticação inválido

**Sintomas:**
- Erro 401 Unauthorized
- Mensagem: "Invalid authentication token"

**Causas Possíveis:**
1. Token expirado
2. Token malformado
3. Token não encontrado

**Soluções:**

```bash
# 1. Verificar validade do token
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/validate

# 2. Renovar token
curl -X POST https://api.example.com/auth/refresh \
  -H "Authorization: Bearer $TOKEN"

# 3. Verificar logs de autenticação
grep "AUTH_ERROR" /var/log/application.log | tail -10
```

**Prevenção:**
- Implementar refresh automático de tokens
- Configurar alertas para tokens próximos do vencimento

### Problema: Credenciais incorretas

**Sintomas:**
- Erro 403 Forbidden
- Mensagem: "Invalid credentials"

**Soluções:**

```bash
# Verificar credenciais no ambiente
echo $API_KEY
echo $API_SECRET

# Testar credenciais
curl -u "$API_KEY:$API_SECRET" https://api.example.com/test
```

## Erros de Conectividade

### Problema: Timeout de conexão

**Sintomas:**
- Erro: "Connection timeout"
- Tempo de resposta > 30 segundos

**Diagnóstico:**

```bash
# Testar conectividade de rede
ping api.example.com
telnet api.example.com 443

# Verificar DNS
nslookup api.example.com
dig api.example.com

# Testar com curl
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/health
```

**Soluções:**

```typescript
// Aumentar timeout
const client = new ApiClient({
  timeout: 60000, // 60 segundos
  retries: 3
});

// Implementar circuit breaker
const circuitBreaker = new CircuitBreaker(apiCall, {
  timeout: 60000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});
```

### Problema: DNS não resolve

**Sintomas:**
- Erro: "DNS resolution failed"
- Erro: "Name or service not known"

**Soluções:**

```bash
# Verificar configuração DNS
cat /etc/resolv.conf

# Testar com DNS alternativo
nslookup api.example.com 8.8.8.8

# Verificar cache DNS
sudo systemctl flush-dns
```

## Erros de Performance

### Problema: Latência alta

**Sintomas:**
- Tempo de resposta > 5 segundos
- Timeouts frequentes

**Diagnóstico:**

```bash
# Monitorar métricas de performance
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/metrics

# Verificar uso de CPU/Memória
top -p $(pgrep node)
htop

# Verificar I/O de disco
iostat -x 1
```

**Soluções:**

```typescript
// Implementar cache
const cache = new Map();
async function getData(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await expensiveOperation(key);
  cache.set(key, data);
  return data;
}

// Otimizar queries
const users = await db.users.findMany({
  select: { id: true, name: true }, // Apenas campos necessários
  where: { active: true },
  take: 100 // Limitar resultados
});
```

### Problema: Memory leak

**Sintomas:**
- Uso crescente de memória
- Aplicação lenta ou travando

**Diagnóstico:**

```bash
# Monitorar uso de memória
ps aux | grep node
pm2 monit

# Gerar heap dump
kill -USR2 $(pgrep node)
```

**Soluções:**

```typescript
// Limpar listeners de eventos
process.on('exit', () => {
  eventEmitter.removeAllListeners();
});

// Limitar cache size
class LimitedCache {
  private cache = new Map();
  private maxSize = 1000;
  
  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

## Erros de Validação

### Problema: Dados inválidos

**Sintomas:**
- Erro 400 Bad Request
- Mensagem: "Validation failed"

**Diagnóstico:**

```typescript
// Validar dados de entrada
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

try {
  const user = userSchema.parse(inputData);
} catch (error) {
  console.error('Validation errors:', error.errors);
}
```

**Soluções:**

```typescript
// Middleware de validação
function validateInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
}
```

## Debug Tools

### Logs Estruturados

```typescript
// Configurar logger com contexto
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'user-service',
    version: process.env.npm_package_version
  }
});

// Usar em diferentes níveis
logger.debug('Processing request', { requestId, userId });
logger.info('User created', { userId, email });
logger.warn('Rate limit exceeded', { userId, limit });
logger.error('Database error', { error: error.message, stack: error.stack });
```

### Debug Mode

```typescript
// Ativar debug mode
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  // Log detalhado
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Database query:', query);
}
```

### Health Checks

```typescript
// Endpoint de health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabase(),
    redis: await checkRedis()
  };
  
  res.json(health);
});
```

## Logs e Monitoramento

### Configuração de Logs

```bash
# Logs de aplicação
tail -f /var/log/application.log | grep ERROR

# Logs de sistema
journalctl -u axisor-backend -f

# Logs de Docker
docker logs -f axisor-backend
```

### Métricas Importantes

```typescript
// Métricas de performance
const metrics = {
  responseTime: histogram('http_request_duration_seconds'),
  requestCount: counter('http_requests_total'),
  errorCount: counter('http_errors_total'),
  activeConnections: gauge('active_connections')
};

// Coletar métricas
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    metrics.responseTime.observe(duration);
    metrics.requestCount.inc({ method: req.method, status: res.statusCode });
    
    if (res.statusCode >= 400) {
      metrics.errorCount.inc({ status: res.statusCode });
    }
  });
  
  next();
});
```

## Códigos de Erro

### Códigos de Erro Personalizados

```typescript
enum ErrorCodes {
  // Autenticação
  INVALID_TOKEN = 'AUTH_001',
  TOKEN_EXPIRED = 'AUTH_002',
  INVALID_CREDENTIALS = 'AUTH_003',
  
  // Validação
  VALIDATION_FAILED = 'VAL_001',
  REQUIRED_FIELD_MISSING = 'VAL_002',
  INVALID_FORMAT = 'VAL_003',
  
  // Conectividade
  CONNECTION_TIMEOUT = 'CONN_001',
  DNS_RESOLUTION_FAILED = 'CONN_002',
  NETWORK_ERROR = 'CONN_003',
  
  // Performance
  RATE_LIMIT_EXCEEDED = 'PERF_001',
  RESOURCE_EXHAUSTED = 'PERF_002',
  TIMEOUT = 'PERF_003'
}

class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCodes,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

## Procedimentos de Resolução

### Checklist de Troubleshooting

1. **Identificar o Problema**
   - [ ] Verificar logs de erro
   - [ ] Reproduzir o problema
   - [ ] Identificar padrões

2. **Diagnóstico**
   - [ ] Verificar métricas de sistema
   - [ ] Testar conectividade
   - [ ] Validar configurações

3. **Resolução**
   - [ ] Aplicar solução conhecida
   - [ ] Implementar workaround se necessário
   - [ ] Documentar solução

4. **Prevenção**
   - [ ] Implementar monitoramento
   - [ ] Configurar alertas
   - [ ] Atualizar documentação

### Escalation Path

1. **Nível 1**: Desenvolvedor/DevOps
   - Problemas conhecidos
   - Soluções documentadas

2. **Nível 2**: Arquitetos/Tech Lead
   - Problemas complexos
   - Mudanças de configuração

3. **Nível 3**: Especialistas/Vendor
   - Problemas críticos
   - Suporte externo necessário

## Referências

- [Arquitetura](./architecture.md)
- [Best Practices](./best-practices.md)
- [Monitoramento](../monitoring/)
- [Logs de Sistema](../monitoring/application-monitoring/)

## Como Usar Este Documento

• **Para Troubleshooting**: Use como guia passo-a-passo para resolver problemas comuns.

• **Para Prevenção**: Implemente as soluções preventivas para evitar problemas futuros.

• **Para Escalation**: Use o escalation path quando problemas não podem ser resolvidos localmente.
