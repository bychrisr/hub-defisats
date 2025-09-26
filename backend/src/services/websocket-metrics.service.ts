/**
 * WebSocket Metrics Service
 * 
 * Collects and analyzes WebSocket connection quality metrics
 * for monitoring and performance optimization
 */

import { EventEmitter } from 'events';

export interface WebSocketMetrics {
  // Connection metrics
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  
  // Message metrics
  messagesReceived: number;
  messagesSent: number;
  messagesDropped: number;
  averageMessageSize: number;
  
  // Quality metrics
  successRate: number; // percentage
  errorRate: number; // percentage
  averageLatency: number; // milliseconds
  uptime: number; // percentage
  
  // Performance metrics
  bandwidthUsage: number; // bytes per second
  peakConnections: number;
  reconnections: number;
  
  // Timestamps
  firstConnectionTime: number;
  lastConnectionTime: number;
  lastMessageTime: number;
  lastErrorTime: number;
}

export interface ConnectionMetrics {
  userId: string;
  connectionId: string;
  startTime: number;
  endTime?: number;
  messagesReceived: number;
  messagesSent: number;
  errors: number;
  latency: number[];
  bandwidth: number;
  isActive: boolean;
}

export interface MessageMetrics {
  timestamp: number;
  type: string;
  size: number;
  latency?: number;
  success: boolean;
  error?: string;
}

export class WebSocketMetricsService extends EventEmitter {
  private metrics: WebSocketMetrics;
  private connections: Map<string, ConnectionMetrics> = new Map();
  private messages: MessageMetrics[] = [];
  private startTime: number;
  private maxMessageHistory: number = 1000;

