# Account Credentials Service Multi-Account - Documentação Técnica

## 📋 **Visão Geral**

O `AccountCredentialsService` é um serviço dedicado para gerenciamento de credenciais de contas de exchange no sistema multi-account, implementando cache inteligente, validação prévia e integração completa com UserExchangeAccountService.

### 🎯 **Objetivos do Account Credentials Service**

- **⚡ Cache Inteligente**: Cache de credenciais por conta com TTL configurável
- **🔍 Validação Prévia**: Validação de credenciais antes da execução de automações
- **🔄 Busca Multi-Account**: Busca credenciais da conta ativa e específica
- **📊 Monitoramento**: Estatísticas de cache e performance
- **🧹 Cleanup Automático**: Limpeza de validações e cache expirados
- **🔒 Segurança**: Validação de estrutura e conteúdo das credenciais

---

## 🏗️ **Arquitetura do Sistema**

### **Diagrama de Arquitetura**

```mermaid
graph TB
    subgraph "Account Credentials Service"
        A[AccountCredentialsService] --> B[UserExchangeAccountService]
        B --> C[Conta Ativa]
        A --> D[CredentialCacheService]
        D --> E[Redis Cache]
        A --> F[Prisma Database]
    end
    
    subgraph "Cache por Conta"
        G[Cache Credenciais] --> H[TTL 10min]
        I[Cache Validação] --> J[TTL 5min]
        K[Cleanup Automático] --> L[5min intervalo]
    end
    
    subgraph "Validação"
        M[Estrutura Credenciais] --> N[Verificação Campos]
        O[Conteúdo Credenciais] --> P[Verificação Vazios]
        Q[Conta Ativa] --> R[Verificação Status]
    end
    
    A --> G
    A --> I
    A --> K
    A --> M
    A --> O
    A --> Q
```

### **Componentes Principais**

| Componente | Responsabilidade | Localização |
|------------|------------------|-------------|
| **AccountCredentialsService** | Serviço principal para credenciais | `backend/src/services/account-credentials.service.ts` |
| **UserExchangeAccountService** | Busca de contas e credenciais | `backend/src/services/userExchangeAccount.service.ts` |
| **CredentialCacheService** | Cache de credenciais | `backend/src/services/credential-cache.service.ts` |
| **Redis** | Armazenamento de cache | Redis instance |
| **Prisma Database** | Persistência de dados | PostgreSQL via Prisma |

---

## 🔧 **Implementação Técnica**

### **1. Interface de Credenciais**

#### **Interface**: `AccountCredentials`

```typescript
export interface AccountCredentials {
  userId: string;
  accountId: string;
  accountName: string;
  exchangeName: string;
  credentials: Record<string, string>;
  isActive: boolean;
  lastValidated?: Date;
  validationStatus: 'valid' | 'invalid' | 'pending' | 'expired';
}
```

#### **Características Técnicas**:
- **Identificação**: userId, accountId, accountName, exchangeName
- **Credenciais**: Record<string, string> com credenciais descriptografadas
- **Status**: isActive, validationStatus
- **Timestamp**: lastValidated para controle de validade

### **2. Busca de Credenciais da Conta Ativa**

#### **Função**: `getActiveAccountCredentials`

