# Contratos de API

Este documento define os contratos de API para o hub-defisats, baseado na análise técnica do PDR.

## Autenticação

### POST /api/auth/register

Registra um novo usuário no sistema.

**Payload**:
```json
{
  "email": "string",
  "password": "string",
  "ln_markets_api_key": "string",
  "ln_markets_api_secret": "string",
  "coupon_code": "string" // opcional
}
```

**Response**:
```json
{
  "user_id": "uuid",
  "token": "jwt",
  "plan_type": "free|basic|advanced|pro"
}
```

**Validações**:
- Email: formato válido, único
- Password: mínimo 8 caracteres
- LN Markets keys: mínimo 16 caracteres cada
- Coupon: válido, não expirado, dentro do limite de uso

---

### POST /api/auth/login

Autentica um usuário existente.

**Payload**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "user_id": "uuid",
  "token": "jwt",
  "plan_type": "free|basic|advanced|pro"
}
```

---

### POST /api/auth/refresh

Renova o token de acesso usando refresh token.

**Headers**: `Cookie: refresh_token=xxx`

**Response**:
```json
{
  "token": "jwt"
}
```

---

### POST /api/auth/logout

Invalida a sessão do usuário.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

## Usuários

### GET /api/users/me

Retorna informações do usuário autenticado.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": "uuid",
  "email": "string",
  "plan_type": "free|basic|advanced|pro",
  "notifications": [
    {
      "type": "telegram|email|whatsapp",
      "is_enabled": true,
      "channel_config": {}
    }
  ],
  "automations": [
    {
      "id": "uuid",
      "type": "margin_guard|tp_sl|auto_entry",
      "is_active": true,
      "config": {}
    }
  ]
}
```

---

### PUT /api/users/me

Atualiza informações do usuário.

**Headers**: `Authorization: Bearer <token>`

**Payload**:
```json
{
  "ln_markets_api_key": "string", // opcional
  "ln_markets_api_secret": "string", // opcional
  "session_timeout": 30 // minutos, opcional
}
```

**Response**:
```json
{
  "message": "User updated successfully"
}
```

## Automações

### GET /api/automations

Lista automações do usuário.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `type`: `margin_guard|tp_sl|auto_entry` (opcional)
- `is_active`: `true|false` (opcional)

**Response**:
```json
[
  {
    "id": "uuid",
    "type": "margin_guard|tp_sl|auto_entry",
    "config": {},
    "is_active": true,
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

---

### POST /api/automations

Cria uma nova automação.

**Headers**: `Authorization: Bearer <token>`

**Payload**:
```json
{
  "type": "margin_guard|tp_sl|auto_entry",
  "config": {
    // Configuração específica por tipo
    "margin_threshold": 0.8, // para margin_guard
    "take_profit": 0.05, // para tp_sl
    "stop_loss": 0.03, // para tp_sl
    "entry_conditions": {} // para auto_entry
  }
}
```

**Response**:
```json
{
  "id": "uuid",
  "type": "margin_guard|tp_sl|auto_entry",
  "config": {},
  "is_active": true,
  "created_at": "datetime"
}
```

---

### PUT /api/automations/:id

Atualiza uma automação existente.

**Headers**: `Authorization: Bearer <token>`

**Payload**:
```json
{
  "config": {},
  "is_active": true
}
```

**Response**:
```json
{
  "id": "uuid",
  "type": "margin_guard|tp_sl|auto_entry",
  "config": {},
  "is_active": true,
  "updated_at": "datetime"
}
```

---

### DELETE /api/automations/:id

Remove uma automação.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Automation deleted successfully"
}
```

## Trades e Logs

### GET /api/trades/logs

Lista logs de trades do usuário.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `status`: `success|app_error|exchange_error` (opcional)
- `automation_id`: `uuid` (opcional)
- `from`: `datetime` (opcional)
- `to`: `datetime` (opcional)
- `limit`: `number` (padrão: 50)
- `offset`: `number` (padrão: 0)

**Response**:
```json
[
  {
    "id": "uuid",
    "trade_id": "string",
    "automation_id": "uuid",
    "status": "success|app_error|exchange_error",
    "error_message": "string",
    "executed_at": "datetime",
    "created_at": "datetime"
  }
]
```

---

### GET /api/trades/logs/:id

Retorna detalhes de um log específico.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": "uuid",
  "trade_id": "string",
  "automation_id": "uuid",
  "status": "success|app_error|exchange_error",
  "error_message": "string",
  "executed_at": "datetime",
  "created_at": "datetime",
  "raw_response": {} // resposta completa da LN Markets
}
```

## Backtests

### POST /api/backtests

Inicia um novo backtest.

**Headers**: `Authorization: Bearer <token>`

**Payload**:
```json
{
  "config": {
    "automation_type": "margin_guard|tp_sl|auto_entry",
    "automation_config": {},
    "period": {
      "from": "datetime",
      "to": "datetime"
    }
  }
}
```

**Response**:
```json
{
  "id": "uuid",
  "status": "pending|processing|completed|failed",
  "created_at": "datetime"
}
```

---

### GET /api/backtests/:id

Retorna resultado de um backtest.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": "uuid",
  "status": "pending|processing|completed|failed",
  "config": {},
  "result": {
    "total_trades": 100,
    "successful_trades": 85,
    "failed_trades": 15,
    "total_pnl": 0.12,
    "max_drawdown": 0.05,
    "win_rate": 0.85,
    "trades": [
      {
        "date": "datetime",
        "type": "buy|sell",
        "amount": 0.001,
        "price": 45000,
        "pnl": 0.001,
        "automation_triggered": true
      }
    ]
  },
  "created_at": "datetime",
  "completed_at": "datetime"
}
```

## Notificações

### GET /api/notifications

