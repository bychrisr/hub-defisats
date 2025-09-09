import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');

    // Check if the page loads
    await expect(page).toHaveTitle(/defiSATS/);

    // Check for main dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Margin Atual')).toBeVisible();
  });

  test('should display status cards', async ({ page }) => {
    await page.goto('/');

    // Check for metric cards
    await expect(page.locator('text=Margem Atual')).toBeVisible();
    await expect(page.locator('text=Capital Protegido')).toBeVisible();
    await expect(page.locator('text=Trades Salvos')).toBeVisible();
    await expect(page.locator('text=Uptime')).toBeVisible();
  });

  test('should show automation controls', async ({ page }) => {
    await page.goto('/');

    // Check for automation section
    await expect(page.locator('text=Controles de Automação')).toBeVisible();
    await expect(page.locator('text=Margin Guard')).toBeVisible();
    await expect(page.locator('text=Take Profit / Stop Loss')).toBeVisible();
  });
});
