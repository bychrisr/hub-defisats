import { FastifyRequest, FastifyReply } from 'fastify';
import { Sanitizer } from '@/utils/sanitizer';
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
        /[@$!%*?&]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
    ln_markets_api_key: z
      .string()
      .min(16, 'API key must be at least 16 characters')
      .max(500, 'API key is too long'),
    ln_markets_api_secret: z
      .string()
      .min(16, 'API secret must be at least 16 characters')
      .max(500, 'API secret is too long'),
    ln_markets_passphrase: z
      .string()
      .min(8, 'Passphrase must be at least 8 characters')
      .max(128, 'Passphrase must be at most 128 characters'),
    coupon_code: z.string().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function validateRegisterInput(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Sanitizar entrada
    const sanitizedBody = {
      email: Sanitizer.sanitizeEmail((request.body as Record<string, unknown>)?.['email'] as string || ''),
      username: Sanitizer.sanitizeString((request.body as Record<string, unknown>)?.['username'] as string || ''),
      password: Sanitizer.sanitizeString((request.body as Record<string, unknown>)?.['password'] as string || ''),
      confirmPassword: Sanitizer.sanitizeString(
        (request.body as Record<string, unknown>)?.['confirmPassword'] as string || ''
      ),
      ln_markets_api_key: Sanitizer.sanitizeString(
        (request.body as Record<string, unknown>)?.['ln_markets_api_key'] as string || ''
      ),
      ln_markets_api_secret: Sanitizer.sanitizeString(
        (request.body as Record<string, unknown>)?.['ln_markets_api_secret'] as string || ''
      ),
      ln_markets_passphrase: Sanitizer.sanitizeString(
        (request.body as Record<string, unknown>)?.['ln_markets_passphrase'] as string || ''
      ),
      coupon_code: (request.body as Record<string, unknown>)?.['coupon_code']
        ? Sanitizer.sanitizeString((request.body as Record<string, unknown>)['coupon_code'] as string)
        : undefined,
    };

    // Validar com Zod
    const validatedData = registerSchema.parse(sanitizedBody);

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
      email: Sanitizer.sanitizeEmail((request.body as Record<string, unknown>)?.['email'] as string || ''),
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
