# Guia de Otimização de Performance

## Visão Geral

Este guia fornece estratégias e técnicas para otimizar a performance do Axisor, incluindo otimizações de banco de dados, cache, frontend e infraestrutura.

## Otimizações de Banco de Dados

### 1. Índices Otimizados

**Problema**: Queries lentas em tabelas grandes
**Solução**: Criar índices estratégicos

```sql
-- Índices para tabelas principais
CREATE INDEX idx_trades_user_id_created_at ON trades(user_id, created_at DESC);
CREATE INDEX idx_positions_user_id_status ON positions(user_id, status);
CREATE INDEX idx_automations_user_id_enabled ON automations(user_id, enabled);
CREATE INDEX idx_simulations_user_id_status ON simulations(user_id, status);

-- Índices compostos para queries complexas
CREATE INDEX idx_trades_user_status_created ON trades(user_id, status, created_at DESC);
CREATE INDEX idx_positions_user_side_status ON positions(user_id, side, status);

-- Índices parciais para dados ativos
CREATE INDEX idx_active_positions ON positions(user_id) WHERE status = 'active';
CREATE INDEX idx_enabled_automations ON automations(user_id) WHERE enabled = true;
```

### 2. Otimização de Queries

**Problema**: Queries N+1 e joins desnecessários
**Solução**: Usar Prisma includes e otimizar queries

```typescript
// ❌ Query ineficiente (N+1)
const users = await prisma.user.findMany();
for (const user of users) {
  const positions = await prisma.position.findMany({
    where: { user_id: user.id }
  });
}

// ✅ Query otimizada
const users = await prisma.user.findMany({
  include: {
    positions: true,
    automations: true,
    trades: {
      take: 10,
      orderBy: { created_at: 'desc' }
    }
  }
});

// ✅ Query com seleção específica
const dashboardData = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    positions: {
      where: { status: 'active' },
      select: {
        id: true,
        side: true,
        size: true,
        entry_price: true,
        current_price: true,
        pl: true
      }
    },
    _count: {
      select: {
        trades: true,
        automations: true
      }
    }
  }
});
```

### 3. Paginação Eficiente

**Problema**: Carregamento de grandes datasets
**Solução**: Implementar paginação com cursor

```typescript
// Paginação com offset (ineficiente para grandes datasets)
const trades = await prisma.trade.findMany({
  skip: page * limit,
  take: limit,
  orderBy: { created_at: 'desc' }
});

// Paginação com cursor (eficiente)
const trades = await prisma.trade.findMany({
  take: limit,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { created_at: 'desc' }
});
```

## Otimizações de Cache

### 1. Cache Redis Estratégico

**Implementação**: Cache de dados frequentemente acessados

```typescript
// Cache de dados de mercado (TTL: 30 segundos)
async function getMarketData() {
  const cacheKey = 'market:data';
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetchMarketData();
  await redis.setex(cacheKey, 30, JSON.stringify(data));
  return data;
}

// Cache de dados de usuário (TTL: 5 minutos)
async function getUserDashboard(userId: string) {
  const cacheKey = `user:${userId}:dashboard`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await buildUserDashboard(userId);
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  return data;
}

// Cache de automações ativas (TTL: 1 minuto)
async function getActiveAutomations(userId: string) {
  const cacheKey = `user:${userId}:automations:active`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const automations = await prisma.automation.findMany({
    where: { user_id: userId, enabled: true }
  });
  
  await redis.setex(cacheKey, 60, JSON.stringify(automations));
  return automations;
}
```

### 2. Invalidação Inteligente de Cache

```typescript
// Invalidar cache quando dados mudam
async function updatePosition(positionId: string, data: any) {
  const position = await prisma.position.update({
    where: { id: positionId },
    data
  });
  
  // Invalidar caches relacionados
  await redis.del(`user:${position.user_id}:dashboard`);
  await redis.del(`user:${position.user_id}:positions`);
  
  return position;
}

// Cache com tags para invalidação em lote
async function invalidateUserCache(userId: string) {
  const keys = await redis.keys(`user:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

## Otimizações de Frontend

### 1. Lazy Loading e Code Splitting

```typescript
// Lazy loading de componentes
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Simulations = lazy(() => import('./pages/Simulations'));
const Automations = lazy(() => import('./pages/Automations'));

// Code splitting por rota
const routes = [
  {
    path: '/admin',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <AdminDashboard />
      </Suspense>
    )
  }
];
```

### 2. Otimização de Requisições

```typescript
// Debounce para busca
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// Hook para requisições otimizadas
const useOptimizedData = (userId: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        const response = await api.get(`/api/dashboard/summary?user_id=${userId}`);
        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Erro ao carregar dados:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [userId]);
  
  return { data, loading };
};
```

### 3. Memoização e Otimização de Re-renders

```typescript
// Memoização de componentes pesados
const ExpensiveChart = memo(({ data }: { data: ChartData[] }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <XAxis dataKey="time" />
        <YAxis />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
});

// Memoização de cálculos pesados
const useMemoizedCalculations = (positions: Position[]) => {
  return useMemo(() => {
    return {
      totalPnL: positions.reduce((sum, pos) => sum + pos.pl, 0),
      totalMargin: positions.reduce((sum, pos) => sum + pos.margin, 0),
      activeCount: positions.filter(pos => pos.status === 'active').length
    };
  }, [positions]);
};
```

