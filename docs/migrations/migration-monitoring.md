---
title: Migration Monitoring
category: migrations
subcategory: migration-monitoring
tags: [migration-monitoring, monitoring, observability, metrics, alerts]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Monitoring Team", "DevOps Team", "Backend Team"]
---

# Migration Monitoring

## Summary

Comprehensive guide to monitoring migrations in the Axisor platform. This document covers strategies for monitoring database migrations, code migrations, deployment migrations, and feature migrations, ensuring system stability and data integrity during migration processes.

## Migration Monitoring Strategy

### 1. Monitoring Types

**Database Migration Monitoring**
- Schema migration monitoring
- Data migration monitoring
- Performance monitoring
- Data integrity monitoring
- Rollback monitoring

**Code Migration Monitoring**
- API migration monitoring
- Frontend migration monitoring
- Performance monitoring
- Error monitoring
- User experience monitoring

**Deployment Migration Monitoring**
- Blue-green deployment monitoring
- Canary deployment monitoring
- Traffic monitoring
- Performance monitoring
- Error monitoring

**Feature Migration Monitoring**
- Feature flag monitoring
- A/B testing monitoring
- User behavior monitoring
- Performance monitoring
- Conversion monitoring

### 2. Monitoring Workflow

**Pre-Migration Monitoring**
1. Baseline metrics collection
2. System health validation
3. Resource availability check
4. Alert configuration
5. Monitoring setup

**Migration Monitoring**
1. Real-time metrics collection
2. Performance monitoring
3. Error tracking
4. Data integrity validation
5. Alert management

**Post-Migration Monitoring**
1. System health validation
2. Performance comparison
3. Data integrity verification
4. User experience monitoring
5. Long-term monitoring

## Database Migration Monitoring

### 1. Schema Migration Monitoring

**Schema Migration Metrics**
```typescript
// src/services/migration-monitoring.service.ts
import { PrismaClient } from '@prisma/client';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';

export class SchemaMigrationMonitoringService {
  private prisma: PrismaClient;
  private metricsService: MetricsService;
  private alertService: AlertService;

  constructor(prisma: PrismaClient, metricsService: MetricsService, alertService: AlertService) {
    this.prisma = prisma;
    this.metricsService = metricsService;
    this.alertService = alertService;
  }

  async monitorSchemaMigration(migrationName: string): Promise<void> {
    const startTime = Date.now();
    let migrationStatus = 'RUNNING';

    try {
      // Start migration
      await this.startMigration(migrationName);

      // Monitor migration progress
      const progress = await this.getMigrationProgress(migrationName);
      this.metricsService.recordGauge('migration.progress', progress, {
        migration: migrationName,
        type: 'schema'
      });

      // Monitor database locks
      const locks = await this.getDatabaseLocks();
      this.metricsService.recordGauge('migration.database_locks', locks, {
        migration: migrationName,
        type: 'schema'
      });

      // Monitor table sizes
      const tableSizes = await this.getTableSizes();
      this.metricsService.recordGauge('migration.table_sizes', tableSizes, {
        migration: migrationName,
        type: 'schema'
      });

      // Monitor index usage
      const indexUsage = await this.getIndexUsage();
      this.metricsService.recordGauge('migration.index_usage', indexUsage, {
        migration: migrationName,
        type: 'schema'
      });

      // Check for errors
      const errors = await this.getMigrationErrors(migrationName);
      if (errors.length > 0) {
        this.metricsService.recordCounter('migration.errors', errors.length, {
          migration: migrationName,
          type: 'schema'
        });

        await this.alertService.sendAlert({
          type: 'MIGRATION_ERROR',
          severity: 'HIGH',
          message: `Schema migration ${migrationName} has errors: ${errors.join(', ')}`,
          metadata: {
            migration: migrationName,
            errors: errors
          }
        });
      }

      // Complete migration
      await this.completeMigration(migrationName);
      migrationStatus = 'COMPLETED';

    } catch (error) {
      migrationStatus = 'FAILED';
      this.metricsService.recordCounter('migration.failures', 1, {
        migration: migrationName,
        type: 'schema'
      });

      await this.alertService.sendAlert({
        type: 'MIGRATION_FAILURE',
        severity: 'CRITICAL',
        message: `Schema migration ${migrationName} failed: ${error.message}`,
        metadata: {
          migration: migrationName,
          error: error.message
        }
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram('migration.duration', duration, {
        migration: migrationName,
        type: 'schema',
        status: migrationStatus
      });

      this.metricsService.recordCounter('migration.completions', 1, {
        migration: migrationName,
        type: 'schema',
        status: migrationStatus
      });
    }
  }

  private async getMigrationProgress(migrationName: string): Promise<number> {
    // Get migration progress from database
    const result = await this.prisma.$queryRaw`
      SELECT progress 
      FROM migration_progress 
      WHERE migration_name = ${migrationName}
    `;

    return result[0]?.progress || 0;
  }

  private async getDatabaseLocks(): Promise<number> {
    // Get database lock count
    const result = await this.prisma.$queryRaw`
      SELECT COUNT(*) as lock_count
      FROM pg_locks
      WHERE granted = false
    `;

    return result[0]?.lock_count || 0;
  }

  private async getTableSizes(): Promise<number> {
    // Get total table size
    const result = await this.prisma.$queryRaw`
      SELECT SUM(pg_total_relation_size(oid)) as total_size
      FROM pg_class
      WHERE relkind = 'r'
    `;

    return result[0]?.total_size || 0;
  }

  private async getIndexUsage(): Promise<number> {
    // Get index usage count
    const result = await this.prisma.$queryRaw`
      SELECT COUNT(*) as index_count
      FROM pg_stat_user_indexes
      WHERE idx_scan > 0
    `;

    return result[0]?.index_count || 0;
  }

  private async getMigrationErrors(migrationName: string): Promise<string[]> {
    // Get migration errors
    const result = await this.prisma.$queryRaw`
      SELECT error_message
      FROM migration_errors
      WHERE migration_name = ${migrationName}
    `;

    return result.map((r: any) => r.error_message);
  }
}
```