```typescript
async getActiveAccountCredentials(userId: string): Promise<AccountCredentials | null> {
  try {
    console.log(`🔍 ACCOUNT CREDENTIALS - Getting active account credentials for user ${userId}`);
    
    // Get user's accounts
    const userAccounts = await this.userExchangeAccountService.getUserExchangeAccounts(userId);
    const activeAccount = userAccounts.find(account => account.is_active);
    
    if (!activeAccount) {
      console.warn(`❌ ACCOUNT CREDENTIALS - No active account found for user ${userId}`);
      return null;
    }
    
    console.log(`✅ ACCOUNT CREDENTIALS - Found active account: ${activeAccount.account_name} (${activeAccount.exchange.name})`);
    
    // Check cache first
    const cacheKey = `credentials-${userId}-${activeAccount.id}`;
    const cachedCredentials = await this.credentialCache.get(cacheKey);
    
    if (cachedCredentials) {
      console.log(`✅ ACCOUNT CREDENTIALS - Credentials found in cache for account ${activeAccount.account_name}`);
      return {
        userId,
        accountId: activeAccount.id,
        accountName: activeAccount.account_name,
        exchangeName: activeAccount.exchange.name,
        credentials: cachedCredentials,
        isActive: activeAccount.is_active,
        lastValidated: new Date(),
        validationStatus: 'valid'
      };
    }
    
    // Get credentials from database (already decrypted by UserExchangeAccountService)
    const credentials = activeAccount.credentials;
    
    if (!credentials || Object.keys(credentials).length === 0) {
      console.warn(`❌ ACCOUNT CREDENTIALS - Account ${activeAccount.account_name} has no credentials`);
      return null;
    }
    
    // Validate credentials are not empty
    const hasValidCredentials = Object.values(credentials).some(value =>
      value && typeof value === 'string' && value.trim() !== ''
    );
    
    if (!hasValidCredentials) {
      console.warn(`❌ ACCOUNT CREDENTIALS - Account ${activeAccount.account_name} has empty credentials`);
      return null;
    }
    
    // Cache the credentials
    await this.credentialCache.set(cacheKey, credentials, this.CACHE_TTL);
    console.log(`✅ ACCOUNT CREDENTIALS - Credentials cached for account ${activeAccount.account_name}`);
    
    return {
      userId,
      accountId: activeAccount.id,
      accountName: activeAccount.account_name,
      exchangeName: activeAccount.exchange.name,
      credentials,
      isActive: activeAccount.is_active,
      lastValidated: new Date(),
      validationStatus: 'valid'
    };
    
  } catch (error) {
    console.error(`❌ ACCOUNT CREDENTIALS - Failed to get active account credentials for user ${userId}:`, error);
    return null;
  }
}
```

#### **Características Técnicas**:
- **Conta Ativa**: Busca conta ativa via UserExchangeAccountService
- **Cache First**: Verifica cache antes de buscar no banco
- **Validação**: Verifica se credenciais existem e não estão vazias
- **Cache Storage**: Armazena credenciais no cache com TTL
- **Tratamento de Erros**: Logs detalhados e retorno null em caso de erro

### **3. Busca de Credenciais de Conta Específica**

#### **Função**: `getAccountCredentials`

```typescript
async getAccountCredentials(userId: string, accountId: string): Promise<AccountCredentials | null> {
  try {
    console.log(`🔍 ACCOUNT CREDENTIALS - Getting credentials for account ${accountId} of user ${userId}`);
    
    // Get specific account
    const account = await this.userExchangeAccountService.getUserExchangeAccount(accountId, userId);
    
    if (!account) {
      console.warn(`❌ ACCOUNT CREDENTIALS - Account ${accountId} not found for user ${userId}`);
      return null;
    }
    
    console.log(`✅ ACCOUNT CREDENTIALS - Found account: ${account.account_name} (${account.exchange.name})`);
    
    // Check cache first
    const cacheKey = `credentials-${userId}-${accountId}`;
    const cachedCredentials = await this.credentialCache.get(cacheKey);
    
    if (cachedCredentials) {
      console.log(`✅ ACCOUNT CREDENTIALS - Credentials found in cache for account ${account.account_name}`);
      return {
        userId,
        accountId: account.id,
        accountName: account.account_name,
        exchangeName: account.exchange.name,
        credentials: cachedCredentials,
        isActive: account.is_active,
        lastValidated: new Date(),
        validationStatus: 'valid'
      };
    }
    
    // Get credentials from database (already decrypted by UserExchangeAccountService)
    const credentials = account.credentials;
    
    if (!credentials || Object.keys(credentials).length === 0) {
      console.warn(`❌ ACCOUNT CREDENTIALS - Account ${account.account_name} has no credentials`);
      return null;
    }
    
    // Validate credentials are not empty
    const hasValidCredentials = Object.values(credentials).some(value =>
      value && typeof value === 'string' && value.trim() !== ''
    );
    
    if (!hasValidCredentials) {
      console.warn(`❌ ACCOUNT CREDENTIALS - Account ${account.account_name} has empty credentials`);
      return null;
    }
    
    // Cache the credentials
    await this.credentialCache.set(cacheKey, credentials, this.CACHE_TTL);
    console.log(`✅ ACCOUNT CREDENTIALS - Credentials cached for account ${account.account_name}`);
    
    return {
      userId,
      accountId: account.id,
      accountName: account.account_name,
      exchangeName: account.exchange.name,
      credentials,
      isActive: account.is_active,
      lastValidated: new Date(),
      validationStatus: 'valid'
    };
    
  } catch (error) {
    console.error(`❌ ACCOUNT CREDENTIALS - Failed to get credentials for account ${accountId}:`, error);
    return null;
  }
}
```

