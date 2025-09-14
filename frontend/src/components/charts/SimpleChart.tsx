import React from 'react';
import TradingViewChart from './TradingViewChart';

const SimpleChart: React.FC = () => {
  return (
    <TradingViewChart 
      symbol="BTCUSD: LNM Futures"
      height={500}
      className="w-full"
    />
  );
};

export default SimpleChart;
