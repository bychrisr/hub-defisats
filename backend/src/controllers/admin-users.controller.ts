import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

export class AdminUsersController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all users with pagination and filtering
   */
  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { page = '1', limit = '20', search = '', plan_type = 'all', is_active = 'all' } = request.query as any;
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (plan_type !== 'all') {
        where.plan_type = plan_type;
      }
      
      if (is_active !== 'all') {
        where.is_active = is_active === 'true';
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            email: true,
            username: true,
            plan_type: true,
            is_active: true,
            created_at: true,
            last_activity_at: true
          },
          orderBy: { created_at: 'desc' }
        }),
        this.prisma.user.count({ where })
      ]);

      const pages = Math.ceil(total / limitNum);

      return reply.send({
        success: true,
        data: {
          users,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages
          }
        }
      });
    } catch (error: any) {
      console.error('❌ AdminUsersController - Error getting users:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get users',
        details: error.message
      });
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      
      // Get current user status
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, is_active: true, email: true }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      // Toggle status
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { is_active: !user.is_active },
        select: {
          id: true,
          email: true,
          is_active: true
        }
      });

      return reply.send({
        success: true,
        data: updatedUser,
        message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error: any) {
      console.error('❌ AdminUsersController - Error toggling user status:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to toggle user status',
        details: error.message
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      // Delete user
      await this.prisma.user.delete({
        where: { id: userId }
      });

      return reply.send({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ AdminUsersController - Error deleting user:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete user',
        details: error.message
      });
    }
  }
}
