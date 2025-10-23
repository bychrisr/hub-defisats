import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Cleanup Unverified Accounts Worker
 * Remove contas não verificadas após 7 dias
 * 
 * Executar diariamente via cron ou BullMQ
 */

const prisma = new PrismaClient();

export async function cleanupUnverifiedAccounts() {
  try {
    logger.info('🧹 Starting cleanup of unverified accounts...');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Buscar contas não verificadas criadas há mais de 7 dias
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        email_verified: false,
        account_status: 'pending_verification',
        created_at: {
          lte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        email: true,
        created_at: true,
      },
    });

    logger.info(`📊 Found ${unverifiedUsers.length} unverified accounts to delete`);

    if (unverifiedUsers.length === 0) {
      logger.info('✅ No unverified accounts to cleanup');
      return { deleted: 0 };
    }

    // Deletar contas (cascade vai deletar dados relacionados)
    const userIds = unverifiedUsers.map(u => u.id);
    
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });

    // Log de cada conta deletada
    for (const user of unverifiedUsers) {
      logger.info(`🗑️  Deleted unverified account: ${user.email} (created ${user.created_at})`);
    }

    logger.info(`✅ Cleanup complete: ${result.count} accounts deleted`);

    return {
      deleted: result.count,
      accounts: unverifiedUsers.map(u => ({
        email: u.email,
        createdAt: u.created_at,
      })),
    };
  } catch (error) {
    logger.error('❌ Error cleaning up unverified accounts:', error);
    throw error;
  }
}

/**
 * Cleanup de blacklist expirada
 */
export async function cleanupExpiredBlacklist() {
  try {
    logger.info('🧹 Starting cleanup of expired blacklist entries...');

    const result = await prisma.blacklist.deleteMany({
      where: {
        expires_at: {
          lte: new Date(),
        },
      },
    });

    logger.info(`✅ Cleanup complete: ${result.count} blacklist entries removed`);

    return { deleted: result.count };
  } catch (error) {
    logger.error('❌ Error cleaning up blacklist:', error);
    throw error;
  }
}

/**
 * Cleanup de registration progress expirado
 */
export async function cleanupExpiredRegistrationProgress() {
  try {
    logger.info('🧹 Starting cleanup of expired registration progress...');

    const result = await prisma.registrationProgress.deleteMany({
      where: {
        expires_at: {
          lte: new Date(),
        },
      },
    });

    logger.info(`✅ Cleanup complete: ${result.count} registration progress entries removed`);

    return { deleted: result.count };
  } catch (error) {
    logger.error('❌ Error cleaning up registration progress:', error);
    throw error;
  }
}

/**
 * Executa todas as tarefas de limpeza
 */
export async function runAllCleanupTasks() {
  logger.info('🚀 Starting all cleanup tasks...');

  const results = await Promise.allSettled([
    cleanupUnverifiedAccounts(),
    cleanupExpiredBlacklist(),
    cleanupExpiredRegistrationProgress(),
  ]);

  const stats = {
    unverifiedAccounts: results[0].status === 'fulfilled' ? results[0].value.deleted : 0,
    blacklistEntries: results[1].status === 'fulfilled' ? results[1].value.deleted : 0,
    registrationProgress: results[2].status === 'fulfilled' ? results[2].value.deleted : 0,
  };

  logger.info('✅ All cleanup tasks completed:', stats);

  return stats;
}

// Se executado diretamente
if (require.main === module) {
  runAllCleanupTasks()
    .then(() => {
      logger.info('✅ Cleanup worker finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Cleanup worker failed:', error);
      process.exit(1);
    });
}


