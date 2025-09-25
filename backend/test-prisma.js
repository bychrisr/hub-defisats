const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('Testing Prisma connection...');
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Basic connection works');
    
    // Test Automation table
    const automationCount = await prisma.automation.count();
    console.log('✅ Automation table accessible, count:', automationCount);
    
    // Test RateLimitConfig table
    const rateLimitCount = await prisma.rateLimitConfig.count();
    console.log('✅ RateLimitConfig table accessible, count:', rateLimitCount);
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
