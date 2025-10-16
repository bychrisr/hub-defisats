---
title: Performance Issues and Optimization
category: troubleshooting
subcategory: performance-issues
tags: [performance, optimization, bottlenecks, monitoring, tuning]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "Frontend Team"]
---

# Performance Issues and Optimization

## Summary

Comprehensive guide to identifying, diagnosing, and resolving performance issues in the Axisor platform. This document covers performance monitoring, bottleneck identification, optimization strategies, and best practices for maintaining optimal system performance.

## Performance Monitoring

### 1. Backend Performance Metrics

**Key Performance Indicators (KPIs)**
```typescript
interface PerformanceMetrics {
  // Response Time Metrics
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  
  // Throughput Metrics
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    concurrentRequests: number;
  };
  
  // Resource Utilization
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskIO: number;
    networkIO: number;
  };
  
  // Database Performance
  database: {
    connectionPool: number;
    queryTime: number;
    slowQueries: number;
    cacheHitRate: number;
  };
  
  // External API Performance
  externalAPIs: {
    lnMarkets: {
      responseTime: number;
      errorRate: number;
      rateLimitUsage: number;
    };
    lnd: {
      responseTime: number;
      errorRate: number;
      connectionStatus: string;
    };
  };
}
```

**Performance Monitoring Middleware**
```typescript
export const performanceMonitoringMiddleware = (fastify: FastifyInstance) => {
  const metrics: Map<string, number[]> = new Map();
  
  fastify.addHook('onRequest', async (request) => {
    request.startTime = process.hrtime.bigint();
    request.startMemory = process.memoryUsage();
    request.startCpu = process.cpuUsage();
  });
  
  fastify.addHook('onResponse', async (request, reply) => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage();
    
    // Calculate metrics
    const duration = Number(endTime - request.startTime) / 1000000; // ms
    const memoryDelta = endMemory.heapUsed - request.startMemory.heapUsed;
    const cpuDelta = endCpu.user - request.startCpu.user + endCpu.system - request.startCpu.system;
    
    // Store metrics
    const route = `${request.method}:${request.routerPath}`;
    if (!metrics.has(route)) {
      metrics.set(route, []);
    }
    metrics.get(route)!.push(duration);
    
    // Log performance data
    logger.info('Request performance', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
      cpuDelta: `${(cpuDelta / 1000).toFixed(2)}ms`,
      user: request.user?.id
    });
    
    // Alert on performance issues
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        method: request.method,
        url: request.url,
        duration: `${duration.toFixed(2)}ms`
      });
      
      // Send alert to monitoring system
      if (monitoring) {
        monitoring.captureMessage('Slow request detected', {
          level: 'warning',
          tags: { performance: true },
          extra: {
            method: request.method,
            url: request.url,
            duration: duration
          }
        });
      }
    }
  });
  
  // Expose metrics endpoint
  fastify.get('/metrics/performance', async (request, reply) => {
    const performanceData: any = {};
    
    for (const [route, times] of metrics.entries()) {
      const sortedTimes = times.sort((a, b) => a - b);
      const count = sortedTimes.length;
      
      performanceData[route] = {
        count,
        average: times.reduce((a, b) => a + b, 0) / count,
        p50: sortedTimes[Math.floor(count * 0.5)],
        p95: sortedTimes[Math.floor(count * 0.95)],
        p99: sortedTimes[Math.floor(count * 0.99)],
        max: Math.max(...times)
      };
    }
    
    return performanceData;
  });
};
```

### 2. Database Performance Monitoring

