# Decisões Arquiteturais e Tecnológicas

Este documento registra as decisões arquiteturais e tecnológicas importantes tomadas durante o desenvolvimento do projeto hub-defisats, seguindo o padrão ADR (Architectural Decision Records).

## ADR-021: Correção de Race Condition do Prisma Client

**Data**: 2025-01-25  
**Status**: Aceito  
**Contexto**: Resolução de problema crítico de race condition na inicialização do Prisma Client

### Problema
- Workers tentavam usar Prisma Client antes da conexão ser estabelecida
- Erro `PrismaClientKnownRequestError: Table does not exist` mesmo com tabelas existindo
- Race condition entre inicialização do Prisma e workers do BullMQ
- Múltiplas instâncias do Prisma Client causando inconsistências

### Decisão
- **Lazy Loading**: Implementar função `getPrisma()` que garante conexão antes do uso
- **Singleton Pattern**: Uma única instância conectada reutilizada em toda aplicação
- **Injeção de Dependência**: Workers recebem instância conectada como parâmetro
- **Reorganização da Inicialização**: Database conectado ANTES dos workers
- **Verificação de Segurança**: Lógica de retry com múltiplas tentativas

### Implementação
```typescript
// lib/prisma.ts - Lazy loading com garantia de conexão
export const getPrisma = async (): Promise<PrismaClient> => {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient(getConnectionConfig());
    await globalForPrisma.prisma.$connect();
    await globalForPrisma.prisma.$queryRaw`SELECT 1`; // Verificação
  }
  return globalForPrisma.prisma;
};

// index.ts - Ordem correta de inicialização
const prisma = await getPrisma(); // 1. Conectar database
// ... outras inicializações
startPeriodicMonitoring(prisma); // 2. Iniciar workers com instância conectada
```

### Consequências
- ✅ Race condition eliminado
- ✅ Workers funcionam corretamente
- ✅ Uma única instância do Prisma Client
- ✅ Conexão garantida antes do uso
- ✅ Sistema estável e confiável

## ADR-022: Correção de UX no Sistema de Login

**Data**: 2025-01-25  
**Status**: Aceito  
**Contexto**: Melhoria da experiência do usuário durante falhas de login

### Problema
- Interceptor do Axios redirecionava automaticamente em qualquer erro 401
- Usuário não conseguia ver mensagens de erro de login
- Página recarregava antes do usuário ler a mensagem
- UX ruim para debugging e correção de credenciais

### Decisão
- **Exclusão de Endpoints de Auth**: Interceptor não redireciona em `/auth/login` e `/auth/register`
- **Preservação de Funcionalidade**: Mantém redirecionamento para outros endpoints protegidos
- **Tratamento de Erro Local**: Componente de login trata erros localmente

### Implementação
```typescript
// lib/api.ts - Interceptor modificado
if (error.response?.status === 401 && 
    !originalRequest._retry && 
    !originalRequest.url?.includes('/auth/refresh') &&
    !originalRequest.url?.includes('/auth/login') &&      // ← Exclusão
    !originalRequest.url?.includes('/auth/register')) {   // ← Exclusão
  // ... lógica de refresh token
}
```

### Consequências
- ✅ Usuário vê mensagens de erro claras
- ✅ Não há redirecionamento automático em falhas de login
- ✅ Melhor experiência de debugging
- ✅ Funcionalidade de refresh token preservada

## ADR-020: Sistema de Trading Real Completo

**Data**: 2025-01-25  
**Status**: Aceito  
**Contexto**: Implementação completa do sistema de trading real com gestão de risco avançada

### Problema
- Necessidade de execução real de trades via LN Markets API
- Validação robusta de saldo e margem antes da execução
- Sistema de confirmação de ordens para segurança
- Logs detalhados de execução para auditoria
- Gerenciamento de risco avançado para proteção do capital
- Acompanhamento completo de portfólio e performance

### Decisão
- **TradingConfirmationService**: Sistema de confirmação de ordens com tokens únicos
- **TradingValidationService**: Validação completa de parâmetros e limites
- **TradingLoggerService**: Logs detalhados de todas as operações
- **RiskManagementService**: Gerenciamento de risco com limites automáticos
- **PortfolioTrackingService**: Acompanhamento completo de portfólio

### Implementação

#### **🔐 Sistema de Confirmação de Ordens**
- **Confirmação por Token**: Cada ordem gera um token único de confirmação
- **Expiração Automática**: Ordens expiram automaticamente após tempo limite
- **Validação Prévia**: Validação completa antes da criação da confirmação
- **Bulk Operations**: Suporte a confirmações em lote
- **Retry Logic**: Sistema de retry automático para falhas temporárias

#### **✅ Validação de Trading**
- **Validação de Saldo**: Verificação de saldo suficiente antes da execução
- **Validação de Margem**: Cálculo de margem necessária e disponível
- **Validação de Parâmetros**: Verificação de todos os parâmetros do trade
- **Validação de Mercado**: Verificação de condições de mercado
- **Validação de Risco**: Análise de risco antes da execução

#### **📊 Sistema de Logs Detalhados**
- **Logs de Criação**: Log completo da criação de trades
- **Logs de Atualização**: Log de todas as atualizações de posições
- **Logs de Fechamento**: Log detalhado do fechamento de posições
- **Logs de Risco**: Log de alertas e eventos de risco
- **Logs de API**: Log de erros e falhas da API
- **Logs de Autenticação**: Log de eventos de autenticação

#### **⚠️ Gerenciamento de Risco Avançado**
- **Limites de Exposição**: Controle automático de exposição máxima
- **Limites de Perda**: Controle de perda máxima diária
- **Limites de Posição**: Controle de tamanho máximo de posições
- **Limites de Alavancagem**: Controle de alavancagem máxima
- **Stop Loss Automático**: Execução automática de stop loss
- **Redução de Exposição**: Redução automática quando necessário

#### **📈 Acompanhamento de Portfólio**
- **Posições Ativas**: Acompanhamento de todas as posições abertas
- **Métricas de Portfólio**: Cálculo de métricas completas do portfólio
- **Exposição por Mercado**: Análise de exposição por mercado
- **Métricas de Performance**: Cálculo de métricas avançadas de performance
- **Relatórios de Performance**: Geração de relatórios completos

### Benefícios
- **Segurança**: Sistema robusto de validação e confirmação
- **Transparência**: Logs detalhados de todas as operações
- **Proteção**: Gerenciamento de risco avançado
- **Visibilidade**: Acompanhamento completo de portfólio
- **Confiabilidade**: Sistema robusto e testado

### Consequências
- **Complexidade**: Sistema mais complexo mas mais seguro
- **Performance**: Validações adicionais podem impactar performance
- **Manutenção**: Mais serviços para manter e monitorar
- **Testes**: Necessidade de testes abrangentes para todos os serviços

## ADR-021: Sistema de Backtesting Histórico

**Data**: 2025-01-25  
**Status**: Aceito  
**Contexto**: Implementação de sistema completo de backtesting para teste de estratégias com dados históricos

### Problema
- Necessidade de testar estratégias de trading com dados históricos
- Validação de performance antes da execução real
- Otimização de parâmetros de estratégias
- Comparação de múltiplas estratégias
- Análise de métricas avançadas de performance

### Decisão
- **BacktestingService**: Sistema completo de backtesting histórico
- **Múltiplos Timeframes**: Suporte a diferentes períodos de análise
- **Otimização de Parâmetros**: Otimização automática de parâmetros
- **Comparação de Estratégias**: Comparação automática de performance
- **Métricas Avançadas**: Cálculo de métricas de risco e performance

### Implementação

#### **📊 Sistema de Backtesting**
- **Dados Históricos**: Simulação de dados históricos para teste
- **Múltiplos Timeframes**: Suporte a 1m, 5m, 15m, 1h, 4h, 1d
- **Estratégias Configuráveis**: Estratégias com parâmetros personalizáveis
- **Simulação Realística**: Simulação com comissões e slippage

#### **🔧 Otimização de Parâmetros**
- **Grid Search**: Busca em grade de parâmetros
- **Métricas de Otimização**: Otimização baseada em Sharpe Ratio
- **Validação Cruzada**: Validação de parâmetros otimizados
- **Resultados Comparativos**: Comparação de diferentes configurações

#### **📈 Métricas Avançadas**
- **Métricas de Performance**: Return, Sharpe Ratio, Sortino Ratio, Calmar Ratio
- **Métricas de Risco**: VaR, Expected Shortfall, Maximum Drawdown
- **Métricas de Trading**: Win Rate, Profit Factor, Average Trade
- **Métricas de Tempo**: Holding Time, Recovery Time

#### **🔄 Comparação de Estratégias**
- **Execução Paralela**: Execução simultânea de múltiplas estratégias
- **Ranking Automático**: Ranking baseado em métricas de performance
- **Análise Comparativa**: Comparação detalhada de resultados
- **Relatórios Consolidados**: Relatórios unificados de comparação

### Benefícios
- **Validação**: Teste de estratégias antes da execução real
- **Otimização**: Otimização automática de parâmetros
- **Comparação**: Comparação objetiva de estratégias
- **Análise**: Análise detalhada de performance e risco
- **Confiabilidade**: Maior confiança na execução real

### Consequências
- **Complexidade**: Sistema complexo de simulação e análise
- **Performance**: Processamento intensivo de dados históricos
- **Armazenamento**: Necessidade de armazenar resultados de backtest
- **Manutenção**: Manutenção de estratégias e parâmetros

## ADR-022: Sistema de Machine Learning com Dados Históricos Reais

**Data**: 2025-01-25  
**Status**: Aceito  
**Contexto**: Implementação de sistema de machine learning com integração a APIs reais de dados históricos

### Problema
- Necessidade de algoritmos de predição de mercado usando dados reais
- Integração com APIs externas para dados históricos (Binance, CoinGecko)
- Análise de sentiment do mercado
- Detecção automática de padrões técnicos
- Sistema de recomendações baseado em machine learning

### Decisão
- **MachineLearningService**: Sistema completo de ML para predição de mercado
- **HistoricalDataService**: Integração com APIs reais (Binance, CoinGecko)
- **Fallback Automático**: Sistema de fallback entre APIs
- **Cache Inteligente**: Cache de dados históricos para performance
- **Indicadores Técnicos**: Cálculo completo de indicadores técnicos