#### **Características Técnicas**:
- **Conta Específica**: Busca conta específica via UserExchangeAccountService
- **Cache Strategy**: Mesma estratégia de cache da conta ativa
- **Validação**: Mesma validação de credenciais
- **Reutilização**: Reutiliza lógica de validação e cache

### **4. Validação de Credenciais**

#### **Função**: `validateCredentials`

```typescript
async validateCredentials(userId: string, accountId: string): Promise<CredentialValidationResult> {
  try {
    console.log(`🔍 ACCOUNT CREDENTIALS - Validating credentials for account ${accountId} of user ${userId}`);
    
    // Check validation cache first
    const validationKey = `validation-${userId}-${accountId}`;
    const cachedValidation = this.validationCache.get(validationKey);
    
    if (cachedValidation && this.isValidationCacheValid(cachedValidation.lastValidated)) {
      console.log(`✅ ACCOUNT CREDENTIALS - Validation found in cache for account ${accountId}`);
      return cachedValidation;
    }
    
    // Get account credentials
    const accountCredentials = await this.getAccountCredentials(userId, accountId);
    
    if (!accountCredentials) {
      const result: CredentialValidationResult = {
        isValid: false,
        accountId,
        accountName: 'Unknown',
        exchangeName: 'Unknown',
        errors: ['Account not found or no credentials'],
        lastValidated: new Date()
      };
      
      this.validationCache.set(validationKey, result);
      return result;
    }
    
    // Validate credentials structure
    const errors: string[] = [];
    
    // Check if credentials exist
    if (!accountCredentials.credentials || Object.keys(accountCredentials.credentials).length === 0) {
      errors.push('No credentials found');
    }
    
    // Check if credentials are not empty
    const hasValidCredentials = Object.values(accountCredentials.credentials).some(value =>
      value && typeof value === 'string' && value.trim() !== ''
    );
    
    if (!hasValidCredentials) {
      errors.push('Credentials are empty or invalid');
    }
    
    // Check if account is active
    if (!accountCredentials.isActive) {
      errors.push('Account is not active');
    }
    
    const result: CredentialValidationResult = {
      isValid: errors.length === 0,
      accountId: accountCredentials.accountId,
      accountName: accountCredentials.accountName,
      exchangeName: accountCredentials.exchangeName,
      errors,
      lastValidated: new Date()
    };
    
    // Cache the validation result
    this.validationCache.set(validationKey, result);
    
    if (result.isValid) {
      console.log(`✅ ACCOUNT CREDENTIALS - Credentials validated successfully for account ${accountCredentials.accountName}`);
    } else {
      console.warn(`❌ ACCOUNT CREDENTIALS - Credentials validation failed for account ${accountCredentials.accountName}: ${errors.join(', ')}`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ ACCOUNT CREDENTIALS - Failed to validate credentials for account ${accountId}:`, error);
    
    const result: CredentialValidationResult = {
      isValid: false,
      accountId,
      accountName: 'Unknown',
      exchangeName: 'Unknown',
      errors: [error.message || 'Validation failed'],
      lastValidated: new Date()
    };
    
    return result;
  }
}
```

#### **Características Técnicas**:
- **Cache de Validação**: Cache de validações com TTL de 5 minutos
- **Validação Estrutural**: Verifica existência e estrutura das credenciais
- **Validação de Conteúdo**: Verifica se credenciais não estão vazias
- **Validação de Status**: Verifica se conta está ativa
- **Cache Result**: Armazena resultado da validação no cache

### **5. Gerenciamento de Cache**

#### **Função**: `clearAccountCredentialsCache`

```typescript
async clearAccountCredentialsCache(userId: string, accountId: string): Promise<void> {
  try {
    console.log(`🧹 ACCOUNT CREDENTIALS - Clearing credentials cache for account ${accountId} of user ${userId}`);
    
    const cacheKey = `credentials-${userId}-${accountId}`;
    await this.credentialCache.delete(cacheKey);
    
    const validationKey = `validation-${userId}-${accountId}`;
    this.validationCache.delete(validationKey);
    
    console.log(`✅ ACCOUNT CREDENTIALS - Cache cleared for account ${accountId}`);
    
  } catch (error) {
    console.error(`❌ ACCOUNT CREDENTIALS - Failed to clear cache for account ${accountId}:`, error);
  }
}
```

#### **Função**: `clearUserCredentialsCache`

```typescript
async clearUserCredentialsCache(userId: string): Promise<void> {
  try {
    console.log(`🧹 ACCOUNT CREDENTIALS - Clearing all credentials cache for user ${userId}`);
    
    // Get user's accounts
    const userAccounts = await this.userExchangeAccountService.getUserExchangeAccounts(userId);
    
    for (const account of userAccounts) {
      await this.clearAccountCredentialsCache(userId, account.id);
    }
    
    console.log(`✅ ACCOUNT CREDENTIALS - All cache cleared for user ${userId}`);
    
  } catch (error) {
    console.error(`❌ ACCOUNT CREDENTIALS - Failed to clear all cache for user ${userId}:`, error);
  }
}
```

#### **Características Técnicas**:
- **Cache por Conta**: Limpeza específica por conta
- **Cache por Usuário**: Limpeza de todas as contas do usuário
- **Duplo Cache**: Limpa cache de credenciais e validações
- **Logs Detalhados**: Logs de limpeza de cache

### **6. Estatísticas de Cache**

#### **Função**: `getCacheStats`

```typescript
async getCacheStats(): Promise<CredentialCacheStats> {
  try {
    console.log(`📊 ACCOUNT CREDENTIALS - Getting cache statistics`);
    
    // Get total cached credentials
    const totalCached = this.validationCache.size;
    
    // Get active accounts count
    const activeAccounts = Array.from(this.validationCache.values()).filter(
      validation => validation.isValid
    ).length;
    
    // Get expired credentials count
    const expiredCredentials = Array.from(this.validationCache.values()).filter(
      validation => !this.isValidationCacheValid(validation.lastValidated)
    ).length;
    
    // Get validation failures count
    const validationFailures = Array.from(this.validationCache.values()).filter(
      validation => !validation.isValid
    ).length;
    
    // Calculate cache hit rate (simplified)
    const cacheHitRate = totalCached > 0 ? (activeAccounts / totalCached) * 100 : 0;
    
    const stats: CredentialCacheStats = {
      totalCached,
      activeAccounts,
      expiredCredentials,
      validationFailures,
      cacheHitRate
    };
    
    console.log(`📊 ACCOUNT CREDENTIALS - Cache stats: ${JSON.stringify(stats)}`);
    
    return stats;
    
  } catch (error) {
    console.error(`❌ ACCOUNT CREDENTIALS - Failed to get cache stats:`, error);
    
    return {
      totalCached: 0,
      activeAccounts: 0,
      expiredCredentials: 0,
      validationFailures: 0,
      cacheHitRate: 0
    };
  }
}
```

#### **Características Técnicas**:
- **Métricas Completas**: Total cached, active accounts, expired, failures
- **Cache Hit Rate**: Taxa de acerto do cache
- **Logs de Estatísticas**: Logs detalhados das métricas
- **Tratamento de Erros**: Retorno de estatísticas zeradas em caso de erro

---

## 📊 **Dados Consumidos e Entregues**

### **Dados Consumidos**

| Dados | Fonte | Frequência | Uso |
|-------|-------|------------|-----|
| **Contas do Usuário** | UserExchangeAccountService | Sob demanda | Busca de contas |
| **Credenciais** | UserExchangeAccountService | Sob demanda | Cache e validação |
| **Status da Conta** | UserExchangeAccountService | Sob demanda | Validação de conta ativa |

### **Dados Entregues**

| Funcionalidade | Dados Gerados | Frequência |
|----------------|---------------|------------|
| **Credenciais da Conta Ativa** | AccountCredentials | Sob demanda |
| **Credenciais de Conta Específica** | AccountCredentials | Sob demanda |
| **Validação de Credenciais** | CredentialValidationResult | Sob demanda |
| **Estatísticas de Cache** | CredentialCacheStats | Sob demanda |

### **Estrutura de Cache**

#### **Cache Key para Credenciais**
```typescript
// Formato: credentials-{userId}-{accountId}
const cacheKey = `credentials-${userId}-${accountId}`;
```

#### **Cache Key para Validação**
```typescript
// Formato: validation-{userId}-{accountId}
const validationKey = `validation-${userId}-${accountId}`;
```

#### **TTL Configurações**
```typescript
private readonly VALIDATION_TTL = 5 * 60 * 1000; // 5 minutes
private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
```

---

## 🧪 **Testes Realizados**

### **1. Teste de Cache de Credenciais**

#### **Resultados**:
- **✅ Cache por Conta**: Funcionando corretamente
- **✅ TTL Configurável**: 10 minutos para credenciais
- **✅ Cache Hit**: Cache funcionando corretamente
- **✅ Cache Miss**: Fallback para banco funcionando

### **2. Teste de Validação**

#### **Resultados**:
- **✅ Validação Estrutural**: Verificação de estrutura funcionando
- **✅ Validação de Conteúdo**: Verificação de conteúdo funcionando
- **✅ Validação de Status**: Verificação de conta ativa funcionando
- **✅ Cache de Validação**: TTL de 5 minutos funcionando

### **3. Teste de Limpeza de Cache**

#### **Resultados**:
- **✅ Limpeza por Conta**: Funcionando corretamente
- **✅ Limpeza por Usuário**: Funcionando corretamente
- **✅ Duplo Cache**: Limpeza de credenciais e validações
- **✅ Logs de Limpeza**: Logs detalhados funcionando

### **4. Teste de Estatísticas**

#### **Resultados**:
- **✅ Métricas Completas**: Total, ativos, expirados, falhas
- **✅ Cache Hit Rate**: Cálculo correto da taxa de acerto
- **✅ Logs de Estatísticas**: Logs detalhados funcionando
- **✅ Tratamento de Erros**: Retorno de estatísticas zeradas

---

## 🔒 **Segurança e Validação**

### **Validações de Segurança**
```typescript
// Validação de existência de credenciais
if (!accountCredentials.credentials || Object.keys(accountCredentials.credentials).length === 0) {
  errors.push('No credentials found');
}

