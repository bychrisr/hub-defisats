/**
 * Testes de Integração - TradingView + WebSocket (Frontend)
 * 
 * Testa a integração completa entre:
 * - TradingViewDataServiceEnhanced
 * - useWebSocketEnhanced Hook
 * - UnifiedMarketHeaderEnhanced
 * - DashboardClassicEnhanced
 * 
 * Cenários testados:
 * - WebSocket connection e reconexão
 * - Subscriptions e notificações
 * - Cache de 1 segundo
 * - Error handling end-to-end
 * - Performance e rate limiting
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TradingViewDataServiceEnhanced } from '../../services/tradingViewData-enhanced.service';
import { useWebSocketEnhanced } from '../../hooks/useWebSocket-enhanced';
import { renderHook, act } from '@testing-library/react';

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

describe('TradingView + WebSocket Integration (Frontend)', () => {
  let service: TradingViewDataServiceEnhanced;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TradingViewDataServiceEnhanced();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('WebSocket Connection', () => {
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

      (fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: mockData
        })
      });

      // Primeira chamada
      const result1 = await service.getMarketData('BTCUSDT');
      expect(result1).toEqual(mockData);

      // Segunda chamada (deve usar cache)
      const result2 = await service.getMarketData('BTCUSDT');
      expect(result2).toEqual(mockData);

      // Verificar se fetch foi chamado apenas uma vez
      expect(fetch).toHaveBeenCalledTimes(1);
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

      (fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: mockData
        })
      });

      // Primeira chamada
      await service.getMarketData('BTCUSDT');

      // Aguardar expiração do cache (1 segundo)
      setTimeout(async () => {
        // Segunda chamada (deve buscar dados frescos)
        await service.getMarketData('BTCUSDT');
        expect(fetch).toHaveBeenCalledTimes(2);
        done();
      }, 1100);
    });
  });

  describe('Subscriptions e Notificações', () => {
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
      service['notifySubscribers']('market_BTCUSDT', mockData);

      expect(callback1).toHaveBeenCalledWith(mockData);
      expect(callback2).toHaveBeenCalledWith(mockData);
    });

    it('deve remover subscribers corretamente', () => {
      const callback = jest.fn();
      const subscriberId = service.subscribe(callback, 'BTCUSDT');

      // Verificar subscriber foi adicionado
      let stats = service.getStats();
      expect(stats.subscribers.count).toBe(1);
      expect(stats.subscribers.ids).toContain(subscriberId);

      // Remover subscriber
      service.unsubscribe(subscriberId);

      // Verificar subscriber foi removido
      stats = service.getStats();
      expect(stats.subscribers.count).toBe(0);
      expect(stats.subscribers.ids).not.toContain(subscriberId);
    });
  });

  describe('useWebSocketEnhanced Hook', () => {
    it('deve conectar WebSocket automaticamente', () => {
      const { result } = renderHook(() => useWebSocketEnhanced({
        url: 'ws://localhost:3000/ws',
        userId: 'user123',
        subscriptions: [
          { type: 'market_data', data: { symbol: 'BTCUSDT' } }
        ]
      }));

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionId).toBeDefined();
    });

    it('deve reconectar automaticamente após falha', (done) => {
      const { result } = renderHook(() => useWebSocketEnhanced({
        url: 'ws://localhost:3000/ws',
        userId: 'user123',
        subscriptions: [
          { type: 'market_data', data: { symbol: 'BTCUSDT' } }
        ]
      }));

      expect(result.current.reconnectAttempts).toBe(0);

      // Simular falha de conexão
      act(() => {
        result.current.disconnect();
      });

      // Aguardar reconexão
      setTimeout(() => {
        expect(result.current.reconnectAttempts).toBeGreaterThan(0);
        done();
      }, 100);
    });

    it('deve enviar mensagens corretamente', () => {
      const { result } = renderHook(() => useWebSocketEnhanced({
        url: 'ws://localhost:3000/ws',
        userId: 'user123',
        subscriptions: [
          { type: 'market_data', data: { symbol: 'BTCUSDT' } }
        ]
      }));

      const message = { type: 'ping', timestamp: Date.now() };
      const sent = result.current.sendMessage(message);

      expect(sent).toBe(true);
    });

    it('deve fazer subscriptions corretamente', () => {
      const { result } = renderHook(() => useWebSocketEnhanced({
        url: 'ws://localhost:3000/ws',
        userId: 'user123',
        subscriptions: [
          { type: 'market_data', data: { symbol: 'BTCUSDT' } }
        ]
      }));

      expect(result.current.subscriptions).toHaveLength(1);
      expect(result.current.subscriptions[0].type).toBe('market_data');
      expect(result.current.subscriptions[0].data.symbol).toBe('BTCUSDT');
    });
  });

  describe('Error Handling End-to-End', () => {
    it('deve lidar com erros de API graciosamente', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.getMarketData('BTCUSDT')).rejects.toThrow('Network error');
    });

    it('deve lidar com respostas de erro da API', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: false,
          error: 'API Error',
          message: 'Failed to fetch data'
        })
      });

      await expect(service.getMarketData('BTCUSDT')).rejects.toThrow('Failed to fetch data');
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

      // Deve usar dados em cache
      const result = await service.getMarketData('BTCUSDT');
      expect(result).toEqual(mockData);
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

      (fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: mockData
        })
      });

      const startTime = Date.now();
      await service.getMarketData('BTCUSDT');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

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
});