### Implementação

#### **🤖 Sistema de Machine Learning**
- **Predição de Mercado**: Algoritmos de predição com dados reais
- **Treinamento de Modelos**: Sistema de treinamento de modelos ML
- **Métricas de Performance**: Cálculo de métricas de precisão
- **Validação Cruzada**: Validação de modelos treinados

#### **📊 Integração de Dados Históricos**
- **Binance API**: Dados históricos de alta qualidade
- **CoinGecko API**: Fallback para dados históricos
- **Mapeamento de Mercados**: Mapeamento automático de símbolos
- **Múltiplos Timeframes**: Suporte a diferentes períodos

#### **🔍 Análise Avançada**
- **Análise de Sentiment**: Análise de sentiment do mercado
- **Detecção de Padrões**: Detecção automática de padrões técnicos
- **Indicadores Técnicos**: Cálculo completo de indicadores
- **Condições de Mercado**: Análise de condições de mercado

#### **💡 Sistema de Recomendações**
- **Recomendações Automáticas**: Sistema baseado em ML
- **Múltiplos Fatores**: Combinação de predição, padrões e sentiment
- **Níveis de Risco**: Classificação de risco das recomendações
- **Horizonte Temporal**: Recomendações com horizonte temporal

### Benefícios
- **Dados Reais**: Uso de dados históricos reais das principais exchanges
- **Precisão**: Maior precisão nas predições com dados reais
- **Confiabilidade**: Sistema de fallback robusto
- **Performance**: Cache inteligente para melhor performance
- **Flexibilidade**: Suporte a múltiplos mercados e timeframes

### Consequências
- **Dependência Externa**: Dependência de APIs externas
- **Rate Limiting**: Necessidade de gerenciar rate limits
- **Cache Management**: Gerenciamento de cache de dados
- **Error Handling**: Tratamento robusto de erros de API
- **Data Quality**: Validação de qualidade dos dados recebidos

## ADR-023: Sistema de Risk Metrics Avançadas

**Data**: 2025-01-25  
**Status**: Aceito  
**Contexto**: Implementação de sistema completo de métricas de risco avançadas para análise de portfólio

### Problema
- Necessidade de métricas de risco avançadas para análise de portfólio
- Cálculo de VaR (Value at Risk) para quantificação de risco
- Análise de Sharpe Ratio para avaliação de retorno ajustado ao risco
- Cálculo de Maximum Drawdown para análise de perdas máximas
- Análise de correlação para diversificação de portfólio
- Sistema de alertas e recomendações baseado em métricas de risco

### Decisão
- **RiskMetricsService**: Sistema completo de métricas de risco avançadas
- **Múltiplas Métricas**: VaR, Sharpe Ratio, Maximum Drawdown, Correlation Analysis
- **Métricas Adicionais**: Beta, Tracking Error, Information Ratio, Calmar Ratio, Sortino Ratio
- **Análise de Risco**: Sistema de análise de risco com níveis e alertas
- **Recomendações**: Sistema de recomendações baseado em métricas

### Implementação

#### **📊 Métricas de Risco Principais**
- **VaR (Value at Risk)**: Cálculo histórico e paramétrico com múltiplos níveis de confiança
- **Sharpe Ratio**: Avaliação de retorno ajustado ao risco com taxa livre de risco
- **Maximum Drawdown**: Análise de perdas máximas com identificação de picos e vales
- **Correlation Analysis**: Análise de correlação entre ativos com matriz de correlação

#### **📈 Métricas Adicionais**
- **Beta**: Medição de sensibilidade em relação ao benchmark
- **Tracking Error**: Desvio padrão dos retornos ativos
- **Information Ratio**: Retorno ativo dividido pelo tracking error
- **Calmar Ratio**: Retorno anual dividido pelo maximum drawdown
- **Sortino Ratio**: Retorno ajustado ao risco de baixa

#### **🔍 Análise de Risco**
- **Níveis de Risco**: Classificação automática (low, medium, high, critical)
- **Sistema de Alertas**: Alertas automáticos baseados em thresholds
- **Recomendações**: Recomendações automáticas baseadas em métricas
- **Análise Completa**: Análise abrangente com todas as métricas

#### **⚙️ Funcionalidades Técnicas**
- **Múltiplos Métodos**: Diferentes métodos de cálculo para cada métrica
- **Validação de Dados**: Validação robusta de dados de entrada
- **Tratamento de Erros**: Tratamento robusto de erros e casos extremos
- **Performance**: Cálculos otimizados para performance

### Benefícios
- **Análise Completa**: Análise abrangente de risco de portfólio
- **Métricas Padrão**: Implementação de métricas padrão da indústria
- **Alertas Automáticos**: Sistema de alertas para riscos elevados
- **Recomendações**: Recomendações automáticas para melhoria de portfólio
- **Flexibilidade**: Suporte a múltiplos benchmarks e configurações

### Consequências
- **Complexidade**: Sistema complexo com múltiplas métricas
- **Performance**: Cálculos intensivos para grandes portfólios
- **Validação**: Necessidade de validação rigorosa de dados
- **Manutenção**: Manutenção de múltiplas fórmulas e métodos
- **Testes**: Necessidade de testes abrangentes para todas as métricas

## ADR-019: Arquitetura Reestruturada - Separação de Ambientes

**Data**: 2025-01-20  
**Status**: Aceito  
**Contexto**: Reestruturação da arquitetura para separar claramente os ambientes de desenvolvimento, staging e produção

### Problema
- Necessidade de separação clara entre ambientes de desenvolvimento, staging e produção
- Diferentes tecnologias e configurações para cada ambiente
- Facilidade de deploy e gerenciamento por ambiente
- Performance otimizada para produção
- Segurança aprimorada por ambiente

### Decisão
- **Desenvolvimento (Local)**: Docker Compose no PC do desenvolvedor
- **Staging**: Servidor com Docker Compose para testes
- **Produção**: Servidor nativo com PM2 para performance máxima
- **Proxy Global**: Roteamento baseado em domínio
- **Deploy Automático**: GitHub Actions para staging, manual para produção

### Implementação

#### **Estrutura de Ambientes**

##### **🖥️ Desenvolvimento (Local)**
- **Localização**: PC do desenvolvedor
- **Tecnologia**: Docker Compose
- **Portas**: 
  - Frontend: `localhost:13000`
  - Backend: `localhost:13010`
  - PostgreSQL: `localhost:5432`
  - Redis: `localhost:6379`

##### **🧪 Staging**
- **Localização**: Servidor `defisats.site`
- **Tecnologia**: Docker Compose
- **Domínio**: `staging.defisats.site`
- **Portas**:
  - Frontend: `localhost:13001`
  - Backend: `localhost:13011`
  - PostgreSQL: `localhost:5433`
  - Redis: `localhost:6380`

##### **🚀 Produção**
- **Localização**: Servidor `defisats.site`
- **Tecnologia**: Instalação Nativa (Node.js + PM2)
- **Domínio**: `defisats.site`
- **Portas**:
  - Frontend: `localhost:3001`
  - Backend: `localhost:3000`
  - PostgreSQL: `localhost:5432`
  - Redis: `localhost:6379`

#### **Estrutura de Diretórios no Servidor**
```
/home/ubuntu/
├── apps/
│   ├── hub-defisats/                    # Desenvolvimento (Docker)
│   ├── hub-defisats-staging/            # Staging (Docker)
│   └── hub-defisats-production/         # Produção (Nativo)
├── proxy/                               # Proxy Global
│   ├── conf.d/
│   │   ├── staging.conf                 # Configuração Staging
│   │   └── production.conf              # Configuração Produção
│   └── certs/                           # Certificados SSL
└── /var/www/hub-defisats/               # Aplicação Produção (Nativo)
    ├── backend/
    ├── frontend/
    └── ecosystem.config.js
```

#### **Configurações por Ambiente**

##### **Staging (Docker)**
```yaml
# Docker Compose
services:
  postgres-staging:
    ports: ["5433:5432"]
  redis-staging:
    ports: ["6380:6379"]
  backend-staging:
    ports: ["13011:13010"]
  frontend-staging:
    ports: ["13001:13000"]
  nginx-staging:
    ports: ["8080:80"]
```

##### **Produção (Nativo)**
```javascript
// PM2 Configuration
apps: [
  { name: 'hub-defisats-backend', script: './backend/dist/index.js' },
  { name: 'hub-defisats-margin-monitor', script: './backend/dist/workers/margin-monitor.js' },
  { name: 'hub-defisats-automation-executor', script: './backend/dist/workers/automation-executor.js' },
  { name: 'hub-defisats-notification-worker', script: './backend/dist/workers/notification-worker.js' },
  { name: 'hub-defisats-payment-validator', script: './backend/dist/workers/payment-validator.js' }
]
```

#### **Proxy Global**
```nginx
# Staging
upstream staging_backend {
    server hub-defisats-nginx-staging:80;
}

# Produção
upstream production_backend {
    server 127.0.0.1:3000;
}
upstream production_frontend {
    server 127.0.0.1:3001;
}
```

#### **Fluxo de Deploy com GitHub Actions**

##### **🚀 Deploy Automático (Staging)**
- **Trigger**: Push para branch `develop`
- **Workflow**: `.github/workflows/staging.yml`
- **Processo**: Testes → Deploy → Health Check
- **URL**: `https://staging.defisats.site`

##### **🚀 Deploy Manual (Produção)**
- **Trigger**: Push para branch `main` ou Workflow Dispatch
- **Workflow**: `.github/workflows/production.yml`
- **Processo**: Testes → Backup → Deploy → Health Check
- **URL**: `https://defisats.site`

##### **🧪 Validação de Pull Request**
- **Trigger**: Pull Request para `main` ou `develop`
- **Workflow**: `.github/workflows/pr-validation.yml`
- **Processo**: Lint → Testes → Type Check → Security Audit → Build

#### **Comandos de Gerenciamento**

##### **Staging (Docker)**
```bash
# Iniciar
docker compose -f docker-compose.staging.yml up -d

# Parar
docker compose -f docker-compose.staging.yml down

# Logs
docker compose -f docker-compose.staging.yml logs -f

# Status
docker compose -f docker-compose.staging.yml ps
```

