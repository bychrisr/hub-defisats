# Segurança em Mercados Voláteis - Princípios e Implementação

## 🚨 **Por que NÃO podemos usar dados antigos ou simulados?**

### **Contexto: Mercados Financeiros Voláteis**

Em mercados financeiros, especialmente criptomoedas como Bitcoin, os preços podem variar drasticamente em **segundos ou minutos**. Dados desatualizados podem causar:

- **Perdas financeiras reais** para traders
- **Decisões de trading incorretas** baseadas em preços antigos
- **Violação de confiança** do usuário
- **Responsabilidade legal** por informações incorretas

### **Exemplos Reais de Volatilidade**

```
Bitcoin pode variar:
- 5-10% em 1 hora
- 20-30% em 1 dia
- 50%+ em 1 semana

Dados de 5 minutos atrás podem estar:
- 2-5% desatualizados
- Completamente irrelevantes
- Perigosos para trading
```

## 🛡️ **Princípios de Segurança Implementados**

### **1. Zero Tolerância a Dados Antigos**

```typescript
// ❌ NUNCA FAZER ISSO
if (apiFails) {
  return cachedDataFrom5MinutesAgo; // PERIGOSO!
}

// ✅ SEMPRE FAZER ISSO
if (apiFails) {
  return error("Dados indisponíveis - não exibimos dados antigos");
}
```

### **2. Cache Diferenciado por Tipo de Dados (Implementado)**

```typescript
// ✅ IMPLEMENTADO - Cache diferenciado conforme ADR-006 e ADR-007
class IntelligentCache {
  private readonly MAX_TTL_MARKET = 30 * 1000; // 30 segundos para dados de mercado
  private readonly MAX_TTL_HISTORICAL = 5 * 60 * 1000; // 5 minutos para dados históricos

  set(key: string, data: any, customTtl?: number): void {
    // Determinar TTL baseado no tipo de dados
    let ttl = customTtl;
    
    if (!ttl) {
      // TTL automático baseado no tipo de dados
      if (key.includes('historical_')) {
        ttl = this.MAX_TTL_HISTORICAL; // 5 minutos para dados históricos
      } else {
        ttl = this.MAX_TTL_MARKET; // 30 segundos para dados de mercado
      }
    }
    
    // Garantir que não exceda os limites de segurança
    const maxTtl = key.includes('historical_') ? this.MAX_TTL_HISTORICAL : this.MAX_TTL_MARKET;
    ttl = Math.min(ttl, maxTtl);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
}
```

**Por que cache diferenciado?**
- **Dados de mercado**: Devem ser muito recentes (30s máximo)
- **Dados históricos**: Podem ser cacheados por mais tempo (5min) sem risco
- **Performance**: Melhora significativa em scroll/lazy loading
- **Segurança**: Mantém princípios de segurança para dados voláteis

### **3. Nenhum Fallback com Dados Simulados**

```typescript
// ❌ NUNCA FAZER ISSO
const fallbackData = {
  index: 115000, // Preço simulado - PERIGOSO!
  change24h: 0
};

// ✅ SEMPRE FAZER ISSO
const marketIndex = apiSuccess ? realData : null;
if (!marketIndex) {
  showError("Dados indisponíveis");
}
```

### **4. Validação Rigorosa de Timestamps**

```typescript
// Verificar se dados são realmente recentes
const dataAge = Date.now() - data.timestamp;
if (dataAge > 30000) { // 30 segundos
  rejectData("Dados muito antigos");
}
```

## 🔧 **Implementação Técnica**

### **Backend - Market Data API**

```typescript
// Cache apenas 30 segundos
let marketDataCache = {
  data: null,
  timestamp: 0,
  ttl: 30 * 1000
};

// NUNCA usar cache antigo em caso de erro
if (apiFails) {
  return reply.status(503).send({
    success: false,
    error: 'SERVICE_UNAVAILABLE',
    message: 'Market data temporarily unavailable'
  });
}
```

### **Frontend - Validação de Dados**

```typescript
// Verificar se market data está disponível
if (!marketIndex || marketResponse.status === 'rejected') {
  setData(prev => ({
    ...prev,
    error: 'Dados de mercado indisponíveis - dados podem estar desatualizados'
  }));
  return; // NÃO atualizar cache
}
```

### **Interface de Erro Educativa**

