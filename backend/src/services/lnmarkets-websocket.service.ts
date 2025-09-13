import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface LNMarketsWebSocketCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  isTestnet?: boolean;
}

export interface MarketData {
  price: number;
  volume: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  spread?: number;
}

export interface PositionUpdate {
  id: string;
  quantity: number;
  price: number;
  liquidation: number;
  leverage: number;
  margin: number;
  pnl: number;
  side: 'long' | 'short';
  status: 'open' | 'closed';
  timestamp: number;
}

export interface WebSocketMessage {
  id: string;
  method: string;
  params?: any;
  result?: any;
  error?: any;
}

export class LNMarketsWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private credentials: LNMarketsWebSocketCredentials;
  private baseURL: string;
  private reconnectInterval: number = 5000;
  private maxReconnectAttempts: number = 10;
  private reconnectAttempts: number = 0;
  private isConnected: boolean = false;
  private messageId: number = 0;
  private pendingMessages: Map<string, { resolve: Function; reject: Function }> = new Map();

  constructor(credentials: LNMarketsWebSocketCredentials) {
    super();
    this.credentials = credentials;
    this.baseURL = credentials.isTestnet 
      ? 'wss://api.lnmarkets.com/testnet' 
      : 'wss://api.lnmarkets.com';
  }

  /**
   * Connect to LN Markets WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 LN MARKETS WEBSOCKET - Connecting to:', this.baseURL);
        
        this.ws = new WebSocket(this.baseURL);
        
        this.ws.on('open', () => {
          console.log('✅ LN MARKETS WEBSOCKET - Connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ LN MARKETS WEBSOCKET - Error parsing message:', error);
          }
        });

        this.ws.on('close', (code: number, reason: string) => {
          console.log('🔌 LN MARKETS WEBSOCKET - Connection closed:', code, reason);
          this.isConnected = false;
          this.emit('disconnected', { code, reason });
          this.handleReconnect();
        });

        this.ws.on('error', (error: Error) => {
          console.error('❌ LN MARKETS WEBSOCKET - Connection error:', error);
          this.isConnected = false;
          this.emit('error', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ LN MARKETS WEBSOCKET - Failed to create connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      console.log('🔌 LN MARKETS WEBSOCKET - Disconnecting...');
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Send message to WebSocket
   */
  private sendMessage(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const messageId = (++this.messageId).toString();
      const message: WebSocketMessage = {
        id: messageId,
        method,
        params
      };

      this.pendingMessages.set(messageId, { resolve, reject });

      try {
        this.ws.send(JSON.stringify(message));
        console.log('📤 LN MARKETS WEBSOCKET - Sent message:', message);
      } catch (error) {
        this.pendingMessages.delete(messageId);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('📥 LN MARKETS WEBSOCKET - Received message:', message);

    // Handle response to pending message
    if (message.id && this.pendingMessages.has(message.id)) {
      const { resolve, reject } = this.pendingMessages.get(message.id)!;
      this.pendingMessages.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'WebSocket error'));
      } else {
        resolve(message.result);
      }
      return;
    }

    // Handle subscription updates
    if (message.method) {
      switch (message.method) {
        case 'market.update':
          this.handleMarketUpdate(message.params);
          break;
        case 'position.update':
          this.handlePositionUpdate(message.params);
          break;
        case 'margin.update':
          this.handleMarginUpdate(message.params);
          break;
        default:
          console.log('📥 LN MARKETS WEBSOCKET - Unknown method:', message.method);
      }
    }
  }

  /**
   * Handle market data updates
   */
  private handleMarketUpdate(data: any): void {
    const marketData: MarketData = {
      price: data.price,
      volume: data.volume,
      timestamp: Date.now(),
      bid: data.bid,
      ask: data.ask,
      spread: data.spread
    };
    
    this.emit('marketUpdate', marketData);
  }

  /**
   * Handle position updates
   */
  private handlePositionUpdate(data: any): void {
    const positionUpdate: PositionUpdate = {
      id: data.id,
      quantity: data.quantity,
      price: data.price,
      liquidation: data.liquidation,
      leverage: data.leverage,
      margin: data.margin,
      pnl: data.pnl,
      side: data.side === 'b' ? 'long' : 'short',
      status: data.running ? 'open' : 'closed',
      timestamp: Date.now()
    };
    
    this.emit('positionUpdate', positionUpdate);
  }

  /**
   * Handle margin updates
   */
  private handleMarginUpdate(data: any): void {
    this.emit('marginUpdate', {
      margin: data.margin,
      availableMargin: data.availableMargin,
      marginLevel: data.marginLevel,
      totalValue: data.totalValue,
      totalUnrealizedPnl: data.totalUnrealizedPnl,
      timestamp: Date.now()
    });
  }

  /**
   * Subscribe to market data
   */
  async subscribeToMarket(market: string = 'BTC'): Promise<void> {
    try {
      await this.sendMessage('market.subscribe', { market });
      console.log('📊 LN MARKETS WEBSOCKET - Subscribed to market:', market);
    } catch (error) {
      console.error('❌ LN MARKETS WEBSOCKET - Failed to subscribe to market:', error);
      throw error;
    }
  }

  /**
   * Subscribe to position updates
   */
  async subscribeToPositions(): Promise<void> {
    try {
      await this.sendMessage('positions.subscribe');
      console.log('📊 LN MARKETS WEBSOCKET - Subscribed to positions');
    } catch (error) {
      console.error('❌ LN MARKETS WEBSOCKET - Failed to subscribe to positions:', error);
      throw error;
    }
  }

  /**
   * Subscribe to margin updates
   */
  async subscribeToMargin(): Promise<void> {
    try {
      await this.sendMessage('margin.subscribe');
      console.log('📊 LN MARKETS WEBSOCKET - Subscribed to margin updates');
    } catch (error) {
      console.error('❌ LN MARKETS WEBSOCKET - Failed to subscribe to margin:', error);
      throw error;
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ LN MARKETS WEBSOCKET - Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 LN MARKETS WEBSOCKET - Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('❌ LN MARKETS WEBSOCKET - Reconnection failed:', error);
      });
    }, this.reconnectInterval);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get reconnection attempts
   */
  getReconnectionAttempts(): number {
    return this.reconnectAttempts;
  }
}

