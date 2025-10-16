# API Endpoints

## Visão Geral

Esta documentação descreve todos os endpoints da API do Hub-defisats, organizados por funcionalidade e com exemplos de uso.

## Autenticação

Todos os endpoints (exceto os públicos) requerem autenticação via JWT token no header `Authorization: Bearer <token>`.

## Base URL

- **Desenvolvimento**: `http://localhost:13010`
- **Produção**: `https://api.axisor.com`

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `500` - Erro interno do servidor

## ⚡ Otimizações de Performance

### Requisições Centralizadas
O frontend agora utiliza requisições centralizadas para melhor performance:

- **useCentralizedData**: Hook que faz uma única requisição paralela para múltiplos endpoints
- **Requisições Paralelas**: Balance, positions, market e menu em uma única chamada
- **Redução de Overhead**: De 4+ requisições simultâneas para 1 requisição paralela
- **Cache Inteligente**: Dados compartilhados entre componentes

### Endpoints Otimizados
- **GET /api/lnmarkets/user/balance**: Saldo do usuário
- **GET /api/lnmarkets/user/positions**: Posições do usuário
- **GET /api/market/index/public**: Dados de mercado (público)
- **GET /api/menu**: Dados do menu

### Benefícios
- **Performance**: Carregamento mais rápido com menos requisições
- **Eficiência**: Menor uso de banda e recursos do servidor
- **UX**: Melhor experiência do usuário com loading inteligente
- **Manutenibilidade**: Código centralizado e reutilizável

---

## 🔐 Autenticação

### POST /api/auth/register
Registra um novo usuário no sistema.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "confirmPassword": "password123",
  "ln_markets_api_key": "your_api_key",
  "ln_markets_api_secret": "your_api_secret",
  "ln_markets_passphrase": "your_passphrase",
  "coupon_code": "ALPHATESTER"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "plan_type": "free"
  },
  "token": "jwt_token"
}
```

### POST /api/auth/login
Autentica um usuário existente.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "plan_type": "free",
    "is_admin": false
  },
  "token": "jwt_token"
}
```

### POST /api/auth/logout
Desautentica o usuário atual.

**Response:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

### GET /api/auth/me
Retorna informações do usuário autenticado.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "plan_type": "free",
  "is_admin": false,
  "created_at": "2025-01-15T10:00:00Z",
  "last_activity_at": "2025-01-15T10:00:00Z"
}
```

### POST /api/auth/refresh
Renova o token de acesso.

**Response:**
```json
{
  "success": true,
  "token": "new_jwt_token"
}
```

### POST /api/auth/forgot-password
Solicita reset de senha.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email de reset enviado"
}
```

### POST /api/auth/reset-password
Reseta a senha com token.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "new_password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

### GET /api/auth/check-username
Verifica disponibilidade de username.

**Query Parameters:**
- `username` (string, required): Username a verificar

**Response:**
```json
{
  "available": true,
  "message": "Username disponível"
}
```

---

## 🤖 Automações

### POST /api/automations
Cria uma nova automação.

**Request Body:**
```json
{
  "type": "margin_guard",
  "config": {
    "threshold": 0.8,
    "action": "close_position",
    "enabled": true
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "type": "margin_guard",
  "config": {
    "threshold": 0.8,
    "action": "close_position",
    "enabled": true
  },
  "is_active": true,
  "created_at": "2025-01-15T10:00:00Z"
}
```

### GET /api/automations
Lista automações do usuário.

**Query Parameters:**
- `type` (string, optional): Filtrar por tipo
- `is_active` (boolean, optional): Filtrar por status