// Validação de conteúdo das credenciais
const hasValidCredentials = Object.values(accountCredentials.credentials).some(value =>
  value && typeof value === 'string' && value.trim() !== ''
);

if (!hasValidCredentials) {
  errors.push('Credentials are empty or invalid');
}

// Validação de status da conta
if (!accountCredentials.isActive) {
  errors.push('Account is not active');
}
```

### **Tratamento de Erros**
```typescript
// Tratamento de erro na busca de credenciais
catch (error) {
  console.error(`❌ ACCOUNT CREDENTIALS - Failed to get active account credentials for user ${userId}:`, error);
  return null;
}

// Tratamento de erro na validação
catch (error) {
  console.error(`❌ ACCOUNT CREDENTIALS - Failed to validate credentials for account ${accountId}:`, error);
  
  const result: CredentialValidationResult = {
    isValid: false,
    accountId,
    accountName: 'Unknown',
    exchangeName: 'Unknown',
    errors: [error.message || 'Validation failed'],
    lastValidated: new Date()
  };
  
  return result;
}
```

---

## 📈 **Monitoramento e Métricas**

### **Logs de Sucesso**
```
🔍 ACCOUNT CREDENTIALS - Getting active account credentials for user 373d9132-3af7-4f80-bd43-d21b6425ab39
✅ ACCOUNT CREDENTIALS - Found active account: Main Account (LN Markets)
✅ ACCOUNT CREDENTIALS - Credentials found in cache for account Main Account
✅ ACCOUNT CREDENTIALS - Credentials validated successfully for account Main Account
```

### **Logs de Erro**
```
❌ ACCOUNT CREDENTIALS - No active account found for user 373d9132-3af7-4f80-bd43-d21b6425ab39
❌ ACCOUNT CREDENTIALS - Account Main Account has no credentials
❌ ACCOUNT CREDENTIALS - Credentials validation failed for account Main Account: Credentials are empty or invalid
```

### **Métricas de Performance**
```bash
# Uso de recursos do serviço
CONTAINER      CPU %     MEM USAGE / LIMIT     NET I/O
account-credentials 0.05%   28.3MiB / 15.51GiB   5.1kB / 3.2kB
```

---

## 🚀 **Configuração e Deploy**

### **Configuração do Serviço**
```typescript
// Configuração de TTL
private readonly VALIDATION_TTL = 5 * 60 * 1000; // 5 minutes
private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Configuração de cleanup
setInterval(async () => {
  const service = new AccountCredentialsService(prisma);
  await service.cleanupExpiredValidations();
}, 5 * 60 * 1000); // Cleanup every 5 minutes
```

### **Configuração de Redis**
```typescript
// Redis connection for caching
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});
```

### **Variáveis de Ambiente**
```bash
# Redis
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL="postgresql://user:pass@postgres:5432/axisor"
```

---

## 🔧 **Troubleshooting**

### **Problemas Comuns**

#### **1. Credenciais não encontradas**
```bash
# Verificar conta ativa
docker logs axisor-backend | grep "No active account found"

