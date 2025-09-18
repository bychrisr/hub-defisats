# Análise Técnica do Projeto

## 1. Visão Geral da Arquitetura

### 1.1 Stack Tecnológica Principal
- **Backend**: Node.js 18+ com Fastify
- **Frontend**: React 18 com Vite
- **Banco de Dados**: PostgreSQL 15+ com Prisma ORM
- **Cache e Filas**: Redis 7+ com BullMQ
- **Containerização**: Docker + Docker Compose
- **Autenticação**: JWT + Refresh Tokens

### 1.2 Padrão Arquitetural
- **Microserviços**: Separação clara entre responsabilidades
- **API Gateway**: Fastify como ponto de entrada
- **Workers Assíncronos**: Processamento em background
- **Event-Driven**: Comunicação via filas Redis

## 2. Entidades e Modelos de Dados

### 2.1 Entidades Principais

#### User
```typescript
{
  id: UUID (pk, required)
  email: string (unique, required)
  password_hash: string (nullable)
  social_provider: enum (google, github, etc., nullable)
  social_id: string (nullable)
  ln_markets_api_key: string (encrypted, required)
  ln_markets_api_secret: string (encrypted, required)
  ln_markets_passphrase: string (encrypted, required)
  plan_type: enum (free, basic, advanced, pro, default: free)
  last_activity_at: datetime (nullable)
  created_at: datetime (default: now)
  updated_at: datetime (default: now)
  is_active: boolean (default: true)
  session_expires_at: datetime (nullable)
}
```

#### Automation
```typescript
{
  id: UUID (pk, required)
  user_id: UUID (fk to User.id, required)
  type: enum (margin_guard, tp_sl, auto_entry, required)
  config: jsonb (required)
  is_active: boolean (default: true)
  created_at: datetime (default: now)
  updated_at: datetime (default: now)
}
```

#### TradeLog
```typescript
{
  id: UUID (pk, required)
  user_id: UUID (fk to User.id, required)
  automation_id: UUID (fk to Automation.id, nullable)
  trade_id: string (required) // LN Markets trade ID
  status: enum (success, app_error, exchange_error, required)
  error_message: text (nullable)
  executed_at: datetime (required)
  created_at: datetime (default: now)
}
```

#### Simulation
```typescript
{
  id: UUID (pk, required)
  user_id: UUID (fk to User.id, required)
  name: string (required)
  scenario: enum (bull, bear, sideways, volatile, required)
  automation_type: enum (margin_guard, take_profit, trailing_stop, auto_entry, required)
  config: jsonb (required)
  status: enum (pending, running, completed, failed, required)
  progress: integer (0-100, default: 0)
  result: jsonb (nullable)
  created_at: datetime (default: now)
  updated_at: datetime (default: now)
  completed_at: datetime (nullable)
}
```

### 2.2 Relacionamentos
- **User** 1:N **Automation**
- **User** 1:N **TradeLog**
- **Automation** 1:N **TradeLog**
- **User** 1:N **Simulation**
- **User** 1:N **Notification**
- **User** 1:N **Payment**
- **User** 1:N **BacktestReport**

## 3. API Endpoints

### 3.1 Autenticação
```bash
POST   /api/auth/register          # Cadastro de usuário
POST   /api/auth/login             # Login
POST   /api/auth/logout            # Logout
GET    /api/auth/me                # Perfil do usuário
POST   /api/auth/refresh           # Refresh token
POST   /api/auth/forgot-password   # Recuperação de senha
POST   /api/auth/reset-password    # Reset de senha
```

### 3.2 Automações
```bash
POST   /api/automations            # Criar automação
GET    /api/automations            # Listar automações
GET    /api/automations/:id        # Detalhes da automação
PUT    /api/automations/:id        # Atualizar automação
DELETE /api/automations/:id        # Deletar automação
POST   /api/automations/:id/toggle # Ativar/desativar
```

### 3.3 Simulações
```bash
POST   /api/simulations            # Criar simulação
GET    /api/simulations            # Listar simulações
GET    /api/simulations/:id        # Detalhes da simulação
POST   /api/simulations/:id/start  # Executar simulação
GET    /api/simulations/:id/progress # Progresso em tempo real
GET    /api/simulations/:id/metrics  # Métricas finais
GET    /api/simulations/:id/chart    # Dados para gráficos
DELETE /api/simulations/:id        # Deletar simulação
```

