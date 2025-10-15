---
title: Margin Guard Testing
category: automations
subcategory: margin-guard
tags: [margin-guard, testing, validation, quality-assurance, test-cases]
priority: medium
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team"]
---

# Margin Guard Testing

## Summary

Comprehensive testing strategy and implementation for the Margin Guard system. This document covers unit testing, integration testing, end-to-end testing, performance testing, and quality assurance procedures to ensure the reliability and correctness of Margin Guard automations.

## Testing Strategy

### Testing Pyramid

```mermaid
graph TB
    A[E2E Tests] --> B[Integration Tests]
    B --> C[Unit Tests]
    
    A --> D[User Scenarios]
    A --> E[Workflow Tests]
    A --> F[Cross-System Tests]
    
    B --> G[API Tests]
    B --> H[Database Tests]
    B --> I[External Service Tests]
    
    C --> J[Service Tests]
    C --> K[Utility Tests]
    C --> L[Validation Tests]
    
    style A fill:#ff9999
    style B fill:#ffcc99
    style C fill:#99ff99
```

### Test Categories

1. **Unit Tests**: Individual components and functions
2. **Integration Tests**: Component interactions and APIs
3. **End-to-End Tests**: Complete user workflows
4. **Performance Tests**: System performance and scalability
5. **Security Tests**: Security vulnerabilities and compliance
6. **Regression Tests**: Prevent breaking changes

## Unit Testing

### Service Layer Tests

```typescript
// MarginGuardExecutorService Tests
describe('MarginGuardExecutorService', () => {
  let service: MarginGuardExecutorService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockPlanLimitsService: jest.Mocked<PlanLimitsService>;
  let mockUserExchangeAccountService: jest.Mocked<UserExchangeAccountService>;
  let mockLNMarketsAPI: jest.Mocked<LNMarketsAPIv2>;
  let mockAutomationLogger: jest.Mocked<AutomationLoggerService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockPlanLimitsService = createMockPlanLimitsService();
    mockUserExchangeAccountService = createMockUserExchangeAccountService();
    mockLNMarketsAPI = createMockLNMarketsAPI();
    mockAutomationLogger = createMockAutomationLogger();

    service = new MarginGuardExecutorService(
      mockPrisma,
      mockPlanLimitsService,
      mockUserExchangeAccountService,
      mockLNMarketsAPI,
      mockAutomationLogger
    );
  });

  describe('executeMarginGuard', () => {
    it('should execute Margin Guard for free plan user', async () => {
      // Arrange
      const executionData = {
        userId: 'user-123',
        automationId: 'automation-123',
        config: {
          margin_threshold: 85,
          action: 'close_position',
          selected_positions: ['pos-123', 'pos-456'],
          notifications: { email: true },
          protection_mode: 'unitario'
        }
      };

      mockPlanLimitsService.getMarginGuardFeatures.mockResolvedValue({
        maxPositions: 2,
        availableModes: ['unitario'],
        availableActions: ['close_position'],
        minThreshold: 70
      });

      mockUserExchangeAccountService.getAccountsByUserId.mockResolvedValue([
        { id: 'account-123', credentials: { apiKey: 'key', apiSecret: 'secret' } }
      ]);

      mockLNMarketsAPI.futures.getPositions.mockResolvedValue({
        success: true,
        data: [
          { id: 'pos-123', symbol: 'BTCUSD', marginLevel: 90, side: 'long' },
          { id: 'pos-456', symbol: 'ETHUSD', marginLevel: 80, side: 'short' }
        ]
      });

      mockLNMarketsAPI.futures.closePosition.mockResolvedValue({
        success: true,
        data: { orderId: 'order-123' }
      });

      // Act
      const result = await service.executeMarginGuard(executionData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toBe(2);
      expect(mockLNMarketsAPI.futures.closePosition).toHaveBeenCalledTimes(2);
      expect(mockAutomationLogger.logExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          automationId: 'automation-123',
          status: 'completed'
        })
      );
    });

    it('should handle plan limitations correctly', async () => {
      // Arrange
      const executionData = {
        userId: 'user-123',
        automationId: 'automation-123',
        config: {
          margin_threshold: 85,
          action: 'add_margin',
          selected_positions: ['pos-123', 'pos-456', 'pos-789'],
          notifications: { email: true },
          protection_mode: 'unitario'
        }
      };

      mockPlanLimitsService.getMarginGuardFeatures.mockResolvedValue({
        maxPositions: 2,
        availableModes: ['unitario'],
        availableActions: ['close_position'],
        minThreshold: 70
      });

      // Act
      const result = await service.executeMarginGuard(executionData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Plan limitations exceeded');
      expect(result.details.planLimitations).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const executionData = {
        userId: 'user-123',
        automationId: 'automation-123',
        config: {
          margin_threshold: 85,
          action: 'close_position',
          selected_positions: ['pos-123'],
          notifications: { email: true },
          protection_mode: 'unitario'
        }
      };

      mockPlanLimitsService.getMarginGuardFeatures.mockResolvedValue({
        maxPositions: 2,
        availableModes: ['unitario'],
        availableActions: ['close_position'],
        minThreshold: 70
      });

      mockUserExchangeAccountService.getAccountsByUserId.mockResolvedValue([
        { id: 'account-123', credentials: { apiKey: 'key', apiSecret: 'secret' } }
      ]);

      mockLNMarketsAPI.futures.getPositions.mockRejectedValue(
        new Error('API connection failed')
      );

      // Act
      const result = await service.executeMarginGuard(executionData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('API connection failed');
      expect(mockAutomationLogger.logError).toHaveBeenCalled();
    });
  });

  describe('validatePositionsForPlan', () => {
    it('should filter positions based on plan limits', async () => {
      // Arrange
      const positions = [
        { id: 'pos-1', symbol: 'BTCUSD', marginLevel: 90 },
        { id: 'pos-2', symbol: 'ETHUSD', marginLevel: 85 },
        { id: 'pos-3', symbol: 'ADAUSD', marginLevel: 80 }
      ];

      const planFeatures = {
        maxPositions: 2,
        availableModes: ['unitario'],
        availableActions: ['close_position'],
        minThreshold: 70
      };

      const config = {
        selected_positions: ['pos-1', 'pos-2', 'pos-3'],
        margin_threshold: 85
      };

      // Act
      const result = await service.validatePositionsForPlan(positions, planFeatures, config);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.filteredPositions).toHaveLength(2);
      expect(result.excludedPositions).toHaveLength(1);
      expect(result.excludedPositions[0].reason).toBe('exceeds_plan_limit');
    });
  });

  describe('calculateLiquidationPrice', () => {
    it('should calculate liquidation price for long position', () => {
      // Arrange
      const position = {
        side: 'long' as const,
        quantity: 1000,
        entryPrice: 50000,
        margin: 10000
      };

      // Act
      const result = service.calculateLiquidationPrice(position, 51000);

      // Assert
      expect(result).toBe(49000); // entryPrice - (margin / quantity)
    });

    it('should calculate liquidation price for short position', () => {
      // Arrange
      const position = {
        side: 'short' as const,
        quantity: 1000,
        entryPrice: 50000,
        margin: 10000
      };

      // Act
      const result = service.calculateLiquidationPrice(position, 49000);

      // Assert
      expect(result).toBe(51000); // entryPrice + (margin / quantity)
    });
  });
});
```

