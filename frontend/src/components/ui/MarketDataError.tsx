import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './button';

interface MarketDataErrorProps {
  error: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function MarketDataError({ error, onRetry, isRetrying = false }: MarketDataErrorProps) {
  const isMarketDataError = error.includes('Market data') || error.includes('mercado');
  
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-destructive/5 border border-destructive/20 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        {isMarketDataError ? (
          <WifiOff className="h-8 w-8 text-destructive" />
        ) : (
          <AlertTriangle className="h-8 w-8 text-destructive" />
        )}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            {isMarketDataError ? 'Dados de Mercado Indisponíveis' : 'Erro ao Carregar Dados'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {isMarketDataError ? (
              <>
                Os dados de mercado estão temporariamente indisponíveis. 
                <br />
                <strong className="text-destructive">
                  Por segurança, não exibimos dados desatualizados em mercados voláteis.
                </strong>
                <br />
                Tente novamente em alguns segundos.
              </>
            ) : (
              error
            )}
          </p>
        </div>
      </div>
      
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Tentando novamente...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </>
          )}
        </Button>
      )}
      
      {isMarketDataError && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            <strong>Importante:</strong> Em mercados financeiros voláteis como Bitcoin, 
            dados desatualizados podem causar decisões de trading incorretas e perdas financeiras.
          </p>
        </div>
      )}
    </div>
  );
}
