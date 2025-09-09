"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegisterInput = validateRegisterInput;
exports.validateLoginInput = validateLoginInput;
exports.validateQueryParams = validateQueryParams;
exports.validatePathParams = validatePathParams;
const sanitizer_1 = require("@/utils/sanitizer");
const zod_1 = require("zod");
const registerSchema = zod_1.z
    .object({
    email: zod_1.z.string().email('Invalid email format'),
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .refine(val => !val.includes('@'), 'Username cannot contain @ symbol'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/\d/, 'Password must contain at least one number')
        .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
    confirmPassword: zod_1.z.string(),
    ln_markets_api_key: zod_1.z
        .string()
        .min(16, 'API key must be at least 16 characters')
        .max(500, 'API key is too long'),
    ln_markets_api_secret: zod_1.z
        .string()
        .min(16, 'API secret must be at least 16 characters')
        .max(500, 'API secret is too long'),
    ln_markets_passphrase: zod_1.z
        .string()
        .min(8, 'Passphrase must be at least 8 characters')
        .max(128, 'Passphrase must be at most 128 characters'),
    coupon_code: zod_1.z.string().optional(),
})
    .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
async function validateRegisterInput(request, reply) {
    try {
        const sanitizedBody = {
            email: sanitizer_1.Sanitizer.sanitizeEmail(request.body?.email || ''),
            username: sanitizer_1.Sanitizer.sanitizeString(request.body?.username || ''),
            password: sanitizer_1.Sanitizer.sanitizeString(request.body?.password || ''),
            confirmPassword: sanitizer_1.Sanitizer.sanitizeString(request.body?.confirmPassword || ''),
            ln_markets_api_key: sanitizer_1.Sanitizer.sanitizeString(request.body?.ln_markets_api_key || ''),
            ln_markets_api_secret: sanitizer_1.Sanitizer.sanitizeString(request.body?.ln_markets_api_secret || ''),
            ln_markets_passphrase: sanitizer_1.Sanitizer.sanitizeString(request.body?.ln_markets_passphrase || ''),
            coupon_code: request.body?.coupon_code
                ? sanitizer_1.Sanitizer.sanitizeString(request.body.coupon_code)
                : undefined,
        };
        const validatedData = registerSchema.parse(sanitizedBody);
        request.body = validatedData;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const validationErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                value: err.input,
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
async function validateLoginInput(request, reply) {
    try {
        const sanitizedBody = {
            email: sanitizer_1.Sanitizer.sanitizeEmail(request.body?.email || ''),
            password: sanitizer_1.Sanitizer.sanitizeString(request.body?.password || ''),
        };
        const validatedData = loginSchema.parse(sanitizedBody);
        request.body = validatedData;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const validationErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                value: err.input,
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
async function validateQueryParams(request, reply) {
    try {
        const sanitizedQuery = {};
        if (request.query) {
            for (const [key, value] of Object.entries(request.query)) {
                if (typeof value === 'string') {
                    sanitizedQuery[key] = sanitizer_1.Sanitizer.sanitizeString(value);
                }
                else {
                    sanitizedQuery[key] = value;
                }
            }
        }
        request.query = sanitizedQuery;
    }
    catch (error) {
        return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
        });
    }
}
async function validatePathParams(request, reply) {
    try {
        const sanitizedParams = {};
        if (request.params) {
            for (const [key, value] of Object.entries(request.params)) {
                if (typeof value === 'string') {
                    sanitizedParams[key] = sanitizer_1.Sanitizer.sanitizeString(value);
                }
                else {
                    sanitizedParams[key] = value;
                }
            }
        }
        request.params = sanitizedParams;
    }
    catch (error) {
        return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid path parameters',
        });
    }
}
//# sourceMappingURL=validation.middleware.js.map