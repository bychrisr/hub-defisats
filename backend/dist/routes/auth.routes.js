"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("@/controllers/auth.controller");
const client_1 = require("@prisma/client");
const lnmarkets_service_1 = require("@/services/lnmarkets.service");
const validation_middleware_1 = require("@/middleware/validation.middleware");
const user_rate_limit_middleware_1 = require("@/middleware/user-rate-limit.middleware");
async function authRoutes(fastify) {
    const prisma = new client_1.PrismaClient();
    const authController = new auth_controller_1.AuthController(prisma, fastify);
    fastify.get('/test-sandbox', {
        schema: {
            description: 'Test LN Markets sandbox credentials',
            tags: ['Testing'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        details: { type: 'object' },
                    },
                },
            },
        },
    }, async (_request, reply) => {
        try {
            console.log('🧪 Testing LN Markets sandbox credentials via HTTP endpoint...');
            const logs = [];
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;
            console.log = (...args) => {
                logs.push(`LOG: ${args.join(' ')}`);
                originalConsoleLog(...args);
            };
            console.error = (...args) => {
                logs.push(`ERROR: ${args.join(' ')}`);
                originalConsoleError(...args);
            };
            await (0, lnmarkets_service_1.testSandboxCredentials)();
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
            return reply.status(200).send({
                success: true,
                message: 'Sandbox credentials test completed',
                details: {
                    logs,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            return reply.status(500).send({
                success: false,
                message: 'Sandbox credentials test failed',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                },
            });
        }
    });
    fastify.post('/test-registration', {
        schema: {
            description: 'Test complete registration with sandbox credentials',
            tags: ['Testing'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        details: { type: 'object' },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                        validation_errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' },
                                    value: {
                                        oneOf: [
                                            { type: 'string' },
                                            { type: 'number' },
                                            { type: 'boolean' },
                                            { type: 'null' },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, async (_request, reply) => {
        try {
            console.log('🧪 Testing complete registration with sandbox credentials...');
            const testEmail = `test-${Date.now()}@hubdefisats.com`;
            const registrationData = {
                email: testEmail,
                password: 'TestPassword123!',
                ln_markets_api_key: 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
                ln_markets_api_secret: 'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
                ln_markets_passphrase: 'a6c1bh56jc33',
                coupon_code: 'ALPHATESTER',
            };
            console.log('📋 Test registration data:');
            console.log(`   Email: ${registrationData.email}`);
            console.log(`   API Key: ${'*'.repeat(20)}...`);
            console.log(`   API Secret: ${'*'.repeat(20)}...`);
            console.log(`   Passphrase: ${'*'.repeat(8)}...`);
            console.log(`   Coupon: ${registrationData.coupon_code}`);
            const mockRequest = {
                body: registrationData,
            };
            const mockReply = {
                status: (code) => ({
                    send: (data) => {
                        console.log(`📊 Registration response status: ${code}`);
                        console.log('📋 Registration response data:', JSON.stringify(data, null, 2));
                        return data;
                    },
                }),
            };
            console.log('🚀 Executing registration...');
            const result = await authController.register(mockRequest, mockReply);
            console.log('✅ Registration test completed successfully!');
            return reply.status(200).send({
                success: true,
                message: 'Registration test completed successfully',
                details: {
                    email: testEmail,
                    result,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            console.log('❌ Registration test failed!');
            console.log('📊 Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                response: error?.response?.data,
            });
            if (error instanceof Error &&
                error.message &&
                error.message.includes('Invalid LN Markets API credentials')) {
                return reply.status(400).send({
                    error: 'VALIDATION_ERROR',
                    message: 'LN Markets credentials validation failed',
                    details: {
                        error: error.message,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
            return reply.status(500).send({
                success: false,
                message: 'Registration test failed',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                },
            });
        }
    });
    fastify.post('/register', {
        preHandler: [user_rate_limit_middleware_1.registrationRateLimitMiddleware, validation_middleware_1.validateRegisterInput],
        schema: {
            description: 'Register a new user',
            tags: ['Authentication'],
            body: {
                type: 'object',
                required: [
                    'email',
                    'username',
                    'password',
                    'ln_markets_api_key',
                    'ln_markets_api_secret',
                    'ln_markets_passphrase',
                ],
                properties: {
                    email: { type: 'string', format: 'email' },
                    username: { type: 'string', minLength: 3, maxLength: 20 },
                    password: { type: 'string', minLength: 8 },
                    ln_markets_api_key: { type: 'string', minLength: 16 },
                    ln_markets_api_secret: { type: 'string', minLength: 16 },
                    ln_markets_passphrase: { type: 'string', minLength: 8 },
                    coupon_code: { type: 'string' },
                },
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'string' },
                        token: { type: 'string' },
                        plan_type: { type: 'string' },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                        validation_errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' },
                                    value: {
                                        oneOf: [
                                            { type: 'string' },
                                            { type: 'number' },
                                            { type: 'boolean' },
                                            { type: 'null' },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                409: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.register.bind(authController));
    fastify.post('/login', {
        preHandler: [user_rate_limit_middleware_1.loginRateLimitMiddleware, validation_middleware_1.validateLoginInput],
        schema: {
            description: 'Login user with email and password',
            tags: ['Authentication'],
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 1 },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'string' },
                        token: { type: 'string' },
                        plan_type: { type: 'string' },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                        validation_errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' },
                                    value: {
                                        oneOf: [
                                            { type: 'string' },
                                            { type: 'number' },
                                            { type: 'boolean' },
                                            { type: 'null' },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.login.bind(authController));
    fastify.get('/check-username', {
        schema: {
            description: 'Check if username is available',
            tags: ['Authentication'],
            querystring: {
                type: 'object',
                required: ['username'],
                properties: {
                    username: { type: 'string', minLength: 3, maxLength: 20 },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        available: { type: 'boolean' },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
                500: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.checkUsername.bind(authController));
    fastify.post('/refresh', {
        schema: {
            description: 'Refresh access token using refresh token',
            tags: ['Authentication'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        token: { type: 'string' },
                    },
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.refreshToken.bind(authController));
    fastify.post('/logout', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Logout user and invalidate session',
            tags: ['Authentication'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.logout.bind(authController));
    fastify.get('/me', {
        preHandler: [fastify.authenticate],
        schema: {
            description: 'Get current user information',
            tags: ['Authentication'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        plan_type: {
                            type: 'string',
                            enum: ['free', 'basic', 'advanced', 'pro'],
                        },
                        created_at: { type: 'string', format: 'date-time' },
                        last_activity_at: { type: 'string', format: 'date-time' },
                    },
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.me.bind(authController));
    fastify.get('/google', {
        schema: {
            description: 'Initiate Google OAuth login',
            tags: ['Authentication'],
            response: {
                302: {
                    type: 'object',
                    description: 'Redirect to Google OAuth',
                },
                501: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.googleCallback.bind(authController));
    fastify.get('/google/callback', {
        schema: {
            description: 'Google OAuth callback',
            tags: ['Authentication'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'string' },
                        token: { type: 'string' },
                        plan_type: { type: 'string' },
                    },
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
                501: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.googleCallback.bind(authController));
    fastify.get('/github', {
        schema: {
            description: 'Initiate GitHub OAuth login',
            tags: ['Authentication'],
            response: {
                302: {
                    type: 'object',
                    description: 'Redirect to GitHub OAuth',
                },
                501: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.githubCallback.bind(authController));
    fastify.get('/github/callback', {
        schema: {
            description: 'GitHub OAuth callback',
            tags: ['Authentication'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'string' },
                        token: { type: 'string' },
                        plan_type: { type: 'string' },
                    },
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
                501: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, authController.githubCallback.bind(authController));
}
//# sourceMappingURL=auth.routes.js.map