##### **Produção (PM2)**
```bash
# Iniciar
pm2 start ecosystem.config.js --env production

# Parar
pm2 stop all

# Reiniciar
pm2 reload all

# Logs
pm2 logs

# Status
pm2 status

# Monitoramento
pm2 monit
```

### Justificativa
- **Separação Clara**: Desenvolvimento local, staging para testes, produção otimizada
- **Performance**: Produção sem overhead do Docker, PM2 para gerenciamento
- **Facilidade de Deploy**: Scripts automatizados e deploy independente
- **Segurança**: Rate limiting e configurações específicas por ambiente
- **Monitoramento**: Logs centralizados e health checks configurados

### Consequências
- **Positivas**: Performance otimizada, deploy facilitado, segurança aprimorada
- **Neutras**: Requer configuração inicial de múltiplos ambientes
- **Riscos**: Complexidade de gerenciamento de múltiplos ambientes

### Fluxo de Desenvolvimento com Pull Requests

#### **1. Criação de Feature Branch**
```bash
git checkout -b feature/nova-funcionalidade
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

#### **2. Pull Request para Develop (Staging)**
- Criar PR de `feature/nova-funcionalidade` → `develop`
- GitHub Actions executa validações automaticamente
- Merge automático após aprovação dos testes
- Deploy automático para staging

#### **3. Testes em Staging**
- Acessar `https://staging.defisats.site`
- Testes manuais e automatizados
- Validação com stakeholders
- Correções se necessário

#### **4. Pull Request para Main (Produção)**
- Criar PR de `develop` → `main`
- Requer aprovação manual
- Deploy manual para produção após merge
- Backup automático antes do deploy

### Configuração de Secrets no GitHub
```bash
# SSH Key para acesso ao servidor
SERVER_SSH_KEY

# Credenciais de email (opcional)
EMAIL_USERNAME
EMAIL_PASSWORD

# Webhook do Slack/Discord (opcional)
SLACK_WEBHOOK
```

### Próximos Passos
1. **Configurar Secrets no GitHub**
2. **Configurar Proteções de Branch**
3. **Instalar ambiente de produção**
4. **Configurar DNS**
5. **Deploy inicial**
6. **Monitoramento**

## ADR-018: Deploy em Produção - Infraestrutura e Processo

**Data**: 2025-01-22  
**Status**: Aceito  
**Contexto**: Documentação completa do processo de deploy em produção do Hub DeFiSats

### Problema
- Necessidade de documentação completa para deploy em produção
- Processo de deploy seguro e confiável
- Configuração de infraestrutura em produção
- Monitoramento e troubleshooting pós-deploy
- Plano de rollback em caso de falhas

### Decisão
- **Servidor de Produção**: AWS Ubuntu 24.04.3 LTS (IP: 3.143.248.70)
- **Domínios**: Frontend `https://defisats.site`, API `https://api.defisats.site`
- **Infraestrutura**: Docker Compose com serviços completos
- **Deploy Seguro**: Script automatizado com backup e rollback
- **Monitoramento**: Health checks e logs centralizados
- **SSL**: Certificados Let's Encrypt com auto-renewal

### Implementação

#### **Arquivos de Configuração**
```yaml
# Docker Compose de Produção
config/docker/docker-compose.prod.yml
├── PostgreSQL (porta 5432)
├── Redis (porta 6379)
├── Backend (porta 3010)
├── Frontend (porta 80)
├── Nginx (reverse proxy)
└── Workers (margin-monitor, automation-executor)
```

#### **Scripts de Deploy**
```bash
# Deploy Seguro
./scripts/deploy/deploy-safe.sh
├── Verifica saúde da produção atual
├── Cria backup automático
├── Testa ambiente de staging
├── Testa localmente
├── Para produção atual
├── Inicia nova versão
├── Verifica saúde da nova versão
└── Rollback automático se falhar

# Verificação
./scripts/deploy/check-production.sh
├── Health checks completos
├── Verificação de containers
├── Testes de conectividade
└── Validação de funcionalidades
```

#### **Variáveis de Ambiente Obrigatórias**
```bash
# Database
POSTGRES_DB=hubdefisats_prod
POSTGRES_USER=hubdefisats_prod
POSTGRES_PASSWORD=your_secure_database_password

# Security
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum
ENCRYPTION_KEY=your_secure_encryption_key_32_chars

# URLs
CORS_ORIGIN=https://defisats.site
VITE_API_URL=https://api.defisats.site

# LN Markets
LN_MARKETS_API_URL=https://api.lnmarkets.com
```

#### **Estrutura Docker**
| Container | Status | Função | Porta Interna |
|-----------|--------|--------|---------------|
| `hub-defisats-backend-prod` | ✅ Healthy | API Backend | 3010 |
| `hub-defisats-frontend-prod` | ✅ Running | Frontend React | 80 |
| `hub-defisats-nginx-prod` | ✅ Running | Nginx interno | 80 |
| `hub-defisats-postgres-prod` | ✅ Healthy | Banco de dados | 5432 |
| `hub-defisats-redis-prod` | ✅ Healthy | Cache Redis | 6379 |
| `hub-defisats-margin-monitor-prod` | ⚠️ Restarting | Worker | - |
| `hub-defisats-automation-executor-prod` | ⚠️ Restarting | Worker | - |

#### **Health Checks**
```bash
# Frontend
curl -I https://defisats.site

# API
curl -I https://api.defisats.site/health

# Conectividade interna
docker exec global-nginx-proxy curl -s http://hub-defisats-nginx-prod:80
```

#### **Plano de Rollback**
```bash
# Rollback Automático (via script)
- ❌ Health check falhar
- ❌ Frontend não responder
- ❌ API não responder
- ❌ Timeout de 10 minutos

# Rollback Manual
cd backups/YYYYMMDD_HHMMSS
cp .env.production.backup ../../config/env/.env.production
cp docker-compose.prod.yml.backup ../../docker-compose.prod.yml
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Justificativa
- **Confiabilidade**: Deploy seguro com backup automático e rollback
- **Monitoramento**: Health checks e logs para diagnóstico rápido
- **Escalabilidade**: Infraestrutura preparada para crescimento
- **Segurança**: SSL/TLS e configurações de segurança adequadas
- **Manutenibilidade**: Scripts automatizados e documentação completa

### Consequências
- **Positivas**: Deploy confiável, monitoramento completo, rollback automático
- **Neutras**: Requer configuração inicial de certificados SSL
- **Riscos**: Dependência de serviços externos (Let's Encrypt, AWS)

### Checklist Pré-Deploy
- [ ] ✅ Produção atual está funcionando
- [ ] ✅ Backup foi criado
- [ ] ✅ Staging foi testado
- [ ] ✅ Variáveis de ambiente estão corretas
- [ ] ✅ Docker images foram buildadas
- [ ] ✅ Teste local passou
- [ ] ✅ Tem acesso ao servidor
- [ ] ✅ Tem plano de rollback

### Troubleshooting Comum
```bash
# Frontend não carrega (502 Bad Gateway)
docker logs hub-defisats-frontend-prod
docker ps | grep frontend
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# API não responde
docker logs hub-defisats-backend-prod
curl https://api.defisats.site/health
docker logs hub-defisats-postgres-prod

# Workers não funcionam
docker logs hub-defisats-margin-monitor
docker logs hub-defisats-automation-executor
docker logs hub-defisats-redis-prod
```

## ADR-017: Ícones Flutuantes & Nova Seção Posições Ativas

**Data**: 2025-01-19  
**Status**: Aceito  
**Contexto**: Implementação de ícones flutuantes e oficialização da nova seção "Posições Ativas" com design moderno

### Problema
- Cards da dashboard precisavam de melhor organização visual
- Ícones tradicionais ocupavam espaço interno dos cards
- Tooltips sobrepostos por ícones devido a problemas de z-index
- Linha "Teste" precisava ser oficializada como "Posições Ativas"
- Necessidade de shadows coloridas específicas por estado dos cards

### Decisão
- **Ícones Flutuantes**: Implementar design "meio para fora" com quadrado flutuante
- **Posicionamento**: Usar `absolute` com `right: 0.60rem, top: -1.4rem`
- **Z-index**: Tooltips com `z-[9999]`, ícones com `z-0`
- **Shadows Coloridas**: Cores específicas por estado (success, danger, warning)
- **Seção Oficial**: Renomear "Teste" para "Posições Ativas" e remover linha antiga
- **Props Adicionais**: `floatingIcon`, `variant`, `showSatsIcon` nos componentes

### Implementação
```typescript
// PnLCard - Ícone flutuante
{floatingIcon && Icon && (
  <div 
    className="absolute w-10 h-10 bg-card border border-border rounded-lg shadow-lg flex items-center justify-center p-2 z-0"
    style={{ right: '0.60rem', top: '-1.4rem' }}
  >
    <Icon className={cn('h-5 w-5', getIconColor())} />
  </div>
)}

// CSS - Shadows coloridas por estado
.card-success:hover {
  box-shadow: 10px 10px 20px -10px rgba(34, 197, 94, 0.1), 0 10px 10px -5px rgba(34, 197, 94, 0.04);
}

.card-danger:hover {
  box-shadow: 10px 10px 20px -10px rgba(239, 68, 68, 0.1), 0 10px 10px -5px rgba(239, 68, 68, 0.04);
}

