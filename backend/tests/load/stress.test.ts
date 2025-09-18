import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Stress Tests', () => {
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
          contains: 'stresstest@'
        }
      }
    });

    // Create a test user and get auth token
    const userData = {
      email: 'stresstest@example.com',
      password: 'TestPassword123!',
      username: 'stresstest',
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

  describe('High Concurrency Tests', () => {
    it('should handle 500 concurrent health check requests', async () => {
      const startTime = Date.now();
      const promises = Array(500).fill(null).map(() =>
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

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);

      console.log(`500 concurrent health checks completed in ${duration}ms`);
    });

    it('should handle 200 concurrent authenticated requests', async () => {
      const startTime = Date.now();
      const promises = Array(200).fill(null).map(() =>
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

      console.log(`200 concurrent authenticated requests completed in ${duration}ms`);
    });

    it('should handle 100 concurrent user registrations', async () => {
      const startTime = Date.now();
      const promises = Array(100).fill(null).map((_, index) =>
        app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            email: `stresstest${index}@example.com`,
            password: 'TestPassword123!',
            username: `stresstest${index}`,
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

      console.log(`${successfulResponses.length}/100 user registrations completed in ${duration}ms`);

      // Clean up created users
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'stresstest'
          }
        }
      });
    });
  });

  describe('Sustained Load Tests', () => {
    it('should handle sustained load for 60 seconds', async () => {
      const startTime = Date.now();
      const endTime = startTime + 60000; // 60 seconds
      const requests: Promise<any>[] = [];
      let requestCount = 0;

      const makeRequest = async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/health'
        });
        requestCount++;
        return response;
      };

      // Start making requests continuously
      const interval = setInterval(() => {
        if (Date.now() < endTime) {
          requests.push(makeRequest());
        } else {
          clearInterval(interval);
        }
      }, 100); // Every 100ms

      // Wait for the test to complete
      await new Promise(resolve => setTimeout(resolve, 60000));

      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      const totalDuration = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      console.log(`Sustained load test: ${requestCount} requests in ${totalDuration}ms`);
      expect(requestCount).toBeGreaterThan(500); // Should handle at least 500 requests
    });

    it('should handle mixed workload for 30 seconds', async () => {
      const startTime = Date.now();
      const endTime = startTime + 30000; // 30 seconds
      const requests: Promise<any>[] = [];
      let requestCount = 0;

      const makeHealthRequest = async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/health'
        });
        requestCount++;
        return response;
      };

      const makeAuthRequest = async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/auth/me',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        requestCount++;
        return response;
      };

      // Mix of health checks and authenticated requests
      const interval = setInterval(() => {
        if (Date.now() < endTime) {
          if (Math.random() < 0.7) {
            requests.push(makeHealthRequest());
          } else {
            requests.push(makeAuthRequest());
          }
        } else {
          clearInterval(interval);
        }
      }, 50); // Every 50ms

      // Wait for the test to complete
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      const totalDuration = Date.now() - startTime;

      // Most requests should succeed
      const successfulResponses = responses.filter(r => r.statusCode === 200);
      expect(successfulResponses.length).toBeGreaterThan(requestCount * 0.95);

      console.log(`Mixed workload test: ${requestCount} requests in ${totalDuration}ms`);
      expect(requestCount).toBeGreaterThan(400); // Should handle at least 400 requests
    });
  });

  describe('Memory Stress Tests', () => {
    it('should handle memory pressure without crashing', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create many users to increase memory usage
      const promises = Array(1000).fill(null).map((_, index) =>
        app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            email: `memstress${index}@example.com`,
            password: 'TestPassword123!',
            username: `memstress${index}`,
            ln_markets_api_key: 'test_api_key',
            ln_markets_passphrase: 'test_passphrase'
          }
        })
      );

      const responses = await Promise.all(promises);
      const finalMemory = process.memoryUsage();
      
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 200MB)
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);

      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);

      // Clean up
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'memstress'
          }
        }
      });
    });

    it('should handle large payloads', async () => {
      const largeData = {
        email: 'largedata@example.com',
        password: 'TestPassword123!',
        username: 'largedata',
        ln_markets_api_key: 'test_api_key',
        ln_markets_passphrase: 'test_passphrase',
        metadata: {
          largeString: 'x'.repeat(10000),
          largeArray: Array(1000).fill('data'),
          largeObject: Object.fromEntries(
            Array(1000).fill(null).map((_, i) => [`key${i}`, `value${i}`])
          )
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: largeData
      });

      // Should either succeed or fail gracefully
      expect([201, 400, 413]).toContain(response.statusCode);

      // Clean up
      await prisma.user.deleteMany({
        where: {
          email: 'largedata@example.com'
        }
      });
    });
  });

  describe('Connection Stress Tests', () => {
    it('should handle rapid connection/disconnection', async () => {
      const promises = Array(100).fill(null).map(async (_, index) => {
        // Simulate rapid connection/disconnection
        const response = await app.inject({
          method: 'GET',
          url: '/health'
        });
        
        // Small delay to simulate connection time
        await new Promise(resolve => setTimeout(resolve, 10));
        
        return response;
      });

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should handle connection timeouts gracefully', async () => {
      const promises = Array(50).fill(null).map(async () => {
        try {
          const response = await app.inject({
            method: 'GET',
            url: '/health'
          });
          return response;
        } catch (error) {
          // Should handle timeouts gracefully
          return { statusCode: 500, error: error.message };
        }
      });

      const responses = await Promise.all(promises);
      
      // Most requests should succeed
      const successfulResponses = responses.filter(r => r.statusCode === 200);
      expect(successfulResponses.length).toBeGreaterThan(40);
    });
  });

  describe('Error Recovery Tests', () => {
    it('should recover from temporary failures', async () => {
      // Simulate temporary failures by making requests with invalid data
      const promises = Array(100).fill(null).map(async (_, index) => {
        if (index % 10 === 0) {
          // Every 10th request is invalid
          return app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
              email: 'invalid@example.com',
              password: 'wrongpassword'
            }
          });
        } else {
          // Valid request
          return app.inject({
            method: 'GET',
            url: '/health'
          });
        }
      });

      const responses = await Promise.all(promises);
      
      // Valid requests should succeed
      const validResponses = responses.filter((r, i) => i % 10 !== 0);
      validResponses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
      
      // Invalid requests should fail gracefully
      const invalidResponses = responses.filter((r, i) => i % 10 === 0);
      invalidResponses.forEach(response => {
        expect([401, 400]).toContain(response.statusCode);
      });
    });
  });

  describe('Performance Degradation Tests', () => {
    it('should maintain performance under load', async () => {
      const responseTimes: number[] = [];
      
      // Make requests under load
      const promises = Array(200).fill(null).map(async (_, index) => {
        const startTime = Date.now();
        const response = await app.inject({
          method: 'GET',
          url: '/health'
        });
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
        return response;
      });

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      console.log(`Performance under load:`, {
        avg: `${avgResponseTime.toFixed(2)}ms`,
        max: `${maxResponseTime}ms`,
        p95: `${p95ResponseTime}ms`
      });

      // Performance should not degrade significantly
      expect(avgResponseTime).toBeLessThan(200);
      expect(p95ResponseTime).toBeLessThan(500);
    });
  });
});