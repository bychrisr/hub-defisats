import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { globalDebug } from './useDebug';
import { useApiErrorHandler } from './useApiErrorHandler';

interface ErrorNotification {
  id: string;
  type: 'api' | 'network' | 'auth' | 'validation' | 'server';
  message: string;
  details?: any;
  timestamp: Date;
  retryCount: number;
  isResolved: boolean;
  resolvedAt?: Date;
}

interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  unresolvedErrors: number;
  averageRetryTime: number;
  mostCommonError: string;
}

export const useErrorNotifications = () => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const { handleApiError, isRetryableError } = useApiErrorHandler();

  const addErrorNotification = useCallback((
    type: ErrorNotification['type'],
    message: string,
    details?: any,
    showToast: boolean = true
  ) => {
    if (!isEnabled) return;

    const notification: ErrorNotification = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      details,
      timestamp: new Date(),
      retryCount: 0,
      isResolved: false,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50

    globalDebug.error('error-notification', `New error: ${message}`, {
      type,
      details,
      notificationId: notification.id,
    });

    if (showToast) {
      const toastMessage = getToastMessage(type, message);

      switch (type) {
        case 'api':
          toast.error(`Erro da API: ${toastMessage}`);
          break;
        case 'network':
          toast.error(`Problema de rede: ${toastMessage}`);
          break;
        case 'auth':
          toast.error(`Erro de autenticação: ${toastMessage}`);
          break;
        case 'validation':
          toast.warning(`Dados inválidos: ${toastMessage}`);
          break;
        case 'server':
          toast.error(`Erro do servidor: ${toastMessage}`);
          break;
        default:
          toast.error(toastMessage);
      }
    }

    return notification.id;
  }, [isEnabled]);

  const resolveError = useCallback((id: string) => {
    setNotifications(prev => prev.map(notification => {
      if (notification.id === id) {
        const resolved = {
          ...notification,
          isResolved: true,
          resolvedAt: new Date(),
        };

        globalDebug.info('error-notification', `Error resolved: ${notification.message}`, {
          errorId: id,
          resolutionTime: Date.now() - notification.timestamp.getTime(),
        });

        toast.success('Problema resolvido!');

        return resolved;
      }
      return notification;
    }));
  }, []);

  const retryError = useCallback(async (id: string, retryFn?: () => Promise<any>) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.isResolved) return;

    try {
      setNotifications(prev => prev.map(n => {
        if (n.id === id) {
          return { ...n, retryCount: n.retryCount + 1 };
        }
        return n;
      }));

      globalDebug.info('error-notification', `Retrying error: ${notification.message}`, {
        errorId: id,
        retryCount: notification.retryCount + 1,
      });

      if (retryFn) {
        await retryFn();
        resolveError(id);
      } else {
        // Simulate retry delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        resolveError(id);
      }
    } catch (error) {
      globalDebug.warn('error-notification', `Retry failed: ${notification.message}`, {
        errorId: id,
        error: (error as Error).message,
      });

      addErrorNotification(
        notification.type,
        `Falha na tentativa ${notification.retryCount + 1}: ${notification.message}`,
        { originalError: error },
        true
      );
    }
  }, [notifications, resolveError, addErrorNotification]);

  const getErrorStats = useCallback((): ErrorStats => {
    const totalErrors = notifications.length;
    const unresolvedErrors = notifications.filter(n => !n.isResolved).length;

    const errorsByType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolvedErrors = notifications.filter(n => n.isResolved && n.resolvedAt);
    const averageRetryTime = resolvedErrors.length > 0
      ? resolvedErrors.reduce((sum, error) => {
          return sum + (error.resolvedAt!.getTime() - error.timestamp.getTime());
        }, 0) / resolvedErrors.length
      : 0;

    const mostCommonError = Object.entries(errorsByType)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    return {
      totalErrors,
      errorsByType,
      unresolvedErrors,
      averageRetryTime,
      mostCommonError,
    };
  }, [notifications]);

  const getUnresolvedErrors = useCallback(() => {
    return notifications.filter(n => !n.isResolved);
  }, [notifications]);

  const getErrorsByType = useCallback((type: ErrorNotification['type']) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getRecentErrors = useCallback((minutes: number = 10) => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return notifications.filter(n => n.timestamp > cutoff);
  }, [notifications]);

  const clearResolvedErrors = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.isResolved));
  }, []);

  const clearAllErrors = useCallback(() => {
    setNotifications([]);
  }, []);

  const exportErrors = useCallback(() => {
    const data = {
      exportTime: new Date().toISOString(),
      stats: getErrorStats(),
      notifications: notifications.map(n => ({
        ...n,
        timestamp: n.timestamp.toISOString(),
        resolvedAt: n.resolvedAt?.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-notifications-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [notifications, getErrorStats]);

  // Auto-cleanup resolved errors after 1 hour
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return prev.filter(n => !n.isResolved || n.resolvedAt! > oneHourAgo);
      });
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    notifications,
    isEnabled,

    // Actions
    setIsEnabled,
    addErrorNotification,
    resolveError,
    retryError,
    clearResolvedErrors,
    clearAllErrors,
    exportErrors,

    // Analytics
    getErrorStats,
    getUnresolvedErrors,
    getErrorsByType,
    getRecentErrors,
  };
};

const getToastMessage = (type: ErrorNotification['type'], message: string): string => {
  // Truncate long messages
  if (message.length > 100) {
    return message.substring(0, 97) + '...';
  }

  return message;
};

// Hook específico para interceptar erros de API
export const useApiErrorNotifications = () => {
  const { addErrorNotification, retryError } = useErrorNotifications();
  const { handleApiError, isRetryableError } = useApiErrorHandler();

  const handleApiErrorWithNotification = useCallback(async (
    error: any,
    context?: {
      endpoint?: string;
      method?: string;
      retryFn?: () => Promise<any>;
    }
  ) => {
    const apiError = handleApiError(error);

    const errorType = getErrorType(apiError);
    const notificationId = addErrorNotification(
      errorType,
      apiError.message,
      {
        status: apiError.status,
        code: apiError.code,
        endpoint: context?.endpoint,
        method: context?.method,
        details: apiError.details,
      }
    );

    // Auto-retry if it's a retryable error
    if (isRetryableError(apiError) && context?.retryFn && notificationId) {
      setTimeout(() => {
        retryError(notificationId, context.retryFn);
      }, 2000); // Retry after 2 seconds
    }

    return { apiError, notificationId };
  }, [handleApiError, addErrorNotification, isRetryableError, retryError]);

  return {
    handleApiErrorWithNotification,
  };
};

const getErrorType = (apiError: any): ErrorNotification['type'] => {
  if (apiError.status) {
    if (apiError.status === 401 || apiError.status === 403) {
      return 'auth';
    }
    if (apiError.status === 400) {
      return 'validation';
    }
    if (apiError.status >= 500) {
      return 'server';
    }
  }

  if (apiError.code === 'NETWORK_ERROR') {
    return 'network';
  }

  return 'api';
};
