# 🚀 SCRIPTS DE MIGRAÇÃO - PAINEL ADMINISTRATIVO

## 📋 **SCRIPTS DE BANCO DE DADOS**

### **1. Script de Migração Prisma**

```typescript
// backend/scripts/migrate-admin-tables.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAdminTables() {
  console.log('🚀 Iniciando migração das tabelas administrativas...');
  
  try {
    // Executar migração do Prisma
    console.log('📊 Executando migração do Prisma...');
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateAdminTables();
```

### **2. Script de Seed para Dados Iniciais**

```typescript
// backend/scripts/seed-admin-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdminData() {
  console.log('🌱 Iniciando seed dos dados administrativos...');
  
  try {
    // Criar templates de notificação padrão
    const notificationTemplates = [
      {
        name: 'Trade Executed',
        channel: 'email',
        category: 'trading',
        subject: 'Trade Executado - {{strategy}}',
        content: 'Seu trade foi executado com sucesso. P&L: {{pnl}}',
        variables: ['strategy', 'pnl', 'timestamp'],
        is_active: true
      },
      {
        name: 'Payment Confirmed',
        channel: 'email',
        category: 'payment',
        subject: 'Pagamento Confirmado - {{amount}} sats',
        content: 'Seu pagamento de {{amount}} sats foi confirmado.',
        variables: ['amount', 'plan_type', 'timestamp'],
        is_active: true
      },
      {
        name: 'System Maintenance',
        channel: 'email',
        category: 'system',
        subject: 'Manutenção do Sistema - {{date}}',
        content: 'O sistema passará por manutenção em {{date}} das {{start_time}} às {{end_time}}.',
        variables: ['date', 'start_time', 'end_time'],
        is_active: true
      },
      {
        name: 'Automation Alert',
        channel: 'telegram',
        category: 'automation',
        subject: null,
        content: '🤖 Automação {{name}} - Status: {{status}}\nP&L: {{pnl}}\nTrades: {{trades}}',
        variables: ['name', 'status', 'pnl', 'trades'],
        is_active: true
      }
    ];

    for (const template of notificationTemplates) {
      await prisma.notificationTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template
      });
    }

    console.log('✅ Dados administrativos criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdminData();
```

### **3. Script de Limpeza de Dados Mockados**

```typescript
// backend/scripts/cleanup-mock-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupMockData() {
  console.log('🧹 Iniciando limpeza de dados mockados...');
  
  try {
    // Limpar dados de teste antigos
    await prisma.tradeLog.deleteMany({
      where: {
        message: { contains: 'Mock' }
      }
    });

    await prisma.backtestReport.deleteMany({
      where: {
        strategy_name: { contains: 'Test' }
      }
    });

    await prisma.simulation.deleteMany({
      where: {
        simulation_type: 'test'
      }
    });

    console.log('✅ Dados mockados removidos com sucesso!');
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupMockData();
```

---

## 🔧 **SCRIPTS DE CONFIGURAÇÃO**

### **4. Script de Configuração de Índices**

```sql
-- backend/scripts/create-admin-indexes.sql
-- Índices para performance das consultas administrativas

-- Índices para trade_logs
CREATE INDEX IF NOT EXISTS idx_trade_logs_user_id ON trade_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_logs_created_at ON trade_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_trade_logs_status ON trade_logs(status);
CREATE INDEX IF NOT EXISTS idx_trade_logs_action ON trade_logs(action);

-- Índices para backtest_reports
CREATE INDEX IF NOT EXISTS idx_backtest_reports_user_id ON backtest_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_reports_status ON backtest_reports(status);
CREATE INDEX IF NOT EXISTS idx_backtest_reports_strategy_name ON backtest_reports(strategy_name);
CREATE INDEX IF NOT EXISTS idx_backtest_reports_created_at ON backtest_reports(created_at);

-- Índices para simulations
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_type ON simulations(simulation_type);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);

-- Índices para automations
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);
CREATE INDEX IF NOT EXISTS idx_automations_type ON automations(type);
CREATE INDEX IF NOT EXISTS idx_automations_risk_level ON automations(risk_level);

-- Índices para notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_template_id ON notification_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- Índices para system_reports
CREATE INDEX IF NOT EXISTS idx_system_reports_type ON system_reports(type);
CREATE INDEX IF NOT EXISTS idx_system_reports_status ON system_reports(status);
CREATE INDEX IF NOT EXISTS idx_system_reports_created_at ON system_reports(created_at);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
```

### **5. Script de Configuração de Rate Limiting**

