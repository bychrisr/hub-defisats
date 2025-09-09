console.log('🧪 Testing server startup...');

try {
  console.log('🔍 Testing imports...');

  // Test basic imports
  const Fastify = require('fastify');
  console.log('✅ Fastify imported successfully');

  const { PrismaClient } = require('@prisma/client');
  console.log('✅ PrismaClient imported successfully');

  console.log('🔍 Testing Prisma client creation...');
  const prisma = new PrismaClient({
    log: ['error'],
  });
  console.log('✅ Prisma client created successfully');

  console.log('🔍 Testing Fastify instance creation...');
  const fastify = Fastify({
    logger: false,
  });
  console.log('✅ Fastify instance created successfully');

  console.log('🏁 Basic server test completed successfully!');
  console.log('🎉 All imports and basic setup working correctly');

} catch (error) {
  console.error('❌ Server test failed:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    code: error.code
  });
}