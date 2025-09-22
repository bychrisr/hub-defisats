import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FastifyRequest, FastifyReply } from 'fastify';
import { getTradeLogs } from '../../../controllers/admin/trade-logs.controller';
import { prisma } from '../../../lib/prisma';

// Mock do Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    tradeLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Admin Trade Logs Controller', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      query: {
        search: '',
        status: '',
        action: '',
        planType: '',
        startDate: '',
        endDate: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
        page: '1',
        limit: '10',
      },
    };
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTradeLogs', () => {
    it('should return trade logs successfully', async () => {
      // Arrange
      const mockTradeLogs = [
        {
          id: '1',
          user_id: 'user1',
          action: 'buy',
          symbol: 'BTCUSD',
          amount: 1000,
          price: 50000,
          status: 'completed',
          pnl: 100,
          created_at: new Date(),
          user: {
            id: 'user1',
            username: 'user1',
            email: 'user1@example.com',
            plan_type: 'premium',
          },
        },
      ];

      (prisma.tradeLog.findMany as jest.Mock).mockResolvedValue(mockTradeLogs);
      (prisma.tradeLog.count as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await getTradeLogs(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(result).toEqual({
        tradeLogs: mockTradeLogs,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should handle status filter', async () => {
      // Arrange
      mockRequest.query = {
        ...mockRequest.query,
        status: 'completed',
      };

      (prisma.tradeLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tradeLog.count as jest.Mock).mockResolvedValue(0);

      // Act
      await getTradeLogs(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(prisma.tradeLog.findMany).toHaveBeenCalledWith({
        where: {
          status: 'completed',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              plan_type: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle action filter', async () => {
      // Arrange
      mockRequest.query = {
        ...mockRequest.query,
        action: 'buy',
      };

      (prisma.tradeLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tradeLog.count as jest.Mock).mockResolvedValue(0);

      // Act
      await getTradeLogs(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(prisma.tradeLog.findMany).toHaveBeenCalledWith({
        where: {
          action: 'buy',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              plan_type: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle date range filter', async () => {
      // Arrange
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      mockRequest.query = {
        ...mockRequest.query,
        startDate,
        endDate,
      };

      (prisma.tradeLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tradeLog.count as jest.Mock).mockResolvedValue(0);

      // Act
      await getTradeLogs(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(prisma.tradeLog.findMany).toHaveBeenCalledWith({
        where: {
          created_at: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              plan_type: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle search filter', async () => {
      // Arrange
      mockRequest.query = {
        ...mockRequest.query,
        search: 'BTC',
      };

      (prisma.tradeLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tradeLog.count as jest.Mock).mockResolvedValue(0);

      // Act
      await getTradeLogs(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(prisma.tradeLog.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { symbol: { contains: 'BTC', mode: 'insensitive' } },
            { user: { username: { contains: 'BTC', mode: 'insensitive' } } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              plan_type: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      (prisma.tradeLog.findMany as jest.Mock).mockRejectedValue(error);

      // Act
      await getTradeLogs(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Failed to fetch trade logs',
      });
    });
  });
});
