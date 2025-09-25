// Test para verificar múltiplas instâncias do Prisma Client
const { PrismaClient } = require('@prisma/client');

async function testMultipleInstances() {
  console.log('🔍 Testando múltiplas instâncias do Prisma Client...');
  
  // Criar primeira instância
  console.log('\n1️⃣ Criando primeira instância...');
  const prisma1 = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  // Criar segunda instância
  console.log('\n2️⃣ Criando segunda instância...');
  const prisma2 = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    // Testar primeira instância
    console.log('\n🧪 Testando primeira instância...');
    const count1 = await prisma1.automation.count();
    console.log('✅ Primeira instância - Automation count:', count1);
    
    // Testar segunda instância
    console.log('\n🧪 Testando segunda instância...');
    const count2 = await prisma2.automation.count();
    console.log('✅ Segunda instância - Automation count:', count2);
    
    // Verificar se são a mesma instância
    console.log('\n🔍 Verificando se são a mesma instância...');
    console.log('prisma1 === prisma2:', prisma1 === prisma2);
    console.log('prisma1._engine === prisma2._engine:', prisma1._engine === prisma2._engine);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    console.log('\n🔌 Fechando conexões...');
    await prisma1.$disconnect();
    await prisma2.$disconnect();
    console.log('✅ Conexões fechadas');
  }
}

testMultipleInstances().catch(console.error);
