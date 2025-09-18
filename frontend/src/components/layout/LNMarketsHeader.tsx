import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Percent,
  Activity
} from 'lucide-react';
import { usePositions } from '@/contexts/PositionsContext';

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
  const { data } = usePositions();
  const lnMarketsData = data.marketIndex;
  const lnMarketsError = data.marketIndexError;
  
  // Debug logs removed for production
  
  const [marketData, setMarketData] = useState<LNMarketsData | null>(null);

  const [isScrolled, setIsScrolled] = useState(false);

  // Memoizar dados do mercado para evitar re-renders desnecessários
  const memoizedMarketData = useMemo(() => {
    if (lnMarketsData) {
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
  }, [lnMarketsData]);

  // Atualizar dados quando os dados da LN Markets mudarem
  useEffect(() => {
    setMarketData(memoizedMarketData);
  }, [memoizedMarketData]);

  // Detectar scroll para reduzir header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    return sign + value.toFixed(1) + '%';
  };

  const formatRate = (value: number) => {
    return (value * 100).toFixed(4) + '%';
  };

  const formatRateChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return sign + (value * 100).toFixed(4) + '%';
  };

  const formatTradingFees = (value: number) => {
    return value.toFixed(3) + '%';
  };

  return (
    <Card className={'bg-[#1a1a1a] border-[#2a2e39] rounded-none border-b-0 transition-all duration-300 ' + (isScrolled ? 'py-1' : 'py-2 md:py-3')}>
      <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Mobile Layout - All Information */}
        <div className="md:hidden">
          {/* First Row - Index and 24h Change */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1">
              <span className={'text-gray-400 transition-all duration-300 ' + (isScrolled ? 'text-lg' : 'text-xl')}>₿</span>
              <div className="flex flex-col">
                <span className="text-gray-300 font-medium text-xs">Index:</span>
                {lnMarketsError ? (
                  <span className="text-red-400 text-xs">Error</span>
                ) : marketData ? (
                  <div className="flex flex-col items-start space-y-1">
                    <span className="text-white font-bold text-sm">
                      ${formatIndex(marketData.index)}
                    </span>
                    {marketData.source === 'coingecko' && (
                      <span className="text-xs text-gray-400 font-mono">CoinGecko</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span className="text-gray-400 text-xs">Loading...</span>
                  </div>
                )}
              </div>
            </div>

            {marketData && !isScrolled && (
              <div className="flex items-center space-x-1">
                {marketData.index24hChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-[#00d4aa]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[#ff6b6b]" />
                )}
                <span className={'text-xs font-medium ' + (marketData.index24hChange >= 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]')}>
                  {format24hChange(marketData.index24hChange)}
                </span>
              </div>
            )}
          </div>

          {/* Second Row - Trading Fees and Next Funding */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-1 flex-1">
              <Percent className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300 font-medium text-xs">Fees:</span>
              <span className="text-white font-bold text-xs">
                {marketData ? formatTradingFees(marketData.tradingFees) : '--'}
              </span>
            </div>

            <div className="flex items-center space-x-1 flex-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300 font-medium text-xs">Next:</span>
              <span className="text-white font-bold text-xs">
                {marketData ? marketData.nextFunding : '--'}
              </span>
            </div>
          </div>

          {/* Third Row - Rate */}
          <div className="flex items-center justify-start mt-2">
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300 font-medium text-xs">Rate:</span>
              <span className="text-white font-bold text-xs">
                {marketData ? formatRate(marketData.rate) : '--'}
              </span>
              {!isScrolled && <span className="text-xs text-gray-400">Funding Rate</span>}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Full */}
        <div className={'hidden md:flex items-center justify-between w-full transition-all duration-300 ' + (isScrolled ? 'text-sm' : 'text-base')}>
          {/* Index - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <div className="flex items-center space-x-2">
              <span className={'text-gray-300 font-medium transition-all duration-300 ' + (isScrolled ? 'text-xs' : 'text-sm')}>Index:</span>
              {lnMarketsError ? (
                <div className="flex items-center space-x-1">
                  <span className="text-red-400 text-sm">Error</span>
                </div>
              ) : marketData ? (
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={'text-white font-bold transition-all duration-300 font-mono ' + (isScrolled ? 'text-base' : 'text-lg')}>
                      ${formatIndex(marketData.index)}
                    </span>
                    <Badge 
                      variant={marketData.index24hChange >= 0 ? "default" : "destructive"}
                      className={'text-xs font-mono ' + (marketData.index24hChange >= 0 ? 'bg-[#00d4aa] text-black' : 'bg-[#ff6b6b] text-white')}
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-gray-400 text-sm">Loading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Trading Fees - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Percent className={'text-gray-400 transition-all duration-300 ' + (isScrolled ? 'w-3 h-3' : 'w-4 h-4')} />
            <span className={'text-gray-300 font-medium transition-all duration-300 ' + (isScrolled ? 'text-xs' : 'text-sm')}>Trading Fees:</span>
            <span className={'text-white font-bold transition-all duration-300 font-mono ' + (isScrolled ? 'text-sm' : 'text-base')}>
              {marketData ? formatTradingFees(marketData.tradingFees) : '--'}
            </span>
          </div>

          {/* Next Funding - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Clock className={'text-gray-400 transition-all duration-300 ' + (isScrolled ? 'w-3 h-3' : 'w-4 h-4')} />
            <span className={'text-gray-300 font-medium transition-all duration-300 ' + (isScrolled ? 'text-xs' : 'text-sm')}>Next Funding:</span>
            <span className={'text-white font-bold transition-all duration-300 font-mono ' + (isScrolled ? 'text-sm' : 'text-base')}>
              {marketData ? marketData.nextFunding : '--'}
            </span>
          </div>

          {/* Rate - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Activity className={'text-gray-400 transition-all duration-300 ' + (isScrolled ? 'w-3 h-3' : 'w-4 h-4')} />
            <span className={'text-gray-300 font-medium transition-all duration-300 ' + (isScrolled ? 'text-xs' : 'text-sm')}>Rate:</span>
            <span className={'text-white font-bold transition-all duration-300 font-mono ' + (isScrolled ? 'text-sm' : 'text-base')}>
              {marketData ? formatRate(marketData.rate) : '--'}
            </span>
            {!isScrolled && (
              <span className="text-xs text-gray-400">Funding Rate</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LNMarketsHeader;
