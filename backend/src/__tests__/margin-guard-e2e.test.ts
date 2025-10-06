import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { MarginGuardExecutorService } from '../services/margin-guard-executor.service';
import { MarginGuardNotificationService } from '../services/margin-guard-notification.service';
import { MarginGuardPlanService } from '../services/margin-guard-plan.service';
import { AutomationService } from '../services/automation.service';
import { UserExchangeAccountService } from '../services/userExchangeAccount.service';
import { AutomationLoggerService } from '../services/automation-logger.service';

describe('Margin Guard E2E Tests', () => {
  let prisma: PrismaClient;
  let marginGuardExecutor: MarginGuardExecutorService;
  let marginGuardNotification: MarginGuardNotificationService;
  let marginGuardPlanService: MarginGuardPlanService;
  let automationService: AutomationService;
  let userExchangeAccountService: UserExchangeAccountService;
  let automationLogger: AutomationLoggerService;

  // Test user data
  const testUserId = 'fec9073b-244d-407b-a7d1-6d7a7f616c20'; // brainoschris@gmail.com
  const testUserEmail = 'brainoschris@gmail.com';
  const testPlanType = 'lifetime';

  beforeAll(async () => {
    prisma = new PrismaClient();
    marginGuardExecutor = new MarginGuardExecutorService(prisma);
    marginGuardNotification = new MarginGuardNotificationService(prisma);
    marginGuardPlanService = new MarginGuardPlanService(prisma);
    automationService = new AutomationService(prisma);
    userExchangeAccountService = new UserExchangeAccountService(prisma);
    automationLogger = new AutomationLoggerService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.automationLog.deleteMany({
      where: { automation: { user_id: testUserId } }
    });
    await prisma.automation.deleteMany({
      where: { user_id: testUserId }
    });
  });

  describe('Free Plan Margin Guard', () => {
    it('should execute Margin Guard for Free plan with 2 positions limit', async () => {
      console.log('🧪 Testing Free plan Margin Guard execution');

      // Create test automation for Free plan
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          plan_type: 'free',
          margin_threshold: 85,
          action: 'add_margin',
          add_margin_amount: 1000,
          enabled: true,
          selected_positions: ['pos_1', 'pos_2'],
          notifications: {
            push: true,
            email: false,
            telegram: false,
            whatsapp: false,
            webhook: false
          }
        },
        userExchangeAccountId: 'test-account-id'
      });

      expect(automation).toBeDefined();
      expect(automation.type).toBe('margin_guard');

      // Mock positions data
      const mockPositions = [
        {
          id: 'pos_1',
          symbol: 'BTCUSD',
          side: 'long',
          size: 1000,
          margin: 100,
          liquidation_price: 40000,
          current_price: 45000,
          pnl: 500
        },
        {
          id: 'pos_2',
          symbol: 'BTCUSD',
          side: 'short',
          size: 500,
          margin: 50,
          liquidation_price: 50000,
          current_price: 45000,
          pnl: 250
        },
        {
          id: 'pos_3',
          symbol: 'ETHUSD',
          side: 'long',
          size: 2000,
          margin: 200,
          liquidation_price: 2500,
          current_price: 3000,
          pnl: 1000
        }
      ];

      // Execute Margin Guard
      const executionData = {
        userId: testUserId,
        automationId: automation.id,
        userExchangeAccountId: 'test-account-id',
        config: automation.config,
        planType: 'free',
        positions: mockPositions,
        currentPrices: { 'BTCUSD': 45000, 'ETHUSD': 3000 }
      };

      const result = await marginGuardExecutor.executeMarginGuard(executionData);

      // Verify execution results
      expect(result.success).toBe(true);
      expect(result.actions.length).toBeLessThanOrEqual(2); // Free plan limit
      expect(result.errors.length).toBe(0);

      // Verify only selected positions were processed
      const processedPositionIds = result.actions.map(action => action.positionId);
      expect(processedPositionIds).toContain('pos_1');
      expect(processedPositionIds).toContain('pos_2');
      expect(processedPositionIds).not.toContain('pos_3'); // Should be excluded

      console.log('✅ Free plan test passed:', {
        actions: result.actions.length,
        notifications: result.notifications.length
      });
    });
  });

  describe('Basic Plan Margin Guard', () => {
    it('should execute Margin Guard for Basic plan with all positions', async () => {
      console.log('🧪 Testing Basic plan Margin Guard execution');

      // Create test automation for Basic plan
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          plan_type: 'basic',
          margin_threshold: 80,
          action: 'reduce_position',
          reduce_percentage: 50,
          enabled: true,
          notifications: {
            push: true,
            email: false,
            telegram: false,
            whatsapp: false,
            webhook: false
          }
        },
        userExchangeAccountId: 'test-account-id'
      });

      // Mock positions data
      const mockPositions = [
        { id: 'pos_1', symbol: 'BTCUSD', side: 'long', liquidation_price: 40000, current_price: 45000 },
        { id: 'pos_2', symbol: 'BTCUSD', side: 'short', liquidation_price: 50000, current_price: 45000 },
        { id: 'pos_3', symbol: 'ETHUSD', side: 'long', liquidation_price: 2500, current_price: 3000 }
      ];

      // Execute Margin Guard
      const executionData = {
        userId: testUserId,
        automationId: automation.id,
        userExchangeAccountId: 'test-account-id',
        config: automation.config,
        planType: 'basic',
        positions: mockPositions,
        currentPrices: { 'BTCUSD': 45000, 'ETHUSD': 3000 }
      };

      const result = await marginGuardExecutor.executeMarginGuard(executionData);

      // Verify execution results
      expect(result.success).toBe(true);
      expect(result.actions.length).toBe(3); // All positions processed
      expect(result.errors.length).toBe(0);

      console.log('✅ Basic plan test passed:', {
        actions: result.actions.length,
        notifications: result.notifications.length
      });
    });
  });

  describe('Advanced Plan Margin Guard', () => {
    it('should execute Margin Guard for Advanced plan with unitario mode', async () => {
      console.log('🧪 Testing Advanced plan Margin Guard execution (unitario mode)');

      // Create test automation for Advanced plan
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          plan_type: 'advanced',
          margin_threshold: 75,
          action: 'add_margin',
          add_margin_amount: 2000,
          enabled: true,
          protection_mode: 'unitario',
          selected_positions: ['pos_1', 'pos_2'],
          notifications: {
            push: true,
            email: false,
            telegram: false,
            whatsapp: false,
            webhook: false
          }
        },
        userExchangeAccountId: 'test-account-id'
      });

      // Mock positions data
      const mockPositions = [
        { id: 'pos_1', symbol: 'BTCUSD', side: 'long', liquidation_price: 40000, current_price: 45000 },
        { id: 'pos_2', symbol: 'BTCUSD', side: 'short', liquidation_price: 50000, current_price: 45000 },
        { id: 'pos_3', symbol: 'ETHUSD', side: 'long', liquidation_price: 2500, current_price: 3000 }
      ];

      // Execute Margin Guard
      const executionData = {
        userId: testUserId,
        automationId: automation.id,
        userExchangeAccountId: 'test-account-id',
        config: automation.config,
        planType: 'advanced',
        positions: mockPositions,
        currentPrices: { 'BTCUSD': 45000, 'ETHUSD': 3000 }
      };

      const result = await marginGuardExecutor.executeMarginGuard(executionData);

      // Verify execution results
      expect(result.success).toBe(true);
      expect(result.actions.length).toBe(2); // Only selected positions
      expect(result.errors.length).toBe(0);

      console.log('✅ Advanced plan test passed:', {
        actions: result.actions.length,
        notifications: result.notifications.length
      });
    });

    it('should execute Margin Guard for Advanced plan with total mode', async () => {
      console.log('🧪 Testing Advanced plan Margin Guard execution (total mode)');

      // Create test automation for Advanced plan
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          plan_type: 'advanced',
          margin_threshold: 70,
          action: 'increase_liquidation_distance',
          new_liquidation_distance: 20,
          enabled: true,
          protection_mode: 'total',
          notifications: {
            push: true,
            email: false,
            telegram: false,
            whatsapp: false,
            webhook: false
          }
        },
        userExchangeAccountId: 'test-account-id'
      });

      // Mock positions data
      const mockPositions = [
        { id: 'pos_1', symbol: 'BTCUSD', side: 'long', liquidation_price: 40000, current_price: 45000 },
        { id: 'pos_2', symbol: 'BTCUSD', side: 'short', liquidation_price: 50000, current_price: 45000 },
        { id: 'pos_3', symbol: 'ETHUSD', side: 'long', liquidation_price: 2500, current_price: 3000 }
      ];

      // Execute Margin Guard
      const executionData = {
        userId: testUserId,
        automationId: automation.id,
        userExchangeAccountId: 'test-account-id',
        config: automation.config,
        planType: 'advanced',
        positions: mockPositions,
        currentPrices: { 'BTCUSD': 45000, 'ETHUSD': 3000 }
      };

      const result = await marginGuardExecutor.executeMarginGuard(executionData);

      // Verify execution results
      expect(result.success).toBe(true);
      expect(result.actions.length).toBe(3); // All positions processed
      expect(result.errors.length).toBe(0);

      console.log('✅ Advanced plan (total mode) test passed:', {
        actions: result.actions.length,
        notifications: result.notifications.length
      });
    });
  });

  describe('Pro Plan Margin Guard', () => {
    it('should execute Margin Guard for Pro plan with individual configurations', async () => {
      console.log('🧪 Testing Pro plan Margin Guard execution with individual configs');

      // Create test automation for Pro plan
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          plan_type: 'pro',
          margin_threshold: 60,
          action: 'add_margin',
          add_margin_amount: 1000,
          enabled: true,
          protection_mode: 'both',
          individual_configs: {
            'pos_1': {
              margin_threshold: 50,
              action: 'add_margin',
              add_margin_amount: 2000
            },
            'pos_2': {
              margin_threshold: 70,
              action: 'reduce_position',
              reduce_percentage: 30
            }
          },
          notifications: {
            push: true,
            email: true,
            telegram: true,
            whatsapp: false,
            webhook: true
          }
        },
        userExchangeAccountId: 'test-account-id'
      });

      // Mock positions data
      const mockPositions = [
        { id: 'pos_1', symbol: 'BTCUSD', side: 'long', liquidation_price: 40000, current_price: 45000 },
        { id: 'pos_2', symbol: 'BTCUSD', side: 'short', liquidation_price: 50000, current_price: 45000 },
        { id: 'pos_3', symbol: 'ETHUSD', side: 'long', liquidation_price: 2500, current_price: 3000 }
      ];

      // Execute Margin Guard
      const executionData = {
        userId: testUserId,
        automationId: automation.id,
        userExchangeAccountId: 'test-account-id',
        config: automation.config,
        planType: 'pro',
        positions: mockPositions,
        currentPrices: { 'BTCUSD': 45000, 'ETHUSD': 3000 }
      };

      const result = await marginGuardExecutor.executeMarginGuard(executionData);

      // Verify execution results
      expect(result.success).toBe(true);
      expect(result.actions.length).toBe(3); // All positions processed
      expect(result.errors.length).toBe(0);

      // Verify individual configurations were applied
      const pos1Action = result.actions.find(action => action.positionId === 'pos_1');
      const pos2Action = result.actions.find(action => action.positionId === 'pos_2');
      
      expect(pos1Action).toBeDefined();
      expect(pos2Action).toBeDefined();

      console.log('✅ Pro plan test passed:', {
        actions: result.actions.length,
        notifications: result.notifications.length
      });
    });
  });

  describe('Lifetime Plan Margin Guard', () => {
    it('should execute Margin Guard for Lifetime plan with all features', async () => {
      console.log('🧪 Testing Lifetime plan Margin Guard execution');

      // Create test automation for Lifetime plan
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          plan_type: 'lifetime',
          margin_threshold: 50,
          action: 'add_margin',
          add_margin_amount: 5000,
          enabled: true,
          protection_mode: 'both',
          individual_configs: {
            'pos_1': {
              margin_threshold: 40,
              action: 'add_margin',
              add_margin_amount: 10000
            }
          },
          notifications: {
            push: true,
            email: true,
            telegram: true,
            whatsapp: true,
            webhook: true
          }
        },
        userExchangeAccountId: 'test-account-id'
      });

      // Mock positions data
      const mockPositions = [
        { id: 'pos_1', symbol: 'BTCUSD', side: 'long', liquidation_price: 40000, current_price: 45000 },
        { id: 'pos_2', symbol: 'BTCUSD', side: 'short', liquidation_price: 50000, current_price: 45000 },
        { id: 'pos_3', symbol: 'ETHUSD', side: 'long', liquidation_price: 2500, current_price: 3000 }
      ];

      // Execute Margin Guard
      const executionData = {
        userId: testUserId,
        automationId: automation.id,
        userExchangeAccountId: 'test-account-id',
        config: automation.config,
        planType: 'lifetime',
        positions: mockPositions,
        currentPrices: { 'BTCUSD': 45000, 'ETHUSD': 3000 }
      };

      const result = await marginGuardExecutor.executeMarginGuard(executionData);

      // Verify execution results
      expect(result.success).toBe(true);
      expect(result.actions.length).toBe(3); // All positions processed
      expect(result.errors.length).toBe(0);

      console.log('✅ Lifetime plan test passed:', {
        actions: result.actions.length,
        notifications: result.notifications.length
      });
    });
  });

  describe('Notification System', () => {
    it('should send notifications based on plan features', async () => {
      console.log('🧪 Testing notification system');

      const notificationData = {
        userId: testUserId,
        automationId: 'test-automation-id',
        planType: 'lifetime',
        actions: [
          { positionId: 'pos_1', action: 'add_margin', amount: 1000 },
          { positionId: 'pos_2', action: 'reduce_position', percentage: 50 }
        ],
        positions: [
          { id: 'pos_1', symbol: 'BTCUSD' },
          { id: 'pos_2', symbol: 'BTCUSD' }
        ],
        executionTime: new Date()
      };

      const results = await marginGuardNotification.sendNotifications(notificationData);

      // Verify notifications were sent
      expect(results.length).toBeGreaterThan(0);
      
      // Verify push notification (always available)
      const pushNotification = results.find(r => r.type === 'push');
      expect(pushNotification).toBeDefined();
      expect(pushNotification.sent).toBe(true);

      // Verify advanced notifications for Lifetime plan
      const emailNotification = results.find(r => r.type === 'email');
      const telegramNotification = results.find(r => r.type === 'telegram');
      const webhookNotification = results.find(r => r.type === 'webhook');

      expect(emailNotification).toBeDefined();
      expect(telegramNotification).toBeDefined();
      expect(webhookNotification).toBeDefined();

      console.log('✅ Notification system test passed:', {
        totalNotifications: results.length,
        successful: results.filter(r => r.sent).length
      });
    });
  });

  describe('Plan Validation', () => {
    it('should validate plan configurations correctly', async () => {
      console.log('🧪 Testing plan validation');

      // Test Free plan validation
      const freePlanConfig = {
        plan_type: 'free',
        margin_threshold: 85,
        action: 'add_margin',
        add_margin_amount: 1000,
        selected_positions: ['pos_1', 'pos_2'],
        notifications: { push: true, email: false }
      };

      const freeValidation = await marginGuardPlanService.validatePlanConfiguration(
        testUserId,
        freePlanConfig
      );

      expect(freeValidation.valid).toBe(true);
      expect(freeValidation.errors.length).toBe(0);

      // Test Pro plan validation
      const proPlanConfig = {
        plan_type: 'pro',
        margin_threshold: 60,
        action: 'add_margin',
        add_margin_amount: 2000,
        protection_mode: 'both',
        individual_configs: {
          'pos_1': {
            margin_threshold: 50,
            action: 'add_margin',
            add_margin_amount: 3000
          }
        },
        notifications: {
          push: true,
          email: true,
          telegram: true,
          webhook: true
        }
      };

      const proValidation = await marginGuardPlanService.validatePlanConfiguration(
        testUserId,
        proPlanConfig
      );

      expect(proValidation.valid).toBe(true);
      expect(proValidation.errors.length).toBe(0);

      console.log('✅ Plan validation test passed');
    });
  });

  describe('Error Handling', () => {
    it('should handle execution errors gracefully', async () => {
      console.log('🧪 Testing error handling');

      // Create automation with invalid configuration
      const automation = await automationService.createAutomation({
        userId: testUserId,
        type: 'margin_guard',
        config: {
          plan_type: 'free',
          margin_threshold: 85,
          action: 'invalid_action', // Invalid action
          enabled: true,
          selected_positions: ['pos_1']
        },
        userExchangeAccountId: 'test-account-id'
      });

      // Mock positions data
      const mockPositions = [
        { id: 'pos_1', symbol: 'BTCUSD', side: 'long', liquidation_price: 40000, current_price: 45000 }
      ];

      // Execute Margin Guard
      const executionData = {
        userId: testUserId,
        automationId: automation.id,
        userExchangeAccountId: 'test-account-id',
        config: automation.config,
        planType: 'free',
        positions: mockPositions,
        currentPrices: { 'BTCUSD': 45000 }
      };

      const result = await marginGuardExecutor.executeMarginGuard(executionData);

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      console.log('✅ Error handling test passed:', {
        errors: result.errors.length
      });
    });
  });
});