**Response:**
```json
{
  "automations": [
    {
      "id": "uuid",
      "type": "margin_guard",
      "config": {...},
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/automations/:id
Retorna detalhes de uma automação específica.

**Response:**
```json
{
  "id": "uuid",
  "type": "margin_guard",
  "config": {...},
  "is_active": true,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### PUT /api/automations/:id
Atualiza uma automação existente.

**Request Body:**
```json
{
  "config": {
    "threshold": 0.9,
    "action": "reduce_position",
    "enabled": true
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "type": "margin_guard",
  "config": {...},
  "is_active": true,
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### DELETE /api/automations/:id
Remove uma automação.

**Response:**
```json
{
  "success": true,
  "message": "Automação removida com sucesso"
}
```

### POST /api/automations/:id/toggle
Ativa/desativa uma automação.

**Response:**
```json
{
  "success": true,
  "is_active": true,
  "message": "Automação ativada"
}
```

---

## 🎮 Simulações

### POST /api/simulations
Cria uma nova simulação.

**Request Body:**
```json
{
  "name": "Teste Margin Guard",
  "scenario": "bear",
  "automation_type": "margin_guard",
  "config": {
    "threshold": 0.8,
    "action": "close_position"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Teste Margin Guard",
  "scenario": "bear",
  "automation_type": "margin_guard",
  "config": {...},
  "status": "pending",
  "progress": 0,
  "created_at": "2025-01-15T10:00:00Z"
}
```

### GET /api/simulations
Lista simulações do usuário.

**Query Parameters:**
- `status` (string, optional): Filtrar por status
- `scenario` (string, optional): Filtrar por cenário
- `limit` (number, optional): Limite de resultados (default: 20)
- `offset` (number, optional): Offset para paginação (default: 0)

**Response:**
```json
{
  "simulations": [
    {
      "id": "uuid",
      "name": "Teste Margin Guard",
      "scenario": "bear",
      "status": "completed",
      "progress": 100,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### GET /api/simulations/:id
Retorna detalhes de uma simulação específica.

**Response:**
```json
{
  "id": "uuid",
  "name": "Teste Margin Guard",
  "scenario": "bear",
  "automation_type": "margin_guard",
  "config": {...},
  "status": "completed",
  "progress": 100,
  "result": {
    "success_rate": 0.95,
    "total_trades": 100,
    "profit_loss": 150.50,
    "max_drawdown": 25.30
  },
  "created_at": "2025-01-15T10:00:00Z",
  "completed_at": "2025-01-15T10:05:00Z"
}
```

### POST /api/simulations/:id/start
Inicia uma simulação.

**Response:**
```json
{
  "success": true,
  "message": "Simulação iniciada",
  "status": "running"
}
```

### GET /api/simulations/:id/progress
Retorna progresso em tempo real de uma simulação.

**Response:**
```json
{
  "id": "uuid",
  "status": "running",
  "progress": 45,
  "current_step": 45,
  "total_steps": 100,
  "estimated_completion": "2025-01-15T10:03:00Z"
}
```

### GET /api/simulations/:id/metrics
Retorna métricas finais de uma simulação.

**Response:**
```json
{
  "success_rate": 0.95,
  "total_trades": 100,
  "profit_loss": 150.50,
  "max_drawdown": 25.30,
  "sharpe_ratio": 1.85,
  "win_rate": 0.68,
  "avg_win": 45.20,
  "avg_loss": -15.80
}
```

### GET /api/simulations/:id/chart
Retorna dados para gráficos de uma simulação.

**Response:**
```json
{
  "price_data": [
    {"timestamp": "2025-01-15T10:00:00Z", "price": 50000, "action": "none"},
    {"timestamp": "2025-01-15T10:01:00Z", "price": 49500, "action": "margin_guard"}
  ],
  "pnl_data": [
    {"timestamp": "2025-01-15T10:00:00Z", "pnl": 0},
    {"timestamp": "2025-01-15T10:01:00Z", "pnl": -500}
  ]
}
```

### DELETE /api/simulations/:id
Remove uma simulação.

**Response:**
```json
{
  "success": true,
  "message": "Simulação removida com sucesso"
}
```

---

## 📊 Dashboard

### GET /api/dashboard/summary
Retorna resumo financeiro do usuário.

**Response:**
```json
{
  "total_balance": 1000.50,
  "available_balance": 800.25,
  "margin_used": 200.25,
  "unrealized_pnl": 50.00,
  "realized_pnl": 150.75,
  "total_trades": 25,
  "active_automations": 3,
  "risk_level": "low"
}
```

### GET /api/dashboard/positions
Retorna posições atuais do usuário.

**Response:**
```json
{
  "positions": [
    {
      "id": "uuid",
      "symbol": "BTCUSD",
      "side": "long",
      "size": 0.1,
      "entry_price": 50000,
      "current_price": 50500,
      "unrealized_pnl": 50.00,
      "margin_used": 100.00
    }
  ],
  "total_positions": 1
}
```

### GET /api/dashboard/history
Retorna histórico de trades do usuário.

**Query Parameters:**
- `limit` (number, optional): Limite de resultados (default: 50)
- `offset` (number, optional): Offset para paginação (default: 0)
- `start_date` (string, optional): Data de início (ISO 8601)
- `end_date` (string, optional): Data de fim (ISO 8601)

**Response:**
```json
{
  "trades": [
    {
      "id": "uuid",
      "symbol": "BTCUSD",
      "side": "long",
      "size": 0.1,
      "price": 50000,
      "pnl": 50.00,
      "executed_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### GET /api/dashboard/kpis
Retorna KPIs em tempo real.

**Response:**
```json
{
  "total_users": 150,
  "active_users": 45,
  "total_trades": 1250,
  "success_rate": 0.92,
  "total_volume": 50000.00,
  "system_health": "healthy"
}
```

---

## 📈 Market Data

### GET /api/market/data
Retorna dados de mercado em tempo real.

**Response:**
```json
{
  "symbol": "BTCUSD",
  "price": 50000,
  "change_24h": 2.5,
  "volume_24h": 1000000,
  "high_24h": 51000,
  "low_24h": 49000,
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### GET /api/market/historical
Retorna dados históricos de preços.

**Query Parameters:**
- `symbol` (string, required): Símbolo do ativo
- `interval` (string, required): Intervalo (1m, 5m, 15m, 1h, 4h, 1d)
- `start_date` (string, required): Data de início (ISO 8601)
- `end_date` (string, required): Data de fim (ISO 8601)

**Response:**
```json
{
  "data": [
    {
      "timestamp": "2025-01-15T10:00:00Z",
      "open": 50000,
      "high": 50100,
      "low": 49900,
      "close": 50050,
      "volume": 1000
    }
  ],
  "symbol": "BTCUSD",
  "interval": "1h"
}
```

### GET /api/market/index
Retorna índice de preço atual.

**Response:**
```json
{
  "index": 50000,
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### GET /api/market/ticker
Retorna ticker atual.

**Response:**
```json
{
  "symbol": "BTCUSD",
  "price": 50000,
  "bid": 49995,
  "ask": 50005,
  "volume": 1000000,
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## 👨‍💼 Admin

### GET /api/admin/dashboard
Retorna dashboard administrativo.

**Response:**
```json
{
  "kpis": {
    "total_users": 150,
    "active_users": 45,
    "total_trades": 1250,
    "revenue": 5000.00
  },
  "recent_activity": [
    {
      "type": "user_registration",
      "user_id": "uuid",
      "timestamp": "2025-01-15T10:00:00Z"
    }
  ],
  "system_health": "healthy"
}
```

### GET /api/admin/users
Lista usuários do sistema.

**Query Parameters:**
- `limit` (number, optional): Limite de resultados (default: 20)
- `offset` (number, optional): Offset para paginação (default: 0)
- `plan_type` (string, optional): Filtrar por tipo de plano
- `is_active` (boolean, optional): Filtrar por status ativo

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "plan_type": "free",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z",
      "last_activity_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### PUT /api/admin/users/:id
Atualiza informações de um usuário.

**Request Body:**
```json
{
  "plan_type": "pro",
  "is_active": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "plan_type": "pro",
  "is_active": true,
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### POST /api/admin/coupons
Cria um novo cupom.

**Request Body:**
```json
{
  "code": "EARLYBIRD",
  "plan_type": "pro",
  "usage_limit": 100,
  "expires_at": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "EARLYBIRD",
  "plan_type": "pro",
  "usage_limit": 100,
  "used_count": 0,
  "expires_at": "2025-12-31T23:59:59Z",
  "created_at": "2025-01-15T10:00:00Z"
}
```

### GET /api/admin/coupons
Lista cupons do sistema.

**Response:**
```json
{
  "coupons": [
    {
      "id": "uuid",
      "code": "EARLYBIRD",
      "plan_type": "pro",
      "usage_limit": 100,
      "used_count": 25,
      "expires_at": "2025-12-31T23:59:59Z",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/admin/logs
Retorna logs do sistema.

**Query Parameters:**
- `level` (string, optional): Filtrar por nível (info, warn, error)
- `start_date` (string, optional): Data de início (ISO 8601)
- `end_date` (string, optional): Data de fim (ISO 8601)
- `limit` (number, optional): Limite de resultados (default: 100)

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "level": "info",
      "message": "User registered successfully",
      "user_id": "uuid",
      "timestamp": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 100
}
```

### GET /api/admin/metrics
Retorna métricas de performance do sistema.

**Response:**
```json
{
  "performance": {
    "avg_response_time": 150,
    "requests_per_minute": 1000,
    "error_rate": 0.01
  },
  "database": {
    "connections": 10,
    "query_time": 25
  },
  "cache": {
    "hit_rate": 0.95,
    "memory_usage": "512MB"
  }
}
```

---

## 🔔 Notificações

### GET /api/notifications
Lista notificações do usuário.

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "margin_alert",
      "title": "Alerta de Margem",
      "message": "Sua margem está abaixo do limite configurado",
      "read": false,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### PUT /api/notifications/:id/read
Marca notificação como lida.

**Response:**
```json
{
  "success": true,
  "message": "Notificação marcada como lida"
}
```

### POST /api/notifications/settings
Atualiza configurações de notificação.

**Request Body:**
```json
{
  "email_enabled": true,
  "telegram_enabled": false,
  "whatsapp_enabled": true,
  "margin_alerts": true,
  "trade_alerts": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configurações atualizadas"
}
```

---

## 💰 Pagamentos

### POST /api/payments/lightning
Gera invoice Lightning para pagamento.

**Request Body:**
```json
{
  "plan_type": "pro",
  "amount_sats": 50000
}
```

**Response:**
```json
{
  "invoice": "lnbc500n1p0...",
  "amount_sats": 50000,
  "expires_at": "2025-01-15T11:00:00Z",
  "payment_id": "uuid"
}
```

### GET /api/payments/status/:id
Verifica status de um pagamento.

**Response:**
```json
{
  "payment_id": "uuid",
  "status": "paid",
  "amount_sats": 50000,
  "paid_at": "2025-01-15T10:30:00Z"
}
```

### GET /api/payments/history
Retorna histórico de pagamentos do usuário.

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "plan_type": "pro",
      "amount_sats": 50000,
      "status": "paid",
      "paid_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

## 🧪 Testes

### GET /api/test/lnmarkets/connectivity
Testa conectividade com API LN Markets.

**Response:**
```json
{
  "connected": true,
  "response_time": 150,
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### POST /api/test/lnmarkets
Testa credenciais LN Markets.

**Request Body:**
```json
{
  "api_key": "your_api_key",
  "api_secret": "your_api_secret",
  "passphrase": "your_passphrase"
}
```

**Response:**
```json
{
  "valid": true,
  "user_info": {
    "id": "lnm_user_id",
    "email": "user@example.com"
  },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### POST /api/test/margin-guard
Testa sistema de Margin Guard.

**Response:**
```json
{
  "tested": true,
  "margin_ratio": 0.75,
  "risk_level": "safe",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## 📊 Relatórios

### GET /api/reports/trades
Gera relatório de trades.

**Query Parameters:**
- `start_date` (string, required): Data de início (ISO 8601)
- `end_date` (string, required): Data de fim (ISO 8601)
- `format` (string, optional): Formato (json, csv, pdf)

**Response:**
```json
{
  "report_id": "uuid",
  "status": "generating",
  "download_url": "https://api.axisor.com/reports/uuid/download"
}
```

### GET /api/reports/performance
Gera relatório de performance.

**Query Parameters:**
- `start_date` (string, required): Data de início (ISO 8601)
- `end_date` (string, required): Data de fim (ISO 8601)

**Response:**
```json
{
  "total_trades": 100,
  "win_rate": 0.68,
  "total_pnl": 1500.50,
  "max_drawdown": 250.30,
  "sharpe_ratio": 1.85,
  "profit_factor": 2.15
}
```

---

## 🔧 Health Check

### GET /api/health
Verifica saúde do sistema.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ln_markets": "healthy"
  },
  "version": "1.3.0"
}
```

---

## 📝 Códigos de Erro

### Erros de Validação (400)
```json
{
  "error": "validation_error",
  "message": "Dados inválidos",
  "details": {
    "email": "Email é obrigatório",
    "password": "Senha deve ter pelo menos 8 caracteres"
  }
}
```

### Erros de Autenticação (401)
```json
{
  "error": "unauthorized",
  "message": "Token inválido ou expirado"
}
```

### Erros de Autorização (403)
```json
{
  "error": "forbidden",
  "message": "Acesso negado"
}
```

### Erros de Recurso (404)
```json
{
  "error": "not_found",
  "message": "Recurso não encontrado"
}
```

### Erros Internos (500)
```json
{
  "error": "internal_error",
  "message": "Erro interno do servidor",
  "request_id": "uuid"
}
```

---

**Documento**: API Endpoints  
**Versão**: 1.3.0  
**Última Atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento
