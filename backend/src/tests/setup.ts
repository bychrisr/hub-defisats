import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

// Global test setup
let prisma: PrismaClient;
let app: FastifyInstance;

beforeAll(async () => {
  // Initialize Prisma for testing
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:15432/hub_defisats_test'
      }
    }
  });

  // Initialize Fastify app for testing
  // Note: App initialization will be done in individual tests
  app = null as any;
});

afterAll(async () => {
  // Cleanup
  if (prisma) {
    await prisma.$disconnect();
  }
  if (app) {
    await app.close();
  }
});

// Export for use in tests
export { prisma, app };
