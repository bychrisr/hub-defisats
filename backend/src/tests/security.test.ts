import { FastifyInstance } from 'fastify';
import { build } from '../index';
import { PrismaClient } from '@prisma/client';

describe('Security Tests', () => {
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

  describe('Input Validation and Sanitization', () => {
    test('should sanitize malicious input in registration', async () => {
      const maliciousInput = {
        email: 'test@example.com',
        username: '<script>alert("xss")</script>',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: maliciousInput,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('VALIDATION_ERROR');
    });

    test('should prevent SQL injection in username', async () => {
      const sqlInjectionInput = {
        email: 'test@example.com',
        username: "'; DROP TABLE users; --",
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: sqlInjectionInput,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('VALIDATION_ERROR');
    });

    test('should prevent XSS in email field', async () => {
      const xssInput = {
        email: '<script>alert("xss")</script>@example.com',
        username: 'testuser',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: xssInput,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('VALIDATION_ERROR');
    });

    test('should validate password strength', async () => {
      const weakPasswordInput = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: weakPasswordInput,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.validation_errors).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: expect.stringContaining('at least 8 characters'),
        })
      );
    });

    test('should validate email format', async () => {
      const invalidEmailInput = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: invalidEmailInput,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.validation_errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('Invalid email format'),
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Fazer múltiplas tentativas de login
      const promises = Array(10)
        .fill(null)
        .map(() =>
          app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: loginData,
          })
        );

      const responses = await Promise.all(promises);

      // Pelo menos uma resposta deve ser 429 (rate limited)
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should enforce rate limiting on registration attempts', async () => {
      const registrationData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'ValidPass123!',
        ln_markets_api_key: 'valid-key-16chars',
        ln_markets_api_secret: 'valid-secret-16chars',
        ln_markets_passphrase: 'valid-passphrase',
      };

      // Fazer múltiplas tentativas de registro
      const promises = Array(5)
        .fill(null)
        .map(() =>
          app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: registrationData,
          })
        );

      const responses = await Promise.all(promises);

      // Pelo menos uma resposta deve ser 429 (rate limited)
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Security', () => {
    test('should reject requests from unauthorized origins', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard',
        headers: {
          Origin: 'https://malicious-site.com',
        },
      });

      // Deve retornar erro de CORS ou 401 (não autenticado)
      expect([401, 403]).toContain(response.statusCode);
    });

    test('should accept requests from authorized origins', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard',
        headers: {
          Origin: 'http://localhost:13000',
        },
      });

      // Deve retornar 401 (não autenticado) mas não erro de CORS
      expect(response.statusCode).toBe(401);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      // Verificar headers de segurança
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBeDefined();
    });

    test('should include CSP header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Authentication Security', () => {
    test('should require authentication for protected routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('UNAUTHORIZED');
    });

    test('should reject invalid JWT tokens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('UNAUTHORIZED');
    });

    test('should reject malformed JWT tokens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard',
        headers: {
          Authorization: 'Bearer malformed.token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Data Exposure', () => {
    test('should not expose sensitive data in error messages', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'ValidPass123!',
          ln_markets_api_key: 'valid-key-16chars',
          ln_markets_api_secret: 'valid-secret-16chars',
          ln_markets_passphrase: 'valid-passphrase',
        },
      });

      // Se falhar, não deve expor dados sensíveis
      if (response.statusCode !== 201) {
        const body = JSON.parse(response.body);
        expect(JSON.stringify(body)).not.toContain('password');
        expect(JSON.stringify(body)).not.toContain('api_key');
        expect(JSON.stringify(body)).not.toContain('api_secret');
      }
    });

    test('should not expose database errors', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).not.toContain('database');
      expect(body.message).not.toContain('sql');
      expect(body.message).not.toContain('prisma');
    });
  });

  describe('File Upload Security', () => {
    test('should reject file uploads if implemented', async () => {
      // Este teste é para quando implementarmos upload de arquivos
      // Por enquanto, apenas verificar que não há rotas de upload expostas
      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        payload: 'test file content',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('API Security', () => {
    test('should not expose API version in headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-api-version']).toBeUndefined();
      expect(response.headers['server']).toBeUndefined();
    });

    test('should not expose internal paths in error messages', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).not.toContain('/home/');
      expect(body.message).not.toContain('/src/');
      expect(body.message).not.toContain('node_modules');
    });
  });

  describe('Session Security', () => {
    test('should set secure cookie flags', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'ValidPass123!',
          ln_markets_api_key: 'valid-key-16chars',
          ln_markets_api_secret: 'valid-secret-16chars',
          ln_markets_passphrase: 'valid-passphrase',
        },
      });

      if (response.statusCode === 201) {
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          expect(setCookieHeader).toContain('HttpOnly');
          expect(setCookieHeader).toContain('Secure');
          expect(setCookieHeader).toContain('SameSite');
        }
      }
    });
  });
});