### Validation Tests

```typescript
// Configuration Validation Tests
describe('MarginGuardConfigValidation', () => {
  describe('MarginGuardConfigSchema', () => {
    it('should validate correct configuration', () => {
      // Arrange
      const validConfig = {
        margin_threshold: 85,
        action: 'close_position',
        selected_positions: ['pos-123', 'pos-456'],
        notifications: {
          email: true,
          telegram: false,
          webhook: false,
          sms: false
        },
        protection_mode: 'unitario',
        real_time_monitoring: true,
        auto_execution: true
      };

      // Act
      const result = MarginGuardConfigSchema.safeParse(validConfig);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validConfig);
      }
    });

    it('should reject invalid margin threshold', () => {
      // Arrange
      const invalidConfig = {
        margin_threshold: 150, // Invalid: > 100
        action: 'close_position',
        selected_positions: ['pos-123'],
        notifications: { email: true },
        protection_mode: 'unitario',
        real_time_monitoring: true,
        auto_execution: true
      };

      // Act
      const result = MarginGuardConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('margin_threshold');
      }
    });

    it('should reject invalid action type', () => {
      // Arrange
      const invalidConfig = {
        margin_threshold: 85,
        action: 'invalid_action',
        selected_positions: ['pos-123'],
        notifications: { email: true },
        protection_mode: 'unitario',
        real_time_monitoring: true,
        auto_execution: true
      };

      // Act
      const result = MarginGuardConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('action');
      }
    });

    it('should reject empty positions array', () => {
      // Arrange
      const invalidConfig = {
        margin_threshold: 85,
        action: 'close_position',
        selected_positions: [], // Invalid: empty array
        notifications: { email: true },
        protection_mode: 'unitario',
        real_time_monitoring: true,
        auto_execution: true
      };

      // Act
      const result = MarginGuardConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('selected_positions');
      }
    });
  });

  describe('Plan Limitations Validation', () => {
    it('should validate free plan limitations', async () => {
      // Arrange
      const config = {
        margin_threshold: 85,
        action: 'close_position',
        selected_positions: ['pos-123', 'pos-456'],
        notifications: { email: true },
        protection_mode: 'unitario'
      };

      const planFeatures = {
        maxPositions: 2,
        availableModes: ['unitario'],
        availableActions: ['close_position'],
        minThreshold: 70
      };

      // Act
      const result = await validatePlanLimitations('free', config, planFeatures);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it('should reject free plan with too many positions', async () => {
      // Arrange
      const config = {
        margin_threshold: 85,
        action: 'close_position',
        selected_positions: ['pos-123', 'pos-456', 'pos-789'], // 3 positions
        notifications: { email: true },
        protection_mode: 'unitario'
      };

      const planFeatures = {
        maxPositions: 2,
        availableModes: ['unitario'],
        availableActions: ['close_position'],
        minThreshold: 70
      };

      // Act
      const result = await validatePlanLimitations('free', config, planFeatures);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.details.positionCount.exceeded).toBe(true);
    });

    it('should reject free plan with unsupported action', async () => {
      // Arrange
      const config = {
        margin_threshold: 85,
        action: 'add_margin', // Not supported for free plan
        selected_positions: ['pos-123'],
        notifications: { email: true },
        protection_mode: 'unitario'
      };

      const planFeatures = {
        maxPositions: 2,
        availableModes: ['unitario'],
        availableActions: ['close_position'],
        minThreshold: 70
      };

      // Act
      const result = await validatePlanLimitations('free', config, planFeatures);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.details.action.supported).toBe(false);
    });
  });
});
```

