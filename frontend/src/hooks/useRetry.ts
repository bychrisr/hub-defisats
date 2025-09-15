import { useState, useCallback, useRef } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryDelayMultiplier?: number;
  retryCondition?: (error: AxiosError) => boolean;
  onRetry?: (attempt: number, error: AxiosError) => void;
  onMaxRetriesReached?: (error: AxiosError) => void;
  showToast?: boolean;
}

interface RetryState {
  isRetrying: boolean;
  currentAttempt: number;
  lastError: AxiosError | null;
}

export const useRetry = (options: RetryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryDelayMultiplier = 2,
    retryCondition,
    onRetry,
    onMaxRetriesReached,
    showToast = true,
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    lastError: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const defaultRetryCondition = useCallback((error: AxiosError) => {
    // Retry on network errors, 5xx server errors, and specific 4xx errors
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429; // Server errors, timeout, rate limit
  }, []);

  const shouldRetry = useCallback((error: AxiosError) => {
    return (retryCondition || defaultRetryCondition)(error);
  }, [retryCondition, defaultRetryCondition]);

  const delay = useCallback((ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const executeWithRetry = useCallback(async <T = any>(
    requestFn: () => Promise<AxiosResponse<T>>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    let lastError: AxiosError;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryState({
          isRetrying: attempt > 0,
          currentAttempt: attempt,
          lastError: null,
        });

        if (attempt > 0) {
          if (showToast) {
            toast.info(`Tentando novamente... (${attempt}/${maxRetries})`);
          }

          if (onRetry) {
            onRetry(attempt, lastError!);
          }

          // Exponential backoff delay
          const delayMs = retryDelay * Math.pow(retryDelayMultiplier, attempt - 1);
          await delay(delayMs);
        }

        const response = await requestFn();

        // Success! Reset state
        setRetryState({
          isRetrying: false,
          currentAttempt: 0,
          lastError: null,
        });

        return response;

      } catch (error) {
        lastError = error as AxiosError;

        // Check if request was aborted
        if (axios.isCancel(error)) {
          throw error;
        }

        // If this is the last attempt or shouldn't retry
        if (attempt === maxRetries || !shouldRetry(lastError)) {
          setRetryState({
            isRetrying: false,
            currentAttempt: attempt,
            lastError,
          });

          if (attempt === maxRetries && onMaxRetriesReached) {
            onMaxRetriesReached(lastError);
          }

          if (showToast && attempt === maxRetries) {
            toast.error('Falha após várias tentativas. Tente novamente mais tarde.');
          }

          throw lastError;
        }

        // Continue to next attempt
        console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError.message);
      }
    }

    throw lastError!;
  }, [maxRetries, retryDelay, retryDelayMultiplier, shouldRetry, onRetry, onMaxRetriesReached, showToast, delay]);

  const cancelCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setRetryState({
        isRetrying: false,
        currentAttempt: 0,
        lastError: null,
      });
    }
  }, []);

  const resetRetryState = useCallback(() => {
    setRetryState({
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
    });
  }, []);

  return {
    executeWithRetry,
    cancelCurrentRequest,
    resetRetryState,
    retryState,
  };
};

// Hook específico para API calls com retry automático
export const useApiRetry = (options: RetryOptions = {}) => {
  const retry = useRetry({
    maxRetries: 3,
    retryDelay: 1000,
    showToast: true,
    ...options,
  });

  const apiCall = useCallback(async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return retry.executeWithRetry(() => axios(url, {
      ...config,
      signal: config?.signal,
    }));
  }, [retry]);

  return {
    ...retry,
    apiCall,
  };
};

// Hook para queries com retry automático
export const useQueryRetry = (options: RetryOptions = {}) => {
  const retry = useRetry({
    maxRetries: 2,
    retryDelay: 500,
    showToast: false,
    ...options,
  });

  const query = useCallback(async <T = any>(
    queryFn: () => Promise<T>
  ): Promise<T> => {
    const response = await retry.executeWithRetry(async () => ({
      data: await queryFn(),
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }));

    return response.data;
  }, [retry]);

  return {
    ...retry,
    query,
  };
};

// Hook para mutations com retry automático
export const useMutationRetry = (options: RetryOptions = {}) => {
  const retry = useRetry({
    maxRetries: 1, // Mutations geralmente não devem ser repetidas
    retryDelay: 1000,
    showToast: true,
    retryCondition: (error) => {
      // Only retry on network errors, not on validation errors
      return !error.response || error.response.status >= 500;
    },
    ...options,
  });

  const mutate = useCallback(async <T = any>(
    mutationFn: () => Promise<T>
  ): Promise<T> => {
    const response = await retry.executeWithRetry(async () => ({
      data: await mutationFn(),
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }));

    return response.data;
  }, [retry]);

  return {
    ...retry,
    mutate,
  };
};
