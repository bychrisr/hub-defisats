import React from 'react';
import LNMarketsStyleChart from './LNMarketsStyleChart';

const SimpleChart: React.FC = () => {
  return (
    <LNMarketsStyleChart 
      height={600}
      className="w-full"
    />
  );
};

export default SimpleChart;