**Query Performance Analysis**
```typescript
export class DatabasePerformanceMonitor {
  private queryMetrics: Map<string, QueryMetric[]> = new Map();
  private slowQueryThreshold = 1000; // 1 second
  
  startQuery(queryId: string, sql: string, params: any[]) {
    const metric: QueryMetric = {
      queryId,
      sql,
      params,
      startTime: Date.now(),
      startMemory: process.memoryUsage().heapUsed
    };
    
    this.queryMetrics.set(queryId, [metric]);
  }
  
  endQuery(queryId: string, result?: any) {
    const metrics = this.queryMetrics.get(queryId);
    if (!metrics || metrics.length === 0) return;
    
    const metric = metrics[0];
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    metric.duration = endTime - metric.startTime;
    metric.memoryDelta = endMemory - metric.startMemory;
    metric.resultSize = result ? JSON.stringify(result).length : 0;
    metric.timestamp = new Date().toISOString();
    
    // Log slow queries
    if (metric.duration > this.slowQueryThreshold) {
      logger.warn('Slow database query detected', {
        sql: metric.sql,
        duration: `${metric.duration}ms`,
        memoryDelta: `${(metric.memoryDelta / 1024 / 1024).toFixed(2)}MB`,
        resultSize: `${(metric.resultSize / 1024).toFixed(2)}KB`,
        params: metric.params
      });
    }
    
    // Store metric for analysis
    this.storeQueryMetric(metric);
    
    // Clean up
    this.queryMetrics.delete(queryId);
  }
  
  private storeQueryMetric(metric: QueryMetric) {
    const queryHash = this.hashQuery(metric.sql);
    if (!this.queryMetrics.has(queryHash)) {
      this.queryMetrics.set(queryHash, []);
    }
    
    const metrics = this.queryMetrics.get(queryHash)!;
    metrics.push(metric);
    
    // Keep only last 100 metrics per query
    if (metrics.length > 100) {
      metrics.shift();
    }
  }
  
  getSlowQueries(): QueryMetric[] {
    const slowQueries: QueryMetric[] = [];
    
    for (const metrics of this.queryMetrics.values()) {
      const slowMetrics = metrics.filter(m => m.duration > this.slowQueryThreshold);
      slowQueries.push(...slowMetrics);
    }
    
    return slowQueries.sort((a, b) => b.duration - a.duration);
  }
  
  getQueryPerformanceReport(): QueryPerformanceReport {
    const report: QueryPerformanceReport = {
      totalQueries: 0,
      slowQueries: 0,
      averageDuration: 0,
      slowestQueries: [],
      recommendations: []
    };
    
    let totalDuration = 0;
    const allMetrics: QueryMetric[] = [];
    
    for (const metrics of this.queryMetrics.values()) {
      allMetrics.push(...metrics);
      report.totalQueries += metrics.length;
      report.slowQueries += metrics.filter(m => m.duration > this.slowQueryThreshold).length;
      
      for (const metric of metrics) {
        totalDuration += metric.duration;
      }
    }
    
    if (allMetrics.length > 0) {
      report.averageDuration = totalDuration / allMetrics.length;
      
      // Get slowest queries
      report.slowestQueries = allMetrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
        .map(m => ({
          sql: m.sql,
          duration: m.duration,
          count: 1 // This would need to be calculated properly
        }));
      
      // Generate recommendations
      report.recommendations = this.generateRecommendations(allMetrics);
    }
    
    return report;
  }
  
  private generateRecommendations(metrics: QueryMetric[]): string[] {
    const recommendations: string[] = [];
    
    // Find queries that could benefit from indexing
    const queriesWithoutIndexes = metrics.filter(m => 
      m.sql.toLowerCase().includes('where') && 
      m.duration > 500
    );
    
    if (queriesWithoutIndexes.length > 0) {
      recommendations.push('Consider adding indexes for frequently queried columns');
    }
    
    // Find queries with large result sets
    const largeResultQueries = metrics.filter(m => m.resultSize > 1024 * 1024); // 1MB
    
    if (largeResultQueries.length > 0) {
      recommendations.push('Consider implementing pagination for large result sets');
    }
    
    // Find queries with high memory usage
    const highMemoryQueries = metrics.filter(m => m.memoryDelta > 50 * 1024 * 1024); // 50MB
    
    if (highMemoryQueries.length > 0) {
      recommendations.push('Optimize queries with high memory usage');
    }
    
    return recommendations;
  }
  
  private hashQuery(sql: string): string {
    // Simple hash function for query identification
    let hash = 0;
    for (let i = 0; i < sql.length; i++) {
      const char = sql.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}
```

### 3. Frontend Performance Monitoring

