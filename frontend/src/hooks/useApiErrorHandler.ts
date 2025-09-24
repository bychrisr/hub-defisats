import { useCallback } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { globalDebug } from './useDebug';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  customMessage?: string;
  onError?: (error: ApiError) => void;
}

export const useApiErrorHandler = () => {
  const handleApiError = useCallback((
    error: AxiosError | Error,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      customMessage,
      onError,
    } = options;

    let apiError: ApiError;

    if (error instanceof AxiosError) {
      // Handle Axios errors
      const { response, request, message } = error;

      if (response) {
        // Server responded with error status
        apiError = {
          message: response.data?.message || response.data?.error || `Erro ${response.status}`,
          code: response.data?.code,
          status: response.status,
          details: response.data,
        };

        if (logError) {
          globalDebug.error('api', `HTTP ${response.status}: ${apiError.message}`, {
            url: response.config?.url,
            method: response.config?.method,
            status: response.status,
            data: response.data,
            headers: response.headers,
          });
        }
      } else if (request) {
        // Request was made but no response received
        apiError = {
          message: 'Erro de conexão. Verifique sua internet.',
          code: 'NETWORK_ERROR',
          details: { request },
        };

        if (logError) {
          globalDebug.error('api', 'Network error - no response received', {
            url: request.responseURL || error.config?.url,
            method: error.config?.method,
          });
        }
      } else {
        // Something else happened
        apiError = {
          message: message || 'Erro desconhecido',
          code: 'UNKNOWN_ERROR',
        };

        if (logError) {
          globalDebug.error('api', 'Unknown error occurred', { message });
        }
      }
    } else {
      // Handle generic errors
      apiError = {
        message: error.message || 'Erro desconhecido',
        code: 'GENERIC_ERROR',
      };

      if (logError) {
        globalDebug.error('app', 'Generic error occurred', { message: error.message });
      }
    }

    // Call custom error handler if provided
    if (onError) {
      onError(apiError);
    }

    // Show toast notification
    if (showToast) {
      const toastMessage = customMessage || getErrorMessage(apiError);

      switch (apiError.status) {
        case 400:
          toast.error(`Dados inválidos: ${toastMessage}`);
          break;
        case 401:
          toast.error('Sessão expirada. Faça login novamente.');
          // Could redirect to login here
          break;
        case 403:
          toast.error('Acesso negado. Você não tem permissão para esta ação.');
          break;
        case 404:
          toast.error('Recurso não encontrado.');
          break;
        case 429:
          const rateLimitData = apiError.details;
          if (rateLimitData) {
            // Import and use the custom rate limit toast
            import('../components/RateLimitToast').then(({ showRateLimitToast }) => {
              showRateLimitToast({
                type: rateLimitData.type || 'general',
                retry_after: rateLimitData.retry_after || 60,
                limit: rateLimitData.limit || 100,
                remaining: rateLimitData.remaining || 0,
              });
            });
          } else {
            toast.warning('Muitas tentativas. Aguarde alguns segundos.');
          }
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          toast.error('Servidor temporariamente indisponível. Tente novamente.');
          break;
        default:
          if (apiError.code === 'NETWORK_ERROR') {
            toast.error('Problema de conexão. Verifique sua internet.');
          } else {
            toast.error(toastMessage);
          }
      }
    }

    return apiError;
  }, []);

  const getErrorMessage = useCallback((error: ApiError): string => {
    // Custom error message mapping
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': 'Erro de conexão',
      'TIMEOUT': 'Tempo limite excedido',
      'CANCELLED': 'Operação cancelada',
      'INVALID_CREDENTIALS': 'Credenciais inválidas',
      'INSUFFICIENT_FUNDS': 'Saldo insuficiente',
      'RATE_LIMIT_EXCEEDED': 'Limite de taxa excedido',
      'SERVICE_UNAVAILABLE': 'Serviço temporariamente indisponível',
      'MAINTENANCE_MODE': 'Sistema em manutenção',
    };

    return errorMessages[error.code || ''] || error.message || 'Erro desconhecido';
  }, []);

  const isRetryableError = useCallback((error: ApiError): boolean => {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'];

    return (
      (error.status && retryableStatuses.includes(error.status)) ||
      (error.code && retryableCodes.includes(error.code))
    );
  }, []);

  const isAuthError = useCallback((error: ApiError): boolean => {
    return error.status === 401 || error.code === 'INVALID_CREDENTIALS';
  }, []);

  const isPermissionError = useCallback((error: ApiError): boolean => {
    return error.status === 403;
  }, []);

  const isValidationError = useCallback((error: ApiError): boolean => {
    return error.status === 400;
  }, []);

  return {
    handleApiError,
    getErrorMessage,
    isRetryableError,
    isAuthError,
    isPermissionError,
    isValidationError,
  };
};

// Hook específico para interceptar erros de API globalmente
export const useGlobalApiErrorHandler = () => {
  const { handleApiError } = useApiErrorHandler();

  const setupGlobalErrorHandler = useCallback(() => {
    // Intercept Axios responses globally
    const interceptor = (response: any) => {
      // Log successful requests in debug mode
      if (process.env.NODE_ENV === 'development') {
        globalDebug.info('api', `Request successful: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          duration: response.duration || 'unknown',
        });
      }
      return response;
    };

    const errorInterceptor = (error: AxiosError) => {
      handleApiError(error, {
        logError: true,
        showToast: true,
      });

      // Re-throw the error so calling code can handle it
      throw error;
    };

    // This would be set up in the main App component or axios instance
    return {
      requestInterceptor: interceptor,
      responseInterceptor: interceptor,
      errorInterceptor,
    };
  }, [handleApiError]);

  return {
    setupGlobalErrorHandler,
    handleApiError,
  };
};
