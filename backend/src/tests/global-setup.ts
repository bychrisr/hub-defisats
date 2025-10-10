import { PrismaClient } from '@prisma/client';

async function globalSetup() {
  console.log('🚀 Setting up E2E test environment...');

  const prisma = new PrismaClient();

  try {
    // Ensure database is accessible
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Create test database schema if needed
    await prisma.$runCommandRaw({
      createDatabase: 'axisor_test',
    }).catch(() => {
      // Database might already exist
    });

    // Clean up any leftover test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-e2e',
        },
      },
    });

    await prisma.automation.deleteMany({
      where: {
        user_id: {
          in: [], // Will be populated during tests
        },
      },
    });

    console.log('✅ Test database prepared');

  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;