**React Performance Monitoring**
```typescript
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  
  const measurePerformance = useCallback((name: string, fn: () => void) => {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    
    fn();
    
    const endTime = performance.now();
    const endMemory = performance.memory?.usedJSHeapSize || 0;
    
    const metric = {
      duration: endTime - startTime,
      memoryDelta: endMemory - startMemory,
      timestamp: new Date().toISOString()
    };
    
    setMetrics(prev => ({ ...prev, [name]: metric }));
    
    // Log slow operations
    if (metric.duration > 100) {
      console.warn(`Slow operation detected: ${name}`, metric);
    }
    
    return metric;
  }, []);
  
  const measureAsyncPerformance = useCallback(async <T>(
    name: string, 
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    
    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize || 0;
      
      const metric = {
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        timestamp: new Date().toISOString()
      };
      
      setMetrics(prev => ({ ...prev, [name]: metric }));
      
      // Log slow operations
      if (metric.duration > 1000) {
        console.warn(`Slow async operation detected: ${name}`, metric);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const metric = {
        duration: endTime - startTime,
        memoryDelta: 0,
        timestamp: new Date().toISOString(),
        error: error.message
      };
      
      setMetrics(prev => ({ ...prev, [name]: metric }));
      throw error;
    }
  }, []);
  
  return { measurePerformance, measureAsyncPerformance, metrics };
};

// Chart Performance Monitoring
export const useChartPerformanceMonitor = () => {
  const [chartMetrics, setChartMetrics] = useState<ChartMetrics>({});
  
  const measureChartOperation = useCallback((
    operation: string,
    fn: () => void
  ) => {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    
    fn();
    
    const endTime = performance.now();
    const endMemory = performance.memory?.usedJSHeapSize || 0;
    
    const metric = {
      operation,
      duration: endTime - startTime,
      memoryDelta: endMemory - startMemory,
      timestamp: new Date().toISOString()
    };
    
    setChartMetrics(prev => ({
      ...prev,
      [operation]: [...(prev[operation] || []), metric].slice(-10) // Keep last 10
    }));
    
    // Log slow chart operations
    if (metric.duration > 50) {
      console.warn(`Slow chart operation: ${operation}`, metric);
    }
    
    return metric;
  }, []);
  
  return { measureChartOperation, chartMetrics };
};
```

## Common Performance Issues

### 1. Database Performance Issues

**Slow Query Identification**
```sql
-- Find slow queries
SELECT 
  query,
  mean_time,
  calls,
  total_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 1000  -- Queries taking more than 1 second
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_scan = 0  -- Unused indexes
ORDER BY tablename;

-- Monitor database locks
SELECT 
  pid,
  state,
  query,
  query_start,
  now() - query_start as duration
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query NOT LIKE '%pg_stat_activity%';
```

**Query Optimization Strategies**
```typescript
// Optimized user query with pagination
export class OptimizedUserService {
  async getUsersWithPagination(
    page: number = 1,
    limit: number = 50,
    filters: UserFilters = {}
  ): Promise<PaginatedUsers> {
    const offset = (page - 1) * limit;
    
    // Use proper indexing and limit results
    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where: this.buildWhereClause(filters),
        select: {
          id: true,
          email: true,
          username: true,
          created_at: true,
          plan_type: true,
          is_active: true
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit
      }),
      this.prisma.user.count({
        where: this.buildWhereClause(filters)
      })
    ]);
    
    return {
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }
  
  private buildWhereClause(filters: UserFilters) {
    const where: any = {};
    
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    if (filters.planType) {
      where.plan_type = filters.planType;
    }
    
    if (filters.isActive !== undefined) {
      where.is_active = filters.isActive;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      where.created_at = {};
      if (filters.dateFrom) {
        where.created_at.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.created_at.lte = filters.dateTo;
      }
    }
    
    return where;
  }
}
```

### 2. Frontend Performance Issues

**Chart Performance Optimization**
```typescript
// Optimized chart component with lazy loading
export const OptimizedTradingChart: React.FC<ChartProps> = ({
  data,
  height = 400,
  onDataUpdate
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { measureChartOperation } = useChartPerformanceMonitor();
  
  // Debounced data update
  const debouncedDataUpdate = useMemo(
    () => debounce((newData: any[]) => {
      if (onDataUpdate) {
        onDataUpdate(newData);
      }
    }, 300),
    [onDataUpdate]
  );
  
  // Initialize chart with performance monitoring
  useEffect(() => {
    if (!chartRef.current) return;
    
    const initChart = () => {
      measureChartOperation('chartInitialization', () => {
        chartInstance.current = createChart(chartRef.current!, {
          width: chartRef.current!.clientWidth,
          height,
          layout: {
            background: { color: 'transparent' },
            textColor: '#d1d4dc'
          },
          grid: {
            vertLines: { color: '#2B2B2B' },
            horzLines: { color: '#2B2B2B' }
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false
          },
          rightPriceScale: {
            borderColor: '#2B2B2B'
          }
        });
        
        setIsLoading(false);
      });
    };
    
    initChart();
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.remove();
      }
    };
  }, [height, measureChartOperation]);
  
  // Update chart data with performance monitoring
  useEffect(() => {
    if (!chartInstance.current || !data.length) return;
    
    const updateData = () => {
      measureChartOperation('dataUpdate', () => {
        const series = chartInstance.current.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350'
        });
        
        series.setData(data);
        
        // Fit content to show all data
        chartInstance.current.timeScale().fitContent();
      });
    };
    
    updateData();
    debouncedDataUpdate(data);
  }, [data, measureChartOperation, debouncedDataUpdate]);
  
  // Handle resize with performance monitoring
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current && chartRef.current) {
        measureChartOperation('resize', () => {
          chartInstance.current.applyOptions({
            width: chartRef.current!.clientWidth,
            height
          });
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height, measureChartOperation]);
  
  if (isLoading) {
    return <div className="chart-loading">Loading chart...</div>;
  }
  
  return <div ref={chartRef} className="trading-chart" />;
};
```

