# User Exchange Accounts - Troubleshooting

> **Status**: Active  
> **Última Atualização**: 2025-01-14  
> **Versão**: 1.0.0  
> **Responsável**: User Exchange Accounts System  

## Índice

- [Visão Geral](#visão-geral)
- [Erros de Criptografia](#erros-de-criptografia)
- [Erros de Database](#erros-de-database)
- [Erros de Cache](#erros-de-cache)
- [Erros de Validação](#erros-de-validação)
- [Debug Tools](#debug-tools)
- [Logs e Monitoramento](#logs-e-monitoramento)
- [Referências](#referências)

## Visão Geral

Este documento lista os problemas mais comuns encontrados durante o uso do sistema de User Exchange Accounts e suas soluções.

## Erros de Criptografia

### Erro: "The 'key' argument must be of type string"

**Sintoma:**
```
Error: The "key" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, DataView, KeyObject, or CryptoKey. Received undefined
```

**Causa:** Chave de criptografia não encontrada ou `undefined`

**Solução:**
```typescript
// ❌ ERRADO: Acesso incorreto à chave
const key = crypto.scryptSync(config.security.encryption.key, 'salt', 32);

// ✅ CORRETO: Acesso correto à chave
const { securityConfig } = require('../config/env');
const key = crypto.scryptSync(securityConfig.encryption.key, 'salt', 32);
```

**Verificação:**
```bash
# Verificar se a variável de ambiente está definida
echo $SECURITY_ENCRYPTION_KEY
```

### Erro: "Invalid encrypted format"

**Sintoma:**
```
⚠️ USER EXCHANGE ACCOUNT SERVICE - Invalid encrypted format for api_key
```

**Causa:** Formato de credencial criptografada inválido

**Solução:**
```typescript
// Verificar formato antes de descriptografar
const [ivHex, encryptedHex] = value.split(':');
if (!ivHex || !encryptedHex) {
  console.warn(`⚠️ Invalid encrypted format for ${key}`);
  decryptedCredentials[key] = '';
  return;
}
```

### Erro: "Failed to decrypt credential"

**Sintoma:**
```
⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to decrypt credential api_key: Error: ...
```

**Causa:** Chave de criptografia incorreta ou dados corrompidos

**Solução:**
```typescript
// Implementar fallback seguro
try {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');
  decryptedCredentials[key] = decrypted;
} catch (error) {
  console.warn(`⚠️ Failed to decrypt credential ${key}:`, error);
  decryptedCredentials[key] = ''; // Fallback seguro
}
```

## Erros de Database

### Erro: "Invalid prisma.userExchangeAccounts.upsert() invocation"

**Sintoma:**
```
PrismaClientValidationError: Invalid prisma.userExchangeAccounts.upsert() invocation
Unknown argument user_id_exchange_id_account_name
```

**Causa:** Tentativa de usar composite unique key inexistente

**Solução:**
```typescript
// ❌ ERRADO: Usar composite unique key inexistente
await prisma.userExchangeAccounts.upsert({
  where: {
    user_id_exchange_id_account_name: { // ❌ Não existe
      user_id: userId,
      exchange_id: exchangeId,
      account_name: accountName
    }
  }
});

// ✅ CORRETO: Usar ID único
await prisma.userExchangeAccounts.upsert({
  where: { id: accountId },
  update: data,
  create: data
});
```

### Erro: "Migrations pending!"

**Sintoma:**
```
Migrations pending!
```

**Causa:** Migrações do Prisma não aplicadas

**Solução:**
```bash
# Aplicar migrações pendentes
npx prisma migrate deploy

# Se houver migrações específicas com erro
npx prisma migrate resolve --applied 20250112_margin_guard_v2
npx prisma migrate resolve --applied 20250126_add_user_preferences
```

### Erro: "Table 'user_preferences' already exists"

**Sintoma:**
```
Table 'user_preferences' already exists
```

**Causa:** Tabela já existe no banco mas migração não foi marcada como aplicada

**Solução:**
```bash
# Marcar migração como aplicada
npx prisma migrate resolve --applied 20250126_add_user_preferences
```

## Erros de Cache

### Erro: "connect ECONNREFUSED 127.0.0.1:6379"

**Sintoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Causa:** Redis não está rodando ou URL incorreta

**Solução:**
```typescript
// Implementar conexão lazy com fallback
let redis: Redis | null = null;

function getRedisConnection(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      connectTimeout: 10000,
      family: 4, // Force IPv4
    });
    
    redis.on('error', (err) => {
      console.warn('⚠️ Redis connection error:', err.message);
    });
  }
  return redis;
}
```

**Verificação:**
```bash
# Verificar se Redis está rodando
docker compose -f config/docker/docker-compose.dev.yml ps redis

# Verificar URL do Redis
echo $REDIS_URL
```

### Erro: "Cache error for account"

**Sintoma:**
```
⚠️ ACCOUNT CREDENTIALS - Cache error for account LN Markets Testnet: Error: ...
```

**Causa:** Problema de conexão com Redis

**Solução:**
```typescript
// Implementar fallback sem cache
try {
  const cachedCredentials = await this.credentialCache.get(cacheKey);
  if (cachedCredentials) {
    return cachedCredentials;
  }
} catch (cacheError) {
  console.warn(`⚠️ Cache error for account ${account.account_name}:`, cacheError);
  // Continue sem cache
}
```

## Erros de Validação

### Erro: "No active exchange account found"

**Sintoma:**
```
No active exchange account found
```

**Causa:** Usuário não tem conta ativa ou credenciais não encontradas

**Solução:**
```typescript
// Verificar se usuário tem contas
const accounts = await this.prisma.userExchangeAccounts.findMany({
  where: {
    user_id: userId,
    is_active: true,
    is_verified: true
  }
});

if (accounts.length === 0) {
  return reply.status(400).send({
    success: false,
    error: 'No active exchange account found. Please add an exchange account first.'
  });
}
```

### Erro: "User already has an account with this name"

**Sintoma:**
```
User already has an account with this name for this exchange
```

**Causa:** Tentativa de criar conta com nome duplicado

**Solução:**
```typescript
// Verificar se conta já existe antes de criar
const existingAccount = await this.prisma.userExchangeAccounts.findFirst({
  where: {
    user_id: userId,
    exchange_id: data.exchange_id,
    account_name: data.account_name
  }
});

if (existingAccount) {
  throw new Error('User already has an account with this name for this exchange');
}
```

## Debug Tools

### 1. Logs de Debug

```typescript
// Adicionar logs detalhados
console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Decrypting credentials:`, credentials);
console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Decrypted ${key}: ${decrypted}`);
console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to decrypt credential ${key}:`, error);
```

### 2. Verificação de Credenciais

```typescript
// Verificar se credenciais estão criptografadas
const credentials = await this.prisma.userExchangeAccounts.findUnique({
  where: { id: accountId },
  select: { credentials: true }
});

console.log('Credentials format:', Object.keys(credentials.credentials));
console.log('First credential value:', Object.values(credentials.credentials)[0]);
```

### 3. Teste de Criptografia

```typescript
// Testar criptografia/descriptografia
const testValue = 'test-credential';
const encrypted = authService.encryptData(testValue);
const decrypted = authService.decryptData(encrypted);
console.log('Test result:', testValue === decrypted);
```

## Logs e Monitoramento

### 1. Logs de Segurança

```typescript
// Logs para auditoria de segurança
console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Decrypting credentials:`, credentials);
console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Encrypted credential ${key}`);
console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to encrypt credential ${key}:`, error);
```

### 2. Logs de Performance

```typescript
// Logs para monitoramento de performance
console.log(`✅ ACCOUNT CREDENTIALS - Credentials found in cache for account ${account.account_name}`);
console.warn(`⚠️ ACCOUNT CREDENTIALS - Cache error for account ${account.account_name}:`, cacheError);
```

### 3. Logs de Erro

```typescript
// Logs detalhados de erro
console.error(`❌ USER EXCHANGE ACCOUNT SERVICE - Error updating account ${accountId}:`, error);
console.error(`❌ LN MARKETS USER CONTROLLER - Error getting positions:`, error);
```

### 4. Monitoramento de Redis

```bash
# Verificar status do Redis
docker compose -f config/docker/docker-compose.dev.yml logs redis

# Conectar ao Redis para debug
docker exec -it axisor-redis redis-cli
```

### 5. Monitoramento de Database

```bash
# Verificar status do PostgreSQL
docker compose -f config/docker/docker-compose.dev.yml logs postgres

# Conectar ao PostgreSQL para debug
docker exec -it axisor-postgres psql -U axisor -d axisor
```

## Referências

- [Arquitetura](./01-architecture.md)
- [Best Practices](./02-best-practices.md)
- [Guia de Migração](./03-migration-guide.md)
- [Exemplos Práticos](./05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
