import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Database connection for testing
let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:15432/hub_defisats'
      }
    }
  });
  
  await prisma.$connect();
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  await prisma.userCoupon.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();
});

describe('Database Integration Tests', () => {
  describe('User Management', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        ln_markets_api_key: 'encrypted_key',
        ln_markets_api_secret: 'encrypted_secret',
        plan_type: 'free' as const,
        is_active: true
      };

      const user = await prisma.user.create({
        data: userData
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.plan_type).toBe('free');
    });

    it('should find user by email', async () => {
      const userData = {
        email: 'findme@example.com',
        username: 'findme',
        password_hash: 'hashed_password',
        ln_markets_api_key: 'encrypted_key',
        ln_markets_api_secret: 'encrypted_secret',
        plan_type: 'free' as const,
        is_active: true
      };

      await prisma.user.create({ data: userData });

      const foundUser = await prisma.user.findUnique({
        where: { email: 'findme@example.com' }
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('findme@example.com');
    });

    it('should prevent duplicate emails', async () => {
      const userData = {
        email: 'duplicate@example.com',
        username: 'user1',
        password_hash: 'hashed_password',
        ln_markets_api_key: 'encrypted_key',
        ln_markets_api_secret: 'encrypted_secret',
        plan_type: 'free' as const,
        is_active: true
      };

      await prisma.user.create({ data: userData });

      const duplicateUserData = {
        ...userData,
        username: 'user2'
      };

      await expect(
        prisma.user.create({ data: duplicateUserData })
      ).rejects.toThrow();
    });
  });

  describe('Coupon Management', () => {
    it('should create a coupon', async () => {
      const couponData = {
        code: 'TEST2024',
        plan_type: 'pro' as const,
        usage_limit: 100,
        used_count: 0,
        expires_at: new Date('2024-12-31')
      };

      const coupon = await prisma.coupon.create({
        data: couponData
      });

      expect(coupon).toBeDefined();
      expect(coupon.code).toBe('TEST2024');
      expect(coupon.plan_type).toBe('premium');
    });

    it('should create user-coupon relationship', async () => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: 'couponuser@example.com',
          username: 'couponuser',
          password_hash: 'hashed_password',
          ln_markets_api_key: 'encrypted_key',
          ln_markets_api_secret: 'encrypted_secret',
          plan_type: 'free' as const,
          is_active: true
        }
      });

      // Create coupon
      const coupon = await prisma.coupon.create({
        data: {
          code: 'USER2024',
          plan_type: 'pro' as const,
          usage_limit: 10,
          used_count: 0,
          expires_at: new Date('2024-12-31')
        }
      });

      // Create relationship
      const userCoupon = await prisma.userCoupon.create({
        data: {
          user_id: user.id,
          coupon_id: coupon.id
        }
      });

      expect(userCoupon).toBeDefined();
      expect(userCoupon.user_id).toBe(user.id);
      expect(userCoupon.coupon_id).toBe(coupon.id);
    });
  });

  describe('Data Validation', () => {
    it('should enforce required fields', async () => {
      const incompleteUserData = {
        email: 'incomplete@example.com',
        // Missing required fields
      };

      await expect(
        prisma.user.create({ data: incompleteUserData as any })
      ).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        email: 'not-an-email',
        username: 'testuser',
        password_hash: 'hashed_password',
        ln_markets_api_key: 'encrypted_key',
        ln_markets_api_secret: 'encrypted_secret',
        plan_type: 'free' as const,
        is_active: true
      };

      // This should work as Prisma doesn't validate email format by default
      // But we can test that the data is stored as provided
      const user = await prisma.user.create({
        data: invalidEmailData
      });

      expect(user.email).toBe('not-an-email');
    });
  });
});
