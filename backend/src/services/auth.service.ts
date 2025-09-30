import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaClient, User } from '@prisma/client';
import { config } from '../config/env';
import { FastifyInstance } from 'fastify';
import { authLogger } from '../utils/logger';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshTokenResponse,
  PlanType,
} from '../types/api-contracts';
// import { createLNMarketsService } from './lnmarkets.service';
import { OptimizedQueriesService } from './optimized-queries.service';
import { SecurityConfigService } from './security-config.service';
// import { cacheService } from './cache.service';

// Define SocialProvider enum
export enum SocialProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  FACEBOOK = 'facebook',
}

export class AuthService {
  private prisma: PrismaClient;
  private fastify: FastifyInstance;
  private optimizedQueries: OptimizedQueriesService;
  private securityConfig: SecurityConfigService;

  constructor(prisma: PrismaClient, fastify: FastifyInstance) {
    this.prisma = prisma;
    this.fastify = fastify;
    this.optimizedQueries = new OptimizedQueriesService(prisma);
    this.securityConfig = new SecurityConfigService(prisma, fastify);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log('🔐 Starting user registration process...');
    console.log('📋 Registration data received:', {
      email: data.email,
      username: data.username,
      hasPassword: !!data.password,
      hasApiKey: !!data.ln_markets_api_key,
      hasApiSecret: !!data.ln_markets_api_secret,
      hasPassphrase: !!data.ln_markets_passphrase,
      couponCode: data.coupon_code,
    });

    const {
      email,
      username,
      password,
      ln_markets_api_key,
      ln_markets_api_secret,
      ln_markets_passphrase,
      coupon_code,
    } = data;

    console.log('🔍 Checking if user already exists...');
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ User already exists with email:', email);
      throw new Error('User already exists with this email');
    }
    console.log('✅ User does not exist, proceeding with registration');

    // Validate LN Markets credentials (skip validation in development)
    if (ln_markets_api_key && process.env.NODE_ENV !== 'development') {
      try {
        console.log('🔍 Starting LN Markets credentials validation...');
        const { LNMarketsAPIService } = await import('./lnmarkets-api.service');
        const lnMarketsService = new LNMarketsAPIService({
          apiKey: ln_markets_api_key,
          apiSecret: ln_markets_api_secret,
          passphrase: ln_markets_passphrase || '',
          isTestnet: false
        }, {
          info: () => {},
          error: () => {},
          warn: () => {},
          debug: () => {},
        } as any);

        console.log('✅ Validating credentials with LN Markets API...');
        const isValidCredentials = await lnMarketsService.validateCredentials();

        if (!isValidCredentials) {
          console.log('❌ LN Markets credentials validation failed');
          throw new Error(
            'Invalid LN Markets API credentials. Please check your API Key, Secret, and Passphrase.'
          );
        }

        console.log('✅ LN Markets credentials validation successful');
      } catch (error) {
        console.error('❌ LN Markets validation error:', error);
        console.error('❌ Error details:', {
          message: (error as Error).message,
          stack: (error as Error).stack,
        });
        // Re-throw the error to be handled by the controller
        throw error;
      }
    } else if (ln_markets_api_key && process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Skipping LN Markets credentials validation');
    }

    // Validate coupon if provided
    console.log('🎫 Validating coupon if provided...');
    let planType = 'free' as const;
    if (coupon_code) {
      console.log('🎫 Coupon code provided:', coupon_code);
      const coupon = await this.validateCoupon(coupon_code);
      planType = coupon.plan_type as any;
      console.log('✅ Coupon validated, plan type:', planType);
    } else {
      console.log('ℹ️ No coupon code provided, using default plan: free');
    }

    authLogger.debug('Hashing password for user registration');
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed successfully');

    console.log('🔐 Encrypting LN Markets credentials...');
    // Encrypt LN Markets keys
    const encryptedApiKey = this.encryptData(ln_markets_api_key);
    const encryptedApiSecret = this.encryptData(ln_markets_api_secret);
    const encryptedPassphrase = this.encryptData(ln_markets_passphrase);
    console.log('✅ LN Markets credentials encrypted successfully');

