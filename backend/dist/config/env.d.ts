import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    REFRESH_TOKEN_SECRET: z.ZodString;
    REFRESH_TOKEN_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    ENCRYPTION_KEY: z.ZodString;
    LN_MARKETS_API_URL: z.ZodDefault<z.ZodString>;
    LN_MARKETS_SANDBOX_URL: z.ZodDefault<z.ZodString>;
    GOOGLE_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GOOGLE_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    GITHUB_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GITHUB_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    TELEGRAM_BOT_TOKEN: z.ZodOptional<z.ZodString>;
    SMTP_HOST: z.ZodOptional<z.ZodString>;
    SMTP_PORT: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    SMTP_USER: z.ZodOptional<z.ZodString>;
    SMTP_PASS: z.ZodOptional<z.ZodString>;
    EVOLUTION_API_URL: z.ZodOptional<z.ZodString>;
    EVOLUTION_API_KEY: z.ZodOptional<z.ZodString>;
    LND_GRPC_URL: z.ZodOptional<z.ZodString>;
    LND_MACAROON_PATH: z.ZodOptional<z.ZodString>;
    LND_TLS_CERT_PATH: z.ZodOptional<z.ZodString>;
    LNBITS_URL: z.ZodOptional<z.ZodString>;
    LNBITS_ADMIN_KEY: z.ZodOptional<z.ZodString>;
    SENTRY_DSN: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    PROMETHEUS_PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    RATE_LIMIT_MAX: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    RATE_LIMIT_TIME_WINDOW: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    LOG_FORMAT: z.ZodDefault<z.ZodEnum<["json", "simple"]>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    ENCRYPTION_KEY: string;
    LN_MARKETS_API_URL: string;
    LN_MARKETS_SANDBOX_URL: string;
    PROMETHEUS_PORT: number;
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_TIME_WINDOW: number;
    CORS_ORIGIN: string;
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    LOG_FORMAT: "json" | "simple";
    GOOGLE_CLIENT_ID?: string | undefined;
    GOOGLE_CLIENT_SECRET?: string | undefined;
    GITHUB_CLIENT_ID?: string | undefined;
    GITHUB_CLIENT_SECRET?: string | undefined;
    TELEGRAM_BOT_TOKEN?: string | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    EVOLUTION_API_URL?: string | undefined;
    EVOLUTION_API_KEY?: string | undefined;
    LND_GRPC_URL?: string | undefined;
    LND_MACAROON_PATH?: string | undefined;
    LND_TLS_CERT_PATH?: string | undefined;
    LNBITS_URL?: string | undefined;
    LNBITS_ADMIN_KEY?: string | undefined;
    SENTRY_DSN?: string | undefined;
}, {
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    ENCRYPTION_KEY: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: string | undefined;
    JWT_EXPIRES_IN?: string | undefined;
    REFRESH_TOKEN_EXPIRES_IN?: string | undefined;
    LN_MARKETS_API_URL?: string | undefined;
    LN_MARKETS_SANDBOX_URL?: string | undefined;
    GOOGLE_CLIENT_ID?: string | undefined;
    GOOGLE_CLIENT_SECRET?: string | undefined;
    GITHUB_CLIENT_ID?: string | undefined;
    GITHUB_CLIENT_SECRET?: string | undefined;
    TELEGRAM_BOT_TOKEN?: string | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: string | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    EVOLUTION_API_URL?: string | undefined;
    EVOLUTION_API_KEY?: string | undefined;
    LND_GRPC_URL?: string | undefined;
    LND_MACAROON_PATH?: string | undefined;
    LND_TLS_CERT_PATH?: string | undefined;
    LNBITS_URL?: string | undefined;
    LNBITS_ADMIN_KEY?: string | undefined;
    SENTRY_DSN?: string | undefined;
    PROMETHEUS_PORT?: string | undefined;
    RATE_LIMIT_MAX?: string | undefined;
    RATE_LIMIT_TIME_WINDOW?: string | undefined;
    CORS_ORIGIN?: string | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
    LOG_FORMAT?: "json" | "simple" | undefined;
}>;
export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    ENCRYPTION_KEY: string;
    LN_MARKETS_API_URL: string;
    LN_MARKETS_SANDBOX_URL: string;
    PROMETHEUS_PORT: number;
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_TIME_WINDOW: number;
    CORS_ORIGIN: string;
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    LOG_FORMAT: "json" | "simple";
    GOOGLE_CLIENT_ID?: string | undefined;
    GOOGLE_CLIENT_SECRET?: string | undefined;
    GITHUB_CLIENT_ID?: string | undefined;
    GITHUB_CLIENT_SECRET?: string | undefined;
    TELEGRAM_BOT_TOKEN?: string | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    EVOLUTION_API_URL?: string | undefined;
    EVOLUTION_API_KEY?: string | undefined;
    LND_GRPC_URL?: string | undefined;
    LND_MACAROON_PATH?: string | undefined;
    LND_TLS_CERT_PATH?: string | undefined;
    LNBITS_URL?: string | undefined;
    LNBITS_ADMIN_KEY?: string | undefined;
    SENTRY_DSN?: string | undefined;
};
export type Environment = z.infer<typeof envSchema>;
export declare const isDevelopment: boolean;
export declare const isProduction: boolean;
export declare const isTest: boolean;
export declare const logConfig: {
    level: "error" | "warn" | "info" | "debug";
    format: "json" | "simple";
    enabled: boolean;
};
export declare const dbConfig: {
    url: string;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
    connectionLimit: number;
};
export declare const redisConfig: {
    url: string;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
};
export declare const jwtConfig: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
};
export declare const rateLimitConfig: {
    max: number;
    timeWindow: number;
    skipOnError: boolean;
};
export declare const corsConfig: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
};
export declare const lnMarketsConfig: {
    apiUrl: string;
    sandboxUrl: string;
    timeout: number;
    retries: number;
};
export declare const socialAuthConfig: {
    google: {
        clientId: string | undefined;
        clientSecret: string | undefined;
        enabled: boolean;
    };
    github: {
        clientId: string | undefined;
        clientSecret: string | undefined;
        enabled: boolean;
    };
};
export declare const notificationConfig: {
    telegram: {
        botToken: string | undefined;
        enabled: boolean;
    };
    email: {
        host: string | undefined;
        port: number | undefined;
        user: string | undefined;
        pass: string | undefined;
        enabled: boolean;
    };
    whatsapp: {
        apiUrl: string | undefined;
        apiKey: string | undefined;
        enabled: boolean;
    };
};
export declare const lightningConfig: {
    lnd: {
        grpcUrl: string | undefined;
        macaroonPath: string | undefined;
        tlsCertPath: string | undefined;
        enabled: boolean;
    };
    lnbits: {
        url: string | undefined;
        adminKey: string | undefined;
        enabled: boolean;
    };
};
export declare const monitoringConfig: {
    sentry: {
        dsn: string | undefined;
        enabled: boolean;
        environment: "development" | "production" | "test";
    };
    prometheus: {
        port: number;
        enabled: boolean;
    };
};
export declare const workerConfig: {
    marginMonitor: {
        checkInterval: number;
        marginThreshold: number;
        criticalThreshold: number;
        maxRetries: number;
        retryDelay: number;
    };
    automationExecutor: {
        maxConcurrent: number;
        timeout: number;
        retryAttempts: number;
        retryDelay: number;
    };
    notification: {
        maxConcurrent: number;
        timeout: number;
        retryAttempts: number;
        retryDelay: number;
    };
    paymentValidator: {
        checkInterval: number;
        maxAge: number;
        retryAttempts: number;
        retryDelay: number;
    };
};
export declare const securityConfig: {
    encryption: {
        key: string;
        algorithm: string;
    };
    session: {
        timeout: number;
        maxAge: number;
    };
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: string[];
                scriptSrc: string[];
                styleSrc: string[];
                fontSrc: string[];
                imgSrc: string[];
                connectSrc: string[];
                frameSrc: string[];
                objectSrc: string[];
                baseUri: string[];
                formAction: string[];
                frameAncestors: string[];
            };
        };
        hsts: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
        xFrameOptions: {
            action: string;
        };
        xContentTypeOptions: boolean;
        xDnsPrefetchControl: boolean;
        xDownloadOptions: boolean;
        xPermittedCrossDomainPolicies: boolean;
        referrerPolicy: {
            policy: string;
        };
        crossOriginEmbedderPolicy: boolean;
        crossOriginOpenerPolicy: {
            policy: string;
        };
        crossOriginResourcePolicy: {
            policy: string;
        };
    };
};
export declare const config: {
    env: {
        NODE_ENV: "development" | "production" | "test";
        PORT: number;
        DATABASE_URL: string;
        REDIS_URL: string;
        JWT_SECRET: string;
        JWT_EXPIRES_IN: string;
        REFRESH_TOKEN_SECRET: string;
        REFRESH_TOKEN_EXPIRES_IN: string;
        ENCRYPTION_KEY: string;
        LN_MARKETS_API_URL: string;
        LN_MARKETS_SANDBOX_URL: string;
        PROMETHEUS_PORT: number;
        RATE_LIMIT_MAX: number;
        RATE_LIMIT_TIME_WINDOW: number;
        CORS_ORIGIN: string;
        LOG_LEVEL: "error" | "warn" | "info" | "debug";
        LOG_FORMAT: "json" | "simple";
        GOOGLE_CLIENT_ID?: string | undefined;
        GOOGLE_CLIENT_SECRET?: string | undefined;
        GITHUB_CLIENT_ID?: string | undefined;
        GITHUB_CLIENT_SECRET?: string | undefined;
        TELEGRAM_BOT_TOKEN?: string | undefined;
        SMTP_HOST?: string | undefined;
        SMTP_PORT?: number | undefined;
        SMTP_USER?: string | undefined;
        SMTP_PASS?: string | undefined;
        EVOLUTION_API_URL?: string | undefined;
        EVOLUTION_API_KEY?: string | undefined;
        LND_GRPC_URL?: string | undefined;
        LND_MACAROON_PATH?: string | undefined;
        LND_TLS_CERT_PATH?: string | undefined;
        LNBITS_URL?: string | undefined;
        LNBITS_ADMIN_KEY?: string | undefined;
        SENTRY_DSN?: string | undefined;
    };
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
    log: {
        level: "error" | "warn" | "info" | "debug";
        format: "json" | "simple";
        enabled: boolean;
    };
    database: {
        url: string;
        ssl: boolean | {
            rejectUnauthorized: boolean;
        };
        connectionLimit: number;
    };
    redis: {
        url: string;
        retryDelayOnFailover: number;
        maxRetriesPerRequest: number;
        lazyConnect: boolean;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    rateLimit: {
        max: number;
        timeWindow: number;
        skipOnError: boolean;
    };
    cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        maxAge: number;
    };
    lnMarkets: {
        apiUrl: string;
        sandboxUrl: string;
        timeout: number;
        retries: number;
    };
    socialAuth: {
        google: {
            clientId: string | undefined;
            clientSecret: string | undefined;
            enabled: boolean;
        };
        github: {
            clientId: string | undefined;
            clientSecret: string | undefined;
            enabled: boolean;
        };
    };
    notification: {
        telegram: {
            botToken: string | undefined;
            enabled: boolean;
        };
        email: {
            host: string | undefined;
            port: number | undefined;
            user: string | undefined;
            pass: string | undefined;
            enabled: boolean;
        };
        whatsapp: {
            apiUrl: string | undefined;
            apiKey: string | undefined;
            enabled: boolean;
        };
    };
    lightning: {
        lnd: {
            grpcUrl: string | undefined;
            macaroonPath: string | undefined;
            tlsCertPath: string | undefined;
            enabled: boolean;
        };
        lnbits: {
            url: string | undefined;
            adminKey: string | undefined;
            enabled: boolean;
        };
    };
    monitoring: {
        sentry: {
            dsn: string | undefined;
            enabled: boolean;
            environment: "development" | "production" | "test";
        };
        prometheus: {
            port: number;
            enabled: boolean;
        };
    };
    worker: {
        marginMonitor: {
            checkInterval: number;
            marginThreshold: number;
            criticalThreshold: number;
            maxRetries: number;
            retryDelay: number;
        };
        automationExecutor: {
            maxConcurrent: number;
            timeout: number;
            retryAttempts: number;
            retryDelay: number;
        };
        notification: {
            maxConcurrent: number;
            timeout: number;
            retryAttempts: number;
            retryDelay: number;
        };
        paymentValidator: {
            checkInterval: number;
            maxAge: number;
            retryAttempts: number;
            retryDelay: number;
        };
    };
    security: {
        encryption: {
            key: string;
            algorithm: string;
        };
        session: {
            timeout: number;
            maxAge: number;
        };
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: string[];
                    scriptSrc: string[];
                    styleSrc: string[];
                    fontSrc: string[];
                    imgSrc: string[];
                    connectSrc: string[];
                    frameSrc: string[];
                    objectSrc: string[];
                    baseUri: string[];
                    formAction: string[];
                    frameAncestors: string[];
                };
            };
            hsts: {
                maxAge: number;
                includeSubDomains: boolean;
                preload: boolean;
            };
            xFrameOptions: {
                action: string;
            };
            xContentTypeOptions: boolean;
            xDnsPrefetchControl: boolean;
            xDownloadOptions: boolean;
            xPermittedCrossDomainPolicies: boolean;
            referrerPolicy: {
                policy: string;
            };
            crossOriginEmbedderPolicy: boolean;
            crossOriginOpenerPolicy: {
                policy: string;
            };
            crossOriginResourcePolicy: {
                policy: string;
            };
        };
    };
};
export {};
//# sourceMappingURL=env.d.ts.map