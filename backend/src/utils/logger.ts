/**
 * Structured Logger with Security Sanitization
 * 
 * Provides different log levels and automatic sanitization of sensitive data
 */

import { sanitizeObject } from './secure-logger';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  service?: string;
  userId?: string;
  requestId?: string;
}

class Logger {
  private currentLevel: LogLevel;
  private service: string;

  constructor(service: string = 'app') {
    this.service = service;
    this.currentLevel = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    switch (level) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatLog(level: string, message: string, data?: any, context?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? sanitizeObject(data) : undefined,
      service: this.service,
      ...context
    };
  }

  private output(entry: LogEntry): void {
    if (process.env.NODE_ENV === 'production') {
      // In production, use structured JSON logging
      console.log(JSON.stringify(entry));
    } else {
      // In development, use human-readable format
      const { timestamp, level, message, data, service } = entry;
      const time = timestamp.split('T')[1].split('.')[0];
      const prefix = `[${time}] ${level.toUpperCase()} [${service}]`;
      
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  error(message: string, data?: any, context?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.formatLog('error', message, data, context);
    this.output(entry);
  }

  warn(message: string, data?: any, context?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.formatLog('warn', message, data, context);
    this.output(entry);
  }

  info(message: string, data?: any, context?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.formatLog('info', message, data, context);
    this.output(entry);
  }

  debug(message: string, data?: any, context?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.formatLog('debug', message, data, context);
    this.output(entry);
  }

  // Convenience methods for common scenarios
  auth(message: string, data?: any, userId?: string): void {
    this.info(`🔐 AUTH: ${message}`, data, { userId });
  }

  api(message: string, data?: any, requestId?: string): void {
    this.info(`🌐 API: ${message}`, data, { requestId });
  }

  db(message: string, data?: any): void {
    this.debug(`🗄️ DB: ${message}`, data);
  }

  security(message: string, data?: any): void {
    this.warn(`🛡️ SECURITY: ${message}`, data);
  }

  performance(message: string, data?: any): void {
    this.info(`⚡ PERFORMANCE: ${message}`, data);
  }
}

// Create service-specific loggers
export const authLogger = new Logger('auth');
export const apiLogger = new Logger('api');
export const dbLogger = new Logger('database');
export const securityLogger = new Logger('security');
export const performanceLogger = new Logger('performance');

// Default logger
export const logger = new Logger('app');

// Export the Logger class for custom loggers
export { Logger };