**State Management Optimization**
```typescript
// Optimized Zustand store with selectors
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  preferences: {},
  permissions: [],
  
  // Actions
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authApi.login(credentials);
      
      set({ 
        user: response.user, 
        preferences: response.preferences || {},
        permissions: response.permissions || [],
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({ 
        user: null, 
        preferences: {},
        permissions: [],
        isLoading: false, 
        error: error.message 
      });
    }
  },
  
  logout: () => {
    set({ 
      user: null, 
      preferences: {},
      permissions: [],
      isLoading: false, 
      error: null 
    });
  },
  
  updatePreferences: (preferences) => {
    set(state => ({
      preferences: { ...state.preferences, ...preferences }
    }));
  }
}));

// Optimized selectors to prevent unnecessary re-renders
export const useUser = () => useAuthStore(state => state.user);
export const useUserLoading = () => useAuthStore(state => state.isLoading);
export const useUserError = () => useAuthStore(state => state.error);
export const useUserPreferences = () => useAuthStore(state => state.preferences);
export const useUserPermissions = () => useAuthStore(state => state.permissions);

// Memoized permission checker
export const useHasPermission = (permission: string) => {
  const permissions = useUserPermissions();
  
  return useMemo(() => {
    return permissions.includes(permission);
  }, [permissions, permission]);
};
```

### 3. External API Performance Issues

**API Response Time Optimization**
```typescript
// Optimized LN Markets API client with caching
export class OptimizedLNMarketsClient {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTimeout = 30000; // 30 seconds
  
  async request<T = any>(
    config: AxiosRequestConfig,
    useCache: boolean = false
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(config);
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < this.cacheTimeout) {
        return entry.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    
    const startTime = Date.now();
    
    try {
      const response = await this.client.request(config);
      const duration = Date.now() - startTime;
      
      // Cache successful responses
      if (useCache && response.status === 200) {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }
      
      // Log performance
      if (duration > 2000) {
        logger.warn('Slow API response', {
          url: config.url,
          method: config.method,
          duration: `${duration}ms`
        });
      }
      
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('API request failed', {
        url: config.url,
        method: config.method,
        duration: `${duration}ms`,
        error: error.message
      });
      
      throw error;
    }
  }
  
  private generateCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
  }
  
  // Batch requests for better performance
  async batchRequest<T = any>(
    requests: AxiosRequestConfig[]
  ): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      const responses = await Promise.all(
        requests.map(request => this.client.request(request))
      );
      
      const duration = Date.now() - startTime;
      
      logger.info('Batch request completed', {
        requestCount: requests.length,
        duration: `${duration}ms`,
        averagePerRequest: `${(duration / requests.length).toFixed(2)}ms`
      });
      
      return responses.map(response => response.data);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Batch request failed', {
        requestCount: requests.length,
        duration: `${duration}ms`,
        error: error.message
      });
      
      throw error;
    }
  }
}
```

## Performance Optimization Strategies

### 1. Database Optimization

**Index Optimization**
```sql
-- Create optimized indexes
CREATE INDEX CONCURRENTLY idx_users_email_active ON users(email) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_automations_user_plan ON automations(user_id, plan_type) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_trades_user_created ON trades(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_premium ON users(id) WHERE plan_type IN ('basic', 'advanced', 'pro');
CREATE INDEX CONCURRENTLY idx_automations_margin_guard ON automations(id) WHERE type = 'margin_guard' AND is_active = true;
```

