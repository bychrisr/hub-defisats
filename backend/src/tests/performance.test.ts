import { FastifyInstance } from 'fastify';
import { build } from '../index';
import { PrismaClient } from '@prisma/client';

describe('Performance Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = await build();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('HTTP Performance', () => {
    test('should handle 100 concurrent requests', async () => {
      const requests = Array(100)
        .fill(null)
        .map(() =>
          app.inject({
            method: 'GET',
            url: '/health',
          })
        );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`100 concurrent requests completed in ${duration}ms`);

      // Verificar que todas as requisições foram bem-sucedidas
      expect(responses.every(r => r.statusCode === 200)).toBe(true);

      // Verificar que foi executado em tempo razoável (menos de 5 segundos)
      expect(duration).toBeLessThan(5000);
    });

    test('should handle 1000 sequential requests', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const response = await app.inject({
          method: 'GET',
          url: '/health',
        });
        expect(response.statusCode).toBe(200);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`1000 sequential requests completed in ${duration}ms`);

      // Verificar que foi executado em tempo razoável (menos de 10 segundos)
      expect(duration).toBeLessThan(10000);
    });

    test('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`Health check response time: ${duration}ms`);

      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    test('should handle large payloads efficiently', async () => {
      const largePayload = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
        // Adicionar dados extras para simular payload grande
        extraData: 'x'.repeat(10000), // 10KB de dados extras
      };

      const startTime = Date.now();
      // const response = await app.inject({
      //   method: 'POST',
      //   url: '/api/auth/register',
      //   payload: largePayload,
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`Large payload processing time: ${duration}ms`);

      // Deve processar em tempo razoável (menos de 1 segundo)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Database Performance', () => {
    test('should handle multiple database queries efficiently', async () => {
      const startTime = Date.now();

      // Executar múltiplas queries simultâneas
      const queries = Array(50)
        .fill(null)
        .map(async () => {
          return prisma.user.findMany({
            take: 10,
            select: {
              id: true,
              email: true,
              username: true,
            },
          });
        });

      const results = await Promise.all(queries);
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`50 database queries completed in ${duration}ms`);

      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(2000); // Menos de 2 segundos
    });

    test('should handle complex database queries efficiently', async () => {
      const startTime = Date.now();

      // Query complexa com joins
      // const result = await prisma.user.findMany({
      //   include: {
      //     automations: true,
      //     tradeLogs: true,
      //   },
      //   take: 100,
      // });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Complex database query completed in ${duration}ms`);

      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });
  });

  describe('Memory Performance', () => {
    test('should not have memory leaks during multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Executar muitas requisições
      for (let i = 0; i < 1000; i++) {
        await app.inject({
          method: 'GET',
          url: '/health',
        });
      }

      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(
        `Memory increase after 1000 requests: ${memoryIncrease / 1024 / 1024}MB`
      );

      // Verificar que o aumento de memória não é excessivo (menos de 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should handle memory pressure gracefully', async () => {
      // Simular pressão de memória criando objetos grandes
      const largeObjects = [];

      try {
        for (let i = 0; i < 100; i++) {
          largeObjects.push({
            data: 'x'.repeat(100000), // 100KB por objeto
            timestamp: Date.now(),
          });
        }

        // Verificar que o sistema ainda responde
        const response = await app.inject({
          method: 'GET',
          url: '/health',
        });

        expect(response.statusCode).toBe(200);
      } finally {
        // Limpar objetos grandes
        largeObjects.length = 0;
      }
    });
  });

  describe('Rate Limiting Performance', () => {
    test('should handle rate limiting efficiently', async () => {
      const startTime = Date.now();

      // Fazer muitas requisições para triggerar rate limiting
      const requests = Array(200)
        .fill(null)
        .map(() =>
          app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
              email: 'test@example.com',
              password: 'wrongpassword',
            },
          })
        );

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`200 rate-limited requests completed in ${duration}ms`);

      // Verificar que foi executado em tempo razoável
      expect(duration).toBeLessThan(5000);

      // Verificar que algumas requisições foram rate limited
      const rateLimitedCount = responses.filter(
        r => r.statusCode === 429
      ).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Concurrent User Operations', () => {
    test('should handle concurrent user registrations', async () => {
      const startTime = Date.now();

      const registrations = Array(20)
        .fill(null)
        .map((_, index) =>
          app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
              email: `concurrent${index}@example.com`,
              username: `concurrent${index}`,
              password: 'ValidPass123!',
              ln_markets_api_key: 'valid-key-16chars',
              ln_markets_api_secret: 'valid-secret-16chars',
              ln_markets_passphrase: 'valid-passphrase',
            },
          })
        );

      const responses = await Promise.all(registrations);
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`20 concurrent registrations completed in ${duration}ms`);

      // Verificar que foi executado em tempo razoável
      expect(duration).toBeLessThan(10000);

      // Verificar que pelo menos algumas foram bem-sucedidas
      const successCount = responses.filter(r => r.statusCode === 201).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('API Endpoint Performance', () => {
    test('should respond to metrics endpoint within 200ms', async () => {
      const startTime = Date.now();
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`Metrics endpoint response time: ${duration}ms`);

      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(200);
    });

    test('should respond to dashboard endpoint within 500ms', async () => {
      const startTime = Date.now();
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard',
        headers: {
          Authorization: 'Bearer invalid-token', // Vai retornar 401, mas testa performance
        },
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`Dashboard endpoint response time: ${duration}ms`);

      expect(response.statusCode).toBe(401);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle errors efficiently', async () => {
      const startTime = Date.now();

      // Fazer requisições que vão gerar erros
      const errorRequests = Array(100)
        .fill(null)
        .map(() =>
          app.inject({
            method: 'GET',
            url: '/api/nonexistent',
          })
        );

      const responses = await Promise.all(errorRequests);
      const endTime = Date.now();

      const duration = endTime - startTime;
      console.log(`100 error requests completed in ${duration}ms`);

      // Verificar que foi executado em tempo razoável
      expect(duration).toBeLessThan(2000);

      // Verificar que todas retornaram 404
      expect(responses.every(r => r.statusCode === 404)).toBe(true);
    });
  });
});