### 3.4 Dashboard
```bash
GET    /api/dashboard/summary      # Resumo financeiro
GET    /api/dashboard/positions    # Posições atuais
GET    /api/dashboard/history      # Histórico de trades
GET    /api/dashboard/kpis         # KPIs em tempo real
```

### 3.5 Market Data
```bash
GET    /api/market/data            # Dados de mercado em tempo real
GET    /api/market/historical      # Dados históricos
GET    /api/market/index           # Índice de preço
GET    /api/market/ticker          # Ticker atual
```

### 3.6 Admin
```bash
GET    /api/admin/dashboard        # Dashboard administrativo
GET    /api/admin/users            # Lista de usuários
PUT    /api/admin/users/:id        # Atualizar usuário
POST   /api/admin/coupons          # Criar cupom
GET    /api/admin/coupons          # Listar cupons
GET    /api/admin/logs             # Logs do sistema
GET    /api/admin/metrics          # Métricas de performance
```

## 4. Workers e Processamento Assíncrono

### 4.1 Margin Monitor Worker
- **Frequência**: A cada 5 segundos
- **Fila**: `margin-check` (prioridade alta)
- **Função**: Monitorar margem de todos os usuários ativos
- **Cálculo**: `maintenance_margin / (margin + pl)`
- **Níveis**: safe (≤0.8), warning (>0.8), critical (>0.9)

### 4.2 Automation Executor Worker
- **Fila**: `automation-executor`
- **Função**: Executar automações configuradas
- **Integração**: LN Markets API para execução real
- **Logs**: Registro completo de todas as ações

### 4.3 Simulation Executor Worker
- **Fila**: `simulation-executor`
- **Função**: Executar simulações em tempo real
- **Cenários**: Bull, Bear, Sideways, Volatile
- **Algoritmos**: Movimentos de preço realistas

### 4.4 Notification Worker
- **Fila**: `notification`
- **Função**: Envio de notificações multi-canal
- **Canais**: Email, Telegram, WhatsApp, Webhook
- **Retry**: Lógica de retry automático

## 5. Integração com LN Markets

### 5.1 Autenticação
- **Método**: HMAC-SHA256
- **Headers**: LNM-ACCESS-KEY, LNM-ACCESS-SIGNATURE, LNM-ACCESS-PASSPHRASE, LNM-ACCESS-TIMESTAMP
- **Base URL**: `https://api.lnmarkets.com/v2`

### 5.2 Endpoints Utilizados
```bash
GET    /user                        # Informações do usuário
GET    /futures/ticker              # Dados de mercado
GET    /futures/trades              # Histórico de trades
GET    /futures/positions           # Posições abertas
POST   /futures/orders              # Criar ordem
DELETE /futures/orders/:id          # Cancelar ordem
```

### 5.3 Rate Limiting
- **Limite**: 100 requests/minuto por usuário
- **Retry**: Backoff exponencial em caso de limite
- **Cache**: Dados de mercado em cache por 5 segundos

## 6. Sistema de Segurança

### 6.1 Autenticação e Autorização
- **JWT**: Access tokens (15min) + refresh tokens (7d)
- **2FA**: Obrigatório para admins (Google Authenticator)
- **Social Auth**: Google/GitHub OAuth2
- **Session Management**: Controle de sessões ativas

### 6.2 Criptografia
- **Senhas**: bcrypt com salt rounds 12
- **Keys LN Markets**: AES-256
- **Dados Sensíveis**: libsodium
- **Tokens**: JWT com chave secreta forte

### 6.3 Proteção contra Ataques
- **Rate Limiting**: 5 tentativas/15min login, 3 tentativas/1h registro
- **CAPTCHA**: reCAPTCHA v3 + hCaptcha fallback
- **CSRF**: Tokens CSRF para operações state-changing
- **XSS**: DOMPurify, escape de HTML, CSP headers
- **SQL Injection**: Prisma ORM com prepared statements

### 6.4 Headers de Segurança
- **HTTPS**: Redirecionamento HTTP → HTTPS
- **HSTS**: Strict-Transport-Security
- **CSP**: Content-Security-Policy
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff

