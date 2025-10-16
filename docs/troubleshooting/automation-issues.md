---
title: Automation and Worker Issues
category: troubleshooting
subcategory: automation-issues
tags: [automation, workers, bullmq, margin-guard, trading, queue-management]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "Automation Team"]
---

# Automation and Worker Issues

## Summary

Comprehensive guide to troubleshooting automation and worker-related issues in the Axisor platform. This document covers BullMQ worker problems, automation execution failures, Margin Guard issues, queue management problems, and trading automation troubleshooting.

## BullMQ Worker Issues

### 1. Worker Process Failures

**Symptoms:**
- Workers not processing jobs
- Jobs stuck in queue
- Worker process crashes
- Memory usage spikes
- Queue backlog accumulation

**Root Causes:**
- Redis connection issues
- Worker memory leaks
- Job timeout problems
- Queue configuration errors
- Resource constraints

**Solutions:**

```bash
# 1. Check worker status
kubectl get pods -n axisor -l app=automation-worker
kubectl describe pod <worker-pod> -n axisor

# 2. View worker logs
kubectl logs -n axisor <worker-pod> --tail=100 -f

# 3. Check Redis connectivity
kubectl exec -n axisor <worker-pod> -- redis-cli ping

# 4. Check queue status
kubectl exec -n axisor <worker-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('automation-execute', { 
  connection: new redis(process.env.REDIS_URL) 
});
queue.getWaiting().then(jobs => console.log('Waiting jobs:', jobs.length));
queue.getActive().then(jobs => console.log('Active jobs:', jobs.length));
queue.getFailed().then(jobs => console.log('Failed jobs:', jobs.length));
"

# 5. Check worker memory usage
kubectl exec -n axisor <worker-pod> -- ps aux | grep node

# 6. Restart worker
kubectl delete pod <worker-pod> -n axisor

# 7. Check worker configuration
kubectl exec -n axisor <worker-pod> -- cat /app/src/workers/automation-worker.ts | grep -A 10 "concurrency"
```

**Worker Health Monitoring**
```typescript
// Worker health check implementation
export class WorkerHealthMonitor {
  private workers: Map<string, Worker> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  
  async checkWorkerHealth(workerId: string): Promise<WorkerHealth> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return {
        status: 'UNKNOWN',
        message: 'Worker not found',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Check Redis connection
      await worker.redis.ping();
      
      // Check job processing
      const activeJobs = await worker.getActive();
      const waitingJobs = await worker.getWaiting();
      const failedJobs = await worker.getFailed();
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      
      // Check last job completion
      const lastCompleted = await worker.getCompleted();
      const lastJobTime = lastCompleted.length > 0 ? 
        lastCompleted[0].processedOn : null;
      
      return {
        status: 'HEALTHY',
        message: 'Worker is functioning normally',
        timestamp: new Date().toISOString(),
        metrics: {
          activeJobs: activeJobs.length,
          waitingJobs: waitingJobs.length,
          failedJobs: failedJobs.length,
          memoryUsage: memoryUsage.heapUsed,
          lastJobTime: lastJobTime
        }
      };
    } catch (error) {
      return {
        status: 'UNHEALTHY',
        message: `Worker health check failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
  
  async restartWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (worker) {
      await worker.close();
      this.workers.delete(workerId);
      
      // Restart worker
      const newWorker = new Worker('automation-execute', this.processJob, {
        connection: this.redis,
        concurrency: 5
      });
      
      this.workers.set(workerId, newWorker);
    }
  }
}
```

### 2. Queue Management Issues

**Symptoms:**
- Jobs not being processed
- Queue backlog growing
- Jobs failing repeatedly
- Queue memory issues
- Job duplication

**Root Causes:**
- Worker capacity exceeded
- Job processing errors
- Queue configuration problems
- Redis memory issues
- Job retry logic issues

**Solutions:**

```bash
# 1. Check queue statistics
kubectl exec -n axisor <worker-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('automation-execute', { 
  connection: new redis(process.env.REDIS_URL) 
});

