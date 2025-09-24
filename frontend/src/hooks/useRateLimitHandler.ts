import { useCallback, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

interface RateLimitData {
  retry_after: number;
  limit: number;
  remaining: number;
  reset_time?: number;
  type: 'api' | 'auth' | 'trading' | 'admin' | 'notifications' | 'payments' | 'general';
  message: string;
}

interface RateLimitError extends AxiosError {
  response?: {
    data: RateLimitData;
    status: 429;
  };
}

export const useRateLimitHandler = () => {
  const [rateLimitData, setRateLimitData] = useState<RateLimitData | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const handleRateLimitError = useCallback((error: RateLimitError) => {
    if (error.response?.status === 429 && error.response?.data) {
      const data = error.response.data;
      setRateLimitData(data);
      setIsRateLimited(true);

      // Show appropriate toast message
      const toastMessage = getRateLimitMessage(data);
      toast.warning(toastMessage, {
        duration: Math.min(data.retry_after * 1000, 10000),
        action: {
          label: 'Entender',
          onClick: () => {
            // Could open a modal or show more details
            console.log('Rate limit details:', data);
          }
        }
      });

      return true; // Indicates rate limit was handled
    }
    return false; // Not a rate limit error
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitData(null);
    setIsRateLimited(false);
  }, []);

  const getRetryTime = useCallback(() => {
    if (!rateLimitData) return 0;
    return rateLimitData.retry_after;
  }, [rateLimitData]);

  const getResetTime = useCallback(() => {
    if (!rateLimitData?.reset_time) return null;
    return new Date(rateLimitData.reset_time);
  }, [rateLimitData]);

  const formatTimeRemaining = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} segundos`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }, []);

  const canRetry = useCallback(() => {
    return !isRateLimited || (rateLimitData?.retry_after || 0) <= 0;
  }, [isRateLimited, rateLimitData]);

  return {
    rateLimitData,
    isRateLimited,
    handleRateLimitError,
    clearRateLimit,
    getRetryTime,
    getResetTime,
    formatTimeRemaining,
    canRetry,
  };
};

function getRateLimitMessage(data: RateLimitData): string {
  switch (data.type) {
    case 'auth':
      return `Muitas tentativas de login. Aguarde ${formatTime(data.retry_after)} antes de tentar novamente.`;
    case 'trading':
      return `Limite de operações de trading excedido. Aguarde ${formatTime(data.retry_after)}.`;
    case 'admin':
      return `Limite de operações administrativas excedido. Aguarde ${formatTime(data.retry_after)}.`;
    case 'notifications':
      return `Muitas notificações enviadas. Aguarde ${formatTime(data.retry_after)}.`;
    case 'payments':
      return `Limite de operações de pagamento excedido. Aguarde ${formatTime(data.retry_after)}.`;
    default:
      return `Muitas requisições. Aguarde ${formatTime(data.retry_after)} antes de continuar.`;
  }
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} segundos`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
}

// Hook para interceptar erros de rate limit globalmente
export const useGlobalRateLimitHandler = () => {
  const { handleRateLimitError } = useRateLimitHandler();

  const interceptRateLimit = useCallback((error: any) => {
    if (error?.response?.status === 429) {
      return handleRateLimitError(error as RateLimitError);
    }
    return false;
  }, [handleRateLimitError]);

  return { interceptRateLimit };
};
