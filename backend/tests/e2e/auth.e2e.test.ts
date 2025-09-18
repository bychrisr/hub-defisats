import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Authentication E2E Tests', () => {
  let app: FastifyInstance;
  let testUser: any;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test@'
        }
      }
    });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        username: 'testuser',
        ln_markets_api_key: 'test_api_key',
        ln_markets_passphrase: 'test_passphrase'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(userData.email);
      expect(body.data.user.username).toBe(userData.username);
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();

      // Store for cleanup
      testUser = body.data.user;
    });

    it('should fail to register with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        username: 'testuser2'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBeDefined();
    });

    it('should fail to register with weak password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123',
        username: 'testuser3'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBeDefined();
    });

    it('should fail to register with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        username: 'testuser4'
      };

      // First registration
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      // Second registration with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('CONFLICT');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        username: 'testuser',
        ln_markets_api_key: 'test_api_key',
        ln_markets_passphrase: 'test_passphrase'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      testUser = JSON.parse(response.payload).data.user;
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(loginData.email);
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    });

    it('should fail to login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
    });

    it('should fail to login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Token Validation', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create a test user and get token
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        username: 'testuser',
        ln_markets_api_key: 'test_api_key',
        ln_markets_passphrase: 'test_passphrase'
      };

      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      const body = JSON.parse(registerResponse.payload);
      authToken = body.data.token;
      testUser = body.data.user;
    });

    it('should access protected route with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('test@example.com');
    });

    it('should fail to access protected route without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me'
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
    });

    it('should fail to access protected route with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Token Refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create a test user and get refresh token
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        username: 'testuser',
        ln_markets_api_key: 'test_api_key',
        ln_markets_passphrase: 'test_passphrase'
      };

      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      const body = JSON.parse(registerResponse.payload);
      refreshToken = body.data.refreshToken;
      testUser = body.data.user;
    });

    it('should refresh token successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    });

    it('should fail to refresh with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken: 'invalid_refresh_token'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Password Reset', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        username: 'testuser',
        ln_markets_api_key: 'test_api_key',
        ln_markets_passphrase: 'test_passphrase'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData
      });

      testUser = JSON.parse(response.payload).data.user;
    });

    it('should request password reset successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: {
          email: 'test@example.com'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.message).toContain('Password reset email sent');
    });

    it('should fail to request password reset for non-existent email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: {
          email: 'nonexistent@example.com'
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('NOT_FOUND');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      // Make multiple failed login attempts
      const promises = Array(10).fill(null).map(() =>
        app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: loginData
        })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});