import React from 'react';
import { useLatestPrices, useBitcoinPrice } from '@/hooks/useLatestPrices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LatestPricesWidgetProps {
  showRefreshButton?: boolean;
  compact?: boolean;
}

export const LatestPricesWidget: React.FC<LatestPricesWidgetProps> = ({
  showRefreshButton = false,
  compact = false,
}) => {
  // Hook para preços públicos (sem autenticação)
  const { prices, loading, error, refetch, lastUpdated } = useLatestPrices({
    symbols: 'BTC,ETH',
    refreshInterval: 30000, // 30 segundos
  });

  // Hook específico para Bitcoin
  const { bitcoinPrice, bitcoinChange24h } = useBitcoinPrice();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  if (loading && !lastUpdated) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Carregando preços...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !lastUpdated) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Erro ao carregar preços</p>
            {showRefreshButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Tentar novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Preços em Tempo Real
          </CardTitle>
          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Atualizado {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            {showRefreshButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Bitcoin Price */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">₿</span>
              </div>
              <div>
                <p className="font-medium">Bitcoin</p>
                {!compact && <p className="text-sm text-gray-600">BTC</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">
                {bitcoinPrice > 0 ? formatPrice(bitcoinPrice) : 'Carregando...'}
              </p>
              {bitcoinChange24h !== 0 && (
                <div className={`flex items-center justify-end space-x-1 ${getChangeColor(bitcoinChange24h)}`}>
                  {getChangeIcon(bitcoinChange24h)}
                  <span className="text-sm font-medium">
                    {formatChange(bitcoinChange24h)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Other Cryptocurrencies */}
          {Object.entries(prices).map(([symbol, data]) => {
            if (symbol === 'bitcoin') return null; // Já mostrado acima

            const displayName = symbol === 'ethereum' ? 'Ethereum' : symbol.toUpperCase();
            const symbolCode = symbol === 'ethereum' ? 'ETH' : symbol.toUpperCase();

            return (
              <div key={symbol} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {symbolCode.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{displayName}</p>
                    {!compact && <p className="text-sm text-gray-600">{symbolCode}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {data.usd > 0 ? formatPrice(data.usd) : 'Carregando...'}
                  </p>
                  {data.usd_24h_change !== 0 && (
                    <div className={`flex items-center justify-end space-x-1 ${getChangeColor(data.usd_24h_change)}`}>
                      {getChangeIcon(data.usd_24h_change)}
                      <span className="text-sm font-medium">
                        {formatChange(data.usd_24h_change)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Status Badge */}
          <div className="flex justify-center pt-2">
            <Badge variant={loading ? "secondary" : "outline"} className="text-xs">
              {loading ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  ✅ Atualizado
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LatestPricesWidget;