### 2. Data Migration Monitoring

**Data Migration Metrics**
```typescript
// src/services/data-migration-monitoring.service.ts
import { PrismaClient } from '@prisma/client';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';

export class DataMigrationMonitoringService {
  private prisma: PrismaClient;
  private metricsService: MetricsService;
  private alertService: AlertService;

  constructor(prisma: PrismaClient, metricsService: MetricsService, alertService: AlertService) {
    this.prisma = prisma;
    this.metricsService = metricsService;
    this.alertService = alertService;
  }

  async monitorDataMigration(migrationName: string): Promise<void> {
    const startTime = Date.now();
    let migrationStatus = 'RUNNING';

    try {
      // Start migration
      await this.startMigration(migrationName);

      // Monitor migration progress
      const progress = await this.getMigrationProgress(migrationName);
      this.metricsService.recordGauge('migration.progress', progress, {
        migration: migrationName,
        type: 'data'
      });

      // Monitor data integrity
      const integrity = await this.validateDataIntegrity(migrationName);
      this.metricsService.recordGauge('migration.data_integrity', integrity, {
        migration: migrationName,
        type: 'data'
      });

      // Monitor record counts
      const recordCounts = await this.getRecordCounts(migrationName);
      this.metricsService.recordGauge('migration.record_counts', recordCounts, {
        migration: migrationName,
        type: 'data'
      });

      // Monitor data quality
      const dataQuality = await this.getDataQuality(migrationName);
      this.metricsService.recordGauge('migration.data_quality', dataQuality, {
        migration: migrationName,
        type: 'data'
      });

      // Check for errors
      const errors = await this.getMigrationErrors(migrationName);
      if (errors.length > 0) {
        this.metricsService.recordCounter('migration.errors', errors.length, {
          migration: migrationName,
          type: 'data'
        });

        await this.alertService.sendAlert({
          type: 'MIGRATION_ERROR',
          severity: 'HIGH',
          message: `Data migration ${migrationName} has errors: ${errors.join(', ')}`,
          metadata: {
            migration: migrationName,
            errors: errors
          }
        });
      }

      // Complete migration
      await this.completeMigration(migrationName);
      migrationStatus = 'COMPLETED';

    } catch (error) {
      migrationStatus = 'FAILED';
      this.metricsService.recordCounter('migration.failures', 1, {
        migration: migrationName,
        type: 'data'
      });

      await this.alertService.sendAlert({
        type: 'MIGRATION_FAILURE',
        severity: 'CRITICAL',
        message: `Data migration ${migrationName} failed: ${error.message}`,
        metadata: {
          migration: migrationName,
          error: error.message
        }
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram('migration.duration', duration, {
        migration: migrationName,
        type: 'data',
        status: migrationStatus
      });

      this.metricsService.recordCounter('migration.completions', 1, {
        migration: migrationName,
        type: 'data',
        status: migrationStatus
      });
    }
  }

  private async validateDataIntegrity(migrationName: string): Promise<number> {
    // Validate data integrity
    const result = await this.prisma.$queryRaw`
      SELECT COUNT(*) as integrity_count
      FROM data_integrity_checks
      WHERE migration_name = ${migrationName}
      AND status = 'PASSED'
    `;

    return result[0]?.integrity_count || 0;
  }

  private async getRecordCounts(migrationName: string): Promise<number> {
    // Get record count for migration
    const result = await this.prisma.$queryRaw`
      SELECT COUNT(*) as record_count
      FROM migration_records
      WHERE migration_name = ${migrationName}
    `;

    return result[0]?.record_count || 0;
  }

  private async getDataQuality(migrationName: string): Promise<number> {
    // Get data quality score
    const result = await this.prisma.$queryRaw`
      SELECT AVG(quality_score) as avg_quality
      FROM data_quality_metrics
      WHERE migration_name = ${migrationName}
    `;

    return result[0]?.avg_quality || 0;
  }
}
```

