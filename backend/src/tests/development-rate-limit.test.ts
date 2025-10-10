import { DevelopmentRateLimiter, getRateLimitInfo } from '../middleware/development-rate-limit.middleware';

describe('DevelopmentRateLimiter', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar ambiente original
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restaurar ambiente original
    process.env = originalEnv;
  });

  describe('detectEnvironment', () => {
    it('should detect development environment by NODE_ENV', () => {
      process.env.NODE_ENV = 'development';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should detect development environment by NODE_ENV=dev', () => {
      process.env.NODE_ENV = 'dev';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should detect development environment by NODE_ENV=test', () => {
      process.env.NODE_ENV = 'test';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should detect staging environment by NODE_ENV', () => {
      process.env.NODE_ENV = 'staging';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('staging');
    });

    it('should detect production environment by NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('production');
    });

    it('should detect development environment by ENVIRONMENT variable', () => {
      process.env.ENVIRONMENT = 'development';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should detect staging environment by ENVIRONMENT variable', () => {
      process.env.ENVIRONMENT = 'staging';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('staging');
    });

    it('should detect production environment by ENVIRONMENT variable', () => {
      process.env.ENVIRONMENT = 'production';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('production');
    });

    it('should detect development environment by port', () => {
      process.env.PORT = '3000';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should detect development environment by port 13010', () => {
      process.env.PORT = '13010';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should detect development environment by localhost CORS', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should detect staging environment by staging CORS', () => {
      delete process.env.NODE_ENV;
      delete process.env.ENVIRONMENT;
      delete process.env.PORT;
      process.env.CORS_ORIGIN = 'https://staging.defisats.site';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('staging');
    });

    it('should detect production environment by HTTPS CORS', () => {
      delete process.env.NODE_ENV;
      delete process.env.ENVIRONMENT;
      delete process.env.PORT;
      process.env.CORS_ORIGIN = 'https://defisats.site';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('production');
    });

    it('should default to development when environment cannot be detected', () => {
      // Limpar todas as variáveis de ambiente
      delete process.env.NODE_ENV;
      delete process.env.ENVIRONMENT;
      delete process.env.PORT;
      delete process.env.CORS_ORIGIN;
      
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('development');
    });
  });

  describe('getConfig', () => {
    it('should return development config for development environment', () => {
      process.env.NODE_ENV = 'development';
      const config = DevelopmentRateLimiter.getConfig();
      
      // Verificar configurações de desenvolvimento (mais permissivas)
      expect(config.auth['max']).toBe(50);
      expect(config.auth['windowMs']).toBe(5 * 60 * 1000); // 5 minutos
      expect(config.api['max']).toBe(1000);
      expect(config.trading['max']).toBe(2000);
    });

    it('should return staging config for staging environment', () => {
      process.env.NODE_ENV = 'staging';
      const config = DevelopmentRateLimiter.getConfig();
      
      // Verificar configurações de staging (intermediárias)
      expect(config.auth['max']).toBe(20);
      expect(config.auth['windowMs']).toBe(10 * 60 * 1000); // 10 minutos
      expect(config.api['max']).toBe(500);
      expect(config.trading['max']).toBe(1000);
    });

    it('should return production config for production environment', () => {
      process.env.NODE_ENV = 'production';
      const config = DevelopmentRateLimiter.getConfig();
      
      // Verificar configurações de produção (mais restritivas)
      expect(config.auth['max']).toBe(5);
      expect(config.auth['windowMs']).toBe(15 * 60 * 1000); // 15 minutos
      expect(config.api['max']).toBe(100);
      expect(config.trading['max']).toBe(200);
    });
  });

  describe('createDevelopmentConfig', () => {
    it('should create permissive development configuration', () => {
      const config = DevelopmentRateLimiter.createDevelopmentConfig();
      
      expect(config.auth['max']).toBe(50);
      expect(config.auth['windowMs']).toBe(5 * 60 * 1000);
      expect(config.api['max']).toBe(1000);
      expect(config.trading['max']).toBe(2000);
      expect(config.notifications['max']).toBe(300);
      expect(config.payments['max']).toBe(100);
      expect(config.admin['max']).toBe(500);
      expect(config.global['max']).toBe(2000);
    });
  });

  describe('createStagingConfig', () => {
    it('should create intermediate staging configuration', () => {
      const config = DevelopmentRateLimiter.createStagingConfig();
      
      expect(config.auth['max']).toBe(20);
      expect(config.auth['windowMs']).toBe(10 * 60 * 1000);
      expect(config.api['max']).toBe(500);
      expect(config.trading['max']).toBe(1000);
      expect(config.notifications['max']).toBe(150);
      expect(config.payments['max']).toBe(50);
      expect(config.admin['max']).toBe(250);
      expect(config.global['max']).toBe(1500);
    });
  });

  describe('createProductionConfig', () => {
    it('should create restrictive production configuration', () => {
      const config = DevelopmentRateLimiter.createProductionConfig();
      
      expect(config.auth['max']).toBe(5);
      expect(config.auth['windowMs']).toBe(15 * 60 * 1000);
      expect(config.api['max']).toBe(100);
      expect(config.trading['max']).toBe(200);
      expect(config.notifications['max']).toBe(30);
      expect(config.payments['max']).toBe(10);
      expect(config.admin['max']).toBe(50);
      expect(config.global['max']).toBe(1000);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return comprehensive rate limit information', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      
      const info = getRateLimitInfo();
      
      expect(info.environment).toBe('development');
      expect(info.detection.nodeEnv).toBe('development');
      expect(info.detection.port).toBe('3000');
      expect(info.detection.corsOrigin).toBe('http://localhost:3000');
      
      // Verificar configurações
      expect(info.configs.auth.max).toBe(50);
      expect(info.configs.auth.windowMinutes).toBe(5);
      expect(info.configs.api.max).toBe(1000);
      expect(info.configs.trading.max).toBe(2000);
      
      // Verificar comparações
      expect(info.comparison.development.auth).toBe('50 attempts per 5 minutes');
      expect(info.comparison.staging.auth).toBe('20 attempts per 10 minutes');
      expect(info.comparison.production.auth).toBe('5 attempts per 15 minutes');
    });

    it('should return staging information for staging environment', () => {
      process.env.NODE_ENV = 'staging';
      
      const info = getRateLimitInfo();
      
      expect(info.environment).toBe('staging');
      expect(info.configs.auth.max).toBe(20);
      expect(info.configs.auth.windowMinutes).toBe(10);
      expect(info.configs.api.max).toBe(500);
    });

    it('should return production information for production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const info = getRateLimitInfo();
      
      expect(info.environment).toBe('production');
      expect(info.configs.auth.max).toBe(5);
      expect(info.configs.auth.windowMinutes).toBe(15);
      expect(info.configs.api.max).toBe(100);
    });
  });

  describe('environment priority', () => {
    it('should prioritize NODE_ENV over other indicators', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000'; // Would normally indicate development
      process.env.CORS_ORIGIN = 'http://localhost:3000'; // Would normally indicate development
      
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('production');
    });

    it('should prioritize ENVIRONMENT over port/CORS indicators', () => {
      process.env.ENVIRONMENT = 'staging';
      process.env.PORT = '3000'; // Would normally indicate development
      process.env.CORS_ORIGIN = 'http://localhost:3000'; // Would normally indicate development
      
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('staging');
    });
  });

  describe('case insensitive detection', () => {
    it('should handle uppercase NODE_ENV', () => {
      process.env.NODE_ENV = 'DEVELOPMENT';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should handle mixed case NODE_ENV', () => {
      process.env.NODE_ENV = 'Staging';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('staging');
    });

    it('should handle uppercase ENVIRONMENT', () => {
      process.env.ENVIRONMENT = 'PRODUCTION';
      const environment = DevelopmentRateLimiter.detectEnvironment();
      expect(environment).toBe('production');
    });
  });
});
