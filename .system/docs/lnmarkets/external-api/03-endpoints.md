# LN Markets API v2 - Endpoints Completos

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [User Endpoints](#user-endpoints)
- [Futures Trading](#futures-trading)
- [Market Data](#market-data)
- [Swaps](#swaps)
- [Notificações](#notificações)

## Visão Geral

Esta documentação lista todos os endpoints disponíveis na LN Markets API v2, organizados por funcionalidade.

**Base URL**: `https://api.lnmarkets.com`

## User Endpoints

### GET /v2/user
Obtém dados da conta do usuário.

**Response:**
```json
{
  "uid": "user_123",
  "username": "trader123",
  "balance": 3567,
  "synthetic_usd_balance": 123.45,
  "role": "user",
  "email": "user@example.com",
  "kyc_level": 1
}
```

### GET /v2/user/deposits/bitcoin
Histórico de depósitos Bitcoin.

**Query Parameters:**
- `limit` (optional): Número de resultados (default: 100)
- `offset` (optional): Offset para paginação

**Response:**
```json
[
  {
    "id": "dep_123",
    "amount": 100000,
    "status": "completed",
    "created_at": "2025-01-09T10:00:00Z",
    "txid": "abc123..."
  }
]
```

### GET /v2/user/deposits/lightning
Histórico de depósitos Lightning Network.

**Response:**
```json
[
  {
    "id": "ln_dep_123",
    "amount": 50000,
    "status": "completed",
    "created_at": "2025-01-09T10:00:00Z",
    "invoice": "lnbc500n1p..."
  }
]
```

### GET /v2/user/withdrawals
Histórico de saques.

**Response:**
```json
[
  {
    "id": "with_123",
    "amount": 25000,
    "status": "completed",
    "created_at": "2025-01-09T10:00:00Z",
    "address": "bc1q..."
  }
]
```

## Futures Trading

### GET /v2/futures
Lista posições ativas.

**Response:**
```json
[
  {
    "id": "pos_123",
    "type": "m",
    "side": "b",
    "quantity": 100,
    "leverage": 10,
    "entry_price": 45000,
    "current_price": 46000,
    "pnl": 1000,
    "margin": 4500,
    "created_at": "2025-01-09T10:00:00Z"
  }
]
```

### POST /v2/futures
Abre nova posição.

**Request Body:**
```json
{
  "type": "m",
  "side": "b",
  "quantity": 100,
  "leverage": 10
}
```

**Response:**
```json
{
  "id": "pos_456",
  "type": "m",
  "side": "b",
  "quantity": 100,
  "leverage": 10,
  "entry_price": 45000,
  "margin": 4500,
  "created_at": "2025-01-09T10:00:00Z"
}
```

### DELETE /v2/futures/{id}
Fecha posição específica.

**Response:**
```json
{
  "id": "pos_123",
  "status": "closed",
  "pnl": 1000,
  "closed_at": "2025-01-09T11:00:00Z"
}
```

### GET /v2/futures/history
Histórico de trades.

**Query Parameters:**
- `limit` (optional): Número de resultados
- `offset` (optional): Offset para paginação

**Response:**
```json
[
  {
    "id": "trade_123",
    "type": "m",
    "side": "b",
    "quantity": 100,
    "entry_price": 45000,
    "exit_price": 46000,
    "pnl": 1000,
    "created_at": "2025-01-09T10:00:00Z",
    "closed_at": "2025-01-09T11:00:00Z"
  }
]
```

## Market Data

### GET /v2/futures/ticker
Ticker atual do mercado.

**Response:**
```json
{
  "bid": 45000,
  "ask": 45010,
  "last": 45005,
  "volume_24h": 1250000,
  "high_24h": 46000,
  "low_24h": 44000,
  "timestamp": "2025-01-09T10:00:00Z"
}
```

### GET /v2/futures/index
Índice de preço atual.

**Response:**
```json
{
  "price": 45005,
  "timestamp": "2025-01-09T10:00:00Z"
}
```

### GET /v2/futures/index/history
Histórico do índice de preço.

**Query Parameters:**
- `from` (optional): Data início (ISO 8601)
- `to` (optional): Data fim (ISO 8601)
- `interval` (optional): Intervalo (1m, 5m, 1h, 1d)

**Response:**
```json
[
  {
    "price": 45000,
    "timestamp": "2025-01-09T10:00:00Z"
  },
  {
    "price": 45005,
    "timestamp": "2025-01-09T10:01:00Z"
  }
]
```

## Swaps

### GET /v2/swaps
Lista de swaps.

**Response:**
```json
[
  {
    "id": "swap_123",
    "type": "btc_to_usd",
    "amount": 100000,
    "rate": 45000,
    "status": "completed",
    "created_at": "2025-01-09T10:00:00Z"
  }
]
```

### POST /v2/swaps
Cria novo swap.

**Request Body:**
```json
{
  "type": "btc_to_usd",
  "amount": 100000
}
```

**Response:**
```json
{
  "id": "swap_456",
  "type": "btc_to_usd",
  "amount": 100000,
  "rate": 45000,
  "status": "pending",
  "created_at": "2025-01-09T10:00:00Z"
}
```

## Notificações

### GET /v2/notifications
Lista notificações da conta.

**Query Parameters:**
- `limit` (optional): Número de resultados
- `offset` (optional): Offset para paginação
- `unread_only` (optional): Apenas não lidas

**Response:**
```json
[
  {
    "id": "notif_123",
    "type": "position_closed",
    "title": "Posição Fechada",
    "message": "Sua posição foi fechada com PnL de +1000 sats",
    "read": false,
    "created_at": "2025-01-09T10:00:00Z"
  }
]
```

## Códigos de Erro

| Código | Significado |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Signature inválida |
| 403 | Forbidden - Rate limit ou permissão |
| 404 | Not Found - Recurso não encontrado |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limits

- **Standard**: 100 requests/minute
- **Burst**: 10 requests/second
- **WebSocket**: 1 connection/account

## Referências

- [Visão Geral da API](./01-overview.md)
- [Autenticação](./02-authentication.md)
- [Rate Limits](./04-rate-limits.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
