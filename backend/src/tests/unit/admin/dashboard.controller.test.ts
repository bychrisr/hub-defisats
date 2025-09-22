import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FastifyRequest, FastifyReply } from 'fastify';
import { getDashboardMetrics } from '../../../controllers/admin/dashboard.controller';
import { prisma } from '../../../lib/prisma';

// Mock do Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
    },
    trade: {
      count: jest.fn(),
    },
  },
}));

// Mock da função getSystemUptime
jest.mock('../../../utils/system', () => ({
  getSystemUptime: jest.fn(() => 2592000), // 30 dias em segundos
}));

describe('Admin Dashboard Controller', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {};
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics successfully', async () => {
      // Arrange
      const mockData = {
        totalUsers: 100,
        activeUsers: 50,
        monthlyRevenue: { _sum: { amount: 5000 } },
        totalTrades: 1000,
      };

      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(mockData.totalUsers)
        .mockResolvedValueOnce(mockData.activeUsers);
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue(mockData.monthlyRevenue);
      (prisma.trade.count as jest.Mock).mockResolvedValue(mockData.totalTrades);

      // Act
      const result = await getDashboardMetrics(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(result).toEqual({
        totalUsers: 100,
        activeUsers: 50,
        monthlyRevenue: 5000,
        totalTrades: 1000,
        systemUptime: 2592000,
        uptimePercentage: 100,
      });
      expect(prisma.user.count).toHaveBeenCalledTimes(2);
      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        where: {
          status: 'completed',
          created_at: {
            gte: expect.any(Date),
          },
        },
        _sum: { amount: true },
      });
      expect(prisma.trade.count).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      (prisma.user.count as jest.Mock).mockRejectedValue(error);

      // Act
      await getDashboardMetrics(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Failed to fetch dashboard metrics',
      });
    });

    it('should handle null monthly revenue', async () => {
      // Arrange
      const mockData = {
        totalUsers: 100,
        activeUsers: 50,
        monthlyRevenue: { _sum: { amount: null } },
        totalTrades: 1000,
      };

      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(mockData.totalUsers)
        .mockResolvedValueOnce(mockData.activeUsers);
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue(mockData.monthlyRevenue);
      (prisma.trade.count as jest.Mock).mockResolvedValue(mockData.totalTrades);

      // Act
      const result = await getDashboardMetrics(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(result).toEqual({
        totalUsers: 100,
        activeUsers: 50,
        monthlyRevenue: 0,
        totalTrades: 1000,
        systemUptime: 2592000,
        uptimePercentage: 100,
      });
    });
  });
});
