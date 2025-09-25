// Debug script para investigar problema do Prisma Client
const { PrismaClient } = require('@prisma/client');

async function debugPrisma() {
  console.log('🔍 Iniciando debug do Prisma Client...');
  
  // Verificar variáveis de ambiente
  console.log('📋 Variáveis de ambiente:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definida' : '❌ Não definida');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'não definido');
  
  // Verificar versões
  console.log('\n📦 Versões:');
  console.log('Node.js:', process.version);
  console.log('Prisma Client:', require('@prisma/client/package.json').version);
  
  // Criar instância do Prisma Client
  console.log('\n🚀 Criando instância do Prisma Client...');
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('✅ Prisma Client criado com sucesso');
    
    // Testar conexão básica
    console.log('\n🔌 Testando conexão básica...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexão básica funcionando');
    
    // Testar tabela Automation
    console.log('\n🤖 Testando tabela Automation...');
    try {
      const automationCount = await prisma.automation.count();
      console.log('✅ Tabela Automation acessível, count:', automationCount);
    } catch (error) {
      console.log('❌ Erro ao acessar tabela Automation:', error.message);
      console.log('Código do erro:', error.code);
    }
    
    // Testar tabela RateLimitConfig
    console.log('\n⚡ Testando tabela RateLimitConfig...');
    try {
      const rateLimitCount = await prisma.rateLimitConfig.count();
      console.log('✅ Tabela RateLimitConfig acessível, count:', rateLimitCount);
    } catch (error) {
      console.log('❌ Erro ao acessar tabela RateLimitConfig:', error.message);
      console.log('Código do erro:', error.code);
    }
    
    // Testar query direta no banco
    console.log('\n🗄️ Testando query direta no banco...');
    try {
      const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Automation'`;
      console.log('✅ Query direta funcionando, resultado:', result);
    } catch (error) {
      console.log('❌ Erro na query direta:', error.message);
    }
    
    // Testar com nome da tabela com aspas
    console.log('\n🔍 Testando com nome da tabela com aspas...');
    try {
      const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Automation"`;
      console.log('✅ Query com aspas funcionando, resultado:', result);
    } catch (error) {
      console.log('❌ Erro na query com aspas:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('\n🔌 Fechando conexão...');
    await prisma.$disconnect();
    console.log('✅ Conexão fechada');
  }
}

debugPrisma().catch(console.error);
