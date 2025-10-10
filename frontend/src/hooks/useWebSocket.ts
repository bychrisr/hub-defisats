import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: 'price_update' | 'candle_update' | 'market_data' | 'error' | 'active_account_changed' | 'connection' | 'data_update';
  data?: any;
  timestamp?: number;
  accountId?: string;
  accountName?: string;
  exchangeName?: string;
  exchangeId?: string;
  message?: string;
}

interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export const useWebSocket = ({
  url,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
  onMessage,
  onError,
  onOpen,
  onClose,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    console.log('🔌 WEBSOCKET - Tentando conectar:', {
      url,
      currentState: wsRef.current?.readyState,
      timestamp: new Date().toISOString()
    });

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WEBSOCKET - Já está conectado, ignorando nova conexão');
      return;
    }

    console.log('🔌 WEBSOCKET - Criando nova conexão WebSocket');
    console.log('🔌 WEBSOCKET - URL completa:', url);
    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WEBSOCKET - Conectado com sucesso:', {
          url,
          timestamp: new Date().toISOString(),
          readyState: ws.readyState
        });
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        console.log('📨 WEBSOCKET - Mensagem recebida:', {
          data: event.data,
          timestamp: new Date().toISOString()
        });
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WEBSOCKET - Mensagem parseada:', message);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error('❌ WEBSOCKET - Erro ao processar mensagem:', {
            error: err,
            data: event.data,
            timestamp: new Date().toISOString()
          });
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WEBSOCKET - Erro:', error);
        setError('Erro na conexão WebSocket');
        setIsConnecting(false);
        onError?.(error);
      };

      ws.onclose = (event) => {
        console.log('🔌 WEBSOCKET - Desconectado:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.();

        // Tentar reconectar se necessário
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 WEBSOCKET - Tentativa de reconexão ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Falha ao reconectar após múltiplas tentativas');
        }
      };

    } catch (err) {
      console.error('❌ WEBSOCKET - Erro ao criar conexão:', err);
      setError('Erro ao criar conexão WebSocket');
      setIsConnecting(false);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WEBSOCKET - Tentativa de envio com conexão fechada');
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    lastMessage,
    connect,
    disconnect,
    reconnect,
    sendMessage,
  };
};