Lista configurações de notificação do usuário.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": "uuid",
    "type": "telegram|email|whatsapp",
    "is_enabled": true,
    "channel_config": {
      "telegram_chat_id": "string", // para telegram
      "email": "string", // para email
      "whatsapp_number": "string" // para whatsapp
    },
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

---

### POST /api/notifications

Cria configuração de notificação.

**Headers**: `Authorization: Bearer <token>`

**Payload**:
```json
{
  "type": "telegram|email|whatsapp",
  "channel_config": {
    "telegram_chat_id": "string",
    "email": "string",
    "whatsapp_number": "string"
  }
}
```

**Response**:
```json
{
  "id": "uuid",
  "type": "telegram|email|whatsapp",
  "is_enabled": true,
  "channel_config": {},
  "created_at": "datetime"
}
```

---

### PUT /api/notifications/:id

Atualiza configuração de notificação.

**Headers**: `Authorization: Bearer <token>`

**Payload**:
```json
{
  "is_enabled": true,
  "channel_config": {}
}
```

**Response**:
```json
{
  "id": "uuid",
  "type": "telegram|email|whatsapp",
  "is_enabled": true,
  "channel_config": {},
  "updated_at": "datetime"
}
```

## Pagamentos

### POST /api/payments/lightning

Gera invoice Lightning para pagamento de plano.

**Headers**: `Authorization: Bearer <token>`

**Payload**:
```json
{
  "plan_type": "basic|advanced|pro"
}
```

**Response**:
```json
{
  "payment_id": "uuid",
  "invoice": "lnbc...",
  "amount_sats": 10000,
  "expires_at": "datetime"
}
```

---

### GET /api/payments/status/:id

Verifica status de um pagamento.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": "uuid",
  "status": "pending|paid|expired|failed",
  "amount_sats": 10000,
  "plan_type": "basic|advanced|pro",
  "paid_at": "datetime",
  "created_at": "datetime"
}
```

## Admin

### GET /api/admin/dashboard

Dashboard administrativo (apenas superadmin).

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "kpis": {
    "total_users": 150,
    "active_users": 120,
    "total_trades": 5000,
    "successful_trades": 4500,
    "failed_trades": 500,
    "total_revenue_sats": 1000000,
    "active_automations": 200
  },
  "recent_users": [
    {
      "id": "uuid",
      "email": "string",
      "plan_type": "free|basic|advanced|pro",
      "created_at": "datetime",
      "last_activity": "datetime"
    }
  ],
  "recent_payments": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "plan_type": "basic|advanced|pro",
      "amount_sats": 10000,
      "status": "paid",
      "paid_at": "datetime"
    }
  ]
}
```

---

### GET /api/admin/users

Lista usuários (apenas superadmin).

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `plan_type`: `free|basic|advanced|pro` (opcional)
- `is_active`: `true|false` (opcional)
- `limit`: `number` (padrão: 50)
- `offset`: `number` (padrão: 0)

**Response**:
```json
[
  {
    "id": "uuid",
    "email": "string",
    "plan_type": "free|basic|advanced|pro",
    "is_active": true,
    "created_at": "datetime",
    "last_activity": "datetime",
    "automations_count": 3,
    "trades_count": 150
  }
]
```

---

### POST /api/admin/coupons

Cria novo cupom (apenas superadmin).

**Headers**: `Authorization: Bearer <token>`

**Payload**:
```json
{
  "code": "string",
  "plan_type": "free|basic|advanced|pro",
  "usage_limit": 10,
  "expires_at": "datetime" // opcional
}
```

**Response**:
```json
{
  "id": "uuid",
  "code": "string",
  "plan_type": "free|basic|advanced|pro",
  "usage_limit": 10,
  "used_count": 0,
  "expires_at": "datetime",
  "created_at": "datetime"
}
```

---

### GET /api/admin/coupons

Lista cupons (apenas superadmin).

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": "uuid",
    "code": "string",
    "plan_type": "free|basic|advanced|pro",
    "usage_limit": 10,
    "used_count": 5,
    "expires_at": "datetime",
    "created_at": "datetime"
  }
]
```

## WebSocket Events

### Conexão
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'jwt_token'
  }
});
```

### Eventos Recebidos

#### margin_update
```json
{
  "user_id": "uuid",
  "margin_ratio": 0.75,
  "margin_level": "safe|warning|critical",
  "timestamp": "datetime"
}
```

#### automation_executed
```json
{
  "automation_id": "uuid",
  "trade_id": "string",
  "status": "success|app_error|exchange_error",
  "message": "string",
  "timestamp": "datetime"
}
```

#### notification_sent
```json
{
  "type": "telegram|email|whatsapp",
  "status": "sent|failed",
  "message": "string",
  "timestamp": "datetime"
}
```

## Códigos de Erro

### 400 - Bad Request
- `INVALID_EMAIL_FORMAT`
- `PASSWORD_TOO_SHORT`
- `INVALID_LN_MARKETS_KEYS`
- `INVALID_COUPON_CODE`
- `INVALID_AUTOMATION_CONFIG`

### 401 - Unauthorized
- `INVALID_TOKEN`
- `TOKEN_EXPIRED`
- `INVALID_CREDENTIALS`

### 403 - Forbidden
- `INSUFFICIENT_PERMISSIONS`
- `PLAN_LIMIT_EXCEEDED`

### 404 - Not Found
- `USER_NOT_FOUND`
- `AUTOMATION_NOT_FOUND`
- `PAYMENT_NOT_FOUND`

### 429 - Too Many Requests
- `RATE_LIMIT_EXCEEDED`

### 500 - Internal Server Error
- `LN_MARKETS_API_ERROR`
- `NOTIFICATION_SERVICE_ERROR`
- `PAYMENT_VALIDATION_ERROR`