.card-warning:hover {
  box-shadow: 10px 10px 20px -10px rgba(245, 158, 11, 0.1), 0 10px 10px -5px rgba(245, 158, 11, 0.04);
}
```

### Justificativa
- **UX Melhorada**: Ícones flutuantes economizam espaço interno dos cards
- **Visual Moderno**: Design "meio para fora" cria sensação de profundidade
- **Tooltips Funcionais**: Z-index correto garante visibilidade dos tooltips
- **Consistência**: Shadows coloridas por estado melhoram feedback visual
- **Organização**: Seção oficial "Posições Ativas" com cards aprimorados

### Consequências
- **Positivas**: Interface mais moderna e profissional, melhor UX
- **Neutras**: Requer manutenção de z-index e posicionamento
- **Riscos**: Ícones podem sobrepor conteúdo em telas muito pequenas

## ADR-016: Correção WebSocket & Eliminação de Polling

**Data**: 2025-01-19  
**Status**: Aceito  
**Contexto**: Correção de problemas críticos no WebSocket que causavam fallback para polling desnecessário

### Problema
- WebSocket não funcionava corretamente devido a erro de sintaxe no backend
- CORS configurado incorretamente (localhost:3000 vs localhost:13000)
- Sistema fazia fallback para polling HTTP desnecessário
- Performance degradada por requisições repetitivas
- Dados não atualizados em tempo real

### Decisão
- **Backend**: Corrigir `connection.socket.send()` para `connection.send()` no Fastify WebSocket
- **CORS**: Ajustar CORS_ORIGIN de `localhost:3000` para `localhost:13000`
- **Logs**: Adicionar logs de debug para rastreamento da conexão
- **Frontend**: Manter sistema de reconexão automática funcionando
- **Performance**: Eliminar polling desnecessário, usar apenas WebSocket

### Implementação
```typescript
// Backend - Correção do WebSocket
// ❌ Antes (erro)
connection.socket.send(JSON.stringify(message));

// ✅ Depois (correto)
connection.send(JSON.stringify(message));

// CORS - Correção da origem
// ❌ Antes
CORS_ORIGIN="http://localhost:3000"

// ✅ Depois
CORS_ORIGIN="http://localhost:13000"

// Frontend - Logs de debug
console.log('🔗 REALTIME - URL do WebSocket:', wsUrl);
console.log('🔌 WEBSOCKET - URL completa:', url);
```

### Justificativa
- **Funcionalidade**: WebSocket é essencial para dados em tempo real
- **Performance**: Elimina requisições HTTP desnecessárias
- **UX**: Dados atualizados instantaneamente
- **Confiabilidade**: Sistema robusto com reconexão automática

### Consequências
- ✅ **WebSocket 100% Funcional**: Conexão estável e mensagens sendo recebidas
- ✅ **Performance Otimizada**: Eliminadas requisições HTTP desnecessárias
- ✅ **Tempo Real**: Dados atualizados instantaneamente via WebSocket
- ✅ **Sistema Robusto**: Reconexão automática e tratamento de erros
- ✅ **Logs Detalhados**: Facilita debugging e monitoramento

### Alternativas Consideradas
- **Manter Polling**: Rejeitado por ser ineficiente e desnecessário
- **WebSocket com Fallback**: Mantido para casos de falha temporária
- **Server-Sent Events**: Rejeitado por ser menos eficiente que WebSocket

---

## ADR-015: Separação de Responsabilidades Admin vs Usuário

**Data**: 2025-01-19  
**Status**: Aceito  
**Contexto**: Correção de requisições LN Markets desnecessárias para usuários admin

### Problema
- Usuários admin estavam fazendo requisições LN Markets desnecessárias
- Console mostrava erros "Failed to load monitoring data" para admin
- Performance degradada por queries de trading em usuários administrativos
- Confusão entre responsabilidades de admin vs usuário comum

### Decisão
- **Frontend**: Implementar verificação `isAdmin` em todos os hooks que fazem queries LN Markets
- **Backend**: Criar função `checkIfAdmin()` usando relação `admin_user` do Prisma
- **Retorno de Dados**: Admin recebe dados apropriados sem fazer queries LN Markets
- **Performance**: Zero queries LN Markets para usuários admin

### Implementação
```typescript
// Frontend - Hook com verificação admin
const fetchData = useCallback(async () => {
  if (isAdmin) {
    console.log('Admin user, skipping LN Markets queries...');
    return;
  }
  // ... queries LN Markets apenas para usuários comuns
}, [isAdmin]);

