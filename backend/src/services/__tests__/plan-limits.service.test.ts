/**
 * PlanLimitsService Tests
 * 
 * Unit tests for PlanLimitsService implementation
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { PlanLimitsService, CreatePlanLimitsRequest, UpdatePlanLimitsRequest } from '../plan-limits.service';
import { PrismaClient } from '@prisma/client';

// Mock getPrisma
jest.mock('../../lib/prisma', () => ({
  getPrisma: jest.fn(),
}));

// Mock PrismaClient
const mockPrisma = {
  plan: {
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  planLimits: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  userExchangeAccounts: {
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
const { getPrisma } = require('../../lib/prisma');
(getPrisma as jest.Mock).mockResolvedValue(mockPrisma);

describe('PlanLimitsService', () => {
  let service: PlanLimitsService;
  const mockPlanId = 'plan-123';
  const mockUserId = 'user-123';
  const mockLimitsId = 'limits-123';

  beforeEach(() => {
    service = new PlanLimitsService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlanLimits', () => {
    const mockCreateData: CreatePlanLimitsRequest = {
      planId: mockPlanId,
      maxExchangeAccounts: 5,
      maxAutomations: 10,
      maxIndicators: 20,
      maxSimulations: 15,
      maxBacktests: 8,
    };

    it('should create plan limits successfully', async () => {
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

      const result = await service.createPlanLimits(mockCreateData);

      expect(mockPrisma.plan.findUnique).toHaveBeenCalledWith({
        where: { id: mockPlanId },
      });
      expect(mockPrisma.planLimits.findUnique).toHaveBeenCalledWith({
        where: { plan_id: mockPlanId },
      });
      expect(mockPrisma.planLimits.create).toHaveBeenCalledWith({
        data: {
          plan_id: mockPlanId,
          max_exchange_accounts: 5,
          max_automations: 10,
          max_indicators: 20,
          max_simulations: 15,
          max_backtests: 8,
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      expect(result).toBeDefined();
      expect(result.planId).toBe(mockPlanId);
      expect(result.maxExchangeAccounts).toBe(5);
    });

    it('should throw error when plan not found', async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      await expect(service.createPlanLimits(mockCreateData)).rejects.toThrow('Plan not found');
    });

    it('should throw error when limits already exist', async () => {
      const mockPlan = {
        id: mockPlanId,
        name: 'Premium Plan',
        slug: 'premium',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const existingLimits = {
        id: mockLimitsId,
        plan_id: mockPlanId,
        max_exchange_accounts: 3,
        max_automations: 5,
        max_indicators: 10,
        max_simulations: 8,
        max_backtests: 5,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrisma.planLimits.findUnique.mockResolvedValue(existingLimits);

      await expect(service.createPlanLimits(mockCreateData)).rejects.toThrow(
        'Plan limits already exist for this plan'
      );
    });
  });

  describe('updatePlanLimits', () => {
    const mockUpdateData: UpdatePlanLimitsRequest = {
      id: mockLimitsId,
      maxExchangeAccounts: 8,
      maxAutomations: 15,
      maxIndicators: 25,
      maxSimulations: 20,
      maxBacktests: 12,
    };

    it('should update plan limits successfully', async () => {
      const mockUpdatedLimits = {
        id: mockLimitsId,
        plan_id: mockPlanId,
        max_exchange_accounts: 8,
        max_automations: 15,
        max_indicators: 25,
        max_simulations: 20,
        max_backtests: 12,
        created_at: new Date(),
        updated_at: new Date(),
        plan: {
          id: mockPlanId,
          name: 'Premium Plan',
          slug: 'premium',
        },
      };

      mockPrisma.planLimits.update.mockResolvedValue(mockUpdatedLimits);

      const result = await service.updatePlanLimits(mockUpdateData);

      expect(mockPrisma.planLimits.update).toHaveBeenCalledWith({
        where: { id: mockLimitsId },
        data: {
          max_exchange_accounts: 8,
          max_automations: 15,
          max_indicators: 25,
          max_simulations: 20,
          max_backtests: 12,
          updated_at: expect.any(Date),
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      expect(result).toBeDefined();
      expect(result.maxExchangeAccounts).toBe(8);
      expect(result.maxAutomations).toBe(15);
    });
  });

  describe('getPlanLimits', () => {
    it('should return plan limits when found', async () => {
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

      mockPrisma.planLimits.findUnique.mockResolvedValue(mockLimits);

      const result = await service.getPlanLimits(mockPlanId);

      expect(mockPrisma.planLimits.findUnique).toHaveBeenCalledWith({
        where: { plan_id: mockPlanId },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      expect(result).toBeDefined();
      expect(result?.planId).toBe(mockPlanId);
    });

    it('should return null when limits not found', async () => {
      mockPrisma.planLimits.findUnique.mockResolvedValue(null);

      const result = await service.getPlanLimits(mockPlanId);

      expect(result).toBeNull();
    });
  });

  describe('getAllPlanLimits', () => {
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

      const result = await service.getAllPlanLimits();

      expect(mockPrisma.planLimits.findMany).toHaveBeenCalledWith({
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          plan: {
            name: 'asc',
          },
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].plan.name).toBe('Basic Plan');
      expect(result[1].plan.name).toBe('Premium Plan');
    });
  });

  describe('getUserLimits', () => {
    it('should return user limits based on plan type', async () => {
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

      const result = await service.getUserLimits(mockUserId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { plan_type: true },
      });
      expect(mockPrisma.planLimits.findFirst).toHaveBeenCalledWith({
        where: {
          plan: {
            slug: 'premium',
          },
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      expect(result).toBeDefined();
      expect(result?.maxExchangeAccounts).toBe(10);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserLimits(mockUserId);

      expect(result).toBeNull();
    });

    it('should return null when no limits found for user plan', async () => {
      const mockUser = {
        plan_type: 'UNKNOWN',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.planLimits.findFirst.mockResolvedValue(null);

      const result = await service.getUserLimits(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('validateLimit', () => {
    const mockLimits = {
      id: mockLimitsId,
      planId: mockPlanId,
      maxExchangeAccounts: 5,
      maxAutomations: 10,
      maxIndicators: 20,
      maxSimulations: 15,
      maxBacktests: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      plan: {
        id: mockPlanId,
        name: 'Premium Plan',
        slug: 'premium',
      },
    };

    beforeEach(() => {
      // Mock getUserLimits to return mockLimits
      jest.spyOn(service, 'getUserLimits').mockResolvedValue(mockLimits);
    });

    it('should validate exchange accounts limit successfully', async () => {
      mockPrisma.userExchangeAccounts.count.mockResolvedValue(3);

      const result = await service.validateLimit(mockUserId, 'EXCHANGE_ACCOUNTS');

      expect(mockPrisma.userExchangeAccounts.count).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
      });

      expect(result.isValid).toBe(true);
      expect(result.currentCount).toBe(3);
      expect(result.maxLimit).toBe(5);
      expect(result.limitType).toBe('EXCHANGE_ACCOUNTS');
    });

    it('should validate automations limit successfully', async () => {
      mockPrisma.automation.count.mockResolvedValue(5);

      const result = await service.validateLimit(mockUserId, 'AUTOMATIONS');

      expect(mockPrisma.automation.count).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
      });

      expect(result.isValid).toBe(true);
      expect(result.currentCount).toBe(5);
      expect(result.maxLimit).toBe(10);
    });

    it('should return invalid when limit exceeded', async () => {
      mockPrisma.userExchangeAccounts.count.mockResolvedValue(6);

      const result = await service.validateLimit(mockUserId, 'EXCHANGE_ACCOUNTS');

      expect(result.isValid).toBe(false);
      expect(result.currentCount).toBe(6);
      expect(result.maxLimit).toBe(5);
      expect(result.message).toBe('Limit exceeded for EXCHANGE_ACCOUNTS');
    });

    it('should return invalid when no limits found', async () => {
      jest.spyOn(service, 'getUserLimits').mockResolvedValue(null);

      const result = await service.validateLimit(mockUserId, 'EXCHANGE_ACCOUNTS');

      expect(result.isValid).toBe(false);
      expect(result.currentCount).toBe(0);
      expect(result.maxLimit).toBe(0);
      expect(result.message).toBe('No plan limits found');
    });

    it('should validate simulations limit', async () => {
      mockPrisma.simulation.count.mockResolvedValue(10);

      const result = await service.validateLimit(mockUserId, 'SIMULATIONS');

      expect(mockPrisma.simulation.count).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
      });

      expect(result.isValid).toBe(true);
      expect(result.currentCount).toBe(10);
      expect(result.maxLimit).toBe(15);
    });

    it('should validate backtests limit', async () => {
      mockPrisma.backtestReport.count.mockResolvedValue(5);

      const result = await service.validateLimit(mockUserId, 'BACKTESTS');

      expect(mockPrisma.backtestReport.count).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
      });

      expect(result.isValid).toBe(true);
      expect(result.currentCount).toBe(5);
      expect(result.maxLimit).toBe(8);
    });
  });

  describe('deletePlanLimits', () => {
    it('should delete plan limits successfully', async () => {
      mockPrisma.planLimits.delete.mockResolvedValue({} as any);

      await service.deletePlanLimits(mockLimitsId);

      expect(mockPrisma.planLimits.delete).toHaveBeenCalledWith({
        where: { id: mockLimitsId },
      });
    });
  });

  describe('getUsageStatistics', () => {
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

      const result = await service.getUsageStatistics();

      expect(mockPrisma.plan.count).toHaveBeenCalled();
      expect(mockPrisma.planLimits.count).toHaveBeenCalled();
      expect(mockPrisma.planLimits.findMany).toHaveBeenCalled();

      expect(result.totalPlans).toBe(3);
      expect(result.plansWithLimits).toBe(2);
      expect(result.averageLimits.exchangeAccounts).toBe(7.5);
      expect(result.averageLimits.automations).toBe(15);
      expect(result.averageLimits.indicators).toBe(35);
      expect(result.averageLimits.simulations).toBe(22.5);
      expect(result.averageLimits.backtests).toBe(11.5);
    });

    it('should handle empty limits array', async () => {
      mockPrisma.plan.count.mockResolvedValue(0);
      mockPrisma.planLimits.count.mockResolvedValue(0);
      mockPrisma.planLimits.findMany.mockResolvedValue([]);

      const result = await service.getUsageStatistics();

      expect(result.totalPlans).toBe(0);
      expect(result.plansWithLimits).toBe(0);
      expect(result.averageLimits.exchangeAccounts).toBe(0);
    });
  });
});

