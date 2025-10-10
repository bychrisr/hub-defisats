# 🔌 Margin Guard - Documentação da API

## 📋 Visão Geral

Esta documentação descreve os endpoints da API relacionados ao Margin Guard e outras automações do sistema.

**Base URL**: `http://localhost:13010/api`
**Autenticação**: Bearer Token (JWT)

---

## 🔐 Autenticação

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "user_id": "uuid",
  "token": "jwt-token",
  "plan_type": "lifetime"
}
```

### Headers Obrigatórios
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

---

## 🤖 Automações

### Listar Automações
```http
GET /api/automations
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "669d1cdd-35a7-479a-bad2-88343944e1fc",
      "user_id": "d24ef94f-7e41-4e96-8961-66dc5fd589cf",
      "type": "margin_guard",
      "config": {
        "action": "increase_liquidation_distance",
        "enabled": true,
        "margin_threshold": 95,
        "new_liquidation_distance": 25
      },
      "is_active": true,
      "created_at": "2025-09-19T10:32:10.246Z",
      "updated_at": "2025-09-19T22:18:50.323Z"
    }
  ]
}
```

### Criar Automação
```http
POST /api/automations
Content-Type: application/json

{
  "type": "margin_guard",
  "config": {
    "enabled": true,
    "margin_threshold": 90,
    "action": "increase_liquidation_distance",
    "new_liquidation_distance": 25
  },
  "is_active": true
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "user_id": "user-uuid",
    "type": "margin_guard",
    "config": {
      "enabled": true,
      "margin_threshold": 90,
      "action": "increase_liquidation_distance",
      "new_liquidation_distance": 25
    },
    "is_active": true,
    "created_at": "2025-09-19T22:40:56.364Z",
    "updated_at": "2025-09-19T22:40:56.364Z"
  }
}
```

### Atualizar Automação
```http
PUT /api/automations/{id}
Content-Type: application/json

{
  "config": {
    "enabled": true,
    "margin_threshold": 85,
    "action": "close_position"
  },
  "is_active": true
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "existing-uuid",
    "user_id": "user-uuid",
    "type": "margin_guard",
    "config": {
      "enabled": true,
      "margin_threshold": 85,
      "action": "close_position"
    },
    "is_active": true,
    "created_at": "2025-09-19T10:32:10.246Z",
    "updated_at": "2025-09-19T22:42:23.539Z"
  }
}
```

### Deletar Automação
```http
DELETE /api/automations/{id}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Automation deleted successfully"
}
```

---

## 🛡️ Margin Guard - Configurações

### Tipos de Ação

#### 1. `close_position`
Fecha completamente a posição.

```json
{
  "action": "close_position"
}
```

#### 2. `reduce_position`
Reduz a posição em uma porcentagem.

```json
{
  "action": "reduce_position",
  "reduce_percentage": 50
}
```

#### 3. `add_margin`
Adiciona margem à posição.

```json
{
  "action": "add_margin",
  "add_margin_amount": 1000
}
```

#### 4. `increase_liquidation_distance`
Aumenta a distância de liquidação.

```json
{
  "action": "increase_liquidation_distance",
  "new_liquidation_distance": 25
}
```

### Exemplo Completo - Margin Guard

```json
{
  "type": "margin_guard",
  "config": {
    "enabled": true,
    "margin_threshold": 90,
    "action": "increase_liquidation_distance",
    "new_liquidation_distance": 25
  },
  "is_active": true
}
```

---

## 📊 TP/SL - Configurações

### Exemplo Completo - TP/SL

```json
{
  "type": "tp_sl",
  "config": {
    "enabled": true,
    "trailing_stop": true,
    "trailing_percentage": 1.5,
    "stop_loss_percentage": 2,
    "take_profit_percentage": 5
  },
  "is_active": true
}
```

### Parâmetros TP/SL

| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|---------|
| `enabled` | boolean | Ativa/desativa o TP/SL | `true` |
| `trailing_stop` | boolean | Ativa trailing stop | `false` |
| `trailing_percentage` | number | % para trailing stop | `2` |
| `stop_loss_percentage` | number | % para stop loss | `3` |
| `take_profit_percentage` | number | % para take profit | `8` |

---

## 🚀 Auto Entry - Configurações

### Exemplo Completo - Auto Entry

```json
{
  "type": "auto_entry",
  "config": {
    "enabled": true,
    "entry_price": 100000,
    "position_size": 0.1,
    "entry_condition": "price_above"
  },
  "is_active": true
}
```

### Parâmetros Auto Entry

| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|---------|
| `enabled` | boolean | Ativa/desativa auto entry | `true` |
| `entry_price` | number | Preço de entrada | `100000` |
| `position_size` | number | Tamanho da posição | `0.1` |
| `entry_condition` | string | Condição de entrada | `price_above` |

---

## 📈 Status Codes

### Sucesso
- `200 OK` - Operação realizada com sucesso
- `201 Created` - Recurso criado com sucesso

### Erro do Cliente
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Token inválido ou expirado
- `403 Forbidden` - Acesso negado
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: automação já existe)

### Erro do Servidor
- `500 Internal Server Error` - Erro interno
- `503 Service Unavailable` - Serviço indisponível

---

## 🔍 Exemplos de Erro

### Token Expirado
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid session"
}
```

