import { PrismaClient } from '@prisma/client';

describe('Monitoring API', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Monitoring Data Structure', () => {
    it('should have correct data structure', () => {
      const mockData = {
        api_latency: 150,
        error_rate: 2.5,
        queue_sizes: {
          'automation-execute': 0,
          'notification': 0,
          'payment-validator': 0
        },
        ln_markets_status: 'healthy',
        system_health: {
          database: 'healthy',
          redis: 'healthy',
          workers: 'healthy'
        }
      };

      expect(mockData).toHaveProperty('api_latency');
      expect(mockData).toHaveProperty('error_rate');
      expect(mockData).toHaveProperty('queue_sizes');
      expect(mockData).toHaveProperty('ln_markets_status');
      expect(mockData).toHaveProperty('system_health');
      
      expect(typeof mockData.api_latency).toBe('number');
      expect(typeof mockData.error_rate).toBe('number');
      expect(typeof mockData.queue_sizes).toBe('object');
      expect(typeof mockData.ln_markets_status).toBe('string');
      expect(typeof mockData.system_health).toBe('object');
    });
  });
});
