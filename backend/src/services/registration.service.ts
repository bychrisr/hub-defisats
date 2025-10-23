import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { AntiFraudService } from './anti-fraud.service';

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
  accountName: z.string().optional().default('Main Account'),
  sessionToken: z.string().optional(),
});

export class RegistrationService {
  private prisma: PrismaClient;
  private authService: AuthService;
  private emailService: EmailService;
  private antiFraudService: AntiFraudService;

  constructor(prisma: PrismaClient, fastify: any) {
    this.prisma = prisma;
    this.authService = new AuthService(prisma, fastify);
    this.emailService = new EmailService();
    this.antiFraudService = new AntiFraudService(prisma);
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

      // Gerar token de verificação de email (plain text, será enviado por email)
      const verificationToken = crypto.randomBytes(32).toString('hex'); // 64 chars
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Hash do token para armazenar no DB (GitHub style)
      const tokenHash = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      console.log('🔍 REGISTRATION - Generated token length:', verificationToken.length);
      console.log('🔍 REGISTRATION - Token hash length:', tokenHash.length);

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
          email_verified: false,
          email_verification_token: tokenHash, // Armazenar hash, não o token plain
          email_verification_expires: verificationExpires,
          account_status: 'pending_verification',
          plan_type: 'free', // Default plan
          is_active: false, // Will be activated on first login
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
            emailMarketingConsent: data.emailMarketingConsent,
          },
          session_token: sessionToken,
          expires_at: expiresAt,
        }
      });

      // Gerar OTP usando o AuthService
      const { AuthService } = await import('./auth.service');
      const authService = new AuthService(this.prisma, null as any); // fastify não é necessário para generateOTP
      const generatedOtp = await authService.generateOTP(user.id);
      
      // Enviar email de verificação com Magic Link + OTP
      await this.emailService.sendVerificationEmail(data.email, verificationToken, generatedOtp);
      console.log('📧 REGISTRATION - Email sent with token:', verificationToken.substring(0, 10) + '...', 'and OTP:', generatedOtp);

      console.log('✅ REGISTRATION - Personal data saved, user created:', user.id);

      return {
        success: true,
        userId: user.id,
        sessionToken,
        nextStep: 'plan_selection',
        message: 'Personal data saved successfully. Please check your email to verify your account.',
        requiresEmailVerification: true,
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error saving personal data:', error);
      throw error;
    }
  }

  /**
   * Step 2: Select plan and check coupon
   */
  async selectPlan(
    data: z.infer<typeof PlanSelectionSchema>, 
    userId?: string, 
    sessionToken?: string,
    ipAddress?: string,
    userAgent?: string,
    fingerprint?: string
  ) {
    try {
      console.log('📋 REGISTRATION - Selecting plan:', data.planId);

      // Find registration progress
      const progress = await this.findRegistrationProgress(userId, sessionToken);
      if (!progress) {
        throw new Error('Registration progress not found');
      }

      // Check coupon if provided
      let couponData = null;
      let couponId: string | undefined;
      if (progress.personal_data && typeof progress.personal_data === 'object' && 'couponCode' in progress.personal_data) {
        const personalData = progress.personal_data as any;
        if (personalData.couponCode) {
          couponData = await this.validateCoupon(personalData.couponCode);
          if (couponData) {
            // Buscar ID do cupom
            const coupon = await this.prisma.coupon.findFirst({
              where: { code: personalData.couponCode, is_active: true }
            });
            couponId = coupon?.id;
          }
        }
      }

      // Determine next step based on plan and coupon
      let nextStep = 'payment';
      let shouldCompleteRegistration = false;
      let requiresVerification = false;
      let verificationCode: string | null = null;
      let riskScore = 0;
      
      if (data.planId === 'free') {
        shouldCompleteRegistration = true; // Free plan completes registration immediately
      } else if (couponData?.planType === 'lifetime' || (couponData?.discountType === 'percentage' && couponData?.discountValue === 100)) {
        // Cupom com 100% desconto: verificar risco de fraude
        if (ipAddress && couponId) {
          const personalData = progress.personal_data as any;
          const riskAssessment = await this.antiFraudService.calculateRiskScore(
            ipAddress,
            personalData.email,
            fingerprint,
            couponId
          );

          riskScore = riskAssessment.riskScore;

          // Log do risco
          await this.antiFraudService.logRisk(
            progress.user_id,
            ipAddress,
            fingerprint,
            riskScore,
            riskAssessment.factors,
            riskAssessment.recommendation
          );

          if (riskAssessment.recommendation === 'block') {
            // Bloquear registro
            throw new Error('REGISTRATION_BLOCKED_FRAUD');
          } else if (riskAssessment.recommendation === 'verify') {
            // Requer verificação via código
            requiresVerification = true;
            verificationCode = this.antiFraudService.generateVerificationCode();
            
            // Salvar código no progress
            await this.prisma.registrationProgress.update({
              where: { id: progress.id },
              data: {
                verification_code: verificationCode,
                verification_code_expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
                risk_score: riskScore,
              },
            });

            // Enviar código por email
            await this.emailService.sendVerificationCodeEmail(personalData.email, verificationCode);
            
            console.log(`🔐 REGISTRATION - Verification code sent (risk score: ${riskScore})`);
          } else {
            // Aprovado: completar registro normalmente
            shouldCompleteRegistration = true;
          }
        } else {
          // Sem dados de tracking: aprovar mas registrar
          shouldCompleteRegistration = true;
        }
      }

      if (shouldCompleteRegistration && !requiresVerification) {
        // Update registration progress first
        await this.prisma.registrationProgress.update({
          where: { id: progress.id },
          data: {
            current_step: 'completed',
            completed_steps: [...progress.completed_steps as string[], 'plan_selection'],
            selected_plan: data.planId,
            coupon_code: progress.personal_data && typeof progress.personal_data === 'object' && 'couponCode' in progress.personal_data 
              ? (progress.personal_data as any).couponCode 
              : null,
          }
        });

        // Complete registration for free plans or 100% discount
        const result = await this.completeRegistration(progress.user_id, sessionToken);
        return {
          success: true,
          nextStep: 'completed',
          couponData,
          message: 'Registration completed successfully',
          userId: result.userId,
          requiresEmailVerification: result.requiresEmailVerification,
        };
      }

      // Se requer verificação, retornar sem completar registro
      if (requiresVerification) {
        return {
          success: true,
          nextStep: 'code_verification',
          requiresVerification: true,
          message: 'Verification code sent to your email',
          riskScore,
        };
      }

      // Update registration progress for paid plans
      await this.prisma.registrationProgress.update({
        where: { id: progress.id },
        data: {
          current_step: nextStep,
          completed_steps: [...progress.completed_steps as string[], 'plan_selection'],
          selected_plan: data.planId,
          coupon_code: progress.personal_data && typeof progress.personal_data === 'object' && 'couponCode' in progress.personal_data 
            ? (progress.personal_data as any).couponCode 
            : null,
        }
      });

      // Update user plan
      await this.prisma.user.update({
        where: { id: progress.user_id },
        data: {
          plan_type: data.planId as any,
        }
      });

      console.log('✅ REGISTRATION - Plan selected, next step:', nextStep);

      return {
        success: true,
        nextStep,
        couponData,
        message: 'Plan selected successfully'
      };

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

      // Complete registration after payment
      const result = await this.completeRegistration(progress.user_id, sessionToken);

      // Update registration progress with payment data
      await this.prisma.registrationProgress.update({
        where: { id: progress.id },
        data: {
          completed_steps: [...progress.completed_steps as string[], 'payment'],
          payment_data: {
            paymentMethod: data.paymentMethod,
            lightningAddress: data.lightningAddress,
            processedAt: new Date().toISOString(),
          },
        }
      });

      console.log('✅ REGISTRATION - Payment processed, registration completed');

      return {
        success: true,
        nextStep: 'completed',
        message: 'Payment processed and registration completed successfully',
        userId: result.userId,
        requiresEmailVerification: result.requiresEmailVerification,
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Complete registration (after plan selection for free plans or payment for paid plans)
   */
  async completeRegistration(userId: string, sessionToken?: string) {
    try {
      console.log('🎉 REGISTRATION - Completing registration for user:', userId);

      // Find registration progress
      const progress = await this.findRegistrationProgress(userId, sessionToken);
      if (!progress) {
        throw new Error('Registration progress not found');
      }

      // Update user plan and mark as ready for first login
      await this.prisma.user.update({
        where: { id: progress.user_id },
        data: {
          plan_type: (progress.selected_plan as any) || 'free',
          onboarding_completed: false, // Will be completed during onboarding
        }
      });

      // Complete registration progress
      await this.prisma.registrationProgress.update({
        where: { id: progress.id },
        data: {
          current_step: 'completed',
          completed_steps: [...progress.completed_steps as string[], 'registration_complete'],
          session_token: null, // Clear session token
          expires_at: null,
        }
      });

      console.log('✅ REGISTRATION - Registration completed, user ready for first login');

      return {
        success: true,
        message: 'Registration completed successfully',
        userId: progress.user_id,
        requiresEmailVerification: false, // TODO: Implement email verification
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error completing registration:', error);
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

  /**
   * Valida código de verificação enviado por email
   */
  async validateVerificationCode(sessionToken: string, code: string, ipAddress?: string, userAgent?: string, fingerprint?: string) {
    try {
      console.log('🔐 REGISTRATION - Validating verification code');

      // Validar código
      const validation = await this.antiFraudService.validateVerificationCode(sessionToken, code);
      
      if (!validation.valid) {
        if (validation.expired) {
          throw new Error('VERIFICATION_CODE_EXPIRED');
        }
        throw new Error('INVALID_VERIFICATION_CODE');
      }

      // Buscar progress
      const progress = await this.findRegistrationProgress(undefined, sessionToken);
      if (!progress) {
        throw new Error('Registration progress not found');
      }

      // Track coupon usage se houver cupom
      if (progress.coupon_code && ipAddress && userAgent) {
        const coupon = await this.prisma.coupon.findFirst({
          where: { code: progress.coupon_code, is_active: true }
        });

        if (coupon) {
          await this.antiFraudService.trackCouponUsage(
            coupon.id,
            progress.user_id,
            ipAddress,
            userAgent,
            fingerprint,
            progress.risk_score || 0
          );
        }
      }

      // Completar registro
      const result = await this.completeRegistration(progress.user_id, sessionToken);

      return {
        success: true,
        nextStep: 'completed',
        message: 'Verification code validated successfully',
        userId: result.userId,
        requiresEmailVerification: result.requiresEmailVerification,
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error validating verification code:', error);
      throw error;
    }
  }

  /**
   * Reenvia código de verificação
   */
  async resendVerificationCode(sessionToken: string) {
    try {
      console.log('🔄 REGISTRATION - Resending verification code');

      const progress = await this.findRegistrationProgress(undefined, sessionToken);
      if (!progress) {
        throw new Error('Registration progress not found');
      }

      // Gerar novo código
      const newCode = this.antiFraudService.generateVerificationCode();
      const newExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

      // Atualizar progress
      await this.prisma.registrationProgress.update({
        where: { id: progress.id },
        data: {
          verification_code: newCode,
          verification_code_expires: newExpires,
        },
      });

      // Enviar novo código
      const personalData = progress.personal_data as any;
      await this.emailService.sendVerificationCodeEmail(personalData.email, newCode);

      console.log('✅ REGISTRATION - Verification code resent');

      return {
        success: true,
        message: 'Verification code sent',
      };

    } catch (error) {
      console.error('❌ REGISTRATION - Error resending code:', error);
      throw error;
    }
  }
}