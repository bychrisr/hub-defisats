import React from 'react';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RateLimitToastProps {
  type: 'api' | 'auth' | 'trading' | 'admin' | 'notifications' | 'payments' | 'general';
  retryAfter: number;
  limit: number;
  remaining: number;
  onRetry?: () => void;
}

export function RateLimitToast({
  type,
  retryAfter,
  limit,
  remaining,
  onRetry
}: RateLimitToastProps) {
  const getToastConfig = () => {
    switch (type) {
      case 'auth':
        return {
          title: 'Muitas Tentativas de Login',
          description: 'Por segurança, aguarde antes de tentar novamente.',
          icon: AlertTriangle,
          color: 'destructive' as const,
        };
      case 'trading':
        return {
          title: 'Limite de Trading Excedido',
          description: 'Aguarde alguns minutos antes de realizar novas operações.',
          icon: Clock,
          color: 'warning' as const,
        };
      case 'admin':
        return {
          title: 'Limite Administrativo Excedido',
          description: 'Aguarde antes de continuar com operações administrativas.',
          icon: AlertTriangle,
          color: 'destructive' as const,
        };
      case 'notifications':
        return {
          title: 'Muitas Notificações',
          description: 'Aguarde antes de enviar mais notificações.',
          icon: Clock,
          color: 'warning' as const,
        };
      case 'payments':
        return {
          title: 'Limite de Pagamentos Excedido',
          description: 'Aguarde antes de realizar novos pagamentos.',
          icon: AlertTriangle,
          color: 'destructive' as const,
        };
      default:
        return {
          title: 'Limite de Requisições Excedido',
          description: 'Aguarde alguns segundos antes de continuar.',
          icon: Clock,
          color: 'warning' as const,
        };
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}min`;
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-start space-x-3 p-3">
      <div className={`flex-shrink-0 p-1 rounded-full ${
        config.color === 'destructive' 
          ? 'bg-red-100 text-red-600' 
          : 'bg-yellow-100 text-yellow-600'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {config.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {config.description}
        </p>
        
        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Aguarde: {formatTime(retryAfter)}</span>
          <span>Limite: {limit}</span>
          <span>Restantes: {remaining}</span>
        </div>
        
        {onRetry && retryAfter <= 0 && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
}

// Função para mostrar toast de rate limit
export function showRateLimitToast(data: {
  type: 'api' | 'auth' | 'trading' | 'admin' | 'notifications' | 'payments' | 'general';
  retry_after: number;
  limit: number;
  remaining: number;
  onRetry?: () => void;
}) {
  const { type, retry_after, limit, remaining, onRetry } = data;
  
  toast.custom(
    (t) => (
      <RateLimitToast
        type={type}
        retryAfter={retry_after}
        limit={limit}
        remaining={remaining}
        onRetry={onRetry}
      />
    ),
    {
      duration: Math.min(retry_after * 1000, 10000), // Max 10 seconds
      id: `rate-limit-${type}`, // Prevent duplicate toasts
    }
  );
}
