import { useState, useEffect, useCallback } from 'react';

interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

interface DebugOptions {
  enabled?: boolean;
  maxLogs?: number;
  persistLogs?: boolean;
  categories?: string[];
}

export const useDebug = (options: DebugOptions = {}) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    maxLogs = 100,
    persistLogs = false,
    categories = ['all'],
  } = options;

  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(enabled);

  // Load persisted logs on mount
  useEffect(() => {
    if (persistLogs) {
      try {
        const persisted = localStorage.getItem('debug_logs');
        if (persisted) {
          const parsedLogs = JSON.parse(persisted).map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          }));
          setLogs(parsedLogs);
        }
      } catch (error) {
        console.warn('Failed to load persisted debug logs:', error);
      }
    }
  }, [persistLogs]);

  // Persist logs when they change
  useEffect(() => {
    if (persistLogs && logs.length > 0) {
      try {
        localStorage.setItem('debug_logs', JSON.stringify(logs));
      } catch (error) {
        console.warn('Failed to persist debug logs:', error);
      }
    }
  }, [logs, persistLogs]);

  const addLog = useCallback((
    level: DebugLog['level'],
    category: string,
    message: string,
    data?: any,
    stack?: string
  ) => {
    if (!isDebugMode) return;

    // Check if category is allowed
    if (!categories.includes('all') && !categories.includes(category)) return;

    const newLog: DebugLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      stack,
    };

    setLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs].slice(0, maxLogs);
      return updatedLogs;
    });

    // Console output with styling
    const consoleMethod = level === 'error' ? 'error' :
                         level === 'warn' ? 'warn' :
                         level === 'debug' ? 'debug' : 'log';

    const prefix = `[${category.toUpperCase()}]`;
    const timestamp = new Date().toLocaleTimeString();

    console[consoleMethod](`${prefix} ${timestamp}: ${message}`, data || '');

    if (stack) {
      console.error(stack);
    }
  }, [isDebugMode, categories, maxLogs]);

  const info = useCallback((category: string, message: string, data?: any) => {
    addLog('info', category, message, data);
  }, [addLog]);

  const warn = useCallback((category: string, message: string, data?: any) => {
    addLog('warn', category, message, data);
  }, [addLog]);

  const error = useCallback((category: string, message: string, data?: any, stack?: string) => {
    addLog('error', category, message, data, stack);
  }, [addLog]);

  const debug = useCallback((category: string, message: string, data?: any) => {
    addLog('debug', category, message, data);
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    if (persistLogs) {
      localStorage.removeItem('debug_logs');
    }
  }, [persistLogs]);

  const exportLogs = useCallback(() => {
    const logData = {
      exportTime: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs]);

  const getLogsByCategory = useCallback((category: string) => {
    return logs.filter(log => log.category === category);
  }, [logs]);

  const getLogsByLevel = useCallback((level: DebugLog['level']) => {
    return logs.filter(log => log.level === level);
  }, [logs]);

  const getRecentLogs = useCallback((minutes: number = 5) => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return logs.filter(log => log.timestamp > cutoff);
  }, [logs]);

  // Performance monitoring
  const startTimer = useCallback((label: string) => {
    const startTime = performance.now();
    debug('performance', `Timer started: ${label}`, { startTime });

    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        info('performance', `Timer ended: ${label}`, {
          duration: `${duration.toFixed(2)}ms`,
          startTime,
          endTime,
        });
        return duration;
      },
    };
  }, [debug, info]);

  // API call debugging
  const debugApiCall = useCallback((
    method: string,
    url: string,
    startTime: number,
    response?: any,
    error?: any
  ) => {
    const duration = performance.now() - startTime;

    if (error) {
      error('api', `API call failed: ${method} ${url}`, {
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
        status: error.response?.status,
      });
    } else {
      info('api', `API call successful: ${method} ${url}`, {
        duration: `${duration.toFixed(2)}ms`,
        status: response?.status,
        dataSize: JSON.stringify(response?.data || {}).length,
      });
    }
  }, [error, info]);

  // React component debugging
  const debugComponent = useCallback((
    componentName: string,
    action: string,
    data?: any
  ) => {
    debug('component', `${componentName}: ${action}`, data);
  }, [debug]);

  // Error boundary helper
  const logError = useCallback((
    error: Error,
    errorInfo?: any,
    componentStack?: string
  ) => {
    error('error-boundary', 'React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack,
      errorInfo,
    });
  }, [error]);

  return {
    // State
    logs,
    isDebugMode,

    // Actions
    setIsDebugMode,
    clearLogs,
    exportLogs,

    // Logging methods
    info,
    warn,
    error,
    debug,

    // Filtering
    getLogsByCategory,
    getLogsByLevel,
    getRecentLogs,

    // Performance monitoring
    startTimer,
    debugApiCall,
    debugComponent,
    logError,
  };
};

// Global debug instance for use across the app
export const globalDebug = (() => {
  const debugInstance = {
    logs: [] as DebugLog[],
    enabled: process.env.NODE_ENV === 'development',

    info: (category: string, message: string, data?: any) => {
      if (!debugInstance.enabled) return;

      const log = {
        id: `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        level: 'info' as const,
        category,
        message,
        data,
      };

      debugInstance.logs.unshift(log);
      debugInstance.logs = debugInstance.logs.slice(0, 100); // Keep last 100

      console.log(`[INFO][${category}] ${message}`, data || '');
    },

    warn: (category: string, message: string, data?: any) => {
      if (!debugInstance.enabled) return;

      const log = {
        id: `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        level: 'warn' as const,
        category,
        message,
        data,
      };

      debugInstance.logs.unshift(log);
      debugInstance.logs = debugInstance.logs.slice(0, 100);

      console.warn(`[WARN][${category}] ${message}`, data || '');
    },

    error: (category: string, message: string, data?: any) => {
      if (!debugInstance.enabled) return;

      const log = {
        id: `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        level: 'error' as const,
        category,
        message,
        data,
      };

      debugInstance.logs.unshift(log);
      debugInstance.logs = debugInstance.logs.slice(0, 100);

      console.error(`[ERROR][${category}] ${message}`, data || '');
    },

    debug: (category: string, message: string, data?: any) => {
      if (!debugInstance.enabled) return;

      const log = {
        id: `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        level: 'debug' as const,
        category,
        message,
        data,
      };

      debugInstance.logs.unshift(log);
      debugInstance.logs = debugInstance.logs.slice(0, 100);

      console.debug(`[DEBUG][${category}] ${message}`, data || '');
    },

    getLogs: () => debugInstance.logs,

    clearLogs: () => {
      debugInstance.logs = [];
    },

    exportLogs: () => {
      const data = {
        exportTime: new Date().toISOString(),
        logs: debugInstance.logs,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `global-debug-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };

  return debugInstance;
})();