**Query Optimization**
```typescript
// Optimized dashboard query
export class OptimizedDashboardService {
  async getDashboardData(userId: string): Promise<DashboardData> {
    // Use parallel queries for better performance
    const [
      user,
      recentTrades,
      activeAutomations,
      notifications,
      accountBalance
    ] = await Promise.all([
      this.getUserProfile(userId),
      this.getRecentTrades(userId, 10),
      this.getActiveAutomations(userId),
      this.getUnreadNotifications(userId, 5),
      this.getAccountBalance(userId)
    ]);
    
    return {
      user,
      recentTrades,
      activeAutomations,
      notifications,
      accountBalance
    };
  }
  
  private async getUserProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        plan_type: true,
        created_at: true,
        last_activity_at: true
      }
    });
  }
  
  private async getRecentTrades(userId: string, limit: number) {
    return this.prisma.tradeLog.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        symbol: true,
        side: true,
        amount: true,
        price: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
  }
  
  private async getActiveAutomations(userId: string) {
    return this.prisma.automation.findMany({
      where: { 
        user_id: userId,
        is_active: true
      },
      select: {
        id: true,
        type: true,
        name: true,
        config: true,
        created_at: true
      }
    });
  }
  
  private async getUnreadNotifications(userId: string, limit: number) {
    return this.prisma.notification.findMany({
      where: { 
        user_id: userId,
        is_read: false
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
  }
  
  private async getAccountBalance(userId: string) {
    // This would typically call an external API
    // For now, return cached data or default
    return { balance: 0, currency: 'USD' };
  }
}
```

### 2. Frontend Optimization

**Component Optimization**
```typescript
// Optimized chart component with virtualization
export const OptimizedChart: React.FC<ChartProps> = React.memo(({
  data,
  height = 400,
  onDataUpdate
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const [visibleData, setVisibleData] = useState(data.slice(-1000)); // Show last 1000 points
  
  // Virtual scrolling for large datasets
  const handleScroll = useCallback((scrollPosition: number) => {
    if (data.length <= 1000) return;
    
    const startIndex = Math.max(0, Math.floor(scrollPosition / 10));
    const endIndex = Math.min(data.length, startIndex + 1000);
    
    setVisibleData(data.slice(startIndex, endIndex));
  }, [data]);
  
  // Memoized chart options
  const chartOptions = useMemo(() => ({
    width: chartRef.current?.clientWidth || 800,
    height,
    layout: {
      background: { color: 'transparent' },
      textColor: '#d1d4dc'
    },
    grid: {
      vertLines: { color: '#2B2B2B' },
      horzLines: { color: '#2B2B2B' }
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false
    },
    rightPriceScale: {
      borderColor: '#2B2B2B'
    }
  }), [height]);
  
  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartInstance.current = createChart(chartRef.current, chartOptions);
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.remove();
      }
    };
  }, [chartOptions]);
  
  // Update chart data
  useEffect(() => {
    if (!chartInstance.current || !visibleData.length) return;
    
    const series = chartInstance.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350'
    });
    
    series.setData(visibleData);
    chartInstance.current.timeScale().fitContent();
  }, [visibleData]);
  
  return (
    <div className="chart-container">
      <div ref={chartRef} className="trading-chart" />
      {data.length > 1000 && (
        <div className="chart-scroll">
          <input
            type="range"
            min="0"
            max={data.length - 1000}
            onChange={(e) => handleScroll(Number(e.target.value))}
            className="chart-scroll-bar"
          />
        </div>
      )}
    </div>
  );
});
```

### 3. Caching Strategies

**Redis Caching Implementation**
```typescript
export class CacheService {
  private redis: Redis;
  private defaultTTL = 300; // 5 minutes
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.redis.setex(key, ttl || this.defaultTTL, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
    }
  }
  
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache invalidation error', { pattern, error: error.message });
    }
  }
  
  // Cache with fallback
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await fallback();
    await this.set(key, value, ttl);
    
    return value;
  }
}

// Usage in services
export class CachedUserService {
  private cache: CacheService;
  
  constructor(cache: CacheService) {
    this.cache = cache;
  }
  
  async getUser(userId: string): Promise<User | null> {
    return this.cache.getOrSet(
      `user:${userId}`,
      () => this.prisma.user.findUnique({ where: { id: userId } }),
      600 // 10 minutes
    );
  }
  
  async getUsersWithPagination(
    page: number,
    limit: number,
    filters: UserFilters
  ): Promise<PaginatedUsers> {
    const cacheKey = `users:${page}:${limit}:${JSON.stringify(filters)}`;
    
    return this.cache.getOrSet(
      cacheKey,
      () => this.getUsersFromDatabase(page, limit, filters),
      300 // 5 minutes
    );
  }
  
  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data
    });
    
    // Invalidate cache
    await this.cache.del(`user:${userId}`);
    await this.cache.invalidatePattern('users:*');
    
    return user;
  }
}
```

