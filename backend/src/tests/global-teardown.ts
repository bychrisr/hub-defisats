import { PrismaClient } from '@prisma/client';

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...');

  const prisma = new PrismaClient();

  try {
    // Clean up all test data
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test-e2e' } },
          { email: { contains: 'test-' } },
          { username: { contains: 'test' } },
        ],
      },
    });

    await prisma.automation.deleteMany({
      where: {
        config: {
          path: ['test'],
          equals: true,
        },
      },
    });

    await prisma.tradeLog.deleteMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;