## 7. Performance e Escalabilidade

### 7.1 Otimizações de Performance
- **Cache Redis**: Dados frequentes em cache
- **Connection Pooling**: Prisma com pool de conexões
- **Lazy Loading**: Carregamento sob demanda
- **CDN**: Assets estáticos via CDN

### 7.2 Métricas de Performance
- **Latência**: < 200ms para automações
- **Throughput**: 1000+ requests/minuto
- **Uptime**: 99.5%+ disponibilidade
- **Memory**: < 512MB por worker

### 7.3 Escalabilidade
- **Horizontal**: Múltiplas instâncias de workers
- **Vertical**: Aumento de recursos por instância
- **Database**: Read replicas para consultas
- **Cache**: Cluster Redis para alta disponibilidade

## 8. Monitoramento e Observabilidade

### 8.1 Logs
- **Estruturados**: JSON format com níveis
- **Correlação**: Request ID para rastreamento
- **Retenção**: 30 dias para logs de aplicação
- **Rotação**: Logrotate para arquivos grandes

### 8.2 Métricas
- **Application**: Response time, error rate, throughput
- **Infrastructure**: CPU, memory, disk, network
- **Business**: Usuários ativos, trades executados, receita

### 8.3 Alertas
- **Critical**: Falhas de automação, API down
- **Warning**: Alta latência, muitos erros
- **Info**: Deployments, mudanças de configuração

## 9. Testes e Qualidade

### 9.1 Estratégia de Testes
- **Unit Tests**: Jest para funções isoladas
- **Integration Tests**: Testes de API endpoints
- **E2E Tests**: Cypress para fluxos completos
- **Load Tests**: Artillery para performance

### 9.2 Cobertura de Testes
- **Backend**: 80%+ cobertura de código
- **Frontend**: 70%+ cobertura de componentes
- **Critical Paths**: 100% cobertura de automações

### 9.3 Qualidade de Código
- **ESLint**: Linting automático
- **Prettier**: Formatação consistente
- **TypeScript**: Tipagem estática
- **Husky**: Pre-commit hooks

## 10. Deploy e Infraestrutura

### 10.1 Containerização
- **Docker**: Multi-stage builds otimizados
- **Docker Compose**: Desenvolvimento local
- **Kubernetes**: Produção com Helm charts

### 10.2 CI/CD
- **GitHub Actions**: Pipeline automatizado
- **Staging**: Deploy automático na branch develop
- **Production**: Deploy manual com approval

### 10.3 Infraestrutura
- **Cloud Provider**: AWS/GCP/Azure
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Load Balancer**: Application Load Balancer
- **SSL**: Let's Encrypt com auto-renewal

## 11. Workers e Processamento Assíncrono

### 11.1 Margin Monitor Worker
- **Frequência**: A cada 5 segundos (configurável)
- **Responsabilidade**: Monitoramento contínuo da margem dos usuários
- **Processo**: 
  1. Busca usuários com automações ativas
  2. Consulta margem via LN Markets API (`GET /v2/futures/trades?type=running`)
  3. Calcula razão de margem: `marginRatio = position.maintenance_margin / (position.margin + position.pl)`
  4. Avalia nível de risco: `level = marginRatio > 0.9 ? 'critical' : marginRatio > 0.8 ? 'warning' : 'safe'`
  5. Aciona automações se necessário
  6. Envia alertas se margem crítica
- **Fila**: `margin-check` (prioridade: high)
- **Configuração**:
  ```typescript
  interface MarginMonitorConfig {
    checkInterval: number; // 5000ms
    marginThreshold: number; // 0.8 (80%)
    criticalThreshold: number; // 0.9 (90%)
    maxRetries: number; // 3
    retryDelay: number; // 1000ms
  }
  ```

### 11.2 Automation Executor Worker
- **Trigger**: Eventos de margem ou condições configuradas
- **Responsabilidade**: Execução de ordens automatizadas
- **Processo**: 
  1. Recebe evento de execução
  2. Valida condições atuais
  3. Executa ordem via LN Markets API (`POST /v2/futures/close`)
  4. Registra resultado no TradeLog com status granular
  5. Envia notificação se necessário
