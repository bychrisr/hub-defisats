/**
 * Health Check Seeder
 * 
 * Populates health check configurations and initial data
 */

import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';

interface HealthCheckConfig {
  name: string;
  description: string;
  enabled: boolean;
  interval: number;
  timeout: number;
  retries: number;
  alertThresholds: {
    latency: number;
    errorRate: number;
    memoryUsage: number;
  };
}

const defaultHealthConfigs: HealthCheckConfig[] = [
  {
    name: 'database',
    description: 'PostgreSQL database health monitoring',
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 10000, // 10 seconds
    retries: 3,
    alertThresholds: {
      latency: 1000, // 1 second
      errorRate: 5, // 5%
      memoryUsage: 80 // 80%
    }
  },
  {
    name: 'redis',
    description: 'Redis cache and queue health monitoring',
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3,
    alertThresholds: {
      latency: 100, // 100ms
      errorRate: 5, // 5%
      memoryUsage: 80 // 80%
    }
  },
  {
    name: 'websocket',
    description: 'WebSocket connection health monitoring',
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3,
    alertThresholds: {
      latency: 1000, // 1 second
      errorRate: 10, // 10%
      memoryUsage: 70 // 70%
    }
  },
  {
    name: 'external-apis',
    description: 'External APIs health monitoring (LN Markets, CoinGecko)',
    enabled: true,
    interval: 60000, // 1 minute
    timeout: 10000, // 10 seconds
    retries: 2,
    alertThresholds: {
      latency: 5000, // 5 seconds
      errorRate: 20, // 20%
      memoryUsage: 90 // 90%
    }
  },
  {
    name: 'system-resources',
    description: 'System resources monitoring (CPU, Memory)',
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3,
    alertThresholds: {
      latency: 1000, // 1 second
      errorRate: 5, // 5%
      memoryUsage: 85 // 85%
    }
  }
];

export const healthCheckSeeder: Seeder = {
  name: 'health-check',
  description: 'Populates health check configurations and monitoring settings',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      
      // Check if health check configurations already exist
      const existingCount = await prisma.healthCheckConfig.count();
      
      if (existingCount > 0) {
        return {
          success: true,
          message: `Health check configurations already exist (${existingCount} records). Skipping seeding.`,
          count: existingCount
        };
      }

      // Insert health check configurations
      const createdConfigs = await prisma.healthCheckConfig.createMany({
        data: defaultHealthConfigs.map(config => ({
          name: config.name,
          description: config.description,
          enabled: config.enabled,
          interval_ms: config.interval,
          timeout_ms: config.timeout,
          retries: config.retries,
          alert_thresholds: config.alertThresholds,
          created_at: new Date(),
          updated_at: new Date()
        })),
        skipDuplicates: true
      });

      // Create initial health metrics record
      await prisma.healthMetrics.create({
        data: {
          total_checks: 0,
          successful_checks: 0,
          failed_checks: 0,
          average_latency_ms: 0,
          uptime_percentage: 100,
          last_healthy_time: new Date(),
          consecutive_failures: 0,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Create sample health alerts (for demonstration)
      const sampleAlerts = [
        {
          component: 'database',
          severity: 'medium',
          message: 'Database latency is above threshold',
          resolved: false,
          created_at: new Date()
        },
        {
          component: 'redis',
          severity: 'low',
          message: 'Redis memory usage is high',
          resolved: true,
          resolved_at: new Date(),
          created_at: new Date(Date.now() - 3600000) // 1 hour ago
        }
      ];

      await prisma.healthAlert.createMany({
        data: sampleAlerts,
        skipDuplicates: true
      });

      // Verify final count
      const finalConfigCount = await prisma.healthCheckConfig.count();
      const finalMetricsCount = await prisma.healthMetrics.count();
      const finalAlertsCount = await prisma.healthAlert.count();

      return {
        success: true,
        message: `Successfully created health check system with ${finalConfigCount} configurations, ${finalMetricsCount} metrics record, and ${finalAlertsCount} sample alerts`,
        count: finalConfigCount + finalMetricsCount + finalAlertsCount
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to seed health check configurations: ${error.message}`,
        errors: [error.message]
      };
    }
  }
};
