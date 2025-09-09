"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationErrorResponseSchema = exports.ErrorResponseSchema = exports.RefreshTokenResponseSchema = exports.AuthResponseSchema = exports.LoginRequestSchema = exports.RegisterRequestSchema = void 0;
exports.RegisterRequestSchema = {
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
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 255,
        },
        username: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
            pattern: '^[a-zA-Z0-9_]+$',
        },
        password: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
        },
        ln_markets_api_key: {
            type: 'string',
            minLength: 16,
            maxLength: 64,
        },
        ln_markets_api_secret: {
            type: 'string',
            minLength: 16,
            maxLength: 64,
        },
        ln_markets_passphrase: {
            type: 'string',
            minLength: 8,
            maxLength: 64,
        },
        coupon_code: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            pattern: '^[A-Z0-9_]+$',
        },
    },
    additionalProperties: false,
};
exports.LoginRequestSchema = {
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 255,
        },
        password: {
            type: 'string',
            minLength: 1,
            maxLength: 128,
        },
    },
    additionalProperties: false,
};
exports.AuthResponseSchema = {
    type: 'object',
    required: ['user_id', 'token', 'plan_type'],
    properties: {
        user_id: {
            type: 'string',
            format: 'uuid',
        },
        token: {
            type: 'string',
            minLength: 1,
        },
        plan_type: {
            type: 'string',
            enum: ['free', 'basic', 'advanced', 'pro'],
        },
    },
    additionalProperties: false,
};
exports.RefreshTokenResponseSchema = {
    type: 'object',
    required: ['token'],
    properties: {
        token: {
            type: 'string',
            minLength: 1,
        },
    },
    additionalProperties: false,
};
exports.ErrorResponseSchema = {
    type: 'object',
    required: ['error', 'message'],
    properties: {
        error: {
            type: 'string',
            minLength: 1,
        },
        message: {
            type: 'string',
            minLength: 1,
        },
    },
    additionalProperties: false,
};
exports.ValidationErrorResponseSchema = {
    type: 'object',
    required: ['error', 'message', 'validation_errors'],
    properties: {
        error: {
            type: 'string',
            enum: ['VALIDATION_ERROR'],
        },
        message: {
            type: 'string',
            minLength: 1,
        },
        validation_errors: {
            type: 'array',
            items: {
                type: 'object',
                required: ['field', 'message'],
                properties: {
                    field: {
                        type: 'string',
                        minLength: 1,
                    },
                    message: {
                        type: 'string',
                        minLength: 1,
                    },
                    value: {
                        oneOf: [
                            { type: 'string' },
                            { type: 'number' },
                            { type: 'boolean' },
                            { type: 'null' },
                        ],
                    },
                },
                additionalProperties: false,
            },
        },
    },
    additionalProperties: false,
};
//# sourceMappingURL=auth.schemas.js.map