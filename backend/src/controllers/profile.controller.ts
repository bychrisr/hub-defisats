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
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
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

      // Decrypt LN Markets credentials for display
      let decryptedProfile = { ...profile };
      
      try {
        if (profile.ln_markets_api_key) {
          console.log('🔓 PROFILE - Decrypting API key...');
          decryptedProfile.ln_markets_api_key = this.authService.decryptData(profile.ln_markets_api_key);
          console.log('✅ PROFILE - API key decrypted successfully');
        }
        
        if (profile.ln_markets_api_secret) {
          console.log('🔓 PROFILE - Decrypting API secret...');
          decryptedProfile.ln_markets_api_secret = this.authService.decryptData(profile.ln_markets_api_secret);
          console.log('✅ PROFILE - API secret decrypted successfully');
        }
        
        if (profile.ln_markets_passphrase) {
          console.log('🔓 PROFILE - Decrypting passphrase...');
          decryptedProfile.ln_markets_passphrase = this.authService.decryptData(profile.ln_markets_passphrase);
          console.log('✅ PROFILE - Passphrase decrypted successfully');
        }
        
        console.log('🔓 PROFILE - All credentials decrypted for display');
      } catch (error) {
        console.error('❌ PROFILE - Error decrypting credentials:', error);
        // Return encrypted data with indication if decryption fails
        decryptedProfile = {
          ...profile,
          ln_markets_api_key: profile.ln_markets_api_key ? '[ENCRYPTED]' : null,
          ln_markets_api_secret: profile.ln_markets_api_secret ? '[ENCRYPTED]' : null,
          ln_markets_passphrase: profile.ln_markets_passphrase ? '[ENCRYPTED]' : null,
        };
      }

      return reply.status(200).send({
        success: true,
        data: decryptedProfile,
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
        ln_markets_api_key: body.ln_markets_api_key ? '***' : 'not provided',
        ln_markets_api_secret: body.ln_markets_api_secret ? '***' : 'not provided',
        ln_markets_passphrase: body.ln_markets_passphrase ? '***' : 'not provided',
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
      
      // Encrypt LN Markets credentials before saving
      if (body.ln_markets_api_key) {
        console.log('🔒 PROFILE - Encrypting API key...');
        updateData.ln_markets_api_key = this.authService.encryptData(body.ln_markets_api_key);
        console.log('✅ PROFILE - API key encrypted successfully');
      }
      
      if (body.ln_markets_api_secret) {
        console.log('🔒 PROFILE - Encrypting API secret...');
        updateData.ln_markets_api_secret = this.authService.encryptData(body.ln_markets_api_secret);
        console.log('✅ PROFILE - API secret encrypted successfully');
      }
      
      if (body.ln_markets_passphrase) {
        console.log('🔒 PROFILE - Encrypting passphrase...');
        updateData.ln_markets_passphrase = this.authService.encryptData(body.ln_markets_passphrase);
        console.log('✅ PROFILE - Passphrase encrypted successfully');
      }

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
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
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
