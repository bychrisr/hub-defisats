import React from 'react';
import { RouteGuard } from '@/components/guards/RouteGuard';

export default function DashboardLiquidTemp() {
  return (
    <RouteGuard>
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <h1 className="text-2xl font-bold text-white">Dashboard Liquid - Temp</h1>
          <p className="text-gray-400">Starting fresh...</p>
        </div>
      </div>
    </RouteGuard>
  );
}