## Code Migration Monitoring

### 1. API Migration Monitoring

**API Migration Metrics**
```typescript
// src/services/api-migration-monitoring.service.ts
import { FastifyInstance } from 'fastify';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';

export class ApiMigrationMonitoringService {
  private app: FastifyInstance;
  private metricsService: MetricsService;
  private alertService: AlertService;

  constructor(app: FastifyInstance, metricsService: MetricsService, alertService: AlertService) {
    this.app = app;
    this.metricsService = metricsService;
    this.alertService = alertService;
  }

  async monitorApiMigration(migrationName: string): Promise<void> {
    const startTime = Date.now();
    let migrationStatus = 'RUNNING';

    try {
      // Start migration
      await this.startMigration(migrationName);

      // Monitor API performance
      const performance = await this.getApiPerformance();
      this.metricsService.recordGauge('migration.api_performance', performance, {
        migration: migrationName,
        type: 'api'
      });

      // Monitor API errors
      const errors = await this.getApiErrors();
      this.metricsService.recordCounter('migration.api_errors', errors, {
        migration: migrationName,
        type: 'api'
      });

      // Monitor API response times
      const responseTimes = await this.getApiResponseTimes();
      this.metricsService.recordHistogram('migration.api_response_times', responseTimes, {
        migration: migrationName,
        type: 'api'
      });

      // Monitor API throughput
      const throughput = await this.getApiThroughput();
      this.metricsService.recordGauge('migration.api_throughput', throughput, {
        migration: migrationName,
        type: 'api'
      });

      // Check for errors
      if (errors > 0) {
        await this.alertService.sendAlert({
          type: 'MIGRATION_ERROR',
          severity: 'HIGH',
          message: `API migration ${migrationName} has ${errors} errors`,
          metadata: {
            migration: migrationName,
            errorCount: errors
          }
        });
      }

      // Complete migration
      await this.completeMigration(migrationName);
      migrationStatus = 'COMPLETED';

    } catch (error) {
      migrationStatus = 'FAILED';
      this.metricsService.recordCounter('migration.failures', 1, {
        migration: migrationName,
        type: 'api'
      });

      await this.alertService.sendAlert({
        type: 'MIGRATION_FAILURE',
        severity: 'CRITICAL',
        message: `API migration ${migrationName} failed: ${error.message}`,
        metadata: {
          migration: migrationName,
          error: error.message
        }
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram('migration.duration', duration, {
        migration: migrationName,
        type: 'api',
        status: migrationStatus
      });

      this.metricsService.recordCounter('migration.completions', 1, {
        migration: migrationName,
        type: 'api',
        status: migrationStatus
      });
    }
  }

  private async getApiPerformance(): Promise<number> {
    // Get API performance metrics
    const result = await this.app.inject({
      method: 'GET',
      url: '/api/metrics/performance'
    });

    return result.json().performance || 0;
  }

  private async getApiErrors(): Promise<number> {
    // Get API error count
    const result = await this.app.inject({
      method: 'GET',
      url: '/api/metrics/errors'
    });

    return result.json().errorCount || 0;
  }

  private async getApiResponseTimes(): Promise<number> {
    // Get API response times
    const result = await this.app.inject({
      method: 'GET',
      url: '/api/metrics/response-times'
    });

    return result.json().avgResponseTime || 0;
  }

  private async getApiThroughput(): Promise<number> {
    // Get API throughput
    const result = await this.app.inject({
      method: 'GET',
      url: '/api/metrics/throughput'
    });

    return result.json().throughput || 0;
  }
}
```

