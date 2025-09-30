import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

// Schemas for validation
const PersonalDataSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  couponCode: z.string().optional(),
  emailMarketingConsent: z.boolean().optional().default(false),
  termsConsent: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const PlanSelectionSchema = z.object({
  planId: z.enum(['free', 'basic', 'advanced', 'pro', 'lifetime']),
  billingPeriod: z.enum(['monthly', 'quarterly', 'yearly']),
  sessionToken: z.string().optional(),
});

const PaymentDataSchema = z.object({
  paymentMethod: z.enum(['lightning', 'lnmarkets']),
  lightningAddress: z.string().optional(),
  sessionToken: z.string().optional(),
});

const CredentialsDataSchema = z.object({
  lnMarketsApiKey: z.string().min(1, 'API Key is required'),
  lnMarketsApiSecret: z.string().min(1, 'API Secret is required'),
  lnMarketsPassphrase: z.string().min(1, 'Passphrase is required'),
  sessionToken: z.string().optional(),
});

export class RegistrationService {
  private prisma: PrismaClient;
  private authService: AuthService;

  constructor(prisma: PrismaClient, fastify: any) {
    this.prisma = prisma;
    this.authService = new AuthService(prisma, fastify);
  }

  /**
   * Step 1: Save personal data and create registration progress
   */
  async savePersonalData(data: z.infer<typeof PersonalDataSchema>, ipAddress?: string) {
    try {
      console.log('📝 REGISTRATION - Saving personal data for:', data.email);
      console.log('📝 REGISTRATION - Email marketing consent:', data.emailMarketingConsent, typeof data.emailMarketingConsent);
      console.log('📝 REGISTRATION - Terms consent:', data.termsConsent, typeof data.termsConsent);

      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            { username: data.username }
          ]
        }
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Generate session token for unauthenticated users
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          first_name: data.firstName,
          last_name: data.lastName,
          password_hash: hashedPassword,
          email_marketing_consent: data.emailMarketingConsent || false,
          email_marketing_consent_at: data.emailMarketingConsent ? new Date() : null,
          plan_type: 'free', // Default plan
          is_active: false, // Will be activated after payment
        }
      });

      // Create registration progress
      const registrationProgress = await this.prisma.registrationProgress.create({
        data: {
          user_id: user.id,
          current_step: 'plan_selection',
          completed_steps: ['personal_data'],
          personal_data: {
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            email: data.email,
            couponCode: data.couponCode,
          },
          session_token: sessionToken,
          expires_at: expiresAt,
        }
      });

      console.log('✅ REGISTRATION - Personal data saved, user created:', user.id);

      return {
        success: true,
        userId: user.id,
        sessionToken,
        nextStep: 'plan_selection',
        message: 'Personal data saved successfully'
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error saving personal data:', error);
      throw error;
    }
  }

  /**
   * Step 2: Select plan and check coupon
   */
  async selectPlan(data: z.infer<typeof PlanSelectionSchema>, userId?: string, sessionToken?: string) {
    try {
      console.log('📋 REGISTRATION - Selecting plan:', data.planId);

      // Find registration progress
      const progress = await this.findRegistrationProgress(userId, sessionToken);
      if (!progress) {
        throw new Error('Registration progress not found');
      }

      // Check coupon if provided
      let couponData = null;
      if (progress.personal_data?.couponCode) {
        couponData = await this.validateCoupon(progress.personal_data.couponCode);
      }

      // Determine next step based on plan and coupon
      let nextStep = 'payment';
      if (data.planId === 'free') {
        nextStep = 'completed'; // Free plan completes registration immediately
      } else if (couponData?.planType === 'lifetime') {
        nextStep = 'credentials'; // Skip payment for lifetime coupons
      } else if (couponData?.discountType === 'percentage' && couponData?.discountValue === 100) {
        nextStep = 'completed'; // 100% discount coupon completes registration immediately
      }

      // Update registration progress
      await this.prisma.registrationProgress.update({
        where: { id: progress.id },
        data: {
          current_step: nextStep,
          completed_steps: [...progress.completed_steps as string[], 'plan_selection'],
          selected_plan: data.planId,
          coupon_code: progress.personal_data?.couponCode,
        }
      });

      // If free plan or 100% discount coupon, activate user and complete registration
      if (data.planId === 'free' || (couponData?.discountType === 'percentage' && couponData?.discountValue === 100)) {
        const planType = data.planId === 'free' ? 'free' : data.planId;
        
        const updatedUser = await this.prisma.user.update({
          where: { id: progress.user_id },
          data: {
            is_active: true,
            plan_type: planType,
            activated_at: new Date(),
          }
        });

        // Mark registration as completed
        await this.prisma.registrationProgress.update({
          where: { id: progress.id },
          data: {
            current_step: 'completed',
            completed_steps: [...progress.completed_steps as string[], 'plan_selection', 'completed'],
          }
        });

        // Generate JWT token for auto-login
        const token = await this.authService.generateAccessToken(updatedUser);

        const completionReason = data.planId === 'free' ? 'Free plan' : '100% discount coupon';
        console.log(`✅ REGISTRATION - ${completionReason} selected, user activated and registration completed`);

        return {
          success: true,
          nextStep,
          couponData,
          message: 'Plan selected successfully',
          // Include user data and token for auto-login
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username,
            plan_type: updatedUser.plan_type,
            is_active: updatedUser.is_active,
          },
          token
        };
      } else {
        console.log('✅ REGISTRATION - Plan selected, next step:', nextStep);
        
        return {
          success: true,
          nextStep,
          couponData,
          message: 'Plan selected successfully'
        };
      }

    } catch (error) {
      console.error('❌ REGISTRATION - Error selecting plan:', error);
      throw error;
    }
  }

  /**
   * Step 3: Process payment
   */
  async processPayment(data: z.infer<typeof PaymentDataSchema>, userId?: string, sessionToken?: string) {
    try {
      console.log('💳 REGISTRATION - Processing payment:', data.paymentMethod);

      // Find registration progress
      const progress = await this.findRegistrationProgress(userId, sessionToken);
      if (!progress) {
        throw new Error('Registration progress not found');
      }

      // Update registration progress
      await this.prisma.registrationProgress.update({
        where: { id: progress.id },
        data: {
          current_step: 'credentials',
          completed_steps: [...progress.completed_steps as string[], 'payment'],
          payment_data: {
            paymentMethod: data.paymentMethod,
            lightningAddress: data.lightningAddress,
            processedAt: new Date().toISOString(),
          },
        }
      });

      console.log('✅ REGISTRATION - Payment processed, next step: credentials');

      return {
        success: true,
        nextStep: 'credentials',
        message: 'Payment processed successfully'
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Step 4: Save credentials and complete registration
   */
  async saveCredentials(data: z.infer<typeof CredentialsDataSchema>, userId?: string, sessionToken?: string) {
    try {
      console.log('🔐 REGISTRATION - Saving credentials for user:', userId);

      // Find registration progress
      const progress = await this.findRegistrationProgress(userId, sessionToken);
      if (!progress) {
        throw new Error('Registration progress not found');
      }

      // Update user with credentials and activate account
      await this.prisma.user.update({
        where: { id: progress.user_id },
        data: {
          ln_markets_api_key: data.lnMarketsApiKey,
          ln_markets_api_secret: data.lnMarketsApiSecret,
          ln_markets_passphrase: data.lnMarketsPassphrase,
          plan_type: progress.selected_plan as any,
          is_active: true,
        }
      });

      // Complete registration progress
      await this.prisma.registrationProgress.update({
        where: { id: progress.id },
        data: {
          current_step: 'completed',
          completed_steps: [...progress.completed_steps as string[], 'credentials'],
          credentials_data: {
            lnMarketsApiKey: data.lnMarketsApiKey,
            lnMarketsApiSecret: data.lnMarketsApiSecret,
            lnMarketsPassphrase: data.lnMarketsPassphrase,
            savedAt: new Date().toISOString(),
          },
          session_token: null, // Clear session token
          expires_at: null,
        }
      });

      console.log('✅ REGISTRATION - Credentials saved, registration completed');

      return {
        success: true,
        message: 'Registration completed successfully'
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error saving credentials:', error);
      throw error;
    }
  }

  /**
   * Get registration progress
   */
  async getRegistrationProgress(userId?: string, sessionToken?: string) {
    try {
      const progress = await this.findRegistrationProgress(userId, sessionToken);
      
      if (!progress) {
        return null;
      }

      return {
        currentStep: progress.current_step,
        completedSteps: progress.completed_steps,
        personalData: progress.personal_data,
        selectedPlan: progress.selected_plan,
        paymentData: progress.payment_data,
        credentialsData: progress.credentials_data,
        couponCode: progress.coupon_code,
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error getting progress:', error);
      throw error;
    }
  }

  /**
   * Validate coupon code
   */
  private async validateCoupon(couponCode: string) {
    try {
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: couponCode,
          is_active: true,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        }
      });

      if (!coupon) {
        return null;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count && coupon.used_count >= coupon.usage_limit) {
        return null;
      }

      return {
        code: coupon.code,
        planType: coupon.plan_type,
        discountType: coupon.value_type,
        discountValue: coupon.value_amount,
        description: coupon.description,
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error validating coupon:', error);
      return null;
    }
  }

  /**
   * Find registration progress by userId or sessionToken
   */
  private async findRegistrationProgress(userId?: string, sessionToken?: string) {
    if (userId) {
      return await this.prisma.registrationProgress.findUnique({
        where: { user_id: userId }
      });
    }

    if (sessionToken) {
      return await this.prisma.registrationProgress.findFirst({
        where: {
          session_token: sessionToken,
          expires_at: { gt: new Date() }
        }
      });
    }

    return null;
  }

  /**
   * Clean up expired registration progress
   */
  async cleanupExpiredProgress() {
    try {
      const result = await this.prisma.registrationProgress.deleteMany({
        where: {
          expires_at: { lt: new Date() }
        }
      });

      console.log(`🧹 REGISTRATION - Cleaned up ${result.count} expired progress records`);
      return result.count;

    } catch (error) {
      console.error('❌ REGISTRATION - Error cleaning up expired progress:', error);
      return 0;
    }
  }
}
