import { FastifyRequest, FastifyReply } from 'fastify';
import { Sanitizer } from '../utils/sanitizer';
import { z } from 'zod';

// Schema de validação para registro
const registerSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      )
      .refine(val => !val.includes('@'), 'Username cannot contain @ symbol'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/,
        'Password must contain at least one special character'
      ),
    coupon_code: z.string().optional(),
  });

// Schema de validação para login
const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function validateRegisterInput(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    console.log('🔍 VALIDATION MIDDLEWARE - Starting validation');
    
    // 🚨 STEVE'S FIX: Log RAW request body BEFORE any processing
    console.log('🔍 RAW REQUEST BODY:', JSON.stringify(request.body, null, 2));
    console.log('🔍 RAW REQUEST BODY TYPE:', typeof request.body);
    console.log('🔍 RAW REQUEST BODY KEYS:', Object.keys(request.body || {}));
    
    console.log('📊 Request details:', {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      timestamp: new Date().toISOString()
    });
    console.log('📋 Request body analysis:', {
      hasEmail: !!(request.body as any)?.email,
      hasUsername: !!(request.body as any)?.username,
      hasPassword: !!(request.body as any)?.password,
      email: (request.body as any)?.email,
      username: (request.body as any)?.username,
    });
    
    // Sanitizar entrada
    const sanitizedBody = {
      email: Sanitizer.sanitizeEmail((request.body as Record<string, unknown>)?.['email'] as string || ''),
      username: Sanitizer.sanitizeString((request.body as Record<string, unknown>)?.['username'] as string || ''),
      password: Sanitizer.sanitizeString((request.body as Record<string, unknown>)?.['password'] as string || ''),
      coupon_code: (request.body as Record<string, unknown>)?.['coupon_code']
        ? Sanitizer.sanitizeString((request.body as Record<string, unknown>)['coupon_code'] as string)
        : undefined,
    };

    console.log('🔍 Sanitized body:', {
      email: sanitizedBody.email,
      username: sanitizedBody.username,
      password: sanitizedBody.password ? '***' : 'MISSING',
      coupon_code: sanitizedBody.coupon_code
    });

    // Validar com Zod
    const validatedData = registerSchema.parse(sanitizedBody);
    console.log('✅ Registration validation passed');

    // Substituir o body com dados validados e sanitizados
    request.body = validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: (err as any).input,
      }));

      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        validation_errors: validationErrors,
      });
    }

    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data',
    });
  }
}

export async function validateLoginInput(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Sanitizar entrada
    const sanitizedBody = {
      emailOrUsername: Sanitizer.sanitizeString((request.body as Record<string, unknown>)?.['emailOrUsername'] as string || ''),
      password: Sanitizer.sanitizeString((request.body as Record<string, unknown>)?.['password'] as string || ''),
    };

    // Validar com Zod
    const validatedData = loginSchema.parse(sanitizedBody);

    // Substituir o body com dados validados e sanitizados
    request.body = validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: (err as any).input,
      }));

      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        validation_errors: validationErrors,
      });
    }

    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data',
    });
  }
}

export async function validateQueryParams(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Sanitizar query parameters
    const sanitizedQuery: Record<string, unknown> = {};

    if (request.query) {
      for (const [key, value] of Object.entries(request.query)) {
        if (typeof value === 'string') {
          sanitizedQuery[key] = Sanitizer.sanitizeString(value);
        } else {
          sanitizedQuery[key] = value;
        }
      }
    }

    // Substituir query com dados sanitizados
    request.query = sanitizedQuery;
  } catch (error) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid query parameters',
    });
  }
}

export async function validatePathParams(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Sanitizar path parameters
    const sanitizedParams: Record<string, unknown> = {};

    if (request.params) {
      for (const [key, value] of Object.entries(request.params)) {
        if (typeof value === 'string') {
          sanitizedParams[key] = Sanitizer.sanitizeString(value);
        } else {
          sanitizedParams[key] = value;
        }
      }
    }

    // Substituir params com dados sanitizados
    request.params = sanitizedParams;
  } catch (error) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid path parameters',
    });
  }
}
