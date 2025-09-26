/**
 * WebSocket Heartbeat Service
 * 
 * Manages heartbeat/ping-pong mechanism for WebSocket connections
 * to detect dead connections and maintain connection health
 */

import { EventEmitter } from 'events';

export interface HeartbeatConfig {
  interval: number; // milliseconds between heartbeats
  timeout: number; // milliseconds to wait for pong response
  maxMissedPongs: number; // max missed pongs before considering connection dead
}

export interface HeartbeatStats {
  pingsSent: number;
  pongsReceived: number;
  missedPongs: number;
  lastPingTime: number;
  lastPongTime: number;
  isHealthy: boolean;
}

export class WebSocketHeartbeatService extends EventEmitter {
  private config: HeartbeatConfig;
  private stats: HeartbeatStats;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private isActive = false;

  constructor(config: Partial<HeartbeatConfig> = {}) {
    super();
    
    this.config = {
      interval: config.interval || 30000, // 30 seconds
      timeout: config.timeout || 10000, // 10 seconds
      maxMissedPongs: config.maxMissedPongs || 3
    };

    this.stats = {
      pingsSent: 0,
      pongsReceived: 0,
      missedPongs: 0,
      lastPingTime: 0,
      lastPongTime: 0,
      isHealthy: true
    };
  }

  /**
   * Start heartbeat mechanism
   */
  start(): void {
    if (this.isActive) {
      console.log('⚠️ HEARTBEAT - Already active');
      return;
    }

    console.log('💓 HEARTBEAT - Starting heartbeat service', {
      interval: this.config.interval,
      timeout: this.config.timeout,
      maxMissedPongs: this.config.maxMissedPongs
    });

    this.isActive = true;
    this.stats.isHealthy = true;
    this.stats.missedPongs = 0;

    this.heartbeatInterval = setInterval(() => {
      this.sendPing();
    }, this.config.interval);

    this.emit('started');
  }

  /**
   * Stop heartbeat mechanism
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    console.log('💓 HEARTBEAT - Stopping heartbeat service');

    this.isActive = false;
    this.stats.isHealthy = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }

    this.emit('stopped');
  }

  /**
   * Send ping to check connection health
   */
  private sendPing(): void {
    if (!this.isActive) return;

    this.stats.pingsSent++;
    this.stats.lastPingTime = Date.now();

    console.log('💓 HEARTBEAT - Sending ping', {
      pingNumber: this.stats.pingsSent,
      timestamp: new Date().toISOString()
    });

    // Emit ping event for WebSocket to send
    this.emit('ping', {
      type: 'ping',
      timestamp: this.stats.lastPingTime,
      pingId: this.stats.pingsSent
    });

    // Set timeout for pong response
    this.pongTimeout = setTimeout(() => {
      this.handleMissedPong();
    }, this.config.timeout);
  }

  /**
   * Handle pong response from client
   */
  handlePong(pongData: any): void {
    if (!this.isActive) return;

    // Clear pong timeout
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }

    this.stats.pongsReceived++;
    this.stats.lastPongTime = Date.now();
    this.stats.missedPongs = 0; // Reset missed pongs counter
    this.stats.isHealthy = true;

    const latency = this.stats.lastPongTime - this.stats.lastPingTime;

    console.log('💓 HEARTBEAT - Received pong', {
      pongNumber: this.stats.pongsReceived,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    });

    this.emit('pong', {
      latency,
      timestamp: this.stats.lastPongTime,
      pongData
    });
  }

  /**
   * Handle missed pong (timeout)
   */
  private handleMissedPong(): void {
    if (!this.isActive) return;

    this.stats.missedPongs++;
    this.stats.isHealthy = false;

    console.warn('⚠️ HEARTBEAT - Missed pong response', {
      missedPongs: this.stats.missedPongs,
      maxMissedPongs: this.config.maxMissedPongs,
      timestamp: new Date().toISOString()
    });

    this.emit('missedPong', {
      missedPongs: this.stats.missedPongs,
      maxMissedPongs: this.config.maxMissedPongs
    });

    // If too many missed pongs, consider connection dead
    if (this.stats.missedPongs >= this.config.maxMissedPongs) {
      console.error('💀 HEARTBEAT - Connection considered dead', {
        missedPongs: this.stats.missedPongs,
        maxMissedPongs: this.config.maxMissedPongs
      });

      this.emit('connectionDead', {
        missedPongs: this.stats.missedPongs,
        lastPingTime: this.stats.lastPingTime,
        lastPongTime: this.stats.lastPongTime
      });
    }
  }

  /**
   * Get current heartbeat statistics
   */
  getStats(): HeartbeatStats {
    return { ...this.stats };
  }

  /**
   * Get health status
   */
  isConnectionHealthy(): boolean {
    return this.stats.isHealthy && this.stats.missedPongs < this.config.maxMissedPongs;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      pingsSent: 0,
      pongsReceived: 0,
      missedPongs: 0,
      lastPingTime: 0,
      lastPongTime: 0,
      isHealthy: true
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HeartbeatConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    console.log('💓 HEARTBEAT - Configuration updated', {
      old: oldConfig,
      new: this.config
    });

    // Restart if active and interval changed
    if (this.isActive && oldConfig.interval !== this.config.interval) {
      this.stop();
      this.start();
    }
  }
}
