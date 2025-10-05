// src/pages/TradingChartTestPage.tsx
import React from 'react';
import TradingChartTest from '@/components/charts/TradingChartTest';

export default function TradingChartTestPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <TradingChartTest />
      </div>
    </div>
  );
}
