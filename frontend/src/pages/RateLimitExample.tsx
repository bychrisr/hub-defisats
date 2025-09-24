import React, { useState } from 'react';
import { RateLimitError, useRateLimitError } from '../components/RateLimitError';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function RateLimitExample() {
  const { rateLimitData, showRateLimitError, hideRateLimitError } = useRateLimitError();
  const [isLoading, setIsLoading] = useState(false);

  const simulateRateLimit = async (type: 'api' | 'auth' | 'trading' | 'admin' | 'general') => {
    setIsLoading(true);
    
    try {
      // Simular uma requisição que resulta em rate limit
      const response = await fetch('/api/test-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (response.status === 429) {
        const data = await response.json();
        showRateLimitError({
          retryAfter: data.retry_after,
          limit: data.limit,
          remaining: data.remaining,
          resetTime: data.reset_time,
          type: data.type,
        });
      }
    } catch (error) {
      console.error('Error simulating rate limit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    hideRateLimitError();
    // Aqui você implementaria a lógica de retry
    console.log('Retrying...');
  };

  const handleContactSupport = () => {
    // Aqui você implementaria a lógica de contato com suporte
    console.log('Contacting support...');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de Rate Limit</CardTitle>
          <CardDescription>
            Teste diferentes tipos de rate limit para ver como são exibidos ao usuário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              onClick={() => simulateRateLimit('auth')}
              disabled={isLoading}
              variant="outline"
            >
              Simular Auth Rate Limit
            </Button>
            
            <Button
              onClick={() => simulateRateLimit('trading')}
              disabled={isLoading}
              variant="outline"
            >
              Simular Trading Rate Limit
            </Button>
            
            <Button
              onClick={() => simulateRateLimit('admin')}
              disabled={isLoading}
              variant="outline"
            >
              Simular Admin Rate Limit
            </Button>
            
            <Button
              onClick={() => simulateRateLimit('api')}
              disabled={isLoading}
              variant="outline"
            >
              Simular API Rate Limit
            </Button>
            
            <Button
              onClick={() => simulateRateLimit('general')}
              disabled={isLoading}
              variant="outline"
            >
              Simular General Rate Limit
            </Button>
            
            <Button
              onClick={hideRateLimitError}
              variant="secondary"
            >
              Limpar Rate Limit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exibir componente de rate limit se houver dados */}
      {rateLimitData && (
        <div className="flex justify-center">
          <RateLimitError
            retryAfter={rateLimitData.retryAfter}
            limit={rateLimitData.limit}
            remaining={rateLimitData.remaining}
            resetTime={rateLimitData.resetTime}
            type={rateLimitData.type}
            onRetry={handleRetry}
            onContactSupport={handleContactSupport}
          />
        </div>
      )}

      {/* Informações sobre Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Rate Limiting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Tipos de Rate Limit:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li><strong>Auth:</strong> 5 tentativas por 15 minutos</li>
                <li><strong>Trading:</strong> 200 requisições por minuto</li>
                <li><strong>Admin:</strong> 50 requisições por minuto</li>
                <li><strong>API:</strong> 100 requisições por minuto</li>
                <li><strong>General:</strong> 1000 requisições por minuto</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Headers Incluídos:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li><code>X-RateLimit-Limit</code>: Limite total</li>
                <li><code>X-RateLimit-Remaining</code>: Requisições restantes</li>
                <li><code>X-RateLimit-Reset</code>: Timestamp do reset</li>
                <li><code>Retry-After</code>: Segundos para retry</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
