/**
 * Centralized metrics export to prevent duplicate registrations
 * This file ensures only one instance of MetricsService is created
 */

import { getMetricsService } from './metrics.service';
import { Logger } from 'winston';

// Create a single logger instance for metrics
const metricsLogger: Logger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
} as any;

// Export the singleton instance
export const metrics = getMetricsService(metricsLogger);

// Re-export types and classes
export { MetricsService } from './metrics.service';
export { Counter, Histogram, Gauge, Summary } from 'prom-client';