async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed()
  ]);
  
  console.log('Queue Statistics:');
  console.log('Waiting:', waiting.length);
  console.log('Active:', active.length);
  console.log('Completed:', completed.length);
  console.log('Failed:', failed.length);
  console.log('Delayed:', delayed.length);
}

getQueueStats();
"

# 2. Check Redis memory usage
kubectl exec -n axisor <redis-pod> -- redis-cli info memory

# 3. Clean up old jobs
kubectl exec -n axisor <worker-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('automation-execute', { 
  connection: new redis(process.env.REDIS_URL) 
});

async function cleanupJobs() {
  // Clean completed jobs older than 1 day
  await queue.clean(24 * 60 * 60 * 1000, 'completed');
  
  // Clean failed jobs older than 7 days
  await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
  
  console.log('Queue cleanup completed');
}

cleanupJobs();
"

# 4. Check job processing errors
kubectl exec -n axisor <worker-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('automation-execute', { 
  connection: new redis(process.env.REDIS_URL) 
});

async function checkFailedJobs() {
  const failedJobs = await queue.getFailed();
  console.log('Failed jobs:', failedJobs.length);
  
  failedJobs.slice(0, 5).forEach(job => {
    console.log('Job ID:', job.id);
    console.log('Error:', job.failedReason);
    console.log('Data:', job.data);
    console.log('---');
  });
}

checkFailedJobs();
"

# 5. Pause and resume queue
kubectl exec -n axisor <worker-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('automation-execute', { 
  connection: new redis(process.env.REDIS_URL) 
});

async function pauseQueue() {
  await queue.pause();
  console.log('Queue paused');
}

async function resumeQueue() {
  await queue.resume();
  console.log('Queue resumed');
}
"
```

**Queue Optimization**
```typescript
// Queue optimization service
export class QueueOptimizationService {
  private queue: Queue;
  private redis: Redis;
  
  constructor(queue: Queue, redis: Redis) {
    this.queue = queue;
    this.redis = redis;
  }
  
  async optimizeQueue(): Promise<QueueOptimizationResult> {
    const result: QueueOptimizationResult = {
      actions: [],
      metrics: {},
      recommendations: []
    };
    
    try {
      // Get queue metrics
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.queue.getWaiting(),
        this.queue.getActive(),
        this.queue.getCompleted(),
        this.queue.getFailed(),
        this.queue.getDelayed()
      ]);
      
      result.metrics = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      };
      
      // Clean up old jobs
      if (completed.length > 1000) {
        await this.queue.clean(24 * 60 * 60 * 1000, 'completed');
        result.actions.push('Cleaned up old completed jobs');
      }
      
      if (failed.length > 100) {
        await this.queue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
        result.actions.push('Cleaned up old failed jobs');
      }
      
      // Check for stuck jobs
      const stuckJobs = active.filter(job => 
        Date.now() - job.processedOn > 300000 // 5 minutes
      );
      
      if (stuckJobs.length > 0) {
        for (const job of stuckJobs) {
          await job.moveToFailed(new Error('Job timeout'), true);
        }
        result.actions.push(`Moved ${stuckJobs.length} stuck jobs to failed`);
      }
      
      // Generate recommendations
      if (waiting.length > 100) {
        result.recommendations.push('Consider scaling up workers');
      }
      
      if (failed.length > 50) {
        result.recommendations.push('Investigate job failure patterns');
      }
      
      if (delayed.length > 1000) {
        result.recommendations.push('Review job scheduling logic');
      }
      
      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }
  
  async scaleWorkers(targetCount: number): Promise<void> {
    // This would typically be implemented with Kubernetes scaling
    console.log(`Scaling workers to ${targetCount} instances`);
  }
}
```

## Automation Execution Issues

### 1. Margin Guard Problems

**Symptoms:**
- Margin Guard not executing
- Incorrect margin calculations
- Automation not triggering
- Position management failures

**Root Causes:**
- LN Markets API issues
- Configuration errors
- Plan limitations
- Data synchronization problems

**Solutions:**

```bash
# 1. Check Margin Guard configuration
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.marginGuardConfig.findMany({
  include: { user: true }
}).then(configs => {
  console.log('Margin Guard configurations:', configs.length);
  configs.forEach(config => {
    console.log('User:', config.user.email);
    console.log('Enabled:', config.is_enabled);
    console.log('Threshold:', config.margin_threshold);
    console.log('Action:', config.action);
  });
});
"