// Backend - Verificação admin
private async checkIfAdmin(userId: string): Promise<boolean> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { admin_user: true }
  });
  return !!user?.admin_user;
}
```

### Justificativa
- **Separação Clara**: Admin focado em administração, usuário em trading
- **Performance**: Elimina queries desnecessárias para admin
- **Segurança**: Admin não precisa de credenciais LN Markets
- **UX**: Console limpo sem erros para admin

### Consequências
- ✅ Admin funciona perfeitamente sem credenciais LN Markets
- ✅ Performance otimizada (zero queries LN Markets para admin)
- ✅ Console limpo sem erros de "Failed to load monitoring data"
- ✅ Separação clara de responsabilidades
- ⚠️ Desenvolvedores devem lembrar de verificar `isAdmin` em novos hooks
- ⚠️ Backend deve sempre verificar admin antes de queries LN Markets

## ADR-001: Stack Tecnológica Principal

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Definição da stack principal do projeto

### Decisão
- **Backend**: Node.js 18+ com Fastify
- **Frontend**: React 18 com Vite
- **Banco de Dados**: PostgreSQL 15+
- **ORM**: Prisma
- **Cache**: Redis 7+
- **Mensageria**: BullMQ + Redis

### Justificativa
- **Fastify**: Performance superior (<200ms latência), TypeScript first-class, ecossistema rico
- **React + Vite**: HMR extremamente rápido, bundle otimizado, TypeScript nativo
- **PostgreSQL**: ACID compliance para dados financeiros, JSONB para configurações flexíveis
- **Prisma**: TypeScript automático, migrations declarativas, DX excelente
- **Redis + BullMQ**: Performance in-memory, retry logic, rate limiting distribuído

### Consequências
- Desenvolvedores precisam aprender Fastify (mais leve que Express)
- PostgreSQL requer conhecimento de relacionamentos complexos
- Redis adiciona complexidade de infraestrutura

---

## ADR-015: Sistema de Tooltips Configurável

**Data**: 2025-01-18  
**Status**: Aceito  
**Contexto**: Implementação de tooltips configuráveis via painel administrativo

### Decisão
- **Backend**: API REST para gerenciar tooltips e cards do dashboard
- **Banco de Dados**: Tabelas `dashboard_cards` e `tooltip_configs` com relacionamentos
- **Frontend**: Componente Tooltip reutilizável com posicionamento inteligente
- **Arquitetura**: Separação entre dados (cards) e configurações (tooltips)

### Justificativa
- **Flexibilidade**: Tooltips gerenciáveis sem alteração de código
- **Escalabilidade**: Sistema preparado para futuras expansões
- **Usabilidade**: Tooltips explicativos melhoram compreensão do usuário
- **Manutenibilidade**: Configurações centralizadas e versionadas
- **Performance**: Tooltips carregados sob demanda

### Consequências
- Adiciona complexidade ao banco de dados
- Requer interface administrativa para gerenciamento
- Aumenta número de endpoints da API
- Melhora significativamente a experiência do usuário

---

## ADR-016: Modernização Visual com Sistema de Cores Vibrante

**Data**: 2025-01-18  
**Status**: Aceito  
**Contexto**: Atualização do design system para cores mais vibrantes e modernas

### Decisão
- **Paleta de Cores**: Cores vibrantes baseadas no CoinGecko
- **Fonte Mono**: JetBrains Mono para todos os números
- **SatsIcon Proporcional**: Tamanhos automáticos baseados no texto
- **Classes CSS**: Sistema de classes para ícones e textos vibrantes

### Justificativa
- **Modernidade**: Interface mais vibrante e profissional
- **Consistência**: Visual unificado em toda aplicação
- **Legibilidade**: Melhor contraste e tipografia
- **Usabilidade**: Ícones proporcionais e alinhamento perfeito
- **Manutenibilidade**: Classes CSS reutilizáveis

### Consequências
- Requer atualização de todos os componentes existentes
- Aumenta tamanho do CSS bundle
- Melhora significativamente a experiência visual
- Facilita manutenção e expansão futura

---

## ADR-002: Arquitetura de Microserviços

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Estrutura de serviços para automações

### Decisão
- API Gateway (Fastify)
- Core Services (automações, trades, pagamentos)
- Worker Services (monitoramento, notificações)
- Separação clara entre responsabilidades

### Justificativa
- Escalabilidade horizontal
- Isolamento de falhas
- Deploy independente de serviços
- Facilita manutenção e debugging

### Consequências
- Maior complexidade de deploy
- Necessidade de orquestração (Docker Compose/Kubernetes)
- Comunicação entre serviços via APIs/Redis

---

## ADR-003: Autenticação JWT + Refresh Tokens

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Sistema de autenticação seguro

### Decisão
- Access Tokens JWT curtos (15-30 min)
- Refresh Tokens long-lived em HTTP-only cookies
- Social Auth via Passport.js
- Criptografia AES-256 para keys LN Markets

### Justificativa
- Segurança: tokens curtos reduzem janela de ataque
- UX: refresh automático sem re-login
- Flexibilidade: suporte a múltiplos provedores
- Compliance: keys sensíveis criptografadas

### Consequências
- Implementação mais complexa que sessões simples
- Necessidade de gerenciamento de refresh tokens
- Dependência de bibliotecas de criptografia

---

## ADR-004: Integração LN Markets

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Integração com corretora Lightning

### Decisão
- API oficial LN Markets
- Keys criptografadas no banco
- Validação de keys no registro
- Rate limiting e retry logic

### Justificativa
- API oficial garante estabilidade
- Segurança: keys nunca em texto plano
- Confiabilidade: validação prévia evita erros
- Resiliência: retry automático em falhas

### Consequências
- Dependência da API externa
- Necessidade de monitoramento de rate limits
- Complexidade de criptografia/descriptografia

---

## ADR-005: Sistema de Notificações Multi-canal

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Alertas críticos para traders

### Decisão
- Telegram, Email, WhatsApp (EvolutionAPI)
- Configuração por usuário
- Fila assíncrona com BullMQ
- Retry automático em falhas

### Justificativa
- Redundância: múltiplos canais garantem entrega
- Flexibilidade: usuário escolhe canais preferidos
- Performance: processamento assíncrono
- Confiabilidade: retry em falhas temporárias

### Consequências
- Dependência de APIs externas (Telegram, WhatsApp)
- Complexidade de configuração por usuário
- Necessidade de monitoramento de entregas

---

## ADR-006: Pagamentos Lightning Network

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Monetização descentralizada

### Decisão
- Transferência interna LN Markets (preferencial)
- Invoice Lightning externa (fallback)
- Validação automática via webhook/polling
- Reenvio automático em expiração

### Justificativa
- Descentralização: sem KYC, 100% Bitcoin
- UX: transferência interna mais rápida
- Confiabilidade: fallback para invoice externa
- Automação: validação sem intervenção manual

### Consequências
- Dependência de infraestrutura Lightning
- Complexidade de validação de pagamentos
- Necessidade de monitoramento de invoices

---

## ADR-007: Containerização e Deploy

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Deploy em produção

### Decisão
- Docker para containerização
- Docker Compose para desenvolvimento
- Kubernetes + Helm para produção
- Deploy apenas sob comando explícito

### Justificativa
- Consistência: mesmo ambiente dev/prod
- Escalabilidade: Kubernetes para produção
- Segurança: deploy controlado, não automático
- Manutenibilidade: Helm charts para configuração

### Consequências
- Curva de aprendizado para Kubernetes
- Complexidade de configuração inicial
- Necessidade de scripts de deploy customizados

---

## ADR-008: Implementação de Segurança Abrangente

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Implementação de checklist completo de segurança

### Decisão
- **Autenticação**: JWT + Refresh Tokens + 2FA obrigatório para admins
- **Senhas**: Validação robusta + verificação HIBP + bcrypt
- **Proteção**: Rate limiting + CAPTCHA + CSRF + XSS prevention
- **Criptografia**: AES-256 para dados sensíveis + libsodium
- **Monitoramento**: Logs de segurança + alertas de atividades suspeitas
- **Compliance**: GDPR + auditoria + backup criptografado

### Justificativa
- **Segurança**: Proteção contra ataques comuns (XSS, CSRF, SQL injection)
- **Compliance**: Atendimento a regulamentações de proteção de dados
- **Confiabilidade**: Monitoramento proativo de ameaças
- **Auditoria**: Rastreabilidade completa de ações críticas
- **Resiliência**: Backup e recuperação de dados

### Consequências
- Maior complexidade de implementação
- Necessidade de configurações externas (CAPTCHA, SMTP, SSL)
- Dependência de serviços de monitoramento
- Curva de aprendizado para ferramentas de segurança

---

## ADR-009: Validação de Senhas com HIBP

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Prevenção de uso de senhas vazadas

### Decisão
- Integração com Have I Been Pwned (HIBP) via k-Anonymity
- Verificação no cadastro e alteração de senhas
- Bloqueio de senhas comprometidas
- Fallback gracioso se serviço indisponível

### Justificativa
- **Segurança**: Prevenção de uso de senhas vazadas em vazamentos
- **Privacidade**: k-Anonymity protege a senha do usuário
- **UX**: Bloqueio proativo sem exposição da senha
- **Confiabilidade**: Fallback permite funcionamento mesmo com HIBP down

### Consequências
- Dependência de serviço externo (HIBP)
- Latência adicional no cadastro
- Necessidade de tratamento de falhas

---

## ADR-010: Sistema de 2FA com Google Authenticator

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Autenticação de dois fatores para admins

### Decisão
- 2FA obrigatório para usuários admin
- Google Authenticator como app principal
- Backup codes para recuperação
- QR code para configuração inicial

### Justificativa
- **Segurança**: Proteção adicional para contas administrativas
- **Padrão**: Google Authenticator é amplamente adotado
- **Recuperação**: Backup codes evitam lockout
- **UX**: QR code facilita configuração

### Consequências
- Complexidade adicional para admins
- Necessidade de gerenciamento de backup codes
- Dependência de app externo

---

## ADR-011: Rate Limiting e CAPTCHA

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Proteção contra ataques automatizados

### Decisão
- Rate limiting: 5 tentativas/15min login, 3 tentativas/1h registro
- CAPTCHA após 3 falhas de login
- reCAPTCHA v3 como principal, hCaptcha como fallback
- Rate limiting distribuído via Redis

### Justificativa
- **Proteção**: Prevenção de brute force e ataques automatizados
- **UX**: CAPTCHA apenas quando necessário
- **Redundância**: Múltiplos provedores de CAPTCHA
- **Escalabilidade**: Rate limiting distribuído

### Consequências
- Dependência de serviços externos (Google, hCaptcha)
- Complexidade de configuração
- Necessidade de monitoramento de rate limits

---

## ADR-012: Logs de Segurança e Monitoramento

**Data**: 2024-01-XX  
**Status**: Aceito  
**Contexto**: Auditoria e detecção de ameaças

### Decisão
- Logs estruturados de todas as ações críticas
- Alertas automáticos para atividades suspeitas
- Retenção configurável de logs
- Integração com sistemas de monitoramento

### Justificativa
- **Auditoria**: Rastreabilidade completa de ações
- **Detecção**: Identificação proativa de ameaças
- **Compliance**: Atendimento a requisitos regulatórios
- **Investigação**: Suporte a investigações de incidentes

### Consequências
- Volume significativo de logs
- Necessidade de storage e processamento
- Complexidade de análise de alertas

---

## ADR-013: Margin Monitor Worker com Scheduler Periódico

**Data**: 2025-09-08  
**Status**: Aceito  
**Contexto**: Implementação do worker de monitoramento de margem a cada 5 segundos

### Decisão
- Worker BullMQ `margin-check` com prioridade alta
- Scheduler periódico usando `setInterval` a cada 5 segundos
- Cálculo de margin ratio: `maintenance_margin / (margin + pl)`
- Níveis de alerta: safe (≤0.8), warning (>0.8), critical (>0.9)
- Autenticação LN Markets HMAC-SHA256 completa
- Suporte a múltiplos usuários simultaneamente
- Fallback gracioso quando API indisponível

### Justificativa
- **Performance**: BullMQ para processamento assíncrono e rate limiting
- **Precisão**: Cálculo exato conforme especificação técnica
- **Escalabilidade**: Suporte a múltiplos usuários sem degradação
- **Segurança**: Autenticação HMAC-SHA256 oficial da LN Markets
- **Resiliência**: Fallback gracioso evita crashes do sistema
- **Conformidade**: Implementação rigorosa do plano técnico

### Alternativas Consideradas
- **Cron jobs**: Menos preciso para intervalos curtos
- **WebSocket**: Maior complexidade, dependência de conexão persistente
- **Polling simples**: Sem controle de concorrência e rate limiting

### Consequências
- Dependência de Redis para filas BullMQ
- Monitoramento contínuo consome recursos da API
- Necessidade de configuração de rate limiting
- Logs volumosos para múltiplos usuários

---

## ADR-014: Database Schema Cleanup

**Data**: 2025-01-09  
**Status**: Aceito  
**Contexto**: Limpeza de schema Prisma e correção de relacionamentos

### Decisão
- **Relacionamentos**: Usar tabela `UserCoupon` em vez de campo `used_coupon_id`
- **Campos**: Remover campos inexistentes como `ln_markets_passphrase`
- **ENUMs**: Criar todos os tipos ENUM necessários no PostgreSQL
- **Permissões**: Configurar permissões corretas para usuário `hubdefisats`

### Justificativa
- **Problema**: Campos inexistentes causavam erros de validação
- **Relacionamentos**: Tabela de junção é mais flexível e normalizada
- **ENUMs**: Necessários para tipos de dados do Prisma
- **Permissões**: Essenciais para operações do banco

### Implementação
```sql
-- Criar ENUMs
CREATE TYPE "PlanType" AS ENUM ('free', 'basic', 'advanced', 'pro');

-- Configurar permissões
GRANT ALL PRIVILEGES ON SCHEMA public TO hubdefisats;
```

### Consequências
- ✅ **Positivas**: Schema limpo, relacionamentos corretos, permissões adequadas
- ⚠️ **Negativas**: Requer migração de dados existentes
- 🔄 **Reversível**: Sim, com backup

---

## ADR-015: Security Audit - Production Readiness Assessment

**Data**: 2024-12-19  
**Status**: Aceito  
**Contexto**: Auditoria completa de segurança e qualidade para avaliação de prontidão para produção

### Decisão
- **NÃO APROVAR** a versão atual para produção
- **Implementar** correções críticas de segurança antes do deploy
- **Criar** plano de ação estruturado em 3 fases
- **Estabelecer** critérios de aprovação rigorosos

### Justificativa
- **8 Vulnerabilidades Críticas**: Logs de dados sensíveis, armazenamento inseguro, falta de validação
- **Riscos de Segurança**: XSS, SQL Injection, IDOR, CSRF, vazamento de credenciais
- **Falta de Monitoramento**: Sentry configurado mas não implementado
- **Cobertura de Testes**: Apenas 15% (insuficiente para produção)
- **Problemas de Acessibilidade**: Falta de labels ARIA, contraste insuficiente

### Implementação
```markdown
# Plano de Ação Estruturado

## Fase 1: Correções Críticas (1-2 dias)
- Remover logs de dados sensíveis
- Implementar validação de entrada no backend
- Corrigir configuração de CORS
- Implementar headers de segurança
- Implementar armazenamento seguro de credenciais
- Implementar validação de IDOR
- Implementar rate limiting por usuário
- Implementar Sentry

## Fase 2: Melhorias Importantes (3-5 dias)
- Implementar coleta de métricas
- Configurar alertas automáticos
- Implementar testes de segurança
- Melhorar acessibilidade
- Implementar dashboards