### 2. Frontend Migration Monitoring

**Frontend Migration Metrics**
```typescript
// src/services/frontend-migration-monitoring.service.ts
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';

export class FrontendMigrationMonitoringService {
  private metricsService: MetricsService;
  private alertService: AlertService;

  constructor(metricsService: MetricsService, alertService: AlertService) {
    this.metricsService = metricsService;
    this.alertService = alertService;
  }

  async monitorFrontendMigration(migrationName: string): Promise<void> {
    const startTime = Date.now();
    let migrationStatus = 'RUNNING';

    try {
      // Start migration
      await this.startMigration(migrationName);

      // Monitor frontend performance
      const performance = await this.getFrontendPerformance();
      this.metricsService.recordGauge('migration.frontend_performance', performance, {
        migration: migrationName,
        type: 'frontend'
      });

      // Monitor frontend errors
      const errors = await this.getFrontendErrors();
      this.metricsService.recordCounter('migration.frontend_errors', errors, {
        migration: migrationName,
        type: 'frontend'
      });

      // Monitor user experience
      const userExperience = await this.getUserExperience();
      this.metricsService.recordGauge('migration.user_experience', userExperience, {
        migration: migrationName,
        type: 'frontend'
      });

      // Monitor page load times
      const pageLoadTimes = await this.getPageLoadTimes();
      this.metricsService.recordHistogram('migration.page_load_times', pageLoadTimes, {
        migration: migrationName,
        type: 'frontend'
      });

      // Check for errors
      if (errors > 0) {
        await this.alertService.sendAlert({
          type: 'MIGRATION_ERROR',
          severity: 'HIGH',
          message: `Frontend migration ${migrationName} has ${errors} errors`,
          metadata: {
            migration: migrationName,
            errorCount: errors
          }
        });
      }

      // Complete migration
      await this.completeMigration(migrationName);
      migrationStatus = 'COMPLETED';

    } catch (error) {
      migrationStatus = 'FAILED';
      this.metricsService.recordCounter('migration.failures', 1, {
        migration: migrationName,
        type: 'frontend'
      });

      await this.alertService.sendAlert({
        type: 'MIGRATION_FAILURE',
        severity: 'CRITICAL',
        message: `Frontend migration ${migrationName} failed: ${error.message}`,
        metadata: {
          migration: migrationName,
          error: error.message
        }
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram('migration.duration', duration, {
        migration: migrationName,
        type: 'frontend',
        status: migrationStatus
      });

      this.metricsService.recordCounter('migration.completions', 1, {
        migration: migrationName,
        type: 'frontend',
        status: migrationStatus
      });
    }
  }

  private async getFrontendPerformance(): Promise<number> {
    // Get frontend performance metrics
    const performance = await this.getPerformanceMetrics();
    return performance.score || 0;
  }

  private async getFrontendErrors(): Promise<number> {
    // Get frontend error count
    const errors = await this.getErrorMetrics();
    return errors.count || 0;
  }

  private async getUserExperience(): Promise<number> {
    // Get user experience score
    const ux = await this.getUserExperienceMetrics();
    return ux.score || 0;
  }

  private async getPageLoadTimes(): Promise<number> {
    // Get page load times
    const loadTimes = await this.getPageLoadMetrics();
    return loadTimes.avgLoadTime || 0;
  }
}
```

