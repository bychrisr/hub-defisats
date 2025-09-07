import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AutomationService } from '@/services/automation.service';

describe('AutomationService', () => {
  let prisma: PrismaClient;
  let automationService: AutomationService;
  let testUserId: string;

  beforeEach(async () => {
    prisma = new PrismaClient();
    automationService = new AutomationService(prisma);
    
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        ln_markets_api_key: 'test_key',
        ln_markets_api_secret: 'test_secret',
      },
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.automation.deleteMany({
      where: { user_id: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('createAutomation', () => {
    it('should create a margin guard automation with valid config', async () => {
      const config = {
        margin_threshold: 20,
        action: 'close_position',
        enabled: true,
      };

      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config,
      });

      expect(automation).toBeDefined();
      expect(automation.type).toBe('margin_guard');
      expect(automation.user_id).toBe(testUserId);
      expect(automation.is_active).toBe(true);
      expect(automation.config).toEqual(config);
    });

    it('should create a TP/SL automation with valid config', async () => {
      const config = {
        take_profit_percentage: 10,
        stop_loss_percentage: 5,
        trailing_stop: false,
        enabled: true,
      };

      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'tp_sl',
        config,
      });

      expect(automation).toBeDefined();
      expect(automation.type).toBe('tp_sl');
      expect(automation.config).toEqual(config);
    });

    it('should create an auto entry automation with valid config', async () => {
      const config = {
        entry_condition: 'price_above',
        entry_price: 50000,
        position_size: 0.1,
        enabled: true,
      };

      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'auto_entry',
        config,
      });

      expect(automation).toBeDefined();
      expect(automation.type).toBe('auto_entry');
      expect(automation.config).toEqual(config);
    });

    it('should throw error for invalid margin guard config', async () => {
      const invalidConfig = {
        margin_threshold: 150, // Invalid: > 100
        action: 'close_position',
      };

      await expect(
        automationService.createAutomation({
          userId: testUserId,
          type: 'margin_guard',
          config: invalidConfig,
        })
      ).rejects.toThrow();
    });

    it('should throw error for invalid TP/SL config', async () => {
      const invalidConfig = {
        take_profit_percentage: -5, // Invalid: negative
        stop_loss_percentage: 5,
      };

      await expect(
        automationService.createAutomation({
          userId: testUserId,
          type: 'tp_sl',
          config: invalidConfig,
        })
      ).rejects.toThrow();
    });

    it('should throw error for invalid auto entry config', async () => {
      const invalidConfig = {
        entry_condition: 'price_above',
        position_size: 1.5, // Invalid: > 1
      };

      await expect(
        automationService.createAutomation({
          userId: testUserId,
          type: 'auto_entry',
          config: invalidConfig,
        })
      ).rejects.toThrow();
    });

    it('should throw error when user already has active automation of same type', async () => {
      // Create first automation
      await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          margin_threshold: 20,
          action: 'close_position',
          enabled: true,
        },
      });

      // Try to create second automation of same type
      await expect(
        automationService.createAutomation({
          userId: testUserId,
          type: 'margin_guard',
          config: {
            margin_threshold: 30,
            action: 'reduce_position',
            enabled: true,
          },
        })
      ).rejects.toThrow('User already has an active margin_guard automation');
    });
  });

  describe('getUserAutomations', () => {
    beforeEach(async () => {
      // Create test automations
      await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          margin_threshold: 20,
          action: 'close_position',
          enabled: true,
        },
      });

      await automationService.createAutomation({
        userId: testUserId,
        type: 'tp_sl',
        config: {
          take_profit_percentage: 10,
          stop_loss_percentage: 5,
          enabled: true,
        },
      });
    });

    it('should return all user automations', async () => {
      const automations = await automationService.getUserAutomations({
        userId: testUserId,
      });

      expect(automations).toHaveLength(2);
      expect(automations[0].user_id).toBe(testUserId);
      expect(automations[1].user_id).toBe(testUserId);
    });

    it('should filter by type', async () => {
      const automations = await automationService.getUserAutomations({
        userId: testUserId,
        type: 'margin_guard',
      });

      expect(automations).toHaveLength(1);
      expect(automations[0].type).toBe('margin_guard');
    });

    it('should filter by active status', async () => {
      const automations = await automationService.getUserAutomations({
        userId: testUserId,
        isActive: true,
      });

      expect(automations).toHaveLength(2);
      expect(automations.every(a => a.is_active)).toBe(true);
    });
  });

  describe('updateAutomation', () => {
    let automationId: string;

    beforeEach(async () => {
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          margin_threshold: 20,
          action: 'close_position',
          enabled: true,
        },
      });
      automationId = automation.id;
    });

    it('should update automation config', async () => {
      const newConfig = {
        margin_threshold: 30,
        action: 'reduce_position',
        reduce_percentage: 50,
        enabled: true,
      };

      const updatedAutomation = await automationService.updateAutomation({
        automationId,
        userId: testUserId,
        updates: { config: newConfig },
      });

      expect(updatedAutomation).toBeDefined();
      expect(updatedAutomation?.config).toEqual(newConfig);
    });

    it('should update automation status', async () => {
      const updatedAutomation = await automationService.updateAutomation({
        automationId,
        userId: testUserId,
        updates: { is_active: false },
      });

      expect(updatedAutomation).toBeDefined();
      expect(updatedAutomation?.is_active).toBe(false);
    });

    it('should return null for non-existent automation', async () => {
      const result = await automationService.updateAutomation({
        automationId: 'non-existent-id',
        userId: testUserId,
        updates: { is_active: false },
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteAutomation', () => {
    let automationId: string;

    beforeEach(async () => {
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          margin_threshold: 20,
          action: 'close_position',
          enabled: true,
        },
      });
      automationId = automation.id;
    });

    it('should delete automation', async () => {
      const result = await automationService.deleteAutomation({
        automationId,
        userId: testUserId,
      });

      expect(result).toBe(true);

      // Verify automation is deleted
      const automation = await automationService.getAutomation({
        automationId,
        userId: testUserId,
      });
      expect(automation).toBeNull();
    });

    it('should return false for non-existent automation', async () => {
      const result = await automationService.deleteAutomation({
        automationId: 'non-existent-id',
        userId: testUserId,
      });

      expect(result).toBe(false);
    });
  });

  describe('toggleAutomation', () => {
    let automationId: string;

    beforeEach(async () => {
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          margin_threshold: 20,
          action: 'close_position',
          enabled: true,
        },
      });
      automationId = automation.id;
    });

    it('should toggle automation status', async () => {
      const toggledAutomation = await automationService.toggleAutomation({
        automationId,
        userId: testUserId,
      });

      expect(toggledAutomation).toBeDefined();
      expect(toggledAutomation?.is_active).toBe(false);

      // Toggle again
      const toggledAgain = await automationService.toggleAutomation({
        automationId,
        userId: testUserId,
      });

      expect(toggledAgain?.is_active).toBe(true);
    });

    it('should return null for non-existent automation', async () => {
      const result = await automationService.toggleAutomation({
        automationId: 'non-existent-id',
        userId: testUserId,
      });

      expect(result).toBeNull();
    });
  });

  describe('getAutomationStats', () => {
    beforeEach(async () => {
      // Create test automations
      await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          margin_threshold: 20,
          action: 'close_position',
          enabled: true,
        },
      });

      await automationService.createAutomation({
        userId: testUserId,
        type: 'tp_sl',
        config: {
          take_profit_percentage: 10,
          stop_loss_percentage: 5,
          enabled: true,
        },
      });

      // Create inactive automation
      const inactiveAutomation = await automationService.createAutomation({
        userId: testUserId,
        type: 'auto_entry',
        config: {
          entry_condition: 'price_above',
          entry_price: 50000,
          position_size: 0.1,
          enabled: true,
        },
      });

      // Deactivate it
      await automationService.toggleAutomation({
        automationId: inactiveAutomation.id,
        userId: testUserId,
      });
    });

    it('should return correct statistics', async () => {
      const stats = await automationService.getAutomationStats(testUserId);

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
      expect(stats.byType.margin_guard).toBe(1);
      expect(stats.byType.tp_sl).toBe(1);
      expect(stats.byType.auto_entry).toBe(1);
      expect(stats.recentActivity).toHaveLength(3);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid margin guard config', async () => {
      const config = {
        margin_threshold: 20,
        action: 'close_position',
        enabled: true,
      };

      const result = await automationService.validateConfig('margin_guard', config);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid margin guard config', async () => {
      const config = {
        margin_threshold: 150, // Invalid: > 100
        action: 'close_position',
      };

      const result = await automationService.validateConfig('margin_guard', config);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
