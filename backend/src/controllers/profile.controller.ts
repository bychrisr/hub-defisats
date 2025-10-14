import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';

export class ProfileController {
  private prisma: PrismaClient;
  private authService: AuthService;

  constructor(prisma?: PrismaClient, authService?: AuthService) {
    this.prisma = prisma || new PrismaClient();
    this.authService = authService || new AuthService(this.prisma, null as any);
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;

      console.log('🔍 PROFILE - Fetching profile for user:', user?.id);

      const profile = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          username: true,
          plan_type: true,
          created_at: true,
          last_activity_at: true,
          admin_user: {
            select: {
              role: true
            }
          }
        },
      });

      if (!profile) {
        console.log('❌ PROFILE - User not found');
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      console.log('✅ PROFILE - Profile fetched successfully');

      // Buscar contas do usuário usando o novo sistema
      const { UserExchangeAccountService } = await import('../services/userExchangeAccount.service');
      const userExchangeAccountService = new UserExchangeAccountService(this.prisma);
      
      let userAccounts = [];
      try {
        userAccounts = await userExchangeAccountService.getUserExchangeAccounts(user.id);
        console.log('✅ PROFILE - User accounts loaded:', userAccounts.length);
      } catch (error) {
        console.warn('⚠️ PROFILE - Could not load user accounts:', error);
        userAccounts = [];
      }

      // Add is_admin field based on admin_user relation
      const isAdmin = !!profile.admin_user;
      
      return reply.status(200).send({
        success: true,
        data: {
          ...profile,
          exchange_accounts: userAccounts.map(account => ({
            id: account.id,
            account_name: account.account_name,
            exchange_name: account.exchange?.name,
            is_active: account.is_active,
            is_verified: account.is_verified,
            created_at: account.created_at
          })),
          is_admin: isAdmin,
          admin_role: profile.admin_user?.role || null
        },
      });
    } catch (error) {
      console.error('❌ PROFILE - Error fetching profile:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch profile',
      });
    }
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const body = request.body as any;

      console.log('🔍 PROFILE - Updating profile for user:', user?.id);
      console.log('📊 PROFILE - Update data:', {
        email: body.email,
        username: body.username,
        bio: body.bio,
      });

      // Check if email is being changed and if it's already taken
      if (body.email && body.email !== user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: body.email },
        });

        if (existingUser) {
          console.log('❌ PROFILE - Email already taken');
          return reply.status(400).send({
            success: false,
            error: 'EMAIL_ALREADY_EXISTS',
            message: 'Email is already taken',
          });
        }
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date(),
      };

      if (body.email) updateData.email = body.email;
      if (body.username) updateData.username = body.username;
      if (body.bio !== undefined) updateData.bio = body.bio;
      
      // LN Markets credentials are now managed via exchange accounts system
      // This endpoint only handles basic profile information
      console.log('ℹ️ PROFILE - LN Markets credentials are managed via exchange accounts system');

      const updatedProfile = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          bio: true,
          plan_type: true,
          created_at: true,
          last_activity_at: true,
        },
      });

      console.log('✅ PROFILE - Profile updated successfully');

      return reply.status(200).send({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('❌ PROFILE - Error updating profile:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update profile',
      });
    }
  }
}
