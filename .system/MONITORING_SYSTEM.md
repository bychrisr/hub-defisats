# Sistema de Monitoring - Axisor

## Visão Geral

O sistema de monitoring do Axisor fornece monitoramento em tempo real da infraestrutura, métricas de performance e alertas do sistema. O sistema é acessível apenas para usuários administradores e fornece insights críticos sobre a saúde da aplicação.

## Arquitetura

### Backend
- **Endpoints**: 
  - `/api/admin/monitoring` - Resumo geral do sistema
  - `/api/admin/monitoring/metrics/realtime` - Métricas em tempo real
  - `/api/admin/monitoring/services/health` - Saúde detalhada dos serviços
  - `/api/admin/monitoring/performance` - Métricas de performance
  - `/api/admin/monitoring/alerts` - Gestão de alertas
- **Método**: GET/POST
- **Autenticação**: Bearer Token (Superadmin)
- **Middleware**: Verificação de autenticação e autorização de superadmin

### Frontend
- **Componentes**: 
  - `Monitoring.tsx` - Dashboard principal de monitoramento
  - `Alerts.tsx` - Gestão de alertas
- **Localização**: `frontend/src/pages/admin/`
- **API Client**: Fetch com headers de autorização
- **Auto-refresh**: 30 segundos

## Estrutura de Dados

### Resposta da API Principal (`/api/admin/monitoring`)

```typescript
interface MonitoringData {
  success: boolean;
  data: {
    system: {
      uptime: number;
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
      cpu: object;
      activeConnections: number;
      version: string;
      environment: string;
    };
    performance: {
      apiLatency: number;
      errorRate: number;
      availability: number;
      requestsPerMinute: number;
    };
    services: {
      database: {
        status: string;
        responseTime: number;
      };
      redis: {
        status: string;
        responseTime: number;
      };
      lnMarkets: {
        status: string;
        responseTime: number;
      };
      workers: {
        status: string;
        details: object;
      };
    };
    metrics: {
      http: object;
      auth: object;
      rateLimit: object;
      business: object;
    };
    alerts: {
      active: number;
      total: number;
      bySeverity: object;
      recent: Array<object>;
    };
  };
}
```

### Exemplo de Resposta

```json
{
  "success": true,
  "data": {
    "system": {
      "uptime": 3600,
      "memory": {
        "used": 512,
        "total": 1024,
        "percentage": 50
      },
      "cpu": {},
      "activeConnections": 25,
      "version": "1.3.0",
      "environment": "development"
    },
    "performance": {
      "apiLatency": 150,
      "errorRate": 2.5,
      "availability": 99.9,
      "requestsPerMinute": 120
    },
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 5
      },
      "redis": {
        "status": "healthy",
        "responseTime": 2
      },
      "lnMarkets": {
        "status": "healthy",
        "responseTime": 200
      },
      "workers": {
        "status": "healthy",
        "details": {}
      }
    },
    "metrics": {
      "http": {},
      "auth": {},
      "rateLimit": {},
      "business": {}
    },
    "alerts": {
      "active": 0,
      "total": 5,
      "bySeverity": {},
      "recent": []
    }
  }
}
```

## Funcionalidades

### 1. Dashboard de Monitoramento
- **Visão Geral**: Status geral do sistema com indicadores visuais
- **Métricas em Tempo Real**: Atualização automática a cada 30 segundos
- **Gráficos de Performance**: Visualização de tendências e histórico
- **Indicadores de Saúde**: Status colorido para cada componente

### 2. Métricas de Sistema
- **Uptime**: Tempo de funcionamento do sistema
- **Memória**: Uso atual e percentual de memória
- **CPU**: Utilização de processador
- **Conexões Ativas**: Número de conexões simultâneas
- **Versão**: Informações de versão e ambiente

### 3. Métricas de Performance
- **API Latency**: Tempo médio de resposta das requisições
- **Error Rate**: Percentual de erros 5xx
- **Availability**: Percentual de disponibilidade
- **Requests Per Minute**: Taxa de requisições por minuto

### 4. Status de Serviços
- **Database**: Status da conexão com PostgreSQL
- **Redis**: Status do cache e filas
- **LN Markets API**: Monitoramento da API externa de trading
- **Workers**: Status dos workers de processamento

### 5. Sistema de Alertas
- **Alertas Ativos**: Lista de alertas em tempo real
- **Resolução de Alertas**: Interface para resolver alertas
- **Severidade**: Classificação por criticidade (info, warning, critical)
- **Histórico**: Log de alertas resolvidos

### 6. Métricas de Negócio
- **HTTP**: Métricas de requisições HTTP
- **Auth**: Métricas de autenticação
- **Rate Limit**: Métricas de limitação de taxa
- **Business**: Métricas específicas do negócio

## Implementação Técnica

### Backend (`monitoring.routes.ts`)

```typescript
// Endpoint principal de monitoring
fastify.get('/monitoring', {
  schema: {
    description: 'Get overall monitoring summary for admin dashboard',
    tags: ['Admin', 'Monitoring'],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              system: { type: 'object' },
              performance: { type: 'object' },
              services: { type: 'object' },
              metrics: { type: 'object' },
              alerts: { type: 'object' }
            }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  const summary = await advancedMonitoringService.getMonitoringSummary();
  return reply.status(200).send({ success: true, data: summary });
});
```