# 2. Check automation status
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.automation.findMany({
  where: { type: 'margin_guard' },
  include: { user: true }
}).then(automations => {
  console.log('Margin Guard automations:', automations.length);
  automations.forEach(auto => {
    console.log('User:', auto.user.email);
    console.log('Active:', auto.is_active);
    console.log('Last executed:', auto.last_executed);
  });
});
"

# 3. Check LN Markets API connectivity
kubectl exec -n axisor <backend-pod> -- node -e "
const axios = require('axios');
axios.get('https://api.lnmarkets.com/v2/health')
  .then(response => console.log('LN Markets API status:', response.status))
  .catch(error => console.error('LN Markets API error:', error.message));
"

# 4. Check user positions
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.userExchangeAccount.findMany({
  where: { is_active: true },
  include: { user: true }
}).then(accounts => {
  console.log('Active exchange accounts:', accounts.length);
  accounts.forEach(account => {
    console.log('User:', account.user.email);
    console.log('Account ID:', account.id);
    console.log('Last sync:', account.last_sync);
  });
});
"

# 5. Test Margin Guard execution
kubectl exec -n axisor <worker-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('margin-guard-queue', { 
  connection: new redis(process.env.REDIS_URL) 
});

async function testMarginGuard() {
  const job = await queue.add('margin-guard-check', {
    userId: 'test-user-id',
    automationId: 'test-automation-id',
    config: {
      margin_threshold: 0.8,
      action: 'close_position'
    }
  }, {
    removeOnComplete: true,
    removeOnFail: true
  });
  
  console.log('Test job added:', job.id);
}

testMarginGuard();
"
```

**Margin Guard Debugging**
```typescript
// Margin Guard debugging service
export class MarginGuardDebugger {
  private prisma: PrismaClient;
  private lnMarketsAPI: LNMarketsAPIv2;
  
  constructor(prisma: PrismaClient, lnMarketsAPI: LNMarketsAPIv2) {
    this.prisma = prisma;
    this.lnMarketsAPI = lnMarketsAPI;
  }
  
