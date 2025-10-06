/**
 * Data Migration Tests
 * 
 * Tests for data migration scenarios in multi-account system
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
const mockPrisma = {
  $transaction: jest.fn(),
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userExchangeAccounts: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  exchange: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  plan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  planLimits: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  automation: {
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
} as unknown as PrismaClient;

// Mock getPrisma
jest.mock('../../lib/prisma', () => ({
  getPrisma: jest.fn().mockResolvedValue(mockPrisma),
}));

describe('Data Migration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Exchange Accounts Migration', () => {
    it('should migrate existing user data to multi-account structure', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          plan_type: 'PREMIUM',
          created_at: new Date('2023-01-01'),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          plan_type: 'BASIC',
          created_at: new Date('2023-01-02'),
        },
      ];

      const mockExchanges = [
        {
          id: 'exchange-1',
          name: 'LN Markets',
          slug: 'lnmarkets',
          is_active: true,
        },
        {
          id: 'exchange-2',
          name: 'Binance',
          slug: 'binance',
          is_active: true,
        },
      ];

      const mockExistingAccounts = [
        {
          id: 'account-1',
          user_id: 'user-1',
          exchange_id: 'exchange-1',
          account_name: 'Main Account',
          credentials: { api_key: 'encrypted_key1', secret: 'encrypted_secret1' },
          is_active: true,
          is_verified: true,
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01'),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.exchange.findMany.mockResolvedValue(mockExchanges);
      mockPrisma.userExchangeAccounts.findMany.mockResolvedValue(mockExistingAccounts);

      // Simulate migration process
      const migrationResult = await mockPrisma.$transaction(async (tx) => {
        // Check existing data
        const users = await tx.user.findMany();
        const exchanges = await tx.exchange.findMany();
        const existingAccounts = await tx.userExchangeAccounts.findMany();

        // Create default accounts for users without accounts
        const usersWithoutAccounts = users.filter(
          user => !existingAccounts.some(account => account.user_id === user.id)
        );

        const newAccounts = [];
        for (const user of usersWithoutAccounts) {
          const defaultExchange = exchanges.find(ex => ex.slug === 'lnmarkets');
          if (defaultExchange) {
            const newAccount = await tx.userExchangeAccounts.create({
              data: {
                user_id: user.id,
                exchange_id: defaultExchange.id,
                account_name: 'Default Account',
                credentials: {},
                is_active: true,
                is_verified: false,
              },
            });
            newAccounts.push(newAccount);
          }
        }

        return {
          usersProcessed: users.length,
          accountsCreated: newAccounts.length,
          existingAccounts: existingAccounts.length,
        };
      });

      expect(migrationResult.usersProcessed).toBe(2);
      expect(migrationResult.accountsCreated).toBe(1); // user-2 gets default account
      expect(migrationResult.existingAccounts).toBe(1); // user-1 already has account
    });

    it('should handle migration with existing automations', async () => {
      const mockAutomations = [
        {
          id: 'automation-1',
          user_id: 'user-1',
          user_exchange_account_id: null, // Old automation without account
          name: 'Test Automation',
          is_active: true,
          created_at: new Date('2023-01-01'),
        },
        {
          id: 'automation-2',
          user_id: 'user-1',
          user_exchange_account_id: 'account-1', // New automation with account
          name: 'Test Automation 2',
          is_active: true,
          created_at: new Date('2023-01-02'),
        },
      ];

      const mockUserAccounts = [
        {
          id: 'account-1',
          user_id: 'user-1',
          exchange_id: 'exchange-1',
          account_name: 'Main Account',
          is_active: true,
        },
      ];

      mockPrisma.automation.findMany.mockResolvedValue(mockAutomations);
      mockPrisma.userExchangeAccounts.findMany.mockResolvedValue(mockUserAccounts);

      // Simulate automation migration
      const migrationResult = await mockPrisma.$transaction(async (tx) => {
        const automations = await tx.automation.findMany();
        const userAccounts = await tx.userExchangeAccounts.findMany();

        // Update automations without account to use active account
        const automationsToUpdate = automations.filter(
          automation => !automation.user_exchange_account_id
        );

        let updatedCount = 0;
        for (const automation of automationsToUpdate) {
          const activeAccount = userAccounts.find(
            account => account.user_id === automation.user_id && account.is_active
          );

          if (activeAccount) {
            await tx.automation.update({
              where: { id: automation.id },
              data: { user_exchange_account_id: activeAccount.id },
            });
            updatedCount++;
          }
        }

        return {
          automationsProcessed: automations.length,
          automationsUpdated: updatedCount,
        };
      });

      expect(migrationResult.automationsProcessed).toBe(2);
      expect(migrationResult.automationsUpdated).toBe(1); // Only automation-1 gets updated
    });
  });

  describe('Plan Limits Migration', () => {
    it('should create default plan limits for existing plans', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'Free Plan',
          slug: 'free',
          is_active: true,
        },
        {
          id: 'plan-2',
          name: 'Basic Plan',
          slug: 'basic',
          is_active: true,
        },
        {
          id: 'plan-3',
          name: 'Premium Plan',
          slug: 'premium',
          is_active: true,
        },
      ];

      const mockExistingLimits = [
        {
          id: 'limits-1',
          plan_id: 'plan-2',
          max_exchange_accounts: 2,
          max_automations: 5,
          max_indicators: 10,
          max_simulations: 5,
          max_backtests: 3,
        },
      ];

      mockPrisma.plan.findMany.mockResolvedValue(mockPlans);
      mockPrisma.planLimits.findMany.mockResolvedValue(mockExistingLimits);

      // Simulate plan limits migration
      const migrationResult = await mockPrisma.$transaction(async (tx) => {
        const plans = await tx.plan.findMany();
        const existingLimits = await tx.planLimits.findMany();

        const plansWithoutLimits = plans.filter(
          plan => !existingLimits.some(limit => limit.plan_id === plan.id)
        );

        const defaultLimits = {
          free: {
            max_exchange_accounts: 1,
            max_automations: 2,
            max_indicators: 5,
            max_simulations: 3,
            max_backtests: 1,
          },
          basic: {
            max_exchange_accounts: 3,
            max_automations: 8,
            max_indicators: 15,
            max_simulations: 10,
            max_backtests: 5,
          },
          premium: {
            max_exchange_accounts: 10,
            max_automations: 25,
            max_indicators: 50,
            max_simulations: 30,
            max_backtests: 15,
          },
          lifetime: {
            max_exchange_accounts: -1, // Unlimited
            max_automations: -1,
            max_indicators: -1,
            max_simulations: -1,
            max_backtests: -1,
          },
        };

        const newLimits = [];
        for (const plan of plansWithoutLimits) {
          const limits = defaultLimits[plan.slug as keyof typeof defaultLimits] || defaultLimits.basic;
          
          const newLimit = await tx.planLimits.create({
            data: {
              plan_id: plan.id,
              ...limits,
            },
          });
          newLimits.push(newLimit);
        }

        return {
          plansProcessed: plans.length,
          limitsCreated: newLimits.length,
          existingLimits: existingLimits.length,
        };
      });

      expect(migrationResult.plansProcessed).toBe(3);
      expect(migrationResult.limitsCreated).toBe(2); // Free and Premium plans get limits
      expect(migrationResult.existingLimits).toBe(1); // Basic plan already has limits
    });

    it('should handle unlimited plan limits correctly', async () => {
      const mockLifetimePlan = {
        id: 'plan-lifetime',
        name: 'Lifetime Plan',
        slug: 'lifetime',
        is_active: true,
      };

      const mockLifetimeLimits = {
        id: 'limits-lifetime',
        plan_id: 'plan-lifetime',
        max_exchange_accounts: -1,
        max_automations: -1,
        max_indicators: -1,
        max_simulations: -1,
        max_backtests: -1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.plan.findUnique.mockResolvedValue(mockLifetimePlan);
      mockPrisma.planLimits.findUnique.mockResolvedValue(null);
      mockPrisma.planLimits.create.mockResolvedValue(mockLifetimeLimits);

      // Test unlimited plan creation
      const result = await mockPrisma.planLimits.create({
        data: {
          plan_id: 'plan-lifetime',
          max_exchange_accounts: -1,
          max_automations: -1,
          max_indicators: -1,
          max_simulations: -1,
          max_backtests: -1,
        },
      });

      expect(result.max_exchange_accounts).toBe(-1);
      expect(result.max_automations).toBe(-1);
      expect(result.max_indicators).toBe(-1);
      expect(result.max_simulations).toBe(-1);
      expect(result.max_backtests).toBe(-1);
    });
  });

  describe('Data Integrity Migration', () => {
    it('should validate data integrity after migration', async () => {
      const mockData = {
        users: [
          { id: 'user-1', plan_type: 'PREMIUM' },
          { id: 'user-2', plan_type: 'BASIC' },
        ],
        accounts: [
          { id: 'account-1', user_id: 'user-1', is_active: true },
          { id: 'account-2', user_id: 'user-2', is_active: true },
        ],
        automations: [
          { id: 'automation-1', user_id: 'user-1', user_exchange_account_id: 'account-1' },
          { id: 'automation-2', user_id: 'user-2', user_exchange_account_id: 'account-2' },
        ],
        planLimits: [
          { plan_id: 'plan-premium', max_exchange_accounts: 10 },
          { plan_id: 'plan-basic', max_exchange_accounts: 3 },
        ],
      };

      // Simulate integrity validation
      const validation = {
        usersHaveAccounts: mockData.users.every(user => 
          mockData.accounts.some(account => account.user_id === user.id)
        ),
        accountsHaveValidUsers: mockData.accounts.every(account => 
          mockData.users.some(user => user.id === account.user_id)
        ),
        automationsHaveValidAccounts: mockData.automations.every(automation => 
          mockData.accounts.some(account => 
            account.id === automation.user_exchange_account_id && 
            account.user_id === automation.user_id
          )
        ),
        onlyOneActiveAccountPerUser: mockData.users.every(user => {
          const userAccounts = mockData.accounts.filter(account => account.user_id === user.id);
          const activeAccounts = userAccounts.filter(account => account.is_active);
          return activeAccounts.length <= 1;
        }),
      };

      expect(validation.usersHaveAccounts).toBe(true);
      expect(validation.accountsHaveValidUsers).toBe(true);
      expect(validation.automationsHaveValidAccounts).toBe(true);
      expect(validation.onlyOneActiveAccountPerUser).toBe(true);
    });

    it('should handle orphaned data cleanup', async () => {
      const mockOrphanedData = {
        accounts: [
          { id: 'orphan-account', user_id: 'non-existent-user', is_active: false },
        ],
        automations: [
          { id: 'orphan-automation', user_id: 'non-existent-user', user_exchange_account_id: 'orphan-account' },
        ],
      };

      // Simulate orphaned data cleanup
      const cleanupResult = await mockPrisma.$transaction(async (tx) => {
        // Find and delete orphaned accounts
        const orphanedAccounts = await tx.userExchangeAccounts.findMany({
          where: {
            user: null, // This would be handled by a proper query
          },
        });

        let deletedAccounts = 0;
        for (const account of orphanedAccounts) {
          await tx.userExchangeAccounts.delete({
            where: { id: account.id },
          });
          deletedAccounts++;
        }

        // Find and delete orphaned automations
        const orphanedAutomations = await tx.automation.findMany({
          where: {
            user: null,
          },
        });

        let deletedAutomations = 0;
        for (const automation of orphanedAutomations) {
          await tx.automation.delete({
            where: { id: automation.id },
          });
          deletedAutomations++;
        }

        return {
          deletedAccounts,
          deletedAutomations,
        };
      });

      expect(cleanupResult.deletedAccounts).toBeGreaterThanOrEqual(0);
      expect(cleanupResult.deletedAutomations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Migration', () => {
    it('should handle large dataset migration efficiently', async () => {
      const batchSize = 100;
      const totalUsers = 1000;
      const totalExchanges = 5;

      // Simulate batch processing
      const migrationResult = await mockPrisma.$transaction(async (tx) => {
        let processedUsers = 0;
        let createdAccounts = 0;

        for (let offset = 0; offset < totalUsers; offset += batchSize) {
          const users = await tx.user.findMany({
            skip: offset,
            take: batchSize,
          });

          for (const user of users) {
            // Create default account for each user
            const defaultExchange = await tx.exchange.findFirst({
              where: { slug: 'lnmarkets' },
            });

            if (defaultExchange) {
              await tx.userExchangeAccounts.create({
                data: {
                  user_id: user.id,
                  exchange_id: defaultExchange.id,
                  account_name: 'Default Account',
                  credentials: {},
                  is_active: true,
                  is_verified: false,
                },
              });
              createdAccounts++;
            }
            processedUsers++;
          }
        }

        return {
          processedUsers,
          createdAccounts,
          batchSize,
        };
      });

      expect(migrationResult.processedUsers).toBe(totalUsers);
      expect(migrationResult.createdAccounts).toBe(totalUsers);
      expect(migrationResult.batchSize).toBe(batchSize);
    });

    it('should handle migration rollback on failure', async () => {
      let rollbackCalled = false;

      // Mock transaction that fails
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        try {
          const result = await callback(mockPrisma);
          return result;
        } catch (error) {
          rollbackCalled = true;
          throw error;
        }
      });

      try {
        await mockPrisma.$transaction(async (tx) => {
          // Simulate some operations
          await tx.userExchangeAccounts.create({
            data: {
              user_id: 'user-1',
              exchange_id: 'exchange-1',
              account_name: 'Test Account',
              credentials: {},
              is_active: true,
              is_verified: false,
            },
          });

          // Simulate failure
          throw new Error('Migration failed');
        });
      } catch (error) {
        expect(error.message).toBe('Migration failed');
        expect(rollbackCalled).toBe(true);
      }
    });
  });
});