### Dados Inválidos
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid margin_threshold value",
  "details": {
    "field": "margin_threshold",
    "expected": "number between 0 and 100",
    "received": "150"
  }
}
```

### Automação Já Existe
```json
{
  "success": false,
  "error": "CONFLICT",
  "message": "User already has an active margin_guard automation"
}
```

---

## 🧪 Exemplos de Uso

### cURL - Listar Automações
```bash
curl -X GET "http://localhost:13010/api/automations" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

### cURL - Criar Margin Guard
```bash
curl -X POST "http://localhost:13010/api/automations" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "margin_guard",
    "config": {
      "enabled": true,
      "margin_threshold": 90,
      "action": "increase_liquidation_distance",
      "new_liquidation_distance": 25
    },
    "is_active": true
  }'
```

### cURL - Atualizar Configuração
```bash
curl -X PUT "http://localhost:13010/api/automations/automation-id" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "enabled": true,
      "margin_threshold": 85,
      "action": "close_position"
    },
    "is_active": true
  }'
```

---

## 🔒 Rate Limiting

### Limites por Endpoint

| Endpoint | Limite | Janela |
|----------|--------|---------|
| `GET /api/automations` | 100 req | 1 minuto |
| `POST /api/automations` | 10 req | 1 minuto |
| `PUT /api/automations/{id}` | 20 req | 1 minuto |
| `DELETE /api/automations/{id}` | 5 req | 1 minuto |

### Headers de Rate Limit
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 📊 Webhooks (Futuro)

### Eventos Disponíveis
- `margin_guard.triggered` - Margin Guard executado
- `margin_guard.warning` - Alerta de warning
- `automation.created` - Automação criada
- `automation.updated` - Automação atualizada
- `automation.deleted` - Automação deletada

### Exemplo de Webhook
```json
{
  "event": "margin_guard.triggered",
  "timestamp": "2025-09-19T22:40:56.364Z",
  "data": {
    "user_id": "user-uuid",
    "automation_id": "automation-uuid",
    "trade_id": "trade-uuid",
    "action": "increase_liquidation_distance",
    "margin_ratio": 0.95,
    "threshold": 0.90
  }
}
```

---

## 🛠️ SDKs e Bibliotecas

### JavaScript/TypeScript
```javascript
import { AutomationAPI } from '@axisor/sdk';

const api = new AutomationAPI({
  baseURL: 'http://localhost:13010/api',
  token: 'your-jwt-token'
});

// Listar automações
const automations = await api.getAutomations();

// Criar Margin Guard
const marginGuard = await api.createAutomation({
  type: 'margin_guard',
  config: {
    enabled: true,
    margin_threshold: 90,
    action: 'increase_liquidation_distance',
    new_liquidation_distance: 25
  },
  is_active: true
});
```

### Python
```python
import requests

class AutomationAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_automations(self):
        response = requests.get(
            f'{self.base_url}/automations',
            headers=self.headers
        )
        return response.json()
    
    def create_margin_guard(self, config):
        data = {
            'type': 'margin_guard',
            'config': config,
            'is_active': True
        }
        response = requests.post(
            f'{self.base_url}/automations',
            headers=self.headers,
            json=data
        )
        return response.json()
```

---

## 📞 Suporte

### Contato
- **Email**: api-support@axisor.com
- **Discord**: [Link do servidor]
- **GitHub**: [Link do repositório]

### Status da API
- **Status Page**: [Link para status page]
- **Uptime**: 99.9%
- **Response Time**: < 200ms

---

*Última atualização: 19 de Setembro de 2025*
*Versão da API: 1.0.0*
