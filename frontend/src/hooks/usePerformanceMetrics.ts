import { useState, useCallback, useRef, useEffect } from 'react';
import { globalDebug } from './useDebug';

interface PerformanceMetric {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'api' | 'render' | 'user-interaction' | 'navigation';
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  averageResponseTime: number;
  slowestRequest: {
    name: string;
    duration: number;
  };
  fastestRequest: {
    name: string;
    duration: number;
  };
  totalRequests: number;
  errorRate: number;
  uptime: number;
}

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const startTimesRef = useRef<Map<string, number>>(new Map());

  const startMetric = useCallback((
    name: string,
    category: PerformanceMetric['category'] = 'api',
    metadata?: Record<string, any>
  ) => {
    if (!isEnabled) return;

    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();

    startTimesRef.current.set(id, startTime);

    const metric: PerformanceMetric = {
      id,
      name,
      startTime,
      category,
      metadata,
    };

    setMetrics(prev => [...prev, metric]);

    globalDebug.debug('performance', `Started metric: ${name}`, { id, category });

    return id;
  }, [isEnabled]);

  const endMetric = useCallback((id: string, additionalMetadata?: Record<string, any>) => {
    if (!isEnabled) return;

    const startTime = startTimesRef.current.get(id);
    if (!startTime) {
      globalDebug.warn('performance', `Metric not found: ${id}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    setMetrics(prev => prev.map(metric => {
      if (metric.id === id) {
        const updatedMetric = {
          ...metric,
          endTime,
          duration,
          metadata: { ...metric.metadata, ...additionalMetadata },
        };

        globalDebug.info('performance', `Completed metric: ${metric.name}`, {
          duration: `${duration.toFixed(2)}ms`,
          category: metric.category,
        });

        return updatedMetric;
      }
      return metric;
    }));

    startTimesRef.current.delete(id);
  }, [isEnabled]);

  const measureApiCall = useCallback(async <T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const metricId = startMetric(name, 'api', metadata);

    try {
      const result = await apiCall();
      endMetric(metricId, { success: true });
      return result;
    } catch (error) {
      endMetric(metricId, { success: false, error: (error as Error).message });
      throw error;
    }
  }, [startMetric, endMetric]);

  const measureRender = useCallback((
    componentName: string,
    callback: () => void,
    metadata?: Record<string, any>
  ) => {
    const metricId = startMetric(`${componentName} render`, 'render', metadata);

    // Use requestAnimationFrame to measure render time
    requestAnimationFrame(() => {
      callback();
      endMetric(metricId);
    });
  }, [startMetric, endMetric]);

  const measureUserInteraction = useCallback((
    actionName: string,
    metadata?: Record<string, any>
  ) => {
    const metricId = startMetric(actionName, 'user-interaction', metadata);

    // End metric after a short delay to capture user feedback
    setTimeout(() => {
      endMetric(metricId);
    }, 100);
  }, [startMetric, endMetric]);

  const measureNavigation = useCallback((
    from: string,
    to: string,
    metadata?: Record<string, any>
  ) => {
    const metricId = startMetric(`Navigation: ${from} -> ${to}`, 'navigation', {
      from,
      to,
      ...metadata,
    });

    // Use navigation timing if available
    if (performance.timing) {
      const navStart = performance.timing.navigationStart;
      const loadEventEnd = performance.timing.loadEventEnd;
      const navigationTime = loadEventEnd - navStart;

      endMetric(metricId, {
        navigationTime,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - navStart,
        loadComplete: loadEventEnd - navStart,
      });
    } else {
      endMetric(metricId);
    }
  }, [startMetric, endMetric]);

  const getMetricsStats = useCallback((): PerformanceStats => {
    const completedMetrics = metrics.filter(m => m.duration !== undefined);
    const apiMetrics = completedMetrics.filter(m => m.category === 'api');
    const errorMetrics = completedMetrics.filter(m => m.metadata?.success === false);

    if (completedMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        slowestRequest: { name: '', duration: 0 },
        fastestRequest: { name: '', duration: 0 },
        totalRequests: 0,
        errorRate: 0,
        uptime: 100,
      };
    }

    const durations = completedMetrics.map(m => m.duration!);
    const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    const slowestRequest = completedMetrics.reduce((slowest, current) => {
      return (current.duration || 0) > (slowest.duration || 0) ? current : slowest;
    });

    const fastestRequest = completedMetrics.reduce((fastest, current) => {
      return (current.duration || 0) < (fastest.duration || 0) ? current : fastest;
    });

    const errorRate = errorMetrics.length / completedMetrics.length;
    const uptime = (1 - errorRate) * 100;

    return {
      averageResponseTime,
      slowestRequest: {
        name: slowestRequest.name,
        duration: slowestRequest.duration || 0,
      },
      fastestRequest: {
        name: fastestRequest.name,
        duration: fastestRequest.duration || 0,
      },
      totalRequests: completedMetrics.length,
      errorRate: errorRate * 100,
      uptime,
    };
  }, [metrics]);

  const getMetricsByCategory = useCallback((category: PerformanceMetric['category']) => {
    return metrics.filter(m => m.category === category);
  }, [metrics]);

  const getRecentMetrics = useCallback((minutes: number = 5) => {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return metrics.filter(m => m.startTime >= cutoff);
  }, [metrics]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
    startTimesRef.current.clear();
  }, []);

  const exportMetrics = useCallback(() => {
    const data = {
      exportTime: new Date().toISOString(),
      stats: getMetricsStats(),
      metrics: metrics.map(m => ({
        ...m,
        startTime: new Date(m.startTime).toISOString(),
        endTime: m.endTime ? new Date(m.endTime).toISOString() : undefined,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, getMetricsStats]);

  // Auto-cleanup old metrics (keep last 1000)
  useEffect(() => {
    if (metrics.length > 1000) {
      setMetrics(prev => prev.slice(-500)); // Keep last 500
    }
  }, [metrics.length]);

  // Monitor page visibility to track user engagement
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        globalDebug.debug('performance', 'Page hidden - user engagement paused');
      } else {
        globalDebug.debug('performance', 'Page visible - user engagement resumed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    // State
    metrics,
    isEnabled,

    // Actions
    setIsEnabled,
    clearMetrics,
    exportMetrics,

    // Measurement functions
    startMetric,
    endMetric,
    measureApiCall,
    measureRender,
    measureUserInteraction,
    measureNavigation,

    // Analytics
    getMetricsStats,
    getMetricsByCategory,
    getRecentMetrics,
  };
};

// Performance monitoring for React components
export const useComponentPerformance = (componentName: string) => {
  const { startMetric, endMetric } = usePerformanceMetrics();

  useEffect(() => {
    const metricId = startMetric(`${componentName} mount`, 'render');

    return () => {
      endMetric(metricId);
    };
  }, [componentName, startMetric, endMetric]);

  const measureRender = useCallback((phase: string) => {
    const metricId = startMetric(`${componentName} render: ${phase}`, 'render');
    return () => endMetric(metricId);
  }, [componentName, startMetric, endMetric]);

  return { measureRender };
};

// Web Vitals monitoring
export const useWebVitals = () => {
  const { startMetric, endMetric } = usePerformanceMetrics();

  useEffect(() => {
    // Monitor Core Web Vitals if supported
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
          const metricId = startMetric(`Web Vital: ${metric.name}`, 'navigation', {
            value: metric.value,
            rating: metric.rating,
          });
          endMetric(metricId);
        });

        getFID((metric) => {
          const metricId = startMetric(`Web Vital: ${metric.name}`, 'user-interaction', {
            value: metric.value,
            rating: metric.rating,
          });
          endMetric(metricId);
        });

        getFCP((metric) => {
          const metricId = startMetric(`Web Vital: ${metric.name}`, 'navigation', {
            value: metric.value,
            rating: metric.rating,
          });
          endMetric(metricId);
        });

        getLCP((metric) => {
          const metricId = startMetric(`Web Vital: ${metric.name}`, 'navigation', {
            value: metric.value,
            rating: metric.rating,
          });
          endMetric(metricId);
        });

        getTTFB((metric) => {
          const metricId = startMetric(`Web Vital: ${metric.name}`, 'navigation', {
            value: metric.value,
            rating: metric.rating,
          });
          endMetric(metricId);
        });
      });
    }
  }, [startMetric, endMetric]);

  return {};
};
