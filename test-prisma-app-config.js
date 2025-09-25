// Test Prisma com a mesma configuração da aplicação
const { PrismaClient } = require('@prisma/client');

async function testAppConfig() {
  console.log('🔍 Testando Prisma com configuração da aplicação...');
  
  // Simular a configuração da aplicação
  const getConnectionConfig = () => {
    return {
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Connection pool optimization
      __internal: {
        engine: {
          // Connection pool settings - otimizado para performance
          connectionLimit: 15,
          poolTimeout: 30000,
          connectTimeout: 15000,
          // Query optimization
          queryTimeout: 45000,
          // Transaction settings
          transactionOptions: {
            maxWait: 10000,
            timeout: 15000,
          },
          // Performance optimizations
          enableQueryLogging: true,
          enableMetrics: true,
          // Connection health checks
          healthCheckInterval: 30000,
          // Retry configuration
          retryAttempts: 3,
          retryDelay: 1000,
        },
      },
    };
  };
  
  const prisma = new PrismaClient(getConnectionConfig());
  
  try {
    console.log('✅ Prisma Client criado com configuração da aplicação');
    
    // Testar tabela Automation
    console.log('\n🤖 Testando tabela Automation...');
    const automationCount = await prisma.automation.count();
    console.log('✅ Tabela Automation acessível, count:', automationCount);
    
    // Testar tabela RateLimitConfig
    console.log('\n⚡ Testando tabela RateLimitConfig...');
    const rateLimitCount = await prisma.rateLimitConfig.count();
    console.log('✅ Tabela RateLimitConfig acessível, count:', rateLimitCount);
    
  } catch (error) {
    console.error('❌ Erro com configuração da aplicação:', error.message);
    console.error('Código do erro:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testAppConfig().catch(console.error);
