import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Percent,
  Activity
} from 'lucide-react';
import { usePositions } from '@/contexts/PositionsContext';
import { usePublicMarketData } from '@/hooks/usePublicMarketData';
import { useAuthStore } from '@/stores/auth';

interface LNMarketsData {
  index: number;
  index24hChange: number;
  tradingFees: number;
  nextFunding: string;
  rate: number;
  rateChange: number;
  lastUpdate: Date;
  source?: string; // Data source: 'lnmarkets' or 'coingecko'
}

const LNMarketsHeader: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { data } = usePositions();
  const { data: publicData, isLoading: publicLoading, error: publicError } = usePublicMarketData();
  
  const lnMarketsData = data.marketIndex;
  const lnMarketsError = data.marketIndexError;
  
  // Debug logs removed for production
  
  const [marketData, setMarketData] = useState<LNMarketsData | null>(null);

  // Memoizar dados do mercado para evitar re-renders desnecessários
  const memoizedMarketData = useMemo(() => {
    // Se não estiver autenticado, usar dados públicos
    if (!isAuthenticated && publicData) {
      const newMarketData = {
        index: publicData.index,
        index24hChange: publicData.index24hChange,
        tradingFees: publicData.tradingFees,
        nextFunding: publicData.nextFunding,
        rate: publicData.rate,
        rateChange: 0, // Dados públicos não têm rateChange
        lastUpdate: new Date(publicData.timestamp),
        source: publicData.source
      };
      return newMarketData;
    }
    
    // Se autenticado, usar dados da LN Markets
    if (isAuthenticated && lnMarketsData) {
      const newMarketData = {
        index: lnMarketsData.index,
        index24hChange: lnMarketsData.index24hChange,
        tradingFees: lnMarketsData.tradingFees,
        nextFunding: lnMarketsData.nextFunding,
        rate: lnMarketsData.rate,
        rateChange: lnMarketsData.rateChange,
        lastUpdate: new Date(lnMarketsData.timestamp),
        source: lnMarketsData.source
      };
      return newMarketData;
    }
    
    return null;
  }, [isAuthenticated, publicData, lnMarketsData]);

  // Atualizar dados quando os dados da LN Markets mudarem
  useEffect(() => {
    setMarketData(memoizedMarketData);
  }, [memoizedMarketData]);

  // Atualizar Next Funding em tempo real apenas quando há dados reais
  useEffect(() => {
    if (!marketData) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      
      // Calcular Next Funding corretamente (LN Markets funding a cada 8h: 00:00, 08:00, 16:00 UTC)
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();
      const currentSecond = now.getUTCSeconds();
      
      let nextFundingHour;
      if (currentHour < 8) {
        nextFundingHour = 8;
      } else if (currentHour < 16) {
        nextFundingHour = 16;
      } else {
        nextFundingHour = 24; // Próximo dia 00:00
      }
      
      // Calcular tempo restante corretamente
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const nextFundingTimeInMinutes = nextFundingHour * 60;
      const timeDiffInMinutes = nextFundingTimeInMinutes - currentTimeInMinutes;
      
      const hoursToNext = Math.floor(timeDiffInMinutes / 60);
      const minutesToNext = timeDiffInMinutes % 60;
      const secondsToNext = 60 - currentSecond;
      
      const nextFunding = hoursToNext === 0
        ? minutesToNext + 'm ' + secondsToNext + 's'
        : hoursToNext + 'h ' + minutesToNext + 'm ' + secondsToNext + 's';
      
      setMarketData(prev => {
        if (!prev) return null;
        // Só atualizar se o valor realmente mudou
        if (prev.nextFunding === nextFunding) return prev;
        return {
          ...prev,
          nextFunding: nextFunding,
          lastUpdate: now
        };
      });
    }, 1000); // Atualizar a cada segundo para contagem regressiva precisa

    return () => clearInterval(interval);
  }, [marketData?.index, marketData?.index24hChange, marketData?.tradingFees, marketData?.rate, marketData?.rateChange]); // Dependências específicas em vez de marketData completo

  const formatIndex = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const format24hChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return sign + value.toFixed(2) + '%';
  };

  const formatRate = (value: number) => {
    return value.toFixed(4) + '%';
  };

  const formatRateChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return sign + (value * 100).toFixed(4) + '%';
  };

  const formatTradingFees = (value: number) => {
    return value.toFixed(3) + '%';
  };

  return (
    <Card className="card-lnmarkets-header border-b-0 cursor-default hover:border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout - Two lines horizontal */}
        <div className="md:hidden">
          {/* Linha 1: Index */}
          <div className="flex items-center justify-center w-full mb-1 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-text-secondary font-mono text-xs font-semibold">Index:</span>
              {lnMarketsError ? (
                <div className="flex items-center space-x-1">
                  <span className="text-destructive font-mono text-xs font-semibold">Error</span>
                </div>
              ) : marketData ? (
                <div className="flex items-center space-x-2">
                  <span className="text-text-primary font-mono text-sm font-bold">
                    ${formatIndex(marketData.index)}
                  </span>
                  <Badge 
                    variant={marketData.index24hChange >= 0 ? "success" : "danger"}
                    className="text-xs font-mono"
                  >
                    {marketData.index24hChange >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {format24hChange(marketData.index24hChange)}
                  </Badge>
                  {marketData.source === 'coingecko' && (
                    <span className="text-xs text-text-secondary font-mono">CoinGecko</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-primary"></div>
                  <span className="text-text-secondary font-mono text-xs font-semibold">Loading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Linha 2: Outras informações */}
          <div className="flex items-center justify-between w-full text-xs">
            {/* Fees */}
            <div className="flex items-center space-x-1">
              <Percent className="text-text-secondary w-3 h-3" />
              <span className="text-text-secondary font-mono text-xs font-semibold">Fees:</span>
              <span className="text-text-primary font-mono text-xs font-bold">
                {marketData ? formatTradingFees(marketData.tradingFees) : '--'}
              </span>
            </div>

            {/* Funding */}
            <div className="flex items-center space-x-1">
              <Clock className="text-text-secondary w-3 h-3" />
              <span className="text-text-secondary font-mono text-xs font-semibold">Funding:</span>
              <span className="text-text-primary font-mono text-xs font-bold">
                {marketData ? marketData.nextFunding : '--'}
              </span>
            </div>

            {/* Rate */}
            <div className="flex items-center space-x-1">
              <Activity className="text-text-secondary w-3 h-3" />
              <span className="text-text-secondary font-mono text-xs font-semibold">Rate:</span>
              <span className="text-text-primary font-mono text-xs font-bold">
                {marketData ? formatRate(marketData.rate) : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Two columns (COMENTADO) */}
        {/* <div className="md:hidden">
          <div className={'flex items-center justify-between w-full transition-all duration-300 ' + (isScrolled ? 'text-sm' : 'text-base')}>
            <div className="flex items-center space-x-2 w-1/2">
              <div className="flex flex-col items-start space-y-1">
                <span className={'text-gray-300 font-medium transition-all duration-300 ' + (isScrolled ? 'text-xs' : 'text-sm')}>Index:</span>
                {(isAuthenticated && lnMarketsError) || (!isAuthenticated && publicError) ? (
                  <div className="flex items-center space-x-1">
                    <span className="text-red-400 text-sm">Error</span>
                  </div>
                ) : marketData ? (
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={'text-white font-bold transition-all duration-300 font-mono ' + (isScrolled ? 'text-sm' : 'text-base')}>
                        ${formatIndex(marketData.index)}
                      </span>
                      <Badge 
                        variant={marketData.index24hChange >= 0 ? "success" : "danger"}
                        className="text-xs font-mono"
                      >
                        {marketData.index24hChange >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {format24hChange(marketData.index24hChange)}
                      </Badge>
                    </div>
                    {marketData.source === 'coingecko' && (
                      <span className="text-xs text-gray-400 font-mono">CoinGecko</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-primary"></div>
                    <span className="text-text-secondary text-sm">Loading...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2 w-1/2">
              <div className="flex items-center space-x-1">
                <Percent className="text-text-secondary w-4 h-4" />
                <span className="text-text-secondary font-medium text-sm">Fees:</span>
                <span className="text-text-primary font-bold font-mono text-sm">
                  {marketData ? formatTradingFees(marketData.tradingFees) : '--'}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <Clock className="text-text-secondary w-4 h-4" />
                <span className="text-text-secondary font-medium text-sm">Funding:</span>
                <span className="text-text-primary font-bold font-mono text-sm">
                  {marketData ? marketData.nextFunding : '--'}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <Activity className="text-text-secondary w-4 h-4" />
                <span className="text-text-secondary font-medium text-sm">Rate:</span>
                <span className="text-text-primary font-bold font-mono text-sm">
                  {marketData ? formatRate(marketData.rate) : '--'}
                </span>
              </div>
            </div>
          </div>
        </div> */}

        {/* Desktop Layout - Full */}
        <div className="hidden md:flex items-center justify-between w-full text-sm">
          {/* Index - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <div className="flex items-center space-x-2">
              <span className="text-text-secondary font-mono text-xs font-semibold">Index:</span>
              {lnMarketsError ? (
                <div className="flex items-center space-x-1">
                  <span className="text-destructive font-mono text-xs font-semibold">Error</span>
                </div>
              ) : marketData ? (
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-text-primary font-mono text-sm font-bold">
                      ${formatIndex(marketData.index)}
                    </span>
                    <Badge 
                      variant={marketData.index24hChange >= 0 ? "success" : "danger"}
                      className="text-xs font-mono"
                    >
                      {marketData.index24hChange >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {format24hChange(marketData.index24hChange)}
                    </Badge>
                  </div>
                  {marketData.source === 'coingecko' && (
                    <span className="text-xs text-text-secondary font-mono">CoinGecko</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-primary"></div>
                  <span className="text-text-secondary font-mono text-xs font-semibold">Loading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Trading Fees - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Percent className="text-text-secondary w-3 h-3" />
            <span className="text-text-secondary font-mono text-xs font-semibold">Trading Fees:</span>
            <span className="text-text-primary font-mono text-xs font-bold">
              {marketData ? formatTradingFees(marketData.tradingFees) : '--'}
            </span>
          </div>

          {/* Next Funding - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Clock className="text-text-secondary w-3 h-3" />
            <span className="text-text-secondary font-mono text-xs font-semibold">Next Funding:</span>
            <span className="text-text-primary font-mono text-xs font-bold">
              {marketData ? marketData.nextFunding : '--'}
            </span>
          </div>

          {/* Rate - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Activity className="text-text-secondary w-3 h-3" />
            <span className="text-text-secondary font-mono text-xs font-semibold">Rate:</span>
            <span className="text-text-primary font-mono text-xs font-bold">
              {marketData ? formatRate(marketData.rate) : '--'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LNMarketsHeader;
