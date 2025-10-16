---
title: Common Issues and Solutions
category: troubleshooting
subcategory: common-issues
tags: [troubleshooting, debugging, errors, solutions, common-problems]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "Frontend Team"]
---

# Common Issues and Solutions

## Summary

Comprehensive troubleshooting guide for the most common issues encountered in the Axisor platform. This document provides step-by-step solutions for database problems, frontend issues, authentication errors, performance bottlenecks, and external API integration problems.

## Database Issues

### 1. Database Connection Failures

**Symptoms:**
- Error "Database connection failed"
- Application fails to start
- Connection timeout errors
- Prisma client initialization errors

**Root Causes:**
- PostgreSQL service not running
- Incorrect database credentials
- Network connectivity issues
- Database server overload

**Solutions:**

```bash
# 1. Check PostgreSQL status
docker ps | grep postgres

# 2. Test database connection
docker exec axisor-postgres psql -U axisor -d axisor -c "SELECT 1;"

# 3. Check database logs
docker logs axisor-postgres

# 4. Restart PostgreSQL if needed
docker restart axisor-postgres

# 5. Verify environment variables
echo $DATABASE_URL
```

**Prevention:**
- Use health checks in Docker Compose
- Implement connection pooling
- Monitor database metrics
- Set up automated backups

### 2. Migration Failures

**Symptoms:**
- Prisma migration errors
- Schema out of sync
- Missing columns/tables
- Constraint violations

**Root Causes:**
- Incomplete migration files
- Database state conflicts
- Concurrent migration attempts
- Insufficient permissions

**Solutions:**

```bash
# 1. Check migration status
npx prisma migrate status

# 2. Reset database (CAUTION: Data loss)
npx prisma migrate reset

# 3. Apply pending migrations
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Sync schema with database
npx prisma db pull
```

**Prevention:**
- Always backup before migrations
- Use transaction-based migrations
- Test migrations in staging
- Implement migration rollback procedures

## Frontend Issues

### 1. Frontend Not Loading (502 Bad Gateway)

**Symptoms:**
- 502 error in browser
- Frontend container not responding
- Nginx proxy errors
- Build failures

**Root Causes:**
- Frontend container stopped
- Build process failed
- Nginx configuration issues
- Port conflicts

**Solutions:**

```bash
# 1. Check frontend container status
docker ps | grep frontend

# 2. View frontend logs
docker logs axisor-frontend

# 3. Restart frontend container
docker restart axisor-frontend

# 4. Rebuild frontend image
docker compose -f docker-compose.prod.yml build frontend

# 5. Check Nginx configuration
docker logs axisor-nginx
```

**Prevention:**
- Implement health checks
- Use multi-stage builds
- Monitor container resources
- Set up automated restarts

### 2. Chart Rendering Issues

**Symptoms:**
- Charts not displaying
- Data loading errors
- Performance issues
- Memory leaks

**Root Causes:**
- Lightweight Charts initialization errors
- Data format mismatches
- Memory management issues
- API response problems

**Solutions:**

```typescript
// 1. Check chart initialization
const chart = createChart(container, {
  width: container.clientWidth,
  height: container.clientHeight,
  // ... configuration
});

// 2. Verify data format
const formattedData = data.map(item => ({
  time: item.timestamp / 1000,
  value: item.price
}));

// 3. Handle resize events
window.addEventListener('resize', () => {
  chart.applyOptions({
    width: container.clientWidth,
    height: container.clientHeight
  });
});

// 4. Clean up on unmount
useEffect(() => {
  return () => {
    chart.remove();
  };
}, []);
```

**Prevention:**
- Implement proper cleanup
- Use lazy loading for large datasets
- Monitor memory usage
- Test with various data sizes

## Authentication Issues

### 1. JWT Token Validation Failures

**Symptoms:**
- "Invalid token" errors
- Session expiration issues
- Authentication middleware failures
- Token refresh problems

**Root Causes:**
- Expired tokens
- Invalid token format
- Secret key mismatches
- Clock synchronization issues

**Solutions:**

```typescript
// 1. Check token expiration
const decoded = jwt.verify(token, secret);
if (decoded.exp < Date.now() / 1000) {
  // Token expired, refresh needed
}

// 2. Validate token format
if (!token || typeof token !== 'string') {
  throw new Error('Invalid token format');
}

// 3. Check token structure
const parts = token.split('.');
if (parts.length !== 3) {
  throw new Error('Invalid JWT structure');
}

// 4. Implement refresh logic
const refreshToken = await authService.refreshAccessToken(token);
```

