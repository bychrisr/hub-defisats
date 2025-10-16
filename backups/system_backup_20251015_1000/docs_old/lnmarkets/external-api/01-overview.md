# LN Markets API v2 - Visão Geral

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Características Principais](#características-principais)
- [Endpoints Disponíveis](#endpoints-disponíveis)
- [Autenticação](#autenticação)
- [Rate Limits](#rate-limits)
- [Códigos de Resposta](#códigos-de-resposta)

## Visão Geral

A LN Markets API v2 é a API oficial para integração com a plataforma de trading de Bitcoin Lightning Network. Fornece acesso completo a:

- **Trading de Futuros**: Abertura, fechamento e gestão de posições
- **Gestão de Conta**: Saldos, depósitos, saques
- **Dados de Mercado**: Tickers, histórico de preços, índices
- **Notificações**: Eventos e alertas da conta

## Características Principais

### 🔐 Autenticação Segura
- HMAC SHA256 com timestamp
- Signature em base64 encoding
- Rate limiting integrado

### ⚡ Performance
- Resposta rápida (< 200ms típico)
- WebSocket support para dados em tempo real
- Caching inteligente

### 🛡️ Segurança
- Credenciais por conta
- Isolamento de dados entre contas
- Validação rigorosa de requests

## Endpoints Disponíveis

### User Endpoints
- `GET /v2/user` - Dados da conta
- `GET /v2/user/deposits/bitcoin` - Histórico de depósitos Bitcoin
- `GET /v2/user/deposits/lightning` - Histórico de depósitos Lightning
- `GET /v2/user/withdrawals` - Histórico de saques
- `GET /v2/notifications` - Notificações da conta

### Futures Trading
- `GET /v2/futures` - Posições ativas
- `POST /v2/futures` - Abrir nova posição
- `DELETE /v2/futures/{id}` - Fechar posição
- `GET /v2/futures/history` - Histórico de trades

### Market Data
- `GET /v2/futures/ticker` - Ticker atual
- `GET /v2/futures/index` - Índice de preço
- `GET /v2/futures/index/history` - Histórico do índice

### Swaps
- `GET /v2/swaps` - Lista de swaps
- `POST /v2/swaps` - Criar novo swap

## Autenticação

### Headers Obrigatórios

```http
LNM-ACCESS-KEY: {api_key}
LNM-ACCESS-SIGNATURE: {signature_base64}
LNM-ACCESS-TIMESTAMP: {timestamp_unix}
LNM-ACCESS-PASSPHRASE: {passphrase}
```

### Geração de Signature

```typescript
const timestamp = Math.floor(Date.now() / 1000).toString();
const method = 'GET';
const path = '/v2/user';
const queryString = '';
const body = '';

const message = timestamp + method + path + queryString + body;
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(message, 'utf8')
  .digest('base64');
```

## Rate Limits

- **Standard**: 100 requests/minute
- **Burst**: 10 requests/second
- **WebSocket**: 1 connection/account

## Códigos de Resposta

| Código | Significado |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized (Signature inválida) |
| 403 | Forbidden (Rate limit exceeded) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Exemplo de Request

```bash
curl -X GET "https://api.lnmarkets.com/v2/user" \
  -H "LNM-ACCESS-KEY: your_api_key" \
  -H "LNM-ACCESS-SIGNATURE: base64_signature" \
  -H "LNM-ACCESS-TIMESTAMP: 1640995200" \
  -H "LNM-ACCESS-PASSPHRASE: your_passphrase"
```

## Referências

- [Autenticação Detalhada](./02-authentication.md)
- [Lista Completa de Endpoints](./03-endpoints.md)
- [Rate Limits](./04-rate-limits.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
