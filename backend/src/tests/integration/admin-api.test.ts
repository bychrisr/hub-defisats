import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { build } from '../helpers/build';

describe('Admin API Integration Tests', () => {
  let app: FastifyInstance;
  let adminToken: string;

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Mock admin token - in real tests, you would create a real admin user
    adminToken = 'mock-admin-token';
  });

  describe('Dashboard Metrics', () => {
    it('should return dashboard metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard/metrics',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('totalUsers');
      expect(data).toHaveProperty('activeUsers');
      expect(data).toHaveProperty('monthlyRevenue');
      expect(data).toHaveProperty('totalTrades');
      expect(data).toHaveProperty('systemUptime');
      expect(data).toHaveProperty('uptimePercentage');
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard/metrics',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should require admin privileges', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard/metrics',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Trading Analytics', () => {
    it('should return trading analytics with default parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/trading/analytics',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metrics');
      expect(Array.isArray(data.users)).toBe(true);
    });

    it('should support search parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/trading/analytics?search=test',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/trading/analytics?page=2&limit=5',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);
    });

    it('should support sorting', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/trading/analytics?sortBy=totalTrades&sortOrder=asc',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Trade Logs', () => {
    it('should return trade logs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/trades/logs',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('tradeLogs');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.tradeLogs)).toBe(true);
    });

    it('should support status filter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/trades/logs?status=completed',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should support action filter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/trades/logs?action=buy',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should support date range filter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/trades/logs?startDate=2024-01-01&endDate=2024-01-31',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Payment Analytics', () => {
    it('should return payment analytics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/payments/analytics',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('payments');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metrics');
      expect(Array.isArray(data.payments)).toBe(true);
    });

    it('should support status filter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/payments/analytics?status=completed',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Backtest Reports', () => {
    it('should return backtest reports', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/backtests/reports',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('backtestReports');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metrics');
      expect(Array.isArray(data.backtestReports)).toBe(true);
    });
  });

  describe('Simulation Analytics', () => {
    it('should return simulation analytics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/simulations/analytics',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('simulations');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metrics');
      expect(Array.isArray(data.simulations)).toBe(true);
    });
  });

  describe('Automation Management', () => {
    it('should return automation management data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/automations/management',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('automations');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metrics');
      expect(Array.isArray(data.automations)).toBe(true);
    });
  });

  describe('Notification Management', () => {
    it('should return notification management data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/notifications/management',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('templates');
      expect(data).toHaveProperty('notifications');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metrics');
    });
  });

  describe('System Reports', () => {
    it('should return system reports', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/reports/system',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('systemReports');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metrics');
      expect(Array.isArray(data.systemReports)).toBe(true);
    });
  });

  describe('Audit Logs', () => {
    it('should return audit logs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('auditLogs');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metrics');
      expect(Array.isArray(data.auditLogs)).toBe(true);
    });

    it('should support severity filter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?severity=critical',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/invalid/endpoint',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid query parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard/metrics?page=invalid',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      // Should still work with default parameters
      expect([200, 400]).toContain(response.statusCode);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/admin/dashboard/metrics',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
        })
      );

      const responses = await Promise.all(promises);
      
      // All should succeed or some might be rate limited
      responses.forEach(response => {
        expect([200, 429]).toContain(response.statusCode);
      });
    });
  });
});
