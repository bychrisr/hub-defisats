/**
 * Testes Unitários - LNMarketsAPIv2Enhanced
 * 
 * Testa todas as funcionalidades integradas do serviço consolidado:
 * - Circuit breaker
 * - Retry logic
 * - Cache inteligente
 * - Rate limiting
 * - Dashboard data unificado
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LNMarketsAPIv2Enhanced } from '../../services/lnmarkets/LNMarketsAPIv2-enhanced.service';
import { Logger } from 'winston';

// Mock do logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

// Mock das credenciais
const mockCredentials = {
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
  passphrase: 'test-passphrase',
  isTestnet: false
};

describe('LNMarketsAPIv2Enhanced', () => {
  let service: LNMarketsAPIv2Enhanced;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LNMarketsAPIv2Enhanced({
      credentials: mockCredentials,
      logger: mockLogger
    });
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('Inicialização', () => {
    it('deve inicializar com credenciais corretas', () => {
      expect(service).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🚀 LN Markets API v2 Enhanced Service initialized',
        expect.objectContaining({
          isTestnet: false,
          signatureFormat: 'base64'
        })
      );
    });

    it('deve detectar testnet automaticamente', () => {
      const testnetService = new LNMarketsAPIv2Enhanced({
        credentials: { ...mockCredentials, isTestnet: true },
        logger: mockLogger
      });

      expect(testnetService).toBeDefined();
      // Verificar se testnet foi detectado
      const stats = testnetService.getStats();
      expect(stats.testnet.isTestnet).toBe(true);
    });
  });

  describe('Dashboard Data', () => {
    it('deve retornar dados de dashboard unificado', async () => {
      // Mock dos métodos internos
      jest.spyOn(service.user, 'getUser').mockResolvedValue({ id: 'user123', balance: 1000 });
      jest.spyOn(service.user, 'getBalance').mockResolvedValue({ balance: 1000, currency: 'USD' });
      jest.spyOn(service.futures, 'getRunningPositions').mockResolvedValue([]);
      jest.spyOn(service.market, 'getTicker').mockResolvedValue({ lastPrice: 50000 });
      jest.spyOn(service.user, 'getDeposits').mockResolvedValue([]);
      jest.spyOn(service.user, 'getWithdrawals').mockResolvedValue([]);
      jest.spyOn(service.futures, 'getTrades').mockResolvedValue([]);
      jest.spyOn(service.futures, 'getOrders').mockResolvedValue([]);

      const result = await service.getDashboardData();

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('positions');
      expect(result).toHaveProperty('market');
      expect(result).toHaveProperty('deposits');
      expect(result).toHaveProperty('withdrawals');
      expect(result).toHaveProperty('trades');
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('lastUpdate');
      expect(result.metadata).toHaveProperty('isTestnet');
      expect(result.metadata).toHaveProperty('cacheHit');
      expect(result.metadata).toHaveProperty('source');
    });

    it('deve usar cache para dados de dashboard', async () => {
      // Primeira chamada
      jest.spyOn(service.user, 'getUser').mockResolvedValue({ id: 'user123' });
      jest.spyOn(service.user, 'getBalance').mockResolvedValue({ balance: 1000 });
      jest.spyOn(service.futures, 'getRunningPositions').mockResolvedValue([]);
      jest.spyOn(service.market, 'getTicker').mockResolvedValue({ lastPrice: 50000 });
      jest.spyOn(service.user, 'getDeposits').mockResolvedValue([]);
      jest.spyOn(service.user, 'getWithdrawals').mockResolvedValue([]);
      jest.spyOn(service.futures, 'getTrades').mockResolvedValue([]);
      jest.spyOn(service.futures, 'getOrders').mockResolvedValue([]);

      const result1 = await service.getDashboardData();
      const result2 = await service.getDashboardData();

      // Segunda chamada deve usar cache
      expect(result2.metadata.cacheHit).toBe(true);
      expect(result1.metadata.lastUpdate).toBe(result2.metadata.lastUpdate);
    });
  });

  describe('Market Data', () => {
    it('deve retornar dados de mercado com cache', async () => {
      jest.spyOn(service.market, 'getTicker').mockResolvedValue({
        lastPrice: 50000,
        change24h: 2.5,
        volume: 1000000
      });

      const result = await service.getMarketData();

      expect(result).toHaveProperty('lastPrice', 50000);
      expect(result).toHaveProperty('change24h', 2.5);
      expect(result).toHaveProperty('volume', 1000000);
    });

    it('deve usar cache de 30 segundos para market data', async () => {
      jest.spyOn(service.market, 'getTicker').mockResolvedValue({ lastPrice: 50000 });

      // Primeira chamada
      await service.getMarketData();
      // Segunda chamada (deve usar cache)
      const result = await service.getMarketData();

      // Verificar se getTicker foi chamado apenas uma vez
      expect(service.market.getTicker).toHaveBeenCalledTimes(1);
    });
  });

  describe('Trading Fees', () => {
    it('deve retornar trading fees com cache de 5 minutos', async () => {
      jest.spyOn(service.user, 'getTradingFees').mockResolvedValue({
        tradingFees: 0.1,
        timestamp: Date.now()
      });

      const result = await service.getTradingFees();

      expect(result).toHaveProperty('tradingFees', 0.1);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('Next Funding', () => {
    it('deve retornar next funding com cache de 1 minuto', async () => {
      jest.spyOn(service.futures, 'getNextFunding').mockResolvedValue({
        nextFunding: '2h 15m',
        timestamp: Date.now()
      });

      const result = await service.getNextFunding();

      expect(result).toHaveProperty('nextFunding', '2h 15m');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('Rate', () => {
    it('deve retornar rate com cache de 30 segundos', async () => {
      jest.spyOn(service.market, 'getRate').mockResolvedValue({
        rate: 0.01,
        timestamp: Date.now()
      });

      const result = await service.getRate();

      expect(result).toHaveProperty('rate', 0.01);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('Rate Limiting', () => {
    it('deve implementar rate limiting de 1 req/sec', async () => {
      jest.spyOn(service.market, 'getTicker').mockResolvedValue({ lastPrice: 50000 });

      const startTime = Date.now();
      
      // Fazer duas chamadas seguidas
      await service.getMarketData();
      await service.getMarketData();
      
      const endTime = Date.now();
      
      // Deve ter esperado pelo menos 1 segundo entre as chamadas
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Circuit Breaker', () => {
    it('deve abrir circuit breaker após falhas', async () => {
      jest.spyOn(service.market, 'getTicker').mockRejectedValue(new Error('API Error'));

      // Tentar várias vezes para abrir circuit breaker
      for (let i = 0; i < 6; i++) {
        try {
          await service.getMarketData();
        } catch (error) {
          // Esperado
        }
      }

      const stats = service.getStats();
      expect(stats.circuitBreaker.isOpen).toBe(true);
    });

    it('deve fechar circuit breaker após recuperação', async () => {
      // Simular falhas para abrir circuit breaker
      jest.spyOn(service.market, 'getTicker').mockRejectedValue(new Error('API Error'));
      
      for (let i = 0; i < 6; i++) {
        try {
          await service.getMarketData();
        } catch (error) {
          // Esperado
        }
      }

      // Simular recuperação
      jest.spyOn(service.market, 'getTicker').mockResolvedValue({ lastPrice: 50000 });

      // Aguardar timeout de recuperação
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = service.getStats();
      expect(stats.circuitBreaker.isOpen).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com erros de API graciosamente', async () => {
      jest.spyOn(service.market, 'getTicker').mockRejectedValue(new Error('API Error'));

      await expect(service.getMarketData()).rejects.toThrow('API Error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ LN MARKETS ENHANCED - Market data failed',
        expect.objectContaining({ error: 'API Error' })
      );
    });

    it('deve validar dados de dashboard', async () => {
      jest.spyOn(service.user, 'getUser').mockResolvedValue(null); // Dados inválidos

      await expect(service.getDashboardData()).rejects.toThrow('Invalid dashboard data format');
    });
  });

  describe('Estatísticas', () => {
    it('deve retornar estatísticas completas', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('circuitBreaker');
      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('rateLimiting');
      expect(stats).toHaveProperty('testnet');
      expect(stats.circuitBreaker).toHaveProperty('isOpen');
      expect(stats.circuitBreaker).toHaveProperty('failureCount');
      expect(stats.cache).toHaveProperty('size');
      expect(stats.cache).toHaveProperty('keys');
    });
  });

  describe('Cleanup', () => {
    it('deve limpar recursos corretamente', async () => {
      await service.cleanup();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🧹 LN Markets API Enhanced cleanup completed'
      );
    });
  });
});