### Utility Function Tests

```typescript
// Utility Functions Tests
describe('MarginGuard Utilities', () => {
  describe('calculateCurrentMargin', () => {
    it('should calculate margin for long position with profit', () => {
      // Arrange
      const position = {
        side: 'long' as const,
        quantity: 1000,
        entryPrice: 50000,
        margin: 10000
      };
      const currentPrice = 51000;

      // Act
      const result = calculateCurrentMargin(position, currentPrice);

      // Assert
      expect(result).toBe(11000); // margin + ((currentPrice - entryPrice) * quantity)
    });

    it('should calculate margin for long position with loss', () => {
      // Arrange
      const position = {
        side: 'long' as const,
        quantity: 1000,
        entryPrice: 50000,
        margin: 10000
      };
      const currentPrice = 49000;

      // Act
      const result = calculateCurrentMargin(position, currentPrice);

      // Assert
      expect(result).toBe(9000); // margin + ((currentPrice - entryPrice) * quantity)
    });

    it('should calculate margin for short position with profit', () => {
      // Arrange
      const position = {
        side: 'short' as const,
        quantity: 1000,
        entryPrice: 50000,
        margin: 10000
      };
      const currentPrice = 49000;

      // Act
      const result = calculateCurrentMargin(position, currentPrice);

      // Assert
      expect(result).toBe(11000); // margin + ((entryPrice - currentPrice) * quantity)
    });

    it('should calculate margin for short position with loss', () => {
      // Arrange
      const position = {
        side: 'short' as const,
        quantity: 1000,
        entryPrice: 50000,
        margin: 10000
      };
      const currentPrice = 51000;

      // Act
      const result = calculateCurrentMargin(position, currentPrice);

      // Assert
      expect(result).toBe(9000); // margin + ((entryPrice - currentPrice) * quantity)
    });
  });

  describe('getRiskLevel', () => {
    it('should return critical for margin level >= 95', () => {
      expect(getRiskLevel(95)).toBe('critical');
      expect(getRiskLevel(98)).toBe('critical');
    });

    it('should return high for margin level >= 90', () => {
      expect(getRiskLevel(90)).toBe('high');
      expect(getRiskLevel(94)).toBe('high');
    });

    it('should return medium for margin level >= 80', () => {
      expect(getRiskLevel(80)).toBe('medium');
      expect(getRiskLevel(89)).toBe('medium');
    });

    it('should return low for margin level >= 70', () => {
      expect(getRiskLevel(70)).toBe('low');
      expect(getRiskLevel(79)).toBe('low');
    });

    it('should return safe for margin level < 70', () => {
      expect(getRiskLevel(69)).toBe('safe');
      expect(getRiskLevel(50)).toBe('safe');
    });
  });

  describe('formatMarginLevel', () => {
    it('should format margin level with 2 decimal places', () => {
      expect(formatMarginLevel(85.123456)).toBe('85.12%');
    });

    it('should handle whole numbers', () => {
      expect(formatMarginLevel(85)).toBe('85.00%');
    });

    it('should handle zero', () => {
      expect(formatMarginLevel(0)).toBe('0.00%');
    });
  });
});
```

## Integration Testing

### API Integration Tests