## Deployment Migration Monitoring

### 1. Blue-Green Deployment Monitoring

**Blue-Green Deployment Metrics**
```typescript
// src/services/blue-green-monitoring.service.ts
import { KubernetesClient } from './kubernetes-client.service';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';

export class BlueGreenDeploymentMonitoringService {
  private k8sClient: KubernetesClient;
  private metricsService: MetricsService;
  private alertService: AlertService;

  constructor(k8sClient: KubernetesClient, metricsService: MetricsService, alertService: AlertService) {
    this.k8sClient = k8sClient;
    this.metricsService = metricsService;
    this.alertService = alertService;
  }

  async monitorBlueGreenDeployment(deploymentName: string): Promise<void> {
    const startTime = Date.now();
    let deploymentStatus = 'RUNNING';

    try {
      // Start deployment
      await this.startDeployment(deploymentName);

      // Monitor deployment status
      const status = await this.getDeploymentStatus(deploymentName);
      this.metricsService.recordGauge('migration.deployment_status', status, {
        deployment: deploymentName,
        type: 'blue-green'
      });

      // Monitor traffic distribution
      const trafficDistribution = await this.getTrafficDistribution(deploymentName);
      this.metricsService.recordGauge('migration.traffic_distribution', trafficDistribution, {
        deployment: deploymentName,
        type: 'blue-green'
      });

      // Monitor pod health
      const podHealth = await this.getPodHealth(deploymentName);
      this.metricsService.recordGauge('migration.pod_health', podHealth, {
        deployment: deploymentName,
        type: 'blue-green'
      });

      // Monitor service health
      const serviceHealth = await this.getServiceHealth(deploymentName);
      this.metricsService.recordGauge('migration.service_health', serviceHealth, {
        deployment: deploymentName,
        type: 'blue-green'
      });

      // Check for errors
      const errors = await this.getDeploymentErrors(deploymentName);
      if (errors.length > 0) {
        this.metricsService.recordCounter('migration.deployment_errors', errors.length, {
          deployment: deploymentName,
          type: 'blue-green'
        });

        await this.alertService.sendAlert({
          type: 'MIGRATION_ERROR',
          severity: 'HIGH',
          message: `Blue-green deployment ${deploymentName} has errors: ${errors.join(', ')}`,
          metadata: {
            deployment: deploymentName,
            errors: errors
          }
        });
      }

      // Complete deployment
      await this.completeDeployment(deploymentName);
      deploymentStatus = 'COMPLETED';

    } catch (error) {
      deploymentStatus = 'FAILED';
      this.metricsService.recordCounter('migration.failures', 1, {
        deployment: deploymentName,
        type: 'blue-green'
      });

      await this.alertService.sendAlert({
        type: 'MIGRATION_FAILURE',
        severity: 'CRITICAL',
        message: `Blue-green deployment ${deploymentName} failed: ${error.message}`,
        metadata: {
          deployment: deploymentName,
          error: error.message
        }
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram('migration.duration', duration, {
        deployment: deploymentName,
        type: 'blue-green',
        status: deploymentStatus
      });

      this.metricsService.recordCounter('migration.completions', 1, {
        deployment: deploymentName,
        type: 'blue-green',
        status: deploymentStatus
      });
    }
  }

  private async getDeploymentStatus(deploymentName: string): Promise<number> {
    // Get deployment status
    const deployment = await this.k8sClient.getDeployment(deploymentName);
    return deployment.status === 'READY' ? 1 : 0;
  }

  private async getTrafficDistribution(deploymentName: string): Promise<number> {
    // Get traffic distribution
    const traffic = await this.k8sClient.getTrafficDistribution(deploymentName);
    return traffic.currentColor === 'blue' ? 0 : 1;
  }

  private async getPodHealth(deploymentName: string): Promise<number> {
    // Get pod health
    const pods = await this.k8sClient.getPods(deploymentName);
    const healthyPods = pods.filter(pod => pod.status === 'RUNNING');
    return healthyPods.length / pods.length;
  }

  private async getServiceHealth(deploymentName: string): Promise<number> {
    // Get service health
    const service = await this.k8sClient.getService(deploymentName);
    return service.status === 'HEALTHY' ? 1 : 0;
  }

  private async getDeploymentErrors(deploymentName: string): Promise<string[]> {
    // Get deployment errors
    const events = await this.k8sClient.getEvents(deploymentName);
    return events.filter(event => event.type === 'ERROR').map(event => event.message);
  }
}
```

