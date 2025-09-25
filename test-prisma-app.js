// Test Prisma from the application context
const { PrismaClient } = require('@prisma/client');

async function testPrismaApp() {
  // Create a new Prisma client instance like the app does
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('Testing Prisma from app context...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
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

testPrismaApp();