```typescript
// LN Markets API Integration Tests
describe('LN Markets API Integration', () => {
  let apiService: LNMarketsAPIv2;
  let mockCredentials: ExchangeCredentials;

  beforeEach(() => {
    mockCredentials = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret'
    };
    
    apiService = new LNMarketsAPIv2({
      apiKey: mockCredentials.apiKey,
      apiSecret: mockCredentials.apiSecret,
      environment: 'testnet'
    });
  });

  describe('Authentication', () => {
    it('should authenticate successfully with valid credentials', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com'
        }
      };

      jest.spyOn(apiService, 'user').mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.user.getInfo();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('user-123');
    });

    it('should fail authentication with invalid credentials', async () => {
      // Arrange
      const invalidApiService = new LNMarketsAPIv2({
        apiKey: 'invalid-key',
        apiSecret: 'invalid-secret',
        environment: 'testnet'
      });

      const mockResponse = {
        success: false,
        error: 'Invalid API credentials'
      };

      jest.spyOn(invalidApiService, 'user').mockResolvedValue(mockResponse);

      // Act
      const result = await invalidApiService.user.getInfo();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API credentials');
    });
  });

  describe('Positions API', () => {
    it('should fetch positions successfully', async () => {
      // Arrange
      const mockPositions = [
        {
          id: 'pos-123',
          symbol: 'BTCUSD',
          side: 'long',
          quantity: 1000,
          entryPrice: 50000,
          margin: 10000,
          marginLevel: 85
        },
        {
          id: 'pos-456',
          symbol: 'ETHUSD',
          side: 'short',
          quantity: 500,
          entryPrice: 3000,
          margin: 5000,
          marginLevel: 90
        }
      ];

      const mockResponse = {
        success: true,
        data: mockPositions
      };

      jest.spyOn(apiService.futures, 'getPositions').mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.futures.getPositions();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('pos-123');
      expect(result.data[1].id).toBe('pos-456');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockResponse = {
        success: false,
        error: 'Rate limit exceeded'
      };

      jest.spyOn(apiService.futures, 'getPositions').mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.futures.getPositions();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });

  describe('Order Execution', () => {
    it('should close position successfully', async () => {
      // Arrange
      const closePositionRequest = {
        positionId: 'pos-123',
        reason: 'margin_guard_protection'
      };

      const mockResponse = {
        success: true,
        data: {
          orderId: 'order-123',
          status: 'filled',
          executedAt: new Date()
        }
      };

      jest.spyOn(apiService.futures, 'closePosition').mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.futures.closePosition(closePositionRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.orderId).toBe('order-123');
      expect(result.data.status).toBe('filled');
    });

    it('should reduce position successfully', async () => {
      // Arrange
      const reducePositionRequest = {
        positionId: 'pos-123',
        reducePercentage: 50,
        reason: 'margin_guard_protection'
      };

      const mockResponse = {
        success: true,
        data: {
          orderId: 'order-456',
          status: 'filled',
          reducedQuantity: 500,
          executedAt: new Date()
        }
      };

      jest.spyOn(apiService.futures, 'reducePosition').mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.futures.reducePosition(reducePositionRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.orderId).toBe('order-456');
      expect(result.data.reducedQuantity).toBe(500);
    });

    it('should add margin successfully', async () => {
      // Arrange
      const addMarginRequest = {
        positionId: 'pos-123',
        amount: 5000,
        reason: 'margin_guard_protection'
      };

      const mockResponse = {
        success: true,
        data: {
          orderId: 'order-789',
          status: 'filled',
          addedMargin: 5000,
          newMargin: 15000,
          executedAt: new Date()
        }
      };

      jest.spyOn(apiService.futures, 'addMargin').mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.futures.addMargin(addMarginRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.orderId).toBe('order-789');
      expect(result.data.addedMargin).toBe(5000);
      expect(result.data.newMargin).toBe(15000);
    });
  });
});
```

### Database Integration Tests

