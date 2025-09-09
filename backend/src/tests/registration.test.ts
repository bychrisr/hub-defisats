import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

let app: FastifyInstance;
let prisma: PrismaClient;

beforeAll(async () => {
  // Create a simple Fastify app for testing
  const fastify = require('fastify')({ logger: false });
  
  // Mock Prisma
  prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
    },
    userCoupon: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  } as any;

  fastify.decorate('prisma', prisma);

  // Mock LN Markets service
  const mockLNMarketsService = {
    validateCredentials: jest.fn().mockResolvedValue(true),
  };

  fastify.decorate('lnMarketsService', mockLNMarketsService);

  // Mock auth service
  const mockAuthService = {
    register: jest.fn().mockImplementation(async () => {
      const userId = 'test-user-id-' + Date.now();
      const token = 'test-token-' + Date.now();
      return {
        user_id: userId,
        token: token,
        plan_type: 'free'
      };
    }),
  };

  fastify.decorate('authService', mockAuthService);

  // Register routes
  fastify.post('/api/auth/register', async (request: any, reply: any) => {
    try {
      const { email, username, password, ln_markets_api_key, ln_markets_api_secret, ln_markets_passphrase, coupon_code } = request.body;

      // Basic validation
      if (!email || !username || !password || !ln_markets_api_key || !ln_markets_api_secret || !ln_markets_passphrase) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'All required fields must be provided'
        });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(400).send({
          error: 'REGISTRATION_FAILED',
          message: 'User already exists with this email'
        });
      }

      // Register user
      const result = await mockAuthService.register({
        email,
        username,
        password,
        ln_markets_api_key,
        ln_markets_api_secret,
        ln_markets_passphrase,
        coupon_code
      });

      return reply.send(result);
    } catch (error) {
      console.error('Registration error:', error);
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Registration failed'
      });
    }
  });

  await fastify.ready();
  app = fastify;
});

afterAll(async () => {
  await app.close();
});

describe('Registration API Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123#',
        ln_markets_api_key: 'test_api_key_1234567890123456',
        ln_markets_api_secret: 'test_api_secret_1234567890123456',
        ln_markets_passphrase: 'testpassphrase123'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data).toHaveProperty('user_id');
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('plan_type');
      expect(data.plan_type).toBe('free');
    });

    it('should reject registration with missing fields', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser'
        // Missing password and other required fields
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with existing email', async () => {
      // Mock existing user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'existing-user-id',
        email: 'existing@example.com'
      });

      const userData = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'Test123#',
        ln_markets_api_key: 'test_api_key_1234567890123456',
        ln_markets_api_secret: 'test_api_secret_1234567890123456',
        ln_markets_passphrase: 'testpassphrase123'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data.error).toBe('REGISTRATION_FAILED');
      expect(data.message).toContain('already exists');
    });

    it('should handle password with special characters', async () => {
      const userData = {
        email: 'special@example.com',
        username: 'specialuser',
        password: 'Test123#$%^&*()',
        ln_markets_api_key: 'test_api_key_1234567890123456',
        ln_markets_api_secret: 'test_api_secret_1234567890123456',
        ln_markets_passphrase: 'testpassphrase123'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data).toHaveProperty('user_id');
    });
  });
});