## Fase 3: Otimizações (1-2 semanas)
- Implementar otimizações React
- Otimizar queries do banco
- Implementar CI/CD pipeline
- Documentar API
- Implementar testes E2E
```

### Consequências
- ✅ **Positivas**: Sistema seguro e estável para produção
- ⚠️ **Negativas**: Delay no deploy, trabalho adicional necessário
- 🔄 **Reversível**: Não, decisão baseada em auditoria técnica

---

## ADR-016: CI/CD Pipeline Implementation

**Data**: 2025-01-09  
**Status**: Aceito  
**Contexto**: Implementação completa do pipeline de integração contínua para automatizar testes, build e deploy

### Decisão
- **GitHub Actions**: Usar GitHub Actions como plataforma de CI/CD
- **Multi-stage Pipeline**: Pipeline com jobs separados para backend, frontend, build e deploy
- **Testes Automatizados**: Jest para frontend, testes customizados para backend
- **Qualidade de Código**: ESLint + Prettier para ambos os projetos
- **Segurança**: Trivy vulnerability scanner integrado
- **Docker**: Build e teste de imagens Docker para ambos os serviços
- **Deploy Automático**: Deploy automático para staging (develop) e produção (main)

### Justificativa
- **Automatização**: Reduz erros humanos e acelera o processo de desenvolvimento
- **Qualidade**: Garante que código com problemas não seja deployado
- **Segurança**: Identifica vulnerabilidades automaticamente
- **Consistência**: Ambiente de build padronizado e reproduzível
- **Feedback Rápido**: Desenvolvedores recebem feedback imediato sobre problemas

### Implementação
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres: # PostgreSQL para testes
      redis: # Redis para cache e filas
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run database migrations
      - Run tests (unit, security, performance)
  
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run tests with Jest
      - Run linting and type-check
  
  docker-build:
    needs: [backend-tests, frontend-tests]
    steps:
      - Build backend Docker image
      - Build frontend Docker image
  
  security-scan:
    needs: [backend-tests, frontend-tests]
    steps:
      - Run Trivy vulnerability scanner
      - Upload results to GitHub Security tab
  
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [backend-tests, frontend-tests, docker-build, security-scan]
    steps:
      - Deploy to staging environment
  
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [backend-tests, frontend-tests, docker-build, security-scan]
    steps:
      - Deploy to production environment
```

### Consequências
- ✅ **Positivas**: Automação completa, qualidade garantida, deploy confiável
- ⚠️ **Negativas**: Complexidade inicial, dependência de GitHub Actions
- 🔄 **Reversível**: Sim, mas requer migração para outra plataforma
- 📊 **Métricas**: Tempo de build, taxa de sucesso, cobertura de testes

---

## ADR-017: ESLint Warnings Resolution Strategy

**Data**: 2025-01-09  
**Status**: Aceito  
**Contexto**: Resolução sistemática de warnings ESLint para melhorar qualidade do código e reduzir ruído no desenvolvimento

### Decisão
- **Type Safety First**: Priorizar tipagem TypeScript adequada sobre supressão de warnings
- **Specific Types**: Usar tipos específicos (Record<string, unknown>) ao invés de `any`
- **Interface Creation**: Criar interfaces específicas para request/reply handlers
- **Code Cleanup**: Remover código morto e variáveis não utilizadas
- **Error Handling**: Aplicar type guards e assertions para tratamento de erros

### Justificativa
- **Manutenibilidade**: Código mais limpo e fácil de manter
- **Developer Experience**: Menos ruído no desenvolvimento com warnings relevantes
- **Type Safety**: Melhor detecção de erros em tempo de desenvolvimento
- **Code Quality**: Padrões consistentes de codificação em todo o projeto

### Implementação
```typescript
// Antes: any types
const query = request.query as any;
const error: any = e;

// Depois: tipos específicos  
const query = request.query as { type?: string; is_active?: string };
const error = e as Error;

// Interfaces específicas
interface AuthenticatedRequest extends FastifyRequest {
  user: { id: string; email: string };
}

// Type guards para errors
if (error instanceof Error) {
  console.log(error.message);
}
```

### Resultado
- **Redução de Warnings**: De 133 problemas para ~20 warnings não críticos
- **Melhor Tipagem**: Tipos mais específicos em controllers e services
- **Code Cleanup**: Remoção de arquivo simple-server.ts desnecessário
- **Funcionalidade Mantida**: Zero impacto na funcionalidade da aplicação

---

## ADR-018: LN Markets API BaseURL Correction

**Data**: 2025-01-10  
**Status**: Aceito  
**Contexto**: Correção crítica da URL base da API LN Markets que estava causando falhas na autenticação durante o cadastro de usuários

### Decisão
- **BaseURL Corrigida**: Alterado de `https://api.lnmarkets.com` para `https://api.lnmarkets.com/v2`
- **Paths Ajustados**: Removido prefixo `/v2` de todos os endpoints individuais
- **Assinatura HMAC-SHA256**: Corrigido path na assinatura para incluir `/v2` prefixo
- **Compatibilidade Mantida**: Solução retrocompatível com documentação oficial da LN Markets

### Justificativa
- **Problema Crítico**: Falha na validação de credenciais impedia cadastro de usuários
- **Impacto**: Sistema de registro completamente quebrado para usuários reais
- **API Oficial**: Documentação da LN Markets especifica baseURL com `/v2`
- **Segurança**: Assinatura HMAC-SHA256 precisa do path completo para autenticação

### Implementação
```typescript
// Antes (incorreto)
this.client = axios.create({
  baseURL: 'https://api.lnmarkets.com',
});
const response = await this.client.get('/v2/user');

// Depois (correto)
this.client = axios.create({
  baseURL: 'https://api.lnmarkets.com/v2',
});
const response = await this.client.get('/user');

// Assinatura corrigida
const fullPath = path.startsWith('/v2') ? path : `/v2${path}`;
const message = `${timestamp}${method}${fullPath}${paramsStr}`;
```

### Consequências
- ✅ **Positivas**: Cadastro de usuários funcionando 100%, validação de credenciais LN Markets operacional
- ⚠️ **Negativas**: Mudança requer atualização de todos os paths de endpoint
- 🔄 **Reversível**: Sim, mas requer rollback completo da implementação
- 📊 **Métricas**: Taxa de sucesso de registro: 0% → 100%, tempo de resposta da API LN Markets normalizado

---

## ADR-019: Registration Flow Validation and Communication Fix

**Data**: 2025-01-10  
**Status**: Aceito  
**Contexto**: Resolução crítica de múltiplos problemas no fluxo de cadastro que impediam o funcionamento completo do sistema

### Decisão
- **Frontend Payload Cleanup**: Implementada limpeza de campos `undefined` antes do envio
- **Fastify Validation Bypass**: Desabilitada validação automática do Fastify na rota de registro
- **API Base URL Fix**: Corrigida URL base do Axios de `localhost:3000` para `localhost:13010`
- **AuthService Initialization**: Corrigida inicialização passando instância Fastify correta
- **PrismaClient Pattern**: Padronizada inicialização do PrismaClient em todas as rotas
- **Comprehensive Logging**: Implementado logging detalhado para debugging

### Justificativa
- **Problema Crítico**: Múltiplos pontos de falha impediam fluxo completo de cadastro
- **Impacto**: Sistema completamente não funcional para usuários finais
- **Debugging**: Necessidade de logging extensivo para identificar problemas
- **Consistência**: Padronização de inicialização de serviços em todas as rotas
- **Manutenibilidade**: Soluções robustas que previnem problemas similares

### Implementação
```typescript
// Frontend - Payload Cleanup
const cleanData: any = {
  email: data.email,
  username: data.username,
  password: data.password,
  confirmPassword: data.confirmPassword,
  ln_markets_api_key: data.ln_markets_api_key,
  ln_markets_api_secret: data.ln_markets_api_secret,
  ln_markets_passphrase: data.ln_markets_passphrase,
};
if (data.coupon_code && data.coupon_code.trim() !== '') {
  cleanData.coupon_code = data.coupon_code;
}

// Backend - Fastify Route (sem validação automática)
fastify.post('/register', {
  preHandler: [validateRegisterInput], // Só middleware customizado
  schema: { /* sem body validation */ }
}, authController.register);

// Backend - AuthService Initialization
const authService = new AuthService(prisma, request.server);

// Backend - PrismaClient Pattern
export async function automationRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const automationController = new AutomationController(prisma);
}
```

### Consequências
- ✅ **Positivas**: Sistema 100% funcional, fluxo completo de cadastro operacional
- **Manutenção**: Logging extensivo facilita debugging futuro
- **Robustez**: Validação customizada mais flexível que automática do Fastify
- **Consistência**: Padrão uniforme de inicialização de serviços

---

## ADR-020: Admin Dashboard Authentication and Routing System

**Data**: 2025-01-10  
**Status**: Aceito  
**Contexto**: Resolução de problemas críticos de autenticação e roteamento que impediam o funcionamento do dashboard admin

### Decisão
- **User Type Detection**: Implementada detecção de tipo de usuário baseada em email
- **Centralized API Fetch**: Criada função utilitária centralizada para requisições API
- **Token Management Standardization**: Padronizado uso de `access_token` em todo o frontend
- **Intelligent Routing**: Admin redirecionado para `/admin`, usuários comuns para `/dashboard`
- **AdminRoute Protection**: Implementada verificação `user.is_admin` no AdminRoute
- **Vite Proxy Configuration**: Configurado proxy para redirecionar `/api` para backend

### Justificativa
- **Problema Crítico**: Loop infinito de redirecionamento e erro 500 no dashboard admin
- **Solução Escalável**: Função utilitária centralizada facilita manutenção e debugging
- **Segurança**: Verificação de tipo de usuário previne acesso não autorizado
- **UX Melhorada**: Redirecionamento inteligente baseado no tipo de usuário
- **Desenvolvimento**: Proxy do Vite facilita desenvolvimento local

### Consequências
- ✅ **Positivas**: Dashboard admin 100% funcional, sistema de autenticação robusto
- **Manutenção**: Código mais limpo e centralizado para requisições API
- **Escalabilidade**: Fácil adição de novos tipos de usuário e permissões
- **Debugging**: Logs centralizados facilitam identificação de problemas

### Implementação
- **Arquivos**: `frontend/src/lib/fetch.ts`, `frontend/src/stores/auth.ts`, `frontend/src/App.tsx`
- **Commits**: `ba60ee9` - fix: resolve admin dashboard authentication and routing issues
- **Status**: Implementado e testado com sucesso

---

## ADR-021: CoinGecko Inspired Design System Implementation

**Data**: 2025-01-10  
**Status**: Aceito  
**Contexto**: Implementação de um sistema de design completo inspirado no CoinGecko para transmitir confiança e profissionalismo na plataforma financeira

### Decisão
- **Paleta de Cores CoinGecko**: Adotar cores específicas do CoinGecko para identidade visual
  - Primária: `#3773f5` (CoinGecko Blue) para ações principais
  - Secundária: `#f5ac37` (CoinGecko Orange) para badges e alertas
  - Sucesso: `#0ecb81` (CoinGecko Green) para valores positivos
  - Destrutiva: `#f6465d` (CoinGecko Red) para valores negativos
