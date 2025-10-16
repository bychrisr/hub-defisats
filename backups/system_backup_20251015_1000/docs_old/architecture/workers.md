# Workers e Processamento Assíncrono

## Visão Geral

Os workers são serviços independentes que processam tarefas em background, garantindo que operações críticas como monitoramento de margem e execução de automações sejam executadas de forma confiável e escalável.

## Arquitetura de Workers

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Redis Queue   │    │   Workers       │
│   (Fastify)     │───►│   (BullMQ)      │───►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Dead Letter   │    │   External      │
                       │   Queue         │    │   APIs          │
                       └─────────────────┘    └─────────────────┘
```

## Workers Principais

### 1. Automation Worker (Multi-Account)

**Responsabilidade**: Execução de automações de trading com WebSocket em tempo real

**Frequência**: Sob demanda (quando automação é acionada)

**Processo**:
1. Busca credenciais da conta ativa via UserExchangeAccountService
2. Estabelece conexão WebSocket com LN Markets
3. Executa automação específica (Margin Guard, TP/SL, Auto Entry)
4. Registra logs detalhados com informações da conta
5. Fallback automático para HTTP se WebSocket falhar

**Configuração**:
```typescript
interface AutomationWorkerConfig {
  concurrency: number; // 5 automações simultâneas
  priority: number; // 8 (alta prioridade)
  attempts: number; // 3 tentativas
  backoff: {
    type: 'exponential';
    delay: 2000;
  };
  webSocketFallback: boolean; // true
}
```

**Filas**:
- `automation-execute`: Execução de automações
- `automation-log`: Logs de automações
- `automation-alert`: Alertas de automações

**Tipos de Automação**:
- **Margin Guard**: Monitoramento e proteção de margem
- **Take Profit/Stop Loss**: Gestão de TP/SL automática
- **Auto Entry**: Entrada automática baseada em condições

**WebSocket Integration**:
- **WebSocketManagerService**: Gerenciamento de conexões
- **LNMarketsWebSocketService**: Serviço WebSocket LN Markets
- **Fallback HTTP**: LNMarketsAPIService como fallback
- **Performance**: 96.2% mais rápido que HTTP

**Logs Detalhados**:
```typescript
// Log de execução com informações da conta
console.log(`🎯 AUTOMATION WORKER - Executing Margin Guard for user ${userId} on account ${accountName}`);
console.log(`📊 AUTOMATION WORKER - Found ${positions.length} positions for account ${accountName}`);
console.log(`✅ AUTOMATION WORKER - Margin Guard execution completed for account ${accountName}`);
```

**Documentação Completa**: [automation-worker-websocket-documentation.md](../backend/automation-worker-websocket-documentation.md)

### 2. Automation Scheduler (Multi-Account)

**Responsabilidade**: Agendamento de automações de trading com schedules por conta ativa

**Frequência**: Schedules recorrentes baseados no tipo de automação

**Processo**:
1. Busca conta ativa via UserExchangeAccountService
2. Busca automações ativas para a conta
3. Cria schedules recorrentes por tipo de automação
4. Gerencia timeouts específicos por conta
5. Atualiza schedules quando conta ativa muda

**Configuração**:
```typescript
interface AutomationSchedulerConfig {
  margin_guard: {
    interval: 30000; // 30 seconds
    timeout: 60000; // 1 minute
    retryAttempts: 3;
    retryDelay: 5000; // 5 seconds
  };
  tp_sl: {
    interval: 15000; // 15 seconds
    timeout: 30000; // 30 seconds
    retryAttempts: 2;
    retryDelay: 3000; // 3 seconds
  };
  auto_entry: {
    interval: 10000; // 10 seconds
    timeout: 20000; // 20 seconds
    retryAttempts: 2;
    retryDelay: 2000; // 2 seconds
  };
}
```

**Filas**:
- `automation-execute`: Execução de automações agendadas
- `automation-schedule`: Agendamento de automações
- `automation-timeout`: Timeouts de automações

**Funcionalidades**:
- **startUserAutomationScheduling**: Iniciar agendamento para usuário
- **stopUserAutomationScheduling**: Parar agendamento para usuário
- **updateAutomationScheduleForAccountChange**: Atualizar schedules na mudança de conta
- **getAutomationScheduleStatus**: Status de schedules ativos
- **handleAutomationTimeout**: Gerenciamento de timeouts
- **clearAutomationTimeout**: Limpeza de timeouts

**Schedules Recorrentes**:
- **Margin Guard**: 30s intervalo para monitoramento de margem
- **Take Profit/SL**: 15s intervalo para gestão de TP/SL
- **Auto Entry**: 10s intervalo para entradas automáticas
- **Timeouts Específicos**: Timeouts baseados na criticidade
- **Cleanup Automático**: Limpeza de schedules expirados

**Logs Detalhados**:
```typescript
// Log de agendamento com informações da conta
console.log(`🚀 AUTOMATION SCHEDULER - Starting automation scheduling for user ${userId}`);
console.log(`📅 AUTOMATION SCHEDULER - Creating schedule for automation ${automationId} (${automationType})`);
console.log(`✅ AUTOMATION SCHEDULER - Automation scheduling started for user ${userId} with ${automations.length} automations`);
```

**Documentação Completa**: [automation-scheduler-multi-account-documentation.md](../backend/automation-scheduler-multi-account-documentation.md)

### 3. Account Credentials Service (Multi-Account)

**Responsabilidade**: Gerenciamento de credenciais de contas de exchange com cache inteligente

**Frequência**: Sob demanda (quando credenciais são necessárias)

**Processo**:
1. Busca credenciais da conta ativa via UserExchangeAccountService
2. Verifica cache de credenciais por conta
3. Valida estrutura e conteúdo das credenciais
4. Armazena credenciais no cache com TTL configurável
5. Retorna credenciais validadas para automações

**Configuração**:
```typescript
interface AccountCredentialsConfig {
  validationTTL: number; // 5 minutes
  cacheTTL: number; // 10 minutes
  cleanupInterval: number; // 5 minutes
  redisUrl: string; // Redis connection
}
```

**Funcionalidades**:
- **getActiveAccountCredentials**: Busca credenciais da conta ativa
- **getAccountCredentials**: Busca credenciais de conta específica
- **validateCredentials**: Validação de credenciais antes da execução
- **clearAccountCredentialsCache**: Limpeza de cache por conta
- **clearUserCredentialsCache**: Limpeza de cache por usuário
- **getCacheStats**: Estatísticas de cache e performance

**Cache Inteligente**:
- **Cache por Conta**: Cache específico para cada conta
- **TTL Configurável**: 10 minutos para credenciais, 5 minutos para validações
- **Cache Hit/Miss**: Verificação de cache antes de buscar no banco
- **Cleanup Automático**: Limpeza de validações expiradas

**Validação de Credenciais**:
- **Estrutura**: Verificação de existência e estrutura das credenciais
- **Conteúdo**: Verificação de credenciais não vazias
- **Status**: Verificação de conta ativa
- **Cache de Validação**: Cache de validações com TTL

**Logs Detalhados**:
```typescript
// Log de busca de credenciais com informações da conta
console.log(`🔍 ACCOUNT CREDENTIALS - Getting active account credentials for user ${userId}`);
console.log(`✅ ACCOUNT CREDENTIALS - Found active account: ${accountName} (${exchangeName})`);
console.log(`✅ ACCOUNT CREDENTIALS - Credentials validated successfully for account ${accountName}`);
```

**Documentação Completa**: [account-credentials-service-multi-account-documentation.md](../backend/account-credentials-service-multi-account-documentation.md)

### 4. Margin Monitor Worker

**Responsabilidade**: Monitoramento contínuo da margem dos usuários

**Frequência**: A cada 5 segundos (configurável)

**Processo**:
1. Busca usuários com automações ativas
2. Consulta margem via LN Markets API
3. Avalia risco de liquidação
4. Aciona automações se necessário
5. Envia alertas se margem crítica

**Configuração**:
```typescript
interface MarginMonitorConfig {
  checkInterval: number; // 5000ms
  marginThreshold: number; // 0.8 (80%)
  criticalThreshold: number; // 0.9 (90%)
  maxRetries: number; // 3
  retryDelay: number; // 1000ms
}
```

**Filas**:
- `margin-check`: Verificação de margem
- `margin-alert`: Alertas de margem crítica
- `margin-protection`: Execução de proteção

---

### 2. Automation Executor Worker

**Responsabilidade**: Execução de ordens automatizadas

**Trigger**: Eventos de margem ou condições configuradas

**Processo**:
1. Recebe evento de execução
2. Valida condições atuais
3. Executa ordem via LN Markets API
4. Registra resultado no TradeLog
5. Envia notificação se necessário

**Configuração**:
```typescript
interface AutomationExecutorConfig {
  maxConcurrent: number; // 10
  timeout: number; // 30000ms
  retryAttempts: number; // 3
  retryDelay: number; // 5000ms
}
```

**Filas**:
- `automation-execute`: Execução de automações
- `automation-retry`: Retry de falhas
- `automation-log`: Logging de resultados

---

### 3. Simulation Executor Worker

**Responsabilidade**: Execução de simulações em tempo real

**Processo**:
1. Processa simulações na fila Redis
2. Executa lógica de automação passo a passo (100ms por passo)
3. Aplica cenários de preço (Bull, Bear, Sideways, Volatile)
4. Salva resultados em tempo real
5. Suporta até 2 simulações simultâneas por usuário

**Cenários de Preço**:
```typescript
// Bull Market: tendência positiva + baixa volatilidade
currentPrice += initialPrice * (0.001 + random * 0.002);

// Bear Market: tendência negativa + média volatilidade
currentPrice += initialPrice * (-0.002 + random * 0.003);

// Sideways: sem tendência + volatilidade baixa
currentPrice += initialPrice * random * 0.005;

// Volatile: alta volatilidade + eventos extremos
if (extremeEvent) {
  currentPrice += initialPrice * random * 0.05;
} else {
  currentPrice += initialPrice * random * 0.01;
}
```

**Filas**:
- `simulation-execute`: Execução de simulações
- `simulation-data`: Salvamento de dados em tempo real
- `simulation-complete`: Finalização de simulações

---

### 4. Notification Worker

**Responsabilidade**: Envio de notificações multi-canal

**Trigger**: Eventos de sistema ou usuário

**Processo**:
1. Recebe evento de notificação
2. Busca configurações do usuário
3. Envia via canais configurados
4. Registra status de entrega
5. Retry em caso de falha

**Configuração**:
```typescript
interface NotificationConfig {
  maxConcurrent: number; // 20
  timeout: number; // 10000ms
  retryAttempts: number; // 3
  retryDelay: number; // 2000ms
}
```

**Filas**:
- `notification-send`: Envio de notificações
- `notification-retry`: Retry de falhas
- `notification-log`: Logging de entregas

---

### 5. Payment Validator Worker

**Responsabilidade**: Validação de pagamentos Lightning

**Frequência**: A cada 30 segundos

**Processo**:
1. Busca pagamentos pendentes
2. Verifica status via Lightning API
3. Atualiza status no banco
4. Ativa plano do usuário
5. Envia confirmação

**Configuração**:
```typescript
interface PaymentValidatorConfig {
  checkInterval: number; // 30000ms
  maxAge: number; // 3600000ms (1 hora)
  retryAttempts: number; // 5
  retryDelay: number; // 10000ms
}
```

**Filas**:
- `payment-validate`: Validação de pagamentos
- `payment-expire`: Expiração de invoices
- `payment-activate`: Ativação de planos

## Estrutura de Filas

### Prioridades
1. **Critical**: Alertas de margem crítica
2. **High**: Execução de automações
3. **Normal**: Notificações e validações
4. **Low**: Logs e relatórios

### Configuração BullMQ
```typescript
interface QueueConfig {
  name: string;
  concurrency: number;
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete: number;
  removeOnFail: number;
}
```

### Dead Letter Queue
- Falhas após máximo de tentativas
- Análise de padrões de erro
- Alertas para administradores
- Retry manual se necessário

## Monitoramento de Workers

### Métricas
- Jobs processados por minuto
- Taxa de sucesso/falha
- Tempo médio de processamento
- Tamanho das filas
- Workers ativos

### Alertas
- Fila com muitos jobs pendentes
- Taxa de falha alta
- Worker inativo
- Tempo de processamento alto
- Dead letter queue com jobs

### Logs
```typescript
interface WorkerLog {
  timestamp: string;
  worker: string;
  jobId: string;
  event: 'start' | 'complete' | 'fail' | 'retry';
  duration?: number;
  error?: string;
  metadata?: object;
}
```

## Configuração de Desenvolvimento

### Docker Compose
```yaml
services:
  margin-monitor:
    build: ./workers
    command: npm run worker:margin-monitor
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/axisor
    depends_on:
      - redis
      - postgres

  automation-executor:
    build: ./workers
    command: npm run worker:automation-executor
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/axisor
    depends_on:
      - redis
      - postgres
```

### Scripts NPM
```json
{
  "scripts": {
    "worker:margin-monitor": "tsx src/workers/margin-monitor.ts",
    "worker:automation-executor": "tsx src/workers/automation-executor.ts",
    "worker:simulation-executor": "tsx src/workers/simulation-executor.ts",
    "worker:notification": "tsx src/workers/notification.ts",
    "worker:payment-validator": "tsx src/workers/payment-validator.ts",
    "worker:all": "concurrently \"npm run worker:*\""
  }
}
```

## Configuração de Produção

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: margin-monitor-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: margin-monitor-worker
  template:
    metadata:
      labels:
        app: margin-monitor-worker
    spec:
      containers:
      - name: margin-monitor
        image: axisor/workers:latest
        command: ["npm", "run", "worker:margin-monitor"]
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Auto-scaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: margin-monitor-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: margin-monitor-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Tratamento de Erros

### Estratégias de Retry
1. **Exponential Backoff**: Delay crescente entre tentativas
2. **Circuit Breaker**: Pausa após muitas falhas
3. **Dead Letter Queue**: Jobs que falharam definitivamente
4. **Manual Retry**: Intervenção humana quando necessário

### Tipos de Erro
- **Temporary**: Rede, timeout, rate limit
- **Permanent**: Dados inválidos, permissões
- **System**: Falha de infraestrutura
- **Business**: Regras de negócio violadas

### Recuperação
- Health checks automáticos
- Restart de workers inativos
- Escalamento automático
- Fallback para modo manual

## Performance e Otimização

### Otimizações
- Connection pooling para APIs
- Batch processing quando possível
- Cache de dados frequentes
- Compressão de payloads
- Lazy loading de dependências

### Limites
- Rate limiting por API externa
- Timeout configurável
- Memory limits por worker
- CPU limits por processo
- Queue size limits

### Monitoramento
- Prometheus metrics
- Grafana dashboards
- Alertas automáticos
- Logs estruturados
- Tracing distribuído

---

**Documento**: Workers e Processamento Assíncrono  
**Versão**: 1.3.0  
**Última Atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento
