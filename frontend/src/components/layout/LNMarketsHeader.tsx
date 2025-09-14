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
  const [marketData, setMarketData] = useState<LNMarketsData>({
    index: 115820.50,
    index24hChange: -0.5,
    tradingFees: 0.1,
    nextFunding: '2h 15m',
    rate: 0.00002, // 0.0020% em decimal
    rateChange: 0.00001,
    lastUpdate: new Date()
  });

  // Simular atualizações em tempo real baseadas em dados reais
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Calcular Next Funding corretamente (LN Markets funding a cada 8h: 00:00, 08:00, 16:00 UTC)
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();
      
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
      
      const nextFunding = hoursToNext === 0 
        ? `${minutesToNext}m`
        : `${hoursToNext}h ${minutesToNext}m`;
      
      setMarketData(prev => ({
        ...prev,
        index: prev.index + (Math.random() - 0.5) * 50,
        index24hChange: prev.index24hChange + (Math.random() - 0.5) * 0.1,
        rate: 0.00002 + (Math.random() - 0.5) * 0.00001, // Manter próximo a 0.0020%
        rateChange: (Math.random() - 0.5) * 0.00001,
        nextFunding: nextFunding,
        lastUpdate: now
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatIndex = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const format24hChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatRate = (value: number) => {
    return `${(value * 100).toFixed(4)}%`;
  };

  const formatRateChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(4)}%`;
  };

  const formatTradingFees = (value: number) => {
    return `${value.toFixed(3)}%`;
  };

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2e39] rounded-none border-b-0">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between w-full">
          {/* Index - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <span className="text-2xl text-gray-400">₿</span>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300 font-medium">Index:</span>
                <span className="text-white font-bold text-lg">
                  ${formatIndex(marketData.index)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {marketData.index24hChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-[#00d4aa]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[#ff6b6b]" />
                )}
                <span className={`text-xs font-medium ${
                  marketData.index24hChange >= 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'
                }`}>
                  {format24hChange(marketData.index24hChange)} (24h)
                </span>
              </div>
            </div>
          </div>

          {/* Trading Fees - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Percent className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">Trading Fees:</span>
            <span className="text-white font-bold">
              {formatTradingFees(marketData.tradingFees)}
            </span>
          </div>

          {/* Next Funding - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">Next Funding:</span>
            <span className="text-white font-bold">
              {marketData.nextFunding}
            </span>
          </div>

          {/* Rate - Largura fixa */}
          <div className="flex items-center space-x-2 w-1/4">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">Rate:</span>
            <span className="text-white font-bold">
              {formatRate(marketData.rate)}
            </span>
            <Badge 
              variant={marketData.rateChange >= 0 ? "default" : "destructive"}
              className={`text-xs font-semibold ${
                marketData.rateChange >= 0 
                  ? 'bg-[#00d4aa] text-black hover:bg-[#00d4aa]' 
                  : 'bg-[#ff6b6b] text-white hover:bg-[#ff6b6b]'
              }`}
            >
              {marketData.rateChange >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {formatRateChange(marketData.rateChange)}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LNMarketsHeader;
