import React from 'react';
import LNMarketsChart from './LNMarketsChart';

const SimpleChart: React.FC = () => {
  return (
    <LNMarketsChart 
      symbol="BTCUSD: LNM Futures"
      height={500}
      showControls={true}
    />
  );
};

export default SimpleChart;