## Otimizações de Infraestrutura

### 1. Configuração de Containers

```yaml
# docker-compose.prod.yml - Otimizações
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS=--max-old-space-size=1024
      - UV_THREADPOOL_SIZE=16

  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.25'
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS=--max-old-space-size=512

  postgres:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
    command: >
      postgres
      -c shared_buffers=512MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=128MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
```

### 2. Configuração Nginx

```nginx
# nginx.conf - Otimizações
server {
    # Compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache de API (cuidado com dados dinâmicos)
    location /api/market/data {
        proxy_cache api_cache;
        proxy_cache_valid 200 30s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://backend;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
    }
}
```

### 3. Monitoramento de Performance

```typescript
// Middleware de monitoramento
const performanceMiddleware = (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
  const start = Date.now();
  
  reply.addHook('onSend', (request, reply, payload, done) => {
    const duration = Date.now() - start;
    
    // Log de performance
    request.log.info({
      method: request.method,
      url: request.url,
      duration,
      statusCode: reply.statusCode
    }, 'Request completed');
    
    // Métricas para Prometheus
    if (duration > 1000) {
      request.log.warn(`Slow request: ${request.url} took ${duration}ms`);
    }
    
    done();
  });
  
  done();
};

// Health check com métricas
app.get('/health', async (request, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  };
  
  reply.send(health);
});
```

## Otimizações de WebSocket

### 1. Conexões Eficientes

```typescript
// Gerenciamento de conexões WebSocket
class WebSocketManager {
  private connections = new Map<string, WebSocket>();
  private heartbeatInterval: NodeJS.Timeout;
  
  constructor() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // 30 segundos
  }
  
  addConnection(userId: string, ws: WebSocket) {
    this.connections.set(userId, ws);
    
    ws.on('close', () => {
      this.connections.delete(userId);
    });
  }
  
  broadcastToUser(userId: string, data: any) {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
  
  private sendHeartbeat() {
    this.connections.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
    });
  }
}
```

### 2. Throttling de Updates

```typescript
// Throttling de updates para evitar spam
class UpdateThrottler {
  private lastUpdate = new Map<string, number>();
  private readonly throttleMs = 1000; // 1 segundo
  
  shouldUpdate(key: string): boolean {
    const now = Date.now();
    const lastUpdate = this.lastUpdate.get(key) || 0;
    
    if (now - lastUpdate > this.throttleMs) {
      this.lastUpdate.set(key, now);
      return true;
    }
    
    return false;
  }
}
```

## Métricas e Monitoramento

### 1. Métricas de Performance

```typescript
// Coleta de métricas
const metrics = {
  requestDuration: new Map<string, number[]>(),
  errorCount: 0,
  activeConnections: 0
};

// Middleware de métricas
app.addHook('onRequest', (request, reply, done) => {
  const start = Date.now();
  request.startTime = start;
  done();
});

app.addHook('onResponse', (request, reply, done) => {
  const duration = Date.now() - request.startTime;
  const route = `${request.method}:${request.url}`;
  
  if (!metrics.requestDuration.has(route)) {
    metrics.requestDuration.set(route, []);
  }
  
  const durations = metrics.requestDuration.get(route)!;
  durations.push(duration);
  
  // Manter apenas últimas 100 medições
  if (durations.length > 100) {
    durations.shift();
  }
  
  done();
});
```

### 2. Alertas de Performance

```typescript
// Sistema de alertas
class PerformanceAlerts {
  private thresholds = {
    responseTime: 2000, // 2 segundos
    errorRate: 0.05,    // 5%
    memoryUsage: 0.8    // 80%
  };
  
  checkPerformance() {
    const memoryUsage = process.memoryUsage();
    const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    if (memoryPercent > this.thresholds.memoryUsage) {
      this.sendAlert('HIGH_MEMORY_USAGE', {
        usage: memoryPercent,
        threshold: this.thresholds.memoryUsage
      });
    }
  }
  
  private sendAlert(type: string, data: any) {
    // Enviar alerta via email, Slack, etc.
    console.warn(`Performance Alert: ${type}`, data);
  }
}
```

## Checklist de Otimização

### Banco de Dados
- [ ] Índices criados para queries frequentes
- [ ] Queries otimizadas (sem N+1)
- [ ] Paginação implementada
- [ ] Connection pooling configurado

### Cache
- [ ] Redis configurado e funcionando
- [ ] Cache de dados de mercado
- [ ] Cache de dados de usuário
- [ ] Invalidação de cache implementada

### Frontend
- [ ] Code splitting implementado
- [ ] Lazy loading de componentes
- [ ] Memoização de componentes pesados
- [ ] Debounce em buscas

### Infraestrutura
- [ ] Containers com limites de recursos
- [ ] Nginx com compressão e cache
- [ ] Rate limiting configurado
- [ ] Monitoramento de performance

### WebSocket
- [ ] Gerenciamento eficiente de conexões
- [ ] Throttling de updates
- [ ] Heartbeat implementado
- [ ] Reconexão automática

---

**Última Atualização**: 2025-01-22  
**Versão**: 1.0.0
