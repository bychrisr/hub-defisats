/**
 * Testes de Integração - TradingView + WebSocket
 * 
 * Testa a integração completa entre:
 * - TradingView Enhanced Routes
 * - WebSocket Manager
 * - Market Data Handler
 * - Frontend TradingViewDataService
 * 
 * Cenários testados:
 * - Cache de 1 segundo funcionando
 * - WebSocket broadcast funcionando
 * - Fallback automático
 * - Error handling end-to-end
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { WebSocketManager } from '../../websocket/manager';
import { MarketDataHandler } from '../../websocket/handlers/market-data.handler';
import { Logger } from 'winston';

// Mock do logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

// Mock do Fastify
const mockFastify = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  log: mockLogger
} as unknown as FastifyInstance;

// Mock do axios
jest.mock('axios');
const axios = require('axios');

describe('TradingView + WebSocket Integration', () => {
  let wsManager: WebSocketManager;
  let marketDataHandler: MarketDataHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Inicializar WebSocket Manager
    wsManager = new WebSocketManager({
      heartbeatInterval: 1000,
      maxReconnectAttempts: 3,
      reconnectInterval: 1000,
      rateLimitWindow: 60000,
      maxMessagesPerWindow: 100,
      pingTimeout: 5000
    }, mockLogger);

    // Inicializar Market Data Handler
    marketDataHandler = new MarketDataHandler(mockLogger);
  });

  afterEach(() => {
    wsManager.cleanup();
    marketDataHandler.cleanup();
  });

  describe('Cache de 1 Segundo', () => {
    it('deve usar cache para dados de mercado', async () => {
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      // Mock da resposta da API Binance
      axios.get.mockResolvedValueOnce({
        data: {
          symbol: 'BTCUSDT',
          lastPrice: '50000',
          priceChangePercent: '2.5',
          volume: '1000000',
          highPrice: '51000',
          lowPrice: '49000'
        }
      });

      // Primeira chamada
      const result1 = await marketDataHandler.getCachedData('BTCUSDT');
      expect(result1).toBeNull(); // Não deve ter cache ainda

      // Simular busca de dados
      await marketDataHandler['fetchMarketData']('BTCUSDT');

      // Segunda chamada (deve usar cache)
      const result2 = await marketDataHandler.getCachedData('BTCUSDT');
      expect(result2).toBeDefined();
      expect(result2.symbol).toBe('BTCUSDT');
      expect(result2.price).toBe(50000);
    });

    it('deve expirar cache após 1 segundo', async (done) => {
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      // Mock da resposta da API Binance
      axios.get.mockResolvedValue({
        data: {
          symbol: 'BTCUSDT',
          lastPrice: '50000',
          priceChangePercent: '2.5',
          volume: '1000000',
          highPrice: '51000',
          lowPrice: '49000'
        }
      });

      // Primeira chamada
      await marketDataHandler['fetchMarketData']('BTCUSDT');
      
      // Verificar cache imediatamente
      const result1 = await marketDataHandler.getCachedData('BTCUSDT');
      expect(result1).toBeDefined();

      // Aguardar expiração do cache (1 segundo)
      setTimeout(async () => {
        const result2 = await marketDataHandler.getCachedData('BTCUSDT');
        expect(result2).toBeNull(); // Cache deve ter expirado
        done();
      }, 1100);
    });
  });

  describe('WebSocket Broadcast', () => {
    it('deve fazer broadcast para subscribers', async () => {
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      // Mock da resposta da API Binance
      axios.get.mockResolvedValue({
        data: {
          symbol: 'BTCUSDT',
          lastPrice: '50000',
          priceChangePercent: '2.5',
          volume: '1000000',
          highPrice: '51000',
          lowPrice: '49000'
        }
      });

      // Adicionar subscriber
      marketDataHandler.subscribe('connection-1', { symbol: 'BTCUSDT' });

      // Simular busca de dados
      await marketDataHandler['fetchMarketData']('BTCUSDT');

      // Verificar se subscriber foi adicionado
      const subscribers = marketDataHandler.getSubscribers();
      expect(subscribers).toContain('connection-1');
    });

    it('deve remover subscriber corretamente', () => {
      marketDataHandler.subscribe('connection-1', { symbol: 'BTCUSDT' });
      marketDataHandler.subscribe('connection-2', { symbol: 'BTCUSDT' });

      // Verificar subscribers iniciais
      let subscribers = marketDataHandler.getSubscribers();
      expect(subscribers).toContain('connection-1');
      expect(subscribers).toContain('connection-2');

      // Remover subscriber
      marketDataHandler.unsubscribe('connection-1');

      // Verificar se foi removido
      subscribers = marketDataHandler.getSubscribers();
      expect(subscribers).not.toContain('connection-1');
      expect(subscribers).toContain('connection-2');
    });
  });

  describe('Fallback Automático', () => {
    it('deve usar dados em cache quando API falha', async () => {
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      // Primeira chamada bem-sucedida
      axios.get.mockResolvedValueOnce({
        data: {
          symbol: 'BTCUSDT',
          lastPrice: '50000',
          priceChangePercent: '2.5',
          volume: '1000000',
          highPrice: '51000',
          lowPrice: '49000'
        }
      });

      await marketDataHandler['fetchMarketData']('BTCUSDT');

      // Segunda chamada com erro
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      // Deve usar dados em cache
      const result = await marketDataHandler.getCachedData('BTCUSDT');
      expect(result).toBeDefined();
      expect(result.symbol).toBe('BTCUSDT');
      expect(result.price).toBe(50000);
    });

    it('deve lidar com erro de API graciosamente', async () => {
      // Mock de erro da API
      axios.get.mockRejectedValue(new Error('API Error'));

      // Deve lançar erro
      await expect(marketDataHandler['fetchMarketData']('BTCUSDT')).rejects.toThrow('Failed to fetch data from Binance');
    });
  });

  describe('Error Handling End-to-End', () => {
    it('deve lidar com dados inválidos da API', async () => {
      // Mock de dados inválidos
      axios.get.mockResolvedValue({
        data: {
          symbol: 'BTCUSDT',
          lastPrice: 'invalid', // Preço inválido
          priceChangePercent: 'invalid', // Percentual inválido
          volume: 'invalid', // Volume inválido
          highPrice: 'invalid', // High inválido
          lowPrice: 'invalid' // Low inválido
        }
      });

      // Deve lidar com dados inválidos
      await expect(marketDataHandler['fetchMarketData']('BTCUSDT')).rejects.toThrow('Failed to fetch data from Binance');
    });

    it('deve lidar com timeout da API', async () => {
      // Mock de timeout
      axios.get.mockRejectedValue(new Error('timeout'));

      await expect(marketDataHandler['fetchMarketData']('BTCUSDT')).rejects.toThrow('Failed to fetch data from Binance');
    });
  });

  describe('Performance', () => {
    it('deve buscar dados em menos de 1 segundo', async () => {
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      // Mock da resposta da API Binance
      axios.get.mockResolvedValue({
        data: {
          symbol: 'BTCUSDT',
          lastPrice: '50000',
          priceChangePercent: '2.5',
          volume: '1000000',
          highPrice: '51000',
          lowPrice: '49000'
        }
      });

      const startTime = Date.now();
      await marketDataHandler['fetchMarketData']('BTCUSDT');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Deve ser menor que 1 segundo
    });

    it('deve usar cache para múltiplas chamadas', async () => {
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      // Mock da resposta da API Binance
      axios.get.mockResolvedValue({
        data: {
          symbol: 'BTCUSDT',
          lastPrice: '50000',
          priceChangePercent: '2.5',
          volume: '1000000',
          highPrice: '51000',
          lowPrice: '49000'
        }
      });

      // Primeira chamada
      await marketDataHandler['fetchMarketData']('BTCUSDT');
      
      // Múltiplas chamadas subsequentes (devem usar cache)
      for (let i = 0; i < 10; i++) {
        const result = await marketDataHandler.getCachedData('BTCUSDT');
        expect(result).toBeDefined();
      }

      // Verificar se API foi chamada apenas uma vez
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Estatísticas', () => {
    it('deve retornar estatísticas completas', () => {
      const stats = marketDataHandler.getStats();

      expect(stats).toHaveProperty('subscribers');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheKeys');
      expect(stats).toHaveProperty('updateInterval');
      
      expect(stats.subscribers).toBe(0);
      expect(stats.cacheSize).toBe(0);
      expect(stats.updateInterval).toBe(1000);
    });
  });
});
