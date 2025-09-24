import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TradingConfirmationService, ConfirmationRequest } from '../services/trading-confirmation.service';
import { LNMarketsService } from '../services/lnmarkets.service';
import { TradingValidationService } from '../services/trading-validation.service';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    orderConfirmation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

describe('TradingConfirmationService Tests', () => {
  let confirmationService: TradingConfirmationService;
  let mockLNMarketsService: any;
  let mockValidationService: any;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock services
    mockLNMarketsService = {
      createTrade: jest.fn(),
      updateTakeProfit: jest.fn(),
      updateStopLoss: jest.fn(),
      closePosition: jest.fn(),
    };

    mockValidationService = {
      validateTrade: jest.fn(),
      validatePositionUpdate: jest.fn(),
    };

    // Mock Prisma
    mockPrisma = {
      orderConfirmation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    // Mock the PrismaClient constructor
    const { PrismaClient } = require('@prisma/client');
    PrismaClient.mockImplementation(() => mockPrisma);
    
    // Ensure the mock is properly set up
    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
    }));

    confirmationService = new TradingConfirmationService(mockLNMarketsService, mockValidationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Create Confirmation', () => {
    it('should create a trade confirmation successfully', async () => {
      const request: ConfirmationRequest = {
        userId: 'user_123',
        orderType: 'trade',
        tradeParams: {
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          leverage: 10,
        },
        expiresInMinutes: 5,
      };

      mockValidationService.validateTrade.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      const mockConfirmation = {
        id: 'order_123',
        userId: 'user_123',
        orderType: 'trade',
        status: 'pending',
        tradeParams: JSON.stringify(request.tradeParams),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.create.mockResolvedValue(mockConfirmation);

      const result = await confirmationService.createConfirmation(request);

      expect(result).toBeDefined();
      expect(result.id).toBe('order_123');
      expect(result.userId).toBe('user_123');
      expect(result.orderType).toBe('trade');
      expect(result.status).toBe('pending');
      expect(result.tradeParams).toEqual(request.tradeParams);
      expect(mockValidationService.validateTrade).toHaveBeenCalledWith(request.tradeParams);
    });

    it('should create an update confirmation successfully', async () => {
      const request: ConfirmationRequest = {
        userId: 'user_123',
        orderType: 'update_tp',
        tradeId: 'trade_456',
        updateValue: 55000,
        expiresInMinutes: 3,
      };

      const mockConfirmation = {
        id: 'order_456',
        userId: 'user_123',
        orderType: 'update_tp',
        status: 'pending',
        tradeParams: null,
        tradeId: 'trade_456',
        updateValue: 55000,
        confirmationToken: 'token_456',
        expiresAt: new Date(Date.now() + 3 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.create.mockResolvedValue(mockConfirmation);

      const result = await confirmationService.createConfirmation(request);

      expect(result).toBeDefined();
      expect(result.id).toBe('order_456');
      expect(result.orderType).toBe('update_tp');
      expect(result.tradeId).toBe('trade_456');
      expect(result.updateValue).toBe(55000);
    });

    it('should reject invalid trade parameters', async () => {
      const request: ConfirmationRequest = {
        userId: 'user_123',
        orderType: 'trade',
        tradeParams: {
          market: 'btcusd',
          side: 'b',
          quantity: 0, // Invalid quantity
          leverage: 10,
        },
      };

      mockValidationService.validateTrade.mockResolvedValue({
        isValid: false,
        errors: ['Quantity must be greater than 0'],
        warnings: [],
      });

      await expect(confirmationService.createConfirmation(request)).rejects.toThrow(
        'Trade validation failed: Quantity must be greater than 0'
      );
    });
  });

  describe('Confirm Order', () => {
    it('should confirm a trade order successfully', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'pending',
        tradeParams: JSON.stringify({
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          leverage: 10,
        }),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);
      mockLNMarketsService.createTrade.mockResolvedValue({
        id: 'trade_789',
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
        price: 50000,
      });

      const updatedConfirmation = {
        ...mockConfirmation,
        status: 'confirmed',
        confirmedAt: new Date(),
      };

      mockPrisma.orderConfirmation.update.mockResolvedValue(updatedConfirmation);

      const result = await confirmationService.confirmOrder(orderId);

      expect(result.status).toBe('confirmed');
      expect(result.confirmedAt).toBeDefined();
      expect(mockLNMarketsService.createTrade).toHaveBeenCalledWith({
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
      });
    });

    it('should confirm a take profit update successfully', async () => {
      const orderId = 'order_456';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'update_tp',
        status: 'pending',
        tradeParams: null,
        tradeId: 'trade_789',
        updateValue: 55000,
        confirmationToken: 'token_456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);
      mockLNMarketsService.updateTakeProfit.mockResolvedValue({
        success: true,
        tradeId: 'trade_789',
        takeProfit: 55000,
        timestamp: new Date().toISOString(),
      });

      const updatedConfirmation = {
        ...mockConfirmation,
        status: 'confirmed',
        confirmedAt: new Date(),
      };

      mockPrisma.orderConfirmation.update.mockResolvedValue(updatedConfirmation);

      const result = await confirmationService.confirmOrder(orderId);

      expect(result.status).toBe('confirmed');
      expect(mockLNMarketsService.updateTakeProfit).toHaveBeenCalledWith('trade_789', 55000);
    });

    it('should reject confirmation for non-pending order', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'confirmed', // Already confirmed
        tradeParams: JSON.stringify({}),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);

      await expect(confirmationService.confirmOrder(orderId)).rejects.toThrow(
        'Order is already confirmed'
      );
    });

    it('should reject confirmation for expired order', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'pending',
        tradeParams: JSON.stringify({}),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);
      mockPrisma.orderConfirmation.update.mockResolvedValue({
        ...mockConfirmation,
        status: 'expired',
        rejectedAt: new Date(),
        rejectionReason: 'Order expired',
      });

      await expect(confirmationService.confirmOrder(orderId)).rejects.toThrow(
        'Order confirmation has expired'
      );
    });

    it('should reject confirmation with invalid token', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'pending',
        tradeParams: JSON.stringify({}),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);

      await expect(confirmationService.confirmOrder(orderId, 'invalid_token')).rejects.toThrow(
        'Invalid confirmation token'
      );
    });

    it('should handle API errors during confirmation', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'pending',
        tradeParams: JSON.stringify({
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          leverage: 10,
        }),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);
      mockLNMarketsService.createTrade.mockRejectedValue(new Error('API Error'));

      const rejectedConfirmation = {
        ...mockConfirmation,
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: 'API Error',
      };

      mockPrisma.orderConfirmation.update.mockResolvedValue(rejectedConfirmation);

      await expect(confirmationService.confirmOrder(orderId)).rejects.toThrow('API Error');
    });
  });

  describe('Cancel Order', () => {
    it('should cancel a pending order successfully', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'pending',
        tradeParams: JSON.stringify({}),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);

      const cancelledConfirmation = {
        ...mockConfirmation,
        status: 'cancelled',
        rejectedAt: new Date(),
        rejectionReason: 'Cancelled by user',
      };

      mockPrisma.orderConfirmation.update.mockResolvedValue(cancelledConfirmation);

      const result = await confirmationService.cancelOrder(orderId);

      expect(result.status).toBe('cancelled');
      expect(result.rejectionReason).toBe('Cancelled by user');
    });

    it('should reject cancellation for non-pending order', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'confirmed',
        tradeParams: JSON.stringify({}),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);

      await expect(confirmationService.cancelOrder(orderId)).rejects.toThrow(
        'Order is already confirmed'
      );
    });
  });

  describe('Get Order Status', () => {
    it('should get order status successfully', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'pending',
        tradeParams: JSON.stringify({
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          leverage: 10,
        }),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);

      const result = await confirmationService.getOrderStatus(orderId);

      expect(result).toBeDefined();
      expect(result.id).toBe(orderId);
      expect(result.status).toBe('pending');
      expect(result.tradeParams).toEqual({
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
      });
    });

    it('should throw error for non-existent order', async () => {
      const orderId = 'nonexistent_order';
      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(null);

      await expect(confirmationService.getOrderStatus(orderId)).rejects.toThrow(
        'Order confirmation not found'
      );
    });
  });

  describe('Bulk Operations', () => {
    it('should confirm bulk orders successfully', async () => {
      const orderIds = ['order_1', 'order_2', 'order_3'];

      // Mock successful confirmations
      mockPrisma.orderConfirmation.findUnique
        .mockResolvedValueOnce({
          id: 'order_1',
          userId: 'user_123',
          orderType: 'trade',
          status: 'pending',
          tradeParams: JSON.stringify({}),
          tradeId: null,
          updateValue: null,
          confirmationToken: 'token_1',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          createdAt: new Date(),
          confirmedAt: null,
          rejectedAt: null,
          rejectionReason: null,
        })
        .mockResolvedValueOnce({
          id: 'order_2',
          userId: 'user_123',
          orderType: 'trade',
          status: 'pending',
          tradeParams: JSON.stringify({}),
          tradeId: null,
          updateValue: null,
          confirmationToken: 'token_2',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          createdAt: new Date(),
          confirmedAt: null,
          rejectedAt: null,
          rejectionReason: null,
        })
        .mockResolvedValueOnce({
          id: 'order_3',
          userId: 'user_123',
          orderType: 'trade',
          status: 'pending',
          tradeParams: JSON.stringify({}),
          tradeId: null,
          updateValue: null,
          confirmationToken: 'token_3',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          createdAt: new Date(),
          confirmedAt: null,
          rejectedAt: null,
          rejectionReason: null,
        });

      mockLNMarketsService.createTrade.mockResolvedValue({ id: 'trade_123' });

      mockPrisma.orderConfirmation.update.mockResolvedValue({
        status: 'confirmed',
        confirmedAt: new Date(),
      });

      const result = await confirmationService.confirmBulkOrders(orderIds);

      expect(result.confirmedOrders).toHaveLength(3);
      expect(result.failedOrders).toHaveLength(0);
      expect(result.totalConfirmed).toBe(3);
      expect(result.totalFailed).toBe(0);
    });

    it('should handle partial bulk confirmation failures', async () => {
      const orderIds = ['order_1', 'order_2', 'order_3'];

      // Mock one success, one failure, one not found
      mockPrisma.orderConfirmation.findUnique
        .mockResolvedValueOnce({
          id: 'order_1',
          userId: 'user_123',
          orderType: 'trade',
          status: 'pending',
          tradeParams: JSON.stringify({}),
          tradeId: null,
          updateValue: null,
          confirmationToken: 'token_1',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          createdAt: new Date(),
          confirmedAt: null,
          rejectedAt: null,
          rejectionReason: null,
        })
        .mockResolvedValueOnce({
          id: 'order_2',
          userId: 'user_123',
          orderType: 'trade',
          status: 'confirmed', // Already confirmed
          tradeParams: JSON.stringify({}),
          tradeId: null,
          updateValue: null,
          confirmationToken: 'token_2',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          createdAt: new Date(),
          confirmedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null,
        })
        .mockResolvedValueOnce(null); // Not found

      mockLNMarketsService.createTrade.mockResolvedValue({ id: 'trade_123' });
      mockPrisma.orderConfirmation.update.mockResolvedValue({
        status: 'confirmed',
        confirmedAt: new Date(),
      });

      const result = await confirmationService.confirmBulkOrders(orderIds);

      expect(result.confirmedOrders).toHaveLength(1);
      expect(result.failedOrders).toHaveLength(2);
      expect(result.totalConfirmed).toBe(1);
      expect(result.totalFailed).toBe(2);
    });
  });

  describe('Auto-cancel Expired Orders', () => {
    it('should auto-cancel expired orders', async () => {
      const expiredOrders = [
        {
          id: 'order_1',
          userId: 'user_123',
          orderType: 'trade',
          status: 'pending',
          tradeParams: JSON.stringify({}),
          tradeId: null,
          updateValue: null,
          confirmationToken: 'token_1',
          expiresAt: new Date(Date.now() - 1000), // Expired
          createdAt: new Date(),
          confirmedAt: null,
          rejectedAt: null,
          rejectionReason: null,
        },
        {
          id: 'order_2',
          userId: 'user_123',
          orderType: 'trade',
          status: 'pending',
          tradeParams: JSON.stringify({}),
          tradeId: null,
          updateValue: null,
          confirmationToken: 'token_2',
          expiresAt: new Date(Date.now() - 2000), // Expired
          createdAt: new Date(),
          confirmedAt: null,
          rejectedAt: null,
          rejectionReason: null,
        },
      ];

      mockPrisma.orderConfirmation.findMany.mockResolvedValue(expiredOrders);
      mockPrisma.orderConfirmation.update.mockResolvedValue({
        status: 'expired',
        rejectedAt: new Date(),
        rejectionReason: 'Order expired',
      });

      const result = await confirmationService.autoCancelExpiredOrders();

      expect(result).toBe(2);
      expect(mockPrisma.orderConfirmation.findMany).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe('Confirm Order with Retry', () => {
    it('should retry confirmation on API errors', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'pending',
        tradeParams: JSON.stringify({
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          leverage: 10,
        }),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);

      // First call fails, second call succeeds
      mockLNMarketsService.createTrade
        .mockRejectedValueOnce(new Error('Temporary API Error'))
        .mockResolvedValueOnce({ id: 'trade_123' });

      const updatedConfirmation = {
        ...mockConfirmation,
        status: 'confirmed',
        confirmedAt: new Date(),
      };

      mockPrisma.orderConfirmation.update.mockResolvedValue(updatedConfirmation);

      const result = await confirmationService.confirmOrderWithRetry(orderId, 2);

      expect(result.status).toBe('confirmed');
      expect(mockLNMarketsService.createTrade).toHaveBeenCalledTimes(2);
    });

    it('should not retry for certain types of errors', async () => {
      const orderId = 'order_123';
      const mockConfirmation = {
        id: orderId,
        userId: 'user_123',
        orderType: 'trade',
        status: 'pending',
        tradeParams: JSON.stringify({}),
        tradeId: null,
        updateValue: null,
        confirmationToken: 'token_123',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        confirmedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      mockPrisma.orderConfirmation.findUnique.mockResolvedValue(mockConfirmation);
      mockLNMarketsService.createTrade.mockRejectedValue(new Error('Trade not found'));

      await expect(confirmationService.confirmOrderWithRetry(orderId, 3)).rejects.toThrow(
        'Trade not found'
      );

      // Should only be called once, not retried
      expect(mockLNMarketsService.createTrade).toHaveBeenCalledTimes(1);
    });
  });
});
