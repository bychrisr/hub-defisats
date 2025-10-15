# LN Markets API v2 - Autenticação

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Credenciais Necessárias](#credenciais-necessárias)
- [Algoritmo de Autenticação](#algoritmo-de-autenticação)
- [Implementação](#implementação)
- [Exemplos Práticos](#exemplos-práticos)
- [Troubleshooting](#troubleshooting)

## Visão Geral

A autenticação da LN Markets API v2 utiliza HMAC SHA256 com timestamp para garantir a integridade e autenticidade das requisições. O signature é codificado em **base64** (não hexadecimal).

## Credenciais Necessárias

### Obtidas do Dashboard LN Markets

```typescript
interface LNMarketsCredentials {
  apiKey: string;        // LNM-ACCESS-KEY
  apiSecret: string;     // Para gerar signature
  passphrase: string;    // LNM-ACCESS-PASSPHRASE
  isTestnet: boolean;    // true para testnet, false para mainnet
}
```

### Exemplo Real (Teste)

```typescript
const credentials = {
  apiKey: '8N0ZtEaYiZQZNQopDDgoTr8FkuV0jJr6HMOd0MiHF9w=',
  apiSecret: '6qmuTLGZpvUH2kchz3Ww9vnYOYtBgDZ741LpF1fYz3Ro62DOncRu/GXCSshCf2ThFOE90/kLUju9orcuUEIddQ==',
  passphrase: 'passcphasec1',
  isTestnet: false
};
```

## Algoritmo de Autenticação

### 1. Preparar Dados

```typescript
const timestamp = Math.floor(Date.now() / 1000).toString();
const method = 'GET';                    // HTTP method
const path = '/v2/user';                 // Endpoint path
const queryString = '';                  // Query parameters (se houver)
const body = '';                         // Request body (se houver)
```

### 2. Construir Message

```typescript
const message = timestamp + method + path + queryString + body;
```

**Importante**: O path deve incluir `/v2` prefix.

### 3. Gerar Signature

```typescript
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(message, 'utf8')
  .digest('base64');  // ← BASE64, não hex!
```

### 4. Headers da Requisição

```http
LNM-ACCESS-KEY: {apiKey}
LNM-ACCESS-SIGNATURE: {signature}
LNM-ACCESS-TIMESTAMP: {timestamp}
LNM-ACCESS-PASSPHRASE: {passphrase}
```

## Implementação

### Cliente HTTP Base

```typescript
import crypto from 'crypto';
import axios, { AxiosRequestConfig } from 'axios';

export class LNMarketsClient {
  private credentials: LNMarketsCredentials;

  constructor(credentials: LNMarketsCredentials, private logger: any) {
    this.credentials = credentials;
  }

  private authenticateRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = config.method?.toUpperCase() || 'GET';
    const path = config.url || '';
    const queryString = config.params ? this.buildQueryString(config.params) : '';
    const body = config.data ? JSON.stringify(config.data) : '';

    // Create signature message (include /v2 in path for LN Markets API)
    const fullPath = path.startsWith('/v2') ? path : `/v2${path}`;
    const message = timestamp + method + fullPath + queryString + body;

    // Generate HMAC SHA256 signature in base64 (REQUIRED by LN Markets API)
    const signature = crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(message, 'utf8')
      .digest('base64');

    config.headers = {
      ...config.headers,
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'Content-Type': 'application/json',
    };

    return config;
  }

  private buildQueryString(params: any): string {
    return new URLSearchParams(params).toString();
  }
}
```

## Exemplos Práticos

### GET /v2/user

```typescript
const request = {
  method: 'GET',
  url: '/user',
  params: {}
};

// Message construída:
// "1640995200GET/v2/user"
// Signature: base64(HMAC-SHA256(message, secret))
```

### POST /v2/futures

```typescript
const request = {
  method: 'POST',
  url: '/futures',
  data: {
    type: 'm',
    side: 'b',
    quantity: 100,
    leverage: 10
  }
};

// Message construída:
// "1640995200POST/v2/futures{\"type\":\"m\",\"side\":\"b\",\"quantity\":100,\"leverage\":10}"
```

## Troubleshooting

### Erro: "Signature is not valid"

**Causas Comuns:**

1. **Encoding Incorreto**
   ```typescript
   // ❌ Errado (hex)
   .digest('hex')
   
   // ✅ Correto (base64)
   .digest('base64')
   ```

2. **Path sem /v2**
   ```typescript
   // ❌ Errado
   const path = '/user';
   
   // ✅ Correto
   const path = '/v2/user';
   ```

3. **Timestamp Desatualizado**
   ```typescript
   // ✅ Sempre usar timestamp atual
   const timestamp = Math.floor(Date.now() / 1000).toString();
   ```

4. **Credenciais Incorretas**
   ```typescript
   // ✅ Verificar se as credenciais estão corretas
   console.log('API Key:', credentials.apiKey);
   console.log('Secret length:', credentials.apiSecret.length);
   console.log('Passphrase:', credentials.passphrase);
   ```

### Debug de Autenticação

```typescript
// Adicionar logs para debug
console.log('Timestamp:', timestamp);
console.log('Method:', method);
console.log('Path:', fullPath);
console.log('Message:', message);
console.log('Signature:', signature);
console.log('Headers:', {
  'LNM-ACCESS-KEY': credentials.apiKey,
  'LNM-ACCESS-SIGNATURE': signature,
  'LNM-ACCESS-TIMESTAMP': timestamp,
  'LNM-ACCESS-PASSPHRASE': credentials.passphrase
});
```

## Referências

- [Visão Geral da API](./01-overview.md)
- [Implementação Interna](../internal-implementation/01-architecture.md)
- [Exemplos de Uso](../internal-implementation/05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
