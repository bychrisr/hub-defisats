/**
 * Log Rotation System
 * 
 * Manages log file rotation to prevent disk space issues
 * and maintain log history for debugging and auditing
 */

import fs from 'fs/promises';
import path from 'path';

interface LogRotationConfig {
  maxFileSize: number; // in bytes
  maxFiles: number;
  logDirectory: string;
  fileName: string;
}

class LogRotation {
  private config: LogRotationConfig;
  private currentLogPath: string;

  constructor(config: LogRotationConfig) {
    this.config = config;
    this.currentLogPath = path.join(config.logDirectory, config.fileName);
  }

  async initialize(): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.config.logDirectory, { recursive: true });
      
      // Check if current log file needs rotation
      await this.checkAndRotate();
    } catch (error) {
      console.error('Failed to initialize log rotation:', error);
    }
  }

  async checkAndRotate(): Promise<void> {
    try {
      const stats = await fs.stat(this.currentLogPath).catch(() => null);
      
      if (!stats) {
        // Log file doesn't exist, create it
        await fs.writeFile(this.currentLogPath, '');
        return;
      }

      // Check if file size exceeds limit
      if (stats.size >= this.config.maxFileSize) {
        await this.rotateLogs();
      }
    } catch (error) {
      console.error('Error checking log rotation:', error);
    }
  }

  private async rotateLogs(): Promise<void> {
    try {
      // Rotate existing files
      for (let i = this.config.maxFiles - 1; i > 0; i--) {
        const oldFile = path.join(this.config.logDirectory, `${this.config.fileName}.${i}`);
        const newFile = path.join(this.config.logDirectory, `${this.config.fileName}.${i + 1}`);
        
        try {
          await fs.rename(oldFile, newFile);
        } catch (error) {
          // File doesn't exist, continue
        }
      }

      // Move current log to .1
      const rotatedFile = path.join(this.config.logDirectory, `${this.config.fileName}.1`);
      await fs.rename(this.currentLogPath, rotatedFile);

      // Create new empty log file
      await fs.writeFile(this.currentLogPath, '');

      console.log(`📁 Log rotated: ${this.config.fileName} -> ${this.config.fileName}.1`);
    } catch (error) {
      console.error('Error rotating logs:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Remove old log files beyond maxFiles
      for (let i = this.config.maxFiles + 1; i <= this.config.maxFiles + 5; i++) {
        const oldFile = path.join(this.config.logDirectory, `${this.config.fileName}.${i}`);
        try {
          await fs.unlink(oldFile);
          console.log(`🗑️ Cleaned up old log file: ${this.config.fileName}.${i}`);
        } catch (error) {
          // File doesn't exist, continue
        }
      }
    } catch (error) {
      console.error('Error cleaning up logs:', error);
    }
  }

  getCurrentLogPath(): string {
    return this.currentLogPath;
  }
}

// Default configuration
const defaultConfig: LogRotationConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  logDirectory: path.join(process.cwd(), 'logs'),
  fileName: 'app.log'
};

// Create default log rotation instance
export const logRotation = new LogRotation(defaultConfig);

// Initialize log rotation
logRotation.initialize().catch(console.error);

// Cleanup old logs on startup
logRotation.cleanup().catch(console.error);

export { LogRotation, LogRotationConfig };