**Prevention:**
- Implement proper token refresh
- Use secure token storage
- Monitor token expiration
- Set appropriate token lifetimes

### 2. Admin Access Issues

**Symptoms:**
- "Admin access required" errors
- Permission denied messages
- Role validation failures
- Admin panel access problems

**Root Causes:**
- Missing admin user records
- Incorrect role assignments
- Database permission issues
- Middleware configuration problems

**Solutions:**

```typescript
// 1. Check admin user existence
const adminUser = await prisma.adminUser.findUnique({
  where: { user_id: userId }
});

// 2. Verify user role
if (!adminUser || adminUser.role !== 'admin') {
  throw new Error('Admin access required');
}

// 3. Check user status
const user = await prisma.user.findUnique({
  where: { id: userId }
});

if (!user || !user.is_active) {
  throw new Error('User account inactive');
}
```

**Prevention:**
- Implement proper role management
- Use RBAC (Role-Based Access Control)
- Monitor admin access logs
- Regular security audits

## Performance Issues

### 1. Slow Database Queries

**Symptoms:**
- High response times
- Database connection timeouts
- Memory usage spikes
- User experience degradation

**Root Causes:**
- Missing database indexes
- Inefficient query patterns
- Large dataset operations
- Connection pool exhaustion

**Solutions:**

```sql
-- 1. Identify slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 2. Add missing indexes
CREATE INDEX idx_user_created_at ON users(created_at);
CREATE INDEX idx_automation_user_id ON automations(user_id);

-- 3. Optimize query patterns
-- Use pagination for large datasets
SELECT * FROM trades 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 50 OFFSET 0;

-- 4. Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Prevention:**
- Regular query performance analysis
- Implement database monitoring
- Use query optimization tools
- Set up automated indexing

### 2. Memory Leaks

**Symptoms:**
- Increasing memory usage
- Application crashes
- Performance degradation
- Out of memory errors

**Root Causes:**
- Unclosed database connections
- Event listener accumulation
- Circular references
- Large object retention

**Solutions:**

```typescript
// 1. Proper cleanup in React components
useEffect(() => {
  const subscription = dataStream.subscribe(handleData);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// 2. Close database connections
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// 3. Remove event listeners
componentWillUnmount() {
  window.removeEventListener('resize', this.handleResize);
}

// 4. Use weak references for large objects
const weakMap = new WeakMap();
```

**Prevention:**
- Implement proper cleanup patterns
- Use memory profiling tools
- Monitor memory usage
- Regular code reviews

## External API Issues

### 1. LN Markets API Problems

**Symptoms:**
- API timeout errors
- Rate limit exceeded
- Authentication failures
- Data synchronization issues

**Root Causes:**
- Network connectivity problems
- API rate limiting
- Invalid credentials
- Service outages

**Solutions:**

```typescript
// 1. Implement retry logic
async function makeAPICall(url: string, options: any) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status === 429) {
        // Rate limited, wait and retry
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
      
      throw new Error(`API call failed: ${response.status}`);
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
    }
  }
}

// 2. Handle rate limiting
const rateLimiter = new Map();
function checkRateLimit(key: string) {
  const now = Date.now();
  const lastCall = rateLimiter.get(key) || 0;
  
  if (now - lastCall < 1000) {
    throw new Error('Rate limit exceeded');
  }
  
  rateLimiter.set(key, now);
}
```

**Prevention:**
- Implement circuit breaker patterns
- Use exponential backoff
- Monitor API health
- Cache frequently accessed data

### 2. LND Connection Issues

**Symptoms:**
- LND service unavailable
- Certificate validation errors
- Macaroon authentication failures
- Network connectivity problems

**Root Causes:**
- LND service down
- Invalid TLS certificates
- Incorrect macaroon permissions
- Network configuration issues

**Solutions:**

```bash
# 1. Check LND service status
docker ps | grep lnd

# 2. Verify LND logs
docker logs lnd-testnet

# 3. Test LND connectivity
curl -k --cert /path/to/tls.cert \
  --key /path/to/tls.key \
  https://localhost:8080/v1/getinfo

# 4. Check macaroon permissions
ls -la /path/to/admin.macaroon
```

**Prevention:**
- Implement health checks
- Use proper certificate management
- Monitor LND service status
- Set up automated failover

## Worker Process Issues

### 1. BullMQ Worker Failures

**Symptoms:**
- Jobs stuck in queue
- Worker process crashes
- Memory usage spikes
- Job processing delays

**Root Causes:**
- Redis connection issues
- Worker memory leaks
- Job timeout problems
- Queue configuration errors

**Solutions:**

```typescript
// 1. Check worker health
const worker = new Worker('queue-name', processor, {
  connection: redis,
  concurrency: 5,
  removeOnComplete: 100,
  removeOnFail: 50,
});

