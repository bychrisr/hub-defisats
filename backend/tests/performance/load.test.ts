import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Performance Load Tests', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Create a test user and get auth token
    const userData = {
      email: 'perftest@example.com',
      password: 'TestPassword123!',
      username: 'perftest',
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

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: 'perftest@example.com'
      }
    });

    if (app) {
      await app.close();
    }
  });

  describe('Health Check Performance', () => {
    it('should handle 100 concurrent health check requests', async () => {
      const startTime = Date.now();
      const promises = Array(100).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/health'
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);

      console.log(`100 concurrent health checks completed in ${duration}ms`);
    });

    it('should handle 1000 sequential health check requests', async () => {
      const startTime = Date.now();
      const responses = [];

      for (let i = 0; i < 1000; i++) {
        const response = await app.inject({
          method: 'GET',
          url: '/health'
        });
        responses.push(response);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);

      console.log(`1000 sequential health checks completed in ${duration}ms`);
    });
  });

  describe('Authentication Performance', () => {
    it('should handle 50 concurrent login requests', async () => {
      const startTime = Date.now();
      const promises = Array(50).fill(null).map((_, index) =>
        app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: {
            email: 'perftest@example.com',
            password: 'TestPassword123!'
          }
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);

      console.log(`50 concurrent login requests completed in ${duration}ms`);
    });

    it('should handle 100 concurrent protected route requests', async () => {
      const startTime = Date.now();
      const promises = Array(100).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/auth/me',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // Should complete within 15 seconds
      expect(duration).toBeLessThan(15000);

      console.log(`100 concurrent protected route requests completed in ${duration}ms`);
    });
  });

  describe('Database Performance', () => {
    it('should handle 100 concurrent user creation requests', async () => {
      const startTime = Date.now();
      const promises = Array(100).fill(null).map((_, index) =>
        app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            email: `perftest${index}@example.com`,
            password: 'TestPassword123!',
            username: `perftest${index}`,
            ln_markets_api_key: 'test_api_key',
            ln_markets_passphrase: 'test_passphrase'
          }
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Most requests should succeed (some might fail due to rate limiting)
      const successfulResponses = responses.filter(r => r.statusCode === 201);
      expect(successfulResponses.length).toBeGreaterThan(80);

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);

      console.log(`${successfulResponses.length}/100 user creation requests completed in ${duration}ms`);

      // Clean up created users
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'perftest'
          }
        }
      });
    });
  });

  describe('Memory Usage', () => {
    it('should not exceed memory limits during load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const promises = Array(200).fill(null).map((_, index) =>
        app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            email: `memtest${index}@example.com`,
            password: 'TestPassword123!',
            username: `memtest${index}`,
            ln_markets_api_key: 'test_api_key',
            ln_markets_passphrase: 'test_passphrase'
          }
        })
      );

      await Promise.all(promises);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);

      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);

      // Clean up
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'memtest'
          }
        }
      });
    });
  });

  describe('Response Time Distribution', () => {
    it('should have consistent response times', async () => {
      const responseTimes: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();
        await app.inject({
          method: 'GET',
          url: '/health'
        });
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      console.log(`Response time stats:`, {
        avg: `${avgResponseTime.toFixed(2)}ms`,
        min: `${minResponseTime}ms`,
        max: `${maxResponseTime}ms`,
        p95: `${p95ResponseTime}ms`
      });

      // Average response time should be less than 100ms
      expect(avgResponseTime).toBeLessThan(100);
      
      // 95th percentile should be less than 200ms
      expect(p95ResponseTime).toBeLessThan(200);
    });
  });
});