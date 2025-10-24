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

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

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
  urls?: string[];
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
  connectionEndpoint: string | null;
  reconnectAttempts: number;
  subscriptions: WebSocketSubscription[];
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const {
    url,
    urls,
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
    connectionEndpoint: null,
    reconnectAttempts: 0,
    subscriptions: []
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const lastMessageTimeRef = useRef<number>(0);
  const rateLimitRef = useRef<number>(1000); // 1 segundo entre mensagens
  const endpointsRef = useRef<string[]>([]);
  const endpointIndexRef = useRef<number>(0);
  const stateRef = useRef(state);

  const endpointsSignature = useMemo(
    () => JSON.stringify({ url, urls: urls ?? [] }),
    [url, urls]
  );

  useEffect(() => {
    const candidateList = [
      ...(Array.isArray(urls) ? urls : []),
      url
    ]
      .filter((endpoint): endpoint is string => typeof endpoint === 'string' && endpoint.length > 0)
      .map((endpoint) => endpoint.replace(/\/+$/, ''));

    const uniqueEndpoints = Array.from(new Set(candidateList));

    endpointsRef.current = uniqueEndpoints;
    endpointIndexRef.current = 0;
  }, [endpointsSignature]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Função para conectar WebSocket
  const connect = useCallback(() => {
    const endpoints = endpointsRef.current;

    console.log('🔌 WEBSOCKET ENHANCED - Starting connect function:', {
      endpoints,
      currentIndex: endpointIndexRef.current,
      existingWsState: wsRef.current?.readyState,
      existingWsUrl: wsRef.current?.url,
      timestamp: new Date().toISOString()
    });

    if (endpoints.length === 0) {
      console.error('❌ WEBSOCKET ENHANCED - Nenhum endpoint WebSocket configurado');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WEBSOCKET ENHANCED - Already connected', {
        url: wsRef.current.url,
        readyState: wsRef.current.readyState
      });
      return;
    }

    if (endpointIndexRef.current >= endpoints.length) {
      endpointIndexRef.current = 0;
    }

    const currentEndpoint = endpoints[endpointIndexRef.current];

    console.log('🔌 WEBSOCKET ENHANCED - Selected endpoint:', {
      currentEndpoint,
      endpointIndex: endpointIndexRef.current,
      totalEndpoints: endpoints.length,
      userId
    });

    let fallbackScheduled = false;
    const scheduleFallback = (reason: string) => {
      const endpointList = endpointsRef.current;
      if (endpointIndexRef.current < endpointList.length - 1) {
        endpointIndexRef.current += 1;
        fallbackScheduled = true;
        const nextEndpoint = endpointList[endpointIndexRef.current];
        console.log('🔁 WEBSOCKET ENHANCED - Tentando fallback WebSocket endpoint:', {
          nextEndpoint,
          reason
        });
        setTimeout(() => connect(), 0);
        return true;
      }
      return false;
    };

    console.log('🔌 WEBSOCKET ENHANCED - Connecting...', {
      endpoint: currentEndpoint,
      userId,
      availableEndpoints: endpoints
    });

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
      connectionEndpoint: currentEndpoint
    }));

    try {
      // Construir URL com parâmetros
      let wsUrl: URL;
      try {
        wsUrl = new URL(currentEndpoint);
      } catch {
        if (typeof window !== 'undefined') {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = new URL(currentEndpoint, `${protocol}//${window.location.host}`);
        } else {
          throw new Error(`Invalid WebSocket endpoint: ${currentEndpoint}`);
        }
      }
      if (userId) {
        wsUrl.searchParams.set('userId', userId);
      }

      // ANTES de criar WebSocket
      console.log('🔌 WEBSOCKET ENHANCED - Constructing WebSocket URL:', {
        wsUrlString: wsUrl.toString(),
        wsUrlProtocol: wsUrl.protocol,
        wsUrlHost: wsUrl.host,
        wsUrlPathname: wsUrl.pathname,
        wsUrlSearch: wsUrl.search,
        timestamp: new Date().toISOString()
      });

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;
      const createTime = performance.now();
      
      console.log('🔌 WEBSOCKET ENHANCED - WebSocket instance created:', {
        readyState: ws.readyState,
        url: ws.url,
        protocol: ws.protocol,
        extensions: ws.extensions,
        createTime,
        timestamp: new Date().toISOString()
      });

      let connectionOpened = false;

      // Event listeners com MUITO MAIS detalhes
      ws.onopen = () => {
        connectionOpened = true;
        const openTime = performance.now();
        console.log('✅ WEBSOCKET ENHANCED - onopen event fired:', {
          endpoint: currentEndpoint,
          readyState: ws.readyState,
          url: ws.url,
          protocol: ws.protocol,
          openTime,
          timeDelta: `${(openTime - createTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          isReconnecting: false,
          error: null,
          reconnectAttempts: 0,
          connectionEndpoint: currentEndpoint
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
        console.log('📨 WEBSOCKET ENHANCED - onmessage event fired:', {
          dataLength: event.data.length,
          dataPreview: event.data.substring(0, 100),
          timestamp: new Date().toISOString()
        });
        
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
        const closeTime = performance.now();
        console.log('🔌 WEBSOCKET ENHANCED - onclose event fired:', { 
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          endpoint: currentEndpoint,
          connectionOpened,
          closeTime,
          timeDelta: `${(closeTime - createTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });

        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        if (fallbackScheduled) {
          fallbackScheduled = false;
          return;
        }

        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        onClose?.();

        const hasFallback = endpointIndexRef.current < endpoints.length - 1;

        if (!connectionOpened && hasFallback) {
          scheduleFallback('close_event');
          return;
        }

        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000 && stateRef.current.reconnectAttempts < maxReconnectAttempts) {
          handleReconnect();
        }
      };

      ws.onerror = (error) => {
        const errorTime = performance.now();
        console.error('❌ WEBSOCKET ENHANCED - onerror event fired:', {
          error,
          errorType: error.type,
          endpoint: currentEndpoint,
          connectionOpened,
          readyState: ws.readyState,
          errorTime,
          timeDelta: `${(errorTime - createTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
        
        if (!connectionOpened) {
          const fallbackHandled = scheduleFallback('error_event');
          if (fallbackHandled) {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
              ws.close();
            }
            return;
          }
        }

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

      const endpoints = endpointsRef.current;
      const hasFallback = endpointIndexRef.current < endpoints.length - 1;
      if (hasFallback) {
        endpointIndexRef.current += 1;
        console.log('🔁 WEBSOCKET ENHANCED - Tentando fallback após falha imediata:', {
          nextEndpoint: endpoints[endpointIndexRef.current]
        });
        connect();
      }
    }
  }, [userId, subscriptions, onOpen, onMessage, onClose, onError, maxReconnectAttempts]);

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
      connectionId: null,
      connectionEndpoint: null
    }));
  }, []);

  // Função para reconectar
  const handleReconnect = useCallback(() => {
    if (stateRef.current.reconnectAttempts >= maxReconnectAttempts) {
      console.log('❌ WEBSOCKET ENHANCED - Max reconnect attempts reached');
      setState(prev => ({
        ...prev,
        error: 'Max reconnect attempts reached'
      }));
      return;
    }

    const attempt = stateRef.current.reconnectAttempts + 1;
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
  }, [maxReconnectAttempts, reconnectInterval, connect, onReconnect]);

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

  // ❌ REMOVIDO: Auto-connect causava race condition com autenticação
  // O RealtimeDataContext agora tem controle total sobre quando conectar
  // useEffect(() => {
  //   connect();
  //
  //   return () => {
  //     disconnect();
  //   };
  // }, [url, userId]); // Removido connect e disconnect das dependências

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
