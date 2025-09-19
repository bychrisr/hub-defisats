# Sistema de Monitoring - hub-defisats

## Visão Geral

O sistema de monitoring do hub-defisats fornece monitoramento em tempo real da infraestrutura, métricas de performance e alertas do sistema. O sistema é acessível apenas para usuários administradores e fornece insights críticos sobre a saúde da aplicação.

## Arquitetura

### Backend
- **Endpoint**: `/api/admin/monitoring`
- **Método**: GET
- **Autenticação**: Bearer Token (Superadmin)
- **Middleware**: Verificação de autenticação e autorização de superadmin

### Frontend
- **Componente**: `Monitoring.tsx`
- **Localização**: `frontend/src/pages/admin/Monitoring.tsx`
- **API Client**: Axios com interceptors automáticos
- **Auto-refresh**: 30 segundos

## Estrutura de Dados

### Resposta da API

```typescript
interface MonitoringData {
  api_latency: number;           // Latência média da API em ms
  error_rate: number;            // Taxa de erro em %
  queue_sizes: {                 // Tamanhos das filas
    [queueName: string]: number;
  };
  ln_markets_status: string;     // Status da API LN Markets
  system_health: {               // Saúde dos componentes
    database: string;
    redis: string;
    workers: string;
  };
}
```

### Exemplo de Resposta

```json
{
  "api_latency": 150,
  "error_rate": 2.5,
  "queue_sizes": {
    "automation-execute": 0,
    "notification": 0,
    "payment-validator": 0
  },
  "ln_markets_status": "healthy",
  "system_health": {
    "database": "healthy",
    "redis": "healthy",
    "workers": "healthy"
  }
}
```

## Funcionalidades

### 1. Métricas de Performance
- **API Latency**: Tempo médio de resposta das requisições
- **Error Rate**: Percentual de erros 5xx nas últimas 5 minutos
- **Queue Health**: Status e tamanho das filas de processamento

### 2. Status de Serviços Externos
- **LN Markets API**: Monitoramento da API externa de trading
- **Database**: Status da conexão com PostgreSQL
- **Redis**: Status do cache e filas
- **Workers**: Status dos workers de processamento

### 3. Alertas do Sistema
- Alertas em tempo real sobre problemas críticos
- Notificações de alta carga nas filas
- Alertas de falha de serviços externos

## Implementação Técnica

### Backend (`admin.routes.ts`)

```typescript
// Endpoint de monitoring
fastify.get('/monitoring', {
  schema: {
    description: 'Get infrastructure monitoring data',
    tags: ['Admin'],
    response: {
      200: {
        type: 'object',
        properties: {
          api_latency: { type: 'number' },
          error_rate: { type: 'number' },
          queue_sizes: { type: 'object' },
          ln_markets_status: { type: 'string' },
          system_health: { type: 'object' }
        }
      }
    }
  }
}, async (_request: FastifyRequest, reply: FastifyReply) => {
  // Implementação das métricas
});
```

### Frontend (`Monitoring.tsx`)

```typescript
const fetchMonitoringData = async () => {
  try {
    setRefreshing(true);
    const response = await api.get('/api/admin/monitoring');
    setMonitoringData(response.data);
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
  } finally {
    setRefreshing(false);
  }
};
```

## Segurança

### Autenticação
- Requer token JWT válido
- Token deve estar no header `Authorization: Bearer <token>`

### Autorização
- Apenas usuários com role `superadmin`
- Verificação no middleware `preHandler`

### Validação
- Validação de token via `AuthService.validateSession()`
- Verificação de registro de admin no banco de dados

## Monitoramento e Alertas

### Métricas Coletadas
1. **Performance**
   - Latência de API
   - Taxa de erro
   - Throughput de requisições

2. **Recursos**
   - Uso de memória
   - CPU
   - Conexões de banco

3. **Filas**
   - Tamanho das filas
   - Taxa de processamento
   - Jobs falhados

### Alertas Automáticos
- Alta latência (> 500ms)
- Taxa de erro alta (> 5%)
- Filas com muitos jobs pendentes (> 100)
- Serviços externos indisponíveis

## Troubleshooting

### Erro 401 (Unauthorized)
- Verificar se o token está presente no localStorage
- Verificar se o token não expirou
- Verificar se o usuário tem permissão de admin

### Erro 403 (Forbidden)
- Verificar se o usuário tem role `superadmin`
- Verificar se existe registro na tabela `AdminUser`

### Dados não atualizando
- Verificar se o auto-refresh está ativo (30s)
- Verificar logs do console para erros de rede
- Verificar se o backend está respondendo

## Logs e Debug

### Frontend
```typescript
console.log('🔍 MONITORING - Fetching monitoring data...');
console.log('🔍 MONITORING - Token in localStorage:', token ? 'EXISTS' : 'MISSING');
console.log('✅ MONITORING - Data received:', response.data);
```

### Backend
```typescript
console.log('🔍 ADMIN MIDDLEWARE - Starting authentication check');
console.log('✅ Admin access granted for:', user.email);
```

## Testes

### Teste Unitário
```bash
npm test -- --testPathPattern=monitoring.test.ts
```

### Teste Manual
```bash
curl -X GET "http://localhost:13000/api/admin/monitoring" \
  -H "Authorization: Bearer <token>"
```

## Melhorias Futuras

1. **Métricas em Tempo Real**
   - WebSocket para atualizações em tempo real
   - Gráficos interativos

2. **Alertas Avançados**
   - Notificações por email/Slack
   - Escalação automática de alertas

3. **Dashboard Personalizado**
   - Widgets customizáveis
   - Filtros por período

4. **Integração com Prometheus**
   - Métricas mais detalhadas
   - Histórico de dados

## Conclusão

O sistema de monitoring do hub-defisats fornece uma visão abrangente da saúde da aplicação, permitindo identificação rápida de problemas e monitoramento proativo da infraestrutura. A implementação atual é robusta e escalável, com planos para melhorias contínuas baseadas nas necessidades operacionais.