### 2. Canary Deployment Monitoring

**Canary Deployment Metrics**
```typescript
// src/services/canary-monitoring.service.ts
import { KubernetesClient } from './kubernetes-client.service';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';

export class CanaryDeploymentMonitoringService {
  private k8sClient: KubernetesClient;
  private metricsService: MetricsService;
  private alertService: AlertService;

  constructor(k8sClient: KubernetesClient, metricsService: MetricsService, alertService: AlertService) {
    this.k8sClient = k8sClient;
    this.metricsService = metricsService;
    this.alertService = alertService;
  }

  async monitorCanaryDeployment(deploymentName: string): Promise<void> {
    const startTime = Date.now();
    let deploymentStatus = 'RUNNING';

    try {
      // Start deployment
      await this.startDeployment(deploymentName);

      // Monitor canary status
      const status = await this.getCanaryStatus(deploymentName);
      this.metricsService.recordGauge('migration.canary_status', status, {
        deployment: deploymentName,
        type: 'canary'
      });

      // Monitor traffic percentage
      const trafficPercentage = await this.getTrafficPercentage(deploymentName);
      this.metricsService.recordGauge('migration.traffic_percentage', trafficPercentage, {
        deployment: deploymentName,
        type: 'canary'
      });

      // Monitor error rates
      const errorRate = await this.getErrorRate(deploymentName);
      this.metricsService.recordGauge('migration.error_rate', errorRate, {
        deployment: deploymentName,
        type: 'canary'
      });

      // Monitor response times
      const responseTime = await this.getResponseTime(deploymentName);
      this.metricsService.recordHistogram('migration.response_time', responseTime, {
        deployment: deploymentName,
        type: 'canary'
      });

      // Check for errors
      if (errorRate > 0.05) { // 5% error rate threshold
        await this.alertService.sendAlert({
          type: 'MIGRATION_ERROR',
          severity: 'HIGH',
          message: `Canary deployment ${deploymentName} has high error rate: ${errorRate}`,
          metadata: {
            deployment: deploymentName,
            errorRate: errorRate
          }
        });
      }

      // Complete deployment
      await this.completeDeployment(deploymentName);
      deploymentStatus = 'COMPLETED';

    } catch (error) {
      deploymentStatus = 'FAILED';
      this.metricsService.recordCounter('migration.failures', 1, {
        deployment: deploymentName,
        type: 'canary'
      });

      await this.alertService.sendAlert({
        type: 'MIGRATION_FAILURE',
        severity: 'CRITICAL',
        message: `Canary deployment ${deploymentName} failed: ${error.message}`,
        metadata: {
          deployment: deploymentName,
          error: error.message
        }
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram('migration.duration', duration, {
        deployment: deploymentName,
        type: 'canary',
        status: deploymentStatus
      });

      this.metricsService.recordCounter('migration.completions', 1, {
        deployment: deploymentName,
        type: 'canary',
        status: deploymentStatus
      });
    }
  }

  private async getCanaryStatus(deploymentName: string): Promise<number> {
    // Get canary status
    const canary = await this.k8sClient.getCanaryDeployment(deploymentName);
    return canary.status === 'RUNNING' ? 1 : 0;
  }

  private async getTrafficPercentage(deploymentName: string): Promise<number> {
    // Get traffic percentage
    const canary = await this.k8sClient.getCanaryDeployment(deploymentName);
    return canary.trafficPercentage || 0;
  }

  private async getErrorRate(deploymentName: string): Promise<number> {
    // Get error rate
    const metrics = await this.k8sClient.getCanaryMetrics(deploymentName);
    return metrics.errorRate || 0;
  }

  private async getResponseTime(deploymentName: string): Promise<number> {
    // Get response time
    const metrics = await this.k8sClient.getCanaryMetrics(deploymentName);
    return metrics.avgResponseTime || 0;
  }
}
```