// 2. Handle worker errors
worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

// 3. Monitor queue status
const queue = new Queue('queue-name', { connection: redis });
const waiting = await queue.getWaiting();
const active = await queue.getActive();
const failed = await queue.getFailed();

// 4. Clean up failed jobs
await queue.clean(24 * 60 * 60 * 1000, 'failed');
```

**Prevention:**
- Implement proper error handling
- Use job timeouts
- Monitor worker metrics
- Regular queue maintenance

### 2. Automation Execution Failures

**Symptoms:**
- Automations not executing
- Margin Guard not working
- Trading actions failing
- Notification delays

**Root Causes:**
- Invalid automation configurations
- Exchange API issues
- Insufficient permissions
- Network connectivity problems

**Solutions:**

```typescript
// 1. Validate automation configuration
function validateAutomationConfig(config: any) {
  if (!config.userId || !config.exchangeAccountId) {
    throw new Error('Missing required configuration');
  }
  
  if (config.planType === 'free' && config.advancedFeatures) {
    throw new Error('Advanced features not available for free plan');
  }
}

// 2. Check exchange credentials
const credentials = await userExchangeAccountService.getCredentials(
  config.userId, 
  config.exchangeAccountId
);

if (!credentials || !credentials.isValid) {
  throw new Error('Invalid exchange credentials');
}

// 3. Implement retry logic for trading actions
async function executeTradingAction(action: TradingAction) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await lnMarketsAPI.executeAction(action);
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

**Prevention:**
- Validate configurations before execution
- Implement proper error handling
- Monitor automation success rates
- Regular testing of automation logic

## Monitoring and Debugging

### 1. Log Analysis

**Symptoms:**
- Difficult to identify issues
- Inconsistent log formats
- Missing critical information
- Log file size issues

**Root Causes:**
- Inadequate logging configuration
- Missing log levels
- Poor log formatting
- Insufficient log rotation

**Solutions:**

```typescript
// 1. Structured logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 2. Log correlation IDs
const correlationId = uuidv4();
logger.info('Processing request', { 
  correlationId, 
  userId, 
  endpoint: request.url 
});

// 3. Log rotation
const logrotate = require('logrotate-stream');
const stream = logrotate({
  file: 'app.log',
  size: '10m',
  keep: 5
});
```

**Prevention:**
- Use structured logging
- Implement log correlation
- Set up log rotation
- Monitor log file sizes

### 2. Performance Monitoring

**Symptoms:**
- Slow response times
- High resource usage
- User complaints
- System instability

**Root Causes:**
- Inefficient code
- Resource bottlenecks
- Poor caching strategies
- Inadequate monitoring

**Solutions:**

```typescript
// 1. Performance metrics
const performanceMetrics = {
  responseTime: Date.now() - startTime,
  memoryUsage: process.memoryUsage(),
  cpuUsage: process.cpuUsage(),
  activeConnections: await getActiveConnections()
};

// 2. Database query monitoring
const queryStart = Date.now();
const result = await prisma.user.findMany();
const queryTime = Date.now() - queryStart;

if (queryTime > 1000) {
  logger.warn('Slow query detected', { 
    query: 'findMany', 
    duration: queryTime 
  });
}

// 3. API response time monitoring
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 5000) {
      logger.warn('Slow API response', { 
        method: req.method, 
        url: req.url, 
        duration 
      });
    }
  });
  
  next();
});
```

**Prevention:**
- Implement comprehensive monitoring
- Set up performance alerts
- Regular performance testing
- Use APM tools

## Checklist

### Before Reporting Issues
- [ ] Check application logs
- [ ] Verify environment variables
- [ ] Test database connectivity
- [ ] Check external API status
- [ ] Review recent changes
- [ ] Gather error details
- [ ] Check system resources
- [ ] Verify network connectivity

### Common Debugging Steps
- [ ] Restart affected services
- [ ] Check service health status
- [ ] Review configuration files
- [ ] Test with minimal configuration
- [ ] Check for recent updates
- [ ] Verify dependencies
- [ ] Test in different environments
- [ ] Check for known issues

### Escalation Criteria
- [ ] Issue affects multiple users
- [ ] Data loss or corruption
- [ ] Security vulnerability
- [ ] System unavailable
- [ ] Performance degradation >50%
- [ ] External service outage
- [ ] Database corruption
- [ ] Authentication system failure