### Frontend (`Monitoring.tsx`)

```typescript
const fetchMonitoringData = async () => {
  setRefreshing(true);
  try {
    const response = await fetch('/api/admin/monitoring', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      setMonitoringData(result.data);
    }
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    toast.error('Erro ao carregar dados de monitoramento');
  } finally {
    setRefreshing(false);
  }
};
```

### Middleware de Autenticação (`superadmin.middleware.ts`)

```typescript
export async function superAdminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;

  if (!user || !user.id) {
    reply.status(401).send({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required for this route',
    });
    return;
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { user_id: user.id },
  });

  if (!adminUser || adminUser.role !== 'superadmin') {
    reply.status(403).send({
      success: false,
      error: 'FORBIDDEN',
      message: 'Access denied. Superadmin privileges required.',
    });
    return;
  }
}
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
- Verificar se o usuário está logado corretamente

### Erro 403 (Forbidden)
- Verificar se o usuário tem role `superadmin`
- Verificar se existe registro na tabela `AdminUser`
- Verificar se o middleware de superadmin está funcionando
- Verificar se o campo `is_admin` está sendo retornado no perfil

### Dados não atualizando
- Verificar se o auto-refresh está ativo (30s)
- Verificar logs do console para erros de rede
- Verificar se o backend está respondendo
- Verificar se o Docker Compose está rodando
- Verificar se os containers estão saudáveis

### Problemas de Redirecionamento
- Verificar se o campo `is_admin` está sendo retornado no login
- Verificar se o campo `is_admin` está sendo retornado no perfil
- Verificar se o frontend está lendo corretamente os campos
- Verificar se a lógica de redirecionamento está implementada

### Problemas de Schema
- Verificar se os schemas de validação incluem todos os campos necessários
- Verificar se o AuthResponseZodSchema inclui `is_admin`
- Verificar se o schema da rota de perfil inclui `is_admin` e `admin_role`
- Verificar se o schema da rota de login inclui `is_admin`

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

### Teste Manual - Endpoints de Monitoramento

#### 1. Resumo Geral
```bash
curl -X GET "http://localhost:13010/api/admin/monitoring" \
  -H "Authorization: Bearer <token>"
```

#### 2. Métricas em Tempo Real
```bash
curl -X GET "http://localhost:13010/api/admin/monitoring/metrics/realtime" \
  -H "Authorization: Bearer <token>"
```

#### 3. Saúde dos Serviços
```bash
curl -X GET "http://localhost:13010/api/admin/monitoring/services/health" \
  -H "Authorization: Bearer <token>"
```

#### 4. Métricas de Performance
```bash
curl -X GET "http://localhost:13010/api/admin/monitoring/performance" \
  -H "Authorization: Bearer <token>"
```

#### 5. Alertas
```bash
curl -X GET "http://localhost:13010/api/admin/monitoring/alerts" \
  -H "Authorization: Bearer <token>"
```

#### 6. Resolver Alerta
```bash
curl -X POST "http://localhost:13010/api/admin/monitoring/alerts/{id}/resolve" \
  -H "Authorization: Bearer <token>"
```

### Teste de Login com Admin
```bash
# Fazer login
curl -X POST "http://localhost:13010/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@axisor.com", "password": "Admin123!"}'

# Verificar perfil
curl -X GET "http://localhost:13010/api/profile" \
  -H "Authorization: Bearer <token>"
```

## Docker Compose

### Configuração de Desenvolvimento

O sistema de monitoramento é executado usando Docker Compose para desenvolvimento:

```yaml
# config/docker/docker-compose.dev.yml
services:
  backend:
    build:
      context: ../../backend
      dockerfile: Dockerfile.dev
    container_name: axisor-backend
    ports:
      - "13010:3010"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://axisor:axisor_dev_password@postgres:5432/axisor
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:3010/api/health-check', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Comandos Úteis

```bash
# Iniciar ambiente de desenvolvimento
docker compose -f config/docker/docker-compose.dev.yml up -d

# Parar ambiente
docker compose -f config/docker/docker-compose.dev.yml down

# Reconstruir containers
docker compose -f config/docker/docker-compose.dev.yml build --no-cache

# Ver logs
docker compose -f config/docker/docker-compose.dev.yml logs -f backend

# Verificar status dos containers
docker compose -f config/docker/docker-compose.dev.yml ps
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

5. **Correção de Bugs**
   - Corrigir loop infinito do serviço de versão no frontend
   - Implementar scripts de desenvolvimento

## Conclusão

O sistema de monitoring do Axisor fornece uma visão abrangente da saúde da aplicação, permitindo identificação rápida de problemas e monitoramento proativo da infraestrutura. A implementação atual é robusta e escalável, com planos para melhorias contínuas baseadas nas necessidades operacionais.

### Principais Conquistas

- ✅ Sistema de monitoramento completo implementado
- ✅ Redirecionamento de admin corrigido
- ✅ Docker Compose configurado para desenvolvimento
- ✅ Schemas de validação corrigidos
- ✅ Middleware de superadmin implementado
- ✅ Frontend integrado com dados reais
- ✅ Sistema de alertas funcional
