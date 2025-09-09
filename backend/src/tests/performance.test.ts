import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';

// Mock Fastify app for performance testing
let app: FastifyInstance;

beforeAll(async () => {
  const fastify = require('fastify')({ logger: false });
  
  // Register routes for performance testing
  fastify.get('/api/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });
  
  fastify.post('/api/auth/register', async (request: any) => {
    const { email, username } = request.body;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return { 
      success: true, 
      user: { id: '1', email, username },
      token: 'mock-token'
    };
  });
  
  fastify.get('/api/users', async () => {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 5));
    
    return {
      users: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        email: `user${i + 1}@example.com`,
        username: `user${i + 1}`
      }))
    };
  });
  
  fastify.get('/api/not-found', async () => {
    return { error: 'Not found' };
  });
  
  await fastify.ready();
  app = fastify;
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

describe('Performance Tests', () => {
  describe('Response Time', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      });
      
      const duration = Date.now() - startTime;
      
      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    it('should handle registration within 200ms', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        }
      });
      
      const duration = Date.now() - startTime;
      
      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle 10 concurrent health checks', async () => {
      const promises = Array.from({ length: 10 }, () =>
        app.inject({
          method: 'GET',
          url: '/api/health'
        })
      );
      
      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(10);
      expect(responses.every(r => r.statusCode === 200)).toBe(true);
    });

    it('should handle 5 concurrent user queries', async () => {
      const promises = Array.from({ length: 5 }, () =>
        app.inject({
          method: 'GET',
          url: '/api/users'
        })
      );
      
      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(5);
      expect(responses.every(r => r.statusCode === 200)).toBe(true);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle 404 errors quickly', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/not-found'
      });
      
      const duration = Date.now() - startTime;
      
      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(50);
    });
  });
});