## Feature Migration Monitoring

### 1. Feature Flag Monitoring

**Feature Flag Metrics**
```typescript
// src/services/feature-flag-monitoring.service.ts
import { FeatureFlagService } from './feature-flag.service';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';

export class FeatureFlagMonitoringService {
  private featureFlagService: FeatureFlagService;
  private metricsService: MetricsService;
  private alertService: AlertService;

  constructor(featureFlagService: FeatureFlagService, metricsService: MetricsService, alertService: AlertService) {
    this.featureFlagService = featureFlagService;
    this.metricsService = metricsService;
    this.alertService = alertService;
  }

  async monitorFeatureFlag(flagName: string): Promise<void> {
    const startTime = Date.now();
    let flagStatus = 'RUNNING';

    try {
      // Start monitoring
      await this.startMonitoring(flagName);

      // Monitor flag usage
      const usage = await this.getFlagUsage(flagName);
      this.metricsService.recordGauge('migration.feature_flag_usage', usage, {
        flag: flagName,
        type: 'feature-flag'
      });

      // Monitor flag performance
      const performance = await this.getFlagPerformance(flagName);
      this.metricsService.recordGauge('migration.feature_flag_performance', performance, {
        flag: flagName,
        type: 'feature-flag'
      });

      // Monitor flag errors
      const errors = await this.getFlagErrors(flagName);
      this.metricsService.recordCounter('migration.feature_flag_errors', errors, {
        flag: flagName,
        type: 'feature-flag'
      });

      // Monitor user impact
      const userImpact = await this.getUserImpact(flagName);
      this.metricsService.recordGauge('migration.user_impact', userImpact, {
        flag: flagName,
        type: 'feature-flag'
      });

      // Check for errors
      if (errors > 0) {
        await this.alertService.sendAlert({
          type: 'MIGRATION_ERROR',
          severity: 'HIGH',
          message: `Feature flag ${flagName} has ${errors} errors`,
          metadata: {
            flag: flagName,
            errorCount: errors
          }
        });
      }

      // Complete monitoring
      await this.completeMonitoring(flagName);
      flagStatus = 'COMPLETED';

    } catch (error) {
      flagStatus = 'FAILED';
      this.metricsService.recordCounter('migration.failures', 1, {
        flag: flagName,
        type: 'feature-flag'
      });

      await this.alertService.sendAlert({
        type: 'MIGRATION_FAILURE',
        severity: 'CRITICAL',
        message: `Feature flag monitoring ${flagName} failed: ${error.message}`,
        metadata: {
          flag: flagName,
          error: error.message
        }
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram('migration.duration', duration, {
        flag: flagName,
        type: 'feature-flag',
        status: flagStatus
      });

      this.metricsService.recordCounter('migration.completions', 1, {
        flag: flagName,
        type: 'feature-flag',
        status: flagStatus
      });
    }
  }

  private async getFlagUsage(flagName: string): Promise<number> {
    // Get flag usage count
    const usage = await this.featureFlagService.getFlagUsage(flagName);
    return usage.count || 0;
  }

  private async getFlagPerformance(flagName: string): Promise<number> {
    // Get flag performance score
    const performance = await this.featureFlagService.getFlagPerformance(flagName);
    return performance.score || 0;
  }

  private async getFlagErrors(flagName: string): Promise<number> {
    // Get flag error count
    const errors = await this.featureFlagService.getFlagErrors(flagName);
    return errors.count || 0;
  }

  private async getUserImpact(flagName: string): Promise<number> {
    // Get user impact score
    const impact = await this.featureFlagService.getUserImpact(flagName);
    return impact.score || 0;
  }
}
```

### 2. A/B Testing Monitoring