- **Design Tokens Centralizados**: Arquivo `design-tokens.ts` com todos os tokens
- **Sistema de Temas**: Light/Dark mode com CSS variables
- **Tipografia**: Inter (principal) + JetBrains Mono (dados técnicos)
- **Componentes Específicos**: CoinGeckoCard, PriceChange, ThemeContext
- **Documentação Completa**: Guia de estilos e página de demonstração

### Justificativa
- **Confiança**: CoinGecko é referência em plataformas financeiras
- **Consistência**: Paleta de cores semântica para valores financeiros
- **Profissionalismo**: Visual que transmite credibilidade
- **Acessibilidade**: Contraste adequado em ambos os temas
- **Manutenibilidade**: Design tokens centralizados facilitam mudanças
- **Escalabilidade**: Sistema preparado para novos componentes

### Implementação
```typescript
// design-tokens.ts
export const designTokens = {
  colors: {
    primary: '#3773f5',      // CoinGecko Blue
    secondary: '#f5ac37',    // CoinGecko Orange
    success: '#0ecb81',      // CoinGecko Green
    destructive: '#f6465d',  // CoinGecko Red
  },
  // ... outros tokens
};

// Uso em componentes
<PriceChange value={3.2} /> // Verde para positivo
<Button className="bg-primary">Ação Principal</Button>
```

### Consequências
- ✅ **Positivas**: Identidade visual consistente, confiança do usuário, manutenibilidade
- ⚠️ **Negativas**: Dependência de cores específicas, necessidade de documentação
- 🔄 **Reversível**: Sim, mas requer refatoração de todos os componentes
- 📊 **Métricas**: Consistência visual, tempo de desenvolvimento de componentes

---

## ADR-022: Sistema de Simulações em Tempo Real

**Data**: 2025-09-15  
**Status**: Aceito  
**Contexto**: Implementação de sistema completo de simulações para testar automações em cenários controlados

### Decisão
- **4 Cenários Realistas**: Bull, Bear, Sideways, Volatile com algoritmos específicos
- **4 Tipos de Automação**: Margin Guard, Take Profit, Trailing Stop, Auto Entry
- **Interface Visual**: Gráficos interativos com Recharts (preço, P&L, ações)
- **API REST Completa**: CRUD + progresso + métricas + dados históricos
- **Workers Assíncronos**: Simulation Executor com processamento em background
- **Tempo Real**: Progresso ao vivo e métricas atualizadas via WebSocket

### Justificativa
- **Teste Seguro**: Permite testar automações sem risco financeiro
- **Cenários Realistas**: Algoritmos baseados em comportamento real de mercado
- **Feedback Visual**: Interface intuitiva para análise de resultados
- **Escalabilidade**: Suporte a múltiplas simulações simultâneas
- **Dados Históricos**: Análise detalhada de performance

### Implementação
```typescript
// Cenários de simulação
const scenarios = {
  bull: { trend: 0.001, volatility: 0.002 },
  bear: { trend: -0.002, volatility: 0.003 },
  sideways: { trend: 0, volatility: 0.005 },
  volatile: { trend: 0, volatility: 0.01, extremeEvents: true }
};

// Worker de simulação
class SimulationExecutor {
  async executeSimulation(simulationId: string) {
    // Lógica de simulação em tempo real
  }
}
```

### Consequências
- ✅ **Positivas**: Teste seguro de automações, feedback visual rico, dados históricos
- ⚠️ **Negativas**: Complexidade adicional, consumo de recursos
- 🔄 **Reversível**: Sim, mas requer refatoração significativa
- 📊 **Métricas**: Taxa de uso de simulações, feedback dos usuários

---

## ADR-023: Margin Guard 100% Funcional

**Data**: 2025-09-15  
**Status**: Aceito  
**Contexto**: Implementação completa do sistema de proteção automática contra liquidação

### Decisão
- **Monitoramento 24/7**: Worker dedicado verificando a cada 30 segundos
- **Ações Configuráveis**: Close Position, Reduce Position, Add Margin
- **Notificações Integradas**: Email, Telegram, Webhook via sistema unificado
- **Configuração Personalizada**: Thresholds individuais salvos no banco
- **Integração LN Markets**: Credenciais seguras e execução real de trades
- **Logs de Auditoria**: Histórico completo de todas as intervenções

### Justificativa
- **Proteção Crítica**: Evita perdas por liquidação não protegida
- **Automação Real**: Execução automática sem intervenção manual
- **Flexibilidade**: Configuração personalizada por usuário
- **Transparência**: Logs completos para auditoria
- **Confiabilidade**: Integração direta com LN Markets

### Implementação
```typescript
// Worker de monitoramento
class MarginMonitor {
  async checkMargin(userId: string) {
    const marginRatio = maintenanceMargin / (margin + pnl);
    if (marginRatio > 0.9) {
      await this.executeProtection(userId, 'critical');
    }
  }
}
```

### Consequências
- ✅ **Positivas**: Proteção automática, redução de perdas, confiança do usuário
- ⚠️ **Negativas**: Dependência da API LN Markets, complexidade de configuração
- 🔄 **Reversível**: Sim, mas requer desativação gradual
- 📊 **Métricas**: Taxa de sucesso, redução de perdas, satisfação do usuário

---

## ADR-024: Sistema de Internacionalização (i18n) Completo

**Data**: 2025-01-15  
**Status**: Aceito  
**Contexto**: Implementação de sistema completo de internacionalização para suporte a múltiplos idiomas e conversão inteligente de moedas

### Decisão
- **Idiomas Suportados**: Português Brasileiro (PT-BR) e Inglês Americano (EN-US)
- **Detecção Automática**: Baseada no navegador do usuário
- **Persistência**: localStorage para preferências do usuário
- **Conversão de Moedas**: Integração com CoinGecko e ExchangeRate APIs
- **Moedas Suportadas**: BTC, USD, BRL, EUR, sats
- **Cache Inteligente**: 5 minutos de duração com atualização automática
- **Formatação Inteligente**: Hooks customizados para formatação de valores, datas e status

### Justificativa
- **Acessibilidade**: Suporte a usuários de diferentes países
- **Flexibilidade**: Conversão automática entre moedas
- **Performance**: Cache inteligente reduz chamadas de API
- **UX**: Interface adaptada ao idioma do usuário
- **Escalabilidade**: Fácil adição de novos idiomas e moedas

### Implementação
```typescript
// Configuração i18n
const i18n = i18next.createInstance({
  lng: 'pt-BR',
  fallbackLng: 'en-US',
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS }
  }
});

// Hook de conversão de moeda
const { convertCurrency, formatCurrency } = useCurrency();
const usdValue = convertCurrency(100, 'BTC', 'USD');
const formatted = formatCurrency(usdValue, 'USD');
```

### Consequências
- ✅ **Positivas**: Acessibilidade global, UX melhorada, flexibilidade de moedas
- ⚠️ **Negativas**: Dependência de APIs externas, complexidade de manutenção
- 🔄 **Reversível**: Sim, mas requer refatoração de componentes
- 📊 **Métricas**: Taxa de adoção de idiomas, uso de conversão de moedas

---

## ADR-025: Arquitetura de Workers Avançada

**Data**: 2025-01-15  
**Status**: Aceito  
**Contexto**: Implementação de sistema robusto de workers para processamento assíncrono e monitoramento em tempo real

### Decisão
- **Workers Principais**: Margin Monitor, Automation Executor, Simulation Executor, Notification, Payment Validator
- **Tecnologia**: BullMQ + Redis para filas robustas e escaláveis
- **Prioridades**: Critical, High, Normal, Low para diferentes tipos de jobs
- **Retry Logic**: Exponential backoff com máximo de tentativas
- **Dead Letter Queue**: Jobs que falharam definitivamente
- **Monitoring**: Métricas de performance e taxa de sucesso
- **Health Checks**: Verificação de saúde dos workers

### Justificativa
- **Confiabilidade**: Processamento assíncrono garante execução de tarefas críticas
- **Escalabilidade**: Suporte a múltiplos workers e jobs simultâneos
- **Resiliência**: Retry automático e Dead Letter Queue para falhas
- **Monitoramento**: Visibilidade completa do sistema
- **Performance**: Processamento paralelo e otimizado

### Implementação
```typescript
// Worker de monitoramento de margem
class MarginMonitorWorker {
  async process(job: Job) {
    const users = await this.getActiveUsers();
    for (const user of users) {
      const marginRatio = await this.calculateMarginRatio(user);
      if (marginRatio > 0.9) {
        await this.triggerProtection(user);
      }
    }
  }
}

// Configuração de filas
const marginQueue = new Queue('margin-check', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: 'exponential'
  }
});
```

### Consequências
- ✅ **Positivas**: Processamento confiável, escalabilidade, monitoramento
- ⚠️ **Negativas**: Complexidade de configuração, dependência do Redis
- 🔄 **Reversível**: Sim, mas requer migração de jobs
- 📊 **Métricas**: Taxa de sucesso, tempo de processamento, fila de jobs

---

## ADR-026: Sistema de Proxy Reverso Global

**Data**: 2025-01-15  
**Status**: Aceito  
**Contexto**: Implementação de arquitetura de proxy reverso global para gerenciamento centralizado de SSL/TLS e roteamento

### Decisão
- **Proxy Global**: Nginx centralizado para SSL termination e roteamento
- **Rede Compartilhada**: `proxy-network` para comunicação entre projetos
- **SSL/TLS Centralizado**: Gerenciamento unificado de certificados
- **Roteamento Inteligente**: Redirecionamento baseado em domínio
- **Headers de Segurança**: Configuração global de segurança
- **Rate Limiting Global**: Proteção distribuída contra ataques

### Justificativa
- **Segurança**: SSL/TLS centralizado e headers de segurança
- **Escalabilidade**: Suporte a múltiplos projetos e domínios
- **Manutenibilidade**: Configuração centralizada
- **Performance**: Cache e otimizações globais
- **Flexibilidade**: Fácil adição de novos projetos

