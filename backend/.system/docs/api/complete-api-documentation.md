# Documentação Completa da API

## Visão Geral

Esta documentação fornece uma visão completa de todos os endpoints da API do Hub DeFiSats, incluindo autenticação, parâmetros, respostas e exemplos de uso.

## Base URL

- **Desenvolvimento**: `http://localhost:13010`
- **Staging**: `https://staging.defisats.site/api`
- **Produção**: `https://api.defisats.site`

## Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Inclua o token no header `Authorization`:

```bash
Authorization: Bearer <your-jwt-token>
```

### Obtenção de Token

```bash
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
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "plan_type": "free"
    }
  }
}
```

## Endpoints Principais

### Autenticação

#### POST /api/auth/register
Registra um novo usuário.

**Parâmetros:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "ln_markets_api_key": "your-api-key",
  "ln_markets_api_secret": "your-api-secret",
  "ln_markets_passphrase": "your-passphrase",
  "coupon_code": "ALPHATESTER" // opcional
}
```

#### POST /api/auth/login
Autentica um usuário existente.

#### POST /api/auth/refresh
Renova o token de acesso usando o refresh token.

#### GET /api/auth/me
Retorna informações do usuário autenticado.

### Dashboard

#### GET /api/dashboard/summary
Retorna resumo financeiro do usuário.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "estimated_balance": 150000,
    "total_invested": 100000,
    "total_pnl": 50000,
    "active_trades": 3,
    "margin_ratio": 0.75
  }
}
```

#### GET /api/dashboard/positions
Retorna posições ativas do usuário.

#### GET /api/dashboard/history
Retorna histórico de trades.

#### GET /api/dashboard/kpis
Retorna KPIs em tempo real.

### Automações

#### GET /api/automations
Lista todas as automações do usuário.

#### POST /api/automations
Cria uma nova automação.

**Parâmetros:**
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

#### PUT /api/automations/:id
Atualiza uma automação existente.

#### DELETE /api/automations/:id
Remove uma automação.

#### POST /api/automations/:id/toggle
Ativa/desativa uma automação.

### Simulações

#### GET /api/simulations
Lista simulações do usuário.

#### POST /api/simulations
Cria uma nova simulação.

**Parâmetros:**
```json
{
  "name": "Teste Bull Market",
  "scenario": "bull",
  "automation_type": "margin_guard",
  "config": {
    "threshold": 0.8,
    "duration": 3600
  }
}
```

#### GET /api/simulations/:id/progress
Retorna progresso da simulação em tempo real.

#### GET /api/simulations/:id/metrics
Retorna métricas finais da simulação.

### Market Data

#### GET /api/market/data
Retorna dados de mercado em tempo real.

#### GET /api/market/historical
Retorna dados históricos de preços.

#### GET /api/market/index
Retorna índice de preço atual.

#### GET /api/market/ticker
Retorna ticker atual do mercado.

### Administração

#### GET /api/admin/dashboard
Dashboard administrativo (requer privilégios de admin).

#### GET /api/admin/users
Lista todos os usuários.

#### GET /api/admin/trades/logs
Logs detalhados de trades.

#### GET /api/admin/metrics
Métricas de sistema.

### Tooltips e Cards

#### GET /api/cards-with-tooltips
Retorna cards do dashboard com tooltips configurados.

#### POST /api/tooltips
Cria um novo tooltip.

#### PUT /api/tooltips/:cardKey
Atualiza tooltip de um card.

#### DELETE /api/tooltips/:cardKey
Remove tooltip de um card.

## Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Requisição inválida
- **401**: Não autorizado
- **403**: Acesso negado
- **404**: Não encontrado
- **409**: Conflito (ex: email já existe)
- **422**: Dados de entrada inválidos
- **429**: Rate limit excedido
- **500**: Erro interno do servidor

## Rate Limiting

A API implementa rate limiting para prevenir abuso:

- **Autenticação**: 5 tentativas por 15 minutos
- **Registro**: 3 tentativas por hora
- **Geral**: 100 requests por minuto por usuário

## WebSocket

Para dados em tempo real, conecte-se ao WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:13010/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Dados recebidos:', data);
};
```

**Eventos disponíveis:**
- `position_update`: Atualização de posições
- `balance_update`: Atualização de saldo
- `market_data`: Dados de mercado
- `automation_trigger`: Disparo de automação

## Exemplos de Uso

### JavaScript/TypeScript

```typescript
// Configuração do cliente
const API_BASE = 'https://api.defisats.site';
const token = localStorage.getItem('access_token');

const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Métodos específicos
  async getDashboardSummary() {
    return this.request('/api/dashboard/summary');
  },
  
  async createAutomation(config: any) {
    return this.request('/api/automations', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
};
```

### cURL

```bash
# Obter resumo do dashboard
curl -H "Authorization: Bearer $TOKEN" \
     https://api.defisats.site/api/dashboard/summary

# Criar automação
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"type":"margin_guard","config":{"threshold":0.8}}' \
     https://api.defisats.site/api/automations
```

## Tratamento de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada inválidos",
    "details": {
      "email": "Email é obrigatório"
    }
  }
}
```

## Versionamento

A API utiliza versionamento por URL. A versão atual é v1:

- **v1**: `https://api.defisats.site/api/v1/...`
- **Atual**: `https://api.defisats.site/api/...` (sem versão = v1)

## Changelog da API

### v1.3.0 (2025-01-15)
- Adicionado sistema de simulações em tempo real
- Implementado WebSocket para dados em tempo real
- Adicionado sistema de tooltips configurável

### v1.2.0 (2025-01-22)
- Implementado painel administrativo completo
- Adicionados endpoints de administração
- Sistema de logs de auditoria

### v1.1.0 (2025-01-10)
- Sistema de cupons implementado
- Melhorias na autenticação
- Validação de credenciais LN Markets

## Suporte

Para suporte técnico ou dúvidas sobre a API:

- **Email**: support@defisats.site
- **Documentação**: https://docs.defisats.site
- **GitHub**: https://github.com/defisats/hub-defisats

---

**Última Atualização**: 2025-01-22  
**Versão da API**: v1.3.0  
**Status**: Ativa