    console.log('👤 Creating user in database...');
    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password_hash: passwordHash,
        ln_markets_api_key: encryptedApiKey,
        ln_markets_api_secret: encryptedApiSecret,
        ln_markets_passphrase: encryptedPassphrase,
        plan_type: planType,
      },
    });
    console.log('✅ User created successfully with ID:', user.id);

    // Update coupon usage if used
    if (coupon_code) {
      console.log('🎫 Updating coupon usage...');
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: coupon_code },
      });
      if (coupon) {
        // Create UserCoupon relationship
        await this.prisma.userCoupon.create({
          data: {
            user_id: user.id,
            coupon_id: coupon.id,
          },
        });
        // Update coupon usage count
        await this.updateCouponUsage(coupon_code);
      }
      console.log('✅ Coupon usage updated');
    }

    authLogger.debug('Generating JWT tokens for new user', { userId: user.id });
    // Generate tokens
    const token = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    authLogger.info('JWT tokens generated successfully', { userId: user.id });

    console.log('💾 Storing refresh token in database...');
    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);
    console.log('✅ Refresh token stored successfully');

    console.log('🎉 User registration completed successfully!');

    // Invalidate cache for system stats
    await this.optimizedQueries.invalidateSystemCache();

    return {
      user_id: user.id,
      token,
      refresh_token: refreshToken,
      plan_type: user.plan_type as PlanType,
    };
  }

  /**
   * Login user with email/username and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log('🔍 AUTH SERVICE - Login called with:', { emailOrUsername: data.emailOrUsername });
    console.log('🔍 AUTH SERVICE - This is the login method');
    const { emailOrUsername, password } = data;

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      },
    });

    if (!user) {
      throw new Error('Invalid email/username or password');
    }

    if (!user.password_hash) {
      throw new Error(
        'User registered with social login, please use social login'
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email/username or password');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Update last activity
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_activity_at: new Date() },
    });

    // Generate tokens
    const token = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    // Fetch real balance from LN Markets
    let userBalance: any = {
      balance: 0,
      synthetic_usd_balance: 0,
      uid: user.id,
      role: 'user',
      username: user.username,
      linking_public_key: null,
      show_leaderboard: false,
      email: user.email
    };

    try {
      console.log('🔍 AUTH SERVICE - Fetching LN Markets balance for user:', user.id);
      
      if (user.ln_markets_api_key && user.ln_markets_api_secret && user.ln_markets_passphrase) {
        const { LNMarketsAPIService } = await import('./lnmarkets-api.service');
        const lnMarketsService = new LNMarketsAPIService({
          apiKey: user.ln_markets_api_key,
          apiSecret: user.ln_markets_api_secret,
          passphrase: user.ln_markets_passphrase,
          isTestnet: false
        }, {
          info: () => {},
          error: () => {},
          warn: () => {},
          debug: () => {},
        } as any);

        const lnMarketsBalance = await lnMarketsService.getUserBalance();
        console.log('✅ AUTH SERVICE - LN Markets balance fetched:', lnMarketsBalance);
        
        userBalance = {
          balance: lnMarketsBalance.balance || 0,
          synthetic_usd_balance: lnMarketsBalance.synthetic_usd_balance || 0,
          uid: lnMarketsBalance.uid || user.id,
          role: lnMarketsBalance.role || 'user',
          username: lnMarketsBalance.username || user.username,
          linking_public_key: lnMarketsBalance.linking_public_key || null,
          show_leaderboard: lnMarketsBalance.show_leaderboard || false,
          email: lnMarketsBalance.email || user.email
        };
      } else {
        console.log('⚠️ AUTH SERVICE - LN Markets credentials not configured, using default balance');
      }
    } catch (error: any) {
      console.log('❌ AUTH SERVICE - Error fetching LN Markets balance:', error.message);
      // Continue with default balance on error
    }

    // Check if user is admin
    console.log('🔍 AUTH SERVICE - Checking admin status for user:', user.id);
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { user_id: user.id }
    });
    console.log('✅ AUTH SERVICE - Admin user found:', adminUser);
    console.log('✅ AUTH SERVICE - Is admin:', !!adminUser);

    const response: any = {
      user_id: user.id,
      token,
      refresh_token: refreshToken,
      plan_type: user.plan_type as PlanType,
      is_admin: !!adminUser,
      user_balance: userBalance,
    };
    
    console.log('📤 AUTH SERVICE - Login response:', response);

    return response;
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(
    username: string
  ): Promise<{ available: boolean }> {
    const available =
      await this.optimizedQueries.checkUsernameAvailability(username);
    return { available };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const decoded = this.fastify.jwt.verify(refreshToken) as any;

      // Check if token exists in database
      const tokenRecord = await this.prisma.user.findFirst({
        where: {
          id: decoded.userId,
          session_expires_at: {
            gt: new Date(),
          },
        },
      });

      if (!tokenRecord) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const newToken = this.generateAccessToken(tokenRecord);

      return {
        token: newToken,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    // Clear session expiration
    await this.prisma.user.update({
      where: { id: userId },
      data: { session_expires_at: null },
    });
  }

  /**
   * Validate user session
   */
  async validateSession(token: string): Promise<User> {
    try {
      console.log('🔍 VALIDATE SESSION - Token:', '[REDACTED]');
      const decoded = this.fastify.jwt.verify(token) as any;
      console.log('🔍 VALIDATE SESSION - Decoded:', { ...decoded, token: '[REDACTED]' });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          plan_type: true,
          created_at: true,
          last_activity_at: true,
          is_active: true,
          session_expires_at: true,
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });
      console.log('🔍 VALIDATE SESSION - User found:', user?.email);

      if (!user || !user.is_active) {
        console.log('❌ VALIDATE SESSION - User not found or inactive');
        throw new Error('Invalid session');
      }

      // Check if session is expired
      if (user.session_expires_at && user.session_expires_at < new Date()) {
        console.log('❌ VALIDATE SESSION - Session expired');
        throw new Error('Session expired');
      }

      console.log('✅ VALIDATE SESSION - Session valid');
      return user as any;
    } catch (error) {
      console.log('❌ VALIDATE SESSION - Error:', (error as Error).message);
      console.log('❌ VALIDATE SESSION - Error stack:', (error as Error).stack);
      throw new Error('Invalid session');
    }
  }

  /**
   * Social login (Google, GitHub)
   */
  async socialLogin(
    provider: SocialProvider,
    socialId: string,
    email: string,
    _name?: string
  ): Promise<AuthResponse> {
    // Find existing user by social ID
    let user = await this.prisma.user.findFirst({
      where: {
        social_provider: provider,
        social_id: socialId,
      },
    });

    if (!user) {
      // Check if user exists with same email
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Link social account to existing user
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            social_provider: provider,
            social_id: socialId,
          },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email,
            username: email.split('@')[0] || 'user', // Generate username from email
            social_provider: provider,
            social_id: socialId,
            ln_markets_api_key: '', // Will be set later
            ln_markets_api_secret: '', // Will be set later
            plan_type: 'free',
          },
        });
      }
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Update last activity
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_activity_at: new Date() },
    });

    // Generate tokens
    const token = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user_id: user.id,
      token,
      refresh_token: refreshToken,
      plan_type: user.plan_type as PlanType,
    };
  }

  /**
   * Generate access token (public method for registration)
   */
  async generateAccessTokenPublic(user: User): Promise<string> {
    return this.generateAccessToken(user);
  }
    const expiresIn = await this.securityConfig.getJWTExpiration();
    return this.fastify.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        planType: user.plan_type,
      },
      {
        expiresIn,
      }
    );
  }

  /**
   * Generate refresh token
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const expiresIn = await this.securityConfig.getRefreshTokenExpiration();
    return this.fastify.jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      {
        expiresIn,
      }
    );
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    userId: string,
    _refreshToken: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.user.update({
      where: { id: userId },
      data: { session_expires_at: expiresAt },
    });
  }

  /**
   * Validate coupon code
   */
  private async validateCoupon(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    if (coupon.expires_at && coupon.expires_at < new Date()) {
      throw new Error('Coupon has expired');
    }

    if ((coupon.used_count ?? 0) >= (coupon.usage_limit ?? 0)) {
      throw new Error('Coupon usage limit exceeded');
    }

    return coupon;
  }

  /**
   * Update coupon usage count
   */
  private async updateCouponUsage(code: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { code },
      data: {
        used_count: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Encrypt sensitive data
   */
  public encryptData(data: string): string {
    // Simple encryption for now - in production, use proper encryption
    // const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.security.encryption.key, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  // Cache da chave de descriptografia para evitar scryptSync custoso
  private static decryptionKey: Buffer | null = null;

  /**
   * Decrypt sensitive data - OTIMIZADO com cache de chave
   */
  public decryptData(encryptedData: string): string {
    const algorithm = 'aes-256-cbc';
    
    // Usar chave em cache ou criar uma vez
    if (!AuthService.decryptionKey) {
      AuthService.decryptionKey = crypto.scryptSync(config.security.encryption.key, 'salt', 32);
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0] as string, 'hex');
    const encrypted = parts[1] as string;

    const decipher = crypto.createDecipheriv(algorithm, AuthService.decryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