**A/B Testing Metrics**
```typescript
// src/services/ab-testing-monitoring.service.ts
import { ABTestingService } from './ab-testing.service';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';

export class ABTestingMonitoringService {
  private abTestingService: ABTestingService;
  private metricsService: MetricsService;
  private alertService: AlertService;

  constructor(abTestingService: ABTestingService, metricsService: MetricsService, alertService: AlertService) {
    this.abTestingService = abTestingService;
    this.metricsService = metricsService;
    this.alertService = alertService;
  }

  async monitorABTest(testName: string): Promise<void> {
    const startTime = Date.now();
    let testStatus = 'RUNNING';

    try {
      // Start monitoring
      await this.startMonitoring(testName);

      // Monitor test performance
      const performance = await this.getTestPerformance(testName);
      this.metricsService.recordGauge('migration.ab_test_performance', performance, {
        test: testName,
        type: 'ab-testing'
      });

      // Monitor conversion rates
      const conversionRate = await this.getConversionRate(testName);
      this.metricsService.recordGauge('migration.conversion_rate', conversionRate, {
        test: testName,
        type: 'ab-testing'
      });

      // Monitor user engagement
      const engagement = await this.getUserEngagement(testName);
      this.metricsService.recordGauge('migration.user_engagement', engagement, {
        test: testName,
        type: 'ab-testing'
      });

      // Monitor test results
      const results = await this.getTestResults(testName);
      this.metricsService.recordGauge('migration.test_results', results, {
        test: testName,
        type: 'ab-testing'
      });

      // Check for errors
      const errors = await this.getTestErrors(testName);
      if (errors > 0) {
        this.metricsService.recordCounter('migration.ab_test_errors', errors, {
          test: testName,
          type: 'ab-testing'
        });

        await this.alertService.sendAlert({
          type: 'MIGRATION_ERROR',
          severity: 'HIGH',
          message: `A/B test ${testName} has ${errors} errors`,
          metadata: {
            test: testName,
            errorCount: errors
          }
        });
      }

      // Complete monitoring
      await this.completeMonitoring(testName);
      testStatus = 'COMPLETED';

    } catch (error) {
      testStatus = 'FAILED';
      this.metricsService.recordCounter('migration.failures', 1, {
        test: testName,
        type: 'ab-testing'
      });

      await this.alertService.sendAlert({
        type: 'MIGRATION_FAILURE',
        severity: 'CRITICAL',
        message: `A/B test monitoring ${testName} failed: ${error.message}`,
        metadata: {
          test: testName,
          error: error.message
        }
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram('migration.duration', duration, {
        test: testName,
        type: 'ab-testing',
        status: testStatus
      });

      this.metricsService.recordCounter('migration.completions', 1, {
        test: testName,
        type: 'ab-testing',
        status: testStatus
      });
    }
  }

  private async getTestPerformance(testName: string): Promise<number> {
    // Get test performance score
    const performance = await this.abTestingService.getTestPerformance(testName);
    return performance.score || 0;
  }

  private async getConversionRate(testName: string): Promise<number> {
    // Get conversion rate
    const results = await this.abTestingService.getTestResults(testName);
    return results.conversionRate || 0;
  }

  private async getUserEngagement(testName: string): Promise<number> {
    // Get user engagement score
    const engagement = await this.abTestingService.getUserEngagement(testName);
    return engagement.score || 0;
  }

  private async getTestResults(testName: string): Promise<number> {
    // Get test results score
    const results = await this.abTestingService.getTestResults(testName);
    return results.score || 0;
  }

  private async getTestErrors(testName: string): Promise<number> {
    // Get test error count
    const errors = await this.abTestingService.getTestErrors(testName);
    return errors.count || 0;
  }
}
```

## Checklist

### Pre-Migration Monitoring
- [ ] Baseline metrics collection
- [ ] System health validation
- [ ] Resource availability check
- [ ] Alert configuration
- [ ] Monitoring setup
- [ ] Performance baseline
- [ ] Error baseline
- [ ] User experience baseline

### Migration Monitoring
- [ ] Real-time metrics collection
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Data integrity validation
- [ ] Alert management
- [ ] Resource monitoring
- [ ] User experience monitoring
- [ ] System health monitoring

### Post-Migration Monitoring
- [ ] System health validation
- [ ] Performance comparison
- [ ] Data integrity verification
- [ ] User experience monitoring
- [ ] Long-term monitoring
- [ ] Alert validation
- [ ] Metrics validation
- [ ] System stability validation