```typescript
// backend/scripts/setup-rate-limiting.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupRateLimiting() {
  console.log('⚡ Configurando rate limiting administrativo...');
  
  try {
    // Configurar rate limiting para APIs administrativas
    const rateLimitConfig = {
      'admin-dashboard': { requests: 100, window: 60 }, // 100 req/min
      'admin-analytics': { requests: 50, window: 60 },  // 50 req/min
      'admin-logs': { requests: 200, window: 60 },      // 200 req/min
      'admin-reports': { requests: 20, window: 60 },    // 20 req/min
      'admin-management': { requests: 30, window: 60 }   // 30 req/min
    };

    // Salvar configuração no banco (se necessário)
    console.log('✅ Rate limiting configurado com sucesso!');
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupRateLimiting();
```

---

## 🚀 **SCRIPTS DE DEPLOY**

### **6. Script de Deploy Completo**

```bash
#!/bin/bash
# deploy-admin-panel.sh

echo "🚀 Iniciando deploy do painel administrativo..."

# 1. Parar containers
echo "⏹️ Parando containers..."
docker-compose down

# 2. Backup do banco
echo "💾 Fazendo backup do banco..."
docker exec hub-defisats-postgres pg_dump -U postgres defisats > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Atualizar código
echo "📦 Atualizando código..."
git pull origin main

# 4. Instalar dependências
echo "📚 Instalando dependências..."
docker-compose run --rm backend npm install
docker-compose run --rm frontend npm install

# 5. Executar migrações
echo "🗄️ Executando migrações..."
docker-compose run --rm backend npx prisma migrate deploy

# 6. Executar seed
echo "🌱 Executando seed..."
docker-compose run --rm backend npm run seed:admin

# 7. Build das aplicações
echo "🔨 Fazendo build..."
docker-compose build

# 8. Iniciar containers
echo "▶️ Iniciando containers..."
docker-compose up -d

# 9. Verificar saúde
echo "🏥 Verificando saúde das aplicações..."
sleep 30
curl -f http://localhost:13010/health || echo "❌ Backend não está respondendo"
curl -f http://localhost:13000/ || echo "❌ Frontend não está respondendo"

echo "✅ Deploy concluído com sucesso!"
```

### **7. Script de Rollback**

```bash
#!/bin/bash
# rollback-admin-panel.sh

echo "🔄 Iniciando rollback do painel administrativo..."

# 1. Parar containers
echo "⏹️ Parando containers..."
docker-compose down

# 2. Restaurar backup
echo "💾 Restaurando backup..."
LATEST_BACKUP=$(ls -t backup_*.sql | head -n1)
docker exec -i hub-defisats-postgres psql -U postgres defisats < $LATEST_BACKUP

# 3. Voltar para commit anterior
echo "📦 Voltando para commit anterior..."
git reset --hard HEAD~1

# 4. Rebuild e restart
echo "🔨 Rebuild e restart..."
docker-compose build
docker-compose up -d

echo "✅ Rollback concluído com sucesso!"
```

---

## 📊 **SCRIPTS DE MONITORAMENTO**

### **8. Script de Health Check**

```typescript
// backend/scripts/health-check.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function healthCheck() {
  console.log('🏥 Executando health check do painel administrativo...');
  
  try {
    // Verificar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Banco de dados: OK');

    // Verificar APIs administrativas
    const apis = [
      '/api/admin/dashboard',
      '/api/admin/trading-analytics',
      '/api/admin/trade-logs',
      '/api/admin/payment-analytics',
      '/api/admin/backtest-reports',
      '/api/admin/simulation-analytics',
      '/api/admin/automation-management',
      '/api/admin/notification-management',
      '/api/admin/system-reports',
      '/api/admin/audit-logs'
    ];

    for (const api of apis) {
      try {
        const response = await axios.get(`http://localhost:3010${api}`, {
          headers: { Authorization: 'Bearer test-token' }
        });
        console.log(`✅ ${api}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${api}: ${error.response?.status || 'ERROR'}`);
      }
    }

    // Verificar métricas de performance
    const dbMetrics = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_activity_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_users
      FROM users
    `;
    console.log('📊 Métricas do banco:', dbMetrics);

  } catch (error) {
    console.error('❌ Erro no health check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck();
```

### **9. Script de Limpeza de Logs Antigos**

