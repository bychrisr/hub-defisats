# API Administrativa - hub-defisats

Esta documentação descreve todos os endpoints da API administrativa do hub-defisats.

## Autenticação

Todos os endpoints administrativos requerem:
1. **Autenticação JWT**: Header `Authorization: Bearer <token>`
2. **Privilégios administrativos**: O usuário deve ter uma entrada na tabela `AdminUser`

## Base URL

```
/api/admin
```

## Endpoints

### 1. Dashboard Metrics

Obtém métricas gerais do dashboard administrativo.

**Endpoint:** `GET /dashboard/metrics`

**Autenticação:** Obrigatória

**Parâmetros:** Nenhum

**Resposta:**
```json
{
  "totalUsers": 1250,
  "activeUsers": 890,
  "monthlyRevenue": 15000,
  "totalTrades": 45000,
  "systemUptime": 2592000,
  "uptimePercentage": 100
}
```

**Códigos de Status:**
- `200`: Sucesso
- `401`: Não autenticado ou não é administrador
- `500`: Erro interno do servidor

---

### 2. Trading Analytics

Obtém análises de trading dos usuários.

**Endpoint:** `GET /trading/analytics`

**Autenticação:** Obrigatória

**Parâmetros de Query:**
- `search` (string, opcional): Busca por username ou email
- `planType` (string, opcional): Filtra por tipo de plano
- `sortBy` (string, opcional): Campo para ordenação (padrão: `totalTrades`)
- `sortOrder` (string, opcional): Ordem da classificação - `asc` ou `desc` (padrão: `desc`)
- `page` (number, opcional): Página atual (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 10, máximo: 100)

**Resposta:**
```json
{
  "users": [
    {
      "id": "user-id",
      "username": "trader123",
      "email": "trader@example.com",
      "planType": "premium",
      "totalTrades": 150,
      "winningTrades": 90,
      "losingTrades": 60,
      "totalPnL": 2500,
      "winRate": 60,
      "avgPnL": 16.67,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "metrics": {
    "totalUsers": 100,
    "totalTrades": 15000,
    "totalWinningTrades": 9000,
    "totalLosingTrades": 6000,
    "totalPnL": 250000,
    "overallWinRate": 60,
    "avgPnLPerTrade": 16.67
  }
}
```

---

### 3. Trade Logs

Obtém logs de trades dos usuários.

**Endpoint:** `GET /trades/logs`

**Autenticação:** Obrigatória

**Parâmetros de Query:**
- `search` (string, opcional): Busca por símbolo ou username
- `status` (string, opcional): Filtra por status (`completed`, `pending`, `failed`)
- `action` (string, opcional): Filtra por ação (`buy`, `sell`)
- `planType` (string, opcional): Filtra por tipo de plano
- `startDate` (string, opcional): Data de início (ISO 8601)
- `endDate` (string, opcional): Data de fim (ISO 8601)
- `sortBy` (string, opcional): Campo para ordenação (padrão: `created_at`)
- `sortOrder` (string, opcional): Ordem da classificação (padrão: `desc`)
- `page` (number, opcional): Página atual (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 10)

**Resposta:**
```json
{
  "tradeLogs": [
    {
      "id": "trade-log-id",
      "user_id": "user-id",
      "action": "buy",
      "symbol": "BTCUSD",
      "amount": 1000,
      "price": 45000,
      "status": "completed",
      "pnl": 150,
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-id",
        "username": "trader123",
        "email": "trader@example.com",
        "plan_type": "premium"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 500,
    "totalPages": 50
  }
}
```

---

### 4. Payment Analytics

Obtém análises de pagamentos.

**Endpoint:** `GET /payments/analytics`

**Autenticação:** Obrigatória

**Parâmetros de Query:**
- `search` (string, opcional): Busca por username ou email
- `status` (string, opcional): Filtra por status (`completed`, `pending`, `failed`)
- `paymentMethod` (string, opcional): Filtra por método (`lightning`, `onchain`, `card`)
- `planType` (string, opcional): Filtra por tipo de plano
- `startDate` (string, opcional): Data de início
- `endDate` (string, opcional): Data de fim
- `sortBy` (string, opcional): Campo para ordenação (padrão: `created_at`)
- `sortOrder` (string, opcional): Ordem da classificação (padrão: `desc`)
- `page` (number, opcional): Página atual
- `limit` (number, opcional): Itens por página

