# LN Markets API Endpoints - Documentação Completa

Este documento descreve todos os endpoints disponíveis para integração com a API do LN Markets através do hub-defisats.

## Visão Geral

O sistema expõe todos os endpoints disponíveis da API oficial do LN Markets, organizados por categoria:

- **Futures**: Operações com contratos futuros
- **Options**: Operações com opções
- **User**: Dados e operações do usuário
- **Market Data**: Dados de mercado

## Autenticação

Todos os endpoints requerem autenticação JWT. O usuário deve ter configurado suas credenciais do LN Markets no perfil.

### Headers Obrigatórios
```
Authorization: Bearer <jwt_token>
Content-Type: application/json (para POST/PUT)
```

## Base URL
```
http://localhost:13010/api
```

---

## 🚀 Futures Endpoints

### 1. Adicionar Margem
**POST** `/futures/add-margin`

Adiciona margem a uma posição ativa.

**Body:**
```json
{
  "id": "uuid-do-trade",
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "user-id",
    "type": "m",
    "id": "trade-id",
    "side": "b",
    "margin": 1000,
    "leverage": 10,
    "price": 20000,
    "liquidation": 18000,
    "pl": 80
  }
}
```

### 2. Cancelar Todos os Trades
**POST** `/futures/cancel-all-trades`

Cancela todos os trades de futuros ativos.

**Response:**
```json
{
  "success": true,
  "data": {
    "cancelled": 5,
    "message": "All trades cancelled"
  }
}
```

### 3. Fechar Todos os Trades
**POST** `/futures/close-all-trades`

Fecha todas as posições de futuros ativas.

**Response:**
```json
{
  "success": true,
  "data": {
    "closed": 3,
    "message": "All trades closed"
  }
}
```

### 4. Listar Trades
**GET** `/futures/trades`

Lista todos os trades de futuros com paginação e filtros.

**Query Parameters:**
- `limit` (string): Número de trades para retornar
- `offset` (string): Número de trades para pular
- `status` (string): Filtrar por status do trade
- `type` (string): Filtrar por tipo do trade

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "trade-id",
      "side": "b",
      "quantity": 100,
      "leverage": 10,
      "price": 20000,
      "status": "running"
    }
  ]
}
```

### 5. Atualizar Trade
**PUT** `/futures/trades/:id`

Atualiza parâmetros de um trade específico.

**Body:**
```json
{
  "stoploss": 18000,
  "takeprofit": 22000,
  "leverage": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "trade-id",
    "stoploss": 18000,
    "takeprofit": 22000,
    "leverage": 15
  }
}
```

### 6. Criar Trade
**POST** `/futures/trades`

Cria um novo trade de futuros.

**Body:**
```json
{
  "side": "b",
  "quantity": 100,
  "leverage": 10,
  "stoploss": 18000,
  "takeprofit": 22000,
  "margin_mode": "isolated"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-trade-id",
    "side": "b",
    "quantity": 100,
    "leverage": 10,
    "price": 20000,
    "status": "running"
  }
}
```

### 7. Dados do Mercado de Futuros
**GET** `/futures/market`

Retorna dados do mercado de futuros.

**Response:**
```json
{
  "success": true,
  "data": {
    "price": 20000,
    "volume": 1000000,
    "change_24h": 500,
    "high_24h": 20500,
    "low_24h": 19500
  }
}
```

### 8. Obter Trade Específico
**GET** `/futures/trades/:id`

Retorna detalhes de um trade específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "trade-id",
    "side": "b",
    "quantity": 100,
    "leverage": 10,
    "price": 20000,
    "liquidation": 18000,
    "pl": 80,
    "status": "running"
  }
}
```

---

## 📈 Options Endpoints

### 1. Fechar Todos os Trades de Opções
**POST** `/options/close-all-trades`

Fecha todas as posições de opções ativas.

**Response:**
```json
{
  "success": true,
  "data": {
    "closed": 2,
    "message": "All options trades closed"
  }
}
```

### 2. Listar Trades de Opções
**GET** `/options/trades`

Lista todos os trades de opções com paginação e filtros.

**Query Parameters:**
- `limit` (string): Número de trades para retornar
- `offset` (string): Número de trades para pular
- `status` (string): Filtrar por status do trade

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "options-trade-id",
      "side": "b",
      "quantity": 10,
      "instrument": "BTC-USD-CALL-20000-20241231",
      "status": "running"
    }
  ]
}
```

### 3. Atualizar Trade de Opções
**PUT** `/options/trades/:id`

Atualiza parâmetros de um trade de opções específico.

**Body:**
```json
{
  "stoploss": 18000,
  "takeprofit": 22000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "options-trade-id",
    "stoploss": 18000,
    "takeprofit": 22000
  }
}
```

### 4. Criar Trade de Opções
**POST** `/options/trades`

Cria um novo trade de opções.

**Body:**
```json
{
  "side": "b",
  "quantity": 10,
  "instrument": "BTC-USD-CALL-20000-20241231",
  "stoploss": 18000,
  "takeprofit": 22000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-options-trade-id",
    "side": "b",
    "quantity": 10,
    "instrument": "BTC-USD-CALL-20000-20241231",
    "status": "running"
  }
}
```

### 5. Dados do Mercado de Opções
**GET** `/options/market`

Retorna dados do mercado de opções.

**Response:**
```json
{
  "success": true,
  "data": {
    "instruments": [
      {
        "symbol": "BTC-USD-CALL-20000-20241231",
        "strike": 20000,
        "expiry": "2024-12-31",
        "type": "call",
        "price": 500
      }
    ]
  }
}
```

### 6. Obter Trade de Opções Específico
**GET** `/options/trades/:id`

Retorna detalhes de um trade de opções específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "options-trade-id",
    "side": "b",
    "quantity": 10,
    "instrument": "BTC-USD-CALL-20000-20241231",
    "price": 500,
    "status": "running"
  }
}
```