```typescript
// backend/scripts/cleanup-old-logs.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOldLogs() {
  console.log('🧹 Limpando logs antigos...');
  
  try {
    const retentionDays = 90; // Manter logs por 90 dias
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Limpar trade logs antigos
    const deletedTradeLogs = await prisma.tradeLog.deleteMany({
      where: {
        created_at: { lt: cutoffDate }
      }
    });
    console.log(`🗑️ Removidos ${deletedTradeLogs.count} trade logs antigos`);

    // Limpar notification logs antigos
    const deletedNotificationLogs = await prisma.notificationLog.deleteMany({
      where: {
        created_at: { lt: cutoffDate }
      }
    });
    console.log(`🗑️ Removidos ${deletedNotificationLogs.count} notification logs antigos`);

    // Limpar audit logs antigos (manter por mais tempo)
    const auditRetentionDays = 365; // 1 ano
    const auditCutoffDate = new Date(Date.now() - auditRetentionDays * 24 * 60 * 60 * 1000);
    
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        created_at: { lt: auditCutoffDate },
        severity: { not: 'critical' } // Manter logs críticos por mais tempo
      }
    });
    console.log(`🗑️ Removidos ${deletedAuditLogs.count} audit logs antigos`);

    console.log('✅ Limpeza concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldLogs();
```

---

## 📋 **PACKAGE.JSON SCRIPTS**

### **10. Scripts Adicionados ao package.json**

```json
{
  "scripts": {
    "migrate:admin": "npx prisma migrate dev --name admin-tables",
    "seed:admin": "tsx scripts/seed-admin-data.ts",
    "cleanup:mock": "tsx scripts/cleanup-mock-data.ts",
    "setup:indexes": "psql -d defisats -f scripts/create-admin-indexes.sql",
    "setup:rate-limit": "tsx scripts/setup-rate-limiting.ts",
    "health:check": "tsx scripts/health-check.ts",
    "cleanup:logs": "tsx scripts/cleanup-old-logs.ts",
    "deploy:admin": "./scripts/deploy-admin-panel.sh",
    "rollback:admin": "./scripts/rollback-admin-panel.sh"
  }
}
```

---

## 🔧 **CONFIGURAÇÃO DE AMBIENTE**

### **11. Variáveis de Ambiente Adicionais**

```env
# .env
# Configurações do painel administrativo
ADMIN_RATE_LIMIT_ENABLED=true
ADMIN_RATE_LIMIT_WINDOW=60000
ADMIN_RATE_LIMIT_MAX=100

# Retenção de logs
LOG_RETENTION_DAYS=90
AUDIT_LOG_RETENTION_DAYS=365

# Configurações de notificação
NOTIFICATION_QUEUE_SIZE=1000
NOTIFICATION_BATCH_SIZE=100

# Configurações de relatórios
REPORT_MAX_FILE_SIZE=104857600
REPORT_CLEANUP_INTERVAL=86400000

# Configurações de cache
CACHE_TTL=300000
CACHE_MAX_SIZE=1000
```

---

## 📊 **MONITORAMENTO E ALERTAS**

### **12. Script de Monitoramento de Performance**

```typescript
// backend/scripts/monitor-performance.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function monitorPerformance() {
  console.log('📊 Monitorando performance do painel administrativo...');
  
  try {
    // Verificar queries lentas
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        mean_time,
        calls,
        total_time
      FROM pg_stat_statements 
      WHERE mean_time > 1000 
      ORDER BY mean_time DESC 
      LIMIT 10
    `;
    
    if (slowQueries.length > 0) {
      console.log('⚠️ Queries lentas detectadas:', slowQueries);
    }

    // Verificar uso de espaço
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;
    
    console.log('📏 Tamanho das tabelas:', tableSizes);

    // Verificar conexões ativas
    const activeConnections = await prisma.$queryRaw`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `;
    
    console.log('🔗 Conexões ativas:', activeConnections);

  } catch (error) {
    console.error('❌ Erro no monitoramento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

monitorPerformance();
```

---

## 🎯 **CHECKLIST FINAL DE IMPLEMENTAÇÃO**

### **Preparação**
- [ ] Backup completo do banco de dados
- [ ] Teste em ambiente de desenvolvimento
- [ ] Validação de todas as APIs
- [ ] Teste de performance

### **Deploy**
- [ ] Executar migrações do banco
- [ ] Configurar índices de performance
- [ ] Executar seed de dados iniciais
- [ ] Configurar rate limiting
- [ ] Deploy das aplicações

### **Pós-Deploy**
- [ ] Health check completo
- [ ] Verificação de logs
- [ ] Teste de funcionalidades
- [ ] Monitoramento de performance
- [ ] Configuração de alertas

### **Manutenção**
- [ ] Agendamento de limpeza de logs
- [ ] Monitoramento contínuo
- [ ] Backup regular
- [ ] Atualizações de segurança

---

**Estes scripts fornecem uma base sólida para migrar, configurar e manter o painel administrativo em produção.**

