import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

let app: FastifyInstance;
let prisma: PrismaClient;

beforeAll(async () => {
  // Create a simple Fastify app for testing
  const fastify = require('fastify')({ logger: false });
  
  // Mock Prisma
  prisma = {
    user: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  } as any;

  fastify.decorate('prisma', prisma);

  // Register email validation route
  fastify.post('/api/validation/email', async (request: any, reply: any) => {
    try {
      const { email } = request.body;
      
      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const formatValid = emailRegex.test(email);
      
      let available = true;
      let suggestions: string[] = [];
      
      if (!formatValid) {
        suggestions.push('Enter a valid email address (e.g., user@example.com)');
      } else {
        // Verificar se email já existe
        try {
          console.log(`🔍 Checking email availability for: ${email}`);
          const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
          });
          console.log(`📧 Existing user found:`, existingUser ? 'YES' : 'NO');
          available = !existingUser;
          
          if (!available) {
            suggestions.push('This email is already registered');
            console.log(`❌ Email ${email} is already registered`);
          } else {
            console.log(`✅ Email ${email} is available`);
          }
        } catch (error) {
          console.error('Error checking email availability:', error);
          available = true;
        }
      }
      
      return reply.status(200).send({
        valid: formatValid && available,
        available,
        format: formatValid,
        suggestions
      });
    } catch (error) {
      console.error('Email validation error:', error);
      return reply.status(500).send({
        error: 'VALIDATION_ERROR',
        message: 'Email validation failed'
      });
    }
  });

  await fastify.ready();
  app = fastify;
});

afterAll(async () => {
  await app.close();
});

describe('Email Validation Tests', () => {
  describe('POST /api/validation/email', () => {
    it('should return available=true for new email', async () => {
      // Mock no existing user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/validation/email',
        payload: { email: 'new@example.com' }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.valid).toBe(true);
      expect(data.available).toBe(true);
      expect(data.format).toBe(true);
    });

    it('should return available=false for existing email', async () => {
      // Mock existing user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'existing-user-id',
        email: 'existing@example.com'
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/validation/email',
        payload: { email: 'existing@example.com' }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.valid).toBe(false);
      expect(data.available).toBe(false);
      expect(data.format).toBe(true);
      expect(data.suggestions).toContain('This email is already registered');
    });

    it('should return format=false for invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/validation/email',
        payload: { email: 'invalid-email' }
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.valid).toBe(false);
      expect(data.available).toBe(true);
      expect(data.format).toBe(false);
      expect(data.suggestions).toContain('Enter a valid email address (e.g., user@example.com)');
    });
  });
});
