import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Percent,
  DollarSign,
  Activity
} from 'lucide-react';

interface LNMarketsData {
  index: number;
  tradingFees: number;
  nextFunding: string;
  rate: number;
  rateChange: number;
  lastUpdate: Date;
}

const LNMarketsHeader: React.FC = () => {
  const [marketData, setMarketData] = useState<LNMarketsData>({
    index: 115820.50,
    tradingFees: 0.1,
    nextFunding: '2h 15m',
    rate: 0.01,
    rateChange: 0.002,
    lastUpdate: new Date()
  });

  // Simular atualizações em tempo real baseadas em dados reais
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeToNextFunding = 8 - (now.getUTCHours() % 8);
      const minutesToNextFunding = 60 - now.getUTCMinutes();
      
      setMarketData(prev => ({
        ...prev,
        index: prev.index + (Math.random() - 0.5) * 100,
        rate: prev.rate + (Math.random() - 0.5) * 0.002,
        rateChange: (Math.random() - 0.5) * 0.01,
        nextFunding: `${timeToNextFunding}h ${minutesToNextFunding}m`,
        lastUpdate: now
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatIndex = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
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
        <div className="flex items-center justify-center">
          {/* Informações de Mercado LN Markets - Centralizadas */}
          <div className="flex items-center space-x-8">
            {/* Index */}
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">Index:</span>
              <span className="text-white font-bold text-lg">
                ${formatIndex(marketData.index)}
              </span>
            </div>

            {/* Trading Fees */}
            <div className="flex items-center space-x-2">
              <Percent className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">Trading Fees:</span>
              <span className="text-white font-bold">
                {formatTradingFees(marketData.tradingFees)}
              </span>
            </div>

            {/* Next Funding */}
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">Next Funding:</span>
              <span className="text-white font-bold">
                {marketData.nextFunding}
              </span>
            </div>

            {/* Rate */}
            <div className="flex items-center space-x-2">
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
      </div>
    </Card>
  );
};

export default LNMarketsHeader;