  constructor() {
    super();
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize metrics with default values
   */
  private initializeMetrics(): WebSocketMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      averageConnectionTime: 0,
      messagesReceived: 0,
      messagesSent: 0,
      messagesDropped: 0,
      averageMessageSize: 0,
      successRate: 100,
      errorRate: 0,
      averageLatency: 0,
      uptime: 100,
      bandwidthUsage: 0,
      peakConnections: 0,
      reconnections: 0,
      firstConnectionTime: 0,
      lastConnectionTime: 0,
      lastMessageTime: 0,
      lastErrorTime: 0
    };
  }

  /**
   * Track new connection
   */
  trackConnection(userId: string, connectionId: string): void {
    const connectionMetrics: ConnectionMetrics = {
      userId,
      connectionId,
      startTime: Date.now(),
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      latency: [],
      bandwidth: 0,
      isActive: true
    };

    this.connections.set(connectionId, connectionMetrics);
    
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
    this.metrics.peakConnections = Math.max(this.metrics.peakConnections, this.metrics.activeConnections);
    
    if (this.metrics.firstConnectionTime === 0) {
      this.metrics.firstConnectionTime = Date.now();
    }
    this.metrics.lastConnectionTime = Date.now();

    console.log('📊 METRICS - New connection tracked', {
      userId,
      connectionId,
      totalConnections: this.metrics.totalConnections,
      activeConnections: this.metrics.activeConnections
    });

    this.emit('connectionTracked', connectionMetrics);
  }

  /**
   * Track connection end
   */
  trackConnectionEnd(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.endTime = Date.now();
    connection.isActive = false;
    
    this.metrics.activeConnections--;
    
    // Calculate connection duration
    const duration = connection.endTime - connection.startTime;
    this.updateAverageConnectionTime(duration);

    console.log('📊 METRICS - Connection ended', {
      connectionId,
      duration: `${duration}ms`,
      messagesReceived: connection.messagesReceived,
      messagesSent: connection.messagesSent,
      errors: connection.errors
    });

    this.emit('connectionEnded', connection);
  }

  /**
   * Track failed connection
   */
  trackConnectionFailure(userId: string, error: string): void {
    this.metrics.failedConnections++;
    this.metrics.lastErrorTime = Date.now();

    console.log('📊 METRICS - Connection failed', {
      userId,
      error,
      failedConnections: this.metrics.failedConnections
    });

    this.emit('connectionFailed', { userId, error });
  }

  /**
   * Track message received
   */
  trackMessageReceived(connectionId: string, message: any, latency?: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.messagesReceived++;
    if (latency !== undefined) {
      connection.latency.push(latency);
    }

    this.metrics.messagesReceived++;
    this.metrics.lastMessageTime = Date.now();

    const messageMetrics: MessageMetrics = {
      timestamp: Date.now(),
      type: message.type || 'unknown',
      size: JSON.stringify(message).length,
      latency,
      success: true
    };

    this.addMessageToHistory(messageMetrics);
    this.updateAverageMessageSize(messageMetrics.size);
    this.updateAverageLatency();

    this.emit('messageReceived', messageMetrics);
  }

  /**
   * Track message sent
   */
  trackMessageSent(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.messagesSent++;

    this.metrics.messagesSent++;
    this.metrics.lastMessageTime = Date.now();

    const messageMetrics: MessageMetrics = {
      timestamp: Date.now(),
      type: message.type || 'unknown',
      size: JSON.stringify(message).length,
      success: true
    };

    this.addMessageToHistory(messageMetrics);
    this.updateAverageMessageSize(messageMetrics.size);

    this.emit('messageSent', messageMetrics);
  }

  /**
   * Track message error
   */
  trackMessageError(connectionId: string, error: string, message?: any): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.errors++;
    }

    this.metrics.messagesDropped++;
    this.metrics.lastErrorTime = Date.now();

    const messageMetrics: MessageMetrics = {
      timestamp: Date.now(),
      type: message?.type || 'error',
      size: message ? JSON.stringify(message).length : 0,
      success: false,
      error
    };

    this.addMessageToHistory(messageMetrics);
    this.updateSuccessRate();

    console.log('📊 METRICS - Message error tracked', {
      connectionId,
      error,
      messagesDropped: this.metrics.messagesDropped
    });

    this.emit('messageError', messageMetrics);
  }

  /**
   * Track reconnection
   */
  trackReconnection(userId: string): void {
    this.metrics.reconnections++;

    console.log('📊 METRICS - Reconnection tracked', {
      userId,
      reconnections: this.metrics.reconnections
    });

    this.emit('reconnectionTracked', { userId });
  }

  /**
   * Add message to history
   */
  private addMessageToHistory(messageMetrics: MessageMetrics): void {
    this.messages.push(messageMetrics);
    
    // Keep only recent messages
    if (this.messages.length > this.maxMessageHistory) {
      this.messages = this.messages.slice(-this.maxMessageHistory);
    }
  }

  /**
   * Update average connection time
   */
  private updateAverageConnectionTime(duration: number): void {
    const totalConnections = this.metrics.totalConnections;
    this.metrics.averageConnectionTime = 
      (this.metrics.averageConnectionTime * (totalConnections - 1) + duration) / totalConnections;
  }

  /**
   * Update average message size
   */
  private updateAverageMessageSize(size: number): void {
    const totalMessages = this.metrics.messagesReceived + this.metrics.messagesSent;
    this.metrics.averageMessageSize = 
      (this.metrics.averageMessageSize * (totalMessages - 1) + size) / totalMessages;
  }

  /**
   * Update average latency
   */
  private updateAverageLatency(): void {
    const allLatencies: number[] = [];
    
    for (const connection of this.connections.values()) {
      allLatencies.push(...connection.latency);
    }

    if (allLatencies.length > 0) {
      this.metrics.averageLatency = 
        allLatencies.reduce((sum, latency) => sum + latency, 0) / allLatencies.length;
    }
  }

  /**
   * Update success rate
   */
  private updateSuccessRate(): void {
    const totalMessages = this.metrics.messagesReceived + this.metrics.messagesSent + this.metrics.messagesDropped;
    
    if (totalMessages > 0) {
      this.metrics.successRate = ((this.metrics.messagesReceived + this.metrics.messagesSent) / totalMessages) * 100;
      this.metrics.errorRate = (this.metrics.messagesDropped / totalMessages) * 100;
    }
  }

  /**
   * Update uptime
   */
  private updateUptime(): void {
    const now = Date.now();
    const totalTime = now - this.startTime;
    const downtime = this.metrics.failedConnections * 5000; // Assume 5s downtime per failure
    const uptime = Math.max(0, totalTime - downtime);
    
    this.metrics.uptime = (uptime / totalTime) * 100;
  }

  /**
   * Update bandwidth usage
   */
  private updateBandwidthUsage(): void {
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const recentMessages = this.messages.filter(msg => now - msg.timestamp < timeWindow);
    
    const totalBytes = recentMessages.reduce((sum, msg) => sum + msg.size, 0);
    this.metrics.bandwidthUsage = totalBytes / (timeWindow / 1000); // bytes per second
  }

  /**
   * Get current metrics
   */
  getMetrics(): WebSocketMetrics {
    this.updateUptime();
    this.updateBandwidthUsage();
    this.updateSuccessRate();
    
    return { ...this.metrics };
  }

  /**
   * Get connection metrics
   */
  getConnectionMetrics(connectionId: string): ConnectionMetrics | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): ConnectionMetrics[] {
    return Array.from(this.connections.values()).filter(conn => conn.isActive);
  }

  /**
   * Get recent messages
   */
  getRecentMessages(limit: number = 100): MessageMetrics[] {
    return this.messages.slice(-limit);
  }

  /**
   * Get health score (0-100)
   */
  getHealthScore(): number {
    const metrics = this.getMetrics();
    
    const factors = [
      metrics.successRate,
      metrics.uptime,
      Math.max(0, 100 - metrics.errorRate),
      Math.max(0, 100 - (metrics.averageLatency / 1000)) // Penalize high latency
    ];
    
    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.connections.clear();
    this.messages = [];
    this.startTime = Date.now();
    
    console.log('📊 METRICS - Metrics reset');
    this.emit('metricsReset');
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): any {
    return {
      metrics: this.getMetrics(),
      connections: Array.from(this.connections.values()),
      recentMessages: this.getRecentMessages(50),
      healthScore: this.getHealthScore(),
      timestamp: Date.now()
    };
  }
}

// Export singleton instance
export const websocketMetricsService = new WebSocketMetricsService();
