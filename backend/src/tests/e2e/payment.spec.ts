import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Payment E2E Tests', () => {
  let testUser: any;
  let authToken: string;

  test.beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `payment-test-${Date.now()}@example.com`,
        username: `paymenttest${Date.now()}`,
        password_hash: '$2b$10$test.hash',
        plan_type: 'free',
      },
    });

    authToken = 'mock-jwt-token-for-testing';
  });

  test.afterAll(async () => {
    // Clean up test data
    await prisma.payment.deleteMany({
      where: { user_id: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  test('Create Lightning invoice for different plans', async ({ request }) => {
    const plans = ['basic', 'advanced', 'pro', 'lifetime'];

    for (const plan of plans) {
      const response = await request.post('/api/payments/lightning', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          plan_type: plan,
        },
      });

      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.bolt11).toBeDefined();
      expect(responseData.data.amount_sats).toBeGreaterThan(0);
      expect(responseData.data.description).toContain(plan);
    }
  });

  test('Check payment status', async ({ request }) => {
    // First create a payment
    const createResponse = await request.post('/api/payments/lightning', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        plan_type: 'basic',
      },
    });

    const createData = await createResponse.json();
    const paymentId = createData.data.id;

    // Check payment status
    const statusResponse = await request.get(`/api/payments/${paymentId}/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(statusResponse.status()).toBe(200);

    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
    expect(statusData.data.id).toBe(paymentId);
    expect(['pending', 'paid', 'expired', 'failed']).toContain(statusData.data.status);
  });

  test('Get payment details', async ({ request }) => {
    // First create a payment
    const createResponse = await request.post('/api/payments/lightning', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        plan_type: 'advanced',
      },
    });

    const createData = await createResponse.json();
    const paymentId = createData.data.id;

    // Get payment details
    const detailsResponse = await request.get(`/api/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(detailsResponse.status()).toBe(200);

    const detailsData = await detailsResponse.json();
    expect(detailsData.success).toBe(true);
    expect(detailsData.data.id).toBe(paymentId);
    expect(detailsData.data.plan_type).toBe('advanced');
  });

  test('Get user payment history', async ({ request }) => {
    // Create multiple payments first
    await request.post('/api/payments/lightning', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: { plan_type: 'basic' },
    });

    await request.post('/api/payments/lightning', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: { plan_type: 'pro' },
    });

    // Get payment history
    const historyResponse = await request.get('/api/payments', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(historyResponse.status()).toBe(200);

    const historyData = await historyResponse.json();
    expect(historyData.success).toBe(true);
    expect(Array.isArray(historyData.data)).toBe(true);
    expect(historyData.data.length).toBeGreaterThanOrEqual(2);
  });

  test('Retry expired payment', async ({ request }) => {
    // First create a payment
    const createResponse = await request.post('/api/payments/lightning', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        plan_type: 'basic',
      },
    });

    const createData = await createResponse.json();
    const paymentId = createData.data.id;

    // Try to retry payment (should fail if not expired)
    const retryResponse = await request.post(`/api/payments/${paymentId}/retry`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // This might succeed or fail depending on payment status
    expect([200, 400]).toContain(retryResponse.status());

    if (retryResponse.status() === 200) {
      const retryData = await retryResponse.json();
      expect(retryData.success).toBe(true);
      expect(retryData.data.bolt11).toBeDefined();
    }
  });

  test('Get payment statistics', async ({ request }) => {
    const statsResponse = await request.get('/api/payments/stats', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(statsResponse.status()).toBe(200);

    const statsData = await statsResponse.json();
    expect(statsData.success).toBe(true);
    expect(statsData.data).toBeDefined();
    expect(typeof statsData.data.total_payments).toBe('number');
    expect(typeof statsData.data.successful_payments).toBe('number');
  });

  test('Get plan pricing information', async ({ request }) => {
    const pricingResponse = await request.get('/api/payments/plans');

    expect(pricingResponse.status()).toBe(200);

    const pricingData = await pricingResponse.json();
    expect(pricingData.success).toBe(true);
    expect(pricingData.data).toBeDefined();

    // Check if all expected plans are present
    const expectedPlans = ['basic', 'advanced', 'pro', 'lifetime'];
    expectedPlans.forEach(plan => {
      expect(pricingData.data[plan]).toBeDefined();
      expect(pricingData.data[plan].amount_sats).toBeGreaterThan(0);
      expect(pricingData.data[plan].features).toBeDefined();
      expect(Array.isArray(pricingData.data[plan].features)).toBe(true);
    });
  });

  test('Get Lightning network status', async ({ request }) => {
    const statusResponse = await request.get('/api/payments/lightning/status');

    expect(statusResponse.status()).toBe(200);

    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
    expect(statusData.data).toBeDefined();
    expect(statusData.data.providers).toBeDefined();
    expect(typeof statusData.data.estimated_fee).toBe('number');
  });

  test('Payment validation errors', async ({ request }) => {
    // Try to create payment with invalid plan
    const invalidPlanResponse = await request.post('/api/payments/lightning', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        plan_type: 'invalid_plan',
      },
    });

    expect(invalidPlanResponse.status()).toBe(400);

    const invalidPlanData = await invalidPlanResponse.json();
    expect(invalidPlanData.success).toBe(false);
    expect(invalidPlanData.error).toContain('Invalid plan type');
  });

  test('Access control for payments', async ({ request }) => {
    // First create a payment
    const createResponse = await request.post('/api/payments/lightning', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        plan_type: 'basic',
      },
    });

    const createData = await createResponse.json();
    const paymentId = createData.data.id;

    // Try to access payment with different user token (should fail)
    const otherUserToken = 'different-user-token';

    const accessResponse = await request.get(`/api/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${otherUserToken}`,
      },
    });

    expect(accessResponse.status()).toBe(404);

    const accessData = await accessResponse.json();
    expect(accessData.success).toBe(false);
    expect(accessData.error).toBe('Payment not found');
  });
});

