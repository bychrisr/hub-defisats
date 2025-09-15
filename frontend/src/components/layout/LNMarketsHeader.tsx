import React, { useState, useEffect } from 'react';
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
}

const LNMarketsHeader: React.FC = () => {
  const { data } = usePositions();
  const lnMarketsData = data.marketIndex;
  const lnMarketsError = data.marketIndexError;
  
  console.log('🔍 LN MARKETS HEADER - Data received:', { lnMarketsData, lnMarketsError, fullData: data });
  console.log('🔍 LN MARKETS HEADER - Market index details:', lnMarketsData);
  console.log('🔍 LN MARKETS HEADER - Market index error:', lnMarketsError);
  
  const [marketData, setMarketData] = useState<LNMarketsData | null>(null);

  const [isScrolled, setIsScrolled] = useState(false);

  // Atualizar dados quando os dados da LN Markets mudarem
  useEffect(() => {
    if (lnMarketsData) {
      setMarketData({
        index: lnMarketsData.index,
        index24hChange: lnMarketsData.index24hChange,
        tradingFees: lnMarketsData.tradingFees,
        nextFunding: lnMarketsData.nextFunding,
        rate: lnMarketsData.rate,
        rateChange: lnMarketsData.rateChange,
        lastUpdate: new Date(lnMarketsData.timestamp)
      });
    }
  }, [lnMarketsData]);

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
      
      const hoursToNext = nextFundingHour - currentHour;
      const minutesToNext = 60 - currentMinute;
      const secondsToNext = 60 - currentSecond;
      
      const nextFunding = hoursToNext === 0
        ? minutesToNext + 'm ' + secondsToNext + 's'
        : hoursToNext + 'h ' + minutesToNext + 'm ' + secondsToNext + 's';
      
      setMarketData(prev => prev ? ({
        ...prev,
        nextFunding: nextFunding,
        lastUpdate: now
      }) : null);
    }, 1000); // Atualizar a cada segundo para contagem regressiva precisa

    return () => clearInterval(interval);
  }, [marketData]);

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
        {/* Mobile Layout - Simplified */}
        <div className="md:hidden flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={'text-gray-400 transition-all duration-300 ' + (isScrolled ? 'text-lg' : 'text-xl')}>₿</span>
            <div className="flex flex-col">
              <span className="text-gray-300 font-medium text-xs">Index:</span>
              {lnMarketsError ? (
                <span className="text-red-400 text-xs">Error</span>
              ) : marketData ? (
                <span className="text-white font-bold text-sm">
                  ${formatIndex(marketData.index)}
                </span>
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

        {/* Desktop Layout - Full */}
        <div className={'hidden md:flex items-center justify-between w-full transition-all duration-300 ' + (isScrolled ? 'text-sm' : 'text-base')}>
          {/* Index - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <span className={'text-gray-400 transition-all duration-300 ' + (isScrolled ? 'text-lg' : 'text-2xl')}>₿</span>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className={'text-gray-300 font-medium transition-all duration-300 ' + (isScrolled ? 'text-xs' : 'text-sm')}>Index:</span>
                {lnMarketsError ? (
                  <div className="flex items-center space-x-1">
                    <span className="text-red-400 text-sm">Error</span>
                  </div>
                ) : marketData ? (
                  <span className={'text-white font-bold transition-all duration-300 ' + (isScrolled ? 'text-base' : 'text-lg')}>
                    ${formatIndex(marketData.index)}
                  </span>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                )}
              </div>
              {!isScrolled && marketData && (
                <div className="flex items-center space-x-1">
                  {marketData.index24hChange >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-[#00d4aa]" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-[#ff6b6b]" />
                  )}
                  <span className={'text-xs font-medium ' + (marketData.index24hChange >= 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]')}>
                    {format24hChange(marketData.index24hChange)} (24h)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trading Fees - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Percent className={'text-gray-400 transition-all duration-300 ' + (isScrolled ? 'w-3 h-3' : 'w-4 h-4')} />
            <span className={'text-gray-300 font-medium transition-all duration-300 ' + (isScrolled ? 'text-xs' : 'text-sm')}>Trading Fees:</span>
            <span className={'text-white font-bold transition-all duration-300 ' + (isScrolled ? 'text-sm' : 'text-base')}>
              {marketData ? formatTradingFees(marketData.tradingFees) : '--'}
            </span>
          </div>

          {/* Next Funding - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Clock className={'text-gray-400 transition-all duration-300 ' + (isScrolled ? 'w-3 h-3' : 'w-4 h-4')} />
            <span className={'text-gray-300 font-medium transition-all duration-300 ' + (isScrolled ? 'text-xs' : 'text-sm')}>Next Funding:</span>
            <span className={'text-white font-bold transition-all duration-300 ' + (isScrolled ? 'text-sm' : 'text-base')}>
              {marketData ? marketData.nextFunding : '--'}
            </span>
          </div>

          {/* Rate - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Activity className={'text-gray-400 transition-all duration-300 ' + (isScrolled ? 'w-3 h-3' : 'w-4 h-4')} />
            <span className={'text-gray-300 font-medium transition-all duration-300 ' + (isScrolled ? 'text-xs' : 'text-sm')}>Rate:</span>
            <span className={'text-white font-bold transition-all duration-300 ' + (isScrolled ? 'text-sm' : 'text-base')}>
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
