"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("@/services/auth.service");
const zod_1 = require("zod");
const metrics_service_1 = require("@/services/metrics.service");
const RegisterRequestZodSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    ln_markets_api_key: zod_1.z
        .string()
        .min(16, 'LN Markets API key must be at least 16 characters'),
    ln_markets_api_secret: zod_1.z
        .string()
        .min(16, 'LN Markets API secret must be at least 16 characters'),
    ln_markets_passphrase: zod_1.z
        .string()
        .min(8, 'LN Markets passphrase must be at least 8 characters'),
    coupon_code: zod_1.z.string().optional(),
});
const LoginRequestZodSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const AuthResponseZodSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    token: zod_1.z.string(),
    plan_type: zod_1.z.enum(['free', 'basic', 'advanced', 'pro']),
});
const ErrorResponseZodSchema = zod_1.z.object({
    error: zod_1.z.string(),
    message: zod_1.z.string(),
});
const ValidationErrorResponseZodSchema = zod_1.z.object({
    error: zod_1.z.literal('VALIDATION_ERROR'),
    message: zod_1.z.string(),
    validation_errors: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        message: zod_1.z.string(),
        value: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()])
            .optional(),
    })),
});
class AuthController {
    authService;
    constructor(prisma, fastify) {
        this.authService = new auth_service_1.AuthService(prisma, fastify);
    }
    async register(request, reply) {
        console.log('📥 Registration request received');
        const body = request.body;
        console.log('📋 Request body:', {
            hasEmail: !!body?.email,
            hasUsername: !!body?.username,
            hasPassword: !!body?.password,
            hasApiKey: !!body?.ln_markets_api_key,
            hasApiSecret: !!body?.ln_markets_api_secret,
            hasPassphrase: !!body?.ln_markets_passphrase,
            hasCoupon: !!body?.coupon_code,
        });
        try {
            console.log('🔍 Validating request body...');
            const body = RegisterRequestZodSchema.parse(request.body);
            console.log('✅ Request body validated successfully');
            console.log('🔐 Calling auth service register method...');
            const result = await this.authService.register(body);
            console.log('✅ User registration completed in service');
            metrics_service_1.metrics.recordAuthAttempt('register', 'success');
            console.log('📤 Preparing response...');
            const response = AuthResponseZodSchema.parse(result);
            console.log('✅ Response prepared successfully');
            console.log('📤 Sending success response...');
            return reply.status(201).send(response);
        }
        catch (error) {
            console.error('❌ Registration error occurred:', error);
            metrics_service_1.metrics.recordAuthAttempt('register', 'failure', error.message);
            if (error instanceof zod_1.z.ZodError) {
                console.log('❌ Validation error:', error.errors);
                const validationResponse = ValidationErrorResponseZodSchema.parse({
                    error: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    validation_errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        value: err.input,
                    })),
                });
                console.log('📤 Sending validation error response');
                return reply.status(400).send(validationResponse);
            }
            console.log('❌ General registration error:', error.message);
            const errorResponse = ErrorResponseZodSchema.parse({
                error: 'REGISTRATION_FAILED',
                message: error instanceof Error ? error.message : 'Registration failed',
            });
            console.log('📤 Sending error response');
            return reply.status(400).send(errorResponse);
        }
    }
    async login(request, reply) {
        try {
            const body = LoginRequestZodSchema.parse(request.body);
            const result = await this.authService.login(body);
            metrics_service_1.metrics.recordAuthAttempt('login', 'success');
            const response = AuthResponseZodSchema.parse(result);
            return reply.status(200).send(response);
        }
        catch (error) {
            metrics_service_1.metrics.recordAuthAttempt('login', 'failure', error.message);
            if (error instanceof zod_1.z.ZodError) {
                const validationResponse = ValidationErrorResponseZodSchema.parse({
                    error: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    validation_errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        value: err.input,
                    })),
                });
                return reply.status(400).send(validationResponse);
            }
            const errorResponse = ErrorResponseZodSchema.parse({
                error: 'LOGIN_FAILED',
                message: error instanceof Error ? error.message : 'Login failed',
            });
            return reply.status(401).send(errorResponse);
        }
    }
    async checkUsername(request, reply) {
        try {
            const { username } = request.query;
            if (!username) {
                return reply.status(400).send({
                    error: 'BAD_REQUEST',
                    message: 'Username is required',
                });
            }
            const result = await this.authService.checkUsernameAvailability(username);
            return reply.status(200).send(result);
        }
        catch (error) {
            console.error('Check username error:', error);
            return reply.status(500).send({
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to check username availability',
            });
        }
    }
    async refreshToken(request, reply) {
        try {
            const refreshToken = request.cookies?.refresh_token;
            if (!refreshToken) {
                const errorResponse = ErrorResponseSchema.parse({
                    error: 'REFRESH_TOKEN_MISSING',
                    message: 'Refresh token is required',
                });
                return reply.status(401).send(errorResponse);
            }
            const result = await this.authService.refreshToken(refreshToken);
            const response = RefreshTokenResponseSchema.parse(result);
            return reply.status(200).send(response);
        }
        catch (error) {
            const errorResponse = ErrorResponseSchema.parse({
                error: 'REFRESH_TOKEN_FAILED',
                message: error instanceof Error ? error.message : 'Token refresh failed',
            });
            return reply.status(401).send(errorResponse);
        }
    }
    async logout(request, reply) {
        try {
            const user = request.user;
            if (!user) {
                const errorResponse = ErrorResponseSchema.parse({
                    error: 'UNAUTHORIZED',
                    message: 'User not authenticated',
                });
                return reply.status(401).send(errorResponse);
            }
            await this.authService.logout(user.id);
            reply.clearCookie('refresh_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
            });
            return reply.status(200).send({
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            const errorResponse = ErrorResponseSchema.parse({
                error: 'LOGOUT_FAILED',
                message: error instanceof Error ? error.message : 'Logout failed',
            });
            return reply.status(500).send(errorResponse);
        }
    }
    async me(request, reply) {
        try {
            const user = request.user;
            if (!user) {
                const errorResponse = ErrorResponseSchema.parse({
                    error: 'UNAUTHORIZED',
                    message: 'User not authenticated',
                });
                return reply.status(401).send(errorResponse);
            }
            return reply.status(200).send({
                id: user.id,
                email: user.email,
                plan_type: user.plan_type,
                created_at: user.created_at,
                last_activity_at: user.last_activity_at,
            });
        }
        catch (error) {
            const errorResponse = ErrorResponseSchema.parse({
                error: 'USER_INFO_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get user info',
            });
            return reply.status(500).send(errorResponse);
        }
    }
    async googleCallback(request, reply) {
        try {
            const errorResponse = ErrorResponseSchema.parse({
                error: 'NOT_IMPLEMENTED',
                message: 'Google OAuth not yet implemented',
            });
            return reply.status(501).send(errorResponse);
        }
        catch (error) {
            const errorResponse = ErrorResponseSchema.parse({
                error: 'SOCIAL_LOGIN_FAILED',
                message: error instanceof Error ? error.message : 'Social login failed',
            });
            return reply.status(500).send(errorResponse);
        }
    }
    async githubCallback(request, reply) {
        try {
            const errorResponse = ErrorResponseSchema.parse({
                error: 'NOT_IMPLEMENTED',
                message: 'GitHub OAuth not yet implemented',
            });
            return reply.status(501).send(errorResponse);
        }
        catch (error) {
            const errorResponse = ErrorResponseSchema.parse({
                error: 'SOCIAL_LOGIN_FAILED',
                message: error instanceof Error ? error.message : 'Social login failed',
            });
            return reply.status(500).send(errorResponse);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map