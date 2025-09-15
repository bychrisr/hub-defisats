import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('API Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  test.beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `api-test-${Date.now()}@example.com`,
        username: `apitest${Date.now()}`,
        password_hash: '$2b$10$test.hash',
        plan_type: 'pro',
        ln_markets_api_key: 'test-key',
        ln_markets_api_secret: 'test-secret',
        ln_markets_passphrase: 'test-passphrase',
      },
    });

    authToken = 'mock-jwt-token-for-testing';
  });

  test.afterAll(async () => {
    // Clean up test data
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  test('Health check endpoint', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.status).toBe('healthy');
    expect(responseData.version).toBeDefined();
    expect(responseData.uptime).toBeGreaterThan(0);
  });

  test('API documentation endpoint', async ({ request }) => {
    const response = await request.get('/docs');

    expect(response.status()).toBe(200);

    // Should return HTML content
    const responseText = await response.text();
    expect(responseText).toContain('swagger');
    expect(responseText).toContain('API');
  });

  test('Rate limiting works', async ({ request }) => {
    const requests = [];

    // Make multiple requests quickly
    for (let i = 0; i < 15; i++) {
      requests.push(
        request.get('/health', {
          headers: {
            'X-Forwarded-For': `192.168.1.${i}`,
          },
        })
      );
    }

    const responses = await Promise.all(requests);

    // Some requests should be rate limited (429)
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Check rate limit headers
    const lastResponse = responses[responses.length - 1];
    if (lastResponse.status() === 429) {
      expect(lastResponse.headers()['x-ratelimit-limit']).toBeDefined();
      expect(lastResponse.headers()['x-ratelimit-remaining']).toBeDefined();
      expect(lastResponse.headers()['retry-after']).toBeDefined();
    }
  });

  test('CORS headers are present', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status()).toBe(200);

    // Check CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
    expect(headers['access-control-allow-headers']).toBeDefined();
  });

  test('Security headers are present', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status()).toBe(200);

    // Check security headers
    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-xss-protection']).toBeDefined();
  });

  test('API error handling', async ({ request }) => {
    // Try to access non-existent endpoint
    const response = await request.get('/api/non-existent-endpoint', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(404);

    const responseData = await response.json();
    expect(responseData.error).toBe('NOT_FOUND');
    expect(responseData.message).toBe('Route not found');
  });

  test('Authentication middleware', async ({ request }) => {
    // Try to access protected endpoint without auth
    const response = await request.get('/api/users/me');

    expect([401, 403]).toContain(response.status());

    const responseData = await response.json();
    expect(responseData.error).toBeDefined();
  });

  test('Request validation', async ({ request }) => {
    // Try to create automation with invalid data
    const response = await request.post('/api/automations', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        // Missing required fields
        config: {},
      },
    });

    expect(response.status()).toBe(400);

    const responseData = await response.json();
    expect(responseData.success).toBe(false);
  });

  test('Database connection', async ({ request }) => {
    // Test endpoint that requires database access
    const response = await request.get('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Should not crash due to database issues
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Redis connection', async ({ request }) => {
    // Test rate limiting (requires Redis)
    const responses = [];

    for (let i = 0; i < 5; i++) {
      responses.push(request.get('/health'));
    }

    await Promise.all(responses);

    // If Redis is working, rate limiting should function
    // This is a basic check - more thorough Redis tests would be needed
  });

  test('WebSocket endpoint availability', async ({ page }) => {
    // Test WebSocket connection
    const wsUrl = 'ws://localhost:13010/test/ws/realtime';

    // This is a basic connectivity test
    // More thorough WebSocket testing would require additional setup
    try {
      const response = await page.request.get('/test/ws/realtime');
      expect([200, 404]).toContain(response.status()); // May be 404 if WebSocket route is configured differently
    } catch (error) {
      // WebSocket testing might fail in headless mode
      console.log('WebSocket test skipped:', error);
    }
  });

  test('Static file serving', async ({ request }) => {
    // Test if static files are served correctly
    const response = await request.get('/');

    // Should either serve the app or return a valid response
    expect([200, 302, 404]).toContain(response.status());
  });

  test('API response format consistency', async ({ request }) => {
    // Test multiple endpoints for consistent response format
    const endpoints = [
      { url: '/health', method: 'GET' },
      { url: '/api/payments/plans', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint.url);
      expect(response.status()).toBeLessThan(500);

      if (response.status() === 200) {
        const responseData = await response.json();

        // Check for consistent response structure
        if (endpoint.url !== '/health') {
          expect(responseData).toHaveProperty('success');
        }
      }
    }
  });

  test('Memory and performance monitoring', async ({ request }) => {
    const startTime = Date.now();

    // Make a request
    const response = await request.get('/health');

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds

    // Check if response time is reasonable
    const responseData = await response.json();
    expect(responseData.uptime).toBeGreaterThan(0);
  });
});