- **Fila**: `automation-execute` (prioridade: critical)
- **Configuração**:
  ```typescript
  interface AutomationExecutorConfig {
    maxConcurrent: number; // 10
    timeout: number; // 30000ms
    retryAttempts: number; // 3
    retryDelay: number; // 5000ms
  }
  ```

### 11.3 Simulation Executor Worker
- **Responsabilidade**: Execução de simulações em tempo real
- **Processo**:
  1. Processa simulações na fila Redis
  2. Executa lógica de automação passo a passo (100ms por passo)
  3. Aplica cenários de preço (Bull, Bear, Sideways, Volatile)
  4. Salva resultados em tempo real
  5. Suporta até 2 simulações simultâneas por usuário
- **Fila**: `simulation-execute` (prioridade: normal)
- **Cenários de Preço**:
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

### 11.4 Notification Worker
- **Trigger**: Eventos de sistema ou usuário
- **Responsabilidade**: Envio de notificações multi-canal
- **Processo**: 
  1. Recebe evento de notificação
  2. Busca configurações do usuário
  3. Envia via canais configurados (Telegram via EvolutionAPI, Email via SMTP, WhatsApp)
  4. Registra status de entrega
  5. Retry em caso de falha
- **Fila**: `notification-send` (prioridade: normal)
- **Configuração**:
  ```typescript
  interface NotificationConfig {
    maxConcurrent: number; // 20
    timeout: number; // 10000ms
    retryAttempts: number; // 3
    retryDelay: number; // 2000ms
  }
  ```

### 11.5 Payment Validator Worker
- **Frequência**: A cada 30 segundos
- **Responsabilidade**: Validação de pagamentos Lightning
- **Processo**: 
  1. Busca pagamentos pendentes
  2. Verifica status via Lightning API (LNbits/LND)
  3. Atualiza status no banco
  4. Ativa plano do usuário
  5. Envia confirmação
- **Fila**: `payment-validate` (prioridade: normal)
- **Configuração**:
  ```typescript
  interface PaymentValidatorConfig {
    checkInterval: number; // 30000ms
    maxAge: number; // 3600000ms (1 hora)
    retryAttempts: number; // 5
    retryDelay: number; // 10000ms
  }
  ```

### 11.6 Estrutura de Filas
- **Prioridades**: Critical > High > Normal > Low
- **Dead Letter Queue**: Falhas após máximo de tentativas
- **Rate Limiting**: Controle de taxa por API externa
- **Monitoring**: Métricas de jobs processados, taxa de sucesso, tempo de processamento

## 12. Análise de Riscos

### 11.1 Riscos Técnicos
- **API LN Markets**: Dependência externa crítica
- **Rate Limiting**: Limitações de API podem impactar funcionalidade
- **Latência**: Rede pode afetar execução de automações
- **Escalabilidade**: Crescimento pode exigir refatoração

### 11.2 Riscos de Segurança
- **Vazamento de Keys**: Credenciais LN Markets comprometidas
- **Ataques**: Brute force, DDoS, injection
- **Compliance**: Regulamentações de dados financeiros

### 11.3 Mitigações
- **Backup**: Múltiplas estratégias de backup
- **Monitoring**: Alertas proativos
- **Security**: Auditorias regulares
- **Documentation**: Runbooks para incidentes

## 12. Conclusões e Recomendações

### 12.1 Pontos Fortes
- **Arquitetura**: Bem estruturada e escalável
- **Segurança**: Implementação robusta
- **Performance**: Otimizada para latência baixa
- **Monitoramento**: Observabilidade completa

### 12.2 Áreas de Melhoria
- **Testes**: Aumentar cobertura de testes E2E
- **Documentação**: API documentation com OpenAPI
- **Monitoring**: Dashboards mais detalhados
- **Backup**: Estratégias de disaster recovery

### 12.3 Próximos Passos
- **Refinamento**: Melhorias baseadas em feedback
- **Escalabilidade**: Preparação para crescimento
- **Features**: Novas funcionalidades baseadas em dados
- **Optimization**: Contínua melhoria de performance

---

**Documento**: Análise Técnica do Projeto  
**Versão**: 1.3.0  
**Última Atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento
