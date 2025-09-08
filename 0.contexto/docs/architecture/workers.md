# Workers e Processamento Assíncrono

Este documento descreve a arquitetura de workers do hub-defisats, responsáveis pelo processamento assíncrono e monitoramento em tempo real.

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

### 1. Margin Monitor Worker

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

### 3. Notification Worker

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

### 4. Payment Validator Worker

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
      - DATABASE_URL=postgresql://user:pass@postgres:5432/hubdefisats
    depends_on:
      - redis
      - postgres

  automation-executor:
    build: ./workers
    command: npm run worker:automation-executor
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/hubdefisats
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
        image: hubdefisats/workers:latest
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
