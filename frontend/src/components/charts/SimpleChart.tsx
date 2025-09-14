import React from 'react';
import BitstampTradingView from './BitstampTradingView';

const SimpleChart: React.FC = () => {
  return (
    <BitstampTradingView 
      height={500}
      className="w-full"
    />
  );
};

export default SimpleChart;
