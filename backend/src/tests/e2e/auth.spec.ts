import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Authentication E2E Tests', () => {
  test.beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
  });

  test.afterAll(async () => {
    // Clean up after tests
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
    await prisma.$disconnect();
  });

  test('Complete user registration and login flow', async ({ page }) => {
    const testEmail = `test-e2e-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUsername = `testuser${Date.now()}`;

    // Navigate to registration page
    await page.goto('http://localhost:3001/register');

    // Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Fill LN Markets credentials (use test credentials)
    await page.fill('input[name="lnMarketsApiKey"]', 'test-api-key');
    await page.fill('input[name="lnMarketsApiSecret"]', 'test-api-secret');
    await page.fill('input[name="lnMarketsPassphrase"]', 'test-passphrase');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message or redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify user data in database
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    expect(user).toBeTruthy();
    expect(user?.username).toBe(testUsername);
    expect(user?.plan_type).toBe('free');
  });

  test('User login with valid credentials', async ({ page }) => {
    // First create a test user
    const testEmail = `login-test-e2e-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    await prisma.user.create({
      data: {
        email: testEmail,
        username: `logintest${Date.now()}`,
        password_hash: '$2b$10$test.hash', // Mock hash for test
        plan_type: 'free',
      },
    });

    // Navigate to login page
    await page.goto('http://localhost:3001/login');

    // Fill login form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });

    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3001/login');

    // Fill with invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify error message appears
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('Password reset flow', async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('http://localhost:3001/forgot-password');

    // Fill email
    await page.fill('input[name="email"]', 'test@example.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });

  test('Protected routes redirect to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('http://localhost:3001/dashboard');

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('Admin access control', async ({ page }) => {
    // Try to access admin routes without admin privileges
    await page.goto('http://localhost:3001/admin/dashboard');

    // Should redirect to login or show access denied
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });
});

