/**
 * Testes Unitários - WebSocket Manager Consolidado
 * 
 * Testa todas as funcionalidades do WebSocket Manager:
 * - Criação e gerenciamento de conexões
 * - Broadcast e mensagens
 * - Rate limiting
 * - Heartbeat e ping/pong
 * - Error handling
 * - Cleanup
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WebSocketManager } from '../../websocket/manager';
import { Logger } from 'winston';
import { WebSocket } from 'ws';

// Mock do logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

// Mock do WebSocket
const mockWebSocket = {
  readyState: 1, // WebSocket.OPEN
  send: jest.fn(),
  ping: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
} as unknown as WebSocket;

describe('WebSocketManager', () => {
  let manager: WebSocketManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new WebSocketManager({
      heartbeatInterval: 1000, // 1 segundo para testes
      maxReconnectAttempts: 3,
      reconnectInterval: 1000,
      rateLimitWindow: 60000,
      maxMessagesPerWindow: 100,
      pingTimeout: 5000
    }, mockLogger);
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('Criação de Conexões', () => {
    it('deve criar conexão com sucesso', async () => {
      const connectionId = 'test-connection-1';
      const metadata = { userId: 'user123' };

      const connection = await manager.createConnection(connectionId, mockWebSocket, metadata);

      expect(connection).toBeDefined();
      expect(connection.id).toBe(connectionId);
      expect(connection.userId).toBe('user123');
      expect(connection.ws).toBe(mockWebSocket);
      expect(connection.subscriptions).toBeInstanceOf(Set);
      expect(connection.metadata).toEqual(metadata);
      expect(connection.isAlive).toBe(true);
    });

    it('deve emitir evento de conexão', async () => {
      const connectionId = 'test-connection-2';
      const onConnection = jest.fn();

      manager.on('connection', onConnection);
      await manager.createConnection(connectionId, mockWebSocket, {});

      expect(onConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          id: connectionId,
          ws: mockWebSocket
        })
      );
    });

    it('deve mapear conexões por usuário', async () => {
      const userId = 'user123';
      const connectionId1 = 'conn-1';
      const connectionId2 = 'conn-2';

      await manager.createConnection(connectionId1, mockWebSocket, { userId });
      await manager.createConnection(connectionId2, mockWebSocket, { userId });

      const stats = manager.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.totalUsers).toBe(1);
      expect(stats.users).toContain(userId);
    });
  });

  describe('Envio de Mensagens', () => {
    it('deve enviar mensagem para conexão específica', async () => {
      const connectionId = 'test-connection-3';
      await manager.createConnection(connectionId, mockWebSocket, {});

      const message = { type: 'test', data: 'hello' };
      const result = manager.sendMessage(connectionId, message);

      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('deve retornar false para conexão inexistente', () => {
      const result = manager.sendMessage('inexistent-connection', { type: 'test' });
      expect(result).toBe(false);
    });

    it('deve retornar false para conexão fechada', async () => {
      const connectionId = 'test-connection-4';
      const closedWebSocket = { ...mockWebSocket, readyState: 3 }; // WebSocket.CLOSED
      
      await manager.createConnection(connectionId, closedWebSocket as WebSocket, {});
      
      const result = manager.sendMessage(connectionId, { type: 'test' });
      expect(result).toBe(false);
    });
  });

  describe('Broadcast', () => {
    beforeEach(async () => {
      // Criar múltiplas conexões para teste
      await manager.createConnection('conn-1', mockWebSocket, { userId: 'user1' });
      await manager.createConnection('conn-2', mockWebSocket, { userId: 'user2' });
      await manager.createConnection('conn-3', mockWebSocket, { userId: 'user1' });
    });

    it('deve fazer broadcast para todas as conexões', () => {
      const message = { type: 'broadcast', data: 'hello all' };
      const sentCount = manager.broadcast(message);

      expect(sentCount).toBe(3);
      expect(mockWebSocket.send).toHaveBeenCalledTimes(3);
    });

    it('deve fazer broadcast para usuário específico', () => {
      const message = { type: 'user_message', data: 'hello user1' };
      const sentCount = manager.broadcastToUser('user1', message);

      expect(sentCount).toBe(2); // user1 tem 2 conexões
      expect(mockWebSocket.send).toHaveBeenCalledTimes(2);
    });

    it('deve excluir conexões específicas do broadcast', () => {
      const message = { type: 'broadcast', data: 'hello' };
      const sentCount = manager.broadcast(message, { exclude: ['conn-1'] });

      expect(sentCount).toBe(2); // 3 conexões - 1 excluída
      expect(mockWebSocket.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    it('deve permitir mensagens dentro do limite', async () => {
      const connectionId = 'test-connection-5';
      await manager.createConnection(connectionId, mockWebSocket, {});

      // Simular múltiplas mensagens
      for (let i = 0; i < 10; i++) {
        const message = { type: 'ping', data: i };
        const result = manager.sendMessage(connectionId, message);
        expect(result).toBe(true);
      }
    });

    it('deve bloquear mensagens após limite excedido', async () => {
      const connectionId = 'test-connection-6';
      await manager.createConnection(connectionId, mockWebSocket, {});

      // Simular muitas mensagens rapidamente
      for (let i = 0; i < 150; i++) {
        const message = { type: 'ping', data: i };
        manager.sendMessage(connectionId, message);
      }

      // Verificar se algumas mensagens foram bloqueadas
      expect(mockWebSocket.send).toHaveBeenCalledTimes(100); // Limite de 100
    });
  });

  describe('Heartbeat', () => {
    it('deve executar heartbeat periodicamente', (done) => {
      const connectionId = 'test-connection-7';
      manager.createConnection(connectionId, mockWebSocket, {});

      // Aguardar heartbeat
      setTimeout(() => {
        expect(mockWebSocket.ping).toHaveBeenCalled();
        done();
      }, 1100); // 1 segundo + 100ms de margem
    });

    it('deve remover conexões mortas', (done) => {
      const connectionId = 'test-connection-8';
      const deadWebSocket = { ...mockWebSocket, readyState: 3 }; // WebSocket.CLOSED
      
      manager.createConnection(connectionId, deadWebSocket as WebSocket, {});

      // Aguardar heartbeat para detectar conexão morta
      setTimeout(() => {
        const stats = manager.getStats();
        expect(stats.totalConnections).toBe(0);
        done();
      }, 1100);
    });
  });

  describe('Remoção de Conexões', () => {
    it('deve remover conexão corretamente', async () => {
      const connectionId = 'test-connection-9';
      const userId = 'user123';
      
      await manager.createConnection(connectionId, mockWebSocket, { userId });
      
      const onDisconnection = jest.fn();
      manager.on('disconnection', onDisconnection);
      
      manager.removeConnection(connectionId);

      expect(onDisconnection).toHaveBeenCalledWith(
        expect.objectContaining({
          id: connectionId,
          userId: userId
        })
      );

      const stats = manager.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.totalUsers).toBe(0);
    });

    it('deve fechar conexão ao remover', async () => {
      const connectionId = 'test-connection-10';
      await manager.createConnection(connectionId, mockWebSocket, {});

      manager.closeConnection(connectionId);

      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('Estatísticas', () => {
    it('deve retornar estatísticas completas', async () => {
      await manager.createConnection('conn-1', mockWebSocket, { userId: 'user1' });
      await manager.createConnection('conn-2', mockWebSocket, { userId: 'user2' });

      const stats = manager.getStats();

      expect(stats).toHaveProperty('totalConnections', 2);
      expect(stats).toHaveProperty('totalUsers', 2);
      expect(stats).toHaveProperty('connections');
      expect(stats).toHaveProperty('users');
      expect(stats).toHaveProperty('config');
      expect(stats.connections).toContain('conn-1');
      expect(stats.connections).toContain('conn-2');
      expect(stats.users).toContain('user1');
      expect(stats.users).toContain('user2');
    });
  });

  describe('Cleanup', () => {
    it('deve limpar todos os recursos', async () => {
      await manager.createConnection('conn-1', mockWebSocket, {});
      await manager.createConnection('conn-2', mockWebSocket, {});

      manager.cleanup();

      const stats = manager.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.totalUsers).toBe(0);
      expect(mockWebSocket.close).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com erros de envio graciosamente', async () => {
      const connectionId = 'test-connection-11';
      const errorWebSocket = {
        ...mockWebSocket,
        send: jest.fn().mockImplementation(() => {
          throw new Error('Send error');
        })
      };

      await manager.createConnection(connectionId, errorWebSocket as WebSocket, {});

      const result = manager.sendMessage(connectionId, { type: 'test' });
      expect(result).toBe(false);
    });

    it('deve remover conexão com erro', async () => {
      const connectionId = 'test-connection-12';
      const errorWebSocket = {
        ...mockWebSocket,
        send: jest.fn().mockImplementation(() => {
          throw new Error('Send error');
        })
      };

      await manager.createConnection(connectionId, errorWebSocket as WebSocket, {});

      const onDisconnection = jest.fn();
      manager.on('disconnection', onDisconnection);

      manager.sendMessage(connectionId, { type: 'test' });

      expect(onDisconnection).toHaveBeenCalled();
    });
  });
});
