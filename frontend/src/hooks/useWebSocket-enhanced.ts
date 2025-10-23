/**
 * useWebSocket Enhanced Hook
 * 
 * Hook consolidado para WebSocket com funcionalidades avançadas:
 * - Reconexão automática com backoff exponencial
 * - Subscriptions gerenciadas
 * - Error handling robusto
 * - Rate limiting
 * - Logs detalhados para debugging
 * 
 * Funcionalidades integradas:
 * ✅ Conexão gerenciada com reconexão automática
 * ✅ Subscriptions para market data, user data, position updates
 * ✅ Error handling com retry
 * ✅ Rate limiting e debouncing
 * ✅ Logs detalhados para debugging
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  connectionId?: string;
  userId?: string;
}

export interface WebSocketSubscription {
  type: 'market_data' | 'user_data' | 'position_updates';
  data?: any;
}

export interface UseWebSocketOptions {
  url: string;
  userId?: string;
  subscriptions?: WebSocketSubscription[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onReconnect?: (attempt: number) => void;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  connectionId: string | null;
  reconnectAttempts: number;
  subscriptions: WebSocketSubscription[];
}

export const useWebSocketEnhanced = (options: UseWebSocketOptions) => {
  const {
    url,
    userId,
    subscriptions = [],
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage,
    onError,
    onOpen,
    onClose,
    onReconnect
  } = options;

  // State
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    error: null,
    lastMessage: null,
    connectionId: null,
    reconnectAttempts: 0,
    subscriptions: []
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const lastMessageTimeRef = useRef<number>(0);
  const rateLimitRef = useRef<number>(1000); // 1 segundo entre mensagens

  // Função para conectar WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WEBSOCKET ENHANCED - Already connected');
      return;
    }

    console.log('🔌 WEBSOCKET ENHANCED - Connecting...', { url, userId });

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    try {
      // Construir URL com parâmetros
      const wsUrl = new URL(url);
      if (userId) {
        wsUrl.searchParams.set('userId', userId);
      }

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      // Event listeners
      ws.onopen = () => {
        console.log('✅ WEBSOCKET ENHANCED - Connected');
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          isReconnecting: false,
          error: null,
          reconnectAttempts: 0
        }));

        // Enviar mensagens em fila
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message) {
            sendMessage(message);
          }
        }

        // Fazer subscriptions
        subscriptions.forEach(subscription => {
          subscribe(subscription);
        });

        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          console.log('📨 WEBSOCKET ENHANCED - Message received:', { 
            type: message.type, 
            connectionId: message.connectionId 
          });

          setState(prev => ({
            ...prev,
            lastMessage: message,
            connectionId: message.connectionId || prev.connectionId
          }));

          onMessage?.(message);

        } catch (error) {
          console.error('❌ WEBSOCKET ENHANCED - Message parse error:', error);
          setState(prev => ({
            ...prev,
            error: 'Failed to parse message'
          }));
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WEBSOCKET ENHANCED - Connection closed:', { 
          code: event.code, 
          reason: event.reason 
        });

        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        onClose?.();

        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000 && state.reconnectAttempts < maxReconnectAttempts) {
          handleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WEBSOCKET ENHANCED - Connection error:', error);
        
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          isConnecting: false
        }));

        onError?.(new Error('WebSocket connection error'));
      };

    } catch (error) {
      console.error('❌ WEBSOCKET ENHANCED - Connection failed:', error);
      
      setState(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection',
        isConnecting: false
      }));

      onError?.(error as Error);
    }
  }, [url, userId, subscriptions, maxReconnectAttempts, onMessage, onError, onOpen, onClose]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    console.log('🔌 WEBSOCKET ENHANCED - Disconnecting...');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Intentional disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      connectionId: null
    }));
  }, []);

  // Função para reconectar
  const handleReconnect = useCallback(() => {
    if (state.reconnectAttempts >= maxReconnectAttempts) {
      console.log('❌ WEBSOCKET ENHANCED - Max reconnect attempts reached');
      setState(prev => ({
        ...prev,
        error: 'Max reconnect attempts reached'
      }));
      return;
    }

    const attempt = state.reconnectAttempts + 1;
    const delay = reconnectInterval * Math.pow(2, attempt - 1); // Backoff exponencial

    console.log(`🔄 WEBSOCKET ENHANCED - Reconnecting attempt ${attempt}/${maxReconnectAttempts} in ${delay}ms`);

    setState(prev => ({
      ...prev,
      isReconnecting: true,
      reconnectAttempts: attempt
    }));

    onReconnect?.(attempt);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [state.reconnectAttempts, maxReconnectAttempts, reconnectInterval, connect, onReconnect]);

  // Função para enviar mensagem
  const sendMessage = useCallback((message: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('📤 WEBSOCKET ENHANCED - Queueing message (not connected):', message);
      messageQueueRef.current.push(message);
      return false;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastMessageTimeRef.current < rateLimitRef.current) {
      console.log('⏳ WEBSOCKET ENHANCED - Rate limited, queueing message');
      messageQueueRef.current.push(message);
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
      lastMessageTimeRef.current = now;
      
      console.log('📤 WEBSOCKET ENHANCED - Message sent:', message);
      return true;
    } catch (error) {
      console.error('❌ WEBSOCKET ENHANCED - Send error:', error);
      return false;
    }
  }, []);

  // Função para subscribe
  const subscribe = useCallback((subscription: WebSocketSubscription) => {
    const message = {
      type: `subscribe_${subscription.type}`,
      data: subscription.data,
      timestamp: Date.now()
    };

    console.log('📡 WEBSOCKET ENHANCED - Subscribing:', subscription);
    sendMessage(message);

    setState(prev => ({
      ...prev,
      subscriptions: [...prev.subscriptions, subscription]
    }));
  }, [sendMessage]);

  // Função para unsubscribe
  const unsubscribe = useCallback((subscription: WebSocketSubscription) => {
    const message = {
      type: `unsubscribe_${subscription.type}`,
      data: subscription.data,
      timestamp: Date.now()
    };

    console.log('📡 WEBSOCKET ENHANCED - Unsubscribing:', subscription);
    sendMessage(message);

    setState(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.filter(sub => 
        !(sub.type === subscription.type && JSON.stringify(sub.data) === JSON.stringify(subscription.data))
      )
    }));
  }, [sendMessage]);

  // Função para ping
  const ping = useCallback(() => {
    sendMessage({ type: 'ping', timestamp: Date.now() });
  }, [sendMessage]);

  // Effect para conectar automaticamente
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Effect para limpeza
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe,
    ping
  };
};
