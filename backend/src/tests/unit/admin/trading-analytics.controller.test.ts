import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FastifyRequest, FastifyReply } from 'fastify';
import { getTradingAnalytics } from '../../../controllers/admin/trading-analytics.controller';
import { prisma } from '../../../lib/prisma';

// Mock do Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    trade: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Admin Trading Analytics Controller', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      query: {
        search: '',
        sortBy: 'totalTrades',
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

  describe('getTradingAnalytics', () => {
    it('should return trading analytics successfully', async () => {
      // Arrange
      const mockUsers = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          plan_type: 'premium',
          created_at: new Date(),
          trades: [
            { id: '1', pnl: 100, status: 'completed' },
            { id: '2', pnl: -50, status: 'completed' },
          ],
        },
      ];

      const mockTrades = [
        { id: '1', pnl: 100, status: 'completed' },
        { id: '2', pnl: -50, status: 'completed' },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.trade.findMany as jest.Mock).mockResolvedValue(mockTrades);
      (prisma.trade.count as jest.Mock).mockResolvedValue(2);

      // Act
      const result = await getTradingAnalytics(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(result).toEqual({
        users: [
          {
            id: '1',
            username: 'user1',
            email: 'user1@example.com',
            planType: 'premium',
            totalTrades: 2,
            winningTrades: 1,
            losingTrades: 1,
            totalPnL: 50,
            winRate: 50,
            avgPnL: 25,
            createdAt: expect.any(Date),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
        metrics: {
          totalUsers: 1,
          totalTrades: 2,
          totalWinningTrades: 1,
          totalLosingTrades: 1,
          totalPnL: 50,
          overallWinRate: 50,
          avgPnLPerTrade: 25,
        },
      });
    });

    it('should handle search filter', async () => {
      // Arrange
      mockRequest.query = {
        search: 'user1',
        sortBy: 'totalTrades',
        sortOrder: 'desc',
        page: '1',
        limit: '10',
      };

      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.trade.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.trade.count as jest.Mock).mockResolvedValue(0);

      // Act
      await getTradingAnalytics(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: { contains: 'user1', mode: 'insensitive' } },
            { email: { contains: 'user1', mode: 'insensitive' } },
          ],
        },
        include: {
          trades: {
            where: { status: 'completed' },
            select: {
              id: true,
              pnl: true,
              status: true,
            },
          },
        },
        orderBy: { totalTrades: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      (prisma.user.findMany as jest.Mock).mockRejectedValue(error);

      // Act
      await getTradingAnalytics(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Failed to fetch trading analytics',
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.trade.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.trade.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await getTradingAnalytics(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Assert
      expect(result).toEqual({
        users: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        metrics: {
          totalUsers: 0,
          totalTrades: 0,
          totalWinningTrades: 0,
          totalLosingTrades: 0,
          totalPnL: 0,
          overallWinRate: 0,
          avgPnLPerTrade: 0,
        },
      });
    });
  });
});
