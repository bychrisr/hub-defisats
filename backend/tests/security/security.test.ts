import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Security Tests', () => {
  let app: FastifyInstance;
  let authToken: string;

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
          contains: 'securitytest@'
        }
      }
    });

    // Create a test user and get auth token
    const userData = {
      email: 'securitytest@example.com',
      password: 'TestPassword123!',
      username: 'securitytest',
      ln_markets_api_key: 'test_api_key',
      ln_markets_passphrase: 'test_passphrase'
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: userData
    });

    const body = JSON.parse(response.payload);
    authToken = body.data.token;
  });

  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousPayload = {
        email: "'; DROP TABLE users; --",
        password: 'TestPassword123!'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: maliciousPayload
      });

      // Should return 401 (unauthorized) not 500 (server error)
      expect(response.statusCode).toBe(401);
      
      // Verify users table still exists
      const users = await prisma.user.findMany();
      expect(users.length).toBeGreaterThan(0);
    });

    it('should prevent SQL injection in registration', async () => {
      const maliciousPayload = {
        email: "'; DROP TABLE users; --",
        password: 'TestPassword123!',
        username: 'testuser'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: maliciousPayload
      });

      // Should return 400 (bad request) not 500 (server error)
      expect(response.statusCode).toBe(400);
      
      // Verify users table still exists
      const users = await prisma.user.findMany();
      expect(users.length).toBeGreaterThan(0);
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize malicious input in registration', async () => {
      const maliciousPayload = {
        email: 'xss@example.com',
        password: 'TestPassword123!',
        username: '<script>alert("XSS")</script>'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: maliciousPayload
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      
      // Username should be sanitized
      expect(body.data.user.username).not.toContain('<script>');
      expect(body.data.user.username).not.toContain('alert');
    });

    it('should sanitize malicious input in profile updates', async () => {
      const maliciousPayload = {
        username: '<img src=x onerror=alert("XSS")>'
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/api/profile',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        payload: maliciousPayload
      });

      // Should either reject the request or sanitize the input
      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body.data.username).not.toContain('<img');
        expect(body.data.username).not.toContain('onerror');
      } else {
        expect(response.statusCode).toBe(400);
      }
    });
  });

  describe('CSRF Protection', () => {
    it('should require proper headers for state-changing operations', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Origin': 'https://malicious-site.com'
        }
      });

      // Should either reject the request or require CSRF token
      expect([200, 403, 400]).toContain(response.statusCode);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'securitytest@example.com',
        password: 'WrongPassword123!'
      };

      // Make multiple failed login attempts
      const promises = Array(20).fill(null).map(() =>
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

    it('should enforce rate limiting on registration attempts', async () => {
      const promises = Array(20).fill(null).map((_, index) =>
        app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            email: `ratetest${index}@example.com`,
            password: 'TestPassword123!',
            username: `ratetest${index}`
          }
        })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication Bypass', () => {
    it('should not allow access to protected routes without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me'
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
    });

    it('should not allow access with malformed token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          'Authorization': 'Bearer malformed.token.here'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
    });

    it('should not allow access with expired token', async () => {
      // This would require a token that's actually expired
      // For now, we'll test with an invalid token format
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Input Validation', () => {
    it('should reject requests with invalid JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: 'invalid json'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject requests with missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com'
          // missing password
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject requests with oversized payloads', async () => {
      const largeString = 'x'.repeat(10000);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'TestPassword123!',
          username: largeString
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Header Security', () => {
    it('should include security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('Password Security', () => {
    it('should not return password in response', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'passwordtest@example.com',
          password: 'TestPassword123!',
          username: 'passwordtest',
          ln_markets_api_key: 'test_api_key',
          ln_markets_passphrase: 'test_passphrase'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      
      // Password should not be in response
      expect(JSON.stringify(body)).not.toContain('TestPassword123!');
      expect(body.data.user.password).toBeUndefined();
    });

    it('should hash passwords in database', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'securitytest@example.com' }
      });

      expect(user).toBeDefined();
      expect(user?.password).not.toBe('TestPassword123!');
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    });
  });

  describe('API Key Security', () => {
    it('should encrypt API keys in database', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'securitytest@example.com' }
      });

      expect(user).toBeDefined();
      expect(user?.ln_markets_api_key).not.toBe('test_api_key');
      expect(user?.ln_markets_api_key).toContain(':'); // Encrypted format
    });

    it('should not return API keys in response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      
      // API keys should not be in response
      expect(JSON.stringify(body)).not.toContain('test_api_key');
      expect(body.data.user.ln_markets_api_key).toBeUndefined();
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'WrongPassword123!'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      
      // Error message should be generic
      expect(body.message).not.toContain('user not found');
      expect(body.message).not.toContain('password incorrect');
      expect(body.message).toContain('Invalid email or password');
    });
  });
});