```tsx
<MarketDataError 
  error="Dados de mercado indisponíveis"
  onRetry={handleRetry}
>
  <p>
    Por segurança, não exibimos dados desatualizados em mercados voláteis.
    Dados antigos podem causar decisões de trading incorretas e perdas financeiras.
  </p>
</MarketDataError>
```

## 📊 **Métricas de Segurança**

### **Tempo Máximo de Cache (Implementado)**
- ✅ **30 segundos**: Aceitável para dados de mercado (IMPLEMENTADO)
- ✅ **5 minutos**: Aceitável para dados históricos (IMPLEMENTADO)
- ❌ **5 minutos**: Muito antigo para dados de mercado
- ❌ **1 hora**: Completamente irrelevante para dados de mercado

### **Validação de Dados**
- ✅ **Timestamp obrigatório**: Todos os dados devem ter timestamp
- ✅ **Validação de idade**: Rejeitar dados > 30 segundos
- ✅ **Fonte confiável**: Apenas APIs oficiais (LN Markets, Binance)

### **Tratamento de Erros**
- ✅ **Erro claro**: Usuário sabe que dados não estão disponíveis
- ✅ **Retry disponível**: Pode tentar novamente
- ✅ **Educação**: Explica por que não exibe dados antigos

## 🚫 **O que NUNCA fazer**

### **1. Cache Longo**
```typescript
// ❌ PERIGOSO
ttl: 5 * 60 * 1000 // 5 minutos - muito antigo
```

### **2. Dados Padrão**
```typescript
// ❌ PERIGOSO
const fallback = { index: 115000, change24h: 0 };
```

### **3. Cache em Erro**
```typescript
// ❌ PERIGOSO
if (apiFails && hasOldCache) {
  return oldCache; // Dados podem estar desatualizados
}
```

### **4. Dados Simulados**
```typescript
// ❌ PERIGOSO
const simulatedData = generateFakeMarketData();
```

## ✅ **O que SEMPRE fazer**

### **1. Validação Rigorosa**
```typescript
// ✅ SEGURO
if (!isDataRecent(data) || !isDataValid(data)) {
  return error("Dados indisponíveis");
}
```

### **2. Erro Transparente**
```typescript
// ✅ SEGURO
return {
  success: false,
  error: 'Dados de mercado indisponíveis',
  message: 'Por segurança, não exibimos dados antigos'
};
```

### **3. Interface Educativa**
```tsx
// ✅ SEGURO
<Alert>
  Dados de mercado indisponíveis. Em mercados voláteis, 
  dados desatualizados podem causar perdas financeiras.
</Alert>
```

## 🎯 **Benefícios da Implementação**

### **Para o Usuário**
- ✅ **Segurança**: Nunca recebe dados que podem causar perdas
- ✅ **Transparência**: Sabe quando dados não estão disponíveis
- ✅ **Confiança**: Sistema é honesto sobre limitações
- ✅ **Educação**: Entende por que dados antigos são perigosos

### **Para o Sistema**
- ✅ **Integridade**: Dados sempre atuais ou erro claro
- ✅ **Performance**: Cache otimizado sem comprometer segurança
- ✅ **Manutenibilidade**: Código claro sobre princípios de segurança
- ✅ **Escalabilidade**: Fácil de entender e manter

## 📝 **Checklist de Segurança (Implementado)**

- [x] Cache máximo de 30 segundos para dados de mercado
- [x] Cache de 5 minutos para dados históricos (conforme ADR-006)
- [x] Cache diferenciado por tipo de dados (IMPLEMENTADO)
- [x] Nenhum fallback com dados simulados
- [x] Validação de timestamp em todos os dados
- [x] Erro claro quando dados indisponíveis
- [x] Interface educativa sobre riscos
- [x] Retry disponível para usuário
- [x] Logs detalhados para debugging (IMPLEMENTADO)
- [x] Testes de validação de dados
- [x] Limpeza automática de cache (IMPLEMENTADO)
- [x] Monitoramento de cache hit/miss (IMPLEMENTADO)

## 🔗 **Referências**

- [LN Markets API Documentation](https://docs.lnmarkets.com/)
- [Binance API Documentation](https://binance-docs.github.io/apidocs/)
- [Financial Data Security Best Practices](https://example.com)
- [Volatility Risk Management](https://example.com)

---

**Documento**: Segurança em Mercados Voláteis  
**Versão**: 1.0.0  
**Última Atualização**: 2025-01-21  
**Responsável**: Equipe de Desenvolvimento