## Performance Monitoring and Alerting

### 1. Performance Alerts

**Alert Configuration**
```typescript
export class PerformanceAlertManager {
  private thresholds = {
    responseTime: {
      warning: 2000,  // 2 seconds
      critical: 5000  // 5 seconds
    },
    errorRate: {
      warning: 5,     // 5%
      critical: 10    // 10%
    },
    memoryUsage: {
      warning: 80,    // 80%
      critical: 90    // 90%
    },
    cpuUsage: {
      warning: 70,    // 70%
      critical: 85    // 85%
    }
  };
  
  checkPerformanceMetrics(metrics: PerformanceMetrics): Alert[] {
    const alerts: Alert[] = [];
    
    // Check response time
    if (metrics.responseTime.p95 > this.thresholds.responseTime.critical) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'response_time',
        value: metrics.responseTime.p95,
        threshold: this.thresholds.responseTime.critical,
        message: `Response time p95 is ${metrics.responseTime.p95}ms, exceeding critical threshold`
      });
    } else if (metrics.responseTime.p95 > this.thresholds.responseTime.warning) {
      alerts.push({
        type: 'WARNING',
        metric: 'response_time',
        value: metrics.responseTime.p95,
        threshold: this.thresholds.responseTime.warning,
        message: `Response time p95 is ${metrics.responseTime.p95}ms, exceeding warning threshold`
      });
    }
    
    // Check error rate
    const errorRate = (metrics.errorCount / metrics.totalRequests) * 100;
    if (errorRate > this.thresholds.errorRate.critical) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'error_rate',
        value: errorRate,
        threshold: this.thresholds.errorRate.critical,
        message: `Error rate is ${errorRate.toFixed(2)}%, exceeding critical threshold`
      });
    } else if (errorRate > this.thresholds.errorRate.warning) {
      alerts.push({
        type: 'WARNING',
        metric: 'error_rate',
        value: errorRate,
        threshold: this.thresholds.errorRate.warning,
        message: `Error rate is ${errorRate.toFixed(2)}%, exceeding warning threshold`
      });
    }
    
    // Check memory usage
    if (metrics.resources.memoryUsage > this.thresholds.memoryUsage.critical) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'memory_usage',
        value: metrics.resources.memoryUsage,
        threshold: this.thresholds.memoryUsage.critical,
        message: `Memory usage is ${metrics.resources.memoryUsage}%, exceeding critical threshold`
      });
    } else if (metrics.resources.memoryUsage > this.thresholds.memoryUsage.warning) {
      alerts.push({
        type: 'WARNING',
        metric: 'memory_usage',
        value: metrics.resources.memoryUsage,
        threshold: this.thresholds.memoryUsage.warning,
        message: `Memory usage is ${metrics.resources.memoryUsage}%, exceeding warning threshold`
      });
    }
    
    return alerts;
  }
  
  async sendAlert(alert: Alert): Promise<void> {
    // Send to monitoring system
    if (monitoring) {
      monitoring.captureMessage(alert.message, {
        level: alert.type === 'CRITICAL' ? 'error' : 'warning',
        tags: { 
          performance: true,
          metric: alert.metric,
          severity: alert.type
        },
        extra: {
          value: alert.value,
          threshold: alert.threshold
        }
      });
    }
    
    // Send notification to administrators
    await this.notificationService.sendAdminAlert({
      type: 'PERFORMANCE_ALERT',
      severity: alert.type,
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
      message: alert.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Checklist

### Performance Monitoring Setup
- [ ] Implement performance monitoring middleware
- [ ] Set up database query monitoring
- [ ] Configure frontend performance tracking
- [ ] Create performance dashboards
- [ ] Set up alerting thresholds
- [ ] Monitor external API performance
- [ ] Track resource utilization
- [ ] Implement performance logging

### Performance Optimization
- [ ] Optimize database queries
- [ ] Add appropriate indexes
- [ ] Implement caching strategies
- [ ] Optimize frontend components
- [ ] Use lazy loading for large datasets
- [ ] Implement virtual scrolling
- [ ] Optimize bundle size
- [ ] Use memoization where appropriate

### Performance Testing
- [ ] Set up load testing
- [ ] Test database performance
- [ ] Test frontend rendering performance
- [ ] Test API response times
- [ ] Test under high load
- [ ] Monitor performance trends
- [ ] Set up performance benchmarks
- [ ] Regular performance reviews
