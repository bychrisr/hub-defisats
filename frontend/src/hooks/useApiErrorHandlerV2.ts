import { useCallback } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { globalDebug } from './useDebug';
import { useErrorDisplay } from './useErrorDisplay';
import { useTranslation } from './useTranslation';

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
  retryAction?: () => void;
  contactSupportAction?: () => void;
}

export const useApiErrorHandlerV2 = () => {
  const { displayError } = useErrorDisplay();
  const { t } = useTranslation();
  
  const handleApiError = useCallback((
    error: AxiosError | Error,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      customMessage,
      onError,
      retryAction,
      contactSupportAction
    } = options;

    let apiError: ApiError;

    if (error instanceof AxiosError) {
      // Handle Axios errors
      const { response, request, message } = error;

      if (response) {
        // Server responded with error status
        apiError = {
          message: response.data?.message || response.data?.error || t('errors.unexpected_error'),
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
          message: t('errors.connection_problem'),
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
          message: message || t('errors.unexpected_error'),
          code: 'UNKNOWN_ERROR',
        };

        if (logError) {
          globalDebug.error('api', 'Unknown error occurred', { message });
        }
      }
    } else {
      // Handle generic errors
      apiError = {
        message: error.message || t('errors.unexpected_error'),
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

    // Use the new error display system
    if (showToast) {
      displayError(error, {
        showToast: true,
        logError: false, // Already logged above
        customMessage,
        onError: onError ? () => onError(apiError) : undefined,
        retryAction,
        contactSupportAction
      });
    }

    return apiError;
  }, [displayError, t]);

  const getErrorMessage = useCallback((error: ApiError): string => {
    // Custom error message mapping with translations
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': t('errors.network_error'),
      'TIMEOUT': t('errors.timeout'),
      'CANCELLED': t('errors.cancelled'),
      'INVALID_CREDENTIALS': t('errors.invalid_credentials'),
      'INSUFFICIENT_FUNDS': t('errors.insufficient_funds'),
      'RATE_LIMIT_EXCEEDED': t('errors.rate_limit_exceeded'),
      'SERVICE_UNAVAILABLE': t('errors.service_unavailable'),
      'MAINTENANCE_MODE': t('errors.maintenance_mode'),
    };

    return errorMessages[error.code || ''] || error.message || t('errors.unexpected_error');
  }, [t]);

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

  const isRateLimitError = useCallback((error: ApiError): boolean => {
    return error.status === 429 || error.code === 'RATE_LIMIT_EXCEEDED';
  }, []);

  const isNetworkError = useCallback((error: ApiError): boolean => {
    return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT';
  }, []);

  return {
    handleApiError,
    getErrorMessage,
    isRetryableError,
    isAuthError,
    isPermissionError,
    isValidationError,
    isRateLimitError,
    isNetworkError,
  };
};

// Hook específico para interceptar erros de API globalmente
export const useGlobalApiErrorHandlerV2 = () => {
  const { handleApiError } = useApiErrorHandlerV2();

  const setupGlobalErrorHandler = useCallback(() => {
    // Interceptar erros globais do Axios
    if (typeof window !== 'undefined') {
      // Adicionar listener para erros não capturados
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason instanceof AxiosError) {
          handleApiError(event.reason, {
            showToast: true,
            logError: true
          });
        }
      });
    }
  }, [handleApiError]);

  return {
    setupGlobalErrorHandler,
    handleApiError
  };
};
