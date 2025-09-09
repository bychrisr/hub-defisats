const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  console.log('🧪 Testing database connection...');

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: 'postgresql://hubdefisats:hubdefisats_dev_password@localhost:5432/hubdefisats?schema=public'
      }
    }
  });

  try {
    console.log('🔍 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');

    console.log('🔍 Testing simple query...');
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query executed successfully:', result);

    console.log('🏁 Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();