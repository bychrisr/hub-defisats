import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Connection pool configuration based on environment
const getConnectionConfig = () => {
  return {
    log: config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool optimization
    __internal: {
      engine: {
        // Connection pool settings - otimizado para performance
        connectionLimit: config.isProduction ? 30 : 15,
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
        enableQueryLogging: config.isDevelopment,
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

export const prisma = globalForPrisma.prisma ?? new PrismaClient(getConnectionConfig());

// Graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Connection pool monitoring
export const getConnectionPoolStatus = async () => {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        state,
        COUNT(*) as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    `;
    return result;
  } catch (error) {
    console.error('Failed to get connection pool status:', error);
    return null;
  }
};
