import bcrypt from 'bcrypt';
import { PrismaClient, User, SocialProvider } from '@prisma/client';
import { config } from '@/config/env';
import { FastifyInstance } from 'fastify';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse,
  RefreshTokenResponse 
} from '@/types/api-contracts';

export class AuthService {
  private prisma: PrismaClient;
  private fastify: FastifyInstance;

  constructor(prisma: PrismaClient, fastify: FastifyInstance) {
    this.prisma = prisma;
    this.fastify = fastify;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, ln_markets_api_key, ln_markets_api_secret, coupon_code } = data;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Validate coupon if provided
    let planType = 'free' as const;
    if (coupon_code) {
      const coupon = await this.validateCoupon(coupon_code);
      planType = coupon.plan_type;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Encrypt LN Markets keys
    const encryptedApiKey = this.encryptData(ln_markets_api_key);
    const encryptedApiSecret = this.encryptData(ln_markets_api_secret);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        ln_markets_api_key: encryptedApiKey,
        ln_markets_api_secret: encryptedApiSecret,
        plan_type: planType,
        used_coupon_id: coupon_code ? (await this.prisma.coupon.findUnique({ where: { code: coupon_code } }))?.id : null,
      },
    });

    // Update coupon usage if used
    if (coupon_code) {
      await this.updateCouponUsage(coupon_code);
    }

    // Generate tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user_id: user.id,
      token,
      plan_type: user.plan_type,
    };
  }

  /**
   * Login user with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.password_hash) {
      throw new Error('User registered with social login, please use social login');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
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
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user_id: user.id,
      token,
      plan_type: user.plan_type,
    };
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
      const decoded = this.fastify.jwt.verify(token) as any;
      
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.is_active) {
        throw new Error('Invalid session');
      }

      // Check if session is expired
      if (user.session_expires_at && user.session_expires_at < new Date()) {
        throw new Error('Session expired');
      }

      return user;
    } catch (error) {
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
    name?: string
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
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user_id: user.id,
      token,
      plan_type: user.plan_type,
    };
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: User): string {
    return this.fastify.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        planType: user.plan_type,
      },
      {
        expiresIn: config.jwt.expiresIn,
      }
    );
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    return this.fastify.jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      {
        expiresIn: config.jwt.refreshExpiresIn,
      }
    );
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
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

    if (coupon.used_count >= coupon.usage_limit) {
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
  private encryptData(data: string): string {
    // Simple encryption for now - in production, use proper encryption
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(config.security.encryption.key, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('hub-defisats', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  public decryptData(encryptedData: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(config.security.encryption.key, 'hex');
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('hub-defisats', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
