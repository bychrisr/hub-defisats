/**
 * Multi-Account API Integration Tests
 * 
 * Integration tests for multi-account system APIs
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { build } from '../index';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  userExchangeAccounts: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  exchange: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  plan: {
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  planLimits: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  automation: {
    count: jest.fn(),
  },
  simulation: {
    count: jest.fn(),
  },
  backtestReport: {
    count: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock getPrisma
jest.mock('../../lib/prisma', () => ({
  getPrisma: jest.fn().mockResolvedValue(mockPrisma),
}));

// Mock AuthService
jest.mock('../../services/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    encryptData: jest.fn((data: string) => `encrypted_${data}`),
    decryptData: jest.fn((data: string) => data.replace('encrypted_', '')),
  })),
}));

describe('Multi-Account API Integration Tests', () => {
  let app: FastifyInstance;
  const mockUserId = 'user-123';
  const mockAccountId = 'account-123';
  const mockExchangeId = 'exchange-123';
  const mockPlanId = 'plan-123';
  const mockLimitsId = 'limits-123';

  beforeEach(async () => {
    app = await build();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('User Exchange Accounts API', () => {
    const mockToken = 'valid-jwt-token';
    const mockUser = {
      id: mockUserId,
      email: 'test@example.com',
      plan_type: 'PREMIUM',
    };

    beforeEach(() => {
      // Mock authentication
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    describe('GET /api/user/exchange-accounts', () => {
      it('should return user exchange accounts', async () => {
        const mockAccounts = [
          {
            id: 'account-1',
            user_id: mockUserId,
            exchange_id: mockExchangeId,
            account_name: 'Test Account 1',
            credentials: { api_key: 'encrypted_key1', secret: 'encrypted_secret1' },
            is_active: true,
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
            last_test: null,
            exchange: {
              id: mockExchangeId,
              name: 'LN Markets',
              slug: 'lnmarkets',
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
          },
        ];

        mockPrisma.userExchangeAccounts.findMany.mockResolvedValue(mockAccounts);

        const response = await app.inject({
          method: 'GET',
          url: '/api/user/exchange-accounts',
          headers: {
            authorization: `Bearer ${mockToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(1);
        expect(body.data[0].account_name).toBe('Test Account 1');
      });

      it('should return 401 when not authenticated', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/user/exchange-accounts',
        });

        expect(response.statusCode).toBe(401);
      });
    });

    describe('POST /api/user/exchange-accounts', () => {
      it('should create new exchange account', async () => {
        const mockExchange = {
          id: mockExchangeId,
          name: 'LN Markets',
          slug: 'lnmarkets',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const mockCreatedAccount = {
          id: mockAccountId,
          user_id: mockUserId,
          exchange_id: mockExchangeId,
          account_name: 'New Account',
          credentials: { api_key: 'encrypted_test_key', secret: 'encrypted_test_secret' },
          is_active: true,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
          last_test: null,
          exchange: mockExchange,
        };

        mockPrisma.exchange.findUnique.mockResolvedValue(mockExchange);
        mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(null);
        mockPrisma.userExchangeAccounts.create.mockResolvedValue(mockCreatedAccount);
        mockPrisma.userExchangeAccounts.count.mockResolvedValue(1);

        const response = await app.inject({
          method: 'POST',
          url: '/api/user/exchange-accounts',
          headers: {
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json',
          },
          payload: {
            exchange_id: mockExchangeId,
            account_name: 'New Account',
            credentials: {
              api_key: 'test_key',
              secret: 'test_secret',
            },
          },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data.account_name).toBe('New Account');
      });

      it('should return 400 when exchange not found', async () => {
        mockPrisma.exchange.findUnique.mockResolvedValue(null);

        const response = await app.inject({
          method: 'POST',
          url: '/api/user/exchange-accounts',
          headers: {
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json',
          },
          payload: {
            exchange_id: 'invalid-exchange',
            account_name: 'New Account',
            credentials: {
              api_key: 'test_key',
              secret: 'test_secret',
            },
          },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('EXCHANGE_NOT_FOUND');
      });
    });

    describe('PUT /api/user/exchange-accounts/:id', () => {
      it('should update exchange account', async () => {
        const existingAccount = {
          id: mockAccountId,
          user_id: mockUserId,
          exchange_id: mockExchangeId,
          account_name: 'Old Account',
          credentials: { api_key: 'old_key', secret: 'old_secret' },
          is_active: false,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
          last_test: null,
        };

        const updatedAccount = {
          ...existingAccount,
          account_name: 'Updated Account',
          credentials: { api_key: 'encrypted_new_key', secret: 'encrypted_new_secret' },
          is_active: true,
          exchange: {
            id: mockExchangeId,
            name: 'LN Markets',
            slug: 'lnmarkets',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        };

        mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(existingAccount);
        mockPrisma.userExchangeAccounts.updateMany.mockResolvedValue({ count: 0 });
        mockPrisma.userExchangeAccounts.update.mockResolvedValue(updatedAccount);
        mockPrisma.userExchangeAccounts.count.mockResolvedValue(1);

        const response = await app.inject({
          method: 'PUT',
          url: `/api/user/exchange-accounts/${mockAccountId}`,
          headers: {
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json',
          },
          payload: {
            account_name: 'Updated Account',
            credentials: {
              api_key: 'new_key',
              secret: 'new_secret',
            },
            is_active: true,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data.account_name).toBe('Updated Account');
      });
    });

    describe('DELETE /api/user/exchange-accounts/:id', () => {
      it('should delete exchange account', async () => {
        const existingAccount = {
          id: mockAccountId,
          user_id: mockUserId,
          exchange_id: mockExchangeId,
          account_name: 'Test Account',
          credentials: {},
          is_active: false,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
          last_test: null,
        };

        mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(existingAccount);
        mockPrisma.automation.count.mockResolvedValue(0);
        mockPrisma.userExchangeAccounts.delete.mockResolvedValue(existingAccount);

        const response = await app.inject({
          method: 'DELETE',
          url: `/api/user/exchange-accounts/${mockAccountId}`,
          headers: {
            authorization: `Bearer ${mockToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.message).toBe('Account deleted successfully');
      });

      it('should return 400 when account has active automations', async () => {
        const existingAccount = {
          id: mockAccountId,
          user_id: mockUserId,
          exchange_id: mockExchangeId,
          account_name: 'Test Account',
          credentials: {},
          is_active: false,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
          last_test: null,
        };

        mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(existingAccount);
        mockPrisma.automation.count.mockResolvedValue(2);

        const response = await app.inject({
          method: 'DELETE',
          url: `/api/user/exchange-accounts/${mockAccountId}`,
          headers: {
            authorization: `Bearer ${mockToken}`,
          },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('ACCOUNT_HAS_AUTOMATIONS');
      });
    });

    describe('POST /api/user/exchange-accounts/:id/set-active', () => {
      it('should set active account', async () => {
        const mockAccount = {
          id: mockAccountId,
          user_id: mockUserId,
          exchange_id: mockExchangeId,
          account_name: 'Test Account',
          credentials: { api_key: 'encrypted_key', secret: 'encrypted_secret' },
          is_active: false,
          is_verified: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_test: null,
          exchange: {
            id: mockExchangeId,
            name: 'LN Markets',
            slug: 'lnmarkets',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        };

        mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(mockAccount);
        mockPrisma.userExchangeAccounts.updateMany.mockResolvedValue({ count: 0 });
        mockPrisma.userExchangeAccounts.update.mockResolvedValue({
          ...mockAccount,
          is_active: true,
        });
        mockPrisma.userExchangeAccounts.count.mockResolvedValue(1);

        const response = await app.inject({
          method: 'POST',
          url: `/api/user/exchange-accounts/${mockAccountId}/set-active`,
          headers: {
            authorization: `Bearer ${mockToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data.is_active).toBe(true);
      });
    });

    describe('POST /api/user/exchange-accounts/:id/test', () => {
      it('should test account credentials', async () => {
        const mockAccount = {
          id: mockAccountId,
          user_id: mockUserId,
          exchange_id: mockExchangeId,
          account_name: 'Test Account',
          credentials: { api_key: 'encrypted_key', secret: 'encrypted_secret' },
          is_active: true,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
          last_test: null,
          exchange: {
            id: mockExchangeId,
            name: 'LN Markets',
            slug: 'lnmarkets',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        };

        mockPrisma.userExchangeAccounts.findFirst.mockResolvedValue(mockAccount);
        mockPrisma.userExchangeAccounts.update.mockResolvedValue(mockAccount);

        const response = await app.inject({
          method: 'POST',
          url: `/api/user/exchange-accounts/${mockAccountId}/test`,
          headers: {
            authorization: `Bearer ${mockToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data.success).toBe(true);
        expect(body.data.message).toBe('Credentials test successful');
      });
    });
  });

  describe('Plan Limits API', () => {
    const mockAdminToken = 'valid-admin-jwt-token';
    const mockAdminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      role: 'ADMIN',
    };

    beforeEach(() => {
      // Mock admin authentication
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
    });

    describe('POST /api/plan-limits', () => {
      it('should create plan limits', async () => {
        const mockPlan = {
          id: mockPlanId,
          name: 'Premium Plan',
          slug: 'premium',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const mockCreatedLimits = {
          id: mockLimitsId,
          plan_id: mockPlanId,
          max_exchange_accounts: 5,
          max_automations: 10,
          max_indicators: 20,
          max_simulations: 15,
          max_backtests: 8,
          created_at: new Date(),
          updated_at: new Date(),
          plan: {
            id: mockPlanId,
            name: 'Premium Plan',
            slug: 'premium',
          },
        };

        mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
        mockPrisma.planLimits.findUnique.mockResolvedValue(null);
        mockPrisma.planLimits.create.mockResolvedValue(mockCreatedLimits);

        const response = await app.inject({
          method: 'POST',
          url: '/api/plan-limits',
          headers: {
            authorization: `Bearer ${mockAdminToken}`,
            'content-type': 'application/json',
          },
          payload: {
            planId: mockPlanId,
            maxExchangeAccounts: 5,
            maxAutomations: 10,
            maxIndicators: 20,
            maxSimulations: 15,
            maxBacktests: 8,
          },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data.planId).toBe(mockPlanId);
        expect(body.data.maxExchangeAccounts).toBe(5);
      });

      it('should return 400 when plan not found', async () => {
        mockPrisma.plan.findUnique.mockResolvedValue(null);

        const response = await app.inject({
          method: 'POST',
          url: '/api/plan-limits',
          headers: {
            authorization: `Bearer ${mockAdminToken}`,
            'content-type': 'application/json',
          },
          payload: {
            planId: 'invalid-plan',
            maxExchangeAccounts: 5,
            maxAutomations: 10,
            maxIndicators: 20,
            maxSimulations: 15,
            maxBacktests: 8,
          },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('PLAN_NOT_FOUND');
      });
    });

    describe('GET /api/plan-limits', () => {
      it('should return all plan limits', async () => {
        const mockLimits = [
          {
            id: 'limits-1',
            plan_id: 'plan-1',
            max_exchange_accounts: 3,
            max_automations: 5,
            max_indicators: 10,
            max_simulations: 8,
            max_backtests: 5,
            created_at: new Date(),
            updated_at: new Date(),
            plan: {
              id: 'plan-1',
              name: 'Basic Plan',
              slug: 'basic',
            },
          },
          {
            id: 'limits-2',
            plan_id: 'plan-2',
            max_exchange_accounts: 10,
            max_automations: 20,
            max_indicators: 50,
            max_simulations: 30,
            max_backtests: 15,
            created_at: new Date(),
            updated_at: new Date(),
            plan: {
              id: 'plan-2',
              name: 'Premium Plan',
              slug: 'premium',
            },
          },
        ];

        mockPrisma.planLimits.findMany.mockResolvedValue(mockLimits);

        const response = await app.inject({
          method: 'GET',
          url: '/api/plan-limits',
          headers: {
            authorization: `Bearer ${mockAdminToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(2);
        expect(body.data[0].plan.name).toBe('Basic Plan');
        expect(body.data[1].plan.name).toBe('Premium Plan');
      });
    });

    describe('GET /api/plan-limits/user/:userId', () => {
      it('should return user plan limits', async () => {
        const mockUser = {
          plan_type: 'PREMIUM',
        };

        const mockLimits = {
          id: mockLimitsId,
          plan_id: mockPlanId,
          max_exchange_accounts: 10,
          max_automations: 20,
          max_indicators: 50,
          max_simulations: 30,
          max_backtests: 15,
          created_at: new Date(),
          updated_at: new Date(),
          plan: {
            id: mockPlanId,
            name: 'Premium Plan',
            slug: 'premium',
          },
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.planLimits.findFirst.mockResolvedValue(mockLimits);

        const response = await app.inject({
          method: 'GET',
          url: `/api/plan-limits/user/${mockUserId}`,
          headers: {
            authorization: `Bearer ${mockAdminToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data.maxExchangeAccounts).toBe(10);
        expect(body.data.plan.name).toBe('Premium Plan');
      });
    });

    describe('POST /api/plan-limits/check', () => {
      it('should check if user can create resource', async () => {
        const mockUser = {
          plan_type: 'PREMIUM',
        };

        const mockLimits = {
          id: mockLimitsId,
          plan_id: mockPlanId,
          max_exchange_accounts: 5,
          max_automations: 10,
          max_indicators: 20,
          max_simulations: 15,
          max_backtests: 8,
          created_at: new Date(),
          updated_at: new Date(),
          plan: {
            id: mockPlanId,
            name: 'Premium Plan',
            slug: 'premium',
          },
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.planLimits.findFirst.mockResolvedValue(mockLimits);
        mockPrisma.userExchangeAccounts.count.mockResolvedValue(3);

        const response = await app.inject({
          method: 'POST',
          url: '/api/plan-limits/check',
          headers: {
            authorization: `Bearer ${mockAdminToken}`,
            'content-type': 'application/json',
          },
          payload: {
            userId: mockUserId,
            resourceType: 'exchange_account',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.canCreate).toBe(true);
        expect(body.currentUsage).toBe(3);
        expect(body.limit).toBe(5);
      });
    });

    describe('GET /api/plan-limits/statistics', () => {
      it('should return usage statistics', async () => {
        const mockLimits = [
          {
            max_exchange_accounts: 5,
            max_automations: 10,
            max_indicators: 20,
            max_simulations: 15,
            max_backtests: 8,
          },
          {
            max_exchange_accounts: 10,
            max_automations: 20,
            max_indicators: 50,
            max_simulations: 30,
            max_backtests: 15,
          },
        ];

        mockPrisma.plan.count.mockResolvedValue(3);
        mockPrisma.planLimits.count.mockResolvedValue(2);
        mockPrisma.planLimits.findMany.mockResolvedValue(mockLimits);

        const response = await app.inject({
          method: 'GET',
          url: '/api/plan-limits/statistics',
          headers: {
            authorization: `Bearer ${mockAdminToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data.totalPlans).toBe(3);
        expect(body.data.plansWithLimits).toBe(2);
        expect(body.data.averageLimits.exchangeAccounts).toBe(7.5);
      });
    });
  });
});