  async debugMarginGuard(userId: string): Promise<MarginGuardDebugInfo> {
    const debugInfo: MarginGuardDebugInfo = {
      userId,
      timestamp: new Date().toISOString(),
      issues: [],
      recommendations: []
    };
    
    try {
      // Check user configuration
      const config = await this.prisma.marginGuardConfig.findUnique({
        where: { user_id: userId }
      });
      
      if (!config) {
        debugInfo.issues.push('No Margin Guard configuration found');
        debugInfo.recommendations.push('Create Margin Guard configuration');
        return debugInfo;
      }
      
      if (!config.is_enabled) {
        debugInfo.issues.push('Margin Guard is disabled');
        debugInfo.recommendations.push('Enable Margin Guard configuration');
      }
      
      // Check user exchange account
      const account = await this.prisma.userExchangeAccount.findFirst({
        where: { 
          user_id: userId,
          is_active: true
        }
      });
      
      if (!account) {
        debugInfo.issues.push('No active exchange account found');
        debugInfo.recommendations.push('Create and activate exchange account');
        return debugInfo;
      }
      
      // Check LN Markets API connectivity
      try {
        const positions = await this.lnMarketsAPI.futures.getPositions();
        debugInfo.apiConnectivity = 'OK';
        debugInfo.positions = positions.length;
      } catch (error) {
        debugInfo.issues.push(`LN Markets API error: ${error.message}`);
        debugInfo.apiConnectivity = 'ERROR';
      }
      
      // Check automation status
      const automation = await this.prisma.automation.findFirst({
        where: {
          user_id: userId,
          type: 'margin_guard'
        }
      });
      
      if (!automation) {
        debugInfo.issues.push('No Margin Guard automation found');
        debugInfo.recommendations.push('Create Margin Guard automation');
      } else if (!automation.is_active) {
        debugInfo.issues.push('Margin Guard automation is inactive');
        debugInfo.recommendations.push('Activate Margin Guard automation');
      }
      
      // Check plan limitations
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan_type: true }
      });
      
      if (user?.plan_type === 'free') {
        debugInfo.issues.push('Free plan has limited Margin Guard features');
        debugInfo.recommendations.push('Upgrade to Basic plan for full Margin Guard features');
      }
      
      return debugInfo;
    } catch (error) {
      debugInfo.issues.push(`Debug error: ${error.message}`);
      return debugInfo;
    }
  }
}
```

### 2. Trading Automation Issues

**Symptoms:**
- Trading orders not executing
- Incorrect order parameters
- Automation not triggering
- Position management failures

**Root Causes:**
- Exchange API issues
- Insufficient funds
- Market conditions
- Configuration errors

**Solutions:**

```bash
# 1. Check trading automation status
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.automation.findMany({
  where: { 
    type: { in: ['take_profit', 'stop_loss', 'auto_entry'] },
    is_active: true
  },
  include: { user: true }
}).then(automations => {
  console.log('Trading automations:', automations.length);
  automations.forEach(auto => {
    console.log('User:', auto.user.email);
    console.log('Type:', auto.type);
    console.log('Last executed:', auto.last_executed);
    console.log('Config:', auto.config);
  });
});
"

# 2. Check user balances
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.userExchangeAccount.findMany({
  where: { is_active: true },
  include: { user: true }
}).then(async accounts => {
  for (const account of accounts) {
    try {
      // This would typically call LN Markets API
      console.log('User:', account.user.email);
      console.log('Account ID:', account.id);
      console.log('Last balance check:', account.last_sync);
    } catch (error) {
      console.error('Balance check error:', error.message);
    }
  }
});
"

# 3. Check market data
kubectl exec -n axisor <backend-pod> -- node -e "
const axios = require('axios');
axios.get('https://api.lnmarkets.com/v2/futures/price')
  .then(response => {
    console.log('Market price:', response.data.price);
    console.log('Market status:', response.data.status);
  })
  .catch(error => console.error('Market data error:', error.message));
"

# 4. Check order history
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tradeLog.findMany({
  where: { 
    created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  },
  orderBy: { created_at: 'desc' },
  take: 10
}).then(trades => {
  console.log('Recent trades:', trades.length);
  trades.forEach(trade => {
    console.log('Symbol:', trade.symbol);
    console.log('Side:', trade.side);
    console.log('Amount:', trade.amount);
    console.log('Price:', trade.price);
    console.log('Status:', trade.status);
  });
});
"

# 5. Test trading automation
kubectl exec -n axisor <worker-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('automation-execute', { 
  connection: new redis(process.env.REDIS_URL) 
});

async function testTradingAutomation() {
  const job = await queue.add('trading-automation', {
    userId: 'test-user-id',
    automationId: 'test-automation-id',
    type: 'take_profit',
    config: {
      symbol: 'BTCUSD',
      trigger_price: 50000,
      amount: 0.001
    }
  }, {
    removeOnComplete: true,
    removeOnFail: true
  });
  
  console.log('Trading automation test job added:', job.id);
}

testTradingAutomation();
"
```

## Worker Pool Management

### 1. Worker Scaling Issues

**Symptoms:**
- Workers not scaling up
- Uneven job distribution
- Worker overload
- Resource contention

**Root Causes:**
- Scaling configuration errors
- Resource constraints
- Load balancer issues
- Worker health problems

**Solutions:**

```bash
# 1. Check worker scaling configuration
kubectl get hpa -n axisor
kubectl describe hpa axisor-automation-worker -n axisor

