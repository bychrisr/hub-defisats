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

interface MarketData {
  index: number;
  tradingFees: number;
  nextFunding: string;
  rate: number;
  rateChange: number;
}

const MarketHeader: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData>({
    index: 115820.50,
    tradingFees: 0.1,
    nextFunding: '2h 15m',
    rate: 0.01,
    rateChange: 0.002
  });

  // Simular atualizações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        index: prev.index + (Math.random() - 0.5) * 50,
        rate: prev.rate + (Math.random() - 0.5) * 0.001,
        rateChange: (Math.random() - 0.5) * 0.005,
        nextFunding: `${Math.floor(Math.random() * 8)}h ${Math.floor(Math.random() * 60)}m`
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

  const formatRate = (value: number) => {
    return `${(value * 100).toFixed(3)}%`;
  };

  const formatRateChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(3)}%`;
  };

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2e39] rounded-none">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Informações de Mercado */}
          <div className="flex items-center space-x-8">
            {/* Index */}
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Index:</span>
              <span className="text-white font-semibold">
                ${formatIndex(marketData.index)}
              </span>
            </div>

            {/* Trading Fees */}
            <div className="flex items-center space-x-2">
              <Percent className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Trading Fees:</span>
              <span className="text-white font-semibold">
                {marketData.tradingFees}%
              </span>
            </div>

            {/* Next Funding */}
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Next Funding:</span>
              <span className="text-white font-semibold">
                {marketData.nextFunding}
              </span>
            </div>

            {/* Rate */}
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Rate:</span>
              <span className="text-white font-semibold">
                {formatRate(marketData.rate)}
              </span>
              <Badge 
                variant={marketData.rateChange >= 0 ? "default" : "destructive"}
                className={`text-xs ${
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

          {/* Controles do Usuário */}
          <div className="flex items-center space-x-3">
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#00d4aa] rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Live</span>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500">
              {new Date().toLocaleTimeString('en-US', { 
                timeZone: 'UTC',
                hour12: false 
              })} UTC
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MarketHeader;