```typescript
// Database Integration Tests
describe('Margin Guard Database Integration', () => {
  let prisma: PrismaClient;
  let testUser: User;
  let testAutomation: Automation;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        plan: {
          create: {
            type: 'basic',
            name: 'Basic Plan',
            features: {}
          }
        }
      }
    });

    // Create test automation
    testAutomation = await prisma.automation.create({
      data: {
        userId: testUser.id,
        type: 'margin_guard',
        config: {
          margin_threshold: 85,
          action: 'close_position',
          selected_positions: ['pos-123', 'pos-456'],
          notifications: { email: true },
          protection_mode: 'unitario',
          real_time_monitoring: true,
          auto_execution: true
        },
        status: 'active'
      }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.automationLog.deleteMany({
      where: { automationId: testAutomation.id }
    });
    await prisma.automation.delete({
      where: { id: testAutomation.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
  });

  describe('Automation CRUD Operations', () => {
    it('should create automation successfully', async () => {
      // Arrange
      const automationData = {
        userId: testUser.id,
        type: 'margin_guard' as const,
        config: {
          margin_threshold: 80,
          action: 'reduce_position',
          selected_positions: ['pos-789'],
          notifications: { email: true, telegram: true },
          protection_mode: 'unitario',
          real_time_monitoring: true,
          auto_execution: true
        },
        status: 'active' as const
      };

      // Act
      const automation = await prisma.automation.create({
        data: automationData
      });

      // Assert
      expect(automation.id).toBeDefined();
      expect(automation.userId).toBe(testUser.id);
      expect(automation.type).toBe('margin_guard');
      expect(automation.config).toEqual(automationData.config);
      expect(automation.status).toBe('active');

      // Clean up
      await prisma.automation.delete({
        where: { id: automation.id }
      });
    });

    it('should update automation successfully', async () => {
      // Arrange
      const updatedConfig = {
        margin_threshold: 90,
        action: 'add_margin',
        selected_positions: ['pos-123'],
        notifications: { email: true, webhook: true },
        protection_mode: 'total',
        real_time_monitoring: true,
        auto_execution: true
      };

      // Act
      const updatedAutomation = await prisma.automation.update({
        where: { id: testAutomation.id },
        data: { config: updatedConfig }
      });

      // Assert
      expect(updatedAutomation.config).toEqual(updatedConfig);
    });

    it('should delete automation successfully', async () => {
      // Act
      await prisma.automation.delete({
        where: { id: testAutomation.id }
      });

      // Assert
      const deletedAutomation = await prisma.automation.findUnique({
        where: { id: testAutomation.id }
      });
      expect(deletedAutomation).toBeNull();
    });
  });

  describe('Automation Log Operations', () => {
    it('should log execution successfully', async () => {
      // Arrange
      const executionLog = {
        automationId: testAutomation.id,
        userId: testUser.id,
        executionId: 'exec-123',
        status: 'completed' as const,
        details: {
          totalPositions: 2,
          positionsRequiringAction: 1,
          successfulExecutions: 1,
          failedExecutions: 0
        },
        result: {
          actionsExecuted: [
            {
              positionId: 'pos-123',
              action: 'close_position',
              success: true,
              orderId: 'order-123'
            }
          ]
        },
        executedAt: new Date()
      };

      // Act
      const log = await prisma.automationLog.create({
        data: executionLog
      });

      // Assert
      expect(log.id).toBeDefined();
      expect(log.automationId).toBe(testAutomation.id);
      expect(log.userId).toBe(testUser.id);
      expect(log.status).toBe('completed');
      expect(log.details).toEqual(executionLog.details);
      expect(log.result).toEqual(executionLog.result);
    });

    it('should log error successfully', async () => {
      // Arrange
      const errorLog = {
        automationId: testAutomation.id,
        userId: testUser.id,
        executionId: 'exec-456',
        status: 'failed' as const,
        error: 'API connection failed',
        executedAt: new Date()
      };

      // Act
      const log = await prisma.automationLog.create({
        data: errorLog
      });

      // Assert
      expect(log.id).toBeDefined();
      expect(log.automationId).toBe(testAutomation.id);
      expect(log.userId).toBe(testUser.id);
      expect(log.status).toBe('failed');
      expect(log.error).toBe('API connection failed');
    });

    it('should query execution history successfully', async () => {
      // Arrange
      const logs = [
        {
          automationId: testAutomation.id,
          userId: testUser.id,
          executionId: 'exec-1',
          status: 'completed' as const,
          executedAt: new Date(Date.now() - 1000)
        },
        {
          automationId: testAutomation.id,
          userId: testUser.id,
          executionId: 'exec-2',
          status: 'failed' as const,
          error: 'API error',
          executedAt: new Date(Date.now() - 2000)
        }
      ];

      await prisma.automationLog.createMany({
        data: logs
      });

      // Act
      const executionHistory = await prisma.automationLog.findMany({
        where: { automationId: testAutomation.id },
        orderBy: { executedAt: 'desc' }
      });

      // Assert
      expect(executionHistory).toHaveLength(2);
      expect(executionHistory[0].executionId).toBe('exec-1');
      expect(executionHistory[1].executionId).toBe('exec-2');
    });
  });
});
```

## End-to-End Testing

### Workflow Tests

