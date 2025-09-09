import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';

// Mock Fastify app for validation testing
let app: FastifyInstance;

beforeAll(async () => {
  const fastify = require('fastify')({ logger: false });
  
  // Register validation middleware
  const { validateRegisterInput } = require('../middleware/validation.middleware');
  
  // Register route with validation
  fastify.post('/api/auth/register', {
    preHandler: validateRegisterInput,
    handler: async (request: any, reply: any) => {
      return reply.status(201).send({
        success: true,
        message: 'User registered successfully',
        user: {
          email: request.body.email,
          username: request.body.username
        }
      });
    }
  });
  
  await fastify.ready();
  app = fastify;
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

describe('Validation Middleware Tests', () => {
  describe('Password Validation', () => {
    it('should accept password with # character', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Test123#',
          confirmPassword: 'Test123#',
          ln_markets_api_key: 'test_api_key_1234567890123456',
          ln_markets_api_secret: 'test_api_secret_1234567890123456',
          ln_markets_passphrase: 'testpassphrase123'
        }
      });
      
      expect(response.statusCode).toBe(201);
      expect(response.json()).toHaveProperty('success', true);
    });

    it('should accept password with $ character', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test2@example.com',
          username: 'testuser2',
          password: 'Test123$',
          confirmPassword: 'Test123$',
          ln_markets_api_key: 'test_api_key_1234567890123456',
          ln_markets_api_secret: 'test_api_secret_1234567890123456',
          ln_markets_passphrase: 'testpassphrase123'
        }
      });
      
      expect(response.statusCode).toBe(201);
      expect(response.json()).toHaveProperty('success', true);
    });

    it('should accept password with various special characters', async () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', '"', '\\', '|', ',', '.', '<', '>', '/', '?', '~', '`'];
      
      for (const char of specialChars) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            email: `test${char}@example.com`,
            username: `testuser${char}`,
            password: `Test123${char}`,
            confirmPassword: `Test123${char}`,
            ln_markets_api_key: 'test_api_key_1234567890123456',
            ln_markets_api_secret: 'test_api_secret_1234567890123456',
            ln_markets_passphrase: 'testpassphrase123'
          }
        });
        
        expect(response.statusCode).toBe(201);
        expect(response.json()).toHaveProperty('success', true);
      }
    });

    it('should reject password without special characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test3@example.com',
          username: 'testuser3',
          password: 'Test123',
          confirmPassword: 'Test123',
          ln_markets_api_key: 'test_api_key_1234567890123456',
          ln_markets_api_secret: 'test_api_secret_1234567890123456',
          ln_markets_passphrase: 'testpassphrase123'
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error', 'VALIDATION_ERROR');
      expect(response.json()).toHaveProperty('message', 'Request validation failed');
    });

    it('should reject password that is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test4@example.com',
          username: 'testuser4',
          password: 'Test1#',
          confirmPassword: 'Test1#',
          ln_markets_api_key: 'test_api_key_1234567890123456',
          ln_markets_api_secret: 'test_api_secret_1234567890123456',
          ln_markets_passphrase: 'testpassphrase123'
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    it('should reject password without uppercase', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test5@example.com',
          username: 'testuser5',
          password: 'test123#',
          confirmPassword: 'test123#',
          ln_markets_api_key: 'test_api_key_1234567890123456',
          ln_markets_api_secret: 'test_api_secret_1234567890123456',
          ln_markets_passphrase: 'testpassphrase123'
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    it('should reject password without lowercase', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test6@example.com',
          username: 'testuser6',
          password: 'TEST123#',
          confirmPassword: 'TEST123#',
          ln_markets_api_key: 'test_api_key_1234567890123456',
          ln_markets_api_secret: 'test_api_secret_1234567890123456',
          ln_markets_passphrase: 'testpassphrase123'
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    it('should reject password without numbers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test7@example.com',
          username: 'testuser7',
          password: 'TestAbc#',
          confirmPassword: 'TestAbc#',
          ln_markets_api_key: 'test_api_key_1234567890123456',
          ln_markets_api_secret: 'test_api_secret_1234567890123456',
          ln_markets_passphrase: 'testpassphrase123'
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    it('should reject mismatched passwords', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test8@example.com',
          username: 'testuser8',
          password: 'Test123#',
          confirmPassword: 'Test123$',
          ln_markets_api_key: 'test_api_key_1234567890123456',
          ln_markets_api_secret: 'test_api_secret_1234567890123456',
          ln_markets_passphrase: 'testpassphrase123'
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error', 'VALIDATION_ERROR');
    });
  });
});
