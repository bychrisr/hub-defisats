import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),

  // LN Markets API
  LN_MARKETS_API_URL: z.string().url().default('https://api.lnmarkets.com'),
  LN_MARKETS_SANDBOX_URL: z.string().url().default('https://api.lnmarkets.com/sandbox'),

  // Social Auth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Notifications
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().optional(),

  // Lightning Network
  LND_GRPC_URL: z.string().optional(),
  LND_MACAROON_PATH: z.string().optional(),
  LND_TLS_CERT_PATH: z.string().optional(),
  LNBITS_URL: z.string().url().optional(),
  LNBITS_ADMIN_KEY: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  PROMETHEUS_PORT: z.string().transform(Number).default('9090'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_TIME_WINDOW: z.string().transform(Number).default('60000'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3001'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
});

// Validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((err) => err.code === 'too_small' && err.minimum === 1)
        .map((err) => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter((err) => err.code !== 'too_small' || err.minimum !== 1)
        .map((err) => `${err.path.join('.')}: ${err.message}`);

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

export const env = parseEnv();

// Type-safe environment configuration
export type Environment = z.infer<typeof envSchema>;

// Environment-specific configurations
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Logging configuration
export const logConfig = {
  level: env.LOG_LEVEL,
  format: env.LOG_FORMAT,
  enabled: isDevelopment || isProduction,
};

// Database configuration
export const dbConfig = {
  url: env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  connectionLimit: isProduction ? 20 : 5,
};

// Redis configuration
export const redisConfig = {
  url: env.REDIS_URL,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

// JWT configuration
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshSecret: env.REFRESH_TOKEN_SECRET,
  refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
};

// Rate limiting configuration
export const rateLimitConfig = {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_TIME_WINDOW,
  skipOnError: false,
};

// CORS configuration
export const corsConfig = {
  origin: isDevelopment 
    ? [env.CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:3001']
    : [env.CORS_ORIGIN],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// LN Markets configuration
export const lnMarketsConfig = {
  apiUrl: env.LN_MARKETS_API_URL,
  sandboxUrl: env.LN_MARKETS_SANDBOX_URL,
  timeout: 30000,
  retries: 3,
};

// Social auth configuration
export const socialAuthConfig = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  },
};

// Notification configuration
export const notificationConfig = {
  telegram: {
    botToken: env.TELEGRAM_BOT_TOKEN,
    enabled: !!env.TELEGRAM_BOT_TOKEN,
  },
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    enabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
  },
  whatsapp: {
    apiUrl: env.EVOLUTION_API_URL,
    apiKey: env.EVOLUTION_API_KEY,
    enabled: !!(env.EVOLUTION_API_URL && env.EVOLUTION_API_KEY),
  },
};

// Lightning Network configuration
export const lightningConfig = {
  lnd: {
    grpcUrl: env.LND_GRPC_URL,
    macaroonPath: env.LND_MACAROON_PATH,
    tlsCertPath: env.LND_TLS_CERT_PATH,
    enabled: !!(env.LND_GRPC_URL && env.LND_MACAROON_PATH),
  },
  lnbits: {
    url: env.LNBITS_URL,
    adminKey: env.LNBITS_ADMIN_KEY,
    enabled: !!(env.LNBITS_URL && env.LNBITS_ADMIN_KEY),
  },
};

// Monitoring configuration
export const monitoringConfig = {
  sentry: {
    dsn: env.SENTRY_DSN,
    enabled: !!env.SENTRY_DSN,
    environment: env.NODE_ENV,
  },
  prometheus: {
    port: env.PROMETHEUS_PORT,
    enabled: isProduction,
  },
};

// Worker configuration
export const workerConfig = {
  marginMonitor: {
    checkInterval: 5000, // 5 seconds
    marginThreshold: 0.8, // 80%
    criticalThreshold: 0.9, // 90%
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
    checkInterval: 30000, // 30 seconds
    maxAge: 3600000, // 1 hour
    retryAttempts: 5,
    retryDelay: 10000,
  },
};

// Security configuration
export const securityConfig = {
  encryption: {
    key: env.ENCRYPTION_KEY,
    algorithm: 'aes-256-gcm',
  },
  session: {
    timeout: 30 * 60 * 1000, // 30 minutes
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  helmet: {
    contentSecurityPolicy: isProduction,
    crossOriginEmbedderPolicy: isProduction,
  },
};

// Export all configurations
export const config = {
  env,
  isDevelopment,
  isProduction,
  isTest,
  log: logConfig,
  database: dbConfig,
  redis: redisConfig,
  jwt: jwtConfig,
  rateLimit: rateLimitConfig,
  cors: corsConfig,
  lnMarkets: lnMarketsConfig,
  socialAuth: socialAuthConfig,
  notification: notificationConfig,
  lightning: lightningConfig,
  monitoring: monitoringConfig,
  worker: workerConfig,
  security: securityConfig,
};
