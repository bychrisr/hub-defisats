import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Automation E2E Tests', () => {
  let testUser: any;
  let authToken: string;

  test.beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `automation-test-${Date.now()}@example.com`,
        username: `automationtest${Date.now()}`,
        password_hash: '$2b$10$test.hash',
        plan_type: 'pro',
        ln_markets_api_key: 'test-key',
        ln_markets_api_secret: 'test-secret',
        ln_markets_passphrase: 'test-passphrase',
      },
    });

    // Mock JWT token for testing
    authToken = 'mock-jwt-token-for-testing';
  });

  test.afterAll(async () => {
    // Clean up test data
    await prisma.automation.deleteMany({
      where: { user_id: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  test('Create Margin Guard automation', async ({ request }) => {
    const automationData = {
      type: 'margin_guard',
      config: {
        margin_threshold: 15,
        action: 'close_position',
        reduce_percentage: 50,
        add_margin_amount: 1000,
      },
    };

    const response = await request.post('/api/automations', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: automationData,
    });

    expect(response.status()).toBe(201);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.type).toBe('margin_guard');
    expect(responseData.data.is_active).toBe(true);
  });

  test('Create Auto Entry automation', async ({ request }) => {
    const automationData = {
      type: 'auto_entry',
      config: {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 5,
        stoploss: 25000,
        takeprofit: 35000,
        trigger_price: 30000,
        trigger_type: 'market',
      },
    };

    const response = await request.post('/api/automations', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: automationData,
    });

    expect(response.status()).toBe(201);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.type).toBe('auto_entry');
  });

  test('Create TP/SL automation', async ({ request }) => {
    const automationData = {
      type: 'tp_sl',
      config: {
        action: 'update_tp',
        new_takeprofit: 25,
        trigger_pnl_percentage: 10,
      },
    };

    const response = await request.post('/api/automations', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: automationData,
    });

    expect(response.status()).toBe(201);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.type).toBe('tp_sl');
  });

  test('List user automations', async ({ request }) => {
    const response = await request.get('/api/automations', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.data)).toBe(true);
  });

  test('Update automation', async ({ request }) => {
    // First create an automation
    const createResponse = await request.post('/api/automations', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'margin_guard',
        config: {
          margin_threshold: 10,
          action: 'close_position',
        },
      },
    });

    const createData = await createResponse.json();
    const automationId = createData.data.id;

    // Update the automation
    const updateResponse = await request.put(`/api/automations/${automationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        config: {
          margin_threshold: 12,
          action: 'reduce_position',
          reduce_percentage: 30,
        },
      },
    });

    expect(updateResponse.status()).toBe(200);

    const updateData = await updateResponse.json();
    expect(updateData.success).toBe(true);
    expect(updateData.data.config.margin_threshold).toBe(12);
  });

  test('Toggle automation status', async ({ request }) => {
    // First create an automation
    const createResponse = await request.post('/api/automations', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'margin_guard',
        config: {
          margin_threshold: 10,
          action: 'close_position',
        },
      },
    });

    const createData = await createResponse.json();
    const automationId = createData.data.id;

    // Toggle status
    const toggleResponse = await request.patch(`/api/automations/${automationId}/toggle`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(toggleResponse.status()).toBe(200);

    const toggleData = await toggleResponse.json();
    expect(toggleData.success).toBe(true);
    expect(toggleData.data.is_active).toBe(false);
  });

  test('Delete automation', async ({ request }) => {
    // First create an automation
    const createResponse = await request.post('/api/automations', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'margin_guard',
        config: {
          margin_threshold: 10,
          action: 'close_position',
        },
      },
    });

    const createData = await createResponse.json();
    const automationId = createData.data.id;

    // Delete the automation
    const deleteResponse = await request.delete(`/api/automations/${automationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(deleteResponse.status()).toBe(200);

    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);
  });

  test('Automation validation errors', async ({ request }) => {
    // Try to create automation with invalid data
    const response = await request.post('/api/automations', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'invalid_type',
        config: {},
      },
    });

    expect(response.status()).toBe(400);

    const responseData = await response.json();
    expect(responseData.success).toBe(false);
  });
});

