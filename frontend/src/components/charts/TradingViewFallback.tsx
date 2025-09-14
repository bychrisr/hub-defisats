import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface TradingViewFallbackProps {
  symbol?: string;
  height?: number;
  className?: string;
  onRetry?: () => void;
}

const TradingViewFallback: React.FC<TradingViewFallbackProps> = ({
  symbol = 'BITSTAMP:BTCUSD',
  height = 500,
  className = '',
  onRetry
}) => {
  const handleOpenTradingView = () => {
    const url = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div 
        className="flex flex-col items-center justify-center text-center"
        style={{ height: `${height}px` }}
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
            <ExternalLink className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Gráfico TradingView</h3>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar o widget da TradingView.
            <br />
            Clique no botão abaixo para abrir o gráfico em uma nova aba.
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleOpenTradingView}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir TradingView
          </Button>
          
          {onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
          )}
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>Símbolo: <span className="font-mono">{symbol}</span></p>
          <p className="mt-1">Dados em tempo real da Bitstamp</p>
        </div>
      </div>
    </Card>
  );
};

export default TradingViewFallback;
