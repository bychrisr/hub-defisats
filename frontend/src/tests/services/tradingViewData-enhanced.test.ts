/**
 * Testes Unitários - TradingViewDataServiceEnhanced
 * 
 * Testa todas as funcionalidades do serviço consolidado:
 * - Cache inteligente de 1 segundo
 * - WebSocket integration
 * - Subscriptions e notificações
 * - Rate limiting
 * - Error handling
 * - Fallback automático
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TradingViewDataServiceEnhanced } from '../../services/tradingViewData-enhanced.service';

// Mock do fetch
global.fetch = jest.fn();

// Mock do WebSocket
class MockWebSocket {
  public readyState = 1; // WebSocket.OPEN
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public send = jest.fn();
  public close = jest.fn();

  constructor(public url: string) {
    // Simular conexão automática
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }
}

// Substituir WebSocket global
(global as any).WebSocket = MockWebSocket;

describe('TradingViewDataServiceEnhanced', () => {
  let service: TradingViewDataServiceEnhanced;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TradingViewDataServiceEnhanced();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('Inicialização', () => {
    it('deve inicializar com configurações corretas', () => {
      expect(service).toBeDefined();
      
      const stats = service.getStats();
      expect(stats.isInitialized).toBe(true);
      expect(stats.websocket.isConnected).toBe(true);
    });

    it('deve conectar WebSocket automaticamente', () => {
      const stats = service.getStats();
      expect(stats.websocket.isConnected).toBe(true);
    });
  });

  describe('Market Data', () => {
    it('deve buscar dados de mercado com sucesso', async () => {
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockData
        })
      });

      const result = await service.getMarketData('BTCUSDT');

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('/api/tradingview/market-data?symbol=BTCUSDT');
    });

    it('deve usar cache de 1 segundo', async () => {
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockData
        })
      });

      // Primeira chamada
      await service.getMarketData('BTCUSDT');
      
      // Segunda chamada (deve usar cache)
      const result = await service.getMarketData('BTCUSDT');

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1); // Apenas uma chamada HTTP
    });

    it('deve fazer fallback para dados em cache em caso de erro', async () => {
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
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockData
        })
      });

      await service.getMarketData('BTCUSDT');

      // Segunda chamada com erro
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getMarketData('BTCUSDT');

      expect(result).toEqual(mockData); // Deve usar dados em cache
    });
  });

  describe('Historical Data', () => {
    it('deve buscar dados históricos com sucesso', async () => {
      const mockData = [
        { timestamp: 1640995200000, open: 47000, high: 48000, low: 46000, close: 47500, volume: 1000 },
        { timestamp: 1640995260000, open: 47500, high: 48500, low: 47000, close: 48000, volume: 1200 }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockData
        })
      });

      const result = await service.getHistoricalData('BTCUSDT', '1h', 100);

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('/api/tradingview/scanner?symbol=BTCUSDT&timeframe=1h&limit=100');
    });

    it('deve usar cache de 5 minutos para dados históricos', async () => {
      const mockData = [
        { timestamp: 1640995200000, open: 47000, high: 48000, low: 46000, close: 47500, volume: 1000 }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockData
        })
      });

      // Primeira chamada
      await service.getHistoricalData('BTCUSDT', '1h', 100);
      
      // Segunda chamada (deve usar cache)
      const result = await service.getHistoricalData('BTCUSDT', '1h', 100);

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1); // Apenas uma chamada HTTP
    });
  });

  describe('Subscriptions', () => {
    it('deve adicionar subscriber corretamente', () => {
      const callback = jest.fn();
      const subscriberId = service.subscribe(callback, 'BTCUSDT');

      expect(subscriberId).toBeDefined();
      expect(typeof subscriberId).toBe('string');

      const stats = service.getStats();
      expect(stats.subscribers.count).toBe(1);
      expect(stats.subscribers.ids).toContain(subscriberId);
    });

    it('deve remover subscriber corretamente', () => {
      const callback = jest.fn();
      const subscriberId = service.subscribe(callback, 'BTCUSDT');

      service.unsubscribe(subscriberId);

      const stats = service.getStats();
      expect(stats.subscribers.count).toBe(0);
      expect(stats.subscribers.ids).not.toContain(subscriberId);
    });

    it('deve notificar subscribers quando receber dados via WebSocket', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.subscribe(callback1, 'BTCUSDT');
      service.subscribe(callback2, 'BTCUSDT');

      // Simular mensagem WebSocket
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      // Simular recebimento de mensagem WebSocket
      const mockMessage = {
        type: 'market_data',
        data: mockData,
        timestamp: Date.now()
      };

      // Simular evento de mensagem WebSocket
      const mockEvent = new MessageEvent('message', {
        data: JSON.stringify(mockMessage)
      });

      // Simular processamento da mensagem
      service['notifySubscribers']('market_BTCUSDT', mockData);

      expect(callback1).toHaveBeenCalledWith(mockData);
      expect(callback2).toHaveBeenCalledWith(mockData);
    });
  });

  describe('Rate Limiting', () => {
    it('deve implementar rate limiting de 1 req/sec', async () => {
      const mockData = {
        symbol: 'BTCUSDT',
        price: 50000,
        change24h: 2.5,
        volume: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now()
      };

      (fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: mockData
        })
      });

      const startTime = Date.now();
      
      // Fazer duas chamadas seguidas
      await service.getMarketData('BTCUSDT');
      await service.getMarketData('BTCUSDT');
      
      const endTime = Date.now();
      
      // Deve ter esperado pelo menos 1 segundo entre as chamadas
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com erros de API graciosamente', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getMarketData('BTCUSDT')).rejects.toThrow('Network error');
    });

    it('deve lidar com respostas de erro da API', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'API Error',
          message: 'Failed to fetch data'
        })
      });

      await expect(service.getMarketData('BTCUSDT')).rejects.toThrow('Failed to fetch data');
    });

    it('deve lidar com dados inválidos da API', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: null
        })
      });

      await expect(service.getMarketData('BTCUSDT')).rejects.toThrow();
    });
  });

  describe('WebSocket Integration', () => {
    it('deve conectar WebSocket automaticamente', () => {
      const stats = service.getStats();
      expect(stats.websocket.isConnected).toBe(true);
    });

    it('deve reconectar automaticamente após falha', (done) => {
      const stats = service.getStats();
      expect(stats.websocket.reconnectAttempts).toBe(0);

      // Simular falha de conexão
      const mockWebSocket = new MockWebSocket('ws://localhost:3000/ws');
      mockWebSocket.onerror = () => {
        // Simular erro
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose(new CloseEvent('close'));
        }
      };

      // Aguardar reconexão
      setTimeout(() => {
        const newStats = service.getStats();
        expect(newStats.websocket.reconnectAttempts).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  describe('Estatísticas', () => {
    it('deve retornar estatísticas completas', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('isInitialized');
      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('subscribers');
      expect(stats).toHaveProperty('websocket');
      expect(stats).toHaveProperty('rateLimiting');
      
      expect(stats.cache).toHaveProperty('size');
      expect(stats.cache).toHaveProperty('keys');
      expect(stats.subscribers).toHaveProperty('count');
      expect(stats.subscribers).toHaveProperty('ids');
      expect(stats.websocket).toHaveProperty('isConnected');
      expect(stats.websocket).toHaveProperty('reconnectAttempts');
      expect(stats.rateLimiting).toHaveProperty('activeLimits');
      expect(stats.rateLimiting).toHaveProperty('limits');
    });
  });

  describe('Cleanup', () => {
    it('deve limpar todos os recursos', () => {
      service.cleanup();

      const stats = service.getStats();
      expect(stats.cache.size).toBe(0);
      expect(stats.subscribers.count).toBe(0);
      expect(stats.rateLimiting.activeLimits).toBe(0);
    });
  });
});
