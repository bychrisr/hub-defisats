import React from 'react';
import { AlertTriangle, Clock, RefreshCw, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface RateLimitErrorProps {
  retryAfter?: number;
  limit?: number;
  remaining?: number;
  resetTime?: number;
  onRetry?: () => void;
  onContactSupport?: () => void;
  type?: 'api' | 'auth' | 'trading' | 'admin' | 'general';
}

export function RateLimitError({
  retryAfter = 60,
  limit = 100,
  remaining = 0,
  resetTime,
  onRetry,
  onContactSupport,
  type = 'general'
}: RateLimitErrorProps) {
  const getRateLimitInfo = () => {
    switch (type) {
      case 'auth':
        return {
          title: 'Muitas Tentativas de Login',
          description: 'Você excedeu o limite de tentativas de autenticação. Por segurança, aguarde antes de tentar novamente.',
          icon: AlertTriangle,
          color: 'destructive' as const,
          suggestion: 'Aguarde 15 minutos antes de tentar fazer login novamente.'
        };
      case 'trading':
        return {
          title: 'Limite de Operações de Trading',
          description: 'Você excedeu o limite de operações de trading por minuto. Isso ajuda a proteger sua conta.',
          icon: Clock,
          color: 'warning' as const,
          suggestion: 'Aguarde alguns minutos antes de realizar novas operações.'
        };
      case 'admin':
        return {
          title: 'Limite de Operações Administrativas',
          description: 'Você excedeu o limite de operações administrativas. Aguarde antes de continuar.',
          icon: AlertTriangle,
          color: 'destructive' as const,
          suggestion: 'Aguarde alguns minutos antes de realizar novas operações administrativas.'
        };
      default:
        return {
          title: 'Limite de Requisições Excedido',
          description: 'Você excedeu o limite de requisições por minuto. Isso ajuda a manter o sistema estável.',
          icon: Clock,
          color: 'warning' as const,
          suggestion: 'Aguarde alguns minutos antes de continuar.'
        };
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} segundos`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  };

  const formatResetTime = (timestamp: number): string => {
    const now = Date.now();
    const resetDate = new Date(timestamp);
    const diff = Math.ceil((timestamp - now) / 1000);
    
    if (diff <= 0) {
      return 'Agora';
    }
    
    return formatTime(diff);
  };

  const rateLimitInfo = getRateLimitInfo();
  const Icon = rateLimitInfo.icon;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <Icon className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <CardTitle className="text-lg font-semibold text-red-900 dark:text-red-100">
          {rateLimitInfo.title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
          {rateLimitInfo.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações do Rate Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Limite por minuto:</span>
            <Badge variant="outline">{limit}</Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Requisições restantes:</span>
            <Badge variant={remaining > 0 ? "secondary" : "destructive"}>
              {remaining}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Aguarde:</span>
            <Badge variant="warning">
              {formatTime(retryAfter)}
            </Badge>
          </div>
          
          {resetTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Reset em:</span>
              <Badge variant="outline">
                {formatResetTime(resetTime)}
              </Badge>
            </div>
          )}
        </div>

        {/* Sugestão */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {rateLimitInfo.suggestion}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col space-y-2">
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="w-full"
              disabled={retryAfter > 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryAfter > 0 ? `Tentar novamente em ${formatTime(retryAfter)}` : 'Tentar Novamente'}
            </Button>
          )}
          
          {onContactSupport && (
            <Button 
              onClick={onContactSupport}
              variant="ghost"
              className="w-full text-sm"
            >
              Precisa de ajuda? Entre em contato
            </Button>
          )}
        </div>

        {/* Informações técnicas (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-500 dark:text-gray-400">
            <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              Informações técnicas
            </summary>
            <div className="mt-2 space-y-1 font-mono">
              <div>Type: {type}</div>
              <div>Retry After: {retryAfter}s</div>
              <div>Limit: {limit}</div>
              <div>Remaining: {remaining}</div>
              {resetTime && <div>Reset Time: {new Date(resetTime).toISOString()}</div>}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// Hook para usar o componente de rate limit
export const useRateLimitError = () => {
  const [rateLimitData, setRateLimitData] = React.useState<{
    retryAfter?: number;
    limit?: number;
    remaining?: number;
    resetTime?: number;
    type?: 'api' | 'auth' | 'trading' | 'admin' | 'general';
  } | null>(null);

  const showRateLimitError = React.useCallback((data: typeof rateLimitData) => {
    setRateLimitData(data);
  }, []);

  const hideRateLimitError = React.useCallback(() => {
    setRateLimitData(null);
  }, []);

  return {
    rateLimitData,
    showRateLimitError,
    hideRateLimitError,
  };
};
