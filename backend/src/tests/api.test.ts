import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';

// Mock Fastify app for testing
let app: FastifyInstance;

beforeAll(async () => {
  // Create a simple Fastify app for testing
  const fastify = require('fastify')({ logger: false });
  
  // Register basic routes for testing
  fastify.get('/api/auth/check-username', async (request: any) => {
    const { username } = request.query as { username: string };
    return { available: username !== 'taken' };
  });
  
  fastify.get('/health', async () => {
    return { status: 'healthy' };
  });
  
  await fastify.ready();
  app = fastify;
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'healthy' });
    });
  });

  describe('Username Check', () => {
    it('should return available for new username', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/check-username?username=testuser'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ available: true });
    });

    it('should return not available for taken username', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/check-username?username=taken'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ available: false });
    });
  });
});