# 2. Check worker resource usage
kubectl top pods -n axisor -l app=automation-worker

# 3. Check worker distribution
kubectl get pods -n axisor -l app=automation-worker -o wide

# 4. Check worker health
kubectl exec -n axisor <worker-pod> -- curl http://localhost:3000/health

# 5. Manual scaling
kubectl scale deployment axisor-automation-worker --replicas=5 -n axisor

# 6. Check worker logs for errors
kubectl logs -n axisor <worker-pod> | grep -E "(ERROR|WARN|CRITICAL)"

# 7. Check worker configuration
kubectl describe deployment axisor-automation-worker -n axisor
```

**Worker Pool Optimization**
```typescript
// Worker pool optimization service
export class WorkerPoolOptimizer {
  private workers: Map<string, Worker> = new Map();
  private metrics: WorkerMetrics[] = [];
  
  async optimizeWorkerPool(): Promise<WorkerPoolOptimizationResult> {
    const result: WorkerPoolOptimizationResult = {
      currentWorkers: this.workers.size,
      recommendedWorkers: 0,
      actions: [],
      metrics: {}
    };
    
    try {
      // Collect worker metrics
      const workerMetrics = await this.collectWorkerMetrics();
      
      // Calculate queue load
      const queueLoad = await this.calculateQueueLoad();
      
      // Calculate worker utilization
      const workerUtilization = this.calculateWorkerUtilization(workerMetrics);
      
      // Determine optimal worker count
      const optimalWorkers = this.calculateOptimalWorkers(queueLoad, workerUtilization);
      
      result.recommendedWorkers = optimalWorkers;
      result.metrics = {
        queueLoad,
        workerUtilization,
        averageJobTime: this.calculateAverageJobTime(workerMetrics)
      };
      
      // Generate optimization actions
      if (optimalWorkers > this.workers.size) {
        result.actions.push(`Scale up workers to ${optimalWorkers}`);
      } else if (optimalWorkers < this.workers.size) {
        result.actions.push(`Scale down workers to ${optimalWorkers}`);
      }
      
      if (workerUtilization > 0.8) {
        result.actions.push('High worker utilization detected');
      }
      
      if (queueLoad > 100) {
        result.actions.push('High queue load detected');
      }
      
      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }
  
  private async collectWorkerMetrics(): Promise<WorkerMetrics[]> {
    const metrics: WorkerMetrics[] = [];
    
    for (const [workerId, worker] of this.workers.entries()) {
      try {
        const activeJobs = await worker.getActive();
        const completedJobs = await worker.getCompleted();
        const failedJobs = await worker.getFailed();
        
        metrics.push({
          workerId,
          activeJobs: activeJobs.length,
          completedJobs: completedJobs.length,
          failedJobs: failedJobs.length,
          memoryUsage: process.memoryUsage().heapUsed,
          cpuUsage: process.cpuUsage().user
        });
      } catch (error) {
        console.error(`Failed to collect metrics for worker ${workerId}:`, error);
      }
    }
    
    return metrics;
  }
  
  private async calculateQueueLoad(): Promise<number> {
    // This would typically query the queue for pending jobs
    return 0; // Placeholder
  }
  
  private calculateWorkerUtilization(metrics: WorkerMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const totalActiveJobs = metrics.reduce((sum, m) => sum + m.activeJobs, 0);
    const totalCompletedJobs = metrics.reduce((sum, m) => sum + m.completedJobs, 0);
    
    return totalActiveJobs / (totalActiveJobs + totalCompletedJobs);
  }
  
  private calculateOptimalWorkers(queueLoad: number, utilization: number): number {
    // Simple heuristic: more workers if queue is backed up or utilization is high
    if (queueLoad > 100 || utilization > 0.8) {
      return Math.min(this.workers.size * 2, 10); // Max 10 workers
    } else if (queueLoad < 10 && utilization < 0.3) {
      return Math.max(this.workers.size / 2, 1); // Min 1 worker
    }
    
    return this.workers.size;
  }
}
```

### 2. Job Distribution Issues

**Symptoms:**
- Uneven job distribution
- Some workers overloaded
- Others idle
- Job processing delays

**Root Causes:**
- Load balancer configuration
- Job affinity issues
- Worker capacity differences
- Queue partitioning problems

**Solutions:**

```bash
# 1. Check job distribution
kubectl exec -n axisor <worker-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('automation-execute', { 
  connection: new redis(process.env.REDIS_URL) 
});

async function checkJobDistribution() {
  const activeJobs = await queue.getActive();
  console.log('Active jobs:', activeJobs.length);
  
  const jobDistribution = {};
  activeJobs.forEach(job => {
    const workerId = job.processedBy || 'unknown';
    jobDistribution[workerId] = (jobDistribution[workerId] || 0) + 1;
  });
  
  console.log('Job distribution:', jobDistribution);
}

checkJobDistribution();
"

# 2. Check worker load
kubectl exec -n axisor <worker-pod> -- node -e "
const os = require('os');
console.log('CPU usage:', process.cpuUsage());
console.log('Memory usage:', process.memoryUsage());
console.log('Load average:', os.loadavg());
"

# 3. Check queue partitioning
kubectl exec -n axisor <worker-pod> -- node -e "
const { Queue } = require('bullmq');
const redis = require('ioredis');
const queue = new Queue('automation-execute', { 
  connection: new redis(process.env.REDIS_URL) 
});

async function checkQueuePartitioning() {
  const waitingJobs = await queue.getWaiting();
  const delayedJobs = await queue.getDelayed();
  
  console.log('Waiting jobs:', waitingJobs.length);
  console.log('Delayed jobs:', delayedJobs.length);
  
  // Check job priorities
  const priorities = waitingJobs.map(job => job.opts.priority || 0);
  console.log('Job priorities:', priorities);
}

checkQueuePartitioning();
"

# 4. Check worker concurrency
kubectl exec -n axisor <worker-pod> -- node -e "
const { Worker } = require('bullmq');
const redis = require('ioredis');

// Check worker configuration
console.log('Worker concurrency:', process.env.WORKER_CONCURRENCY || 5);
console.log('Worker timeout:', process.env.WORKER_TIMEOUT || 30000);
"
```

## Checklist

### Worker Health Monitoring
- [ ] Check worker process status
- [ ] Monitor worker memory usage
- [ ] Check Redis connectivity
- [ ] Verify job processing
- [ ] Monitor queue statistics
- [ ] Check worker logs
- [ ] Validate worker configuration
- [ ] Test worker health endpoints

### Queue Management
- [ ] Monitor queue statistics
- [ ] Check job distribution
- [ ] Clean up old jobs
- [ ] Monitor failed jobs
- [ ] Check queue memory usage
- [ ] Validate queue configuration
- [ ] Test job processing
- [ ] Monitor job retry logic

### Automation Execution
- [ ] Check automation configuration
- [ ] Verify user permissions
- [ ] Test automation triggers
- [ ] Monitor execution logs
- [ ] Check external API connectivity
- [ ] Validate automation results
- [ ] Test error handling
- [ ] Monitor automation performance

### Worker Scaling
- [ ] Monitor worker utilization
- [ ] Check queue load
- [ ] Validate scaling configuration
- [ ] Test automatic scaling
- [ ] Monitor resource usage
- [ ] Check worker distribution
- [ ] Validate load balancing
- [ ] Test scaling triggers

### Automation Troubleshooting
- [ ] Check Margin Guard configuration
- [ ] Verify trading automation setup
- [ ] Test automation execution
- [ ] Monitor automation logs
- [ ] Check plan limitations
- [ ] Validate automation triggers
- [ ] Test error recovery
- [ ] Monitor automation metrics
