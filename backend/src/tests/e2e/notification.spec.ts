import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Notification E2E Tests', () => {
  let testUser: any;
  let authToken: string;

  test.beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `notification-test-${Date.now()}@example.com`,
        username: `notificationtest${Date.now()}`,
        password_hash: '$2b$10$test.hash',
        plan_type: 'pro',
      },
    });

    authToken = 'mock-jwt-token-for-testing';
  });

  test.afterAll(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({
      where: { user_id: testUser.id },
    });
    await prisma.notificationLog.deleteMany({
      where: { user_id: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  test('Create and configure notification channels', async ({ request }) => {
    // Create Telegram notification
    const telegramResponse = await request.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'telegram',
        channel_config: {
          chatId: '123456789',
        },
      },
    });

    expect(telegramResponse.status()).toBe(200);

    const telegramData = await telegramResponse.json();
    expect(telegramData.success).toBe(true);
    expect(telegramData.data.type).toBe('telegram');

    // Create Email notification
    const emailResponse = await request.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'email',
        channel_config: {
          email: 'test@example.com',
        },
      },
    });

    expect(emailResponse.status()).toBe(200);

    const emailData = await emailResponse.json();
    expect(emailData.success).toBe(true);
    expect(emailData.data.type).toBe('email');
  });

  test('List user notifications', async ({ request }) => {
    const response = await request.get('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.data)).toBe(true);
    expect(responseData.data.length).toBeGreaterThan(0);
  });

  test('Update notification settings', async ({ request }) => {
    // First get existing notifications
    const listResponse = await request.get('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const listData = await listResponse.json();
    const notificationId = listData.data[0].id;

    // Update notification
    const updateResponse = await request.put(`/api/notifications/${notificationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        is_enabled: false,
        channel_config: {
          chatId: '987654321',
        },
      },
    });

    expect(updateResponse.status()).toBe(200);

    const updateData = await updateResponse.json();
    expect(updateData.success).toBe(true);
    expect(updateData.data.is_enabled).toBe(false);
  });

  test('Send test notification', async ({ request }) => {
    const testMessage = 'This is a test notification from E2E tests';

    const response = await request.post('/api/notifications/test', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'telegram',
        message: testMessage,
      },
    });

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.message).toContain('queued successfully');
  });

  test('Get notification logs', async ({ request }) => {
    const response = await request.get('/api/notifications/logs', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(responseData.pagination).toBeDefined();
  });

  test('Get notification statistics', async ({ request }) => {
    const response = await request.get('/api/notifications/stats', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(typeof responseData.data.total_sent).toBe('number');
    expect(typeof responseData.data.success_rate).toBe('number');
  });

  test('Delete notification', async ({ request }) => {
    // First get existing notifications
    const listResponse = await request.get('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const listData = await listResponse.json();
    const notificationId = listData.data[0].id;

    // Delete notification
    const deleteResponse = await request.delete(`/api/notifications/${notificationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(deleteResponse.status()).toBe(200);

    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);
  });

  test('Notification validation errors', async ({ request }) => {
    // Try to create notification with invalid config
    const response = await request.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'telegram',
        channel_config: {
          // Missing chatId
        },
      },
    });

    expect(response.status()).toBe(400);

    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toContain('required');
  });
});