### Implementação
```nginx
# Configuração do proxy global
server {
    listen 443 ssl;
    server_name defisats.site;
    
    ssl_certificate /etc/nginx/certs/defisats.site.crt;
    ssl_certificate_key /etc/nginx/certs/defisats.site.key;
    
    location / {
        proxy_pass http://hub-defisats-frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://hub-defisats-backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Consequências
- ✅ **Positivas**: Segurança centralizada, escalabilidade, manutenibilidade
- ⚠️ **Negativas**: Ponto único de falha, complexidade de configuração
- 🔄 **Reversível**: Sim, mas requer migração de certificados
- 📊 **Métricas**: Uptime do proxy, latência, taxa de erro

---

## ADR-027: Sistema de Migração para Dados Públicos

**Data**: 2025-01-15  
**Status**: Aceito  
**Contexto**: Migração de componentes que usavam dados autenticados para dados públicos para melhorar performance e UX

### Decisão
- **Endpoint Público**: `/api/market/prices/latest` sem autenticação
- **Fonte de Dados**: CoinGecko API com fallback para dados simulados
- **Cache Inteligente**: Atualização automática a cada 30 segundos
- **Hooks Específicos**: `useLatestPrices`, `useBitcoinPrice`, `useCryptoPrices`
- **Fallback Robusto**: Dados sempre disponíveis mesmo com API down
- **Performance**: Carregamento 3x mais rápido sem overhead de autenticação

### Justificativa
- **Performance**: Dados públicos carregam mais rápido
- **UX**: Interface mais fluida sem esperas de autenticação
- **Confiabilidade**: Fallback garante dados sempre disponíveis
- **Escalabilidade**: Menos carga no sistema de autenticação
- **Flexibilidade**: Dados públicos podem ser usados em qualquer contexto

### Implementação
```typescript
// Hook para dados públicos
const { prices, loading, error } = useLatestPrices({
  symbols: 'BTC,ETH',
  refreshInterval: 30000,
});

// Endpoint público
app.get('/api/market/prices/latest', async (req, res) => {
  try {
    const prices = await coinGeckoService.getPrices(req.query.symbols);
    res.json({ success: true, data: prices });
  } catch (error) {
    const fallbackPrices = await getFallbackPrices();
    res.json({ success: true, data: fallbackPrices });
  }
});
```

### Consequências
- ✅ **Positivas**: Performance melhorada, UX mais fluida, confiabilidade
- ⚠️ **Negativas**: Dependência de APIs externas, cache adicional
- 🔄 **Reversível**: Sim, mas requer refatoração de componentes
- 📊 **Métricas**: Tempo de carregamento, taxa de erro, satisfação do usuário

---

## Resumo das Decisões

### Decisões Críticas
1. **Stack Tecnológica**: Node.js + Fastify + React + PostgreSQL + Redis
2. **Arquitetura**: Microserviços com workers assíncronos
3. **Segurança**: JWT + 2FA + criptografia + rate limiting
4. **Integração**: LN Markets API com autenticação HMAC-SHA256
5. **Design**: Sistema CoinGecko Inspired para confiança

### Decisões de Implementação
1. **Containerização**: Docker + Kubernetes para produção
2. **CI/CD**: GitHub Actions com pipeline automatizado
3. **Monitoramento**: Logs estruturados + métricas + alertas
4. **Testes**: Jest + Cypress com cobertura ≥ 80%
5. **Documentação**: ADRs + OpenAPI + guias técnicos

### Decisões de Produto
1. **Simulações**: Sistema completo para teste seguro
2. **Margin Guard**: Proteção automática contra liquidação
3. **Notificações**: Multi-canal com configuração personalizada
4. **Pagamentos**: Lightning Network para descentralização
5. **Admin**: Dashboard completo para gestão

---

## ADR-024: Sistema de Rate Limiting Dinâmico

**Data**: 2025-01-25  
**Status**: Aceito  
**Contexto**: Implementação de sistema de rate limiting configurável via painel administrativo

### Decisão
Implementar sistema de rate limiting dinâmico que permite configuração em tempo real através do painel administrativo, com detecção automática de ambiente e cache inteligente.

### Implementação
- **DevelopmentRateLimiter**: Sistema de detecção de ambiente robusto
- **RateLimitConfigService**: Gerenciamento de configurações via banco de dados
- **DynamicRateLimiter**: Middleware dinâmico para todas as rotas
- **Configurações por Ambiente**:
  - Development: 50 tentativas de auth por 5 minutos
  - Staging: 20 tentativas de auth por 10 minutos  
  - Production: 5 tentativas de auth por 15 minutos
- **Painel Administrativo**: Interface completa para configuração
- **Cache Inteligente**: TTL de 1 minuto para configurações
- **Detecção de Ambiente**: Múltiplas variáveis (NODE_ENV, ENVIRONMENT, PORT, CORS_ORIGIN)

### Consequências
- ✅ Rate limiting maleável para desenvolvimento
- ✅ Configuração em tempo real sem reinicialização
- ✅ Detecção automática de ambiente
- ✅ Cache otimizado para performance
- ✅ Interface administrativa completa
- ✅ Cobertura completa de testes (28 casos de teste)

---

## ADR-025: Sistema de Cache Redis Estratégico

**Data**: 2025-01-25  
**Status**: Aceito  
**Contexto**: Necessidade de um sistema de cache Redis otimizado e estratégico para melhorar a performance da aplicação, reduzir carga no banco de dados e acelerar respostas da API.

**Decisão**: Implementar um sistema de cache Redis estratégico com múltiplas estratégias de cache baseadas no tipo de dados.

### Componentes Implementados

1. **StrategicCacheService**
   - Múltiplas estratégias de cache por tipo de dados
   - TTL configurável por estratégia
   - Serialização inteligente
   - Fallback automático para banco de dados
   - Métricas de performance completas

2. **CacheManagerService**
   - Gerenciamento específico de dados do sistema
   - Cache de usuários, automações, planos, configurações
   - Invalidação inteligente de cache
   - Health checks e monitoramento

3. **CacheMiddleware**
   - Middleware automático para aplicação de cache
   - Decorators para métodos específicos
   - Headers de cache para debugging
   - Skip automático para operações de escrita

4. **CacheController**
   - API administrativa para gerenciamento de cache
   - Monitoramento de métricas e performance
   - Invalidação manual de cache
   - Health checks do Redis

### Estratégias de Cache Implementadas

1. **User Cache** (TTL: 30min)
   - Dados de usuário com refresh automático
   - Fallback para banco de dados
   - Serialização completa

2. **Market Cache** (TTL: 1min)
   - Dados de mercado com alta frequência
   - Sem fallback para banco
   - Serialização completa

3. **Positions Cache** (TTL: 5min)
   - Posições de trading
   - Fallback para banco de dados
   - Refresh condicional

4. **Config Cache** (TTL: 1h)
   - Configurações do sistema
   - Fallback para banco de dados
   - Baixa frequência de atualização

5. **Rate Limit Cache** (TTL: 1min)
   - Contadores de rate limiting
   - Sem serialização para performance
   - Sem fallback

6. **Session Cache** (TTL: 15min)
   - Dados de sessão
   - Fallback para banco de dados
   - Refresh automático

7. **Historical Cache** (TTL: 2h)
   - Dados históricos de mercado
   - Fallback para banco de dados
   - Baixa frequência

### Métricas e Monitoramento

- **Hit Rate**: Taxa de acertos do cache
- **Miss Rate**: Taxa de falhas do cache
- **Performance**: Tempo de resposta
- **Memory Usage**: Uso de memória Redis
- **Error Tracking**: Rastreamento de erros

**Consequências**:
- ✅ Performance significativamente melhorada
- ✅ Redução de carga no banco de dados
- ✅ Respostas mais rápidas da API
- ✅ Monitoramento completo de performance
- ✅ Invalidação inteligente de cache
- ✅ Fallback seguro para banco de dados
- ✅ Configuração flexível por tipo de dados

---

## ADR-026: Sistema de Load Balancing para Workers

**Data**: 2025-01-25  
**Status**: Aceito  
**Contexto**: Necessidade de um sistema de load balancing para distribuir eficientemente tarefas entre múltiplos workers, garantindo alta disponibilidade e performance otimizada.

**Decisão**: Implementar um sistema completo de load balancing com escalonamento automático e gerenciamento inteligente de workers.

### Componentes Implementados

1. **LoadBalancerService**
   - Escalonamento automático baseado em métricas de CPU e memória
   - Seleção inteligente de workers baseada em scores de carga
   - Health checks automáticos e monitoramento de heartbeat
   - Integração com Redis e BullMQ para gerenciamento de filas
   - Configuração flexível de thresholds e cooldowns

2. **WorkerManagerService**
   - Gerenciamento de ciclo de vida de workers individuais
   - Criação e remoção dinâmica de workers
   - Monitoramento de performance e recursos
   - Heartbeat automático para load balancer
   - Graceful shutdown de workers

3. **LoadBalancerController**
   - API administrativa completa para controle
   - Monitoramento de estatísticas em tempo real
   - Controle manual de escalonamento
   - Health checks e diagnósticos
   - Gerenciamento de workers individuais

### Estratégias de Load Balancing

1. **Seleção por Score de Carga**
   - Cálculo baseado em CPU, memória e jobs ativos
   - Seleção do worker com menor carga
   - Consideração de capacidades e status

2. **Escalonamento Automático**
   - Scale up quando carga > 80%
   - Scale down quando carga < 30%
   - Cooldown de 1 minuto entre escalonamentos
   - Respeito aos limites mínimo (2) e máximo (10)

3. **Prioridades de Fila**
   - margin-check: prioridade 10 (alta)
   - automation-executor: prioridade 8
   - payment-validator: prioridade 7
   - simulation: prioridade 6
   - notification: prioridade 4 (baixa)

### Monitoramento e Health Checks

- **Heartbeat**: A cada 10 segundos
- **Health Check**: A cada 30 segundos
- **Detecção de Workers Stale**: > 1 minuto sem heartbeat
- **Métricas**: CPU, memória, jobs ativos, tempo de resposta

**Consequências**:
- ✅ Distribuição eficiente de carga entre workers
- ✅ Escalonamento automático baseado em demanda
- ✅ Alta disponibilidade e tolerância a falhas
- ✅ Monitoramento completo de performance
- ✅ Controle administrativo em tempo real
- ✅ Otimização automática de recursos
- ✅ Integração seamless com sistema existente

---

**Documento**: Decisões Arquiteturais e Tecnológicas  
**Versão**: 1.6.0  
**Última Atualização**: 2025-01-25  
**Responsável**: Equipe de Desenvolvimento