---

## 👤 User Endpoints

### 1. Dados do Usuário
**GET** `/lnmarkets/user`

Retorna dados do usuário no LN Markets.

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "user-id",
    "email": "user@example.com",
    "tier": 1,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Saldo do Usuário
**GET** `/lnmarkets/user/balance`

Retorna saldo do usuário no LN Markets.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1000000,
    "available": 950000,
    "reserved": 50000
  }
}
```

### 3. Histórico do Usuário
**GET** `/lnmarkets/user/history`

Retorna histórico de transações do usuário.

**Query Parameters:**
- `limit` (string): Número de registros para retornar
- `offset` (string): Número de registros para pular
- `type` (string): Filtrar por tipo de transação

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "transaction-id",
      "type": "deposit",
      "amount": 1000000,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 4. Trades do Usuário
**GET** `/lnmarkets/user/trades`

Retorna todos os trades do usuário.

**Query Parameters:**
- `limit` (string): Número de trades para retornar
- `offset` (string): Número de trades para pular
- `status` (string): Filtrar por status do trade

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "trade-id",
      "type": "futures",
      "side": "b",
      "quantity": 100,
      "status": "closed"
    }
  ]
}
```

### 5. Posições do Usuário
**GET** `/lnmarkets/user/positions`

Retorna posições ativas do usuário.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "position-id",
      "type": "futures",
      "side": "b",
      "quantity": 100,
      "unrealized_pl": 500
    }
  ]
}
```

### 6. Ordens do Usuário
**GET** `/lnmarkets/user/orders`

Retorna ordens ativas do usuário.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-id",
      "type": "limit",
      "side": "b",
      "quantity": 100,
      "price": 20000,
      "status": "pending"
    }
  ]
}
```

---

## 📊 Market Data Endpoints

### 1. Dados Gerais do Mercado
**GET** `/lnmarkets/market`

Retorna dados gerais do mercado.

**Response:**
```json
{
  "success": true,
  "data": {
    "btc_price": 20000,
    "volume_24h": 1000000,
    "change_24h": 500
  }
}
```

### 2. Dados de Futuros
**GET** `/lnmarkets/futures/data`

Retorna dados específicos do mercado de futuros.

**Response:**
```json
{
  "success": true,
  "data": {
    "price": 20000,
    "funding_rate": 0.0001,
    "open_interest": 5000000
  }
}
```

### 3. Dados de Opções
**GET** `/lnmarkets/options/data`

Retorna dados específicos do mercado de opções.

**Response:**
```json
{
  "success": true,
  "data": {
    "volatility_index": 0.5,
    "total_volume": 100000,
    "active_instruments": 25
  }
}
```

### 4. Testar Conexão
**GET** `/lnmarkets/test-connection`

Testa a conexão com a API do LN Markets.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Connection successful"
  }
}
```

---

## 🔧 Configuração

### Configurar Credenciais do LN Markets

Para usar os endpoints, o usuário deve configurar suas credenciais do LN Markets no perfil:

1. Acesse `/api/profile`
2. Configure os campos:
   - `lnmarkets_api_key`: Chave da API
   - `lnmarkets_api_secret`: Segredo da API
   - `lnmarkets_passphrase`: Frase secreta

### Rate Limiting

- **Endpoints autenticados**: 1 requisição por segundo
- **Endpoints públicos**: 30 requisições por minuto

### Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - formato de requisição inválido |
| 401 | Unauthorized - token JWT inválido ou credenciais LN Markets não configuradas |
| 403 | Forbidden - API key do LN Markets sem permissão necessária |
| 404 | Not Found - recurso não encontrado |
| 429 | Too Many Requests - limite de taxa excedido |
| 500 | Internal Server Error - erro interno do servidor |

---

## 📝 Exemplos de Uso

### Exemplo 1: Criar um Trade de Futuros
```bash
curl -X POST http://localhost:13010/api/futures/trades \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "side": "b",
    "quantity": 100,
    "leverage": 10,
    "stoploss": 18000,
    "takeprofit": 22000
  }'
```

### Exemplo 2: Obter Saldo do Usuário
```bash
curl -X GET http://localhost:13010/api/lnmarkets/user/balance \
  -H "Authorization: Bearer <jwt_token>"
```

### Exemplo 3: Listar Trades com Paginação
```bash
curl -X GET "http://localhost:13010/api/futures/trades?limit=10&offset=0&status=running" \
  -H "Authorization: Bearer <jwt_token>"
```

---

## 🚨 Notas Importantes

1. **Autenticação**: Todos os endpoints requerem autenticação JWT válida
2. **Credenciais**: O usuário deve ter configurado suas credenciais do LN Markets
3. **Rate Limiting**: Respeite os limites de taxa para evitar bloqueios
4. **Testnet**: Em desenvolvimento, as requisições são feitas para a testnet do LN Markets
5. **Logs**: Todas as operações são logadas para auditoria e debugging
6. **Segurança**: As credenciais do LN Markets são armazenadas de forma segura e criptografada

---

## 🔄 WebSocket (Futuro)

Em breve, será implementado suporte a WebSocket para dados em tempo real:

- Preços de mercado em tempo real
- Atualizações de posições
- Notificações de trades
- Alertas de margem

---

*Documentação atualizada em: 2024-12-19*
*Versão da API: v0.2.19*
