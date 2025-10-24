import { test, expect } from '@playwright/test';

test('Header, Title and Dashboard synchronize', async ({ page }) => {
  // Mock dashboard API with realistic data
  await page.route('**/api/lnmarkets-robust/dashboard', route =>
    route.fulfill({
      json: {
        success: true,
        data: {
          lnMarkets: {
            positions: [
              {
                id: 'pos-1',
                quantity: 100,
                price: 50000,
                entry_price: 48000,
                liquidation: 40000,
                leverage: 10,
                margin: 1000,
                pl: 200,
                unrealized_pnl: 200,
                maintenance_margin: 50,
                opening_fee: 5,
                closing_fee: 5,
                sum_carry_fees: 10,
                running: true,
                side: 'b',
                creation_ts: Date.now(),
                market_filled_ts: Date.now()
              }
            ],
            ticker: {
              lastPrice: 50000,
              index: 50000,
              change24h: 2.5
            }
          }
        }
      }
    })
  );

  // Mock menu API
  await page.route('**/api/menu', route =>
    route.fulfill({
      json: {
        success: true,
        data: {
          menus: []
        }
      }
    })
  );

  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  
  // Wait for data to load
  await page.waitForTimeout(2000);
  
  // Check title updates with P&L
  await expect(page).toHaveTitle(/Axisor - P&L:/);
  
  // Check header displays correct trading fees
  const headerFees = page.getByTestId('header-trading-fees');
  await expect(headerFees).toContainText('0.010%'); // 10 sats = 0.010%
  
  // Check dashboard card displays correct total fees
  const dashboardFees = page.getByTestId('dashboard-total-fees');
  await expect(dashboardFees).toContainText('10'); // 10 sats total fees
  
  // Check that both header and dashboard show the same data
  const headerText = await headerFees.textContent();
  const dashboardText = await dashboardFees.textContent();
  
  // Both should show fees (header as percentage, dashboard as sats)
  expect(headerText).toContain('0.010%');
  expect(dashboardText).toContain('10');
});

test('Empty positions show zero values', async ({ page }) => {
  // Mock dashboard API with empty positions
  await page.route('**/api/lnmarkets-robust/dashboard', route =>
    route.fulfill({
      json: {
        success: true,
        data: {
          lnMarkets: {
            positions: [],
            ticker: {
              lastPrice: 50000,
              index: 50000,
              change24h: 2.5
            }
          }
        }
      }
    })
  );

  // Mock menu API
  await page.route('**/api/menu', route =>
    route.fulfill({
      json: {
        success: true,
        data: {
          menus: []
        }
      }
    })
  );

  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(2000);
  
  // Check that zero values are displayed correctly
  const headerFees = page.getByTestId('header-trading-fees');
  await expect(headerFees).toContainText('0.000%');
  
  const dashboardFees = page.getByTestId('dashboard-total-fees');
  await expect(dashboardFees).toContainText('0');
});