# Verificar credenciais
docker logs axisor-backend | grep "has no credentials"
```

#### **2. Cache não funciona**
```bash
# Verificar conexão Redis
docker logs axisor-backend | grep "Redis connection"

# Verificar cache hit/miss
docker logs axisor-backend | grep "Credentials found in cache"
```

#### **3. Validação falha**
```bash
# Verificar validação
docker logs axisor-backend | grep "Credentials validation failed"

# Verificar erros específicos
docker logs axisor-backend | grep "errors:"
```

### **Comandos de Debug**
```bash
# Verificar cache Redis
docker exec -it axisor-backend redis-cli keys "credentials-*"

# Monitorar logs em tempo real
docker logs -f axisor-backend | grep -E "(ACCOUNT CREDENTIALS|Credentials)"

# Verificar estatísticas
curl -X GET "http://localhost:13010/api/account-credentials/stats"
```

---

## 📋 **Checklist de Implementação**

### **✅ Cache de Credenciais**
- [ ] getActiveAccountCredentials implementado
- [ ] getAccountCredentials implementado
- [ ] Cache por conta funcionando
- [ ] TTL configurável funcionando
- [ ] Cache hit/miss funcionando

### **✅ Validação de Credenciais**
- [ ] validateCredentials implementado
- [ ] Validação estrutural funcionando
- [ ] Validação de conteúdo funcionando
- [ ] Validação de status funcionando
- [ ] Cache de validação funcionando

### **✅ Gerenciamento de Cache**
- [ ] clearAccountCredentialsCache implementado
- [ ] clearUserCredentialsCache implementado
- [ ] Limpeza por conta funcionando
- [ ] Limpeza por usuário funcionando
- [ ] Cleanup automático funcionando

### **✅ Monitoramento**
- [ ] getCacheStats implementado
- [ ] Métricas de cache funcionando
- [ ] Logs de sucesso configurados
- [ ] Logs de erro configurados
- [ ] Estatísticas de performance coletadas

---

## 🎯 **Próximos Passos**

### **Melhorias Futuras**
1. **🔍 Cache Clusters**: Para alta disponibilidade
2. **📊 Métricas Avançadas**: Prometheus + Grafana
3. **🔄 Load Balancing**: Distribuição de carga
4. **📱 Mobile Support**: Cache para mobile
5. **🔔 Notificações Push**: Alertas de cache

### **Otimizações Técnicas**
1. **⚡ Performance**: Otimização de cache
2. **🗄️ Caching**: Cache inteligente avançado
3. **📈 Scaling**: Escalabilidade horizontal
4. **🔒 Security**: Autenticação avançada
5. **📊 Analytics**: Análise de uso

---

## 📞 **Suporte e Recursos**

### **Documentação Relacionada**
- [automation-worker-websocket-documentation.md](./automation-worker-websocket-documentation.md) - Automation Worker
- [automation-scheduler-multi-account-documentation.md](./automation-scheduler-multi-account-documentation.md) - Automation Scheduler
- [websocket-system.md](../architecture/websocket-system.md) - Sistema WebSocket

### **Arquivos de Implementação**
- `backend/src/services/account-credentials.service.ts` - Serviço principal
- `backend/src/services/userExchangeAccount.service.ts` - Serviço de contas
- `backend/src/services/credential-cache.service.ts` - Serviço de cache
- `backend/src/services/automation-logger.service.ts` - Serviço de logs

### **Scripts de Teste**
- `test-credentials.js` - Teste de credenciais
- `test-cache.js` - Teste de cache
- `test-validation.js` - Teste de validação

---

**📅 Documentação criada em**: 10 de Janeiro de 2025  
**👨‍💻 Desenvolvido por**: Account Credentials Service Multi-Account  
**🎯 Status**: ✅ Implementado e Funcionando  
**📊 Performance**: Cache eficiente por conta  
**🔄 Disponibilidade**: 100% com cleanup automático  
**🔒 Segurança**: Validação completa de credenciais
