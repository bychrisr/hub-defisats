"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.securityConfig = exports.workerConfig = exports.monitoringConfig = exports.lightningConfig = exports.notificationConfig = exports.socialAuthConfig = exports.lnMarketsConfig = exports.corsConfig = exports.rateLimitConfig = exports.jwtConfig = exports.redisConfig = exports.dbConfig = exports.logConfig = exports.isTest = exports.isProduction = exports.isDevelopment = exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: zod_1.z.string().transform(Number).default('3000'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: zod_1.z.string().min(1, 'REDIS_URL is required'),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    REFRESH_TOKEN_SECRET: zod_1.z
        .string()
        .min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('7d'),
    ENCRYPTION_KEY: zod_1.z
        .string()
        .min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
    LN_MARKETS_API_URL: zod_1.z.string().url().default('https://api.lnmarkets.com'),
    LN_MARKETS_SANDBOX_URL: zod_1.z
        .string()
        .url()
        .default('https://api.lnmarkets.com/sandbox'),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GITHUB_CLIENT_ID: zod_1.z.string().optional(),
    GITHUB_CLIENT_SECRET: zod_1.z.string().optional(),
    TELEGRAM_BOT_TOKEN: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(Number).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    EVOLUTION_API_URL: zod_1.z.string().url().optional(),
    EVOLUTION_API_KEY: zod_1.z.string().optional(),
    LND_GRPC_URL: zod_1.z.string().optional(),
    LND_MACAROON_PATH: zod_1.z.string().optional(),
    LND_TLS_CERT_PATH: zod_1.z.string().optional(),
    LNBITS_URL: zod_1.z.string().url().optional(),
    LNBITS_ADMIN_KEY: zod_1.z.string().optional(),
    SENTRY_DSN: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    PROMETHEUS_PORT: zod_1.z.string().transform(Number).default('9090'),
    RATE_LIMIT_MAX: zod_1.z.string().transform(Number).default('100'),
    RATE_LIMIT_TIME_WINDOW: zod_1.z.string().transform(Number).default('60000'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:13000'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FORMAT: zod_1.z.enum(['json', 'simple']).default('json'),
});
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.errors
                .filter(err => err.code === 'too_small' && err.minimum === 1)
                .map(err => err.path.join('.'));
            const invalidVars = error.errors
                .filter(err => err.code !== 'too_small' || err.minimum !== 1)
                .map(err => `${err.path.join('.')}: ${err.message}`);
            console.error('❌ Environment validation failed:');
            if (missingVars.length > 0) {
                console.error('Missing required variables:', missingVars.join(', '));
            }
            if (invalidVars.length > 0) {
                console.error('Invalid variables:', invalidVars.join(', '));
            }
            console.error('\nPlease check your .env file and ensure all required variables are set.');
            process.exit(1);
        }
        throw error;
    }
};
exports.env = parseEnv();
exports.isDevelopment = exports.env.NODE_ENV === 'development';
exports.isProduction = exports.env.NODE_ENV === 'production';
exports.isTest = exports.env.NODE_ENV === 'test';
exports.logConfig = {
    level: exports.env.LOG_LEVEL,
    format: exports.env.LOG_FORMAT,
    enabled: exports.isDevelopment || exports.isProduction,
};
exports.dbConfig = {
    url: exports.env.DATABASE_URL,
    ssl: exports.isProduction ? { rejectUnauthorized: false } : false,
    connectionLimit: exports.isProduction ? 20 : 5,
};
exports.redisConfig = {
    url: exports.env.REDIS_URL,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
};
exports.jwtConfig = {
    secret: exports.env.JWT_SECRET,
    expiresIn: exports.env.JWT_EXPIRES_IN,
    refreshSecret: exports.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: exports.env.REFRESH_TOKEN_EXPIRES_IN,
};
exports.rateLimitConfig = {
    max: exports.env.RATE_LIMIT_MAX,
    timeWindow: exports.env.RATE_LIMIT_TIME_WINDOW,
    skipOnError: false,
};
exports.corsConfig = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = exports.isDevelopment
            ? [exports.env.CORS_ORIGIN]
            : [exports.env.CORS_ORIGIN];
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
    ],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 86400,
};
exports.lnMarketsConfig = {
    apiUrl: exports.env.LN_MARKETS_API_URL,
    sandboxUrl: exports.env.LN_MARKETS_SANDBOX_URL,
    timeout: 30000,
    retries: 3,
};
exports.socialAuthConfig = {
    google: {
        clientId: exports.env.GOOGLE_CLIENT_ID,
        clientSecret: exports.env.GOOGLE_CLIENT_SECRET,
        enabled: !!(exports.env.GOOGLE_CLIENT_ID && exports.env.GOOGLE_CLIENT_SECRET),
    },
    github: {
        clientId: exports.env.GITHUB_CLIENT_ID,
        clientSecret: exports.env.GITHUB_CLIENT_SECRET,
        enabled: !!(exports.env.GITHUB_CLIENT_ID && exports.env.GITHUB_CLIENT_SECRET),
    },
};
exports.notificationConfig = {
    telegram: {
        botToken: exports.env.TELEGRAM_BOT_TOKEN,
        enabled: !!exports.env.TELEGRAM_BOT_TOKEN,
    },
    email: {
        host: exports.env.SMTP_HOST,
        port: exports.env.SMTP_PORT,
        user: exports.env.SMTP_USER,
        pass: exports.env.SMTP_PASS,
        enabled: !!(exports.env.SMTP_HOST && exports.env.SMTP_USER && exports.env.SMTP_PASS),
    },
    whatsapp: {
        apiUrl: exports.env.EVOLUTION_API_URL,
        apiKey: exports.env.EVOLUTION_API_KEY,
        enabled: !!(exports.env.EVOLUTION_API_URL && exports.env.EVOLUTION_API_KEY),
    },
};
exports.lightningConfig = {
    lnd: {
        grpcUrl: exports.env.LND_GRPC_URL,
        macaroonPath: exports.env.LND_MACAROON_PATH,
        tlsCertPath: exports.env.LND_TLS_CERT_PATH,
        enabled: !!(exports.env.LND_GRPC_URL && exports.env.LND_MACAROON_PATH),
    },
    lnbits: {
        url: exports.env.LNBITS_URL,
        adminKey: exports.env.LNBITS_ADMIN_KEY,
        enabled: !!(exports.env.LNBITS_URL && exports.env.LNBITS_ADMIN_KEY),
    },
};
exports.monitoringConfig = {
    sentry: {
        dsn: exports.env.SENTRY_DSN,
        enabled: !!exports.env.SENTRY_DSN,
        environment: exports.env.NODE_ENV,
    },
    prometheus: {
        port: exports.env.PROMETHEUS_PORT,
        enabled: exports.isProduction,
    },
};
exports.workerConfig = {
    marginMonitor: {
        checkInterval: 5000,
        marginThreshold: 0.8,
        criticalThreshold: 0.9,
        maxRetries: 3,
        retryDelay: 1000,
    },
    automationExecutor: {
        maxConcurrent: 10,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 5000,
    },
    notification: {
        maxConcurrent: 20,
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 2000,
    },
    paymentValidator: {
        checkInterval: 30000,
        maxAge: 3600000,
        retryAttempts: 5,
        retryDelay: 10000,
    },
};
exports.securityConfig = {
    encryption: {
        key: exports.env.ENCRYPTION_KEY,
        algorithm: 'aes-256-gcm',
    },
    session: {
        timeout: 30 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://api.lnmarkets.com'],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        xFrameOptions: { action: 'deny' },
        xContentTypeOptions: true,
        xDnsPrefetchControl: true,
        xDownloadOptions: true,
        xPermittedCrossDomainPolicies: false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        crossOriginEmbedderPolicy: exports.isProduction,
        crossOriginOpenerPolicy: { policy: 'same-origin' },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    },
};
exports.config = {
    env: exports.env,
    isDevelopment: exports.isDevelopment,
    isProduction: exports.isProduction,
    isTest: exports.isTest,
    log: exports.logConfig,
    database: exports.dbConfig,
    redis: exports.redisConfig,
    jwt: exports.jwtConfig,
    rateLimit: exports.rateLimitConfig,
    cors: exports.corsConfig,
    lnMarkets: exports.lnMarketsConfig,
    socialAuth: exports.socialAuthConfig,
    notification: exports.notificationConfig,
    lightning: exports.lightningConfig,
    monitoring: exports.monitoringConfig,
    worker: exports.workerConfig,
    security: exports.securityConfig,
};
//# sourceMappingURL=env.js.map