```typescript
// End-to-End Workflow Tests
describe('Margin Guard E2E Workflows', () => {
  let testServer: FastifyInstance;
  let testUser: User;
  let testAutomation: Automation;
  let authToken: string;

  beforeAll(async () => {
    testServer = await createTestServer();
    await testServer.ready();
  });

  afterAll(async () => {
    await testServer.close();
  });

  beforeEach(async () => {
    // Create test user and get auth token
    testUser = await createTestUser();
    authToken = await getAuthToken(testUser);

    // Create test automation
    testAutomation = await createTestAutomation(testUser.id);
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData(testUser.id);
  });

  describe('Complete Margin Guard Workflow', () => {
    it('should execute complete margin guard workflow', async () => {
      // Step 1: Create automation
      const createResponse = await testServer.inject({
        method: 'POST',
        url: '/api/automations',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          type: 'margin_guard',
          config: {
            margin_threshold: 85,
            action: 'close_position',
            selected_positions: ['pos-123', 'pos-456'],
            notifications: {
              email: true,
              telegram: false,
              webhook: false,
              sms: false
            },
            protection_mode: 'unitario',
            real_time_monitoring: true,
            auto_execution: true
          }
        }
      });

      expect(createResponse.statusCode).toBe(201);
      const automation = JSON.parse(createResponse.payload);

      // Step 2: Verify automation was created
      const getResponse = await testServer.inject({
        method: 'GET',
        url: `/api/automations/${automation.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(getResponse.statusCode).toBe(200);
      const retrievedAutomation = JSON.parse(getResponse.payload);
      expect(retrievedAutomation.config.margin_threshold).toBe(85);

      // Step 3: Trigger execution (simulate threshold breach)
      const executionResponse = await testServer.inject({
        method: 'POST',
        url: `/api/automations/${automation.id}/execute`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(executionResponse.statusCode).toBe(200);
      const executionResult = JSON.parse(executionResponse.payload);
      expect(executionResult.executionId).toBeDefined();

      // Step 4: Check execution logs
      const logsResponse = await testServer.inject({
        method: 'GET',
        url: `/api/automations/${automation.id}/logs`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(logsResponse.statusCode).toBe(200);
      const logs = JSON.parse(logsResponse.payload);
      expect(logs).toHaveLength(1);
      expect(logs[0].executionId).toBe(executionResult.executionId);

      // Step 5: Update automation
      const updateResponse = await testServer.inject({
        method: 'PUT',
        url: `/api/automations/${automation.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          config: {
            margin_threshold: 90,
            action: 'reduce_position',
            selected_positions: ['pos-123'],
            notifications: {
              email: true,
              telegram: true,
              webhook: false,
              sms: false
            },
            protection_mode: 'unitario',
            real_time_monitoring: true,
            auto_execution: true
          }
        }
      });

      expect(updateResponse.statusCode).toBe(200);
      const updatedAutomation = JSON.parse(updateResponse.payload);
      expect(updatedAutomation.config.margin_threshold).toBe(90);

      // Step 6: Delete automation
      const deleteResponse = await testServer.inject({
        method: 'DELETE',
        url: `/api/automations/${automation.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(deleteResponse.statusCode).toBe(204);

      // Step 7: Verify automation was deleted
      const getDeletedResponse = await testServer.inject({
        method: 'GET',
        url: `/api/automations/${automation.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(getDeletedResponse.statusCode).toBe(404);
    });

    it('should handle plan limitations in workflow', async () => {
      // Step 1: Try to create automation with too many positions for free plan
      const createResponse = await testServer.inject({
        method: 'POST',
        url: '/api/automations',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          type: 'margin_guard',
          config: {
            margin_threshold: 85,
            action: 'close_position',
            selected_positions: ['pos-1', 'pos-2', 'pos-3'], // 3 positions for free plan
            notifications: { email: true },
            protection_mode: 'unitario',
            real_time_monitoring: true,
            auto_execution: true
          }
        }
      });

      expect(createResponse.statusCode).toBe(400);
      const error = JSON.parse(createResponse.payload);
      expect(error.message).toContain('Plan limitations exceeded');

      // Step 2: Create automation with valid configuration
      const validCreateResponse = await testServer.inject({
        method: 'POST',
        url: '/api/automations',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          type: 'margin_guard',
          config: {
            margin_threshold: 85,
            action: 'close_position',
            selected_positions: ['pos-1', 'pos-2'], // 2 positions for free plan
            notifications: { email: true },
            protection_mode: 'unitario',
            real_time_monitoring: true,
            auto_execution: true
          }
        }
      });

      expect(validCreateResponse.statusCode).toBe(201);
    });

    it('should handle execution failures gracefully', async () => {
      // Step 1: Create automation
      const createResponse = await testServer.inject({
        method: 'POST',
        url: '/api/automations',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          type: 'margin_guard',
          config: {
            margin_threshold: 85,
            action: 'close_position',
            selected_positions: ['pos-123'],
            notifications: { email: true },
            protection_mode: 'unitario',
            real_time_monitoring: true,
            auto_execution: true
          }
        }
      });

      const automation = JSON.parse(createResponse.payload);

      // Step 2: Mock API failure
      jest.spyOn(LNMarketsAPIv2.prototype, 'futures').mockImplementation(() => ({
        getPositions: jest.fn().mockResolvedValue({
          success: false,
          error: 'API connection failed'
        })
      }));

      // Step 3: Trigger execution
      const executionResponse = await testServer.inject({
        method: 'POST',
        url: `/api/automations/${automation.id}/execute`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(executionResponse.statusCode).toBe(200);
      const executionResult = JSON.parse(executionResponse.payload);
      expect(executionResult.success).toBe(false);
      expect(executionResult.error).toContain('API connection failed');

      // Step 4: Check error logs
      const logsResponse = await testServer.inject({
        method: 'GET',
        url: `/api/automations/${automation.id}/logs`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      const logs = JSON.parse(logsResponse.payload);
      expect(logs[0].status).toBe('failed');
      expect(logs[0].error).toContain('API connection failed');
    });
  });
});
```

## Performance Testing

### Load Testing

```typescript
// Performance Tests
describe('Margin Guard Performance', () => {
  let testServer: FastifyInstance;
  let testUsers: User[];
  let testAutomations: Automation[];

  beforeAll(async () => {
    testServer = await createTestServer();
    await testServer.ready();

    // Create test users and automations
    testUsers = await createMultipleTestUsers(100);
    testAutomations = await createMultipleTestAutomations(testUsers, 100);
  });

  afterAll(async () => {
    await testServer.close();
    await cleanupTestData();
  });

  describe('Concurrent Execution Performance', () => {
    it('should handle 100 concurrent executions', async () => {
      // Arrange
      const executionPromises = testAutomations.map(async (automation, index) => {
        const authToken = await getAuthToken(testUsers[index]);
        return testServer.inject({
          method: 'POST',
          url: `/api/automations/${automation.id}/execute`,
          headers: {
            authorization: `Bearer ${authToken}`
          }
        });
      });

      // Act
      const startTime = Date.now();
      const responses = await Promise.all(executionPromises);
      const endTime = Date.now();

      // Assert
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds

      const successfulResponses = responses.filter(r => r.statusCode === 200);
      expect(successfulResponses.length).toBeGreaterThan(90); // At least 90% success rate
    });

    it('should handle high-frequency executions', async () => {
      // Arrange
      const automation = testAutomations[0];
      const authToken = await getAuthToken(testUsers[0]);
      const executionPromises = [];

      // Act
      const startTime = Date.now();
      for (let i = 0; i < 50; i++) {
        executionPromises.push(
          testServer.inject({
            method: 'POST',
            url: `/api/automations/${automation.id}/execute`,
            headers: {
              authorization: `Bearer ${authToken}`
            }
          })
        );
      }

      const responses = await Promise.all(executionPromises);
      const endTime = Date.now();

      // Assert
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(15000); // Should complete within 15 seconds

      const successfulResponses = responses.filter(r => r.statusCode === 200);
      expect(successfulResponses.length).toBeGreaterThan(45); // At least 90% success rate
    });
  });

  describe('Database Performance', () => {
    it('should handle large number of automation logs', async () => {
      // Arrange
      const automation = testAutomations[0];
      const authToken = await getAuthToken(testUsers[0]);
      const logPromises = [];

      // Act
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        logPromises.push(
          testServer.inject({
            method: 'POST',
            url: `/api/automations/${automation.id}/execute`,
            headers: {
              authorization: `Bearer ${authToken}`
            }
          })
        );
      }

      await Promise.all(logPromises);
      const endTime = Date.now();

      // Assert
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(60000); // Should complete within 60 seconds

      // Verify logs were created
      const logsResponse = await testServer.inject({
        method: 'GET',
        url: `/api/automations/${automation.id}/logs`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      const logs = JSON.parse(logsResponse.payload);
      expect(logs.length).toBeGreaterThan(900); // At least 90% of logs created
    });
  });
});
```

### Memory and Resource Testing

```typescript
// Resource Usage Tests
describe('Margin Guard Resource Usage', () => {
  let testServer: FastifyInstance;

  beforeAll(async () => {
    testServer = await createTestServer();
    await testServer.ready();
  });

  afterAll(async () => {
    await testServer.close();
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks during long execution', async () => {
      // Arrange
      const initialMemory = process.memoryUsage();
      const testUser = await createTestUser();
      const authToken = await getAuthToken(testUser);
      const automation = await createTestAutomation(testUser.id);

      // Act
      for (let i = 0; i < 100; i++) {
        await testServer.inject({
          method: 'POST',
          url: `/api/automations/${automation.id}/execute`,
          headers: {
            authorization: `Bearer ${authToken}`
          }
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();

      // Assert
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase

      // Clean up
      await cleanupTestData(testUser.id);
    });

    it('should handle large position datasets efficiently', async () => {
      // Arrange
      const testUser = await createTestUser();
      const authToken = await getAuthToken(testUser);
      const automation = await createTestAutomation(testUser.id, {
        selected_positions: Array.from({ length: 1000 }, (_, i) => `pos-${i}`)
      });

      // Act
      const startTime = Date.now();
      const response = await testServer.inject({
        method: 'POST',
        url: `/api/automations/${automation.id}/execute`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });
      const endTime = Date.now();

      // Assert
      expect(response.statusCode).toBe(200);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Clean up
      await cleanupTestData(testUser.id);
    });
  });

  describe('CPU Usage', () => {
    it('should not consume excessive CPU during execution', async () => {
      // Arrange
      const testUser = await createTestUser();
      const authToken = await getAuthToken(testUser);
      const automation = await createTestAutomation(testUser.id);

      // Act
      const startCpuUsage = process.cpuUsage();
      const startTime = Date.now();

      await testServer.inject({
        method: 'POST',
        url: `/api/automations/${automation.id}/execute`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      const endTime = Date.now();
      const endCpuUsage = process.cpuUsage(startCpuUsage);

      // Assert
      const executionTime = endTime - startTime;
      const cpuTime = endCpuUsage.user + endCpuUsage.system;
      const cpuPercentage = (cpuTime / (executionTime * 1000)) * 100;

      expect(cpuPercentage).toBeLessThan(50); // Should not use more than 50% CPU

      // Clean up
      await cleanupTestData(testUser.id);
    });
  });
});
```

## Test Utilities and Helpers

### Test Data Factories

```typescript
// Test Data Factories
export class TestDataFactory {
  static createTestUser(overrides: Partial<User> = {}): Partial<User> {
    return {
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      plan: {
        type: 'free',
        name: 'Free Plan',
        features: {}
      },
      ...overrides
    };
  }

  static createTestAutomation(overrides: Partial<Automation> = {}): Partial<Automation> {
    return {
      type: 'margin_guard',
      config: {
        margin_threshold: 85,
        action: 'close_position',
        selected_positions: ['pos-123', 'pos-456'],
        notifications: {
          email: true,
          telegram: false,
          webhook: false,
          sms: false
        },
        protection_mode: 'unitario',
        real_time_monitoring: true,
        auto_execution: true
      },
      status: 'active',
      ...overrides
    };
  }

  static createTestPosition(overrides: Partial<Position> = {}): Partial<Position> {
    return {
      id: `pos-${Date.now()}`,
      symbol: 'BTCUSD',
      side: 'long',
      quantity: 1000,
      entryPrice: 50000,
      margin: 10000,
      marginLevel: 85,
      ...overrides
    };
  }

  static createTestExecutionLog(overrides: Partial<AutomationLog> = {}): Partial<AutomationLog> {
    return {
      executionId: `exec-${Date.now()}`,
      status: 'completed',
      details: {
        totalPositions: 2,
        positionsRequiringAction: 1,
        successfulExecutions: 1,
        failedExecutions: 0
      },
      result: {
        actionsExecuted: [
          {
            positionId: 'pos-123',
            action: 'close_position',
            success: true,
            orderId: 'order-123'
          }
        ]
      },
      executedAt: new Date(),
      ...overrides
    };
  }
}

// Test Server Factory
export class TestServerFactory {
  static async createTestServer(): Promise<FastifyInstance> {
    const server = fastify({
      logger: false
    });

    // Register plugins
    await server.register(require('@fastify/cors'));
    await server.register(require('@fastify/jwt'), {
      secret: 'test-secret'
    });

    // Register routes
    await server.register(require('../src/routes/automations'), { prefix: '/api' });
    await server.register(require('../src/routes/margin-guard'), { prefix: '/api' });

    return server;
  }
}

// Mock Factories
export class MockFactory {
  static createMockPrisma(): jest.Mocked<PrismaClient> {
    return {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any,
      automation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any,
      automationLog: {
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn()
      } as any,
      $disconnect: jest.fn()
    } as any;
  }

  static createMockLNMarketsAPI(): jest.Mocked<LNMarketsAPIv2> {
    return {
      user: {
        getInfo: jest.fn(),
        getBalance: jest.fn(),
        getPermissions: jest.fn()
      },
      futures: {
        getPositions: jest.fn(),
        closePosition: jest.fn(),
        reducePosition: jest.fn(),
        addMargin: jest.fn(),
        increaseLiquidationDistance: jest.fn()
      },
      market: {
        getCurrentPrice: jest.fn(),
        getOrderBook: jest.fn()
      }
    } as any;
  }

  static createMockPlanLimitsService(): jest.Mocked<PlanLimitsService> {
    return {
      getMarginGuardFeatures: jest.fn(),
      validateMarginGuardConfig: jest.fn(),
      getMinThresholdByPlan: jest.fn(),
      getMaxMarginPercentageByPlan: jest.fn()
    } as any;
  }
}
```

### Test Configuration

```typescript
// Test Configuration
export const testConfig = {
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/axisor_test',
    maxConnections: 5
  },
  redis: {
    url: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1'
  },
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 30000
  },
  test: {
    timeout: 60000,
    retries: 3,
    parallel: true,
    maxConcurrent: 10
  }
};

// Test Environment Setup
export async function setupTestEnvironment(): Promise<void> {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testConfig.database.url;
  process.env.REDIS_URL = testConfig.redis.url;

  // Initialize test database
  await initializeTestDatabase();

  // Initialize test Redis
  await initializeTestRedis();
}

export async function teardownTestEnvironment(): Promise<void> {
  // Clean up test database
  await cleanupTestDatabase();

  // Clean up test Redis
  await cleanupTestRedis();
}

// Test Database Utilities
export async function initializeTestDatabase(): Promise<void> {
  const prisma = new PrismaClient();
  await prisma.$connect();
  await prisma.$disconnect();
}

export async function cleanupTestDatabase(): Promise<void> {
  const prisma = new PrismaClient();
  await prisma.$connect();
  
  // Clean up test data
  await prisma.automationLog.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.user.deleteMany();
  
  await prisma.$disconnect();
}

// Test Redis Utilities
export async function initializeTestRedis(): Promise<void> {
  const redis = new Redis(testConfig.redis.url);
  await redis.ping();
  await redis.disconnect();
}

export async function cleanupTestRedis(): Promise<void> {
  const redis = new Redis(testConfig.redis.url);
  await redis.flushdb();
  await redis.disconnect();
}
```

## How to Use This Document

- **For Unit Testing**: Use the service layer and utility function tests as examples
- **For Integration Testing**: Follow the API and database integration test patterns
- **For E2E Testing**: Implement the complete workflow tests for user scenarios
- **For Performance Testing**: Use the load and resource testing examples
- **For Test Setup**: Use the test utilities and configuration for consistent testing