**Resposta:**
```json
{
  "payments": [
    {
      "id": "payment-id",
      "user_id": "user-id",
      "amount": 100,
      "status": "completed",
      "payment_method": "lightning",
      "plan_type": "premium",
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-id",
        "username": "user123",
        "email": "user@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 200,
    "totalPages": 20
  },
  "metrics": {
    "totalRevenue": 25000,
    "totalPayments": 200,
    "completedPayments": 180,
    "pendingPayments": 15,
    "failedPayments": 5,
    "conversionRate": 90,
    "avgTransactionValue": 125
  }
}
```

---

### 5. Backtest Reports

Obtém relatórios de backtests.

**Endpoint:** `GET /backtests/reports`

**Autenticação:** Obrigatória

**Parâmetros de Query:**
- `search` (string, opcional): Busca por username
- `status` (string, opcional): Filtra por status
- `strategy` (string, opcional): Filtra por estratégia
- `planType` (string, opcional): Filtra por tipo de plano
- `startDate` (string, opcional): Data de início
- `endDate` (string, opcional): Data de fim
- `sortBy` (string, opcional): Campo para ordenação
- `sortOrder` (string, opcional): Ordem da classificação
- `page` (number, opcional): Página atual
- `limit` (number, opcional): Itens por página

**Resposta:**
```json
{
  "backtestReports": [
    {
      "id": "backtest-id",
      "user_id": "user-id",
      "strategy": "momentum",
      "status": "completed",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-01-31T23:59:59Z",
      "total_trades": 100,
      "winning_trades": 65,
      "total_pnl": 1500,
      "max_drawdown": 200,
      "sharpe_ratio": 1.5,
      "execution_time": 300,
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-id",
        "username": "trader123",
        "plan_type": "premium"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "metrics": {
    "totalReports": 50,
    "completedReports": 45,
    "runningReports": 3,
    "failedReports": 2,
    "avgExecutionTime": 280
  }
}
```

---

### 6. Simulation Analytics

Obtém análises de simulações.

**Endpoint:** `GET /simulations/analytics`

**Autenticação:** Obrigatória

**Parâmetros de Query:** Similares aos outros endpoints

**Resposta:**
```json
{
  "simulations": [
    {
      "id": "simulation-id",
      "user_id": "user-id",
      "type": "paper_trading",
      "status": "running",
      "progress": 75,
      "initial_balance": 10000,
      "current_balance": 11500,
      "total_trades": 25,
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-id",
        "username": "trader123",
        "plan_type": "premium"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 30,
    "totalPages": 3
  },
  "metrics": {
    "totalSimulations": 30,
    "completedSimulations": 20,
    "runningSimulations": 8,
    "failedSimulations": 2,
    "avgProgress": 65
  }
}
```

---

### 7. Automation Management

Obtém dados de gerenciamento de automações.

**Endpoint:** `GET /automations/management`

**Autenticação:** Obrigatória

**Parâmetros de Query:**
- `search` (string, opcional): Busca por username
- `type` (string, opcional): Filtra por tipo (`dca`, `margin_guard`, `stop_loss`)
- `status` (string, opcional): Filtra por status (`active`, `paused`, `stopped`)
- `riskLevel` (string, opcional): Filtra por nível de risco
- `planType` (string, opcional): Filtra por tipo de plano

**Resposta:**
```json
{
  "automations": [
    {
      "id": "automation-id",
      "user_id": "user-id",
      "type": "dca",
      "status": "active",
      "risk_level": "medium",
      "config": {},
      "last_execution": "2024-01-01T00:00:00Z",
      "next_execution": "2024-01-01T01:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-id",
        "username": "trader123",
        "plan_type": "premium"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 75,
    "totalPages": 8
  },
  "metrics": {
    "totalAutomations": 75,
    "activeAutomations": 60,
    "pausedAutomations": 10,
    "stoppedAutomations": 3,
    "errorAutomations": 2
  }
}
```

---

### 8. Notification Management

Obtém dados de gerenciamento de notificações.

**Endpoint:** `GET /notifications/management`

**Autenticação:** Obrigatória

**Parâmetros de Query:**
- `search` (string, opcional): Busca por nome do template
- `channel` (string, opcional): Filtra por canal (`email`, `sms`, `push`, `webhook`)
- `category` (string, opcional): Filtra por categoria
- `active` (boolean, opcional): Filtra por templates ativos

