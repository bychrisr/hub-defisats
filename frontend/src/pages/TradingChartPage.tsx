// src/pages/TradingChartPage.tsx
import React from 'react';
import TradingChartDemo from '@/components/charts/TradingChartDemo';

export default function TradingChartPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <TradingChartDemo />
      </div>
    </div>
  );
}