**Resposta:**
```json
{
  "templates": [
    {
      "id": "template-id",
      "name": "Welcome Email",
      "description": "Email de boas-vindas",
      "channel": "email",
      "category": "system",
      "template": "Bem-vindo ao hub-defisats!",
      "variables": ["username", "email"],
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "notifications": [
    {
      "id": "notification-id",
      "template_id": "template-id",
      "user_id": "user-id",
      "channel": "email",
      "status": "sent",
      "sent_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "metrics": {
    "totalTemplates": 10,
    "activeTemplates": 8,
    "totalNotifications": 1000,
    "sentNotifications": 950,
    "failedNotifications": 50,
    "successRate": 95
  }
}
```

---

### 9. System Reports

Obtém relatórios do sistema.

**Endpoint:** `GET /reports/system`

**Autenticação:** Obrigatória

**Parâmetros de Query:**
- `search` (string, opcional): Busca por título
- `type` (string, opcional): Filtra por tipo (`daily`, `weekly`, `monthly`)
- `status` (string, opcional): Filtra por status

**Resposta:**
```json
{
  "systemReports": [
    {
      "id": "report-id",
      "type": "daily",
      "status": "completed",
      "title": "Relatório Diário - 2024-01-01",
      "description": "Relatório diário do sistema",
      "config": {},
      "file_path": "/reports/daily-2024-01-01.pdf",
      "file_size": 2048,
      "generated_at": "2024-01-01T23:59:59Z",
      "created_at": "2024-01-01T23:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  },
  "metrics": {
    "totalReports": 15,
    "completedReports": 12,
    "generatingReports": 2,
    "failedReports": 1,
    "scheduledReports": 5,
    "totalFileSize": 30720
  }
}
```

---

### 10. Audit Logs

Obtém logs de auditoria.

**Endpoint:** `GET /audit/logs`

**Autenticação:** Obrigatória

**Parâmetros de Query:**
- `search` (string, opcional): Busca por ação ou recurso
- `action` (string, opcional): Filtra por ação
- `resource` (string, opcional): Filtra por recurso
- `severity` (string, opcional): Filtra por severidade (`info`, `warning`, `error`, `critical`)
- `userId` (string, opcional): Filtra por ID do usuário
- `startDate` (string, opcional): Data de início
- `endDate` (string, opcional): Data de fim

**Resposta:**
```json
{
  "auditLogs": [
    {
      "id": "audit-id",
      "user_id": "user-id",
      "action": "login",
      "resource": "auth",
      "resource_id": null,
      "old_values": null,
      "new_values": null,
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "severity": "info",
      "details": {},
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-id",
        "username": "user123",
        "email": "user@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5000,
    "totalPages": 500
  },
  "metrics": {
    "totalLogs": 5000,
    "criticalLogs": 5,
    "highLogs": 25,
    "mediumLogs": 150,
    "lowLogs": 4820,
    "uniqueUsers": 250
  }
}
```

---

## Códigos de Status HTTP

### Sucesso
- `200 OK`: Requisição bem-sucedida

### Erro do Cliente
- `400 Bad Request`: Parâmetros inválidos
- `401 Unauthorized`: Não autenticado ou token inválido
- `403 Forbidden`: Não possui privilégios administrativos
- `404 Not Found`: Endpoint não encontrado
- `422 Unprocessable Entity`: Dados de entrada inválidos
- `429 Too Many Requests`: Limite de taxa excedido

### Erro do Servidor
- `500 Internal Server Error`: Erro interno do servidor
- `503 Service Unavailable`: Serviço temporariamente indisponível

---

## Exemplos de Uso

### Obter métricas do dashboard
```bash
curl -X GET "http://localhost:13010/api/admin/dashboard/metrics" \
  -H "Authorization: Bearer your-jwt-token"
```

### Buscar usuários por trading analytics
```bash
curl -X GET "http://localhost:13010/api/admin/trading/analytics?search=john&page=1&limit=20" \
  -H "Authorization: Bearer your-jwt-token"
```

### Filtrar logs de trade por status
```bash
curl -X GET "http://localhost:13010/api/admin/trades/logs?status=completed&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Notas de Implementação

1. **Paginação**: Todos os endpoints que retornam listas implementam paginação
2. **Filtros**: Suporte a múltiplos filtros combinados
3. **Ordenação**: Campos ordenáveis variam por endpoint
4. **Rate Limiting**: Aplicado a todos os endpoints administrativos
5. **Logs de Auditoria**: Todas as ações administrativas são registradas
6. **Cache**: Métricas podem ser cacheadas por períodos curtos
7. **Validação**: Todos os parâmetros de entrada são validados
8. **Segurança**: Headers de segurança aplicados a todas as respostas
